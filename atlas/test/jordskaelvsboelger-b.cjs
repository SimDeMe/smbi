// Browsertest for Jordskælvsbølger model B. Kræver en lokal server og Playwright:
//   NODE_PATH=værktøj/node_modules node atlas/test/jordskaelvsboelger-b.cjs
// Modellens tal testes for sig i atlas/jordskaelvsboelger-b/model.test.mjs.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.ATLAS_URL || 'http://127.0.0.1:8777';
const ud = process.env.ATLAS_TEST_UD || '/tmp/smbi-seismik-b';
fs.mkdirSync(ud, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const fejl = [];
  for (const [w, h] of [[1280, 577], [1366, 625], [1536, 730], [390, 750], [640, 625]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', hasTouch: w === 390, isMobile: w === 390 });
    const side = await ctx.newPage();
    side.on('pageerror', e => fejl.push(`${w}: ${e.message}`));
    side.on('console', m => { if (m.type() === 'error') fejl.push(`${w}: ${m.text()}`); });
    await side.goto(base + '/atlas/jordskaelvsboelger-b/?test');
    await side.evaluate(() => document.fonts.ready);
    const vandret = () => side.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const synlig = async sel => { const b = await side.locator(sel).boundingBox(); return b && b.y >= 0 && b.y + b.height <= h; };

    // 1 · Bølgerne: alle fire typer, figur og vælger på skærmen uden at rulle.
    assert.equal(await vandret(), 0, 'ingen vandret rulning');
    if (w >= 900) for (const sel of ['#blok', '[data-boelge=kaploeb]', '#blok-pause']) assert.ok(await synlig(sel), `${sel} synlig ved ${w}×${h}`);
    for (const [type, navn] of [['S', 'S-bølge'], ['R', 'Overfladebølge'], ['kaploeb', 'Kapløbet'], ['P', 'P-bølge']]) {
      await side.click(`[data-boelge=${type}]`);
      assert.match(await side.locator('#boelgekort h2').textContent(), new RegExp(navn));
      assert.equal(await side.locator(`[data-boelge=${type}]`).getAttribute('aria-checked'), 'true');
    }
    // Reduceret bevægelse: modellen starter på pause og står stille.
    const foer = await side.locator('#blok').screenshot();
    await side.waitForTimeout(150);
    assert.deepEqual(foer, await side.locator('#blok').screenshot(), 'del 1 står stille ved reduceret bevægelse');

    // Faner med piletaster
    await side.focus('#fane-1'); await side.keyboard.press('ArrowRight');
    assert.equal(await side.locator('#fane-2').getAttribute('aria-selected'), 'true');
    assert.ok(await side.locator('#del-2').isVisible());

    // 2 · Find skælvet: start, aflæs på tre stationer, gæt med tastaturet, afslør.
    await side.waitForFunction(() => window.__jb);
    if (w >= 900) for (const sel of ['#kort', '#spor canvas >> nth=2', '#start']) assert.ok(await synlig(sel), `${sel} synlig ved ${w}×${h}`);
    await side.click(w < 861 ? '#start-mobil' : '#start');
    const spor = side.locator('#spor canvas');
    assert.equal(await spor.count(), 3);
    for (let i = 0; i < 3; i++) {
      const c = spor.nth(i);
      await c.scrollIntoViewIfNeeded();
      const b = await c.boundingBox();
      const f = await side.evaluate(i => window.__jb.facit(i), i);
      const x = t => b.x + 46 + (t - f.fra) / (f.varighed - f.fra) * (b.width - 56);
      if (i === 2) {
        // Tredje station med tastaturet: P placeres og flyttes, derefter S.
        await c.focus();
        await side.keyboard.press('p');
        const st0 = (await side.evaluate(() => window.__jb.stationer()))[2];
        const skridtP = Math.round((f.tP - st0.p) * 10);
        for (let k = 0; k < Math.abs(skridtP) % 10; k++) await side.keyboard.press(skridtP > 0 ? 'ArrowRight' : 'ArrowLeft');
        for (let k = 0; k < Math.floor(Math.abs(skridtP) / 10); k++) await side.keyboard.press(skridtP > 0 ? 'Shift+ArrowRight' : 'Shift+ArrowLeft');
        await side.keyboard.press('s');
        const st1 = (await side.evaluate(() => window.__jb.stationer()))[2];
        const skridtS = Math.round((f.tS - st1.s) * 10);
        for (let k = 0; k < Math.abs(skridtS) % 10; k++) await side.keyboard.press(skridtS > 0 ? 'ArrowRight' : 'ArrowLeft');
        for (let k = 0; k < Math.floor(Math.abs(skridtS) / 10); k++) await side.keyboard.press(skridtS > 0 ? 'Shift+ArrowRight' : 'Shift+ArrowLeft');
      } else if (w === 390) {
        await side.touchscreen.tap(x(f.tP), b.y + b.height / 2);
        await side.touchscreen.tap(x(f.tS), b.y + b.height / 2);
      } else {
        await side.mouse.click(x(f.tP), b.y + b.height / 2);
        await side.mouse.click(x(f.tS), b.y + b.height / 2);
      }
    }
    const st = await side.evaluate(() => window.__jb.stationer());
    for (const s of st) assert.ok(Math.abs(8 * (s.s - s.p) - s.d) < 8, `afstand ${8 * (s.s - s.p)} ≈ ${s.d}`);
    assert.match(await spor.nth(2).getAttribute('aria-valuetext'), /afstand \d+ km/);
    // Buddet flyttes fra kortets midte mod epicentret med piletasterne.
    const ep = await side.evaluate(() => window.__jb.epicenter());
    await side.focus('#kort'); await side.keyboard.press('Enter');
    for (const [akse, plus, minus] of [['x', 'ArrowRight', 'ArrowLeft'], ['y', 'ArrowDown', 'ArrowUp']]) {
      const midt = akse === 'x' ? 250 : 180, n = Math.round((ep[akse] - midt) / 5);
      for (let k = 0; k < Math.abs(n); k++) await side.keyboard.press(n > 0 ? plus : minus);
    }
    assert.ok(await side.locator('#afsloer').isEnabled());
    await side.click('#afsloer');
    const res = await side.locator('#resultat').textContent();
    assert.match(res, /Plet!|Flot!/, res);
    assert.match(res, /Skælvet skete kl\. 08\./);
    // Magnitude med det største udslag fra facit giver den rigtige magnitude.
    await side.click('#bonus summary');
    await side.selectOption('#mag-station', 'A');
    const A = await side.evaluate(() => { const s = window.__jb.stationer()[0]; return s; });
    assert.ok(A.p !== null);
    await side.fill('#mag-a', '10');
    assert.match(await side.locator('#mag-ud').textContent(), /Rigtig magnitude: \d,\d/);
    await side.screenshot({ path: `${ud}/find-${w}.png`, fullPage: w < 900 });
    // To stationer: skæringspunkterne vises, og afsløringen forklarer, hvorfor tre er nødvendige.
    await side.click('[data-antal="2"]');
    assert.equal(await spor.count(), 2);
    await side.click(w < 861 ? '#start-mobil' : '#start');
    await side.focus('#kort'); await side.keyboard.press('Enter'); await side.click('#afsloer');
    assert.match(await side.locator('#resultat').textContent(), /mindst tre/);
    await side.click('[data-antal="3"]');

    // 3 · Gennem Jorden
    await side.evaluate(() => scrollTo(0, 0));
    await side.click('#fane-3');
    await side.waitForFunction(() => document.querySelector('#jord-aflaes').textContent.length > 0);
    if (w >= 900) for (const sel of ['#jord', '#jord-tid', '#jord-kerne', '#jord-afstand']) assert.ok(await synlig(sel), `${sel} synlig ved ${w}×${h}`);
    await side.fill('#jord-afstand', '60'); await side.dispatchEvent('#jord-afstand', 'input');
    assert.match(await side.locator('#jord-aflaes').textContent(), /Første P: 10 min \d+ s/);
    await side.fill('#jord-afstand', '125'); await side.dispatchEvent('#jord-afstand', 'input');
    await side.waitForTimeout(100);
    assert.match(await side.locator('#jord-aflaes').textContent(), /Inge Lehmann/);
    await side.click('#jord-kerne');
    assert.match(await side.locator('#jord-aflaes').textContent(), /Uden indre kerne lander ingen P-bølger/);
    assert.match(await side.locator('#jord-tekst h2').textContent(), /før 1936/);
    await side.click('#jord-kerne');
    await side.locator('#gangtid').evaluate(e => { e.closest('details').open = true; });
    await side.screenshot({ path: `${ud}/jorden-${w}.png`, fullPage: w < 900 });
    assert.equal(await vandret(), 0, 'ingen vandret rulning efter brug');

    // Dialog og fokus
    await side.evaluate(() => scrollTo(0, 0));
    await side.click('#om-knap'); assert.ok(await side.locator('#om').isVisible());
    await side.keyboard.press('Escape'); assert.ok(!(await side.locator('#om').isVisible()));
    await side.click('#fokus'); assert.ok(!(await side.locator('.site-header').isVisible()));
    await side.keyboard.press('Escape'); assert.ok(await side.locator('.site-header').isVisible());
    console.log(`${w}×${h}: bølger, aflæsning (mus/touch/tastatur), bud, afsløring, magnitude, to stationer, Jorden, dialog og fokus bestået`);
    await ctx.close();
  }
  // Atlasset fører til modellen fra Processer og fra jordskælvsundersøgelsen.
  const side = await browser.newPage();
  await side.goto(base + '/atlas/');
  await side.getByRole('button', { name: 'Processer', exact: true }).click();
  assert.ok(await side.getByRole('heading', { name: 'Jordskælvsbølger model B', exact: true }).isVisible());
  await side.getByRole('button', { name: 'Undersøg jordskælv og vulkaner', exact: true }).click();
  assert.equal(await side.getByRole('link', { name: 'Åbn simulation: Jordskælvsbølger model B' }).getAttribute('href'), '/atlas/jordskaelvsboelger-b/');
  assert.deepEqual(fejl, []);
  await browser.close();
  console.log('Alle browsertest for model B bestået.');
})().catch(e => { console.error(e); process.exit(1); });
