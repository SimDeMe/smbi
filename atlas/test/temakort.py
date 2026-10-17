"""Afprøv temakortet: farver efter nøgletal, år, signatur, aflæsning, rangliste, klimalag og fejl."""
from lagmenu_hjaelp import aabn_lag, luk_lag
import json
from pathlib import Path
from playwright.sync_api import expect
from piletaster import billede
from klimalag import punkt_paa_skaerm

DATA = Path(__file__).parents[1] / 'data'


def farve_ved(side, lonlat):
    """Pixelfarven på globussen ved [lon, lat] i startvisningen."""
    return side.evaluate('''p => {
      const c = document.querySelector('#globus'), r = c.getBoundingClientRect(), t = c.width / r.width;
      const [x, y] = d3.geoOrthographic().translate([r.width / 2, r.height / 2])
        .scale(Math.min(r.width, r.height) * .455).rotate([22, -42])(p);
      const d = c.getContext('2d').getImageData(Math.round(x * t), Math.round(y * t), 1, 1).data;
      return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
    }''', lonlat)


def afproev_temakort(side, ud):
    luk_lag(side)
    knap = side.locator('#temalag')
    signatur = side.locator('#temasignatur')
    aflaesning = side.locator('#temaaflaesning')
    side.get_by_role('button', name='Nulstil', exact=True).click()
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_hidden()
    foer = billede(side)
    aabn_lag(side, knap).focus()
    side.keyboard.press('Enter')
    expect(knap).to_have_attribute('aria-pressed', 'true')
    expect(knap).to_be_focused()
    luk_lag(side)
    expect(signatur).to_be_visible()
    expect(side.locator('#temaindikator')).to_have_value('tfr')
    expect(side.locator('#temaforklaring')).to_contain_text('2023 · børn pr. kvinde')
    # Klasserne har antal lande, og summen er alle lande med data.
    raekker = side.locator('#temaklasser li:not(.ingen)')
    expect(raekker).to_have_count(6)
    antal = [int(t) for t in raekker.locator('small').all_inner_texts()]
    data = json.loads((DATA / 'demografi.json').read_text())
    assert sum(antal) == len(data['lande']), antal
    assert billede(side) != foer, 'Temakortet tegnes ikke'
    assert 'Temakort' in side.locator('#globus').get_attribute('aria-label')
    expect(aflaesning).to_have_text('Midt på globussen: hav')
    if side.viewport_size['width'] >= 900:
        # Frankrig (1,5–2,1), Spanien (under 1,5), Algeriet (2,1–3) og Niger (5+)
        # får klassernes farver. Lidt tolerance for kantudglatning og skygge.
        for punkt, forventet in [([2.5, 46.5], '#fed976'), ([-3.5, 40.0], '#ffffb2'),
                                 ([3.0, 28.0], '#feb24c'), ([9.0, 17.0], '#bd0026')]:
            fundet = farve_ved(side, punkt)
            afvigelse = max(abs(int(fundet[i:i + 2], 16) - int(forventet[i:i + 2], 16)) for i in (1, 3, 5))
            assert afvigelse <= 12, (punkt, fundet, forventet)
        side.mouse.move(*punkt_paa_skaerm(side, [9.2, 56.1]))
        tfr = f"{data['lande']['208']['noegletal']['tfr']:.2f}".replace('.', ',')
        expect(aflaesning).to_have_text(f'Ved markøren: Danmark: {tfr} børn pr. kvinde')
        side.mouse.move(*punkt_paa_skaerm(side, [-30, 40]))
        expect(aflaesning).to_have_text('Ved markøren: hav')

    # Skift nøgletal med tastaturet: HDI har UNDP's fire grupper og intet årvalg.
    side.locator('#temaindikator').select_option('hdi')
    expect(side.locator('#temaaar')).to_be_hidden()
    expect(raekker).to_have_count(4)
    expect(raekker.first).to_contain_text('lav (under 0,55)')
    # Fødselsrate har årvalg; 2100 er fremskrivning og markeres.
    side.locator('#temaindikator').select_option('cbr')
    expect(side.locator('#temaaar')).to_be_visible()
    aar2023 = [int(t) for t in raekker.locator('small').all_inner_texts()]
    side.locator('#temaaar label', has_text='1950').click()
    expect(side.locator('#temaforklaring')).to_contain_text('1950 · ‰')
    aar1950 = [int(t) for t in raekker.locator('small').all_inner_texts()]
    assert aar1950 != aar2023 and aar1950[-1] > aar2023[-1], (aar1950, aar2023)
    side.locator('#temaaar label', has_text='2100').click()
    expect(side.locator('#temaforklaring')).to_contain_text('2100* fremskrivning')

    bredde, hoejde = side.viewport_size['width'], side.viewport_size['height']
    maal = side.evaluate('''() => {
      const r = document.querySelector('#temasignatur').getBoundingClientRect();
      const knap = document.querySelector('#temaopgave').getBoundingClientRect();
      const kontroller = [...document.querySelectorAll('.betjeningslinje button, .vaerktoejer button')].map(k => k.getBoundingClientRect());
      const overlap = kontroller.some(k => !(k.right <= r.left || k.left >= r.right || k.bottom <= r.top || k.top >= r.bottom));
      return {overlap, knapbund: knap.bottom, vandret: document.documentElement.scrollWidth - innerWidth};
    }''')
    assert not maal['overlap'] and maal['vandret'] == 0, maal
    if bredde >= 900:
        assert maal['knapbund'] <= hoejde, maal
    luk_lag(side)
    side.screenshot(path=str(ud / f'temakort-{bredde}x{hoejde}.png'))

    # Klimazoner og temakort farver begge landene: kun ét ad gangen.
    klima = side.get_by_role('button', name='Klimazoner', exact=True, include_hidden=True)
    aabn_lag(side, klima).click()
    luk_lag(side)
    expect(klima).to_have_attribute('aria-pressed', 'true')
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_hidden()
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(knap).to_have_attribute('aria-pressed', 'true')
    expect(klima).to_have_attribute('aria-pressed', 'false')
    # Valget huskes, når laget slås til igen.
    expect(side.locator('#temaindikator')).to_have_value('cbr')

    # Rangliste i dialogen; et land åbner Demografi.
    side.locator('#temaindikator').select_option('tfr')
    side.locator('#temaopgave').click()
    dialog = side.locator('#udforsker')
    expect(dialog.locator('#dialogtitel')).to_have_text('Undersøg landene på temakort')
    expect(dialog.locator('.rangpar .rangtabel').first.locator('tbody tr')).to_have_count(10)
    foerste = dialog.locator('.rangpar .rangtabel').first.locator('tbody tr').first
    expect(dialog.locator('.rangpar .rangtabel').first.locator('thead th').last).to_have_text('børn pr. kvinde')
    hoejest = max(data['lande'].values(), key=lambda l: l['noegletal']['tfr'])
    expect(foerste).to_contain_text(hoejest['navn'])
    foerste.get_by_role('button').click()
    expect(dialog.locator('#dialogtitel')).to_have_text(hoejest['navn'])
    side.keyboard.press('Escape')
    expect(dialog).to_be_hidden()
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_hidden()


def afproev_temafejl(browser, adresse):
    """Fejler landedata, bliver laget slukket med en forklaring, og et nyt forsøg virker."""
    side = browser.new_page(viewport={'width': 1280, 'height': 577})
    fejl = {'aktiv': True}
    side.route('**/data/demografi.json', lambda r: r.fulfill(status=500, body='') if fejl['aktiv'] else r.continue_())
    side.goto(adresse + '/atlas/')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    knap = side.locator('#temalag')
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(side.locator('#kortstatus')).to_contain_text('Landedata kunne ikke indlæses')
    fejl['aktiv'] = False
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(knap).to_have_attribute('aria-pressed', 'true')
    expect(side.locator('#temasignatur')).to_be_visible()
    side.close()
