"""Afprøv jordskælvs- og vulkanlaget: data, signatur, filtre, aflæsning, dialog og fejl."""
import json
from pathlib import Path
from playwright.sync_api import expect
from piletaster import billede

DATA = Path(__file__).parents[1] / 'data'


def afproev_seismikdata():
    """Datafilerne har den dokumenterede form og kendte, sikre hændelser."""
    raa = json.loads((DATA / 'jordskaelv.json').read_text())
    s = raa['skaelv']
    assert raa['start'] == 1976 and len(s) == raa['antal'] * 5 and raa['antal'] > 80000, raa['antal']
    skaelv = [s[i:i + 5] for i in range(0, len(s), 5)]
    assert all(abs(l) <= 1800 and abs(b) <= 900 and 0 <= d <= 800 and 0 <= m <= 50 and 0 <= a <= 49
               for l, b, d, m, a in skaelv)
    assert [x[3] for x in skaelv] == sorted(x[3] for x in skaelv), 'ikke sorteret efter magnitude'
    # Sumatra 2004 (M 9,1) og Bolivia 1994 (M 8,2 i 631 km dybde).
    assert [960, 33, 30, 41, 28] in skaelv
    assert [-676, -138, 631, 32, 18] in skaelv
    # Alle tre dybdeklasser er rigeligt repræsenteret.
    assert sum(x[2] >= 300 for x in skaelv) > 3000 and sum(70 <= x[2] < 300 for x in skaelv) > 10000
    vulkaner = json.loads((DATA / 'vulkaner.json').read_text())['vulkaner']
    assert len(vulkaner) > 1200
    navne = {v[0]: v for v in vulkaner}
    assert navne['Hekla'][4] == 'rift' and navne['Hekla'][5] == 2000
    assert navne['Kilauea'][4] == 'intraplade' and navne['Ascension'][4] == 'rift'
    assert sum(v[4] == 'subduktion' for v in vulkaner) > 800
    assert all(v[4] in ('subduktion', 'rift', 'intraplade', 'ukendt') for v in vulkaner)
    assert (DATA / 'jordskaelv.LICENSE').exists() and (DATA / 'vulkaner.LICENSE').exists()


def afproev_seismik(side, ud):
    skaelvknap = side.get_by_role('button', name='Jordskælv', exact=True)
    vulkanknap = side.get_by_role('button', name='Vulkaner', exact=True)
    side.get_by_role('button', name='Nulstil', exact=True).click()
    assert not side.evaluate("performance.getEntriesByType('resource').some(r => /\\/(jordskaelv|vulkaner)\\.json$/.test(r.name))"), \
        'Skælv- eller vulkandata hentes uden tilvalg'
    foer = billede(side)
    skaelvknap.focus()
    side.keyboard.press('Enter')
    expect(skaelvknap).to_have_attribute('aria-pressed', 'true')
    expect(skaelvknap).to_be_focused()
    expect(side.locator('#skaelvsignatur')).to_be_visible()
    med_skaelv = billede(side)
    assert med_skaelv != foer, 'Jordskælv tegnes ikke'
    assert 'jordskælv med magnitude 5' in side.locator('#globus').get_attribute('aria-label')
    # Startvisningen har Nordatlanten i midten; aflæsningen siger noget meningsfuldt.
    expect(side.locator('#skaelvaflaesning')).to_contain_text('Midt på globussen:')

    # Dybdefiltret og magnitudevalget ændrer tegningen og kan rulles tilbage.
    lav = side.get_by_role('checkbox', name='0–70 km lavtliggende')
    lav.uncheck()
    uden_lav = billede(side)
    assert uden_lav != med_skaelv, 'Dybdefilter virker ikke'
    assert '0–70' not in side.locator('#globus').get_attribute('aria-label')
    lav.check()
    side.get_by_role('radio', name='7').check()
    assert billede(side) not in (med_skaelv, uden_lav), 'Magnitudevalg virker ikke'
    side.get_by_role('radio', name='M ≥ 5').check()
    assert billede(side) == med_skaelv

    vulkanknap.click()
    expect(vulkanknap).to_have_attribute('aria-pressed', 'true')
    expect(side.locator('#vulkansignatur')).to_be_visible()
    begge = billede(side)
    assert begge != med_skaelv, 'Vulkaner tegnes ikke'

    # Aflæsning ved musen i startvisningen (centrum −22°, 42°, zoom 1). Skælvlagets
    # egen projektion skal ramme samme punkt som D3: Bolivia 1994 i 631 km dybde.
    # Ascension ligger alene midt i Atlanterhavet.
    for punkt, felt, tekst in [([-67.6, -13.8], '#skaelvaflaesning', 'M 8,2, 631 km dybt (dybe), 1994'),
                               ([-14.37, -7.95], '#vulkanaflaesning', 'Ascension (United Kingdom): stratovulkan, riftzone')]:
        xy = side.evaluate('''p => {
          const c = document.querySelector('#globus').getBoundingClientRect();
          const [x, y] = d3.geoOrthographic().translate([c.width / 2, c.height / 2])
            .scale(Math.min(c.width, c.height) * .455).rotate([22, -42])(p);
          return [c.left + x, c.top + y];
        }''', punkt)
        side.mouse.move(*xy)
        expect(side.locator(felt)).to_contain_text('Ved markøren: ' + tekst)
    side.mouse.move(1, 1)

    # Signaturerne overlapper ingen kontroller og giver ingen vandret rulning.
    maal = side.evaluate('''() => {
      const kontroller = [...document.querySelectorAll('.betjeningslinje button, .vaerktoejer button')].map(k => k.getBoundingClientRect());
      const sig = [...document.querySelectorAll('.signatur:not([hidden])')].map(s => s.closest('.signaturer').getBoundingClientRect());
      const overlap = sig.some(r => kontroller.some(k => !(k.right <= r.left || k.left >= r.right || k.bottom <= r.top || k.top >= r.bottom)));
      return {overlap, vandret: document.documentElement.scrollWidth - innerWidth};
    }''')
    assert not maal['overlap'] and maal['vandret'] == 0, maal
    bredde, hoejde = side.viewport_size['width'], side.viewport_size['height']
    side.screenshot(path=str(ud / f'seismik-{bredde}x{hoejde}.png'))

    # Dialogen har tekstalternativ, opgaver, tal og kilder.
    side.locator('#skaelvopgave').click()
    expect(side.locator('#dialogtitel')).to_have_text('Undersøg jordskælv og vulkaner')
    side.locator('.pladeoversigt summary', has_text='Tal fra datasættene').click()
    expect(side.locator('#dialogindhold')).to_contain_text('Dybe skælv (over 300 km)')
    expect(side.locator('#dialogindhold')).to_contain_text('1.214')
    assert side.locator('.opgaveliste li').count() >= 5
    side.keyboard.press('Escape')

    # Slå fra igen: tegningen vender tilbage til udgangspunktet.
    skaelvknap.click(); vulkanknap.click()
    expect(skaelvknap).to_have_attribute('aria-pressed', 'false')
    expect(side.locator('#skaelvsignatur')).to_be_hidden()
    expect(side.locator('#vulkansignatur')).to_be_hidden()
    assert billede(side) == foer, 'Lagene efterlader spor'


def afproev_seismikfejl(browser, adresse):
    """Manglende eller beskadigede data: laget slås ikke til, globussen virker."""
    for fil, navn, tekst, fejltype in [
        ('jordskaelv.json', 'Jordskælv', 'Jordskælvene kunne ikke indlæses', 'http'),
        ('jordskaelv.json', 'Jordskælv', 'Jordskælvene kunne ikke indlæses', 'ugyldig'),
        ('vulkaner.json', 'Vulkaner', 'Vulkanerne kunne ikke indlæses', 'http'),
        ('vulkaner.json', 'Vulkaner', 'Vulkanerne kunne ikke indlæses', 'ugyldig'),
    ]:
        side = browser.new_page(viewport={'width': 1280, 'height': 577})
        jsfejl = []
        side.on('pageerror', lambda e: jsfejl.append(str(e)))
        moenster = f'**/atlas/data/{fil}'
        if fejltype == 'http':
            side.route(moenster, lambda r: r.fulfill(status=500, body=''))
        else:
            side.route(moenster, lambda r: r.fulfill(json={'skaelv': [1, 2, None], 'vulkaner': [['x', 400, 0]]}))
        side.goto(adresse + '/atlas/')
        side.wait_for_function("document.querySelector('#kortstatus').hidden")
        knap = side.get_by_role('button', name=navn, exact=True)
        foer = billede(side)
        knap.click()
        expect(side.locator('#kortstatus')).to_contain_text(tekst)
        expect(knap).to_have_attribute('aria-pressed', 'false')
        expect(knap).to_be_enabled()
        assert billede(side) == foer, (fil, fejltype)
        side.get_by_role('button', name='Drej mod øst', exact=True).click()
        assert billede(side) != foer, f'Globussen virker ikke efter {fil} {fejltype}'
        # Et andet lag kan stadig slås til, og en ny prøve lykkes, når data er tilbage.
        side.get_by_role('button', name='Pladegrænser', exact=True).click()
        expect(side.get_by_role('button', name='Pladegrænser', exact=True)).to_have_attribute('aria-pressed', 'true')
        side.unroute(moenster)
        knap.click()
        expect(knap).to_have_attribute('aria-pressed', 'true')
        expect(side.locator('#kortstatus')).to_be_hidden()
        assert not jsfejl, (fil, fejltype, jsfejl)
        side.close()
    print('Jordskælv og vulkaner: data, filtre, aflæsning, dialog og fejl OK')
