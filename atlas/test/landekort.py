"""Danmark: geografi, tryk, tastatur, tilstand, skærme og fejl uden WebGL."""
from lagmenu_hjaelp import aabn_lag, luk_lag
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

SKAERME = [(1280, 577), (1366, 625), (1536, 730), (390, 750), (640, 625)]


def klar(side, adresse):
    side.goto(adresse + '/atlas/')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    side.evaluate('document.fonts.ready')
    side.wait_for_timeout(100)


def land_aabent(side):
    expect(side.locator('#landetop')).to_be_visible()
    expect(side.locator('#kortstatus')).to_be_hidden()
    side.wait_for_timeout(80)
    assert side.evaluate('''() => {
      const c = document.querySelector('#globus');
      const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let n = 0;
      for(let i=0;i<d.length;i+=16) if(d[i]===217 && d[i+1]===226 && d[i+2]===187) n++;
      return n>100;
    }'''), 'Danmarks landareal mangler på canvas'


def vaelg_landekort(side):
    # Et tryk på Danmark åbner landemenuen; landekortet er et af valgene.
    menu = side.locator('#landemenu')
    expect(menu).to_be_visible()
    expect(menu.locator('h2')).to_have_text('Danmark')
    menu.locator('[data-valg="landekort"]').click()


def globuspunkt(side, koordinater, centrum=(-22, 42), zoom=1):
    # Uafhængig projektion af kendte koordinater ved den oprindelige globusvisning.
    return side.evaluate('''({punkt, centrum, zoom}) => {
      const c = document.querySelector('#globus').getBoundingClientRect();
      const p = d3.geoOrthographic().translate([c.width/2,c.height/2])
        .scale(Math.min(c.width,c.height)*.455*zoom).rotate([-centrum[0],-centrum[1]]);
      const xy = p(punkt); return {x:c.x+xy[0],y:c.y+xy[1]};
    }''', {'punkt':koordinater, 'centrum':list(centrum), 'zoom':zoom})


def afproev_landekort(browser, adresse, ud, skaerme=SKAERME):
    fejl = []
    for w, h in skaerme:
        side = browser.new_page(viewport={'width': w, 'height': h}, has_touch=w == 390, is_mobile=w == 390)
        side.on('pageerror', lambda e: fejl.append(str(e)))
        klar(side, adresse)
        canvas = side.locator('#globus')
        # Landekort hentes ikke før valg; alle eksisterende lag skal bevares.
        assert not any('danmark-dagi' in r['name'] for r in side.evaluate('performance.getEntriesByType("resource").map(r=>({name:r.name}))'))
        aabn_lag(side, side.locator('#pladelag')).click()
        luk_lag(side)
        side.locator('#pladevisning').click()
        side.locator('#pladenavne').check()
        expect(side.locator('#pladenavne')).to_be_enabled()
        side.locator('#pladepile').check()
        expect(side.locator('#pladepile')).to_be_enabled()
        side.keyboard.press('Escape')
        canvas.focus(); side.keyboard.press('ArrowRight'); side.keyboard.press('+')
        side.wait_for_timeout(100)
        foer = canvas.evaluate('el => el.toDataURL()')
        assert side.locator('#vaelg-danmark').count() == 0
        punkt = globuspunkt(side, [9.2,56], centrum=(-10,42), zoom=1.2)
        assert side.evaluate('p=>document.elementFromPoint(p.x,p.y).id', punkt) == 'globus'
        side.touchscreen.tap(**punkt) if w == 390 else side.mouse.click(**punkt)
        vaelg_landekort(side)
        land_aabent(side)
        if w == 1280:
            # Polen må ikke blive til hav i et bredt kort; kendt punkt på land.
            rgb = side.evaluate('''async () => {
              const t = await (await fetch('data/danmark-dagi.json')).json();
              const dk = topojson.merge(t, t.objects.kommuner.geometries);
              const c = document.querySelector('#globus');
              const p = d3.geoMercator().fitExtent([[32,66],[c.clientWidth-32,c.clientHeight-64]],dk);
              const xy = p([17,54.4]);
              return [...c.getContext('2d').getImageData(Math.round(xy[0]),Math.round(xy[1]),1,1).data];
            }''')
            assert rgb == [232, 231, 217, 255], rgb
        expect(side.locator('#til-globus')).to_be_focused()
        expect(side.locator('#pladelag')).to_be_hidden()
        expect(side.locator('#signatur')).to_be_hidden()
        expect(side.locator('#zoom-ud')).to_be_disabled()
        assert 'Danmarkskort' in canvas.get_attribute('aria-label')
        assert side.evaluate('document.documentElement.scrollWidth === innerWidth')
        if w >= 900:
            assert side.locator('.atlas').bounding_box()['y'] + side.locator('.atlas').bounding_box()['height'] <= h
        luk_lag(side)
        side.screenshot(path=str(ud / f'danmark-{w}x{h}.png'))
        kort = canvas.evaluate('el => el.toDataURL()')
        canvas.focus(); side.keyboard.press('+'); side.keyboard.press('ArrowRight')
        side.wait_for_timeout(100)
        assert canvas.evaluate('el => el.toDataURL()') != kort
        expect(side.locator('#zoomniveau')).to_have_text('1,2×')
        side.keyboard.press('Home'); side.wait_for_timeout(100)
        assert canvas.evaluate('el => el.toDataURL()') == kort
        if w == 1280:
            canvas.focus()
            for _ in range(24): side.keyboard.press('+')
            expect(side.locator('#zoom-ind')).to_be_disabled()
            expect(side.locator('#zoomniveau')).to_have_text('16,0×')
            side.wait_for_timeout(100)
            side.screenshot(path=str(ud / f'danmark-zoom16-{w}x{h}.png'))
            side.locator('#nulstil').click()
        # Kilde og hjælp er underdialoger; Escape dér må ikke forlade landekortet.
        side.locator('#landekilde').click()
        expect(side.locator('#dialogindhold')).to_contain_text('Bornholm')
        expect(side.locator('#dialogindhold')).to_contain_text('1:500.000')
        side.keyboard.press('Escape'); land_aabent(side)
        expect(side.locator('#landekilde')).to_be_focused()
        side.locator('#til-globus').click(); side.wait_for_timeout(100)
        expect(canvas).to_be_focused()
        assert canvas.evaluate('el => el.toDataURL()') == foer, 'Tilbage ændrede globussens vinkel, zoom eller pladelag'
        expect(side.locator('#pladelag')).to_have_attribute('aria-pressed', 'true')
        expect(side.locator('#signatur')).to_be_visible()
        expect(side.locator('#pladenavne')).to_be_checked()
        expect(side.locator('#pladepile')).to_be_checked()
        # Stedlisten er tastaturalternativ, også når Danmark er på bagsiden.
        side.locator('#nulstil').click()
        canvas.focus()
        for _ in range(15): side.keyboard.press('ArrowRight')
        for _ in range(7): side.keyboard.press('ArrowDown')
        side.get_by_role('button', name='Steder', exact=True).click()
        side.get_by_role('button', name='Danmark — åbn landekort', exact=True).press('Enter')
        land_aabent(side)
        side.keyboard.press('Escape')
        expect(canvas).to_be_focused()
        # Skift skærmstørrelse i landekort og fokusvisning.
        side.get_by_role('button', name='Steder', exact=True).click()
        side.get_by_role('button', name='Danmark — åbn landekort', exact=True).click()
        land_aabent(side)
        side.locator('#fokus').click()
        side.set_viewport_size({'width':390 if w >= 900 else 1280, 'height':750 if w >= 900 else 577})
        side.wait_for_timeout(100)
        assert side.evaluate('document.documentElement.scrollWidth === innerWidth')
        land_aabent(side)
        side.keyboard.press('Escape')
        expect(side.locator('#landetop')).to_be_hidden()
        assert side.locator('body').evaluate("el=>el.classList.contains('fokus')")
        side.keyboard.press('Escape')
        expect(side.locator('.site-header')).to_be_visible()
        if w == 1280:
            side.get_by_role('button', name='Steder', exact=True).click()
            side.get_by_role('button', name='Danmark — åbn landekort', exact=True).click()
            land_aabent(side)
            side.get_by_role('button', name='Processer', exact=True).first.click()
            side.get_by_role('button', name='Undersøg pladegrænserne', exact=True).click()
            side.get_by_role('button', name='Vis Island med pladegrænser', exact=True).click()
            expect(side.locator('#landetop')).to_be_hidden()
            expect(side.locator('#zoomniveau')).to_have_text('1,4×')
            expect(side.locator('#pladelag')).to_have_attribute('aria-pressed', 'true')
        side.close()
        print('Danmark, skærm/tilstand/tastatur:', w, h, 'OK', flush=True)

    side = browser.new_page(viewport={'width':390,'height':750}, has_touch=True, is_mobile=True)
    side.on('pageerror', lambda e: fejl.append(str(e)))
    klar(side, adresse)
    # Geografisk kontrol mod kendte steder, inkl. Bornholm, og udenlandske punkter.
    geografi = side.evaluate('''async () => {
      const t = await (await fetch('data/danmark-dagi.json')).json();
      const dk = topojson.merge(t, t.objects.kommuner.geometries);
      // Inde: Aarhus, Odense, København, Bornholm, Anholt, Læsø, Fanø, Christiansø.
      // Ude: Hamborg, Malmø, Kattegat, Grønland, Limfjorden, Storebælt, Øresund.
      return {bounds:d3.geoBounds(dk),
        inde:[[10.2,56.15],[10.38,55.4],[12.56,55.68],[14.92,55.1],[11.6,56.72],[11.0,57.29],[8.42,55.4],[15.19,55.32]].map(p=>d3.geoContains(dk,p)),
        ude:[[10,53.55],[13,55.6],[11,57.5],[-42,65],[9.2,56.97],[10.97,55.25],[12.72,55.85]].map(p=>d3.geoContains(dk,p))};
    }''')
    assert all(geografi['inde']) and not any(geografi['ude']), geografi
    assert 8 < geografi['bounds'][0][0] < 8.2 and 15 < geografi['bounds'][1][0] < 15.3, geografi
    # Tryk på den faktiske landgeometri; ingen knap ligger oven på globussen.
    punkt = globuspunkt(side, [9.2,56])
    assert side.evaluate('p=>document.elementFromPoint(p.x,p.y).id', punkt) == 'globus'
    side.touchscreen.tap(**punkt); vaelg_landekort(side); land_aabent(side)
    side.locator('#til-globus').tap()
    # Norge giver Norges menu uden landekort; hav og uden for kuglen åbner intet.
    punkt = globuspunkt(side, [25.8,70.9])
    side.touchscreen.tap(**punkt)
    expect(side.locator('#landemenu h2')).to_have_text('Norge')
    assert side.locator('#landemenu [data-valg="landekort"]').count() == 0
    side.keyboard.press('Escape')
    expect(side.locator('#landemenu')).to_be_hidden()
    # To havpunkter (vest for Portugal og midt i Atlanten). [20,20] lå før her,
    # men det er Tchad; det bestod kun, fordi menuen lukkede sig selv efter touch.
    for koord in [[-10,40], [-30,20]]:
        punkt = globuspunkt(side, koord)
        assert side.evaluate('p=>document.elementFromPoint(p.x,p.y).id', punkt) == 'globus'
        side.touchscreen.tap(**punkt)
        expect(side.locator('#landemenu')).to_be_hidden()
        expect(side.locator('#landetop')).to_be_hidden()
    side.touchscreen.tap(25, 260)
    expect(side.locator('#landetop')).to_be_hidden()
    session = side.context.new_cdp_session(side)
    punkt = globuspunkt(side, [9.2,56])
    x,y = punkt['x'],punkt['y']
    def touch(type, points):
        session.send('Input.dispatchTouchEvent', {'type':type,'touchPoints':points})
    touch('touchStart',[{'x':x,'y':y,'id':1}])
    touch('touchCancel',[])
    expect(side.locator('#landemenu')).to_be_hidden()
    expect(side.locator('#landetop')).to_be_hidden()
    # Træk væk og tilbage til Danmark skal stadig være et træk.
    touch('touchStart',[{'x':x,'y':y,'id':1}])
    touch('touchMove',[{'x':x-40,'y':y+10,'id':1}])
    touch('touchMove',[{'x':x,'y':y,'id':1}])
    touch('touchEnd',[])
    expect(side.locator('#landemenu')).to_be_hidden()
    expect(side.locator('#landetop')).to_be_hidden()
    # Hold touchforløbet adskilt fra den rå trækgestus og brug touch hele vejen.
    side.locator('#nulstil').tap(); side.wait_for_timeout(400)
    side.evaluate('scrollTo(0, 0)')
    side.touchscreen.tap(**globuspunkt(side, [9.2,56])); vaelg_landekort(side); land_aabent(side)
    foer = side.locator('#globus').evaluate('el => el.toDataURL()')
    touch('touchStart',[{'x':150,'y':440,'id':1}])
    touch('touchMove',[{'x':175,'y':470,'id':1}]); touch('touchEnd',[])
    side.wait_for_timeout(100)
    assert side.locator('#globus').evaluate('el => el.toDataURL()') != foer
    expect(side.locator('#zoomniveau')).to_have_text('1,0×')
    foer = side.locator('#globus').evaluate('el => el.toDataURL()')
    touch('touchStart',[{'x':130,'y':440,'id':1},{'x':230,'y':440,'id':2}])
    touch('touchMove',[{'x':95,'y':440,'id':1},{'x':265,'y':440,'id':2}])
    # Løft én finger før den sidste; kortet skal blive i landevisning.
    touch('touchEnd',[{'x':265,'y':440,'id':2}]); touch('touchEnd',[])
    side.wait_for_timeout(100)
    assert side.locator('#globus').evaluate('el => el.toDataURL()') != foer
    assert side.locator('#zoomniveau').inner_text() != '1,0×'
    land_aabent(side)
    side.close()

    for fejltype in ['data', 'baggrund', 'modul', 'ugyldig']:
        side = browser.new_page()
        side.on('pageerror', lambda e: fejl.append(str(e)))
        klar(side, adresse)
        if fejltype == 'modul': side.route('**/landekort.js', lambda r:r.abort())
        elif fejltype == 'baggrund': side.route('**/europa-10m.json', lambda r:r.abort())
        elif fejltype == 'data': side.route('**/danmark-dagi.json', lambda r:r.abort())
        else: side.route('**/danmark-dagi.json', lambda r:r.fulfill(json={'type':'Topology','objects':{'kommuner':{'type':'GeometryCollection','geometries':[]}},'arcs':[]}))
        side.mouse.click(**globuspunkt(side, [9.2,56]))
        vaelg_landekort(side)
        expect(side.locator('#kortstatus')).to_contain_text('Danmarkskortet kunne ikke hentes')
        expect(side.locator('#landetop')).to_be_hidden()
        side.get_by_role('button', name='Steder', exact=True).click()
        side.get_by_role('button', name='Danmark — åbn landekort', exact=True).click()
        expect(side.locator('#landefejl')).to_contain_text('kunne ikke hentes')
        side.locator('#luk').click()
        side.get_by_role('button', name='Processer', exact=True).first.click()
        assert side.locator('.modelkort a').count() == 11
        side.get_by_role('button', name='Alle', exact=True).click()
        assert side.locator('.modelkort a').count() == 11
        side.keyboard.press('Escape')
        if fejltype != 'modul':
            side.unroute('**/europa-10m.json' if fejltype == 'baggrund' else '**/danmark-dagi.json')
            side.mouse.click(**globuspunkt(side, [9.2,56])); vaelg_landekort(side); land_aabent(side)
        side.close()
    assert not fejl, fejl
    print('Danmark: geografi, landetryk via menu, træk, tofingerzoom og fallback OK', flush=True)


if __name__ == '__main__':
    ud = Path(os.environ.get('ATLAS_TEST_UD', '/tmp/smbi-danmark-test')); ud.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        # Softwarecanvas som i afproev.py, så billedsammenligningerne er stabile.
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),
                                    args=['--no-sandbox','--disable-webgl','--disable-accelerated-2d-canvas'])
        afproev_landekort(browser, os.environ.get('ATLAS_URL','http://localhost:8777'), ud)
        browser.close()
