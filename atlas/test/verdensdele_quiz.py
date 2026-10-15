"""Landequiz for de øvrige verdensdele: valg, hit-test for alle lande og fulde forløb."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from piletaster import billede
from europa_quiz import klar

SKAERME=[(1280,577),(1366,625),(1536,730),(390,750),(640,625)]
DELE={'afrika':('Afrika',55),'nordamerika':('Nordamerika',23),'sydamerika':('Sydamerika',12),'asien':('Asien og Oceanien',63)}

# Hvert land skal kunne vælges i sit sigtepunkt ved største quizzoom, både via
# polygon og ring. Europa køres med, så den fælles kode også dækker den.
HITTEST='''async id => {
  const { hentLande, findQuizLand } = await import('./landequiz.js');
  const del = (await import('./quizmodel.js')).verdensdele.find(d => d.id === id);
  const kort = await hentLande(del), fejl = [];
  for (const l of del.lande) {
    const proj = d3.geoOrthographic().translate([400, 300]).scale(600 * .455 * 8).rotate([-l.punkt[0], -l.punkt[1]]);
    const svar = findQuizLand(kort.lande, del.lande, l.punkt, [400, 300], proj, p => d3.geoDistance(l.punkt, p) < Math.PI / 2 - .02);
    if (svar !== l.id) fejl.push(l.navn + ' → ' + svar);
  }
  return fejl;
}'''

# Skærmpunkt for et land i verdensdelens startudsnit, eller None hvis det ikke
# kan rammes sikkert (bagsiden, uden for figuren eller under en anden ring).
PUNKT='''([id, landid]) => {
  const del = window.__dele.find(d => d.id === id);
  const land = del.lande.find(l => l.id === landid);
  const c = document.querySelector('#globus').getBoundingClientRect();
  const proj = d3.geoOrthographic().translate([c.width/2, c.height/2]).scale(Math.min(c.width, c.height) * .455 * del.udsnit.zoom)
    .rotate([-del.udsnit.centrum[0], -del.udsnit.centrum[1]]);
  if (d3.geoDistance(del.udsnit.centrum, land.punkt) > Math.PI / 2 - .1) return null;
  const [x, y] = proj(land.punkt);
  if (x < 30 || y < 30 || x > c.width - 30 || y > c.height - 30) return null;
  const naer = del.lande.some(l => l !== land && l.lille && d3.geoDistance(del.udsnit.centrum, l.punkt) < Math.PI / 2 &&
    Math.hypot(proj(l.punkt)[0] - x, proj(l.punkt)[1] - y) < 12);
  if (naer) return null;
  const p = { x: c.x + x, y: c.y + y };
  return document.elementFromPoint(p.x, p.y)?.id === 'globus' ? p : null;
}'''


def vaelg(side, id):
    side.locator('#quiz').click()
    side.locator(f'input[name="verdensdel"][value="{id}"]').check()
    side.locator('#quiz-start').click()
    expect(side.locator('#quizlinje')).to_be_visible()
    billede(side)


def afproev_verdensdele_quiz(browser, adresse, ud, skaerme=SKAERME):
    fejl=[]
    side=browser.new_page(viewport={'width':1280,'height':577},reduced_motion='reduce')
    side.on('pageerror',lambda e:fejl.append(str(e)))
    klar(side,adresse)
    for id in ['europa',*DELE]:
        mangler=side.evaluate(HITTEST,id)
        assert not mangler,(id,mangler)
    side.close()
    print('Landequiz: hit-test i sigtepunktet for alle lande i alle verdensdele OK',flush=True)

    for w,h in skaerme:
        side=browser.new_page(viewport={'width':w,'height':h},has_touch=w==390,is_mobile=w==390,reduced_motion='reduce')
        side.on('pageerror',lambda e:fejl.append(str(e)))
        side.add_init_script('Math.random=()=>0')
        side.clock.install()
        klar(side,adresse)
        side.evaluate("async()=>{window.__dele=(await import('./quizmodel.js')).verdensdele}")
        foer=billede(side)
        # Dialogen viser alle fem valg; Europa er valgt fra start.
        side.locator('#quiz').click()
        valg=side.locator('input[name="verdensdel"]')
        expect(valg).to_have_count(5)
        expect(valg.first).to_be_checked()
        expect(side.locator('#quiz-start')).to_have_text('Start Europa-quiz')
        side.locator('input[value="asien"]').check()
        expect(side.locator('#quiz-start')).to_have_text('Start Asien og Oceanien-quiz')
        assert side.evaluate('document.documentElement.scrollWidth===innerWidth')
        side.screenshot(path=str(ud/f'quizvalg-{w}x{h}.png'))
        side.keyboard.press('Escape')
        for id,(navn,antal) in DELE.items():
            vaelg(side,id)
            expect(side.locator('#quiz-fremskridt')).to_have_text(f'0 / {antal}')
            expect(side.locator('#quiz-besked')).to_contain_text(f'Alle {antal} kommer')
            expect(side.locator('#nulstil')).to_have_text(side.evaluate('id=>window.__dele.find(d=>d.id===id).knap',id))
            assert side.evaluate('document.documentElement.scrollWidth===innerWidth')
            if w>=900:
                assert side.locator('.atlas').evaluate('(el)=>el.getBoundingClientRect().bottom<=innerHeight')
            side.screenshot(path=str(ud/f'quiz-{id}-{w}x{h}.png'))
            # Hele forløbet på én skærm: tryk på alle lande, der kan rammes i
            # startudsnittet; resten via Vis landet. Andre skærme: tre spørgsmål.
            klik=vist=0
            for i in range(antal if w==1280 else 3):
                landid=side.locator('#quiz-land').get_attribute('data-land')
                side.locator('#globus').focus();side.keyboard.press('Home');billede(side)
                p=side.evaluate(PUNKT,[id,landid])
                if p:
                    side.touchscreen.tap(**p) if w==390 else side.mouse.click(**p)
                    expect(side.locator('#quiz-besked')).to_have_text(__import__('re').compile(r'^Rigtigt: '))
                    side.clock.fast_forward(1100);klik+=1
                else:
                    side.locator('#quiz-vis').click()
                    expect(side.locator('#quiz-besked')).to_contain_text('tæller som vist')
                    side.locator('#quiz-naeste').click();vist+=1
                expect(side.locator('#quiz-fremskridt')).to_have_text(f'{i+1} / {antal}')
            if w==1280:
                assert klik>=antal//2,(id,klik,vist)
                expect(side.locator('#quiz-land')).to_have_text(f'{navn} gennemført!')
                expect(side.locator('#quiz-besked')).to_have_text(
                    f"{klik} af {antal} rigtige i første forsøg · 0 forkerte svar · {vist} {'vist land' if vist==1 else 'viste lande'}.")
                side.screenshot(path=str(ud/f'quiz-{id}-gennemfoert.png'))
                # Prøv igen starter samme verdensdel forfra.
                side.locator('#quiz-igen').click()
                expect(side.locator('#quiz-fremskridt')).to_have_text(f'0 / {antal}')
                print('  ',navn,f'{klik} trykket, {vist} vist',flush=True)
            side.keyboard.press('Escape')
            expect(side.locator('#nulstil')).to_have_text('Nulstil')
            assert billede(side)==foer,(id,'Quiz ændrede den tidligere globus')
        # Valget huskes, til siden genindlæses.
        side.locator('#quiz').click()
        expect(side.locator('input[value="asien"]')).to_be_checked()
        side.keyboard.press('Escape')
        side.close()
        print('Landequiz:',w,h,'OK',flush=True)
    # Indlæsningsfejl nævner det valgte kort og starter ingen quiz.
    side=browser.new_page();side.on('pageerror',lambda e:fejl.append(str(e)));klar(side,adresse)
    side.route('**/afrika-10m.json',lambda r:r.abort())
    side.locator('#quiz').click();side.locator('input[value="afrika"]').check();side.locator('#quiz-start').click()
    expect(side.locator('#quiz-status')).to_contain_text('Afrikakortet kunne ikke hentes')
    assert not side.locator('body').evaluate("el=>el.classList.contains('quiz')")
    side.close()
    assert not fejl,fejl
    print('Landequiz: alle verdensdele, skærme, fuldt forløb og fejl OK',flush=True)


if __name__=='__main__':
    ud=Path(os.environ.get('ATLAS_TEST_UD','/tmp/smbi-landequiz'));ud.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--disable-webgl'])
        afproev_verdensdele_quiz(browser,os.environ.get('ATLAS_URL','http://localhost:8777'),ud)
        browser.close()
