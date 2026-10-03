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

const browser = await chromium.launch();
const FERIE = [{ fra: '2026-07-06', til: '2026-07-27' }, { fra: '2026-12-21', til: '2026-12-24' },
               { fra: '2027-02-15', til: '2027-02-16' }, { fra: '2027-03-22', til: '2027-03-24' }];
const chipTal = async page => {
  await page.click('.nav-btn[data-view="rapporter"]'); await page.waitForTimeout(400);
  const t = (await page.textContent('.forecast-chip')).trim();
  return [t, Number(t.match(/(\d+)t/)[1])];
};

// Bagud-tallene er regnet med årsnormen 1690 t (appens udgangspunkt)
// Intet gemt: skolens plan for 2026/27 bruges af sig selv
{
  const page = await side(browser, { seed: [settings, act('a1', 'SRP')] });
  await page.waitForTimeout(400);
  const [t, n] = await chipTal(page);
  ok(n >= 539 && n <= 546, 'uden gemt ferie bruges skolens plan (73–74 af 229): ' + t);
  await page.click('.nav-btn[data-view="indstillinger"]'); await page.waitForTimeout(300);
  const sum = (await page.textContent('#cfg-ferie-sum')).replace(/\s+/g, ' ').trim();
  ok(sum === '25 feriedage · 229 arbejdsdage', 'skolens plan står i indstillingerne: ' + sum);
  await page.context().close();
}

// Uden ferie (gemt som tom liste): weekender og helligdage springes over
{
  const page = await side(browser, { seed: [['users/u1/settings/config', { currentSchoolYear: '2026/27', ferie: { '2026/27': [] } }], act('a1', 'SRP')] });
  await page.waitForTimeout(400);
  const [t, n] = await chipTal(page);
  ok(n >= 592 && n <= 599 && t.includes('bagud skema'), 'uden ferie (89–90 af 254 arbejdsdage): ' + t);
  await page.context().close();
}

// Med skolens ferieplan
{
  const page = await side(browser, { seed: [['users/u1/settings/config', { currentSchoolYear: '2026/27', ferie: { '2026/27': FERIE } }], act('a1', 'SRP')] }, 390);
  await page.waitForTimeout(400);
  const [t, n] = await chipTal(page);
  ok(n >= 539 && n <= 546, 'med ferieplan (73–74 af 229): ' + t + ' (lineært var det 570)');

  await page.click('.nav-btn[data-view="indstillinger"]'); await page.waitForTimeout(300);
  ok((await page.$$('#cfg-ferie-liste .ferie-raekke')).length === 4, 'fire ferieperioder vises');
  const sum = async () => (await page.textContent('#cfg-ferie-sum')).replace(/\s+/g, ' ').trim();
  ok((await sum()) === '25 feriedage · 229 arbejdsdage', 'sum: ' + await sum());
  const dage = await page.$$eval('.ferie-dage', e => e.map(x => x.textContent));
  ok(dage.join() === '16 dage,4 dage,2 dage,3 dage', 'dage pr. periode: ' + dage.join());
  await page.locator('#cfg-ferie-sektion, .settings-section:has(#cfg-ferie-liste)').screenshot({ path: DIR + '/ferie.png' });

  // Ny periode: tastefejlen fra ferieplanen (2027 i stedet for 2026)
  await page.click('#cfg-ferie-ny');
  ok(await page.evaluate(() => document.activeElement.classList.contains('ferie-fra')), 'fokus i det nye fra-felt');
  await page.fill('#cfg-ferie-liste .ferie-raekke:last-child .ferie-fra', '2027-07-06');
  ok(await page.inputValue('#cfg-ferie-liste .ferie-raekke:last-child .ferie-tilfelt') === '2027-07-06', 'til-feltet følger fra');
  ok((await sum()).includes('OBS · Én periode ligger uden for normperioden 1. jun 2026 – 31. maj 2027'), 'advarer om periode uden for normperioden: ' + await sum());
  ok((await sum()).startsWith('25 feriedage'), 'perioden uden for tæller ikke med');
  await page.locator('.settings-section:has(#cfg-ferie-liste)').scrollIntoViewIfNeeded(); await page.screenshot({ path: DIR + '/ferie-obs.png', fullPage: true });
  await page.click('#cfg-ferie-liste .ferie-raekke:last-child .ferie-slet');
  ok((await page.$$('#cfg-ferie-liste .ferie-raekke')).length === 4 && !(await sum()).includes('OBS'), 'slet fjerner rækken og advarslen');

  // Ferie-fridage: en uge i efterårsferien, indtastet bagfra
  await page.click('#cfg-ferie-ny');
  await page.fill('#cfg-ferie-liste .ferie-raekke:last-child .ferie-fra', '2026-10-12');
  await page.fill('#cfg-ferie-liste .ferie-raekke:last-child .ferie-tilfelt', '2026-10-16');
  ok((await sum()) === '30 feriedage · 224 arbejdsdage', 'med 6. ferieuge: ' + await sum());
  await page.click('#cfg-save-btn'); await page.waitForTimeout(300);
  const gemt = await page.evaluate(() => window.__fs.store.get('users/u1/settings/config')?.ferie?.['2026/27']);
  ok(gemt?.length === 5 && gemt[0].fra === '2026-07-06' && gemt[2].fra === '2026-12-21' && gemt[1].fra === '2026-10-12', 'gemt i datoorden: ' + JSON.stringify(gemt?.map(p => p.fra)));
  const [t2, n2] = await chipTal(page);
  ok(n2 >= 553 && n2 <= 560, 'rapporten følger med efter gem (73–74 af 224): ' + t2);

  // Andet skoleår i feltet: tom liste
  await page.click('.nav-btn[data-view="indstillinger"]'); await page.waitForTimeout(200);
  await page.fill('#cfg-school-year', '2027/28');
  ok((await page.$$('#cfg-ferie-liste .ferie-raekke')).length === 0 && (await page.textContent('#cfg-ferie-aar')) === '2027/28', 'andet skoleår: egen liste');
  await page.fill('#cfg-school-year', '2026/27');
  ok((await page.$$('#cfg-ferie-liste .ferie-raekke')).length === 5, 'tilbage: fem perioder');
  const bred = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  ok(bred, 'intet vandret overløb ved 390');
  await page.context().close();
}
await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
