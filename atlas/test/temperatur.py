"""Afprøv Temperaturstigning: raster, periodeskyder, afspilning, aflæsning og samspil."""
from lagmenu_hjaelp import aabn_lag, luk_lag
from playwright.sync_api import expect
from piletaster import billede
from klimalag import punkt_paa_skaerm


def afproev_temperatur(side, ud):
    luk_lag(side)
    knap, signatur = side.locator('#temperaturlag'), side.locator('#temperatursignatur')
    aflaesning, skyder = side.locator('#temperaturaflaesning'), side.locator('#temperaturskyder')
    side.get_by_role('button', name='Nulstil', exact=True).click()
    foer = billede(side)
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(knap).to_have_attribute('aria-pressed', 'true')
    expect(signatur).to_be_visible()
    expect(side.locator('#temperaturperiode')).to_have_text('2020–2025')
    expect(side.locator('#temperaturglobal')).to_contain_text('Globalt middel ca. +1,1 °C')
    assert billede(side) != foer, 'Temperaturen tegnes ikke'
    expect(aflaesning).to_contain_text('Midt på globussen: +')
    assert 'GISTEMP' in side.locator('#globus').get_attribute('aria-label')
    nu = billede(side)
    # Skyderen skifter periode; 1900–1909 var koldere end 1951–1980.
    skyder.focus()
    side.keyboard.press('Home')
    expect(side.locator('#temperaturperiode')).to_have_text('1900–1909')
    expect(skyder).to_have_attribute('aria-valuetext', '1900–1909')
    expect(side.locator('#temperaturglobal')).to_contain_text('−0,3 °C')
    assert billede(side) != nu, 'Periodeskift tegner ikke om'
    if side.viewport_size['width'] >= 900:
        side.mouse.move(*punkt_paa_skaerm(side, [20, 75]))   # Barentshavet: Arktis opvarmes mest
        side.keyboard.press('End')
        expect(aflaesning).to_contain_text('Ved markøren: +')
        side.mouse.move(*punkt_paa_skaerm(side, [-30, 40]))
    # Afspil går frem gennem perioderne og kan stoppes.
    side.keyboard.press('Home')
    side.locator('#temperaturspil').click()
    expect(side.locator('#temperaturspil')).to_have_attribute('aria-pressed', 'true')
    expect(side.locator('#temperaturperiode')).to_have_text('1910–1919', timeout=4000)
    side.locator('#temperaturspil').click()
    expect(side.locator('#temperaturspil')).to_have_attribute('aria-pressed', 'false')
    skyder.fill('12')
    expect(side.locator('#temperaturperiode')).to_have_text('2020–2025')
    maal = side.evaluate('''() => {
      const r = document.querySelector('#temperatursignatur').getBoundingClientRect();
      const knap = document.querySelector('#temperaturopgave').getBoundingClientRect();
      const kontroller = [...document.querySelectorAll('.betjeningslinje button, .vaerktoejer button')].map(k => k.getBoundingClientRect());
      const overlap = kontroller.some(k => !(k.right <= r.left || k.left >= r.right || k.bottom <= r.top || k.top >= r.bottom));
      return {overlap, knapbund: knap.bottom, vandret: document.documentElement.scrollWidth - innerWidth};
    }''')
    assert not maal['overlap'] and maal['vandret'] == 0, maal
    if side.viewport_size['width'] >= 900:
        assert maal['knapbund'] <= side.viewport_size['height'], maal
    side.screenshot(path=str(ud / f"temperatur-{side.viewport_size['width']}x{side.viewport_size['height']}.png"))
    # Nedbør og temperatur dækker begge hav og land: kun ét ad gangen.
    nedboer = side.locator('#nedboerlag')
    aabn_lag(side, nedboer).click()
    luk_lag(side)
    expect(nedboer).to_have_attribute('aria-pressed', 'true')
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_hidden()
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(nedboer).to_have_attribute('aria-pressed', 'false')
    # Dialogen.
    side.locator('#temperaturopgave').click()
    dialog = side.locator('#udforsker')
    expect(dialog.locator('#dialogtitel')).to_have_text('Undersøg temperaturstigningen')
    expect(dialog.locator('.opgaveliste li')).to_have_count(7)
    side.keyboard.press('Escape')
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_hidden()


def afproev_temperaturfejl(browser, adresse):
    """Fejler temperaturdata, bliver laget slukket med en forklaring, og et nyt forsøg virker."""
    side = browser.new_page(viewport={'width': 1280, 'height': 577})
    fejl = {'aktiv': True}
    side.route('**/data/temperatur.bin', lambda r: r.fulfill(status=500, body='') if fejl['aktiv'] else r.continue_())
    side.goto(adresse + '/atlas/')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    knap = side.locator('#temperaturlag')
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(side.locator('#kortstatus')).to_contain_text('Temperaturdata kunne ikke indlæses')
    fejl['aktiv'] = False
    aabn_lag(side, knap).click()
    luk_lag(side)
    expect(knap).to_have_attribute('aria-pressed', 'true')
    expect(side.locator('#temperatursignatur')).to_be_visible()
    side.close()
