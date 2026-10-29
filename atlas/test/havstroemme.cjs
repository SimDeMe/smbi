// Browserprøve for /atlas/havstroemme/. Kræver Playwright på NODE_PATH og en
// lokal server: NODE_PATH=værktøj/node_modules node atlas/test/havstroemme.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.ATLAS_URL || 'http://127.0.0.1:8777';
const ud = process.env.ATLAS_TEST_UD || '/tmp/smbi-havstroemme-test';
require('node:fs').mkdirSync(ud, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const fejl = [];
  for (const [bredde, hoejde] of [[1280, 577], [1366, 625], [1536, 730], [390, 750], [640, 625]]) {
    const mobil = bredde === 390;
    const ctx = await browser.newContext({ viewport: { width: bredde, height: hoejde }, hasTouch: mobil, isMobile: mobil, reducedMotion: 'reduce' });
    const side = await ctx.newPage();
    side.on('pageerror', e => fejl.push(e.message));
    const hentet = Promise.all(['/havtemperatur.bin', '/enso.bin'].map(n => side.waitForResponse(r => r.url().endsWith(n))));
    await side.goto(base + '/atlas/havstroemme/');
    await side.waitForFunction(() => document.querySelector('#trin-titel').textContent.length > 0);
    await hentet;
    await side.evaluate(() => document.fonts.ready);
    await side.waitForTimeout(400);
    const globus = side.locator('#globus');
    const billede = l => l.screenshot();

    assert.equal(await side.locator('#pause').getAttribute('aria-pressed'), 'true', 'reduceret bevægelse starter på pause');
    const mål = await side.evaluate(() => ({ b: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
    assert.ok(mål.b <= bredde, `ingen vandret rulning ved ${bredde}`);
    if (bredde > 900) {
      assert.ok(mål.h <= hoejde, `ingen lodret rulning ved ${bredde}×${hoejde}`);
      assert.ok(await side.evaluate(() => document.querySelector('.historie').getBoundingClientRect().bottom <= document.querySelector('.betjening').getBoundingClientRect().top + 1), 'trinteksten overlapper ikke betjeningen');
    }

    // Trin 1 slår vinden til; kontakterne ændrer globussen synligt.
    assert.equal(await side.locator('#vind').getAttribute('aria-pressed'), 'true', 'trin 1 viser vinden');
    for (const id of ['vind', 'hvirvler', 'baand', 'havtemp', 'etiketter']) {
      const før = await billede(globus);
      await side.locator('#' + id).click();
      assert.notDeepEqual(før, await billede(globus), `${id} ændrer globussen`);
      await side.locator('#' + id).click();
    }
    assert.equal(await side.locator('.side canvas').count(), 0, 'intet snit i sidepanelet');
    let før;

    // Tastatur drejer og aflæser; Enter slipper flaskepost på havet.
    await globus.focus();
    før = await billede(globus);
    await side.keyboard.press('ArrowRight');
    assert.notDeepEqual(før, await billede(globus), 'piletast drejer globussen');
    assert.match(await side.locator('#aflaesning').textContent(), /Midt på/);
    await side.locator('#flaske').click();
    assert.equal(await side.locator('#flaske').getAttribute('aria-pressed'), 'true');
    await globus.focus();
    await side.keyboard.press('Enter');
    assert.match(await side.locator('#meddelelse').textContent(), /Flaskepost sluppet|land/);

    // Klik/tryk slipper flaskepost; træk drejer.
    await globus.scrollIntoViewIfNeeded();
    const r = await globus.boundingBox(), cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    await side.locator('#meddelelse').evaluate(e => { e.textContent = ''; });
    if (mobil) await side.touchscreen.tap(cx, cy); else await side.mouse.click(cx, cy);
    assert.match(await side.locator('#meddelelse').textContent(), /Flaskepost sluppet|land/);
    før = await billede(globus);
    if (mobil) {
      const cdp = await ctx.newCDPSession(side);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + 60, y: cy }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else { await side.mouse.move(cx, cy); await side.mouse.down(); await side.mouse.move(cx + 60, cy, { steps: 5 }); await side.mouse.up(); }
    await side.waitForTimeout(50);
    assert.notDeepEqual(før, await billede(globus), 'træk drejer globussen');
    await side.locator('#flaske').click();

    // Aflæsning: trin 4 drejer til Nordatlanten (30° V, 48° N); fire tryk mod
    // vest og ét mod syd giver 70° V, 40° N midt i Golfstrømmen.
    await side.locator('#prikker button').nth(3).click();
    await side.waitForTimeout(100);
    await globus.focus();
    for (let i = 0; i < 4; i++) await side.keyboard.press('ArrowLeft');
    await side.keyboard.press('ArrowDown');
    assert.match(await side.locator('#aflaesning').textContent(), /70° V.*Golfstrømmen.*varm strøm.*mod (øst|nordøst).*\d+,\d °C/, 'Golfstrømmen aflæses som varm strøm mod øst med målt temperatur');
    assert.equal(await side.locator('#havtemp').getAttribute('aria-pressed'), 'true', 'trin 4 viser havtemperaturen');

    // Trinene: seks; trin 5 slår transportbåndet til, trin 6 viser El Niño.
    assert.equal(await side.locator('#prikker button').count(), 6);
    await side.locator('#prikker button').nth(4).click();
    assert.match(await side.locator('#trin-titel').textContent(), /transportbånd/);
    assert.equal(await side.locator('#baand').getAttribute('aria-pressed'), 'true');
    assert.equal(await side.locator('[data-fase="normal"]').getAttribute('aria-pressed'), 'true', 'andre trin er normalår');
    await side.locator('#naeste').click();
    assert.match(await side.locator('#trin-titel').textContent(), /El Niño/);
    assert.equal(await side.locator('[data-fase="elnino"]').getAttribute('aria-pressed'), 'true', 'trin 6 viser El Niño');
    assert.equal(await side.locator('#havtemp').getAttribute('aria-pressed'), 'true');
    assert.ok(await side.locator('#naeste').isDisabled());

    // El Niño og La Niña: trinet drejer til 130° V, 2° S; aflæs midt på.
    await side.waitForTimeout(100);
    await globus.focus(); await side.keyboard.press('ArrowRight'); await side.keyboard.press('ArrowLeft');
    const varm = await side.locator('#aflaesning').textContent();
    assert.match(varm, /Midt på.*\d+,\d °C \(\+\d,\d °C\)/, 'El Niño: varmere end normalt midt i Stillehavet');
    assert.match(await side.locator('#temptekst').textContent(), /El Niño 1997\/98/);
    før = await billede(globus);
    await side.locator('[data-fase="lanina"]').click();
    assert.notDeepEqual(før, await billede(globus), 'La Niña ændrer globussen');
    assert.match(await side.locator('#meddelelse').textContent(), /La Niña/);
    await globus.focus(); await side.keyboard.press('ArrowRight'); await side.keyboard.press('ArrowLeft');
    assert.match(await side.locator('#aflaesning').textContent(), /Midt på.*°C \(−\d,\d °C\)/, 'La Niña: koldere end normalt midt i Stillehavet');
    await side.locator('[data-fase="normal"]').click();
    await globus.focus(); await side.keyboard.press('ArrowRight'); await side.keyboard.press('ArrowLeft');
    assert.doesNotMatch(await side.locator('#aflaesning').textContent(), /\(/, 'normalår uden afvigelse');
    for (let i = 0; i < 5; i++) await side.locator('#forrige').click();
    assert.ok(await side.locator('#forrige').isDisabled());

    // Pause.
    await side.locator('#pause').click();
    await side.waitForTimeout(150); før = await billede(globus); await side.waitForTimeout(150);
    assert.notDeepEqual(før, await billede(globus), 'animationen kører');
    await side.locator('#pause').click();
    await side.waitForTimeout(50); før = await billede(globus); await side.waitForTimeout(120);
    assert.deepEqual(før, await billede(globus), 'pause fryser figuren');

    await side.locator('#fokus').click();
    assert.ok(!(await side.locator('.site-header').isVisible()), 'fokus skjuler sidehovedet');
    await side.locator('#fokus').click();
    await side.locator('#om').click();
    assert.ok(await side.locator('#om-dialog').isVisible(), 'om modellen åbner');
    await side.keyboard.press('Escape');

    await side.evaluate(() => scrollTo(0, 0)); await side.mouse.move(0, 0);
    await side.screenshot({ path: `${ud}/${bredde}.png`, fullPage: true });
    console.log(`${bredde}×${hoejde}: layout, kontakter, tastatur, flaskepost, træk, aflæsning, trin, pause og fokus består`);
    await ctx.close();
  }

  // Manglende landekort: fejlbesked, men trinene virker.
  const side = await browser.newPage();
  await side.route('**/countries-110m.json', r => r.abort());
  await side.route('**/havtemperatur.bin', r => r.abort());
  await side.goto(base + '/atlas/havstroemme/');
  await side.waitForFunction(() => !document.querySelector('#fejl').hidden);
  assert.match(await side.locator('#trin-titel').textContent(), /Vinden/);
  await side.locator('#naeste').click();
  assert.match(await side.locator('#trin-titel').textContent(), /hvirvler/);
  await side.close();

  // Manglende havtemperatur: kontakten slås fra, resten virker.
  const uden = await browser.newPage();
  uden.on('pageerror', e => fejl.push(e.message));
  await uden.route('**/havtemperatur.bin', r => r.abort());
  await uden.goto(base + '/atlas/havstroemme/');
  await uden.waitForFunction(() => document.querySelector('#havtemp').disabled);
  await uden.locator('#prikker button').nth(3).click();
  assert.equal(await uden.locator('#havtemp').getAttribute('aria-pressed'), 'false', 'trinet kan ikke slå et manglende lag til');
  await uden.close();

  assert.deepEqual(fejl, [], 'ingen JavaScriptfejl');
  await browser.close();
  console.log('Alle browserprøver for havstrømsmodellen består.');
})().catch(e => { console.error(e); process.exit(1); });
