"""Afprøv klimalaget: Vahl og Köppen, signatur, aflæsning, dialog, data og fejl."""
import json
from pathlib import Path
from playwright.sync_api import expect
from piletaster import billede

DATA = Path(__file__).parents[1] / 'data'


def afproev_klimadata():
    """TopoJSON-filerne har de forventede klasser og en gyldig kvantisering."""
    for system, antal, mindst in [('vahl', 16, 15), ('koppen', 30, 28)]:
        topo = json.loads((DATA / f'{system}.json').read_text())
        assert topo['type'] == 'Topology' and topo['arcs'], system
        ider = [g['id'] for g in topo['objects'][system]['geometries']]
        assert len(ider) == len(set(ider)) >= mindst, (system, ider)
        assert all(1 <= i <= antal for i in ider), (system, ider)
        assert all(abs(a - b) < 1e-6 for a, b in zip(topo['bbox'], [-180, -90, 180, 90])), topo['bbox']
        assert (DATA / f'{system}.json').stat().st_size < 400_000, system


def punkt_paa_skaerm(side, lonlat):
    """Skærmpunkt for [lon, lat] ved startvisningen (centrum −22°, 42°, zoom 1)."""
    boks = side.locator('#globus').bounding_box()
    x, y = side.evaluate('''p => {
      const c = document.querySelector('#globus').getBoundingClientRect();
      return d3.geoOrthographic().translate([c.width / 2, c.height / 2])
        .scale(Math.min(c.width, c.height) * .455).rotate([22, -42])(p);
    }''', lonlat)
    return boks['x'] + x, boks['y'] + y


def afproev_klimalag(side, ud):
    knap = side.get_by_role('button', name='Klimazoner', exact=True)
    signatur = side.locator('#klimasignatur')
    aflaesning = side.locator('#klimaaflaesning')
    side.get_by_role('button', name='Nulstil', exact=True).click()
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_hidden()
    assert not side.evaluate("performance.getEntriesByType('resource').some(r => /\\/(vahl|koppen)\\.json$/.test(r.name))"), \
        'Klimadata hentes uden tilvalg'
    foer = billede(side)
    knap.focus()
    side.keyboard.press('Enter')
    expect(knap).to_have_attribute('aria-pressed', 'true')
    expect(knap).to_be_focused()
    expect(signatur).to_be_visible()
    for tekst in ['Tropisk', 'Subtropisk', 'Tempereret', 'Polar', 'Maki', 'Nåleskov', 'Tundra']:
        expect(signatur).to_contain_text(tekst)
    vahl = billede(side)
    assert vahl != foer, 'Klimazoner tegnes ikke'
    assert 'Vahls klimazoner' in side.locator('#globus').get_attribute('aria-label')
    # Startvisningen har Nordatlanten i midten: ingen klasse over havet.
    expect(aflaesning).to_have_text('Midt på globussen: hav')

    bredde, hoejde = side.viewport_size['width'], side.viewport_size['height']
    maal = side.evaluate('''() => {
      const s = document.querySelector('#klimasignatur');
      const r = s.getBoundingClientRect();
      const knap = document.querySelector('#klimaopgave').getBoundingClientRect();
      const kontroller = [...document.querySelectorAll('.betjeningslinje button, .vaerktoejer button')]
        .map(k => k.getBoundingClientRect());
      const overlap = kontroller.some(k => !(k.right <= r.left || k.left >= r.right || k.bottom <= r.top || k.top >= r.bottom));
      return {overlap, bund: r.bottom, knapbund: knap.bottom, rul: s.scrollHeight - s.clientHeight,
              vandret: document.documentElement.scrollWidth - innerWidth};
    }''')
    assert not maal['overlap'] and maal['vandret'] == 0, maal
    if bredde >= 900:
        # Hele signaturen inkl. knappen kan ses uden at rulle i kortet.
        assert maal['bund'] <= hoejde and maal['rul'] <= 1 and maal['knapbund'] <= maal['bund'], maal
    side.screenshot(path=str(ud / f'{bredde}x{hoejde}-klima-vahl.png'))

    if bredde >= 900:
        for lonlat, vahltekst, koppentekst in [
            ([12.5, 55.7], 'Tempereret zone: løvskov', 'Cfb'),
            ([5, 25], 'Subtropisk zone: ørken', 'BWh'),
            ([-40, 72], 'Polar zone: is', 'EF'),
        ]:
            side.mouse.move(*punkt_paa_skaerm(side, lonlat))
            expect(aflaesning).to_contain_text(f'Ved markøren: {vahltekst}')
        side.mouse.move(2, 2)
        expect(aflaesning).to_have_text('Midt på globussen: hav')

    # Skift til Köppen med tastaturet.
    side.locator('input[value="vahl"]').focus()
    side.keyboard.press('ArrowRight')
    expect(side.locator('input[value="koppen"]')).to_be_checked()
    expect(side.locator('#klimatitel')).to_have_text('Klimatyper (Köppen)')
    for kode in ['Af', 'BWh', 'Cfb', 'Dfc', 'EF']:
        expect(signatur).to_contain_text(kode)
    koppen = billede(side)
    assert koppen not in (vahl, foer), 'Köppen tegnes ikke'
    assert 'Köppen' in side.locator('#globus').get_attribute('aria-label')
    if bredde >= 900:
        side.mouse.move(*punkt_paa_skaerm(side, [12.5, 55.7]))
        expect(aflaesning).to_contain_text('Cfb')
        side.mouse.move(2, 2)
    side.screenshot(path=str(ud / f'{bredde}x{hoejde}-klima-koppen.png'))

    # Piletasten drejer stadig globussen, når fokus er på globussen.
    side.locator('#globus').focus()
    side.keyboard.press('ArrowRight')
    assert billede(side) != koppen

    # Dialogen med kriterier, opgaver og kilder.
    side.locator('#klimaopgave').click()
    expect(side.locator('#dialogtitel')).to_have_text('Undersøg klimazonerne')
    expect(side.locator('#dialogindhold')).to_contain_text('v = 16,2 − 0,3 · k')
    expect(side.locator('#dialogindhold')).to_contain_text('nedbøren i mm er større end 2 × temperaturen')
    assert side.locator('.opgaveliste li').count() == 6
    info = side.get_by_role('button', name='Om data: Klimazoner', exact=True)
    info.click()
    panel = side.locator('#' + info.get_attribute('aria-controls'))
    expect(panel).to_contain_text('doi:10.1038/s41597-023-02549-6')
    expect(panel).to_contain_text('CC BY 4.0')
    expect(panel).to_contain_text('rekonstruktion')
    side.keyboard.press('Escape')
    links = side.locator('#dialogindhold .metadata a').evaluate_all('l => l.map(a => a.href)')
    assert 'https://doi.org/10.1038/s41597-023-02549-6' in links, links
    side.keyboard.press('Escape')
    expect(side.locator('#udforsker')).to_be_hidden()

    # Laget slås fra igen, og globussen er som før (efter Nulstil).
    side.get_by_role('button', name='Nulstil', exact=True).click()
    side.locator('input[value="vahl"]').check(force=True)
    expect(side.locator('#klimatitel')).to_have_text('Klimazoner (Vahl)')
    knap.focus()
    side.keyboard.press('Space')
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_hidden()
    assert billede(side) == foer, 'Globussen er ikke som før klimalaget'


def afproev_klimafejl(browser, adresse):
    """Data- og modulfejl må ikke bryde globussen, og et nyt forsøg skal lykkes."""
    for fejltype in ['netvaerk', 'json', 'klasse', 'modul']:
        side = browser.new_page(viewport={'width': 1366, 'height': 625})
        jsfejl = []
        side.on('pageerror', lambda e: jsfejl.append(str(e)))
        moenster = '**/klimalag.js' if fejltype == 'modul' else '**/vahl.json'
        if fejltype in ['netvaerk', 'modul']:
            side.route(moenster, lambda r: r.abort())
        elif fejltype == 'json':
            side.route(moenster, lambda r: r.fulfill(body='{forkert', content_type='application/json'))
        else:
            forkert = json.loads((DATA / 'vahl.json').read_text())
            forkert['objects']['vahl']['geometries'][0]['id'] = 99
            side.route(moenster, lambda r: r.fulfill(json=forkert))
        side.goto(adresse + '/atlas/')
        side.wait_for_function("document.querySelector('#kortstatus').hidden")
        knap = side.get_by_role('button', name='Klimazoner', exact=True)
        foer = billede(side)
        knap.click()
        expect(side.locator('#kortstatus')).to_contain_text('Klimazonerne kunne ikke indlæses')
        expect(knap).to_have_attribute('aria-pressed', 'false')
        expect(knap).to_be_enabled()
        expect(side.locator('#klimasignatur')).to_be_hidden()
        assert billede(side) == foer, fejltype
        side.get_by_role('button', name='Drej mod øst', exact=True).click()
        assert billede(side) != foer, f'Globussen virker ikke efter {fejltype}'
        side.unroute(moenster)
        if fejltype == 'modul':
            # En fejlet ES-import caches af browseren indtil genindlæsning.
            side.reload()
            side.wait_for_function("document.querySelector('#kortstatus').hidden")
        knap.click()
        expect(knap).to_have_attribute('aria-pressed', 'true')
        expect(side.locator('#kortstatus')).to_be_hidden()
        assert not jsfejl, (fejltype, jsfejl)
        side.close()
    # Köppen fejler, mens Vahl vises: Vahl bliver stående, og fejlen står i signaturen.
    side = browser.new_page(viewport={'width': 1366, 'height': 625})
    side.goto(adresse + '/atlas/')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    side.route('**/koppen.json', lambda r: r.abort())
    side.locator('#klimalag').click()
    expect(side.locator('#klimasignatur')).to_be_visible()
    side.locator('input[value="koppen"]').check(force=True)
    expect(side.locator('#klimastatus')).to_contain_text('kunne ikke indlæses')
    expect(side.locator('input[value="vahl"]')).to_be_checked()
    expect(side.locator('#klimatitel')).to_have_text('Klimazoner (Vahl)')
    side.unroute('**/koppen.json')
    side.locator('input[value="koppen"]').check(force=True)
    expect(side.locator('#klimatitel')).to_have_text('Klimatyper (Köppen)')
    expect(side.locator('#klimastatus')).to_be_hidden()
    side.close()
