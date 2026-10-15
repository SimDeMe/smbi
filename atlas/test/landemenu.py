"""Landemenu: tryk på et land → Demografi og Klima. Data, skærme, tastatur og fejl."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

SKAERME = [(1280, 577), (1366, 625), (1536, 730), (390, 750), (640, 625)]
DATA = Path(__file__).resolve().parent.parent / 'data'


def klar(side, adresse):
    side.goto(adresse + '/atlas/')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    side.evaluate('document.fonts.ready')
    side.wait_for_timeout(100)


def globuspunkt(side, koordinater, centrum=(-22, 42), zoom=1):
    return side.evaluate('''({punkt, centrum, zoom}) => {
      const c = document.querySelector('#globus').getBoundingClientRect();
      const p = d3.geoOrthographic().translate([c.width/2,c.height/2])
        .scale(Math.min(c.width,c.height)*.455*zoom).rotate([-centrum[0],-centrum[1]]);
      const xy = p(punkt); return {x:c.x+xy[0],y:c.y+xy[1]};
    }''', {'punkt': koordinater, 'centrum': list(centrum), 'zoom': zoom})


def kontroller_data():
    # Uafhængige stikprøver mod kildernes egne tal (WPP 2024, HDR 2025, DWD).
    d = json.loads((DATA / 'demografi.json').read_text())
    k = json.loads((DATA / 'klima.json').read_text())
    navne = json.loads((DATA / 'landeindeks.json').read_text())
    assert len(d['lande']) == 237 and d['noegleaar'] == 2023
    dk, ng, jp = d['lande']['208'], d['lande']['562'], d['lande']['392']
    assert dk['navn'] == 'Danmark' and dk['noegletal']['tfr'] == 1.51 and dk['noegletal']['hdi'] == 0.962
    assert ng['navn'] == 'Niger' and ng['noegletal']['tfr'] > 6 and ng['noegletal']['medianalder'] < 16
    assert jp['noegletal']['medianalder'] > 48 and jp['noegletal']['levealder'] > 84
    for land in d['lande'].values():
        assert set(land['pyramide']) == {str(a) for a in d['pyramideaar']}
        for p in land['pyramide'].values():
            assert len(p['maend']) == len(p['kvinder']) == 21 and min(p['maend'] + p['kvinder']) >= 0
        assert len(land['serie']['cbr']) == len(d['serieaar'])
    # Pyramidens sum svarer til befolkningstallet i nøgleåret.
    for id in ['208', '156', '798']:
        land = d['lande'][id]
        s = sum(land['pyramide']['2023']['maend'] + land['pyramide']['2023']['kvinder'])
        assert abs(s - land['noegletal']['befolkning']) / land['noegletal']['befolkning'] < .005, (id, s)
    kbh = k['lande']['208'][0]
    assert kbh['wmo'] == '06186' and kbh['t'][6] == 18.3 and kbh['periode'] == '1991–2020'
    assert all(len(s['t']) == len(s['n']) == 12 for st in k['lande'].values() for s in st)
    assert all(id in navne for id in d['lande']) and navne['010'] == 'Antarktis'
    # Stationer ligger i det rigtige land (stikprøver).
    assert [s['omraade'] for s in k['lande']['250']].count('France') >= 1
    assert all(s['omraade'] == 'Brazil' for s in k['lande']['076'])


def afproev_landemenu(browser, adresse, ud, skaerme=SKAERME):
    kontroller_data()
    fejl = []
    for w, h in skaerme:
        touch = w == 390
        side = browser.new_page(viewport={'width': w, 'height': h}, has_touch=touch, is_mobile=touch)
        side.on('pageerror', lambda e: fejl.append(str(e)))
        side.on('console', lambda e: fejl.append(e.text) if e.type == 'error' else None)
        klar(side, adresse)
        # Data hentes først, når en fane vælges.
        navne = lambda: side.evaluate('performance.getEntriesByType("resource").map(r=>r.name).join(" ")')
        assert 'demografi.json' not in navne() and 'klima.json' not in navne()
        punkt = globuspunkt(side, [2.6, 28])
        side.touchscreen.tap(**punkt) if touch else side.mouse.click(**punkt)
        menu = side.locator('#landemenu')
        expect(menu).to_be_visible()
        expect(menu.locator('h2')).to_have_text('Algeriet')
        expect(menu.locator('[data-valg]')).to_have_count(2)
        expect(menu.locator('[data-valg="demografi"]')).to_be_focused()
        boks = menu.bounding_box()
        assert boks['x'] >= 0 and boks['x'] + boks['width'] <= w and boks['y'] + boks['height'] <= h
        side.screenshot(path=str(ud / f'landemenu-{w}x{h}.png'))
        # Tastatur: Tab til Klima og Enter.
        side.keyboard.press('Tab'); side.keyboard.press('Enter')
        expect(side.locator('#dialogtitel')).to_have_text('Algeriet')
        expect(side.locator('[data-fane="klima"]')).to_have_attribute('aria-pressed', 'true')
        expect(side.locator('.stationskort').first).to_be_visible()
        assert side.locator('.stationskort').count() >= 2
        expect(side.locator('.stationskort').first).to_contain_text('Algier')
        assert side.locator('.hydroterm .nedboer').count() == 12 * side.locator('.stationskort').count()
        side.screenshot(path=str(ud / f'klima-{w}x{h}.png'))
        side.locator('[data-fane="demografi"]').click()
        expect(side.locator('#pyramidetitel')).to_have_text('Befolkningspyramide 2023')
        expect(side.locator('.pyramide .maend')).to_have_count(21)
        expect(side.locator('.noegletal')).to_contain_text('Børnedødelighed')
        expect(side.locator('.noegletal')).to_contain_text('HDI')
        side.locator('.aarvalg [data-aar="2100"]').click()
        expect(side.locator('#pyramidetitel')).to_contain_text('fremskrivning')
        expect(side.locator('.aldersandele')).to_contain_text('ikke målte tal')
        assert side.evaluate('''() => { const d = document.querySelector('dialog');
          return d.scrollWidth <= d.clientWidth + 1 && document.documentElement.scrollWidth === innerWidth; }''')
        # Figurteksten skal kunne læses: mindst ca. 9 px på skærmen.
        mindst = side.evaluate('''() => Math.min(...[...document.querySelectorAll('.pyramide text, .transition text')]
          .map(t => t.getBoundingClientRect().height).filter(Boolean))''')
        assert mindst >= 9, mindst
        side.screenshot(path=str(ud / f'demografi-{w}x{h}.png'))
        side.keyboard.press('Escape')
        expect(side.locator('dialog')).to_be_hidden()
        expect(side.locator('#globus')).to_be_focused()
        # Søgning er tastaturvejen til alle lande, også små.
        side.get_by_role('button', name='Søg', exact=True).click()
        side.get_by_role('searchbox').fill('singa')
        side.locator('.landeknapper button', has_text='Singapore').click()
        expect(side.locator('#dialogtitel')).to_have_text('Singapore')
        expect(side.locator('.noegletal')).to_contain_text('Befolkning')
        side.locator('[data-fane="klima"]').click()
        expect(side.locator('.stationskort')).to_have_count(1)
        side.locator('#luk').click()
        side.get_by_role('button', name='Søg', exact=True).click()
        side.get_by_role('searchbox').fill('kenya')
        side.locator('.landeknapper button', has_text='Kenya').click()
        side.locator('[data-fane="klima"]').click()
        expect(side.locator('.periodeadvarsel').first).to_contain_text('1961–1990')
        side.locator('#luk').click()
        side.get_by_role('button', name='Søg', exact=True).click()
        side.get_by_role('searchbox').fill('monaco')
        side.locator('.landeknapper button', has_text='Monaco').click()
        side.locator('[data-fane="klima"]').click()
        expect(side.locator('#landedata')).to_contain_text('ingen klimanormal')
        side.locator('#luk').click()
        # Escape lukker kun menuen, ikke fokustilstanden.
        side.locator('#fokus').click()
        side.locator('#nulstil').click(); side.wait_for_timeout(100)
        punkt = globuspunkt(side, [2.6, 28])
        side.touchscreen.tap(**punkt) if touch else side.mouse.click(**punkt)
        expect(menu).to_be_visible()
        side.keyboard.press('Escape')
        expect(menu).to_be_hidden()
        assert side.locator('body').evaluate("el => el.classList.contains('fokus')")
        side.locator('#fokus').click()
        side.close()
        print('Landemenu, demografi og klima:', w, h, 'OK', flush=True)

    # Fejl i data: fanen siger det, og et nyt forsøg virker.
    side = browser.new_page()
    side.on('pageerror', lambda e: fejl.append(str(e)))
    klar(side, adresse)
    side.route('**/demografi.json', lambda r: r.abort())
    side.mouse.click(**globuspunkt(side, [2.6, 28]))
    side.locator('#landemenu [data-valg="demografi"]').click()
    expect(side.locator('#landedata')).to_contain_text('kunne ikke hentes')
    side.unroute('**/demografi.json')
    side.locator('[data-fane="demografi"]').click()
    expect(side.locator('.pyramide')).to_be_visible()
    side.close()
    # Uden navneindeks bruges kortets eget navn.
    side = browser.new_page()
    side.route('**/landeindeks.json', lambda r: r.abort())
    klar(side, adresse)
    side.mouse.click(**globuspunkt(side, [2.6, 28]))
    expect(side.locator('#landemenu h2')).to_have_text('Algeria')
    side.close()
    assert not fejl, fejl
    print('Landemenu: data, fejl og nyt forsøg OK', flush=True)
    afproev_sammenligning(browser, adresse, ud, skaerme)


def aabn_land(side, soegning, navn):
    side.get_by_role('button', name='Søg', exact=True).click()
    side.get_by_role('searchbox').fill(soegning)
    side.locator('.landeknapper').get_by_role('button', name=navn, exact=True).click()
    expect(side.locator('#dialogtitel')).to_have_text(navn)


def sammenlign_med(side, soegning, navn):
    side.locator('.sammenlignknap').click()
    felt = side.locator('#sammenlignvalg input')
    expect(felt).to_be_focused()
    felt.fill(soegning)
    side.locator('#sammenlignvalg').get_by_role('button', name=navn, exact=True).click()
    expect(side.locator('#sammenlignvalg')).to_be_hidden()


def afproev_sammenligning(browser, adresse, ud, skaerme=SKAERME):
    fejl = []
    for w, h in skaerme:
        touch = w == 390
        side = browser.new_page(viewport={'width': w, 'height': h}, has_touch=touch, is_mobile=touch)
        side.on('pageerror', lambda e: fejl.append(str(e)))
        side.on('console', lambda e: fejl.append(e.text) if e.type == 'error' else None)
        klar(side, adresse)
        aabn_land(side, 'alger', 'Algeriet')
        expect(side.locator('#pyramidetitel')).to_be_visible()
        # Uden søgetekst foreslås Danmark; Algeriet selv kan ikke vælges.
        side.locator('.sammenlignknap').click()
        expect(side.locator('.sammenlignknap')).to_have_attribute('aria-expanded', 'true')
        expect(side.locator('#sammenlignvalg button')).to_have_text(['Danmark'])
        side.locator('#sammenlignvalg input').fill('alg')
        expect(side.locator('#sammenlignvalg')).to_contain_text('Intet land passer')
        # Escape lukker kun søgefeltet, ikke dialogen.
        side.keyboard.press('Escape')
        expect(side.locator('#sammenlignvalg')).to_be_hidden()
        expect(side.locator('dialog')).to_be_visible()
        expect(side.locator('.sammenlignknap')).to_be_focused()
        sammenlign_med(side, 'danm', 'Danmark')
        expect(side.locator('#dialogtitel')).to_have_text('Algeriet og Danmark')
        expect(side.locator('.pyramide')).to_have_count(2)
        expect(side.locator('.transition')).to_have_count(2)
        tabel = side.locator('.sammenligningstabel')
        expect(tabel.locator('tbody tr')).to_have_count(15)
        expect(tabel.locator('thead')).to_contain_text('Algeriet')
        expect(tabel.locator('thead')).to_contain_text('Danmark')
        expect(tabel.locator('tbody tr', has_text='Samlet fertilitet')).to_contain_text('1,51')
        # HDI-rangen er forskellig for landene og står derfor i cellen.
        expect(tabel.locator('tbody tr', has_text='HDI').locator('td').nth(1)).to_contain_text('nr. 4')
        # Fælles skala: pyramidernes x-akser og raternes y-akser har samme tal.
        akser = side.evaluate('''() => [...document.querySelectorAll('.pyramide, .transition')].map(f =>
          [...f.querySelectorAll('.aksetal')].map(t => t.textContent).join('|'))''')
        assert akser[0] == akser[1], akser
        side.locator('.aarvalg [data-aar="2100"]').click()
        expect(side.locator('#sammenligningstitel')).to_contain_text('2100 · fremskrivning')
        if w >= 900:
            # Pyramiderne står side om side.
            a, b = [side.locator('.pyramide').nth(i).bounding_box() for i in (0, 1)]
            assert abs(a['y'] - b['y']) < 2 and b['x'] > a['x'] + a['width'], (a, b)
        assert side.evaluate('''() => { const d = document.querySelector('dialog');
          return d.scrollWidth <= d.clientWidth + 1 && document.documentElement.scrollWidth === innerWidth; }''')
        mindst = side.evaluate('''() => Math.min(...[...document.querySelectorAll('.pyramide text, .transition text')]
          .map(t => t.getBoundingClientRect().height).filter(Boolean))''')
        assert mindst >= 9, mindst
        side.screenshot(path=str(ud / f'sammenligning-demografi-{w}x{h}.png'))
        side.locator('[data-fane="klima"]').click()
        expect(side.locator('.sammenligning-kolonne')).to_have_count(2)
        expect(side.locator('.sammenligning-kolonne').nth(0)).to_contain_text('Algier')
        expect(side.locator('.sammenligning-kolonne').nth(1)).to_contain_text('Copenhagen')
        # Alle hydrotermfigurer har samme akser.
        skalaer = side.evaluate('''() => [...document.querySelectorAll('.hydroterm')].map(f =>
          [...f.querySelectorAll('.nedboer-tal')].map(t => t.textContent + '@' + t.getAttribute('y')).join('|'))''')
        assert len(skalaer) >= 3 and len(set(skalaer)) == 1, skalaer
        side.screenshot(path=str(ud / f'sammenligning-klima-{w}x{h}.png'))
        # Skift land og fjern sammenligningen igen.
        sammenlign_med(side, 'monac', 'Monaco')
        expect(side.locator('#dialogtitel')).to_have_text('Algeriet og Monaco')
        expect(side.locator('.sammenligning-kolonne').nth(1)).to_contain_text('ingen klimanormal')
        side.locator('.stopsammenligning').click()
        expect(side.locator('#dialogtitel')).to_have_text('Algeriet')
        expect(side.locator('.sammenligning-kolonne')).to_have_count(0)
        expect(side.locator('.stationskort').first).to_contain_text('Algier')
        expect(side.locator('.sammenlignknap')).to_be_focused()
        side.locator('#luk').click()
        side.close()
        print('Sammenligning af to lande:', w, h, 'OK', flush=True)
    # Område uden FN-data ved siden af et land med data.
    side = browser.new_page()
    side.on('pageerror', lambda e: fejl.append(str(e)))
    klar(side, adresse)
    aabn_land(side, 'danm', 'Danmark')
    sammenlign_med(side, 'antark', 'Antarktis')
    expect(side.locator('.pyramide')).to_have_count(1)
    expect(side.locator('.sammenligning-kolonne').nth(1)).to_contain_text('findes ikke')
    expect(side.locator('.sammenligningstabel tbody tr').first.locator('td').nth(1)).to_have_text('–')
    side.close()
    assert not fejl, fejl
    print('Sammenligning: område uden data OK', flush=True)


if __name__ == '__main__':
    ud = Path(os.environ.get('ATLAS_TEST_UD', '/tmp/smbi-landemenu-test')); ud.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/usr/bin/chromium'),
                                    args=['--no-sandbox', '--disable-webgl'])
        afproev_landemenu(browser, os.environ.get('ATLAS_URL', 'http://localhost:8777'), ud)
        browser.close()
