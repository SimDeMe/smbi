"""Afprøv #49 milepæl B: det statiske Island-tværsnit som selvstændigt modul."""
import re
from pathlib import Path
from playwright.sync_api import expect

MODEL = Path(__file__).resolve().parents[1] / 'ISLAND-MODEL.md'


def elevtekst():
    """Trinenes brødtekst og «Se efter» fra afsnit 2 i ISLAND-MODEL.md."""
    afsnit = MODEL.read_text().split('## 2.')[1].split('## 3.')[0]
    trin = []
    for blok in re.split(r'^### Trin \d · ', afsnit, flags=re.M)[1:]:
        titel, *resten = blok.strip().split('\n\n')
        tekst, seefter = [], ''
        for afs in resten:
            afs = ' '.join(afs.split())
            if afs.startswith('*Se efter:*'): seefter = afs.removeprefix('*Se efter:*').strip()
            elif not afs.startswith('*Lærernote'): tekst.append(afs)
        trin.append((titel.strip(), tekst, seefter))
    return trin


def maal(side):
    return side.evaluate('''() => {
      const r = s => document.querySelector(s).getBoundingClientRect();
      const k = [...document.querySelectorAll('.skift button, .trinvalg button, #naeste')].map(x => x.getBoundingClientRect().bottom);
      return {figur: [r('#tvaersnit').width, r('#tvaersnit').height], figurbund: r('#tvaersnit').bottom,
              kontrolbund: Math.max(...k), vandret: document.documentElement.scrollWidth - innerWidth};
    }''')


def afproev_island(browser, adresse, ud, skaerme):
    fejl = []
    for bredde, hoejde in skaerme:
        side = browser.new_page(viewport={'width': bredde, 'height': hoejde},
                                has_touch=bredde == 390, is_mobile=bredde == 390, reduced_motion='reduce')
        side.on('pageerror', lambda e: fejl.append(str(e)))
        side.on('console', lambda e: fejl.append(e.text) if e.type == 'error' else None)
        side.goto(adresse + '/atlas/island/')
        side.evaluate('document.fonts.ready')
        expect(side.locator('#tvaersnit [data-lag="smelt"]')).to_have_count(1)
        m = maal(side)
        assert m['vandret'] == 0, m
        if bredde >= 900:
            # Figur og alle primære kontroller samtidig uden at rulle.
            assert m['kontrolbund'] <= hoejde and m['figurbund'] <= hoejde, m
            assert m['figur'][1] >= 330, m
        else:
            assert m['figur'][1] >= 330, m
        expect(side.locator('.skematisk')).to_be_visible()
        expect(side.locator('.skematisk')).to_contain_text('Skematisk – ikke målfast')
        side.screenshot(path=str(ud / f'island-{bredde}x{hoejde}-ryg.png'))
        tryk = (lambda l: l.tap()) if bredde == 390 else (lambda l: l.click())
        tryk(side.get_by_role('button', name='Island', exact=True))
        expect(side.get_by_role('button', name='Island', exact=True)).to_have_attribute('aria-pressed', 'true')
        expect(side.locator('#tvaersnit [data-lag="hotspot"]')).to_have_count(1)
        assert maal(side)['vandret'] == 0
        side.screenshot(path=str(ud / f'island-{bredde}x{hoejde}-island.png'))
        side.close()

    side = browser.new_page(viewport={'width': 1280, 'height': 577})
    side.on('pageerror', lambda e: fejl.append(str(e)))
    side.goto(adresse + '/atlas/island/')
    expect(side.locator('#tvaersnit [data-lag="smelt"]')).to_have_count(1)

    # Modellens påstande: Island har tykkere skorpe, dybere smeltestart og land over havet.
    g = side.evaluate('''async () => {
      const { geometri } = await import('./tvaersnit.js');
      const ud = {};
      for (const island of [false, true]) {
        const g = geometri(800, 400, island);
        ud[island ? 'island' : 'ryg'] = {skorpe: g.skorpebund(600) - g.overflade(600), overflade: g.overflade(80),
          land: g.overflade(400 - 60) < g.hav, smeltestart: g.smeltestart, plade: g.pladebund(400)};
      }
      return ud;
    }''')
    assert g['island']['skorpe'] > 2.5 * g['ryg']['skorpe'], g
    assert g['island']['smeltestart'] > g['ryg']['smeltestart'], g
    assert g['island']['land'] and not g['ryg']['land'], g
    assert g['island']['plade'] > g['ryg']['plade'], g

    # Skifteknappen og tekstalternativet.
    beskr = side.locator('#figurbeskrivelse')
    expect(beskr).to_contain_text('Den Midtatlantiske Ryg')
    expect(side.locator('#hotspot')).to_be_disabled()
    expect(side.locator('#tvaersnit [data-lag="hotspot"]')).to_have_count(0)
    side.get_by_role('button', name='Island', exact=True).focus()
    side.keyboard.press('Enter')
    expect(side.locator('#status')).to_have_text('Viser Island.')
    assert side.evaluate('location.hash') == '#island'
    expect(beskr).to_contain_text('fortolkning')
    expect(side.locator('#hotspot')).to_be_enabled()
    side.locator('#hotspot').uncheck()
    expect(side.locator('#tvaersnit [data-lag="hotspot"]')).to_have_count(0)
    expect(beskr).to_contain_text('slået fra')
    side.locator('#hotspot').check()
    expect(side.locator('#tvaersnit [data-lag="hotspot"]')).to_have_count(1)
    side.reload()
    expect(side.get_by_role('button', name='Island', exact=True)).to_have_attribute('aria-pressed', 'true')
    side.get_by_role('button', name='Den Midtatlantiske Ryg', exact=True).click()
    assert side.evaluate('location.hash') == ''

    # Elevteksten er ordret den godkendte i ISLAND-MODEL.md, og trinnene fremhæver figuren.
    trin = elevtekst()
    assert len(trin) == 6 and side.locator('.trinvalg button').count() == 7
    for i, (titel, tekst, seefter) in enumerate(trin, 1):
        side.get_by_role('button', name=f'Trin {i}: {titel}', exact=True).click()
        expect(side.locator('#trintitel')).to_have_text(f'Trin {i} · {titel}')
        vist = side.locator('#trintekst p').all_inner_texts()
        assert vist == tekst, (i, vist, tekst)
        assert side.locator('#seefter').inner_text().startswith('Se efter: ' + seefter.replace('*', '')), i
        if i < 6: assert side.locator('#tvaersnit.fremhaevet [data-lag].aktiv').count() >= 1, i
    # Hotspotlaget findes ikke ved ryggen: intet tones ned, og teksten siger hvorfor.
    assert side.locator('#tvaersnit.fremhaevet').count() == 0
    expect(side.locator('#seefter')).to_contain_text('kun i tværsnittet af Island')
    side.get_by_role('button', name='Island', exact=True).click()
    expect(side.locator('#tvaersnit.fremhaevet [data-lag="hotspot"].aktiv')).to_have_count(1)
    expect(side.locator('#seefter .hint')).to_have_count(0)
    side.get_by_role('button', name='Den Midtatlantiske Ryg', exact=True).click()
    expect(side.locator('#naeste')).to_be_disabled()
    side.locator('#forrige').focus()
    for _ in range(6): side.keyboard.press('Enter')
    expect(side.locator('#trintitel')).to_have_text('Kort fortalt')
    assert side.locator('#tvaersnit.fremhaevet').count() == 0
    expect(side.locator('#forrige')).to_be_disabled()

    # Målt/model/fortolkning står som tekst, ikke kun som farve.
    for ord in ['Målt', 'Model']:
        assert side.locator('#tvaersnit .maerke', has_text=ord).count() >= 1, ord
    side.get_by_role('button', name='Island', exact=True).click()
    expect(side.locator('#tvaersnit .maerke', has_text='Fortolkning')).to_have_count(1)
    side.locator('summary', has_text='Hvad er målt').click()
    expect(side.locator('#maerker tr')).to_have_count(8)

    # Fokus skjuler site-krom uden browserfuldskærm; figuren bliver højere.
    foer = maal(side)['figur'][1]
    side.get_by_role('button', name='Fokus', exact=True).click()
    expect(side.locator('.site-header')).to_be_hidden()
    side.wait_for_timeout(100)
    assert maal(side)['figur'][1] > foer
    side.keyboard.press('Escape')
    expect(side.locator('.site-header')).to_be_visible()

    for link in side.locator('.links a').all():
        assert side.request.get(adresse + link.get_attribute('href')).status == 200
    side.close()
    assert not fejl, fejl
