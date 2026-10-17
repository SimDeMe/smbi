"""Afprøv laget Nedbør: data, tegning over hav og land, måneder, afspilning, aflæsning, dialog og fejl."""
import re
import subprocess
from pathlib import Path
from playwright.sync_api import expect
from piletaster import billede
from havbund import PROJEKTION, pixel, naer

DATA = Path(__file__).parents[1] / 'data'


def afproev_nedboerdata():
    """Gitteret har den dokumenterede form; modellens tal testes i node."""
    fil = DATA / 'nedboer.bin'
    assert fil.exists() and fil.stat().st_size < 300_000, fil.stat().st_size
    assert (DATA / 'nedboer.LICENSE').exists() and (DATA / 'nedboer.py').exists()
    subprocess.run(['node', str(Path(__file__).with_name('nedboer.mjs'))], check=True)


def afproev_nedboer(side, ud):
    knap = side.get_by_role('button', name='Nedbør måned for måned', exact=True)
    bredde, hoejde = side.viewport_size['width'], side.viewport_size['height']
    side.get_by_role('button', name='Nulstil', exact=True).click()
    assert not side.evaluate("performance.getEntriesByType('resource').some(r => /nedboer\\.bin$/.test(r.name))"), \
        'Nedbørsdata hentes uden tilvalg'
    foer = billede(side)
    # Havbunden slås fra, når nedbøren slås til (begge farver havet).
    side.locator('#havbundlag').click()
    expect(side.locator('#havbundlag')).to_have_attribute('aria-pressed', 'true')
    knap.focus()
    side.keyboard.press('Enter')
    expect(knap).to_have_attribute('aria-pressed', 'true')
    expect(knap).to_be_focused()
    expect(side.locator('#havbundlag')).to_have_attribute('aria-pressed', 'false')
    expect(side.locator('#havbundsignatur')).to_be_hidden()
    expect(side.locator('#nedboersignatur')).to_be_visible()
    expect(side.locator('#nedboermaaned')).to_have_text('januar')
    expect(side.locator('#nedboerskala .alderfelter i')).to_have_count(10)
    side.wait_for_timeout(300)
    januar = billede(side)
    assert januar != foer, 'Nedbøren tegnes ikke'
    assert 'Nedbør i januar, middel 1991–2020 efter GPCP' in side.locator('#globus').get_attribute('aria-label')
    expect(side.locator('#nedboeraflaesning')).to_contain_text('Midt på globussen:')
    expect(side.locator('#nedboeraflaesning')).to_contain_text('i januar')
    expect(side.locator('#nedboerdiagram rect')).to_have_count(12)

    # Rasteret dækker både hav og land: Sahara er sandfarvet (under 10 mm), og
    # Nordatlanten blå i januar. Aflæsningen ved musen bruger samme gitter.
    if bredde >= 900:
        assert naer(pixel(side, [15, 24]), '#f2e3bd', 30), pixel(side, [15, 24])
        assert not naer(pixel(side, [15, 24]), '#d9e2bb', 12), 'Sahara har landets grundfarve'
        assert naer(pixel(side, [-35, 52]), '#2c7cba', 45) or naer(pixel(side, [-35, 52]), '#3a9bb0', 45), pixel(side, [-35, 52])
    side.mouse.move(*side.evaluate(PROJEKTION, [15, 24]))
    expect(side.locator('#nedboeraflaesning')).to_have_text(re.compile(r'Ved markøren: (under 1|\d) mm i januar · \d\d mm på et år'))
    side.mouse.move(*side.evaluate(PROJEKTION, [12.6, 55.7]))
    expect(side.locator('#nedboeraflaesning')).to_have_text(re.compile(r'Ved markøren: [6-9]\d mm i januar · [89]\d\d mm på et år'))
    assert side.locator('#nedboerdiagram rect').nth(0).get_attribute('fill') == '#17211f', 'Januar er ikke fremhævet'

    # Skyderen: piletaster og Home/End skifter måned, tegning og aflæsning.
    skyder = side.locator('#nedboerskyder')
    skyder.focus()
    for _ in range(6):
        side.keyboard.press('ArrowRight')
    expect(side.locator('#nedboermaaned')).to_have_text('juli')
    expect(skyder).to_have_attribute('aria-valuetext', 'juli')
    expect(side.locator('#nedboeraflaesning')).to_have_text(re.compile(r'Ved markøren: [6-9]\d mm i juli · [89]\d\d mm på et år'))
    assert side.locator('#nedboerdiagram rect').nth(6).get_attribute('fill') == '#17211f'
    juli = billede(side)
    assert juli != januar, 'Kloden skifter ikke med måneden'
    if bredde >= 900:
        assert not naer(pixel(side, [2.1, 13.5]), '#f2e3bd', 30), 'Sahel er tør i juli'
    assert 'Nedbør i juli' in side.locator('#globus').get_attribute('aria-label')
    assert '22° nord' in side.locator('#globus').get_attribute('aria-label')
    side.keyboard.press('Home')
    expect(side.locator('#nedboermaaned')).to_have_text('januar')
    side.keyboard.press('End')
    expect(side.locator('#nedboermaaned')).to_have_text('december')
    side.mouse.move(1, 1)

    # Zenitlinjen kan slås fra og til.
    zenit = side.locator('#nedboerzenit')
    med = billede(side)
    zenit.uncheck()
    assert billede(side) != med, 'Zenitlinjen forsvinder ikke'
    assert 'zenit' not in side.locator('#globus').get_attribute('aria-label')
    zenit.check()

    # Afspil: månederne skifter af sig selv, og pause stopper dem.
    spil = side.locator('#nedboerspil')
    spil.click()
    expect(spil).to_have_attribute('aria-pressed', 'true')
    expect(spil).to_contain_text('Pause')
    expect(side.locator('#nedboermaaned')).to_have_text('januar')
    expect(side.locator('#nedboermaaned')).to_have_text('februar', timeout=4000)
    spil.click()
    expect(spil).to_have_attribute('aria-pressed', 'false')
    stoppet = side.locator('#nedboermaaned').inner_text()
    side.wait_for_timeout(1700)
    assert side.locator('#nedboermaaned').inner_text() == stoppet, 'Afspilningen stopper ikke'
    # Skyderen stopper også afspilningen.
    spil.click()
    skyder.focus()
    side.keyboard.press('Home')
    expect(spil).to_have_attribute('aria-pressed', 'false')
    side.wait_for_timeout(1700)
    expect(side.locator('#nedboermaaned')).to_have_text('januar')
    side.screenshot(path=str(ud / f'nedboer-{bredde}x{hoejde}.png'))

    # Signaturen overlapper ingen kontroller og giver ingen vandret rulning.
    maal = side.evaluate('''() => {
      const kontroller = [...document.querySelectorAll('.betjeningslinje button, .vaerktoejer button')].map(k => k.getBoundingClientRect());
      const sig = [...document.querySelectorAll('.signatur:not([hidden])')].map(s => s.closest('.signaturer').getBoundingClientRect());
      const overlap = sig.some(r => kontroller.some(k => !(k.right <= r.left || k.left >= r.right || k.bottom <= r.top || k.top >= r.bottom)));
      const lag = [...document.querySelectorAll('.lagknap')].map(k => k.getBoundingClientRect().top);
      return {overlap, vandret: document.documentElement.scrollWidth - innerWidth, lagraekker: new Set(lag.map(Math.round)).size};
    }''')
    assert not maal['overlap'] and maal['vandret'] == 0, maal
    if bredde >= 900 or bredde <= 500:
        assert maal['lagraekker'] == (1 if bredde >= 900 else 2), maal

    # Klimazoner og nedbør udelukker hinanden; pladegrænser kan ligge ovenpå.
    side.locator('#klimalag').click()
    expect(side.locator('#klimalag')).to_have_attribute('aria-pressed', 'true')
    expect(knap).to_have_attribute('aria-pressed', 'false')
    knap.click()
    expect(knap).to_have_attribute('aria-pressed', 'true')
    expect(side.locator('#klimalag')).to_have_attribute('aria-pressed', 'false')
    side.locator('#pladelag').click()
    expect(side.locator('#pladelag')).to_have_attribute('aria-pressed', 'true')
    expect(knap).to_have_attribute('aria-pressed', 'true')
    side.locator('#pladelag').click()

    # Dialogen: tekstalternativ, opgaver, kilder og genvej.
    side.locator('#nedboeropgave').click()
    expect(side.locator('#dialogtitel')).to_have_text('Undersøg nedbøren måned for måned')
    assert side.locator('.opgaveliste li').count() >= 8
    expect(side.locator('#dialogindhold')).to_contain_text('intertropiske konvergenszone')
    expect(side.locator('#dialogindhold a[href="https://doi.org/10.7289/V56971M6"]')).to_have_count(1)
    side.get_by_role('button', name='Vis Afrika og Sydasien i juli med nedbør').click()
    expect(side.locator('#udforsker')).to_be_hidden()
    expect(side.locator('#nedboermaaned')).to_have_text('juli')
    expect(spil).to_be_focused()

    # Slå fra igen: signaturen forsvinder, og kloden er som før.
    knap.click()
    expect(knap).to_have_attribute('aria-pressed', 'false')
    expect(side.locator('#nedboersignatur')).to_be_hidden()
    side.get_by_role('button', name='Nulstil', exact=True).click()
    assert billede(side) == foer, 'Laget efterlader spor'


def afproev_nedboerfejl(browser, adresse):
    """Manglende eller beskadigede data: laget slås ikke til, og et nyt forsøg virker."""
    for fejltype in ['http', 'ugyldig']:
        side = browser.new_page(viewport={'width': 1366, 'height': 625})
        fejl = []
        side.on('pageerror', lambda e: fejl.append(str(e)))
        if fejltype == 'http':
            side.route('**/nedboer.bin', lambda r: r.fulfill(status=404, body='mangler'))
        else:
            side.route('**/nedboer.bin', lambda r: r.fulfill(status=200, body=bytes([31, 139, 8, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0])))
        side.goto(adresse + '/atlas/')
        side.wait_for_function("document.querySelector('#kortstatus').hidden")
        # Et lag, der allerede er tændt, bliver stående, når nedbøren fejler.
        side.locator('#havbundlag').click()
        expect(side.locator('#havbundlag')).to_have_attribute('aria-pressed', 'true')
        knap = side.get_by_role('button', name='Nedbør måned for måned', exact=True)
        knap.click()
        expect(side.locator('#kortstatus')).to_contain_text('Nedbørsdata kunne ikke indlæses')
        expect(knap).to_have_attribute('aria-pressed', 'false')
        expect(side.locator('#nedboersignatur')).to_be_hidden()
        expect(side.locator('#havbundlag')).to_have_attribute('aria-pressed', 'true')
        side.unroute('**/nedboer.bin')
        knap.click()
        expect(knap).to_have_attribute('aria-pressed', 'true')
        expect(side.locator('#kortstatus')).to_be_hidden()
        expect(side.locator('#havbundlag')).to_have_attribute('aria-pressed', 'false')
        assert not fejl, fejl
        side.close()


def afproev_nedboerglat(browser, adresse):
    """Afspilningen glider jævnt gennem året: tiden står aldrig stille mellem månederne."""
    side = browser.new_page(viewport={'width': 1366, 'height': 625})
    fejl = []
    side.on('pageerror', lambda e: fejl.append(str(e)))
    side.goto(adresse + '/atlas/')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    side.get_by_role('button', name='Nedbør måned for måned', exact=True).click()
    expect(side.locator('#nedboersignatur')).to_be_visible()
    side.locator('#nedboerspil').click()
    # Tilstanden (måned + andel) aflæses i 90 frames, ca. 1,5 s: den skal vokse i
    # hver frame (ingen pause) og aldrig springe mere end en lille brøkdel.
    forloeb = side.evaluate('''async () => {
      const m = await import('./nedboer.js'), ud = [];
      for (let i = 0; i < 90; i++) {
        await new Promise(r => requestAnimationFrame(r));
        ud.push(m.tilstand.fra + m.tilstand.t);
      }
      return ud;
    }''')
    skridt = [b - a for a, b in zip(forloeb, forloeb[1:])]
    assert all(s >= 0 for s in skridt), skridt
    assert sum(1 for s in skridt if s == 0) < 10, f'Animationen holder pause: {skridt}'
    assert max(skridt) < .1, f'Animationen springer: {max(skridt)}'
    assert forloeb[-1] - forloeb[0] > .3, 'Animationen kommer ikke videre'
    expect(side.locator('#nedboermaaned')).to_have_text('februar', timeout=3000)
    expect(side.locator('#nedboeraflaesning')).to_contain_text('i februar')
    side.locator('#nedboerspil').click()
    tilstand = side.evaluate("import('./nedboer.js').then(m => ({...m.tilstand}))")
    assert tilstand['t'] == 1 and tilstand['spiller'] is False, tilstand
    assert side.locator('#nedboermaaned').inner_text() == ['januar', 'februar', 'marts'][tilstand['vist']], tilstand
    assert not fejl, fejl
    side.close()
