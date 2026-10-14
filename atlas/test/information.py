"""Afprøv #50: skjulte supplerende oplysninger uden ekstra modal."""
from playwright.sync_api import expect
from piletaster import billede


def afproev_stedinformation(side, sted, navn, ud):
    data = side.evaluate('''async id => {
      const {steder} = await import('/atlas/modeller.js');
      return steder.find(sted => sted.id === id);
    }''', sted)
    assert side.locator('#dialogindhold .forbehold').count() == 0, 'Permanent forbeholdsboks'
    expect(side.locator('#dialogindhold')).to_contain_text(data['modelnote'])
    knap = side.get_by_role('button', name=f'Om modellen: {navn}', exact=True)
    expect(knap).to_have_attribute('aria-expanded', 'false')
    panel = side.locator('#' + knap.get_attribute('aria-controls'))
    expect(panel).to_be_hidden()
    assert side.get_by_role('region', name='Om modellen', exact=True).count() == 0
    bredde = side.viewport_size['width']
    if bredde == 390:
        knap.tap()
    else:
        knap.click()
    expect(panel).to_be_visible()
    expect(knap).to_have_attribute('aria-expanded', 'true')
    expect(panel.get_by_role('heading', name='Om modellen', exact=True)).to_be_focused()
    expect(panel).to_contain_text(data['forbehold'])
    expect(side.get_by_role('region', name='Om modellen', exact=True)).to_be_visible()
    # Feltet følger indholdet frem for at overlappe dialogens navigation.
    maal = panel.evaluate('''el => {
      const r=el.getBoundingClientRect(), d=el.closest('dialog').getBoundingClientRect();
      const h=document.querySelector('.dialogtop').getBoundingClientRect();
      return {venstre:r.left,hoejre:r.right,top:r.top,bund:r.bottom,dialogbund:d.bottom,headerbund:h.bottom,vandret:el.closest('dialog').scrollWidth-el.closest('dialog').clientWidth};
    }''')
    assert maal['venstre'] >= 0 and maal['hoejre'] <= bredde and maal['vandret'] == 0, maal
    assert maal['top'] >= maal['headerbund'] and maal['bund'] <= maal['dialogbund'], maal
    side.screenshot(path=str(ud / f'info-{sted}-{bredde}x{side.viewport_size["height"]}.png'))
    foer = billede(side)
    side.keyboard.press('ArrowDown')
    assert billede(side) == foer, 'Piletast drejer globussen under læsning'
    side.keyboard.press('Escape')
    expect(panel).to_be_hidden()
    expect(knap).to_be_focused()
    expect(side.locator('#udforsker')).to_be_visible()
    expect(knap).to_have_attribute('aria-expanded', 'false')
    knap.press('Enter')
    expect(panel).to_be_visible()
    panel.get_by_role('button', name=f'Luk information om {navn}', exact=True).click()
    expect(panel).to_be_hidden()
    expect(knap).to_be_focused()
    knap.press('Space')
    expect(panel).to_be_visible()
    side.locator('#dialogtitel').click()
    expect(panel).to_be_hidden()
    expect(side.locator('#udforsker')).to_be_visible()


def afproev_kortinformation(side):
    side.locator('#hjaelp').click()
    knap = side.get_by_role('button', name='Om kortet: Globussen', exact=True)
    panel = side.locator('#' + knap.get_attribute('aria-controls'))
    expect(panel).to_be_hidden()
    expect(side.locator('#dialogindhold')).to_contain_text('ikke aktuelle vejr- eller klimadata')
    knap.press('Enter')
    expect(panel).to_contain_text('Natural Earth')
    expect(panel).to_contain_text('world-atlas 2.0.2')
    # Luk hele værtsdialogen, mens oplysninger er åbne. Ingen gammel
    # Escape-handler må bagefter sluge en tast eller fokusere fjernede knapper.
    side.locator('#luk').click()
    side.get_by_role('button', name='Steder', exact=True).click()
    side.locator('.stedkort').first.focus()
    side.keyboard.press('Enter')
    knap = side.get_by_role('button', name='Om modellen: Island', exact=True)
    knap.press('Enter')
    side.get_by_role('button', name='← Alle steder', exact=True).focus()
    side.keyboard.press('Enter')
    assert side.locator('.oplysning-panel').count() == 0
    side.keyboard.press('Escape')
    expect(side.locator('#udforsker')).to_be_hidden()
