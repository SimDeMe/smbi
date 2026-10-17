"""Afprøv Klimaforandringer: nationale og forbrugsbaserede CO₂-udledninger."""
from lagmenu_hjaelp import aabn_lag, luk_lag
import json
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from playwright.sync_api import expect
from piletaster import billede
from klimalag import punkt_paa_skaerm
from temakort import farve_ved

DATA = Path(__file__).parents[1] / 'data'
# Som toLocaleString: halvdele rundes op (4,85 → 4,9).
tal = lambda v, d=1: str(Decimal(str(v)).quantize(Decimal(1).scaleb(-d), ROUND_HALF_UP)).replace('.', ',')


def afproev_udledning(side, ud):
    luk_lag(side)
    data = json.loads((DATA / 'udledning.json').read_text())
    dk = data['lande']['208']
    national, forbrug = side.locator('#nationallag'), side.locator('#forbrugslag')
    signatur = side.locator('#udledningsignatur')
    aflaesning = side.locator('#udledningaflaesning')
    raekker = side.locator('#udledningklasser li:not(.ingen)')
    side.get_by_role('button', name='Nulstil', exact=True).click()
    foer = billede(side)
    aabn_lag(side, national).focus()
    side.keyboard.press('Enter')
    expect(national).to_have_attribute('aria-pressed', 'true')
    expect(national).to_be_focused()
    expect(side.locator('#lagmenu-status')).to_have_text('Viser: Nationale udledninger')
    luk_lag(side)
    expect(signatur).to_be_visible()
    expect(side.locator('#udledningtitel')).to_have_text('Nationale CO₂-udledninger')
    expect(side.locator('#udledningforklaring')).to_contain_text('2023 · t CO₂ pr. indbygger')
    # Forskellen fra national findes kun på det forbrugsbaserede lag.
    expect(side.locator('[data-kun-forbrug]')).to_be_hidden()
    expect(raekker).to_have_count(7)
    antal = [int(t) for t in raekker.locator('small').all_inner_texts()]
    assert sum(antal) == sum(l['nc'][3] is not None for l in data['lande'].values()), antal
    assert billede(side) != foer, 'Udledningerne tegnes ikke'
    assert 'CO₂ pr. indbygger' in side.locator('#globus').get_attribute('aria-label')
    expect(aflaesning).to_have_text('Midt på globussen: hav')
    if side.viewport_size['width'] >= 900:
        # Frankrig (under 5 t), Algeriet (2,5–5) og Niger (under 1) i 2023.
        for punkt, forventet in [([2.5, 46.5], '#feb24c'), ([3.0, 28.0], '#feb24c'), ([9.0, 17.0], '#ffffb2')]:
            fundet = farve_ved(side, punkt)
            afvigelse = max(abs(int(fundet[i:i + 2], 16) - int(forventet[i:i + 2], 16)) for i in (1, 3, 5))
            assert afvigelse <= 12, (punkt, fundet, forventet)
        side.mouse.move(*punkt_paa_skaerm(side, [9.2, 56.1]))
        expect(aflaesning).to_have_text(f"Ved markøren: Danmark: {tal(dk['nc'][3])} t CO₂ pr. indbygger (forbrug {tal(dk['fc'][3])})")
        side.locator('#udledningaar label', has_text='1990').click()
        side.mouse.move(*punkt_paa_skaerm(side, [9.2, 56.1]))
        expect(aflaesning).to_have_text(f"Ved markøren: Danmark: {tal(dk['nc'][0])} t CO₂ pr. indbygger (forbrug {tal(dk['fc'][0])})")
        side.locator('#udledningaar label', has_text='2023').click()
        side.mouse.move(*punkt_paa_skaerm(side, [-30, 40]))
        expect(aflaesning).to_have_text('Ved markøren: hav')

    # I alt: andre klasser, samme år.
    side.locator('#udledningmaal label', has_text='I alt').click()
    expect(side.locator('#udledningforklaring')).to_contain_text('2023 · mio. t CO₂')
    expect(raekker.last).to_contain_text('1.000 og derover')

    # Skift til forbrug: det nationale lag slukkes, signaturen bliver, målet huskes.
    aabn_lag(side, forbrug).click()
    luk_lag(side)
    expect(forbrug).to_have_attribute('aria-pressed', 'true')
    expect(national).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_visible()
    expect(side.locator('#udledningtitel')).to_have_text('Forbrugsbaserede CO₂-udledninger')
    expect(side.locator('[name="udledningmaal"][value="alt"]')).to_be_checked()
    antal = [int(t) for t in raekker.locator('small').all_inner_texts()]
    assert sum(antal) == sum(l['f'][3] is not None for l in data['lande'].values()), antal
    side.locator('#udledningmaal label', has_text='Forskel').click()
    expect(raekker).to_have_count(6)
    expect(raekker.first).to_contain_text('under −25')
    if side.viewport_size['width'] >= 900:
        side.mouse.move(*punkt_paa_skaerm(side, [9.2, 56.1]))
        forskel = round(100 * (dk['f'][3] - dk['n'][3]) / dk['n'][3])
        expect(aflaesning).to_contain_text(f'Ved markøren: Danmark: +{forskel} %')
        side.mouse.move(*punkt_paa_skaerm(side, [-30, 40]))

    bredde, hoejde = side.viewport_size['width'], side.viewport_size['height']
    maal = side.evaluate('''() => {
      const r = document.querySelector('#udledningsignatur').getBoundingClientRect();
      const knap = document.querySelector('#udledningopgave').getBoundingClientRect();
      const kontroller = [...document.querySelectorAll('.betjeningslinje button, .vaerktoejer button')].map(k => k.getBoundingClientRect());
      const overlap = kontroller.some(k => !(k.right <= r.left || k.left >= r.right || k.bottom <= r.top || k.top >= r.bottom));
      return {overlap, knapbund: knap.bottom, vandret: document.documentElement.scrollWidth - innerWidth};
    }''')
    assert not maal['overlap'] and maal['vandret'] == 0, maal
    if bredde >= 900:
        assert maal['knapbund'] <= hoejde, maal
    side.screenshot(path=str(ud / f'udledning-{bredde}x{hoejde}.png'))

    # Tilbage til nationalt: »Forskel fra national« findes ikke dér og falder tilbage til pr. indbygger.
    aabn_lag(side, national).click()
    luk_lag(side)
    expect(side.locator('[data-kun-forbrug]')).to_be_hidden()
    expect(side.locator('[name="udledningmaal"][value="pr"]')).to_be_checked()

    # Temakortet og udledningerne farver begge landene: kun ét ad gangen.
    tema = side.locator('#temalag')
    aabn_lag(side, tema).click()
    luk_lag(side)
    expect(tema).to_have_attribute('aria-pressed', 'true')
    expect(national).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_hidden()
    aabn_lag(side, national).click()
    luk_lag(side)
    expect(tema).to_have_attribute('aria-pressed', 'false')
    expect(side.locator('#temasignatur')).to_be_hidden()

    # Rangliste i dialogen.
    side.locator('#udledningopgave').click()
    dialog = side.locator('#udforsker')
    expect(dialog.locator('#dialogtitel')).to_have_text('Undersøg landenes CO₂-udledning')
    tabel = dialog.locator('.rangpar .rangtabel').first
    expect(tabel.locator('tbody tr')).to_have_count(10)
    expect(tabel.locator('thead th').last).to_have_text('t CO₂ pr. indbygger')
    hoejest = max(data['lande'].values(), key=lambda l: l['nc'][3] or 0)
    expect(tabel.locator('tbody tr').first).to_contain_text(hoejest['navn'])
    side.keyboard.press('Escape')
    expect(dialog).to_be_hidden()
    aabn_lag(side, national).click()
    luk_lag(side)
    expect(national).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_hidden()


def afproev_udledningsfejl(browser, adresse):
    """Fejler udledningsdata, bliver laget slukket med en forklaring, og et nyt forsøg virker."""
    side = browser.new_page(viewport={'width': 1280, 'height': 577})
    fejl = {'aktiv': True}
    side.route('**/data/udledning.json', lambda r: r.fulfill(status=500, body='') if fejl['aktiv'] else r.continue_())
    side.goto(adresse + '/atlas/')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    knap = side.locator('#forbrugslag')
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(side.locator('#kortstatus')).to_contain_text('Udledningsdata kunne ikke indlæses')
    fejl['aktiv'] = False
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(knap).to_have_attribute('aria-pressed', 'true')
    expect(side.locator('#udledningsignatur')).to_be_visible()
    side.close()
