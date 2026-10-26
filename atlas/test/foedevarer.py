"""Afprøv fødevaredata: temakortene, Fødevarer-fanen og stedet Afrikas Horn."""
from lagmenu_hjaelp import aabn_lag, luk_lag
import json
from pathlib import Path
from landemenu import sammenlign_med
from playwright.sync_api import expect

DATA = Path(__file__).parents[1] / 'data'


def afproev_foedevaredata():
    d = json.loads((DATA / 'foedevarer.json').read_text())
    demografi = json.loads((DATA / 'demografi.json').read_text())['lande']
    lande = {id: l for id, l in d['lande'].items() if id != 'verden'}
    assert set(lande) <= set(demografi), set(lande) - set(demografi)
    assert len(d['uaar']) == 24 and len(d['kaar']) == 63
    for id, l in lande.items():
        if 'us' in l: assert len(l['us']) == len(d['uaar']), id
        if 'ks' in l: assert len(l['ks']) == len(d['kaar']), id
        if 'u' in l: assert 2.5 <= l['u'][0] < 100 and 2022 <= l['u'][1] <= 2024, id
        if 'k' in l: assert 1000 < l['k'][0] < 4500, id
        if 'v' in l: assert 0 < l['v'][0] < 70, id
        if 'c' in l: assert 0 < l['c'] < 15 and 'cl' not in l, id
        if 'a' in l:
            assert 1 <= len(l['a']) <= 6 and all(str(a[0]) in d['afgroeder'] for a in l['a']), id
            assert [a[1] for a in l['a']] == sorted((a[1] for a in l['a']), reverse=True), id
            assert sum(a[1] for a in l['a']) <= l['at'], id
    assert sum('u' in l for l in lande.values()) > 150 and sum('k' in l for l in lande.values()) > 170
    assert sum('a' in l for l in lande.values()) > 180
    # Etiopiens «andet korn» er teff og hedder det.
    assert d['afgroeder'][str(lande['231']['a'][1][0])] == 'Teff og andet korn'
    # Oman høster få, kunstvandede marker og er udeladt fra kornudbyttet.
    assert lande['512'].get('cl') and 'c' not in lande['512']
    print('Fødevaredata: OK', flush=True)


def afproev_foedevarer(side, ud):
    d = json.loads((DATA / 'foedevarer.json').read_text())
    somalia = d['lande']['706']
    bredde, hoejde = side.viewport_size['width'], side.viewport_size['height']
    dialog = side.locator('#udforsker')

    # Stedet findes i stedlisten og har knapper til lag og lande.
    side.get_by_role('button', name='Steder', exact=True).click()
    side.locator('.stedkort', has_text='Afrikas Horn').click()
    expect(side.locator('#dialogtitel')).to_have_text('Afrikas Horn')
    expect(dialog.locator('.modelkort h3')).to_have_text(['Global cirkulation'])
    expect(dialog.locator('.modelkort')).to_contain_text('gælder hele Jorden')
    lande = dialog.locator('.stedlande button')
    expect(lande).to_have_text(['Etiopien', 'Eritrea', 'Djibouti', 'Somalia'])

    # Somalias Fødevarer-fane: tal som i datafilen og to kurver.
    lande.last.click()
    expect(side.locator('#dialogtitel')).to_have_text('Somalia')
    expect(dialog.locator('[data-fane="foedevarer"]')).to_have_attribute('aria-pressed', 'true')
    rum = dialog.locator('#landedata')
    procent = f"{somalia['u'][0]:.1f}".replace('.', ',')
    expect(rum.locator('.noegletal div').first).to_contain_text(f'{procent} %')
    expect(rum.locator('svg.foedekurve')).to_have_count(2)
    # De største afgrøder står i rækkefølge med andel af det høstede areal.
    afgroeder = rum.locator('.afgroededel .afgroeder li')
    expect(afgroeder).to_have_count(len(somalia['a']))
    expect(afgroeder.first.locator('.afgroedenavn')).to_have_text(d['afgroeder'][str(somalia['a'][0][0])])
    andel = round(100 * somalia['a'][0][1] / somalia['at'])
    expect(afgroeder.first.locator('.afgroedeandel')).to_have_text(f'{andel} %')
    vandret = side.evaluate("document.querySelector('#udforsker').scrollWidth - document.querySelector('#udforsker').clientWidth")
    assert vandret <= 0, vandret
    side.screenshot(path=str(ud / f'foedevarer-{bredde}x{hoejde}.png'))

    # Eritrea mangler FAO-tal for underernæring; fanen siger det uden at fejle.
    # Djibouti har for lidt korn til et sammenligneligt udbytte.
    side.keyboard.press('Escape')
    side.get_by_role('button', name='Steder', exact=True).click()
    side.locator('.stedkort', has_text='Afrikas Horn').click()
    dialog.locator('.stedlande button', has_text='Djibouti').click()
    expect(rum.locator('.noegletal')).to_contain_text('under 10.000 ha korn')
    dialog.locator('[data-fane="demografi"]').click()
    expect(rum.locator('svg.pyramide')).to_be_visible()
    dialog.locator('[data-fane="foedevarer"]').click()
    expect(rum.locator('svg.foedekurve').first).to_be_visible()
    # Sammenligning med Danmark: afgrøderne side om side.
    sammenlign_med(side, 'dan', 'Danmark')
    par = rum.locator('.sammenligning-forloeb', has_text='Største afgrøder')
    expect(par.locator('.landenavn')).to_have_text(['Djibouti', 'Danmark'])
    expect(par.locator('.afgroeder').last.locator('li').first).to_contain_text('Byg')
    side.keyboard.press('Escape')
    expect(dialog).to_be_hidden()

    # Knappen på stedet slår temakortet til med underernæring.
    side.get_by_role('button', name='Steder', exact=True).click()
    side.locator('.stedkort', has_text='Afrikas Horn').click()
    dialog.get_by_role('button', name='Vis underernæring på temakortet', exact=True).click()
    expect(dialog).to_be_hidden()
    expect(side.locator('#temalag')).to_have_attribute('aria-pressed', 'true')
    expect(side.locator('#temaindikator')).to_have_value('underernaering')
    expect(side.locator('#temaforklaring')).to_contain_text('2024 · %')
    raekker = side.locator('#temaklasser li:not(.ingen)')
    expect(raekker).to_have_count(5)
    antal = [int(t) for t in raekker.locator('small').all_inner_texts()]
    assert sum(antal) == sum('u' in l for id, l in d['lande'].items() if id != 'verden'), antal
    # Kornudbyttets rangliste har ikke golfstaternes drivhuskorn i toppen.
    side.locator('#temaindikator').select_option('kornudbytte')
    expect(side.locator('#temaforklaring')).to_contain_text('2022–2024 · t pr. ha')
    side.locator('#temaopgave').click()
    top = dialog.locator('.rangpar .rangtabel').first.locator('tbody tr')
    expect(top).to_have_count(10)
    assert 'Oman' not in top.all_inner_texts()
    top.first.get_by_role('button').click()
    expect(dialog.locator('[data-fane="foedevarer"]')).to_have_attribute('aria-pressed', 'true')
    side.keyboard.press('Escape')
    side.locator('#temaindikator').select_option('tfr')
    luk_lag(side)
    aabn_lag(side, side.locator('#temalag')).click()
    luk_lag(side)
    expect(side.locator('#temalag')).to_have_attribute('aria-pressed', 'false')
    print('Fødevarer og Afrikas Horn', bredde, hoejde, ': OK', flush=True)
