import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fsx from 'fs';
const HER = fileURLToPath(new URL('.', import.meta.url));   // tid/test/
const DIR = HER + 'ud';                                       // skærmbilleder
fsx.mkdirSync(DIR, { recursive: true });
import fs from 'fs';
const BASE = 'http://localhost:8777/tid/';
const fejl = [];
const ok = (b, msg) => { console.log((b ? 'OK   ' : 'FEJL ') + msg); if (!b) fejl.push(msg); };

async function side(browser, cfg, w = 390) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => fejl.push('pageerror: ' + e.message));
  for (const [frag, fil] of [['firebase-app.js', 'fake-app.js'], ['firebase-auth.js', 'fake-auth.js'], ['firebase-firestore.js', 'fake-fs.js']])
    await page.route('**/' + frag, r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(HER + fil, 'utf8') }));
  await page.route('**/feedback.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('https://fonts.**', r => r.abort());
  await page.addInitScript(c => { window.__fsCfg = c; }, cfg);
  await page.goto(BASE);
  return page;
}
const act = (id, name, extra = {}) => [`users/u1/activities/${id}`, { name, type: 'opgave', color: '#0E86C8', schoolYear: '2026/27', order: 1, isArchived: false, parentId: null, ...extra }];
const settings = ['users/u1/settings/config', { currentSchoolYear: '2026/27' }];
const idag = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.getTime(); };
const post = (id, a, s, e, extra = {}) => [`users/u1/entries/${id}`, { activityId: a, workType: null, startTime: { __ts: s }, endTime: e == null ? null : { __ts: e }, durationMinutes: e == null ? null : Math.round((e - s) / 60000), note: '', isModule: false, autoStopped: false, ...extra }];
const tilHistorik = async page => { await page.click('.nav-btn[data-view="historik"]'); await page.waitForSelector('#view-historik:not(.hidden)'); };

const browser = await chromium.launch();
const navne = ['Eksamen og årsprøver', 'Studieretningsprojekt vejledning', '3g Ng', 'Pædagogisk udvalg og møder', 'SRP', 'Mentorordning for nye kolleger'];
for (const w of [390, 340]) {
  const page = await side(browser, { seed: [settings, ...navne.map((n, i) => act('a' + i, n, { order: i }))] }, w);
  await page.waitForSelector('.qs-btn'); await page.waitForTimeout(300);
  const r = await page.$$eval('.qs-name', e => e.map(x => ({ t: x.textContent, klip: x.scrollHeight > x.clientHeight + 1, linjer: Math.round(x.clientHeight / parseFloat(getComputedStyle(x).lineHeight)) })));
  console.log(w, r.map(x => `${x.t}: ${x.linjer}${x.klip ? ' KLIPPET' : ''}`).join(' | '));
  ok(r.every(x => !x.klip), `${w} px: ingen navne klippes`);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${w} px: intet vandret overløb`);
  await page.screenshot({ path: `${DIR}/qs-${w}.png`, clip: { x: 0, y: 0, width: w, height: 700 } });
  await page.context().close();
}
// Bred skærm: appen bruger op til 1200 px midt på, og hurtigstarten får flere spalter
{
  const w = 2000;
  const page = await side(browser, { seed: [settings, ...navne.map((n, i) => act('a' + i, n, { order: i }))] }, w);
  await page.waitForSelector('.qs-btn'); await page.waitForTimeout(300);
  const m = await page.evaluate(() => {
    const r = s => document.querySelector(s).getBoundingClientRect();
    const g = r('#quickstart-grid'), n = r('.nav-btn:first-child'), nl = r('.nav-btn:last-child');
    const spalter = getComputedStyle(document.getElementById('quickstart-grid')).gridTemplateColumns.split(' ').length;
    return { gl: g.left, gr: g.right, nl: n.left, nr: nl.right, spalter };
  });
  ok(m.gr - m.gl <= 1200 && m.gr - m.gl > 1000, `${w} px: hurtigstarten er op til 1200 px bred (${Math.round(m.gr - m.gl)})`);
  ok(m.spalter >= 4, `${w} px: hurtigstarten har flere spalter (${m.spalter})`);
  ok(Math.abs((m.gl + m.gr) / 2 - w / 2) < 2, `${w} px: hurtigstarten står midt på`);
  ok(m.nr - m.nl <= 1200 && Math.abs((m.nl + m.nr) / 2 - w / 2) < 2, `${w} px: bundmenuen står midt på`);
  await page.click('.qs-btn');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${DIR}/qs-${w}.png` });
  await page.context().close();
}
await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
