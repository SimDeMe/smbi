"""Forsøgsvejledninger i atlasset: under steder, undersøgelser, Processer og Søg."""
from playwright.sync_api import expect


def afproev_oevelser(side):
    register = side.evaluate('''async () => {
      const {oevelser} = await import('/atlas/modeller.js');
      const svar = [];
      for (const o of oevelser) for (const x of ['html', 'pdf']) {
        const sti = `/Øvelser/Geografi/${o.id}/${o.id}.${x}`;
        svar.push([sti, (await fetch(sti, {method: 'HEAD'})).status]);
      }
      return {antal: oevelser.length, island: oevelser.filter(o => o.steder.includes('island')).length, status: svar};
    }''')
    assert all(status == 200 for _, status in register['status']), [s for s in register['status'] if s[1] != 200]
    # Stedet: sammenfoldet liste under modelkortene, som kan åbnes.
    side.locator('[data-sted="island"]').click()
    boks = side.locator('#dialogindhold .oevelser')
    expect(boks.locator('summary')).to_have_text(f'Forsøgsvejledninger ({register["island"]})')
    expect(boks.locator('.oevelsesliste')).to_be_hidden()
    boks.locator('summary').click()
    expect(boks.locator('.oevelsesliste li')).to_have_count(register['island'])
    vandret = side.evaluate("(d => d.scrollWidth - d.clientWidth)(document.querySelector('#udforsker'))")
    assert vandret == 0, vandret
    side.keyboard.press('Escape')
    # Processer viser alle; jordskælvsundersøgelsen viser sine egne.
    side.get_by_role('button', name='Processer', exact=True).first.click()
    expect(side.locator('#dialogindhold .oevelser summary')).to_have_text(f'Forsøgsvejledninger ({register["antal"]})')
    side.get_by_role('button', name='Undersøg jordskælv og vulkaner', exact=True).click()
    side.locator('#dialogindhold .oevelser summary').click()
    expect(side.get_by_role('link', name='Lokalisering af jordskælv', exact=True)).to_have_attribute(
        'href', '/Øvelser/Geografi/lokalisering-af-jordskaelv/lokalisering-af-jordskaelv.html')
    side.keyboard.press('Escape')
    # Søgning finder øvelser og folder listen ud.
    side.get_by_role('button', name='Søg', exact=True).click()
    side.get_by_role('searchbox').fill('slinky')
    expect(side.locator('#dialogindhold .antal')).to_have_text('0 af 9 simulationer · 1 øvelse')
    expect(side.get_by_role('link', name='P- og S-bølger i en slinky', exact=True)).to_be_visible()
    # Escape i et udfyldt søgefelt rydder kun feltet; luk dialogen med knappen.
    side.locator('#luk').click()
    expect(side.locator('#udforsker')).to_be_hidden()
