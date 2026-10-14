"""Røgtest af Island-forløbet i Firefox og WebKit (Safari-motoren).

Kræver Python Playwright med dens egne browsere (`playwright install firefox webkit`)
og en lokal HTTP-server. Hele prøven ligger i afproev.py (Chromium); her prøves kun,
at forløbet globus → tværsnit → globus og de vigtigste kontroller virker i de andre motorer.

Playwrights WebKit-build på macOS har ikke 3D-komposition: selv en minimal CSS-kube
tegnes fladt. Layout og betjening prøves derfor også i WebKit, men tegningen af
3D-blokken kun i Firefox (og Chromium); den er efterset i rigtig Safari 14.10.2026.
"""
import base64
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from island import blokmaal, inden_for

ADRESSE = os.environ.get('ATLAS_URL', 'http://localhost:8777')
UD = Path(os.environ.get('ATLAS_TEST_UD', '/tmp/smbi-atlas-test'))
UD.mkdir(parents=True, exist_ok=True)
MOTORER = sys.argv[1:] or ['firefox', 'webkit']
SKAERME = [(1366, 625), (390, 750)]


def roeg(browser, motor, bredde, hoejde):
    # Firefox understøtter ikke is_mobile; touch slås til begge steder på telefonen.
    mobil = bredde < 500
    side = browser.new_page(viewport={'width': bredde, 'height': hoejde}, has_touch=mobil,
                            is_mobile=mobil and motor != 'firefox', reduced_motion='reduce')
    fejl = []
    side.on('pageerror', lambda e: fejl.append(str(e)))
    side.on('console', lambda e: fejl.append(e.text) if e.type == 'error' else None)
    tryk = (lambda l: l.tap()) if mobil else (lambda l: l.click())

    side.goto(ADRESSE + '/atlas/')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    tryk(side.locator('[data-sted="island"]'))
    kort = side.locator('#dialogindhold .fordybelse')
    expect(kort).to_contain_text('Skematisk tværsnit')
    tryk(kort.get_by_role('link'))
    side.wait_for_url('**/atlas/island/#island')
    expect(side.locator('#tvaersnit [data-lag="smelt"]')).to_have_count(1)
    expect(side.get_by_role('button', name='Island', exact=True)).to_have_attribute('aria-pressed', 'true')
    assert side.evaluate('document.documentElement.scrollWidth - innerWidth') <= 0, 'vandret rulning'

    # Skift tilstand og tilbage.
    tryk(side.get_by_role('button', name='Den Midtatlantiske Ryg', exact=True))
    expect(side.locator('#tvaersnit [data-lag="hotspot"]')).to_have_count(0)
    tryk(side.get_by_role('button', name='Island', exact=True))
    expect(side.locator('#tvaersnit [data-lag="hotspot"]').first).to_be_attached()

    # 3D: CSS 3D findes i begge motorer; blokken skal passe i figuren.
    knap = side.get_by_role('button', name='3D', exact=True)
    expect(knap).to_be_enabled()
    tryk(knap)
    expect(side.locator('.overside')).to_be_visible()
    assert inden_for(blokmaal(side)), (motor, bredde, blokmaal(side))
    side.screenshot(path=str(UD / f'{motor}-island-{bredde}x{hoejde}-3d.png'))
    if motor != 'webkit':
        # Figurens øverste venstre hjørne ligger uden for blokken og skal være tomt.
        # (Firefox tegnede tidligere forsiden forstørret hen over hele figuren.)
        f = side.locator('.figur').bounding_box()
        hjoerne = {'x': f['x'] + 4, 'y': f['y'] + 4, 'width': 24, 'height': 16}
        assert side.evaluate(f"""() => !['#tvaersnit', '.overside', '.oest', '.vest'].some(q => {{
          const b = document.querySelector(q).getBoundingClientRect();
          return b.left < {hjoerne['x'] + 24} && b.top < {hjoerne['y'] + 16}; }})"""), 'hjørnet er ikke uden for blokken'
        # Hele vinduet fotograferes; et beskåret billede males anderledes i Firefox.
        billede = base64.b64encode(side.screenshot(scale='css')).decode()
        moerkeste = side.evaluate("""async ([data, h]) => {
          const img = new Image(); img.src = 'data:image/png;base64,' + data; await img.decode();
          const c = document.createElement('canvas'); c.width = h.width; c.height = h.height;
          const ctx = c.getContext('2d'); ctx.drawImage(img, -h.x, -h.y);
          return Math.min(...ctx.getImageData(0, 0, c.width, c.height).data.filter((_, i) => i % 4 < 3));
        }""", [billede, hjoerne])
        assert moerkeste > 235, (motor, bredde, 'blokken tegnes uden for sine flader', moerkeste)
    foer = blokmaal(side)['transform']
    scene = side.locator('.scene')
    for t in ['ArrowLeft'] * 10 + ['ArrowUp'] * 8:
        scene.press(t)
    assert blokmaal(side)['transform'] != foer, 'piletaster drejer ikke'
    assert inden_for(blokmaal(side)), (motor, bredde, 'yderstilling', blokmaal(side))
    tryk(side.get_by_role('button', name='Drej mod højre', exact=True))

    # Trin og lag.
    tryk(side.get_by_role('button', name='Næste trin', exact=True))
    expect(side.locator('#trintekst')).not_to_be_empty()
    tryk(side.get_by_role('button', name='Lag', exact=True))
    expect(side.locator('.lagpanel')).to_be_visible()
    side.keyboard.press('Escape')
    expect(side.locator('.lagpanel')).to_be_hidden()

    # Retur til globussen.
    tryk(side.get_by_role('link', name='← Island på globussen'))
    side.wait_for_url('**/atlas/#island')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    expect(side.locator('[data-sted="island"]')).to_be_visible()
    side.close()
    assert not fejl, (motor, bredde, fejl)


with sync_playwright() as p:
    for motor in MOTORER:
        browser = getattr(p, motor).launch()
        for bredde, hoejde in SKAERME:
            roeg(browser, motor, bredde, hoejde)
            print(f'{motor} {bredde}×{hoejde}: Island-forløbet OK')
        browser.close()
