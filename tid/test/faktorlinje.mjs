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
const hold = (id, navn) => act(id, navn, { type: 'hold', budgetHours: 300, normGrundlag: { moduler: 60, elever: 28, fordybelsestid: 10 } });
const page = await side(browser, { seed: [settings, hold('h1', 'Uden retning'), hold('h2', 'Med retning'),
  post('e1', 'h1', idag(8), idag(9, 35), { workType: 'undervisning' }),
  post('e2', 'h2', idag(10), idag(11, 35), { workType: 'undervisning' }),
  post('e3', 'h2', idag(12), idag(13), { workType: 'retning' }),
] });
await page.waitForTimeout(400);
await page.click('.nav-btn[data-view="rapporter"]'); await page.waitForTimeout(500);
const linjer = await page.$$eval('.rapport-faktor', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
console.log(linjer);
const uden = linjer.find(l => !l.includes('Retning'));
const med  = linjer.find(l => l.includes('Retning (skønnet)'));
ok(linjer.length === 2 && uden && uden.includes('Forb.faktor'), 'hold uden retning: kun forb.faktor');
ok(med && !med.includes(' 0,0 '), 'hold med retning: skønnet tal');
await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
