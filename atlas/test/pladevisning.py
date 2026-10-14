"""Navne, lokale hastigheder, referencer og fejl uden tab af grundkortet."""
import json
import re
from pathlib import Path
from playwright.sync_api import expect
from piletaster import billede


def afproev_pladevisning(side, ud):
    assert not side.evaluate("performance.getEntriesByType('resource').some(r => r.name.endsWith('/plader.json'))")
    canvas = side.locator('#globus')
    figur = canvas.bounding_box()
    side.locator('#pladelag').click()
    expect(side.locator('#pladelag')).to_have_attribute('aria-pressed', 'true')
    uden = billede(side)
    side.locator('#pladevisning').click()
    expect(side.locator('#pladevisning')).to_have_attribute('aria-expanded', 'true')
    side.locator('#pladenavne').focus()
    foer = billede(side)
    side.keyboard.press('ArrowRight')
    assert billede(side) == foer, 'Piletast i indstillinger drejer globussen'
    side.locator('#pladenavne').check()
    expect(side.locator('#pladenavne')).to_be_enabled()
    side.keyboard.press('Escape')
    expect(side.locator('#pladevisning')).to_have_attribute('aria-expanded', 'false')
    expect(side.locator('#pladevalg')).to_be_hidden()
    navne = billede(side)
    assert navne != uden, 'Pladenavne tegnes ikke'
    assert canvas.bounding_box()['height'] == figur['height'], 'Tilvalg gør figuren mindre'
    expect(canvas).to_have_attribute('aria-label', re.compile('med pladenavne'))

    side.locator('#pladevisning').click()
    side.locator('#pladepile').check()
    expect(side.locator('#pladereference')).to_be_visible()
    expect(side.locator('#pladereference')).to_have_value('EU')
    expect(side.locator('#bevaegelsesnote')).to_contain_text('cm/år ved pilepunktet, relativt til Eurasiske Plade')
    # Panelet skal være inde i vinduet og fri af primære laptopkontroller.
    maal = side.evaluate('''() => {
      const p = document.querySelector('#pladevalg').getBoundingClientRect();
      const k = document.querySelector('.betjeningslinje').getBoundingClientRect();
      return {inde:p.left >= 0 && p.right <= innerWidth && p.top >= 0 && p.bottom <= innerHeight,
        fri:innerWidth < 900 || p.bottom <= k.top, vandret:document.documentElement.scrollWidth-innerWidth};
    }''')
    assert maal['inde'] and maal['fri'] and maal['vandret'] == 0, maal
    w, h = side.viewport_size.values()
    side.screenshot(path=str(ud / f'{w}x{h}-pladevalg.png'))
    side.keyboard.press('Escape')
    expect(side.locator('#pladevisning')).to_have_attribute('aria-expanded', 'false')
    eu = billede(side)
    assert eu != navne, 'Pile og hastigheder tegnes ikke'
    side.locator('#globus').scroll_into_view_if_needed()
    side.screenshot(path=str(ud / f'{w}x{h}-pladebevaegelse.png'))

    side.locator('#pladevisning').click()
    side.locator('#pladereference').select_option('PA')
    expect(side.locator('#bevaegelsesnote')).to_contain_text('Stillehavspladen')
    side.keyboard.press('Escape')
    expect(side.locator('#pladevisning')).to_have_attribute('aria-expanded', 'false')
    assert billede(side) != eu, 'Referenceskift ændrer ikke pilene'
    side.locator('#pladeopgave').click()
    side.locator('.pladetabeloversigt summary').click()
    expect(side.locator('.pladetabel tbody tr')).to_have_count(52)
    expect(side.locator('.pladetabel caption')).to_contain_text('relativt til Stillehavspladen')
    fast = side.locator('.pladetabel tbody tr').filter(has=side.get_by_role('rowheader', name='Stillehavspladen', exact=False))
    expect(fast).to_contain_text('0,0')
    expect(fast).to_contain_text('Står stille')
    usikker = side.locator('.pladetabel tbody tr').filter(has=side.get_by_role('rowheader', name='Shetlandpladen', exact=False))
    expect(usikker).to_contain_text('Usikker model')
    assert side.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert side.locator('.pladetabel').bounding_box()['width'] <= side.locator('#dialogindhold').bounding_box()['width']
    side.screenshot(path=str(ud / f'{w}x{h}-pladetabel.png'))
    side.locator('#luk').click()
    expect(side.locator('#udforsker')).to_be_hidden()

    side.locator('#pladelag').click()
    expect(side.locator('#signatur')).to_be_hidden()
    side.locator('#pladelag').click()
    side.locator('#pladevisning').click()
    expect(side.locator('#pladenavne')).to_be_checked()
    expect(side.locator('#pladepile')).to_be_checked()
    side.locator('#pladereference').select_option('EU')
    expect(side.locator('#pladereference')).to_be_enabled()
    side.locator('#pladepile').uncheck()
    side.locator('#pladenavne').uncheck()
    side.keyboard.press('Escape')
    expect(side.locator('#pladevisning')).to_have_attribute('aria-expanded', 'false')
    assert billede(side) == uden, 'Tegningen gendannes ikke, når navne og pile slås fra'
    # Escape lukker først visning; en efterfølgende Escape forlader fokus.
    side.locator('#fokus').click()
    side.locator('#pladevisning').click()
    side.keyboard.press('Escape')
    expect(side.locator('#pladevisning')).to_have_attribute('aria-expanded', 'false')
    assert side.locator('body').get_attribute('class').split().count('fokus') == 1
    side.keyboard.press('Escape')
    expect(side.locator('#pladevisning')).to_have_attribute('aria-expanded', 'false')
    assert 'fokus' not in side.locator('body').get_attribute('class').split()
    side.locator('#pladelag').click()
    side.locator('#globus').scroll_into_view_if_needed()


def afproev_bevaegelsesfejl(browser, adresse):
    original = json.loads((Path(__file__).parents[1] / 'data/plader.json').read_text())
    for fejltype in ['netvaerk', 'json', 'null_pol', 'udenfor', 'dublet', 'modul']:
        side = browser.new_page(viewport={'width': 1366, 'height': 625})
        fejl = []
        side.on('pageerror', lambda e: fejl.append(str(e)))
        moenster = '**/pladebevaegelse.js' if fejltype == 'modul' else '**/plader.json'
        if fejltype in ['netvaerk', 'modul']: side.route(moenster, lambda r: r.abort())
        elif fejltype == 'json': side.route(moenster, lambda r: r.fulfill(body='{forkert', content_type='application/json'))
        else:
            forkert = json.loads(json.dumps(original))
            if fejltype == 'null_pol': forkert['plader'][0]['pol'][2] = None
            if fejltype == 'udenfor': forkert['plader'][0]['punkt'][1] = 91
            if fejltype == 'dublet': forkert['plader'][0]['id'] = forkert['plader'][1]['id']
            side.route(moenster, lambda r: r.fulfill(json=forkert))
        side.goto(adresse + '/atlas/')
        side.wait_for_function("document.querySelector('#kortstatus').hidden")
        side.locator('#pladelag').click()
        expect(side.locator('#pladelag')).to_have_attribute('aria-pressed', 'true')
        uden = billede(side)
        side.locator('#pladevisning').click()
        side.locator('#pladenavne').check()
        expect(side.locator('#pladevalgstatus')).to_contain_text('Pladegrænser og globus virker stadig')
        expect(side.locator('#pladenavne')).not_to_be_checked()
        expect(side.locator('#pladelag')).to_have_attribute('aria-pressed', 'true')
        side.keyboard.press('Escape')
        expect(side.locator('#pladevisning')).to_have_attribute('aria-expanded', 'false')
        assert billede(side) == uden
        side.locator('[data-drej="oest"]').click()
        assert billede(side) != uden
        side.unroute(moenster)
        if fejltype == 'modul':
            side.reload()
            side.wait_for_function("document.querySelector('#kortstatus').hidden")
            side.locator('#pladelag').click()
        side.locator('#pladevisning').click()
        side.locator('#pladenavne').check()
        expect(side.locator('#pladenavne')).to_be_enabled()
        expect(side.locator('#pladenavne')).to_be_checked()
        expect(side.locator('#pladevalgstatus')).to_be_hidden()
        assert not fejl, fejl
        side.close()


def afproev_bevaegelsestilpasning(browser, adresse):
    side = browser.new_page(viewport={'width': 1366, 'height': 625})
    side.goto(adresse + '/atlas/')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    side.locator('#pladelag').click()
    side.locator('#pladevisning').click()
    side.locator('#pladenavne').check()
    side.locator('#pladepile').check()
    for w, h in [(390, 750), (1536, 730), (640, 625), (1280, 577)]:
        side.set_viewport_size({'width': w, 'height': h})
        side.wait_for_timeout(100)
        expect(side.locator('#pladenavne')).to_be_checked()
        expect(side.locator('#pladepile')).to_be_checked()
        assert side.evaluate('''() => {
          const r = document.querySelector('#pladevalg').getBoundingClientRect();
          return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && document.documentElement.scrollWidth <= innerWidth;
        }''')
    side.keyboard.press('Escape')
    expect(side.locator('#pladevisning')).to_have_attribute('aria-expanded', 'false')
    foer = billede(side)
    side.locator('[data-drej="oest"]').click()
    assert billede(side) != foer
    side.close()
