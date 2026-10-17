"""Europa-quiz: hele forløbet, faktisk landepick, småstater og bevaret Atlas."""
from lagmenu_hjaelp import aabn_lag, luk_lag
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from piletaster import billede

SKAERME=[(1280,577),(1366,625),(1536,730),(390,750),(640,625)]


def klar(side, adresse):
    side.goto(adresse+'/atlas/')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    side.evaluate('document.fonts.ready')


def start(side):
    side.locator('#quiz').click()
    side.locator('#quiz-start').click()
    expect(side.locator('body')).to_have_class(__import__('re').compile(r'\bquiz\b'))
    expect(side.locator('#quiz-start')).not_to_have_attribute('aria-busy','true')
    billede(side)


def punkt(side, koord):
    return side.evaluate('''p => {
      const c=document.querySelector('#globus').getBoundingClientRect();
      const proj=d3.geoOrthographic().translate([c.width/2,c.height/2]).scale(Math.min(c.width,c.height)*.455*1.8).rotate([-15,-54]);
      const xy=proj(p);return {x:c.x+xy[0],y:c.y+xy[1]};
    }''', koord)


def afproev_europa_quiz(browser, adresse, ud, skaerme=SKAERME):
    fejl=[]
    for w,h in skaerme:
        side=browser.new_page(viewport={'width':w,'height':h},has_touch=w==390,is_mobile=w==390,reduced_motion='reduce')
        side.on('pageerror',lambda e:fejl.append(str(e)))
        side.add_init_script('Math.random=()=>0')
        side.clock.install()
        klar(side,adresse)
        assert not side.evaluate("performance.getEntriesByType('resource').some(r=>r.name.endsWith('/europa-10m.json'))")
        aabn_lag(side, side.locator('#pladelag')).click()
        luk_lag(side)
        side.locator('#pladevisning').click()
        side.locator('#pladenavne').check();expect(side.locator('#pladenavne')).to_be_enabled()
        side.locator('#pladepile').check();expect(side.locator('#pladepile')).to_be_enabled()
        side.keyboard.press('Escape')
        canvas=side.locator('#globus');canvas.focus();side.keyboard.press('ArrowRight');side.keyboard.press('+')
        foer=billede(side)
        start(side)
        expect(side.locator('#quiz-land')).to_have_text('Andorra')
        expect(side.locator('#quiz-fremskridt')).to_have_text('0 / 47')
        assert side.locator('#markoerer').is_hidden() and side.locator('#signatur').is_hidden()
        assert side.locator('#pladelag').is_hidden()
        assert side.evaluate('document.documentElement.scrollWidth===innerWidth')
        if w>=900:
            assert side.locator('.atlas').evaluate('(el)=>el.getBoundingClientRect().bottom<=innerHeight')
        luk_lag(side)
        side.screenshot(path=str(ud/f'quiz-{w}x{h}.png'))
        if w==390:
            c=canvas.bounding_box();x=c['x']+c['width']/2;y=c['y']+c['height']/2
            session=side.context.new_cdp_session(side)
            def touch(type,points):session.send('Input.dispatchTouchEvent',{'type':type,'touchPoints':points})
            b=billede(side)
            touch('touchStart',[{'x':x,'y':y,'id':1}]);touch('touchMove',[{'x':x+40,'y':y+20,'id':1}]);touch('touchEnd',[])
            assert billede(side)!=b
            expect(side.locator('#quiz-fremskridt')).to_have_text('0 / 47')
            touch('touchStart',[{'x':x-40,'y':y,'id':1},{'x':x+40,'y':y,'id':2}])
            touch('touchMove',[{'x':x-65,'y':y,'id':1},{'x':x+65,'y':y,'id':2}]);touch('touchEnd',[])
            billede(side);assert side.locator('#zoomniveau').inner_text()!='1,8×'
            side.locator('#nulstil').click();billede(side)
        # Ingen hover-navne som afslører svar; genveje og sigtekorn fungerer.
        side.mouse.move(**punkt(side,[2.35,48.86]))
        assert canvas.get_attribute('title') in ['',None]
        canvas.focus();side.keyboard.press('Enter')
        expect(side.locator('#quiz-besked')).to_have_text('Det er Polen. Prøv igen.')
        expect(side.locator('#quiz-land')).to_have_text('Andorra')
        b=billede(side);side.keyboard.press('Shift+ArrowRight');assert billede(side)!=b
        side.keyboard.press('Home');billede(side)
        # Alle lande er faktisk klikbare, også Vatikanet og de øvrige småstater.
        lande=side.evaluate("async()=> (await import('./quizmodel.js')).europa")
        opslag={l['id']:l for l in lande}
        besogte=set()
        antal=47 if w==1280 else 3
        for i in range(antal):
            id=side.locator('#quiz-land').get_attribute('data-land')
            assert id not in besogte;besogte.add(id)
            land=opslag[id];p=punkt(side,land['punkt'])
            assert side.evaluate('p=>document.elementFromPoint(p.x,p.y).id',p)=='globus', (land,w)
            side.touchscreen.tap(**p) if w==390 else side.mouse.click(**p)
            expect(side.locator('#quiz-besked')).to_have_text('Rigtigt: '+land['navn']+'!')
            expect(side.locator('#quiz-fremskridt')).to_have_text(f'{i+1} / 47')
            if i==0:
                # Gentagne klik mens der gives feedback må ikke besvare næste spørgsmål.
                side.mouse.click(**punkt(side,[19,52]))
                expect(side.locator('#quiz-fremskridt')).to_have_text('1 / 47')
            side.clock.fast_forward(1100);billede(side)
        if w==1280:
            assert len(besogte)==47
            expect(side.locator('#quiz-land')).to_have_text('Europa gennemført!')
            expect(side.locator('#quiz-besked')).to_have_text('46 af 47 rigtige i første forsøg · 1 forkert svar · 0 viste lande.')
            expect(side.locator('#quiz-vis')).to_be_hidden()
            luk_lag(side)
            side.screenshot(path=str(ud/'quiz-gennemfoert.png'))
            assert not side.evaluate("performance.getEntriesByType('resource').some(r=>r.name.endsWith('/danmark-10m.json'))")
            side.locator('#quiz-igen').click()
            expect(side.locator('#quiz-fremskridt')).to_have_text('0 / 47')
            expect(side.locator('#quiz-land')).to_have_text('Andorra')
        else:
            side.locator('#quiz-vis').click()
            expect(side.locator('#quiz-besked')).to_contain_text('tæller som vist')
            expect(side.locator('#quiz-naeste')).to_be_visible()
            id=side.locator('#quiz-land').get_attribute('data-land')
            side.clock.fast_forward(5000)
            assert side.locator('#quiz-land').get_attribute('data-land')==id
            side.locator('#quiz-naeste').click();billede(side)
        side.locator('#hjaelp').click();side.keyboard.press('Escape')
        assert side.locator('body').evaluate("el=>el.classList.contains('quiz')")
        side.locator('#quiz-stop').click();side.clock.fast_forward(2000)
        expect(side.locator('#quiz')).to_be_focused()
        assert billede(side)==foer, 'Quiz ændrede den tidligere globus eller pladetilvalg'
        expect(side.locator('#pladenavne')).to_be_checked();expect(side.locator('#pladepile')).to_be_checked()
        # Nyt spil nulstiller tællere. Escape afslutter quiz før fokustilstand.
        start(side);expect(side.locator('#quiz-fremskridt')).to_have_text('0 / 47')
        side.locator('#fokus').click();billede(side)
        assert side.evaluate('document.documentElement.scrollWidth===innerWidth')
        side.keyboard.press('Escape');assert not side.locator('body').evaluate("el=>el.classList.contains('quiz')")
        assert side.locator('body').evaluate("el=>el.classList.contains('fokus')")
        side.keyboard.press('Escape');expect(side.locator('.site-header')).to_be_visible()
        side.close()
        print('Europa-quiz:',w,h,'OK',flush=True)

    # Fejl må hverken starte en halv quiz eller slå atlasnavigationen ud.
    for type in ['data','modul','bibliotek','ugyldig']:
        side=browser.new_page();side.on('pageerror',lambda e:fejl.append(str(e)));klar(side,adresse)
        moenster='**/landequiz.js' if type=='modul' else '**/vendor/topojson-simplify.min.js' if type=='bibliotek' else '**/europa-10m.json'
        if type=='ugyldig':side.route(moenster,lambda r:r.fulfill(json={'type':'Topology','objects':{},'arcs':[]}))
        else:side.route(moenster,lambda r:r.abort())
        foer=billede(side)
        side.locator('#quiz').click();side.locator('#quiz-start').click()
        expect(side.locator('#quiz-status')).to_contain_text('Europakortet kunne ikke hentes')
        assert not side.locator('body').evaluate("el=>el.classList.contains('quiz')")
        side.keyboard.press('Escape');assert billede(side)==foer
        side.get_by_role('button',name='Processer',exact=True).first.click()
        assert side.locator('.modelkort').count()==10
        side.keyboard.press('Escape');side.unroute(moenster)
        if type in ['modul','bibliotek']:klar(side,adresse)
        start(side);side.locator('#quiz-stop').click();side.close()
    # Lukket startdialog under en langsom indlæsning må ikke starte quizzen senere.
    side=browser.new_page();klar(side,adresse)
    side.route('**/europa-10m.json',lambda r:r.fulfill(path=str(Path(__file__).parents[1]/'data/europa-10m.json')))
    side.locator('#quiz').click();side.locator('#quiz-start').focus()
    # Afbryd før data når tilbage til siden.
    side.evaluate("()=>{document.querySelector('#quiz-start').click();document.querySelector('#udforsker').close()}")
    side.wait_for_function("!document.querySelector('#quiz-start').hasAttribute('aria-busy')")
    assert not side.locator('body').evaluate("el=>el.classList.contains('quiz')")
    side.close()
    # Menuen kan åbnes før grundkortet: Start bliver aktiv uden at genåbne den.
    side=browser.new_page();ventende=[]
    side.route('**/countries-110m.json',lambda r:ventende.append(r))
    side.goto(adresse+'/atlas/',wait_until='domcontentloaded')
    side.wait_for_function("document.querySelector('#zoom-ind').disabled")
    side.locator('#quiz').click()
    expect(side.locator('#quiz-start')).to_be_disabled()
    assert ventende
    ventende[0].fulfill(path=str(Path(__file__).parents[1]/'data/countries-110m.json'))
    expect(side.locator('#quiz-start')).to_be_enabled()
    expect(side.locator('#quiz-status')).to_be_empty()
    side.locator('#quiz-start').click()
    expect(side.locator('#quizlinje')).to_be_visible()
    side.locator('#quiz-stop').click();side.close()
    assert not fejl,fejl
    print('Europa: alle 47 lande, mikrostaters ringe, fejl, tastatur og afbrudt start OK',flush=True)


if __name__=='__main__':
    ud=Path(os.environ.get('ATLAS_TEST_UD','/tmp/smbi-europa-quiz'));ud.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--disable-webgl'])
        afproev_europa_quiz(browser,os.environ.get('ATLAS_URL','http://localhost:8777'),ud)
        browser.close()
