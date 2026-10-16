"""Browsertest uden build. Kræver Python Playwright og en lokal HTTP-server."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from piletaster import afproev_piletaster
from landekort import afproev_landekort
from landemenu import afproev_landemenu
from europa_quiz import afproev_europa_quiz
from verdensdele_quiz import afproev_verdensdele_quiz
from zoom import afproev_zoom
from information import afproev_stedinformation, afproev_kortinformation
from oevelser import afproev_oevelser
from pladelag import afproev_pladelag, afproev_pladefejl, afproev_pladetilpasning
from klimalag import afproev_klimalag, afproev_klimafejl, afproev_klimadata
from seismik import afproev_seismik, afproev_seismikfejl, afproev_seismikdata
from temakort import afproev_temakort, afproev_temafejl
from island3d import afproev_island3d
from islandsnit import afproev_islandsnit
from island import afproev_island, afproev_islandbevaegelse, afproev_islandintegration, afproev_islandtouch, afproev_islandkort
from pladevisning import afproev_pladevisning, afproev_bevaegelsesfejl, afproev_bevaegelsestilpasning, afproev_graensefejl

ADRESSE = os.environ.get('ATLAS_URL', 'http://localhost:8777')
UD = Path(os.environ.get('ATLAS_TEST_UD', '/tmp/smbi-atlas-test'))
UD.mkdir(parents=True, exist_ok=True)
SKAERME = [(1280, 577), (1366, 625), (1536, 730), (390, 750), (640, 625)]


def klar(side):
    side.goto(ADRESSE + '/atlas/')
    side.wait_for_function("document.querySelector('#kortstatus').hidden")
    side.evaluate('document.fonts.ready')
    side.wait_for_timeout(100)


with sync_playwright() as p:
    # Canvas tegnes i software: Chromium flytter ellers et 2D-canvas fra GPU til CPU
    # efter få getImageData-kald, og samme tegning får så anden kantudglatning.
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM', '/usr/bin/chromium'), headless=True,
                                args=['--no-sandbox', '--disable-webgl', '--disable-accelerated-2d-canvas'])
    fejl = []
    for bredde, hoejde in SKAERME:
        side = browser.new_page(viewport={'width': bredde, 'height': hoejde},
                                has_touch=bredde == 390, is_mobile=bredde == 390, reduced_motion='reduce')
        side.on('pageerror', lambda e: fejl.append(str(e)))
        side.on('console', lambda e: fejl.append(e.text) if e.type == 'error' else None)
        klar(side)
        maal = side.evaluate('''() => {
          const a = document.querySelector('.atlas').getBoundingClientRect();
          const c = document.querySelector('#globus').getBoundingClientRect();
          const k = [...document.querySelectorAll('.vaerktoejer button, .betjeningslinje button')].map(x => x.getBoundingClientRect().bottom);
          return {bund:a.bottom,figur:[c.width,c.height],kontrolbund:Math.max(...k),vandret:document.documentElement.scrollWidth-innerWidth};
        }''')
        assert maal['vandret'] == 0, maal
        if bredde >= 900:
            assert maal['kontrolbund'] <= hoejde and maal['bund'] <= hoejde, maal
            assert maal['figur'][1] >= 350, maal
        side.screenshot(path=str(UD / f'{bredde}x{hoejde}.png'))
        # Klik alle geografiske markører direkte, også på touch-skærmen.
        for sted, navn in [('island', 'Island'), ('nordatlanten', 'Grønland / Nordatlanten'), ('alperne', 'Alperne')]:
            side.locator(f'[data-sted="{sted}"]').click()
            expect(side.locator('#udforsker')).to_be_visible()
            expect(side.locator('#dialogtitel')).to_have_text(navn)
            assert side.locator('.modelkort a').count() >= 1
            afproev_stedinformation(side, sted, navn, UD)
            side.keyboard.press('Escape')
        afproev_kortinformation(side)
        side.get_by_role('button', name='Processer', exact=True).first.click()
        side.get_by_role('button', name='Global atmosfære', exact=True).click()
        assert side.locator('.modelkort').count() == 2
        assert 'hele Jorden' in side.locator('#dialogindhold').inner_text()
        side.keyboard.press('Escape')
        side.get_by_role('button', name='Søg', exact=True).click()
        felt = side.get_by_role('searchbox')
        for ord, antal in [('Island', 2), ('groenland', 1), ('føhn', 1), ('CO2', 2), ('umuligtsoegeord', 0), ('', 8)]:
            felt.fill(ord)
            assert side.locator('.modelkort').count() == antal, (ord, antal)
        side.keyboard.press('Escape')
        expect(side.get_by_role('button', name='Søg', exact=True)).to_be_focused()
        afproev_oevelser(side)
        # Alle otte links peger på eksisterende simulationer med korrekt store/små bogstaver.
        side.get_by_role('button', name='Processer', exact=True).first.click()
        for link in side.locator('.modelkort a').all():
            svar = side.request.get(ADRESSE + link.get_attribute('href'))
            assert svar.status == 200
        side.keyboard.press('Escape')
        canvas = side.locator('#globus')
        afproev_piletaster(side)
        afproev_pladelag(side, UD)
        afproev_pladevisning(side, UD)
        afproev_klimalag(side, UD)
        afproev_seismik(side, UD)
        afproev_temakort(side, UD)
        foer = canvas.screenshot()
        canvas.focus()
        side.keyboard.press('ArrowRight')
        side.wait_for_timeout(100)
        assert canvas.screenshot() != foer, 'Piletast ændrer ikke globussen'
        side.keyboard.press('+')
        expect(side.locator('#zoomniveau')).to_have_text('1,2×')
        side.keyboard.press('Home')
        expect(side.locator('#zoomniveau')).to_have_text('1,0×')
        boks = canvas.bounding_box()
        side.mouse.move(boks['x'] + boks['width'] / 2, boks['y'] + boks['height'] * .7)
        side.mouse.down()
        side.mouse.move(boks['x'] + boks['width'] / 2 + 110, boks['y'] + boks['height'] * .7 + 30, steps=8)
        side.mouse.up()
        side.wait_for_timeout(100)
        assert canvas.screenshot() != foer, 'Træk ændrer ikke globussen'
        side.get_by_role('button', name='Nulstil', exact=True).click()
        # Zoomgrænser og nulstilling.
        for _ in range(16):
            if side.locator('#zoom-ind').is_enabled():
                side.locator('#zoom-ind').click()
                side.wait_for_timeout(60)
        expect(side.locator('#zoom-ind')).to_be_disabled()
        expect(side.locator('#zoomniveau')).to_have_text('10,0×')
        side.get_by_role('button', name='Nulstil', exact=True).click()
        side.get_by_role('button', name='Fokus', exact=True).click()
        side.wait_for_timeout(100)
        assert side.locator('.site-header').is_hidden()
        side.screenshot(path=str(UD / f'{bredde}x{hoejde}-fokus.png'))
        side.keyboard.press('Escape')
        expect(side.locator('.site-header')).to_be_visible()
        print(json.dumps({'skaerm': [bredde, hoejde], 'maal': maal, 'resultat': 'OK'}, ensure_ascii=False))
        side.close()

    # Touch-rotation og ægte tofingerzoom gennem Chromiums inputprotokol.
    side = browser.new_page(viewport={'width':390, 'height':750}, has_touch=True, is_mobile=True)
    side.on('pageerror', lambda e: fejl.append(str(e)))
    klar(side)
    session = side.context.new_cdp_session(side)
    canvas = side.locator('#globus')
    side.locator('#pladelag').tap()
    expect(side.locator('#pladelag')).to_have_attribute('aria-pressed', 'true')
    side.locator('#pladevisning').tap()
    side.locator('#pladenavne').tap()
    expect(side.locator('#pladenavne')).to_be_enabled()
    side.locator('#pladepile').tap()
    expect(side.locator('#pladepile')).to_be_enabled()
    side.keyboard.press('Escape')
    side.evaluate('scrollTo(0, 0)')
    foer = canvas.screenshot()
    session.send('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':[{'x':150,'y':460,'id':1}]})
    session.send('Input.dispatchTouchEvent', {'type':'touchMove','touchPoints':[{'x':230,'y':490,'id':1}]})
    session.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
    side.wait_for_timeout(100)
    assert canvas.screenshot() != foer
    side.get_by_role('button', name='Nulstil', exact=True).click()
    session.send('Input.dispatchTouchEvent', {'type':'touchStart','touchPoints':[{'x':130,'y':460,'id':1},{'x':240,'y':460,'id':2}]})
    session.send('Input.dispatchTouchEvent', {'type':'touchMove','touchPoints':[{'x':90,'y':460,'id':1},{'x':280,'y':460,'id':2}]})
    session.send('Input.dispatchTouchEvent', {'type':'touchEnd','touchPoints':[]})
    side.wait_for_timeout(100)
    assert side.locator('#zoomniveau').inner_text() != '1,0×'
    print('Touch-rotation og tofingerzoom: OK')
    side.close()

    for fejltype in ['kortdata', 'bibliotek', 'canvas']:
        side = browser.new_page()
        side.on('pageerror', lambda e: fejl.append(str(e)))
        if fejltype == 'kortdata': side.route('**/countries-110m.json', lambda r: r.abort())
        if fejltype == 'bibliotek': side.route('**/vendor/d3-geo.min.js', lambda r: r.abort())
        if fejltype == 'canvas': side.add_init_script('HTMLCanvasElement.prototype.getContext = () => null')
        side.goto(ADRESSE + '/atlas/')
        expect(side.locator('#kortstatus')).to_contain_text('Alle simulationer er stadig tilgængelige')
        side.get_by_role('button', name='Søg', exact=True).click()
        side.get_by_role('searchbox').fill('drivhus')
        assert side.locator('.modelkort').count() == 2
        side.locator('#luk').click()
        side.get_by_role('button', name='Processer', exact=True).first.click()
        side.get_by_role('button', name='Undersøg pladegrænserne', exact=True).click()
        expect(side.locator('.pladeoversigt ul')).to_be_visible()
        expect(side.locator('.pladeoversigt')).to_contain_text('Nordamerikanske')
        expect(side.locator('.opgaveliste')).to_be_visible()
        assert side.locator('.modelkort a').count() == 2
        side.locator('.pladetabeloversigt summary').click()
        expect(side.locator('#pladenavnetabel tbody tr')).to_have_count(52)
        side.locator('.graenseoversigt summary').click()
        expect(side.locator('#graensehastighedstabel [data-trin="4200"]')).to_contain_text('Fra 1,8 cm/år')
        side.screenshot(path=str(UD / f'fallback-{fejltype}.png'))
        print('Fallback', fejltype, ': OK')
        side.close()
    afproev_pladefejl(browser, ADRESSE)
    print('Fallback pladedata/modul, ugyldige koordinater og nyt forsøg : OK')
    afproev_klimadata()
    afproev_klimafejl(browser, ADRESSE)
    afproev_seismikdata()
    afproev_seismikfejl(browser, ADRESSE)
    afproev_temafejl(browser, ADRESSE)
    print('Klimalag: data, data-/modulfejl og nyt forsøg: OK')
    afproev_pladetilpasning(browser, ADRESSE)
    print('Skærmstørrelsesskift med pladelaget : OK')
    afproev_bevaegelsesfejl(browser, ADRESSE)
    print('Navne og bevægelse: data-/modulfejl, validering og nyt forsøg: OK')
    afproev_graensefejl(browser, ADRESSE)
    print('Grænsehastigheder: data-/modulfejl, komponenter og enheder: OK')
    afproev_bevaegelsestilpasning(browser, ADRESSE)
    print('Skærmstørrelsesskift med navne, pile og åbne indstillinger: OK')
    afproev_island(browser, ADRESSE, UD, SKAERME)
    print('Island-tværsnit: skærme, skift, hotspot, elevtekst, fokus: OK')
    afproev_islandbevaegelse(browser, ADRESSE, UD, SKAERME)
    print('Island: lag, 2D/3D, drejning, animation og fallback: OK')
    afproev_islandintegration(browser, ADRESSE, UD, SKAERME)
    print('Island i atlasset: markør → tværsnit → tilbage til globussen: OK')
    afproev_islandkort(browser, ADRESSE, UD, SKAERME)
    print('Island-kortet: skærme, lag, projektion, højder, zoom, tastatur, kilder og fejl: OK')
    afproev_island3d(browser, ADRESSE, UD, SKAERME)
    afproev_islandsnit(browser, ADRESSE, UD, SKAERME)
    afproev_landekort(browser, ADRESSE, UD, SKAERME)
    afproev_landemenu(browser, ADRESSE, UD, SKAERME)
    afproev_islandtouch(browser, ADRESSE)
    print('Island: touch-strøg drejer blokken vandret og ruller siden lodret: OK')
    afproev_europa_quiz(browser, ADRESSE, UD, SKAERME)
    afproev_verdensdele_quiz(browser, ADRESSE, UD, SKAERME)
    afproev_zoom(browser, ADRESSE, UD)
    assert not fejl, fejl
    browser.close()
    print('Ingen JavaScript-fejl. Skærmbilleder:', UD)
