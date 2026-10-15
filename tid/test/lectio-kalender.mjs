import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const here = fileURLToPath(new URL('.', import.meta.url));
mkdirSync(here + 'ud', { recursive: true });
const base = 'http://localhost:8777/tid/';
const events = [
  { id: 'plan1', activityId: '1', title: 'Vulkaner', start: '2026-10-19T08:10:00', end: '2026-10-19T09:45:00', timeZone: 'Europe/Copenhagen', group: '2x', room: '43', cancelled: false },
  { id: 'plan2', activityId: '2', title: 'Aflyst!', start: '2026-10-19T10:00:00', end: '2026-10-19T11:35:00', timeZone: 'Europe/Copenhagen', group: '1p', room: '12', cancelled: true, credits: { status: 'ok', teachers: [{ teacher: 'AA', credited: true, modules: 1, cancellationReason: 'Barns sygdom' }], groups: [{ group: '1p', credited: true, modules: 1 }] } },
  { id: 'all-day', title: 'Studiepraktik', start: '2026-10-19T00:00:00', end: '2026-10-20T00:00:00', allDay: true, timeZone: 'Europe/Copenhagen' }
];
const seed = [
  ['users/u1/settings/config', { currentSchoolYear: '2026/27' }],
  ['users/u1/activities/a', { name: 'Undervisning', type: 'hold', schoolYear: '2026/27', order: 1, color: '#0E86C8', isArchived: false }],
  ['users/u1/entries/real', { activityId: 'a', workType: 'undervisning', startTime: { __ts: Date.parse('2026-10-19T06:00:00Z') }, endTime: { __ts: Date.parse('2026-10-19T07:00:00Z') }, durationMinutes: 60 }],
  ['users/u1/lectioSchedules/2026-27', { schemaVersion: 1, source: 'https://www.lectio.dk/lectio/141/SkemaNy.aspx', fetchedAt: '2026-10-15T14:00:00Z', events }]
];
const browser = await chromium.launch();
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'da-DK', timezoneId: 'Europe/Copenhagen', serviceWorkers: 'block' });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const [frag, file] of [['firebase-app.js', 'fake-app.js'], ['firebase-auth.js', 'fake-auth.js'], ['firebase-firestore.js', 'fake-fs.js']]) await page.route('**/' + frag, r => r.fulfill({ contentType: 'text/javascript', body: readFileSync(here + file, 'utf8') }));
    await page.route('**/feedback.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
    await page.addInitScript(config => { window.__fsCfg = config; }, { seed });
    await page.clock.setFixedTime(new Date('2026-10-19T12:00:00Z'));
    await page.goto(base); await page.click('.nav-btn[data-view="historik"]');
    await page.waitForSelector('.kal-block-lectio');
    assert.equal(await page.locator('.kal-block-lectio').count(), 2);
    assert.equal(await page.locator('.kal-block-lectio[data-flyt]').count(), 0);
    assert.equal(await page.locator('#kal-total').textContent(), '1t');
    assert.equal(await page.locator('#kal-lectio-list .lectio-plan-row').count(), 3);
    await page.click('.kal-lectio-cancelled');
    await page.waitForSelector('#lectio-sheet.open');
    assert.match(await page.locator('#lectio-sheet-body').textContent(), /Lærer AA: ja \(1 modul\)/);
    assert.equal((await page.evaluate(() => window.__fs.entries())).length, 1);
    await page.keyboard.press('Escape'); await page.waitForSelector('#lectio-sheet', { state: 'hidden' });
    await page.uncheck('#kal-lectio-toggle'); assert.equal(await page.locator('.kal-block-lectio').count(), 0);
    assert.equal(await page.locator('#kal-total').textContent(), '1t');
    await page.check('#kal-lectio-toggle');
    await page.click('.kal-vis-tab[data-vis="uge"]');
    await page.waitForFunction(() => document.getElementById('kal-total').textContent === '1t');
    assert.equal(await page.locator('#kal-total').textContent(), '1t');
    await page.screenshot({ path: here + `ud/lectio-kalender-${width}.png`, fullPage: true });
    await page.click('.kal-vis-tab[data-vis="maaned"]'); assert.match(await page.locator('.lectio-day-count').textContent(), /3 Lectio/);
    await page.click('.kal-vis-tab[data-vis="aar"]'); assert.match(await page.locator('.lectio-year-count').textContent(), /3 Lectio/);
    await page.evaluate(async () => { const { initKalenderView } = await import('./kalender.js'); initKalenderView(null); });
    assert.equal(await page.locator('.lectio-plan-row').count(), 0);
    assert.deepEqual(errors, []); await context.close();
  }
  console.log('OK   Lectio i dag/uge/måned/år, separate krediteringer, logout og ingen ændring af registreret tid');
} finally { await browser.close(); }
