"""Afprøv #48: valgfrit pladegrænselag, signatur, opgave og datafejl."""
from playwright.sync_api import expect
from piletaster import billede


def afproev_pladelag(side, ud):
    knap = side.get_by_role('button', name='Pladegrænser', exact=True)
    signatur = side.locator('#signatur')
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_hidden()
    foer = billede(side)
    knap.click()
    expect(knap).to_have_attribute('aria-pressed', 'true')
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
    knap.click()
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(signatur).to_be_hidden()
    assert billede(side) == foer, 'Globussen er ikke som før laget'


def afproev_pladefejl(browser, adresse):
    side = browser.new_page()
    side.route('**/pladegraenser.json', lambda r: r.abort())
    side.goto(adresse + '/atlas/')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    knap = side.get_by_role('button', name='Pladegrænser', exact=True)
    knap.click()
    expect(side.locator('#kortstatus')).to_contain_text('Pladegrænserne kunne ikke indlæses')
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(knap).to_be_enabled()
    expect(side.locator('#signatur')).to_be_hidden()
    foer = billede(side)
    side.get_by_role('button', name='Drej mod øst', exact=True).click()
    assert billede(side) != foer, 'Globussen virker ikke efter datafejl'
    side.close()
