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

const chipTal = async page => {
  await page.click('.nav-btn[data-view="rapporter"]'); await page.waitForTimeout(400);
  const t = (await page.textContent('.forecast-chip')).trim();
  return [t, Number(t.match(/(\d+)t/)[1])];
};
const cfg = extra => ['users/u1/settings/config', { currentSchoolYear: '2026/27', ...extra }];
const rapport = async page => { await page.click('.nav-btn[data-view="rapporter"]'); await page.waitForTimeout(400); };
const tekst = async (page, sel) => ((await page.textContent(sel).catch(() => '')) || '').replace(/\s+/g, ' ').trim();

const browser = await chromium.launch();

// ── Indtast frikøb og overført i Indstillinger, gem, og se rapporten følge med ──
{
  const page = await side(browser, { seed: [cfg({ normHours: 1690 }),
    act('a1', 'SRP', { budgetHours: 1000 }), act('a2', 'Vejledning', { budgetHours: 590 })] });
  await page.waitForTimeout(400);
  await rapport(page);
  const [, foer] = await chipTal(page);
  await page.click('.nav-btn[data-view="indstillinger"]'); await page.waitForTimeout(300);
  await page.click('#cfg-andet-ny');
  ok(await page.evaluate(() => document.activeElement.classList.contains('andet-navn')), 'fokus i det nye navnefelt');
  await page.fill('#cfg-andet-liste .andet-raekke:last-child .andet-navn', 'Frikøb (TR)');
  await page.fill('#cfg-andet-liste .andet-raekke:last-child .andet-timer', '120,5');
  await page.click('#cfg-andet-ny');
  await page.fill('#cfg-andet-liste .andet-raekke:last-child .andet-navn', 'Overført fra 2025/26');
  await page.fill('#cfg-andet-liste .andet-raekke:last-child .andet-timer', '-20,5');
  await page.click('#cfg-andet-ny');                                     // tom linje gemmes ikke
  const sum = await tekst(page, '#cfg-andet-sum');
  ok(sum.includes('100 t uden registrering') && sum.includes('1590 t'), 'summen i indstillingerne: ' + sum);
  await page.click('#cfg-save-btn'); await page.waitForTimeout(400);
  const gemt = await page.evaluate(() => window.__fs.store.get('users/u1/settings/config')?.portefoljeAndet?.['2026/27']);
  ok(JSON.stringify(gemt) === JSON.stringify([{ navn: 'Frikøb (TR)', timer: 120.5 }, { navn: 'Overført fra 2025/26', timer: -20.5 }]),
     'gemt uden den tomme linje: ' + JSON.stringify(gemt));

  await rapport(page);
  const norm = await tekst(page, '.norm-progress-labels span');
  ok(norm.endsWith('/ 1590t'), 'rapporten måler mod 1590 t: ' + norm);
  ok((await tekst(page, '.norm-andet')) === 'Årsnorm 1690 t − 100 t andet i porteføljen', 'forklaringen under bjælken: ' + await tekst(page, '.norm-andet'));
  const [, efter] = await chipTal(page);
  ok(efter < foer && Math.abs(foer - efter - Math.round(100 * foer / 1690)) <= 1, `bagud falder i forhold til normen: ${foer} → ${efter}`);
  const port = await tekst(page, '.akkord-portefolje');
  ok(port.includes('Portefølje 1690 t (heraf 100 t andet)') && port.includes('merarbejde over 1732 t') && !port.includes('over —'),
     'porteføljen tæller frikøb og overført med: ' + port);

  // Linjerne vises igen ved næste besøg
  await page.click('.nav-btn[data-view="indstillinger"]'); await page.waitForTimeout(300);
  ok((await page.$$('#cfg-andet-liste .andet-raekke')).length === 2, 'to linjer står i indstillingerne');
  await page.screenshot({ path: DIR + '/portefolje-andet.png', fullPage: true });
  await page.context().close();
}

// ── Kun andet i porteføljen, ingen opgaver med budget: linjen står stadig ──
{
  const page = await side(browser, { seed: [cfg({ normHours: 1690, portefoljeAndet: { '2026/27': [{ navn: 'Barsel', timer: 800 }] } }), act('a1', 'SRP')] });
  await page.waitForTimeout(400);
  await rapport(page);
  ok((await tekst(page, '.norm-progress-labels span')).endsWith('/ 890t'), 'barsel 800 t: der skal registreres 890 t');
  ok((await tekst(page, '.akkord-portefolje')).includes('Portefølje 800 t (heraf 800 t andet)'), 'porteføljen viser barslen: ' + await tekst(page, '.akkord-portefolje'));
  await page.context().close();
}

// ── Andet hører til ét skoleår: et andet år er ikke berørt ──
{
  const page = await side(browser, { seed: [cfg({ normHours: 1690, portefoljeAndet: { '2025/26': [{ navn: 'Frikøb', timer: 100 }] } }), act('a1', 'SRP')] });
  await page.waitForTimeout(400);
  await rapport(page);
  ok((await tekst(page, '.norm-progress-labels span')).endsWith('/ 1690t') && !(await page.$('.norm-andet')), '2025/26-linjer rører ikke 2026/27');
  await page.context().close();
}

await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
