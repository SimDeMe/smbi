"""Afprøv laget Havbundens alder: data, tegning, aflæsning, profil, egen profil, dialog og fejl."""
import re
import subprocess
from pathlib import Path
from playwright.sync_api import expect
from piletaster import billede

DATA = Path(__file__).parents[1] / 'data'
# Startvisningen: centrum −22°, 42°, zoom 1 (som i seismik.py).
PROJEKTION = '''p => {
  const c = document.querySelector('#globus').getBoundingClientRect();
  const [x, y] = d3.geoOrthographic().translate([c.width / 2, c.height / 2])
    .scale(Math.min(c.width, c.height) * .455).rotate([22, -42])(p);
  return [c.left + x, c.top + y];
}'''


def afproev_havbunddata():
    """Gitteret har den dokumenterede form; modellens tal testes i node."""
    fil = DATA / 'havbundsalder.bin'
    assert fil.exists() and fil.stat().st_size < 500_000, fil.stat().st_size
    assert (DATA / 'havbundsalder.LICENSE').exists() and (DATA / 'havbundsalder.py').exists()
    subprocess.run(['node', str(Path(__file__).with_name('havbundsalder.mjs'))], check=True)


def pixel(side, punkt):
    """Farven midt i et geografisk punkt på kloden (startvisningen)."""
    return side.evaluate('''([p, projektion]) => {
      const xy = eval(projektion)(p);
      const c = document.querySelector('#globus'), r = c.getBoundingClientRect(), t = c.width / r.width;
      return [...c.getContext('2d').getImageData(Math.round((xy[0] - r.left) * t), Math.round((xy[1] - r.top) * t), 1, 1).data].slice(0, 3);
    }''', [punkt, PROJEKTION])


def naer(farve, hex_, tol=40):
    maal = [int(hex_[i:i + 2], 16) for i in (1, 3, 5)]
    return all(abs(a - b) <= tol for a, b in zip(farve, maal))


def afproev_havbund(side, ud):
    knap = side.get_by_role('button', name='Havbundens alder', exact=True)
    bredde, hoejde = side.viewport_size['width'], side.viewport_size['height']
    side.get_by_role('button', name='Nulstil', exact=True).click()
    assert not side.evaluate("performance.getEntriesByType('resource').some(r => /havbundsalder\\.bin$/.test(r.name))"), \
        'Havbundsdata hentes uden tilvalg'
    foer = billede(side)
    knap.focus()
    side.keyboard.press('Enter')
    expect(knap).to_have_attribute('aria-pressed', 'true')
    expect(knap).to_be_focused()
    expect(side.locator('#havbundsignatur')).to_be_visible()
    side.wait_for_timeout(300)
    med = billede(side)
    assert med != foer, 'Havbunden tegnes ikke'
    assert 'havbundens alder efter Seton' in side.locator('#globus').get_attribute('aria-label')
    expect(side.locator('#alderskala .alderfelter i')).to_have_count(11)
    expect(side.locator('#havbundaflaesning')).to_contain_text('Midt på globussen: havbund 48 mio. år gammel – eocæn')

    # Rasteret: rød ved den Midtatlantiske Ryg (40,8° N), gulgrøn ud for Bermuda (ca. 121 mio. år), og
    # landet dækker gitteret. Aflæsningen ved musen bruger samme gitter.
    if bredde >= 900:
        assert naer(pixel(side, [-29.25, 40.84]), '#9e0142'), pixel(side, [-29.25, 40.84])
        assert naer(pixel(side, [-65, 33]), '#e6f598'), pixel(side, [-65, 33])
        assert naer(pixel(side, [2, 47]), '#d9e2bb', 25), 'Frankrig skal være land'
    for punkt, tekst in [([-29.25, 40.84], re.compile(r'Ved markøren: havbund \d,\d mio\. år gammel – kvartær')),
                         ([-60, 30], 'Ved markøren: havbund 96 mio. år gammel – sen kridt'),
                         ([9.5, 56.2], 'Ved markøren: ingen havbundsalder')]:
        side.mouse.move(*side.evaluate(PROJEKTION, punkt))
        expect(side.locator('#havbundaflaesning')).to_contain_text(tekst)
    side.mouse.move(1, 1)

    # Fast profil: graf, måling og markør med tastatur, mus og touch.
    side.locator('#havbundprofil').select_option('sydatlanten')
    graf = side.locator('#profilgraf')
    expect(graf).to_be_visible()
    expect(graf).to_have_attribute('role', 'slider')
    tekst = graf.get_attribute('aria-valuetext')
    cm = float(re.search(r'= (\d+,\d) cm/år', tekst).group(1).replace(',', '.'))
    assert 1.5 <= cm <= 2.6, tekst
    assert 'mod Sydafrika' in tekst
    expect(side.locator('#profilmaaling')).to_have_text(tekst)
    graf.focus()
    zoom = side.locator('#zoomniveau').inner_text()
    profilbillede = billede(side)
    side.keyboard.press('Home')
    expect(side.locator('#profilmaaling')).to_contain_text('mod Brasilien')
    assert graf.get_attribute('aria-valuenow') == '0'
    side.keyboard.press('ArrowRight')
    assert graf.get_attribute('aria-valuenow') == '1', 'Piletast flytter ikke markøren'
    side.keyboard.press('Shift+ArrowRight')
    assert graf.get_attribute('aria-valuenow') == '11'
    assert billede(side) != profilbillede, 'Markøren følger ikke på kloden'
    assert side.locator('#zoomniveau').inner_text() == zoom
    boks = graf.bounding_box()
    if bredde == 390:
        graf.tap(position={'x': boks['width'] * .9, 'y': boks['height'] / 2})
    else:
        side.mouse.click(boks['x'] + boks['width'] * .9, boks['y'] + boks['height'] / 2)
    assert int(graf.get_attribute('aria-valuenow')) > 300, 'Tryk på grafen flytter ikke markøren'
    expect(side.locator('#profilmaaling')).to_contain_text('mod Sydafrika')
    for profil in ['oestpacifik', 'reykjanes', 'indiske', 'nordatlanten']:
        side.locator('#havbundprofil').select_option(profil)
        expect(side.locator('#profilmaaling')).to_contain_text('cm/år')
    side.screenshot(path=str(ud / f'havbund-{bredde}x{hoejde}.png'))

    # Signaturerne overlapper ingen kontroller og giver ingen vandret rulning.
    maal = side.evaluate('''() => {
      const kontroller = [...document.querySelectorAll('.betjeningslinje button, .vaerktoejer button')].map(k => k.getBoundingClientRect());
      const sig = [...document.querySelectorAll('.signatur:not([hidden])')].map(s => s.closest('.signaturer').getBoundingClientRect());
      const overlap = sig.some(r => kontroller.some(k => !(k.right <= r.left || k.left >= r.right || k.bottom <= r.top || k.top >= r.bottom)));
      return {overlap, vandret: document.documentElement.scrollWidth - innerWidth};
    }''')
    assert not maal['overlap'] and maal['vandret'] == 0, maal

    # Egen profil med to tryk midt på havet: landemenuen må ikke åbne.
    side.locator('#havbundprofil').select_option('sydatlanten')
    side.locator('#havbundprofil').select_option('egen')
    expect(side.locator('#profilhjaelp')).to_contain_text('(A)')
    expect(graf).to_be_hidden()
    c = side.locator('#globus').bounding_box()
    midt = [c['x'] + c['width'] / 2, c['y'] + c['height'] / 2]
    r = min(c['width'], c['height']) * .455
    for dx in (-.45, .45):
        if bredde == 390:
            side.locator('#globus').tap(position={'x': c['width'] / 2 + dx * r, 'y': c['height'] / 2})
        else:
            side.mouse.click(midt[0] + dx * r, midt[1])
    expect(graf).to_be_visible()
    expect(side.locator('#profilmaaling')).to_contain_text('cm/år')
    assert not side.evaluate("document.querySelector('#landemenu')?.matches(':popover-open')"), 'Landemenuen åbnede'
    # Og med tastatur: Enter i sigtekornet, drej, Enter igen.
    side.locator('#profilpunkter').click()
    expect(side.locator('#profilhjaelp')).to_be_visible()
    side.locator('#globus').focus()
    side.keyboard.press('Enter')
    expect(side.locator('#profilhjaelp')).to_contain_text('A er sat')
    for _ in range(3):
        side.keyboard.press('ArrowRight')
    side.keyboard.press('Enter')
    expect(graf).to_be_visible()
    expect(side.locator('#profilmaaling')).to_contain_text('km fra ryggen')

    # Dialogen: tekstalternativ, måling, opgaver, kilder og genvej.
    side.locator('#havbundopgave').click()
    expect(side.locator('#dialogtitel')).to_have_text('Undersøg havbundens alder')
    assert side.locator('.opgaveliste li').count() >= 7
    expect(side.locator('#dialogindhold')).to_contain_text('0,1 cm/år')
    expect(side.locator('#dialogindhold a[href="https://doi.org/10.1029/2020GC009214"]')).to_have_count(1)
    side.get_by_role('button', name='Vis Sydatlanten med profil og pladegrænser').click()
    expect(side.locator('#udforsker')).to_be_hidden()
    expect(side.locator('#pladelag')).to_have_attribute('aria-pressed', 'true')
    expect(side.locator('#havbundprofil')).to_have_value('sydatlanten')
    expect(graf).to_be_focused()

    # Slå fra igen: profil og lag forsvinder, og kloden er som før.
    side.locator('#pladelag').click()
    knap.click()
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(side.locator('#havbundsignatur')).to_be_hidden()
    expect(side.locator('#havbundprofil')).to_have_value('')
    side.get_by_role('button', name='Nulstil', exact=True).click()
    assert billede(side) == foer, 'Laget efterlader spor'


def afproev_havbundfejl(browser, adresse):
    """Manglende eller beskadigede data: laget slås ikke til, og et nyt forsøg virker."""
    for fejltype in ['http', 'ugyldig']:
        side = browser.new_page(viewport={'width': 1366, 'height': 625})
        fejl = []
        side.on('pageerror', lambda e: fejl.append(str(e)))
        if fejltype == 'http':
            side.route('**/havbundsalder.bin', lambda r: r.fulfill(status=404, body='mangler'))
        else:
            side.route('**/havbundsalder.bin', lambda r: r.fulfill(status=200, body=bytes([31, 139, 8, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0])))
        side.goto(adresse + '/atlas/')
        side.wait_for_function("document.querySelector('#kortstatus').hidden")
        knap = side.get_by_role('button', name='Havbundens alder', exact=True)
        knap.click()
        expect(side.locator('#kortstatus')).to_contain_text('Havbundens alder kunne ikke indlæses')
        expect(knap).to_have_attribute('aria-pressed', 'false')
        expect(side.locator('#havbundsignatur')).to_be_hidden()
        side.unroute('**/havbundsalder.bin')
        knap.click()
        expect(knap).to_have_attribute('aria-pressed', 'true')
        expect(side.locator('#kortstatus')).to_be_hidden()
        assert not fejl, fejl
        side.close()
