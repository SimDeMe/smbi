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
  const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, serviceWorkers: 'block', locale: 'da-DK' });
  const page = await ctx.newPage();
  page.on('pageerror', e => fejl.push('pageerror: ' + e.message));
  for (const [frag, fil] of [['firebase-app.js', 'fake-app.js'], ['firebase-auth.js', 'fake-auth.js'], ['firebase-firestore.js', 'fake-fs.js']])
    await page.route('**/' + frag, r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(HER + fil, 'utf8') }));
  await page.route('**/feedback.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('https://fonts.**', r => r.abort());
  await page.addInitScript(c => { window.__fsCfg = c; }, cfg);
  // Tallene nedenfor er regnet for fredag 2. oktober 2026 kl. 10
  await page.clock.setFixedTime(new Date(2026, 9, 2, 10, 0));
  await page.goto(BASE);
  return page;
}
const act = (id, name, extra = {}) => [`users/u1/activities/${id}`, { name, type: 'opgave', color: '#0E86C8', schoolYear: '2026/27', order: 1, isArchived: false, parentId: null, ...extra }];
const settings = ['users/u1/settings/config', { currentSchoolYear: '2026/27' }];
const idag = (h, m = 0) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.getTime(); };
const post = (id, a, s, e, extra = {}) => [`users/u1/entries/${id}`, { activityId: a, workType: null, startTime: { __ts: s }, endTime: e == null ? null : { __ts: e }, durationMinutes: e == null ? null : Math.round((e - s) / 60000), note: '', isModule: false, autoStopped: false, ...extra }];
const tilHistorik = async page => { await page.click('.nav-btn[data-view="historik"]'); await page.waitForSelector('#view-historik:not(.hidden)'); };
const dato = (d, h, m = 0) => new Date(2026, 8, d, h, m).getTime();   // september 2026

const browser = await chromium.launch();

// ── Ugevisningen: en post hen over midnat udvider ikke aksen til 00 ──
{
  const page = await side(browser, { seed: [settings, act('a1', 'SRP'), act('a2', 'Retning'),
    post('e1', 'a1', dato(28, 22), dato(29, 0, 40)),        // mandag 22:00 → tirsdag 00:40
    post('e2', 'a2', dato(30, 8), dato(30, 15)) ] });
  await page.waitForTimeout(400);
  await tilHistorik(page);
  await page.click('.hist-mode-tab[data-mode="kalender"]'); await page.waitForTimeout(300);
  await page.click('.kal-vis-tab[data-vis="uge"]'); await page.waitForTimeout(300);
  const timer = await page.$$eval('.kal-hour-lab', l => l.map(x => x.textContent));
  ok(timer[0] === '07', 'aksen begynder stadig kl. 07: ' + timer[0] + '–' + timer.at(-1));
  ok(timer.at(-1) === '23', 'aftenens start får sin time med, ikke til 24: ' + timer.at(-1));
  const blokke = await page.$$eval('.kal-bane', b => b.map(x =>
    [...x.querySelectorAll('.kal-block')].map(k => ({ a: k.getAttribute('aria-label'), c: k.className }))));
  const man = blokke[0][0], tir = blokke[1][0];
  ok(man && man.a.includes('22:00–…') && man.a.includes('2t'), 'mandag: 22:00–…, 2t: ' + man?.a);
  ok(tir && tir.a.includes('…–00:40') && tir.a.includes('40m') && tir.c.includes('kal-block-clip-top'),
     'tirsdag: stump øverst med …–00:40 og 40m: ' + tir?.a);
  const tirTop = await page.$eval('.kal-bane[data-dagnr="1"] .kal-block', b => parseFloat(b.style.top));
  ok(tirTop === 0, 'stumpen står i toppen af aksen: ' + tirTop);
  const tot = await page.$$eval('.kal-dag-total', l => l.map(x => x.textContent));
  ok(tot[0] === '2t' && tot[1] === '40m', 'dagenes totaler tæller hele andelen: ' + tot.slice(0, 3));
  await page.screenshot({ path: DIR + '/uge-midnat.png', fullPage: true });

  // ── Tryk-mål i måned og år (min. 44 px) ──
  await page.click('.kal-vis-tab[data-vis="maaned"]'); await page.waitForTimeout(300);
  const uger = await page.$$eval('.kal-md-uge', l => l.map(b => b.getBoundingClientRect()).map(r => [r.width, r.height]));
  ok(uger.every(([w, h]) => w >= 44 && h >= 44), 'ugenumre er mindst 44×44: ' + JSON.stringify(uger[0]));
  await page.click('.kal-vis-tab[data-vis="aar"]'); await page.waitForTimeout(300);
  const md = await page.$$eval('.kal-aar-md', l => l.map(b => b.getBoundingClientRect().height));
  ok(md.length === 12 && md.every(h => h >= 44), 'månedsrækkerne er mindst 44 høje: ' + md[0]);
  await page.screenshot({ path: DIR + '/aar-tryk.png', fullPage: true });
}

// ── Import med optjeningsmåde ──
{
  const page = await side(browser, { seed: [settings, act('a0', 'Findes i forvejen')] });
  await page.waitForTimeout(400);
  await page.click('.nav-btn[data-view="aktiviteter"]'); await page.waitForTimeout(300);
  await page.click('#btn-import-text'); await page.waitForSelector('#import-sheet.open');
  await page.fill('#import-year', '2026/27');
  await page.fill('#import-text', [
    '3g Ng; hold; 288',
    'Eksamen og prøver; opgave; 80',
    'SRP; opgave; 20,5; Eksamen og prøver; afslutning',
    'Vejledning; opgave; 40;; Manuelt',
    'Møder; opgave; 30;; ved afslutning',
  ].join('\n'));
  await page.click('#btn-do-import'); await page.waitForTimeout(500);
  const akt = await page.evaluate(() => Object.fromEntries([...window.__fs.store.entries()]
    .filter(([p]) => p.includes('/activities/')).map(([, d]) => [d.name, d])));
  ok(akt['3g Ng']?.type === 'hold' && akt['3g Ng'].optjening == null, 'hold får ingen optjening');
  ok(akt['Eksamen og prøver']?.optjening === 'loebende', 'uden femte kolonne: løbende');
  ok(akt['SRP']?.optjening === 'afslutning' && akt['SRP'].budgetHours === 20.5 && akt['SRP'].parentId,
     'SRP: ved afslutning, 20,5 t, under Eksamen: ' + JSON.stringify(akt['SRP']));
  ok(akt['Vejledning']?.optjening === 'manuel' && !akt['Vejledning'].parentId, 'tom parent + «Manuelt»: manuel');
  ok(akt['Møder']?.optjening === 'afslutning', '«ved afslutning» som i formularen');
  const toast = await page.textContent('#toast');
  ok(toast.includes('5 aktiviteter') && toast.includes('1 optjener løbende'), 'toasten siger, hvor mange der blev løbende: ' + toast);
}

await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
