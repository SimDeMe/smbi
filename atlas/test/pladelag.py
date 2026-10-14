"""Afprøv #48: valgfrit pladegrænselag, signatur, opgave og datafejl."""
from playwright.sync_api import expect
from piletaster import billede
import json
from pathlib import Path


def afproev_pladelag(side, ud):
    knap = side.get_by_role('button', name='Pladegrænser', exact=True)
    signatur = side.locator('#signatur')
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_hidden()
    foer = billede(side)
    assert not side.evaluate("performance.getEntriesByType('resource').some(r => r.name.endsWith('/pladegraenser.json'))"), 'Laget hentes uden tilvalg'
    knap.focus()
    side.keyboard.press('Enter')
    expect(knap).to_have_attribute('aria-pressed', 'true')
    expect(knap).to_be_focused()
    expect(signatur).to_be_visible()
    for tekst in ['Konstruktiv', 'Destruktiv', 'Bevarende', 'diffus zone', 'Bird 2003']:
        expect(signatur).to_contain_text(tekst)
    assert billede(side) != foer, 'Pladegrænser tegnes ikke'
    assert 'pladegrænser' in side.locator('#globus').get_attribute('aria-label')
    bredde, hoejde = side.viewport_size['width'], side.viewport_size['height']
    maal = side.evaluate('''() => {
      const s = document.querySelector('#signatur').getBoundingClientRect();
      const kontroller = [...document.querySelectorAll('.betjeningslinje button, .vaerktoejer button')]
        .map(k => k.getBoundingClientRect());
      const overlap = kontroller.some(k => !(k.right <= s.left || k.left >= s.right || k.bottom <= s.top || k.top >= s.bottom));
      return {overlap, bund: s.bottom, hoejre: s.right, vandret: document.documentElement.scrollWidth - innerWidth};
    }''')
    assert not maal['overlap'] and maal['vandret'] == 0, maal
    if bredde >= 900:
        assert maal['bund'] <= hoejde, maal
    side.screenshot(path=str(ud / f'{bredde}x{hoejde}-plader.png'))

    side.get_by_role('button', name='Undersøg og kilde →', exact=True).click()
    expect(side.locator('#dialogtitel')).to_have_text('Undersøg pladegrænserne')
    side.locator('.pladeoversigt summary').click()
    expect(side.locator('.pladeoversigt ul')).to_be_visible()
    expect(side.locator('.pladeoversigt')).to_contain_text('Nordamerikanske')
    expect(side.locator('.pladeoversigt')).to_contain_text('Nazcapladen')
    assert side.locator('.opgaveliste li').count() == 6
    info = side.get_by_role('button', name='Om data: Pladegrænser', exact=True)
    info.click()
    panel = side.locator('#' + info.get_attribute('aria-controls'))
    expect(panel).to_contain_text('doi:10.1029/2001GC000252')
    expect(panel).to_contain_text('Open Data Commons Attribution')
    side.keyboard.press('Escape')
    expect(panel).to_be_hidden()
    links = side.locator('.modelkort a')
    assert sorted(links.evaluate_all('l => l.map(a => a.getAttribute("href"))')) == \
        ['/geografi/pladegraenser.html', '/geografi/vulkanudbrud.html']
    side.get_by_role('button', name='Vis Island med pladegrænser', exact=True).click()
    expect(side.locator('#udforsker')).to_be_hidden()
    expect(side.locator('#globus')).to_be_focused()
    expect(knap).to_have_attribute('aria-pressed', 'true')
    expect(side.locator('#zoomniveau')).to_have_text('1,4×')

    # Laget slås fra igen, og globussen tegnes som før.
    side.get_by_role('button', name='Nulstil', exact=True).click()
    knap.focus()
    side.keyboard.press('Space')
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(knap).to_be_focused()
    expect(signatur).to_be_hidden()
    assert billede(side) == foer, 'Globussen er ikke som før laget'


def afproev_pladefejl(browser, adresse):
    original = json.loads((Path(__file__).parents[1] / 'data/pladegraenser.json').read_text())
    # Gyldig JSON kan stadig være geografisk ugyldig. Hver fejl skal afvises
    # inden D3 tegner, og et nyt forsøg efter en datafejl skal kunne lykkes.
    for fejltype in ['netvaerk', 'json', 'null', 'ulige', 'udenfor', 'ring', 'klasse', 'mangler_type', 'modul']:
        side = browser.new_page()
        jsfejl = []
        side.on('pageerror', lambda e: jsfejl.append(str(e)))
        moenster = '**/pladelag.js' if fejltype == 'modul' else '**/pladegraenser.json'
        if fejltype in ['netvaerk', 'modul']:
            side.route(moenster, lambda r: r.abort())
        elif fejltype == 'json':
            side.route(moenster, lambda r: r.fulfill(body='{forkert', content_type='application/json'))
        else:
            forkert = json.loads(json.dumps(original))
            if fejltype == 'null': forkert['linjer'][0][4][1] = None
            if fejltype == 'ulige': forkert['linjer'][0][4].pop()
            if fejltype == 'udenfor': forkert['linjer'][0][4][1] = 91
            if fejltype == 'ring': forkert['orogener'][0][1][-1] += 1
            if fejltype == 'klasse': forkert['klasser']['OSR'] = 'destruktiv'
            if fejltype == 'mangler_type': forkert['linjer'] = [l for l in forkert['linjer'] if l[0] not in ['OTF', 'CTF']]
            side.route(moenster, lambda r: r.fulfill(json=forkert))
        side.goto(adresse + '/atlas/')
        # Også et manglende lagmodul må lade selve globussen starte.
        side.wait_for_function("document.querySelector('#kortstatus').hidden")
        knap = side.get_by_role('button', name='Pladegrænser', exact=True)
        foer = billede(side)
        knap.click()
        expect(side.locator('#kortstatus')).to_contain_text('Pladegrænserne kunne ikke indlæses')
        expect(knap).to_have_attribute('aria-pressed', 'false')
        expect(knap).to_be_enabled()
        expect(side.locator('#signatur')).to_be_hidden()
        assert billede(side) == foer, fejltype
        side.get_by_role('button', name='Drej mod øst', exact=True).click()
        assert billede(side) != foer, f'Globussen virker ikke efter {fejltype}'
        side.get_by_role('button', name='Processer', exact=True).first.click()
        side.get_by_role('button', name='Undersøg pladegrænserne', exact=True).click()
        side.locator('.pladeoversigt summary').click()
        expect(side.locator('.pladeoversigt ul')).to_be_visible()
        expect(side.locator('.pladeoversigt')).to_contain_text('San Andreas')
        expect(side.locator('.opgaveliste')).to_be_visible()
        assert side.locator('.modelkort a').count() == 2
        side.locator('#luk').click()
        if fejltype != 'modul':
            side.unroute(moenster)
            knap.click()
            expect(knap).to_have_attribute('aria-pressed', 'true')
            expect(side.locator('#kortstatus')).to_be_hidden()
        else:
            # En fejlet ES-import caches af browseren indtil genindlæsning.
            side.unroute(moenster)
            side.reload()
            side.wait_for_function("document.querySelector('#kortstatus').hidden")
            knap.click()
            expect(knap).to_have_attribute('aria-pressed', 'true')
        assert not jsfejl, (fejltype, jsfejl)
        side.close()


def afproev_pladetilpasning(browser, adresse):
    side = browser.new_page(viewport={'width': 640, 'height': 625})
    side.goto(adresse + '/atlas/')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    side.locator('#pladelag').click()
    for bredde, hoejde in [(1280, 577), (390, 750), (1536, 730), (640, 625)]:
        side.set_viewport_size({'width': bredde, 'height': hoejde})
        expect(side.locator('#signatur')).to_be_visible()
        expect(side.locator('#pladelag')).to_have_attribute('aria-pressed', 'true')
        billede(side)  # afvent ResizeObserver og de næste tegningsrammer
        assert side.evaluate('document.documentElement.scrollWidth === innerWidth')
        foer = billede(side)
        side.locator('[data-drej="oest"]').click()
        assert billede(side) != foer
    side.close()
