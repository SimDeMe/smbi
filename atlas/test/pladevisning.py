"""Navne, relative grænsehastigheder og fejl uden tab af grundkortet."""
from lagmenu_hjaelp import aabn_lag, luk_lag
import json
import re
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from playwright.sync_api import expect
from piletaster import billede


def afproev_pladevisning(side, ud):
    luk_lag(side)
    assert not side.evaluate("performance.getEntriesByType('resource').some(r => r.name.endsWith('/plader.json'))")
    assert not side.evaluate("performance.getEntriesByType('resource').some(r => r.name.endsWith('/graensehastigheder.json'))")
    canvas = side.locator('#globus')
    # Læs de faktisk tegnede ankre/tal. Det beskytter mod en regression,
    # hvor tal igen vises inde på pladerne frem for ved kildegrænserne.
    side.evaluate('''() => {
      const p = CanvasRenderingContext2D.prototype;
      const clear = p.clearRect, arc = p.arc, text = p.fillText;
      window.graensepunkter = [];
      p.clearRect = function(...a) { if(this.canvas.id === 'globus') window.graensepunkter = []; return clear.apply(this,a); };
      p.arc = function(x,y,r,...a) { if(this.canvas.id === 'globus' && r === 2) window.graensepunkter.push({x,y}); return arc.call(this,x,y,r,...a); };
      p.fillText = function(t,...a) { if(this.canvas.id === 'globus' && t.endsWith('cm/år')) window.graensepunkter.at(-1).tekst = t; return text.call(this,t,...a); };
      window.gendanCanvasproeve = () => Object.assign(p,{clearRect:clear,arc,fillText:text});
    }''')
    figur = canvas.bounding_box()
    aabn_lag(side, side.locator('#pladelag')).click()
    luk_lag(side)
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
    expect(side.locator('#graenseforklaring')).to_be_visible()
    assert side.locator('#pladereference').count() == 0
    expect(side.locator('#bevaegelsesnote')).to_contain_text('cm/år mellem pladerne')
    expect(side.locator('#bevaegelsesnote')).to_contain_text('samlet åbning/lukning på tværs')
    # Panelet skal være inde i vinduet og fri af primære laptopkontroller.
    maal = side.evaluate('''() => {
      const p = document.querySelector('#pladevalg').getBoundingClientRect();
      const k = document.querySelector('.betjeningslinje').getBoundingClientRect();
      return {inde:p.left >= 0 && p.right <= innerWidth && p.top >= 0 && p.bottom <= innerHeight,
        fri:innerWidth < 900 || p.bottom <= k.top, vandret:document.documentElement.scrollWidth-innerWidth};
    }''')
    assert maal['inde'] and maal['fri'] and maal['vandret'] == 0, maal
    w, h = side.viewport_size.values()
    luk_lag(side)
    side.screenshot(path=str(ud / f'{w}x{h}-pladevalg.png'))
    side.keyboard.press('Escape')
    expect(side.locator('#pladevisning')).to_have_attribute('aria-expanded', 'false')
    eu = billede(side)
    assert eu != navne, 'Pile og hastigheder tegnes ikke'
    kildepunkter = json.loads((Path(__file__).parents[1] / 'data/graensehastigheder.json').read_text())['punkter']
    projektioner = side.evaluate('''punkter => {
      const c = document.querySelector('#globus');
      const proj = d3.geoOrthographic().translate([c.clientWidth/2,c.clientHeight/2]).scale(Math.min(c.clientWidth,c.clientHeight)*.455).rotate([22,-42]);
      return punkter.filter(p => !p[1].includes('SL') && d3.geoDistance([-22,42],p.slice(4,6)) < Math.PI/2-.25)
        .map(p => ({p,xy:proj(p.slice(4,6))}));
    }''', kildepunkter)
    tegnede = side.evaluate('window.graensepunkter')
    assert tegnede, tegnede
    for tegnet in tegnede:
        match = min(projektioner, key=lambda k: (k['xy'][0]-tegnet['x'])**2 + (k['xy'][1]-tegnet['y'])**2)
        assert abs(match['xy'][0]-tegnet['x']) < .001 and abs(match['xy'][1]-tegnet['y']) < .001
        p = match['p']
        transform = p[2] in ['OTF', 'CTF']
        mm = p[8] if transform else p[7]
        cm = abs(Decimal(str(mm)) / 10)
        tal = '<0,1' if 0 < cm < Decimal('.05') else str(cm.quantize(Decimal('.1'), rounding=ROUND_HALF_UP)).replace('.', ',')
        assert tegnet['tekst'] == ('≈ ' if p[3] else '') + f'{tal} cm/år', (tegnet, p)
    side.locator('#globus').scroll_into_view_if_needed()
    side.evaluate('window.gendanCanvasproeve()')
    luk_lag(side)
    side.screenshot(path=str(ud / f'{w}x{h}-pladebevaegelse.png'))

    # Grænsehastigheder virker også med pladenavne slået fra.
    side.locator('#pladevisning').click()
    side.locator('#pladenavne').uncheck()
    side.keyboard.press('Escape')
    expect(side.locator('#pladevisning')).to_have_attribute('aria-expanded', 'false')
    assert billede(side) != uden
    side.locator('#pladevisning').click()
    side.locator('#pladenavne').check()
    side.keyboard.press('Escape')
    expect(side.locator('#pladevisning')).to_have_attribute('aria-expanded', 'false')
    side.locator('#pladeopgave').click()
    side.locator('.pladetabeloversigt summary').click()
    expect(side.locator('#pladenavnetabel tbody tr')).to_have_count(52)
    side.locator('.graenseoversigt summary').click()
    tabel = side.locator('#graensehastighedstabel')
    expect(tabel.locator('caption')).to_contain_text('ikke halvspredning')
    expect(tabel.locator('[data-trin="4200"]')).to_contain_text('Fra 1,8 cm/år')
    valg = side.locator('.graensevaelger select')
    valg.select_option('NZ-SA')
    expect(tabel.locator('[data-trin="3089"]')).to_contain_text('≈ Mod 7,6 cm/år')
    expect(tabel.locator('[data-trin="3089"]')).to_contain_text('≈ 2,5 cm/år')
    valg.select_option('NA-PA')
    expect(tabel.locator('[data-trin="2876"]')).to_contain_text('≈ Mod 0,4 cm/år')
    expect(tabel.locator('[data-trin="2876"]')).to_contain_text('≈ 4,6 cm/år')
    valg.select_option('AN-SL')
    assert tabel.locator('tbody tr').count() > 0
    assert all(c.inner_text() == '—' for c in tabel.locator('tbody td').all())
    valg.select_option('EU-NA')
    assert side.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert tabel.bounding_box()['width'] <= side.locator('#dialogindhold').bounding_box()['width']
    luk_lag(side)
    side.screenshot(path=str(ud / f'{w}x{h}-pladetabel.png'))
    side.locator('#luk').click()
    expect(side.locator('#udforsker')).to_be_hidden()

    aabn_lag(side, side.locator('#pladelag')).click()
    luk_lag(side)
    expect(side.locator('#signatur')).to_be_hidden()
    aabn_lag(side, side.locator('#pladelag')).click()
    luk_lag(side)
    side.locator('#pladevisning').click()
    expect(side.locator('#pladenavne')).to_be_checked()
    expect(side.locator('#pladepile')).to_be_checked()
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
    aabn_lag(side, side.locator('#pladelag')).click()
    luk_lag(side)
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
        aabn_lag(side, side.locator('#pladelag')).click()
        luk_lag(side)
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
            aabn_lag(side, side.locator('#pladelag')).click()
            luk_lag(side)
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
    aabn_lag(side, side.locator('#pladelag')).click()
    luk_lag(side)
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


def afproev_graensefejl(browser, adresse):
    original = json.loads((Path(__file__).parents[1] / 'data/graensehastigheder.json').read_text())
    for fejltype in ['netvaerk', 'json', 'null', 'udenfor', 'dublet', 'enhed', 'modul']:
        side = browser.new_page(viewport={'width': 1366, 'height': 625})
        fejl = []
        side.on('pageerror', lambda e: fejl.append(str(e)))
        moenster = '**/graensehastigheder.js' if fejltype == 'modul' else '**/graensehastigheder.json'
        if fejltype in ['netvaerk', 'modul']: side.route(moenster, lambda r: r.abort())
        elif fejltype == 'json': side.route(moenster, lambda r: r.fulfill(body='{forkert', content_type='application/json'))
        else:
            forkert = json.loads(json.dumps(original))
            if fejltype == 'null': forkert['punkter'][0][7] = None
            if fejltype == 'udenfor': forkert['punkter'][0][5] = 91
            if fejltype == 'dublet': forkert['punkter'][0][0] = forkert['punkter'][1][0]
            if fejltype == 'enhed': forkert['enhed'] = 'cm/år'
            side.route(moenster, lambda r: r.fulfill(json=forkert))
        side.goto(adresse + '/atlas/')
        side.wait_for_function("document.querySelector('#kortstatus').hidden")
        aabn_lag(side, side.locator('#pladelag')).click()
        luk_lag(side)
        side.locator('#pladevisning').click()
        side.locator('#pladenavne').check()
        expect(side.locator('#pladenavne')).to_be_enabled()
        side.keyboard.press('Escape')
        expect(side.locator('#pladevisning')).to_have_attribute('aria-expanded', 'false')
        foer = billede(side)
        side.locator('#pladevisning').click()
        side.locator('#pladepile').check()
        expect(side.locator('#pladevalgstatus')).to_contain_text('Pladegrænser og globus virker stadig')
        expect(side.locator('#pladepile')).not_to_be_checked()
        expect(side.locator('#pladenavne')).to_be_checked()
        side.keyboard.press('Escape')
        expect(side.locator('#pladevisning')).to_have_attribute('aria-expanded', 'false')
        assert billede(side) == foer, 'Fejl i grænsehastigheder ændrer navne eller grundkort'
        side.unroute(moenster)
        if fejltype == 'modul':
            side.reload()
            side.wait_for_function("document.querySelector('#kortstatus').hidden")
            aabn_lag(side, side.locator('#pladelag')).click()
            luk_lag(side)
        side.locator('#pladevisning').click()
        side.locator('#pladepile').check()
        expect(side.locator('#pladepile')).to_be_enabled()
        expect(side.locator('#pladepile')).to_be_checked()
        expect(side.locator('#pladevalgstatus')).to_be_hidden()
        assert not fejl, fejl
        side.close()
