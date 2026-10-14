"""Browsertest uden build. Kræver Python Playwright og en lokal HTTP-server."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from piletaster import afproev_piletaster
from information import afproev_stedinformation, afproev_kortinformation

ADRESSE = os.environ.get('ATLAS_URL', 'http://localhost:8777')
UD = Path(os.environ.get('ATLAS_TEST_UD', '/tmp/smbi-atlas-test'))
UD.mkdir(parents=True, exist_ok=True)
SKAERME = [(1280, 577), (1366, 625), (1536, 730), (390, 750), (640, 625)]


def klar(side):
    side.goto(ADRESSE + '/atlas/')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    side.evaluate('document.fonts.ready')
    side.wait_for_timeout(100)


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/usr/bin/chromium'), headless=True,
                                args=['--no-sandbox', '--disable-webgl'])
    fejl = []
    for bredde, hoejde in SKAERME:
        side = browser.new_page(viewport={'width': bredde, 'height': hoejde},
                                has_touch=bredde == 390, is_mobile=bredde == 390, reduced_motion='reduce')
        side.on('pageerror', lambda e: fejl.append(str(e)))
        side.on('console', lambda e: fejl.append(e.text) if e.type == 'error' else None)
        klar(side)
        maal = side.evaluate('''() => {
          const a = document.querySelector('.atlas').getBoundingClientRect();
          const c = document.querySelector('#globus').getBoundingClientRect();
          const k = [...document.querySelectorAll('.vaerktoejer button, .betjeningslinje button')].map(x => x.getBoundingClientRect().bottom);
          return {bund:a.bottom,figur:[c.width,c.height],kontrolbund:Math.max(...k),vandret:document.documentElement.scrollWidth-innerWidth};
        }''')
        assert maal['vandret'] == 0, maal
        if bredde >= 900:
            assert maal['kontrolbund'] <= hoejde and maal['bund'] <= hoejde, maal
            assert maal['figur'][1] >= 350, maal
        side.screenshot(path=str(UD / f'{bredde}x{hoejde}.png'))
        # Klik alle geografiske markører direkte, også på touch-skærmen.
        for sted, navn in [('island', 'Island'), ('nordatlanten', 'Grønland / Nordatlanten'), ('alperne', 'Alperne')]:
            side.locator(f'[data-sted="{sted}"]').click()
            expect(side.locator('#udforsker')).to_be_visible()
            expect(side.locator('#dialogtitel')).to_have_text(navn)
            assert side.locator('.modelkort a').count() >= 1
            afproev_stedinformation(side, sted, navn, UD)
            side.keyboard.press('Escape')
        afproev_kortinformation(side)
        side.get_by_role('button', name='Processer', exact=True).first.click()
        side.get_by_role('button', name='Global atmosfære', exact=True).click()
        assert side.locator('.modelkort').count() == 2
        assert 'hele Jorden' in side.locator('#dialogindhold').inner_text()
        side.keyboard.press('Escape')
        side.get_by_role('button', name='Søg', exact=True).click()
        felt = side.get_by_role('searchbox')
        for ord, antal in [('Island', 2), ('groenland', 1), ('føhn', 1), ('CO2', 2), ('umuligtsoegeord', 0), ('', 6)]:
            felt.fill(ord)
            assert side.locator('.modelkort').count() == antal, (ord, antal)
        side.keyboard.press('Escape')
        expect(side.get_by_role('button', name='Søg', exact=True)).to_be_focused()
        # Alle seks links peger på eksisterende simulationer med korrekt store/små bogstaver.
        side.get_by_role('button', name='Processer', exact=True).first.click()
        for link in side.locator('.modelkort a').all():
            svar = side.request.get(ADRESSE + link.get_attribute('href'))
            assert svar.status == 200
        side.keyboard.press('Escape')
        canvas = side.locator('#globus')
        afproev_piletaster(side)
        foer = canvas.screenshot()
        canvas.focus()
        side.keyboard.press('ArrowRight')
        side.wait_for_timeout(100)
        assert canvas.screenshot() != foer, 'Piletast ændrer ikke globussen'
        side.keyboard.press('+')
        expect(side.locator('#zoomniveau')).to_have_text('1,2×')
        side.keyboard.press('Home')
        expect(side.locator('#zoomniveau')).to_have_text('1,0×')
        boks = canvas.bounding_box()
        side.mouse.move(boks['x'] + boks['width'] / 2, boks['y'] + boks['height'] * .7)
        side.mouse.down()
        side.mouse.move(boks['x'] + boks['width'] / 2 + 110, boks['y'] + boks['height'] * .7 + 30, steps=8)
        side.mouse.up()
        side.wait_for_timeout(100)
        assert canvas.screenshot() != foer, 'Træk ændrer ikke globussen'
        side.get_by_role('button', name='Nulstil', exact=True).click()
        # Zoomgrænser og nulstilling.
        for _ in range(8):
            if side.locator('#zoom-ind').is_enabled():
                side.locator('#zoom-ind').click()
                side.wait_for_timeout(60)
        expect(side.locator('#zoom-ind')).to_be_disabled()
        side.get_by_role('button', name='Nulstil', exact=True).click()
        side.get_by_role('button', name='Fokus', exact=True).click()
        side.wait_for_timeout(100)
        assert side.locator('.site-header').is_hidden()
        side.screenshot(path=str(UD / f'{bredde}x{hoejde}-fokus.png'))
        side.keyboard.press('Escape')
        expect(side.locator('.site-header')).to_be_visible()
        print(json.dumps({'skaerm': [bredde, hoejde], 'maal': maal, 'resultat': 'OK'}, ensure_ascii=False))
        side.close()

    # Touch-rotation og ægte tofingerzoom gennem Chromiums inputprotokol.
    side = browser.new_page(viewport={'width':390, 'height':750}, has_touch=True, is_mobile=True)
    side.on('pageerror', lambda e: fejl.append(str(e)))
    klar(side)
    session = side.context.new_cdp_session(side)
    canvas = side.locator('#globus')
    foer = canvas.screenshot()
    session.send('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':[{'x':150,'y':460,'id':1}]})
    session.send('Input.dispatchTouchEvent', {'type':'touchMove','touchPoints':[{'x':230,'y':490,'id':1}]})
    session.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
    side.wait_for_timeout(100)
    assert canvas.screenshot() != foer
    side.get_by_role('button', name='Nulstil', exact=True).click()
    session.send('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':[{'x':130,'y':460,'id':1},{'x':240,'y':460,'id':2}]})
    session.send('Input.dispatchTouchEvent', {'type':'touchMove','touchPoints':[{'x':90,'y':460,'id':1},{'x':280,'y':460,'id':2}]})
    session.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
    side.wait_for_timeout(100)
    assert side.locator('#zoomniveau').inner_text() != '1,0×'
    print('Touch-rotation og tofingerzoom: OK')
    side.close()

    for fejltype in ['kortdata', 'bibliotek', 'canvas']:
        side = browser.new_page()
        side.on('pageerror', lambda e: fejl.append(str(e)))
        if fejltype == 'kortdata': side.route('**/countries-110m.json', lambda r: r.abort())
        if fejltype == 'bibliotek': side.route('**/vendor/d3-geo.min.js', lambda r: r.abort())
        if fejltype == 'canvas': side.add_init_script('HTMLCanvasElement.prototype.getContext = () => null')
        side.goto(ADRESSE + '/atlas/')
        expect(side.locator('#kortstatus')).to_contain_text('Alle simulationer er stadig tilgængelige')
        side.get_by_role('button', name='Søg', exact=True).click()
        side.get_by_role('searchbox').fill('drivhus')
        assert side.locator('.modelkort').count() == 2
        side.screenshot(path=str(UD / f'fallback-{fejltype}.png'))
        print('Fallback', fejltype, ': OK')
        side.close()
    assert not fejl, fejl
    browser.close()
    print('Ingen JavaScript-fejl. Skærmbilleder:', UD)
