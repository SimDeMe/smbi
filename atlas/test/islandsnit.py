"""Geografisk gennemskæring: samme terræn, kildeankre, synlighed og pause."""
from playwright.sync_api import expect


def afproev_islandsnit(browser, adresse, ud, skaerme):
    fejl=[]
    for w,h in skaerme:
        side=browser.new_page(viewport={'width':w,'height':h},reduced_motion='reduce',has_touch=w==390)
        side.on('pageerror',lambda e:fejl.append(str(e)))
        side.on('console',lambda e:fejl.append(e.text) if e.type=='error' else None)
        side.goto(adresse+'/atlas/island/model3d.html?snit=vatnajokull')
        expect(side.locator('canvas[data-snit="vatnajokull"]')).to_have_count(1)
        expect(side.locator('#snitknap')).to_have_attribute('aria-pressed','true')
        expect(side.locator('.snitmaerke')).to_contain_text('havniveau')
        expect(side.locator('#faktor')).to_have_text('×1,5')
        for id,kamre in [('vatnajokull',['bard','grim-lav','grim-dyb']),('reykjanes',['svartsengi','fagradalsfjall']),('hekla',['hekla'])]:
            side.locator(f'button[data-snit="{id}"]').click()
            expect(side.locator('canvas')).to_have_attribute('data-snit',id)
            expect(side.locator('#kammerliste .kammerkort')).to_have_count(len(kamre))
            side.wait_for_function('(ids)=>ids.every(id=>document.querySelector("canvas").dataset.kamre.split(",").includes(id))',arg=kamre)
            m=side.evaluate('''()=>{const c=document.querySelector('canvas').getBoundingClientRect(),a=document.querySelector('.ekspedition').getBoundingClientRect();return {scroll:document.documentElement.scrollWidth-innerWidth,bund:c.bottom,stage:c.height,controls:[...document.querySelectorAll('.landskabsknapper button,#overdrivelse,#snitknap,#rundtur')].map(b=>b.getBoundingClientRect().bottom),hele:a.bottom}}''')
            assert m['scroll']==0 and m['stage']>=330,(w,h,id,m)
            if w>=900:assert m['bund']<h and max(m['controls'])<h,(w,h,id,m)
            side.evaluate('document.fonts.ready')
            side.screenshot(path=str(ud/f'islandsnit-{id}-{w}x{h}.png'))
        side.close()

    side=browser.new_page(viewport={'width':1366,'height':730},reduced_motion='reduce')
    side.on('pageerror',lambda e:fejl.append(str(e)))
    side.goto(adresse+'/atlas/island/model3d.html')
    expect(side.locator('.landskabsfigur.klar')).to_have_count(1)
    def state():return side.evaluate("async()=>{const {proeve}=await import('./model3d.js');return {kamera:{...proeve.kamera},tilstand:{...proeve.tilstand}}}")
    side.locator('[data-sted="1"]').click();side.locator('canvas').press('ArrowRight');side.locator('#overdrivelse').fill('12')
    foer=state()
    side.locator('#snitknap').click()
    expect(side.locator('canvas')).to_have_attribute('data-snit','reykjanes')
    assert 'snit=reykjanes' in side.url
    # Overkanten består af det samme terræn. Dybderne er uafhængige af grafisk overdrivelse.
    g=side.evaluate('''async()=>{
      const {proeve}=await import('./model3d.js'),s=proeve.snit(),t=proeve.terraen();
      const fejl=s.punkter.map(([x,y,z])=>Math.abs(y-t.modelHoejdeVed(x,z)));
      return {maks:Math.max(...fejl),kamre:s.kamre.map(k=>({id:k.id,y:k.y,terræn:k.terræn,afstand:Math.abs(k.afstand)})),bund:s.bund};
    }''')
    assert g['maks']<1e-7 and g['bund']==-26000,g
    k={k['id']:k for k in g['kamre']}
    assert abs((k['svartsengi']['terræn']-k['svartsengi']['y'])-4500)<1e-6,k
    assert abs((k['fagradalsfjall']['terræn']-k['fagradalsfjall']['y'])-20000)<1e-6,k
    assert max(k['afstand'] for k in g['kamre'])<.01,k
    side.locator('#overdrivelse').fill('2.25')
    expect(side.locator('#faktor')).to_have_text('×2,25')
    efter=side.evaluate("async()=>(await import('./model3d.js')).proeve.snit().kamre.map(k=>k.y)")
    assert efter==[x['y'] for x in g['kamre']]
    # Vatnajökulls havniveau-ankre og eksplicitte eksempelmodel.
    side.locator('button[data-snit="vatnajokull"]').click()
    dybder=side.evaluate("async()=>Object.fromEntries((await import('./model3d.js')).proeve.snit().kamre.map(k=>[k.id,k.y]))")
    assert dybder=={'bard':-6500,'grim-lav':-3000,'grim-dyb':-10000},dybder
    expect(side.locator('#kammerliste')).to_contain_text('Fortolket eksempel')
    expect(side.locator('#snitkilder')).to_contain_text('Hudson')
    expect(side.locator('#snitkilder')).to_contain_text('Reverso')
    # Gennemskæringens 3D-occlusion: bagsiden skal skjule kamrene.
    for _ in range(12):side.get_by_role('button',name='Drej mod højre',exact=True).click()
    side.wait_for_function('document.querySelector("canvas").dataset.kamre===""')
    side.locator('canvas').press('Home')
    side.wait_for_function('document.querySelector("canvas").dataset.kamre.includes("bard")')
    # Ingen automatisk strømning. Start, bevægelse og pause verificeres i billeder.
    side.wait_for_timeout(100)
    billede=lambda:side.locator('canvas').evaluate('c=>c.toDataURL()')
    rev=lambda:int(side.locator('canvas').get_attribute('data-revision'))
    a=billede();r=rev();side.wait_for_timeout(180);assert billede()==a and rev()==r
    side.locator('#rundtur').click();expect(side.locator('#rundtur')).to_have_attribute('aria-pressed','true')
    expect(side.locator('.flowstatus')).to_be_visible()
    side.wait_for_timeout(150);a=billede();r=rev();side.wait_for_timeout(180);assert billede()!=a and rev()>r
    side.locator('#rundtur').click();r=rev();side.wait_for_timeout(180);assert rev()==r
    side.locator('#rundtur').click();side.keyboard.press('Escape');expect(side.locator('#rundtur')).to_have_attribute('aria-pressed','false')
    side.locator('#snitknap').click();expect(side.locator('#snitknap')).to_have_attribute('aria-pressed','false')
    assert state()['kamera']==foer['kamera']
    expect(side.locator('#faktor')).to_have_text('×12')
    assert 'snit=' not in side.url
    # Det nye snit kan genåbnes efter lukning og har stadig kilder/skalareference.
    side.locator('.videre').click();expect(side.locator('canvas')).to_have_attribute('data-snit','reykjanes')
    side.locator('button[data-snit="hekla"]').click();expect(side.locator('#snitkilder')).to_contain_text('Ófeigsson')
    side.locator('#snitkildepanel summary').click();expect(side.locator('#snitkildepanel')).to_contain_text('havniveau')
    expect(side.locator('#snitkildepanel')).to_contain_text('fortolkning')
    side.close()
    assert not fejl,fejl
    print('Island-snit: tre geografiske blokke, terræn, dybder, bagside, pause og kamera-retur OK',flush=True)
