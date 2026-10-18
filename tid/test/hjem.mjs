import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const her = fileURLToPath(new URL('.', import.meta.url));
mkdirSync(her + 'ud', { recursive: true });
const ts = d => ({ __ts: Date.parse(d) });
const act = (id, name, extra = {}) => [`users/u1/activities/${id}`, { name, schoolYear: '2026/27', type: 'opgave', color: '#0E86C8', order: 1, ...extra }];
const post = (id, start, end, extra = {}) => [`users/u1/entries/${id}`, { activityId: 'bio', workType: 'retning', startTime: ts(start), endTime: end ? ts(end) : null, durationMinutes: end ? (Date.parse(end) - Date.parse(start)) / 60000 : null, ...extra }];
const cfg = ['users/u1/settings/config', { currentSchoolYear: '2026/27', autoShortBreaks: false, hurtigstartFavoritter: [{ activityId: 'bio', workType: 'forberedelse' }, { activityId: 'srp', workType: null }] }];
const seed = [cfg, act('bio', '3g Bio', { type: 'hold' }), act('srp', 'SRP & <vejledning>'), act('gammel', 'Arkiveret', { isArchived: true }),
  // 30 minutter i dag fra gårsdagens post + 60 afsluttet + 10 aktiv = 100.
  post('midnat', '2026-10-01T21:30:00Z', '2026-10-01T22:30:00Z'),
  post('e1', '2026-10-02T06:00:00Z', '2026-10-02T07:00:00Z'),
  post('pause', '2026-10-02T07:00:00Z', '2026-10-02T07:15:00Z', { isBreak: true, workType: null }),
  post('aktiv', '2026-10-02T09:50:00Z', null, { workType: 'undervisning' }),
  post('fremtid', '2026-10-02T12:00:00Z', '2026-10-02T13:00:00Z'),
  ['users/u1/lectioSchedules/2026-27', { events: [
    { id: 'aflyst', start: '2026-10-02T12:10:00', end: '2026-10-02T12:20:00', group: 'Aflyst', cancelled: true },
    { id: 'next', start: '2026-10-02T13:00:00', end: '2026-10-02T14:35:00', group: '3g Bio', title: 'Fotosyntese' }
  ] }]
];
async function side(browser, width = 390, data = seed) {
  const context = await browser.newContext({ viewport: { width, height: 750 }, timezoneId: 'Europe/Copenhagen', locale: 'da-DK', serviceWorkers: 'block' });
  const page = await context.newPage();
  const fejl = []; page.on('pageerror', e => fejl.push(e.message));
  for (const [frag, file] of [['firebase-app.js', 'fake-app.js'], ['firebase-auth.js', 'fake-auth.js'], ['firebase-firestore.js', 'fake-fs.js']]) await page.route('**/' + frag, r => r.fulfill({ contentType: 'text/javascript', body: readFileSync(her + file, 'utf8') }));
  await page.route('**/feedback.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('https://fonts.**', r => r.abort());
  await page.addInitScript(data => { window.__fsCfg = { seed: data }; }, data);
  await page.clock.setFixedTime(new Date('2026-10-02T10:00:00Z'));
  await page.goto('http://localhost:8777/tid/');
  await page.waitForSelector('#view-hjem:not(.hidden)');
  await page.waitForFunction(() => document.getElementById('hjem-total').textContent === '1t 40m');
  // Dagens sum og seneste poster kommer fra uafhængige lyttere.
  await page.waitForSelector('#hjem-seneste button');
  return { page, context, fejl };
}
const browser = await chromium.launch();
try {
  for (const width of [340, 390, 1280]) {
    const { page, context, fejl } = await side(browser, width);
    assert.equal(await page.locator('#hjem-seneste button').count(), 2);
    assert.match(await page.locator('#hjem-fortsaet').textContent(), /Fortsæt 3g Bio · Retning/);
    assert.match(await page.locator('#hjem-lectio').textContent(), /13:00 · 3g Bio · Fotosyntese · Planlagt/);
    assert.deepEqual(await page.locator('#hjem-favoritter button').allTextContents(), ['3g Bio · Forberedelse', 'SRP & <vejledning>']);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const quickTop = await page.locator('#hjem-favoritter button').first().evaluate(e => e.getBoundingClientRect().top);
    assert(quickTop < 500, `Favoritter er lette at nå ved ${width} px (${quickTop})`);
    await page.screenshot({ path: her + `ud/hjem-${width}.png`, fullPage: true });
    await page.click('#hjem-seneste button:first-child');
    await page.waitForSelector('#hist-sheet.open');
    assert.equal(await page.inputValue('#hist-start'), '08:00');
    await page.fill('#hist-note', 'Rettet fra forsiden');
    await page.click('#hist-save-btn');
    await page.waitForFunction(() => __fs.store.get('users/u1/entries/e1').note === 'Rettet fra forsiden');
    await page.waitForSelector('#hist-sheet', { state: 'hidden' });
    await page.click('#hjem-glemt'); await page.waitForSelector('#hist-sheet.open');
    assert.equal(await page.locator('#hist-sheet-title').textContent(), 'Ny registrering');
    await page.keyboard.press('Escape'); await page.waitForSelector('#hist-sheet', { state: 'hidden' });
    await page.click('#hjem-lectio'); await page.waitForSelector('#lectio-sheet.open');
    assert.match(await page.locator('#lectio-sheet-body').textContent(), /ikke en registrering af arbejdstid/);
    await page.keyboard.press('Escape'); await page.waitForSelector('#lectio-sheet', { state: 'hidden' });
    // Fortsæt opretter en ny post, bevarer originalen og stopper undervisning.
    await page.click('#hjem-fortsaet');
    await page.waitForFunction(() => __fs.entries().some(e => e.id !== 'e1' && e.workType === 'retning' && !e.endTime));
    assert.equal(await page.evaluate(() => __fs.store.get('users/u1/entries/e1').durationMinutes), 60);
    assert.equal(await page.evaluate(() => __fs.entries().filter(e => !e.endTime).length), 1);
    await page.waitForFunction(() => document.getElementById('hjem-seneste').textContent.includes('Undervisning'));
    assert.deepEqual(fejl, []); await context.close();
    console.log(`OK   ${width} px: dagens sum, midnat, pauser, fremtid, Lectio, redigering, fortsæt og layout`);
  }
  {
    const { page, context, fejl } = await side(browser);
    await page.click('#hjem-vaelg-favoritter'); await page.waitForSelector('#favorit-sheet.open');
    await page.selectOption('#favorit-type-0', 'retning');
    await page.selectOption('#favorit-act-1', 'bio'); await page.selectOption('#favorit-type-1', 'forberedelse');
    await page.click('#favorit-form button[type="submit"]');
    await page.waitForSelector('#favorit-sheet', { state: 'hidden' });
    assert.deepEqual(await page.locator('#hjem-favoritter button').allTextContents(), ['3g Bio · Retning', '3g Bio · Forberedelse']);
    await page.locator('#hjem-favoritter button').nth(0).click();
    await page.waitForFunction(() => __fs.entries().some(e => !e.endTime && e.workType === 'retning'));
    assert.deepEqual(await page.locator('#hjem-favoritter button').allTextContents(), ['3g Bio · Retning', '3g Bio · Forberedelse']);
    // Gemning af almindelige indstillinger må bevare nye favoritter.
    await page.click('.nav-btn[data-view="indstillinger"]'); await page.click('#cfg-save-btn');
    assert.equal(await page.evaluate(() => __fs.store.get('users/u1/settings/config').hurtigstartFavoritter[0].workType), 'retning');
    const gemt = await page.evaluate(() => __fs.store.get('users/u1/settings/config'));
    // En ny browserkontekst starter fra de gemte kontoindstillinger.
    const anden = await side(browser, 390, seed.map(([path, data]) => [path, path === cfg[0] ? gemt : data]));
    assert.deepEqual(await anden.page.locator('#hjem-favoritter button').allTextContents(), ['3g Bio · Retning', '3g Bio · Forberedelse']);
    assert.deepEqual(anden.fejl, []); await anden.context.close();
    await page.click('.nav-btn[data-view="hjem"]');
    await page.evaluate(() => { const path = 'users/u1/settings/config'; __fs.put(path, { ...__fs.store.get(path), hurtigstartFavoritter: [{ activityId: 'srp', workType: null }] }); });
    await page.waitForFunction(() => document.getElementById('hjem-favoritter').textContent.includes('SRP & <vejledning>') && document.querySelectorAll('#hjem-favoritter button').length === 1);
    await page.evaluate(() => { const path = 'users/u1/activities/srp'; __fs.put(path, { ...__fs.store.get(path), isArchived: true }); });
    await page.waitForSelector('#hjem-favoritter.hidden', { state: 'attached' });
    await page.click('#hjem-vaelg-favoritter'); await page.waitForSelector('#favorit-sheet.open');
    await page.keyboard.press('Escape'); await page.waitForSelector('#favorit-sheet', { state: 'hidden' });
    assert.equal(await page.evaluate(() => document.activeElement.id), 'hjem-vaelg-favoritter');
    assert.deepEqual(fejl, []); await context.close();
    console.log('OK   Favoritter: arbejdstyper, faste pladser, kontoændringer, arkivering, indstillinger og tastatur');
  }
  {
    const { page, context, fejl } = await side(browser, 390, seed.map(([path, data]) =>
      [path, path === cfg[0] ? { ...data, autoStopAfterMinutes: 1440 } : data]));
    await page.evaluate(() => {
      for (let i = 0; i < 210; i++) {
        const start = Date.parse('2026-10-02T02:00:00Z') + i * 60000;
        __fs.put('users/u1/entries/ekstra' + i, { activityId: null, startTime: __fs.Timestamp.fromMillis(start), endTime: __fs.Timestamp.fromMillis(start + 60000), durationMinutes: 1 });
      }
    });
    await page.waitForFunction(() => document.getElementById('hjem-total').textContent === '5t 10m');
    // Denne test tillader en timer på op til 24 timer, så døgnskiftet
    // testes uden samtidig at ramme det særskilt testede auto-stop.
    await page.clock.setFixedTime(new Date('2026-10-02T22:01:00Z'));
    await page.waitForFunction(() => document.getElementById('hjem-total').textContent === '1m');
    assert.deepEqual(fejl, []); await context.close();
    console.log('OK   Dagens sum har ingen postgrænse, og en åben app skifter dag ved midnat');
  }
} finally { await browser.close(); }
