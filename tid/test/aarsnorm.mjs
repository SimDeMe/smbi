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

const cfg = extra => ['users/u1/settings/config', { currentSchoolYear: '2026/27', ...extra }];
const tilIndst = async page => { await page.click('.nav-btn[data-view="indstillinger"]'); await page.waitForTimeout(300); };
const normTekst = async page => (await page.textContent('.norm-progress-labels span')).trim();

const browser = await chromium.launch();

// ── Udgangspunktet er 1690 t, og en gemt 1650 (gammel standard) læses som 1690 ──
for (const [navn, extra] of [['intet gemt', {}], ['gammel standard 1650 gemt', { normHours: 1650 }]]) {
  const page = await side(browser, { seed: [cfg(extra), act('a1', 'SRP')] });
  await page.waitForTimeout(400);
  await page.click('.nav-btn[data-view="rapporter"]'); await page.waitForTimeout(400);
  ok((await normTekst(page)).endsWith('/ 1690t'), `${navn}: rapporten måler mod 1690 t: ` + await normTekst(page));
  await tilIndst(page);
  ok(await page.inputValue('#cfg-norm-hours') === '1690', `${navn}: feltet viser 1690`);
  ok((await page.textContent('#cfg-norm-hjaelp')).trim() === 'Fuld tid.', `${navn}: «Fuld tid.»`);
  await page.context().close();
}

// ── En rigtig nedsat norm bevares, og feltet siger procenten ──
{
  const page = await side(browser, { seed: [cfg({ normHours: 1352 }), act('a1', 'SRP')] });
  await page.waitForTimeout(400);
  await tilIndst(page);
  ok(await page.inputValue('#cfg-norm-hours') === '1352', 'nedsat tid: 1352 bevares');
  const h = (await page.textContent('#cfg-norm-hjaelp')).trim();
  ok(h.startsWith('80 % af fuld tid'), 'nedsat tid: ' + h);

  // Skriver man porteføljens sum, advares der
  await page.fill('#cfg-norm-hours', '1715');
  const adv = await page.$eval('#cfg-norm-hjaelp', e => [e.className, e.textContent]);
  ok(adv[0].includes('norm-advarsel') && adv[1].includes('opgaveportefølje'), 'over 1690: advarsel om porteføljen: ' + adv[1].slice(0, 60));
  await page.context().close();
}

// ── Porteføljen står i rapporten mod årsnormen og merarbejdsgrænsen ──
for (const [norm, budgetter, forventet] of [
  [1690, [1000, 700],  ['Portefølje 1700 t', 'årsnorm 1690 t', 'merarbejde over 1732 t']],
  [1690, [1000, 740],  ['Portefølje 1740 t', 'merarbejde over 1732 t — 8 t over']],
  [1352, [1000, 360],  ['Portefølje 1360 t', 'årsnorm 1352 t', 'merarbejde over 1386 t']],   // 1352 + 42 × 0,8
]) {
  const page = await side(browser, { seed: [cfg({ normHours: norm }),
    act('a1', 'SRP', { budgetHours: budgetter[0] }), act('a2', 'Vejledning', { budgetHours: budgetter[1] })] });
  await page.waitForTimeout(400);
  await page.click('.nav-btn[data-view="rapporter"]'); await page.waitForTimeout(400);
  const linje = ((await page.textContent('.akkord-portefolje').catch(() => '')) || '').replace(/\s+/g, ' ').trim();
  ok(forventet.every(f => linje.includes(f)), `norm ${norm}, portefølje ${budgetter[0] + budgetter[1]}: ` + linje);
  await page.context().close();
}

await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
