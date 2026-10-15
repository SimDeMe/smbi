"""Rigtigt terræn i 3D: referencesteder, dybdebuffer, interaktion og fallback."""
import json
import struct
from pathlib import Path
from playwright.sync_api import expect
from island import _lcc


def afproev_island3d(browser, adresse, ud, skaerme):
    fejl = []
    for w, h in skaerme:
        side = browser.new_page(viewport={'width': w, 'height': h}, reduced_motion='reduce', has_touch=w == 390)
        side.on('pageerror', lambda e: fejl.append(str(e)))
        side.on('console', lambda e: fejl.append(e.text) if e.type == 'error' else None)
        side.goto(adresse + '/atlas/island/model3d.html')
        expect(side.locator('.landskabsfigur.klar')).to_have_count(1)
        side.wait_for_function("+document.querySelector('canvas').dataset.revision > 0")
        side.evaluate('document.fonts.ready')
        m = side.evaluate('''() => {
          const r = document.querySelector('canvas').getBoundingClientRect();
          const controles = [...document.querySelectorAll('.vaerktoejer button, .landskabsknapper button, #overdrivelse')].map(b => b.getBoundingClientRect().bottom);
          return {scroll:document.documentElement.scrollWidth-innerWidth, bund:r.bottom, hoejde:r.height, kontroller:Math.max(...controles)};
        }''')
        assert m['scroll'] == 0 and m['hoejde'] >= 330, (w, h, m)
        if w >= 900: assert m['bund'] < h and m['kontroller'] < h, (w, h, m)
        expect(side.locator('#faktor')).to_have_text('×20')
        # Højdedata skal give et farverigt landskab, også med WebGL slået fra.
        farver = side.locator('canvas').evaluate('''c => {const x=c.getContext('2d').getImageData(0,0,c.width,c.height).data,s=new Set();for(let i=0;i<x.length;i+=64)s.add(x[i]+','+x[i+1]+','+x[i+2]);return s.size}''')
        assert farver > 100, farver
        side.screenshot(path=str(ud / f'island3d-{w}x{h}.png'))
        for i in range(4):
            side.locator(f'[data-sted="{i}"]').click()
            expect(side.locator(f'[data-sted="{i}"]')).to_have_attribute('aria-pressed', 'true')
            expect(side.locator('#stedsnummer')).to_have_text(f'0{i+1} / 05')
        side.locator('[data-sted="4"]').click()
        expect(side.locator('#thingvellirscene')).to_be_visible()
        expect(side.locator('#landskab')).to_be_hidden()
        for navn in ['Almannagjá','Hrafnagjá','Riftdalen']:
            expect(side.locator('#thingvellirfigur')).to_contain_text(navn)
        side.locator('#visrift').press('Enter')
        expect(side.locator('#visrift')).to_have_attribute('aria-pressed','true')
        assert side.locator('.thingvest').evaluate("e=>getComputedStyle(e).transform") != 'none'
        side.locator('#nulstilrift').click()
        expect(side.locator('#visrift')).to_have_attribute('aria-pressed','false')
        side.locator('#ommodel').click()
        expect(side.locator('#ommodellen')).to_be_visible()
        expect(side.locator('#ommodellen')).to_contain_text('Hreppar')
        expect(side.locator('#ommodellen')).to_contain_text('Weismüller')
        side.keyboard.press('Escape')
        expect(side.locator('#ommodellen')).not_to_be_visible()
        expect(side.locator('#ommodel')).to_be_focused()
        assert side.evaluate('document.documentElement.scrollWidth === innerWidth')
        side.screenshot(path=str(ud / f'thingvellir-{w}x{h}.png'))
        side.locator('[data-sted="0"]').click()
        expect(side.locator('#landskab')).to_be_visible()
        expect(side.locator('#thingvellirscene')).to_be_hidden()
        side.close()

    side = browser.new_page(viewport={'width':1366, 'height':625}, reduced_motion='reduce')
    side.on('pageerror', lambda e: fejl.append(str(e)))
    side.goto(adresse + '/atlas/island/model3d.html')
    expect(side.locator('.landskabsfigur.klar')).to_have_count(1)
    # Det delbare link åbner nærvisningen; retur fra snit bevarer destinationen.
    side.goto(adresse + '/atlas/island/model3d.html?sted=thingvellir')
    expect(side.locator('#thingvellirscene')).to_be_visible()
    side.locator('.til-snit').click()
    expect(side.locator('body.snitaktiv')).to_have_count(1)
    side.locator('#snitknap').click()
    expect(side.locator('#thingvellirscene')).to_be_visible()
    side.locator('#fokus').click();side.locator('#ommodel').click()
    side.keyboard.press('Escape')
    expect(side.locator('body.fokus')).to_have_count(1)
    expect(side.locator('#ommodel')).to_be_focused()
    side.keyboard.press('Escape')
    side.goto(adresse + '/atlas/island/model3d.html')
    expect(side.locator('.landskabsfigur.klar')).to_have_count(1)
    # Uafhængig projektion og byteaflæsning af de eksisterende NOAA-data.
    punkter = [(-19.666,63.983),(-16.65,64.02),(-20.1,64.62),(-20,63.15),(-21.14,64.18)]
    meta = json.loads((Path(__file__).parents[1] / 'island/data/islandskort.json').read_text())
    raw = (Path(__file__).parents[1] / 'island/data/islandskort-hoejde.bin').read_bytes()
    dim = meta['hoejde']; px = (meta['graenser'][2]-meta['graenser'][0])/meta['relief']['bredde']
    def reference(lon, lat):
        x,y = _lcc(lon,lat)
        j=(x-meta['graenser'][0])/px/dim['trin']-.5
        i=(y-meta['graenser'][1])/px/dim['trin']-.5
        a,b=int(j),int(i);u,v=j-a,i-b
        def z(j,i): return struct.unpack_from('<h',raw,2*(i*dim['bredde']+j))[0]
        return (1-v)*((1-u)*z(a,b)+u*z(a+1,b))+v*((1-u)*z(a,b+1)+u*z(a+1,b+1))
    hoejder = side.evaluate('''async punkter => { const {proeve}=await import('./model3d.js');const t=proeve.terraen();return punkter.map(p=>t.punkt(p)[1]); }''',punkter)
    for p,z in zip(punkter,hoejder): assert abs(reference(*p)-z) < .01, (p,z,reference(*p))
    assert hoejder[0] > 900 and hoejder[1] > 1300 and hoejder[3] < -50, hoejder
    # To krydsende flader skal skjule hinanden korrekt, uafhængigt af tegningsrækkefølge.
    raster = side.evaluate('''async () => {
      const {lavRaster,pakFarve}=await import('./raster.js');
      const tegn = omvendt => {const r=lavRaster(8,8),c=document.createElement('canvas');c.width=c.height=8;const x=c.getContext('2d');r.nulstil();
        const a=()=>r.trekant([0,0,0],[8,0,8],[0,8,0],pakFarve('rgb(255,0,0)'));
        const b=()=>r.trekant([0,0,4],[8,0,4],[0,8,4],pakFarve('rgb(0,255,0)'));
        if(omvendt){b();a();}else{a();b();}r.vis(x);return [...x.getImageData(0,0,8,8).data];};
      return [tegn(false),tegn(true)];
    }''')
    assert raster[0] == raster[1]
    assert raster[0][(1*8+1)*4:(1*8+1)*4+3] == [0,255,0]
    assert raster[0][6*4:6*4+3] == [255,0,0]

    def kamera(): return side.evaluate("async() => ({...(await import('./model3d.js')).proeve.kamera})")
    def pixels(): return side.locator('canvas').evaluate('c=>c.toDataURL()')
    # Fri drejning, tastatur, begrænsninger, nulstilling og faktisk ændring af pixels.
    foer, billede = kamera(), pixels()
    side.locator('canvas').press('ArrowRight')
    side.wait_for_timeout(100)
    assert kamera()['drej'] != foer['drej'] and pixels() != billede
    for _ in range(15): side.locator('canvas').press('ArrowUp')
    assert kamera()['vip'] == 78
    side.locator('canvas').press('Home')
    assert kamera()['zoom'] == 1 and kamera()['drej'] == -14
    side.get_by_role('button',name='Zoom ind',exact=True).click()
    assert kamera()['zoom'] > 1
    b=side.locator('canvas').bounding_box();x=b['x']+b['width']/2;y=b['y']+b['height']/2
    foer = kamera()['drej']
    side.mouse.move(x,y);side.mouse.down();side.mouse.move(x+120,y-50,steps=5);side.mouse.up()
    assert abs(kamera()['drej']-foer) > 20
    side.locator('canvas').press('Home');side.wait_for_timeout(100)
    billede=pixels()
    side.locator('#havbund').click();side.wait_for_timeout(100)
    expect(side.locator('#havbund')).to_have_attribute('aria-pressed','false')
    assert pixels() != billede
    # Havknappen ændrer kun visningen; de målte dybder er uændrede.
    z=side.evaluate("async()=>(await import('./model3d.js')).proeve.terraen().punkt([-20,63.15])[1]")
    assert abs(z-hoejder[3]) < .01
    side.locator('#havbund').click()
    billede=pixels();side.locator('#geologi').click();side.wait_for_timeout(100);assert pixels()!=billede
    side.locator('#overdrivelse').fill('1');expect(side.locator('#faktor')).to_have_text('×1')
    side.locator('#rundtur').click();expect(side.locator('#rundtur')).to_have_attribute('aria-pressed','true')
    side.locator('#rundtur').click();expect(side.locator('#rundtur')).to_have_attribute('aria-pressed','false')
    side.get_by_role('button',name='Fokus',exact=True).click();expect(side.locator('.site-header')).to_be_hidden()
    side.keyboard.press('Escape');expect(side.locator('.site-header')).to_be_visible()
    # Stadig figur på pause, også uden reduced motion; en startet kameraflyvning kan standses.
    side.emulate_media(reduced_motion='no-preference')
    side.wait_for_timeout(100);billede=pixels();side.wait_for_timeout(200);assert pixels()==billede
    side.locator('[data-sted="2"]').click();side.wait_for_timeout(150);side.keyboard.press('Escape')
    foer=kamera();side.wait_for_timeout(200);assert kamera()==foer
    for a in side.locator('a[href^="/atlas/"]').all():
        assert side.request.get(adresse+a.get_attribute('href')).status == 200
    side.close()

    # Touch: vandret drejning, lodret scroll uden at dreje. Rundtur starter aldrig selv.
    side=browser.new_page(viewport={'width':390,'height':750},is_mobile=True,has_touch=True,reduced_motion='reduce')
    side.goto(adresse+'/atlas/island/model3d.html');expect(side.locator('.landskabsfigur.klar')).to_have_count(1)
    cd=side.context.new_cdp_session(side)
    def touch(type,points):cd.send('Input.dispatchTouchEvent',{'type':type,'touchPoints':points})
    foer=kamera()['drej']
    touch('touchStart',[{'x':100,'y':370}])
    for x in range(110,231,20):touch('touchMove',[{'x':x,'y':370}]);side.wait_for_timeout(20)
    touch('touchEnd',[]);assert abs(kamera()['drej']-foer)>20
    foer=kamera()['drej'];side.evaluate('scrollTo(0,0)')
    touch('touchStart',[{'x':185,'y':450}])
    for y in range(440,269,-20):touch('touchMove',[{'x':185,'y':y}]);side.wait_for_timeout(20)
    touch('touchEnd',[]);side.wait_for_timeout(100)
    assert kamera()['drej']==foer and side.evaluate('scrollY')>30
    side.close()

    # Fejl i data eller bibliotek og manglende Canvas må bevare forklaring og links.
    for fejltype in ['data','bin','ugyldig','bibliotek','canvas']:
        side=browser.new_page(viewport={'width':1280,'height':577})
        if fejltype=='data':side.route('**/islandskort.json',lambda r:r.fulfill(status=404,body='mangler'))
        if fejltype=='bin':side.route('**/islandskort-hoejde.bin',lambda r:r.fulfill(status=200,body=b'\x00\x00'))
        if fejltype=='ugyldig':side.route('**/islandskort.json',lambda r:r.fulfill(status=200,body='{}',content_type='application/json'))
        if fejltype=='bibliotek':side.route('**/d3-geo.min.js',lambda r:r.abort())
        if fejltype=='canvas':side.add_init_script('HTMLCanvasElement.prototype.getContext=()=>null')
        side.goto(adresse+'/atlas/island/model3d.html')
        expect(side.locator('#hentestatus.fejl')).to_be_visible()
        expect(side.locator('#hentestatus a')).to_have_attribute('href','kort.html')
        expect(side.locator('#havbund')).to_be_disabled()
        side.close()
    assert not fejl, fejl
    print('Island 3D: terrænhøjder, dybdebuffer, skærme, touch, kameratur og fallback OK',flush=True)
