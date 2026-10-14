"""Regression for #51: globale piletaster og komponenters egen betjening."""
from playwright.sync_api import expect


def billede(side):
    # Sammenlign selve tegningen, så ændret CSS-fokus ikke kan give falsk positiv.
    return side.evaluate('''async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return document.querySelector('#globus').toDataURL();
    }''')


def afproev_piletaster(side):
    canvas = side.locator('#globus')
    nulstil = side.locator('#nulstil')
    nulstil.click()

    # Ingen af disse handlinger må kræve et indledende klik på canvas.
    top = side.locator('.site-linje')
    top.click(position={'x': top.bounding_box()['width'] * .45, 'y': 15})
    foer = billede(side)
    side.keyboard.press('ArrowRight')
    assert billede(side) != foer, 'Pil efter klik på topbaren drejer ikke globussen'
    for maal, pil in [('.brand', 'ArrowLeft'), ('#fokus', 'ArrowUp'), ('[data-sted="alperne"]', 'ArrowDown')]:
        side.locator(maal).focus()
        foer = billede(side)
        side.keyboard.press(pil)
        assert billede(side) != foer, (maal, pil)
        expect(side.locator(maal)).to_be_focused()

    # En pil på canvas må ikke håndteres to gange ved bubbling til dokumentet.
    nulstil.click()
    canvas.focus()
    side.keyboard.press('ArrowRight')
    et_trin = billede(side)
    nulstil.click()
    side.locator('#fokus').focus()
    side.keyboard.press('ArrowRight')
    assert billede(side) == et_trin, 'Forskellig/dobbelt rotation med canvasfokus'

    # Almindelige knapper og links bevarer Enter/Space uden tvungen fokusflytning.
    side.keyboard.press('Enter')
    expect(side.locator('#fokus')).to_have_attribute('aria-pressed', 'true')
    side.keyboard.press('Space')
    expect(side.locator('#fokus')).to_have_attribute('aria-pressed', 'false')

    side.get_by_role('button', name='Søg', exact=True).click()
    felt = side.get_by_role('searchbox')
    felt.fill('Island')
    felt.press('End')
    foer = billede(side)
    felt.press('ArrowLeft')
    assert felt.evaluate('(felt) => felt.selectionStart') == 5
    assert billede(side) == foer, 'Globussen drejer under tekstredigering i søgning'
    side.locator('#luk').focus()
    side.keyboard.press('ArrowDown')
    assert billede(side) == foer, 'Globussen drejer bag en åben dialog'
    side.keyboard.press('Escape')
    expect(side.get_by_role('button', name='Søg', exact=True)).to_be_focused()

    # Prøv native kontroller og sammensatte widgets, selv om de ikke alle
    # findes på siden endnu. De indsættes kun i testens browser og fjernes igen.
    side.evaluate('''() => {
      const felt = document.createElement('div');
      felt.id = 'tastaturproeve';
      felt.style = 'position:fixed;bottom:0;right:0;max-width:180px;z-index:10';
      felt.innerHTML = `<input id="proeve-input" value="tekst">
        <textarea id="proeve-tekst">tekst</textarea>
        <select id="proeve-valg"><option>a</option><option>b</option></select>
        <input id="proeve-skyder" type="range" value="50">
        <div contenteditable="true"><span id="proeve-redigerbar" tabindex="0">tekst</span></div>
        <div role="grid"><button id="proeve-gitter">celle</button></div>
        <div role="radiogroup"><button role="radio" id="proeve-radio">valg</button></div>
        <div role="menu"><button id="proeve-menu">punkt</button></div>
        <button id="proeve-ejer">egen tastaturhandling</button>`;
      document.body.append(felt);
      document.querySelector('#proeve-ejer').addEventListener('keydown', e => e.preventDefault());
    }''')
    for maal in ['#proeve-input', '#proeve-tekst', '#proeve-valg', '#proeve-skyder',
                 '#proeve-redigerbar', '#proeve-gitter', '#proeve-radio', '#proeve-menu', '#proeve-ejer']:
        side.locator(maal).focus()
        foer = billede(side)
        side.keyboard.press('ArrowRight')
        assert billede(side) == foer, f'Globussen kaprer piletaster fra {maal}'
    expect(side.locator('#proeve-skyder')).to_have_value('51')
    side.locator('#proeve-tekst').focus()
    side.locator('#proeve-tekst').press('End')
    side.keyboard.press('ArrowLeft')
    assert side.locator('#proeve-tekst').evaluate('(felt) => felt.selectionStart') == 4
    side.locator('#proeve-valg').focus()
    side.keyboard.press('ArrowDown')
    expect(side.locator('#proeve-valg')).to_have_value('b')
    side.locator('#tastaturproeve').evaluate('(el) => el.remove()')

    # Browser-/hjælpeteknologigenveje og IME må ikke få preventDefault.
    # Syntetiske events undgår at udføre browserens faktiske historikgenvej.
    canvas.focus()
    for egenskab in ['altKey', 'ctrlKey', 'metaKey', 'shiftKey', 'isComposing']:
        foer = billede(side)
        tilladt = canvas.evaluate('''(el, egenskab) => el.dispatchEvent(new KeyboardEvent('keydown', {
          key:'ArrowRight', bubbles:true, composed:true, cancelable:true, [egenskab]:true
        }))''', egenskab)
        assert tilladt and billede(side) == foer, egenskab
    nulstil.click()
    side.evaluate('window.scrollTo(0, 0)')
