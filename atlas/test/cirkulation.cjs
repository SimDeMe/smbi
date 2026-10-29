// Browserprøve for /atlas/cirkulation/. Kræver Playwright på NODE_PATH og en
// lokal server: NODE_PATH=værktøj/node_modules node atlas/test/cirkulation.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.ATLAS_URL || 'http://127.0.0.1:8777';
const ud = process.env.ATLAS_TEST_UD || '/tmp/smbi-cirkulation-test';
require('node:fs').mkdirSync(ud, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const fejl = [];
  for (const [bredde, hoejde] of [[1280, 577], [1366, 625], [1536, 730], [390, 750], [640, 625]]) {
    const mobil = bredde === 390;
    const ctx = await browser.newContext({ viewport: { width: bredde, height: hoejde }, hasTouch: mobil, isMobile: mobil, reducedMotion: 'reduce' });
    const side = await ctx.newPage();
    side.on('pageerror', e => fejl.push(e.message));
    await side.goto(base + '/atlas/cirkulation/');
    await side.waitForFunction(() => document.querySelector('#trin-titel').textContent.length > 0);
    await side.evaluate(() => document.fonts.ready);
    await side.waitForTimeout(300);
    const globus = side.locator('#globus'), snit = side.locator('#snit');
    const billede = l => l.screenshot();

    assert.equal(await side.locator('#pause').getAttribute('aria-pressed'), 'true', 'reduceret bevægelse starter på pause');
    const mål = await side.evaluate(() => ({ b: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
    assert.ok(mål.b <= bredde, `ingen vandret rulning ved ${bredde}`);
    if (bredde > 900) {
      assert.ok(mål.h <= hoejde, `ingen lodret rulning ved ${bredde}×${hoejde}`);
      assert.ok(await side.evaluate(() => document.querySelector('.globusfelt').getBoundingClientRect().bottom <= document.querySelector('.betjening').getBoundingClientRect().top + 1), 'figuren overlapper ikke betjeningen');
    }

    // Navne, måned, rotation og kontinenter ændrer figurerne synligt.
    let før = await billede(globus);
    await side.locator('#etiketter').click();
    assert.notDeepEqual(før, await billede(globus), 'navne slås synligt fra');
    await side.locator('#etiketter').click();
    før = await billede(globus);
    assert.equal(await side.locator('#celler').getAttribute('aria-pressed'), 'true', 'celler vises fra start');
    await side.locator('#celler').click();
    assert.notDeepEqual(før, await billede(globus), 'cellebælterne slås synligt fra');
    await side.locator('#celler').click();
    før = await billede(globus);
    assert.equal(await side.locator('#luftringe').getAttribute('aria-pressed'), 'true', 'luftringe vises fra start');
    await side.locator('#luftringe').click();
    assert.equal(await side.locator('#luftringe').getAttribute('aria-pressed'), 'false');
    assert.notDeepEqual(før, await billede(globus), 'luftringene slås synligt fra');
    await side.locator('#luftringe').click();
    // Klimalagene: højst ét ad gangen, farveskala og værdi i aflæsningen.
    før = await billede(globus);
    await side.locator('#lag-temperatur').click();
    await side.waitForFunction(() => document.querySelector('#lag-temperatur').getAttribute('aria-pressed') === 'true');
    assert.ok(await side.locator('#klimaskala').isVisible(), 'temperaturskalaen vises');
    await side.waitForTimeout(300);
    assert.notDeepEqual(før, await billede(globus), 'temperaturlaget ses på globussen');
    await globus.focus();
    assert.match(await side.locator('#aflaesning').textContent(), /°C/, 'aflæsningen viser temperaturen');
    await side.locator('#lag-nedboer').click();
    await side.waitForFunction(() => document.querySelector('#lag-nedboer').getAttribute('aria-pressed') === 'true');
    assert.equal(await side.locator('#lag-temperatur').getAttribute('aria-pressed'), 'false', 'kun ét klimalag ad gangen');
    assert.match(await side.locator('#klimaskala').textContent(), /GPCP/);
    await side.locator('#lag-nedboer').click();
    assert.ok(!(await side.locator('#klimaskala').isVisible()), 'skalaen skjules, når laget slås fra');
    await side.waitForTimeout(200);
    før = await billede(globus);
    await side.locator('#maaned').fill('7');
    assert.equal(await side.locator('#maanedsnavn').textContent(), 'juli');
    assert.notDeepEqual(før, await billede(globus), 'måneden flytter ITK');
    før = await billede(snit);
    await side.locator('#rotation').click();
    assert.equal(await side.locator('#rotation').getAttribute('aria-pressed'), 'false');
    await side.waitForTimeout(100);
    assert.notDeepEqual(før, await billede(snit), 'stop Jorden giver én celle');
    await side.locator('#rotation').click();
    assert.equal(await side.locator('#kontinenter').getAttribute('aria-pressed'), 'true', 'kontinenter er slået til fra start');
    await side.locator('#kontinenter').click();
    assert.equal(await side.locator('#kontinenter').getAttribute('aria-pressed'), 'false');
    await side.locator('#kontinenter').click();

    // Tastatur drejer, Enter slipper ballon.
    await globus.focus();
    før = await billede(globus);
    await side.keyboard.press('ArrowRight');
    assert.notDeepEqual(før, await billede(globus), 'piletast drejer globussen');
    assert.match(await side.locator('#aflaesning').textContent(), /Midt på/);
    await side.locator('#ballon').click();
    assert.equal(await side.locator('#ballon').getAttribute('aria-pressed'), 'true');
    await globus.focus();
    await side.keyboard.press('Enter');
    assert.match(await side.locator('#meddelelse').textContent(), /Ballon sluppet/);

    // Klik/tryk slipper ballon; træk drejer.
    await globus.scrollIntoViewIfNeeded();
    const r = await globus.boundingBox(), cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    await side.locator('#meddelelse').evaluate(e => { e.textContent = ''; });
    if (mobil) await side.touchscreen.tap(cx, cy); else await side.mouse.click(cx, cy);
    assert.match(await side.locator('#meddelelse').textContent(), /Ballon sluppet/);
    før = await billede(globus);
    if (mobil) {
      const cdp = await ctx.newCDPSession(side);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + 60, y: cy }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else { await side.mouse.move(cx, cy); await side.mouse.down(); await side.mouse.move(cx + 60, cy, { steps: 5 }); await side.mouse.up(); }
    await side.waitForTimeout(50);
    assert.notDeepEqual(før, await billede(globus), 'træk drejer globussen');
    await side.locator('#ballon').click();

    // Trinene: fem, og monsuntrinnet sætter juli og kontinenter.
    assert.equal(await side.locator('#prikker button').count(), 5);
    await side.locator('#rotation').click();
    await side.locator('#prikker button').nth(4).click();
    assert.match(await side.locator('#trin-titel').textContent(), /monsun/);
    assert.equal(await side.locator('#maanedsnavn').textContent(), 'juli');
    assert.equal(await side.locator('#rotation').getAttribute('aria-pressed'), 'true');
    assert.ok(await side.locator('#naeste').isDisabled());
    for (let i = 0; i < 4; i++) await side.locator('#forrige').click();
    assert.ok(await side.locator('#forrige').isDisabled());

    // Afspil/pause.
    await side.locator('#pause').click();
    assert.equal(await side.locator('#pause').getAttribute('aria-pressed'), 'false');
    await side.waitForTimeout(150); før = await billede(globus); await side.waitForTimeout(150);
    assert.notDeepEqual(før, await billede(globus), 'animationen kører');
    await side.locator('#pause').click();
    await side.waitForTimeout(50); før = await billede(globus); await side.waitForTimeout(120);
    assert.deepEqual(før, await billede(globus), 'pause fryser figuren');

    await side.locator('#fokus').click();
    assert.ok(!(await side.locator('.site-header').isVisible()), 'fokus skjuler sidehovedet');
    await side.locator('#fokus').click();

    await side.evaluate(() => scrollTo(0, 0)); await side.mouse.move(0, 0);
    await side.screenshot({ path: `${ud}/${bredde}.png`, fullPage: true });
    console.log(`${bredde}×${hoejde}: layout, kontakter, måned, tastatur, ballon, træk, trin, pause og fokus består`);
    await ctx.close();
  }

  // Manglende landekort: fejlbesked, men trinene virker.
  const side = await browser.newPage();
  await side.route('**/countries-110m.json', r => r.abort());
  await side.goto(base + '/atlas/cirkulation/');
  await side.waitForFunction(() => !document.querySelector('#fejl').hidden);
  assert.match(await side.locator('#trin-titel').textContent(), /Solen/);
  await side.locator('#naeste').click();
  assert.match(await side.locator('#trin-titel').textContent(), /30°/);
  await side.close();

  assert.deepEqual(fejl, [], 'ingen JavaScriptfejl');
  await browser.close();
  console.log('Alle browserprøver for cirkulationsmodellen består.');
})().catch(e => { console.error(e); process.exit(1); });
