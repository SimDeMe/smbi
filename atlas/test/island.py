"""Afprøv #49 milepæl B og C: Island-tværsnittet som selvstændigt modul,
med lag, 2D/3D-blok, drejning og illustrativ animation."""
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
    side.locator('#lagknap').click()
    side.locator('#hotspot').uncheck()
    expect(side.locator('#tvaersnit [data-lag="hotspot"]')).to_have_count(0)
    expect(beskr).to_contain_text('slået fra')
    side.locator('#hotspot').check()
    expect(side.locator('#tvaersnit [data-lag="hotspot"]')).to_have_count(1)
    side.keyboard.press('Escape')
    expect(side.locator('#lagpanel')).to_be_hidden()
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
    expect(side.locator('#seefter .hint')).to_have_text(' Du finder det under «Lag».')
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


LAG = ['overflade', 'skorpe', 'plader', 'kappe', 'smelt', 'magma']


def blokmaal(side):
    """Figurens og blokfladernes kasser, når blokken er drejet."""
    return side.evaluate('''() => {
      const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
      return {figur: r('.figur'), flader: ['#tvaersnit', '.overside', '.oest', '.vest'].map(r),
              transform: document.querySelector('.blok').style.transform};
    }''')


def inden_for(m):
    v, o, h, n = m['figur']
    return all(f[0] >= v - 1 and f[1] >= o - 1 and f[2] <= h + 1 and f[3] <= n + 1 for f in m['flader'] if f[2] > f[0])


def afproev_islandbevaegelse(browser, adresse, ud, skaerme):
    fejl = []

    # 3D-blokken passer i figuren på alle skærme og i alle yderstillinger.
    for bredde, hoejde in skaerme:
        side = browser.new_page(viewport={'width': bredde, 'height': hoejde},
                                has_touch=bredde == 390, is_mobile=bredde == 390, reduced_motion='reduce')
        side.on('pageerror', lambda e: fejl.append(str(e)))
        side.goto(adresse + '/atlas/island/#island')
        expect(side.locator('#tvaersnit [data-lag="smelt"]')).to_have_count(1)
        tryk = (lambda l: l.tap()) if bredde == 390 else (lambda l: l.click())
        tryk(side.get_by_role('button', name='3D', exact=True))
        expect(side.locator('.figur.tre-d')).to_have_count(1)
        assert inden_for(blokmaal(side)), (bredde, blokmaal(side))
        assert side.evaluate('document.documentElement.scrollWidth - innerWidth') == 0
        side.screenshot(path=str(ud / f'island-{bredde}x{hoejde}-3d.png'))
        scene = side.locator('.scene')
        for taster in [['ArrowRight'] * 8 + ['ArrowUp'] * 6, ['ArrowLeft'] * 16, ['ArrowDown'] * 12]:
            for t in taster: scene.press(t)
            assert inden_for(blokmaal(side)), (bredde, taster[0], blokmaal(side))
        side.close()

    side = browser.new_page(viewport={'width': 1366, 'height': 625}, reduced_motion='reduce')
    side.on('pageerror', lambda e: fejl.append(str(e)))
    side.on('console', lambda e: fejl.append(e.text) if e.type == 'error' else None)
    side.goto(adresse + '/atlas/island/#island')
    expect(side.locator('#tvaersnit [data-lag="smelt"]')).to_have_count(1)

    # 2D er udgangspunktet: tværsnittet lige forfra, uden blokkens sider.
    expect(side.get_by_role('button', name='2D', exact=True)).to_have_attribute('aria-pressed', 'true')
    assert blokmaal(side)['transform'] == ''
    expect(side.locator('.overside')).to_be_hidden()
    expect(side.locator('.drejeknapper')).to_be_hidden()
    expect(side.locator('.skematisk')).to_contain_text('set fra syd')

    # Piletast på figuren skifter til 3D og drejer; grænserne holder.
    scene = side.locator('.scene')
    scene.focus()
    side.keyboard.press('ArrowLeft')
    expect(side.get_by_role('button', name='3D', exact=True)).to_have_attribute('aria-pressed', 'true')
    expect(side.locator('#status')).to_contain_text('3D')
    assert 'rotateY(-38deg)' in blokmaal(side)['transform']
    for _ in range(10): side.keyboard.press('ArrowLeft')
    assert 'rotateY(-60deg)' in blokmaal(side)['transform']
    for _ in range(12): side.keyboard.press('ArrowUp')
    assert 'rotateX(-45deg)' in blokmaal(side)['transform']
    side.keyboard.press('Home')
    assert 'rotateX(-20deg) rotateY(-28deg)' in blokmaal(side)['transform']
    expect(side.locator('.overside')).to_be_visible()
    expect(side.locator('.overside [data-lag="graense"]')).to_have_count(1)
    expect(side.locator('.overside')).to_contain_text('Nord')
    expect(side.locator('.overside .land-flade')).to_have_count(1)
    expect(side.locator('.skematisk')).not_to_contain_text('set fra syd')

    # Synlige drejeknapper og træk med musen.
    expect(side.locator('.drejeknapper')).to_be_visible()
    side.get_by_role('button', name='Drej mod højre', exact=True).click()
    assert 'rotateY(-13deg)' in blokmaal(side)['transform']
    side.get_by_role('button', name='Se mere ovenfra', exact=True).click()
    assert 'rotateX(-30deg)' in blokmaal(side)['transform']
    foer = blokmaal(side)['transform']
    boks = scene.bounding_box()
    side.mouse.move(boks['x'] + boks['width'] * .4, boks['y'] + boks['height'] * .5)
    side.mouse.down()
    side.mouse.move(boks['x'] + boks['width'] * .4 + 120, boks['y'] + boks['height'] * .5, steps=6)
    side.mouse.up()
    assert blokmaal(side)['transform'] != foer
    assert inden_for(blokmaal(side))
    # Pegeren bevæger sig uden knap: intet drejes.
    foer = blokmaal(side)['transform']
    side.mouse.move(boks['x'] + 50, boks['y'] + 50, steps=4)
    assert blokmaal(side)['transform'] == foer

    # Skift tilstand i 3D: Island-land på oversiden forsvinder ved ryggen.
    side.get_by_role('button', name='Den Midtatlantiske Ryg', exact=True).click()
    expect(side.locator('.overside .land-flade')).to_have_count(0)
    expect(side.locator('.figur.tre-d')).to_have_count(1)
    side.get_by_role('button', name='Island', exact=True).click()
    side.screenshot(path=str(ud / 'island-3d-drejet.png'))
    side.get_by_role('button', name='2D', exact=True).click()
    assert blokmaal(side)['transform'] == ''
    expect(side.locator('.drejeknapper')).to_be_hidden()
    m = side.evaluate('''() => { const f = document.querySelector('.figur').getBoundingClientRect(), s = document.querySelector('#tvaersnit').getBoundingClientRect();
      return [f.width - s.width, f.height - s.height]; }''')
    assert all(abs(x) <= 1 for x in m), m

    # Vis/skjul-lag: hvert lag kan slås fra og til, også i tekstalternativet.
    knap = side.get_by_role('button', name='Lag', exact=True)
    knap.click()
    expect(knap).to_have_attribute('aria-expanded', 'true')
    beskr = side.locator('#figurbeskrivelse')
    for lag in LAG:
        valg = side.locator(f'[data-vislag="{lag}"]')
        navn = valg.locator('xpath=..').inner_text().strip()
        valg.uncheck()
        expect(side.locator(f'#tvaersnit [data-lag="{lag}"]')).to_have_count(0)
        expect(beskr).to_contain_text(f'Laget {navn} er slået fra.')
        expect(side.locator('#status')).to_have_text(f'{navn} er skjult.')
        valg.check()
        assert side.locator(f'#tvaersnit [data-lag="{lag}"]').count() >= 1, lag
    side.locator('[data-vislag="plader"]').uncheck()
    expect(side.locator('#tvaersnit [data-lag="graense"]')).to_have_count(0)
    side.locator('[data-vislag="kappe"]').uncheck()
    expect(beskr).to_contain_text('Disse lag er slået fra: Lithosfæreplader, Kappe.')
    side.screenshot(path=str(ud / 'island-lag.png'))
    # Escape lukker panelet og giver fokus tilbage til knappen.
    side.keyboard.press('Escape')
    expect(side.locator('#lagpanel')).to_be_hidden()
    expect(knap).to_be_focused()
    expect(knap).to_have_attribute('aria-expanded', 'false')
    # Et trin viser altid sine egne lag igen.
    side.get_by_role('button', name='Trin 1: Pladerne bevæger sig fra hinanden', exact=True).click()
    expect(side.locator('#tvaersnit [data-lag="graense"]')).to_have_count(1)
    expect(side.locator('#tvaersnit [data-lag="kappe"]')).to_have_count(0)
    side.get_by_role('button', name='Trin 2: Kappen stiger op', exact=True).click()
    expect(side.locator('#tvaersnit [data-lag="kappe"]')).to_have_count(2)
    expect(side.locator('[data-vislag="kappe"]')).to_be_checked()
    # Klik udenfor lukker panelet.
    knap.click()
    side.locator('h1').click()
    expect(side.locator('#lagpanel')).to_be_hidden()

    # Animationen: på pause ved reduced motion, ingen sporpunkter før start.
    afspil = side.locator('#afspil')
    expect(afspil).to_have_attribute('aria-pressed', 'false')
    expect(afspil).to_have_accessible_name('Afspil')
    expect(side.locator('.tidsmaerke')).to_be_hidden()
    expect(side.locator('[data-anim="kappe"] circle')).to_have_count(0)
    draaber = lambda: side.locator('[data-anim="smelt"]').inner_html()
    foer = draaber()
    side.wait_for_timeout(250)
    assert draaber() == foer, 'Figuren bevæger sig på pause'
    afspil.click()
    expect(afspil).to_have_accessible_name('Pause')
    expect(side.locator('.tidsmaerke')).to_have_text('Tiden er sat op – ikke målfast')
    expect(side.locator('[data-anim="kappe"] circle')).not_to_have_count(0)
    expect(side.locator('[data-anim="magma"] circle')).not_to_have_count(0)
    side.wait_for_timeout(300)
    assert draaber() != foer, 'Animationen flytter ikke dråberne'
    afspil.click()
    expect(afspil).to_have_accessible_name('Afspil')
    expect(side.locator('#status')).to_have_text('Animationen er sat på pause.')
    foer = draaber()
    side.wait_for_timeout(250)
    assert draaber() == foer

    # Afsnit 5: kappen stiger meget langsommere end magmaen; pladerne flytter
    # lige hurtigt til begge sider; ingen tal i figuren.
    hastighed = side.evaluate('''async () => {
      const { bevaegelse } = await import('./tvaersnit.js');
      const pkt = (html, t) => [...html.matchAll(/cx="([\\d.-]+)" cy="([\\d.-]+)"/g)].map(m => [+m[1], +m[2]]);
      const W = 900, H = 450, ud = {};
      for (const tilstand of ['ryg', 'island']) {
        const a = bevaegelse({bredde: W, hoejde: H, tilstand, tid: 1, spor: true});
        const b = bevaegelse({bredde: W, hoejde: H, tilstand, tid: 1.2, spor: true});
        const fart = (x, y) => { const p = pkt(x), q = pkt(y); let s = 0, n = 0;
          p.forEach((v, i) => { const d = Math.hypot(q[i][0] - v[0], q[i][1] - v[1]); if (d < H / 4) { s += d; n++; } }); return s / n; };
        const baand = [...a.plader.matchAll(/x="([\\d.-]+)" y="0" width="([\\d.-]+)"/g)].map(m => [+m[1], +m[1] + +m[2]]);
        const spejl = baand.every(([v, h]) => baand.some(([v2, h2]) => Math.abs(v2 - (W - h)) < .2 && Math.abs(h2 - (W - v)) < .2));
        ud[tilstand] = {kappe: fart(a.kappe, b.kappe), smelt: fart(a.smelt, b.smelt), magma: fart(a.magma, b.magma), spejl,
                        flytter: a.plader !== b.plader};
      }
      return ud;
    }''')
    for t in hastighed.values():
        assert t['kappe'] * 3 < t['smelt'] and t['kappe'] * 3 < t['magma'], hastighed
        assert t['spejl'] and t['flytter'], hastighed
    side.get_by_role('button', name='3D', exact=True).click()
    for tilstand in ['Den Midtatlantiske Ryg', 'Island']:
        side.get_by_role('button', name=tilstand, exact=True).click()
        tekst = side.locator('.blok').evaluate("e => [...e.querySelectorAll('text')].map(t => t.textContent).join(' ')")
        assert not re.search(r'\d', tekst), tekst
    side.close()

    # Uden reduced motion starter animationen af sig selv.
    side = browser.new_page(viewport={'width': 1280, 'height': 577}, reduced_motion='no-preference')
    side.on('pageerror', lambda e: fejl.append(str(e)))
    side.goto(adresse + '/atlas/island/')
    expect(side.locator('#afspil')).to_have_attribute('aria-pressed', 'true')
    expect(side.locator('.tidsmaerke')).to_be_visible()
    side.close()

    # Uden CSS 3D: 3D kan ikke vælges, piletaster gør intet, 2D virker.
    side = browser.new_page(viewport={'width': 1280, 'height': 577}, reduced_motion='reduce')
    side.on('pageerror', lambda e: fejl.append(str(e)))
    side.add_init_script("const s = CSS.supports.bind(CSS); CSS.supports = (a, b) => a === 'transform-style' ? false : s(a, b);")
    side.goto(adresse + '/atlas/island/#island')
    expect(side.locator('#tvaersnit [data-lag="smelt"]')).to_have_count(1)
    expect(side.get_by_role('button', name='3D', exact=True)).to_be_disabled()
    side.locator('.scene').press('ArrowLeft')
    assert blokmaal(side)['transform'] == ''
    expect(side.locator('.overside')).to_be_hidden()
    side.close()
    assert not fejl, fejl
