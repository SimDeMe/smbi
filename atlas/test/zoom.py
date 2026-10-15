"""Zoom op til 10× på globussen og i quizzen med detaljeret kort tæt på."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from piletaster import billede
from europa_quiz import klar


def hentet(side, navn):
    return side.evaluate("n=>performance.getEntriesByType('resource').some(r=>r.name.endsWith(n))", navn)


def afproev_zoom(browser, adresse, ud):
    fejl=[]
    side=browser.new_page(viewport={'width':1280,'height':577},reduced_motion='reduce')
    side.on('pageerror',lambda e:fejl.append(str(e)))
    klar(side,adresse)
    assert not hentet(side,'countries-50m.json'), 'Detaljekortet må først hentes ved tæt zoom'
    foer=billede(side)
    canvas=side.locator('#globus');canvas.focus()
    for _ in range(4): side.keyboard.press('+')
    expect(side.locator('#zoomniveau')).to_have_text('2,1×')
    billede(side);assert not hentet(side,'countries-50m.json')
    for _ in range(20): side.keyboard.press('+')
    expect(side.locator('#zoomniveau')).to_have_text('10,0×')
    expect(side.locator('#zoom-ind')).to_be_disabled()
    side.wait_for_function("performance.getEntriesByType('resource').some(r=>r.name.endsWith('countries-50m.json'))")
    billede(side)
    side.screenshot(path=str(ud/'zoom-10x.png'))
    # Drej mod Danmark (3×12° øst, 12° nord → centrum 14°Ø, 54°N) og tryk på
    # Midtjylland ved 10×: det detaljerede Danmark åbner landemenuen med landekort.
    side.locator('#nulstil').click()
    canvas.focus()
    for k in ['ArrowRight']*3+['ArrowUp']: side.keyboard.press(k)
    for _ in range(13): side.keyboard.press('+')
    expect(side.locator('#zoomniveau')).to_have_text('10,0×')
    billede(side)
    p=side.evaluate('''()=>{const c=document.querySelector('#globus').getBoundingClientRect();
      const proj=d3.geoOrthographic().translate([c.width/2,c.height/2]).scale(Math.min(c.width,c.height)*.455*10).rotate([-14,-54]);
      const xy=proj([9.4,56.2]);return {x:c.x+xy[0],y:c.y+xy[1]};}''')
    side.screenshot(path=str(ud/'zoom-danmark-10x.png'))
    side.mouse.click(**p)
    expect(side.locator('#landemenu h2')).to_have_text('Danmark')
    side.locator('#landemenu [data-valg="landekort"]').click()
    expect(side.locator('#landetop')).to_be_visible()
    side.locator('#til-globus').click()
    expect(side.locator('#zoomniveau')).to_have_text('10,0×')
    side.locator('#nulstil').click()
    expect(side.locator('#zoomniveau')).to_have_text('1,0×')
    assert billede(side)==foer,'Nulstil gav ikke den oprindelige globus'
    # Quizzen har samme grænse.
    side.locator('#quiz').click();side.locator('#quiz-start').click()
    expect(side.locator('#quizlinje')).to_be_visible()
    canvas.focus()
    for _ in range(12): side.keyboard.press('+')
    expect(side.locator('#zoomniveau')).to_have_text('10,0×')
    expect(side.locator('#zoom-ind')).to_be_disabled()
    side.screenshot(path=str(ud/'zoom-quiz-10x.png'))
    side.keyboard.press('Escape')
    expect(side.locator('#zoomniveau')).to_have_text('1,0×')
    side.close()
    assert not fejl,fejl
    print('Zoom: 10× på globus og i quiz, detaljekort ved tæt zoom og nulstil OK',flush=True)


if __name__=='__main__':
    ud=Path(os.environ.get('ATLAS_TEST_UD','/tmp/smbi-zoom'));ud.mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--disable-webgl'])
        afproev_zoom(browser,os.environ.get('ATLAS_URL','http://localhost:8777'),ud)
        browser.close()
