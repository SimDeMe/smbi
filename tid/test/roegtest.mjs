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
const vent = ms => new Promise(r => setTimeout(r, ms));
const page = await side(browser, { seed: [settings,
  act('a1', '3g Ng & <b>Bio</b>', { type: 'hold', color: '#E8336D' }), act('a2', 'SRP "store"', { order: 2 }),
  post('e1', 'a1', idag(8, 0), idag(9, 35), { workType: 'undervisning' }),
  post('e2', 'a2', idag(10, 0), idag(10, 45)),
] });
await page.waitForTimeout(400);

// Hjem: hurtigstart og «1 modul»-arket
ok((await page.textContent('#view-hjem')).includes('3g Ng & <b>Bio</b>'), 'navn med & og <b> vises som tekst (esc)');
await page.click('#btn-1-modul'); await page.waitForSelector('#modul-sheet.open');
ok(true, 'modul-arket åbner');
await page.click('#modul-close'); await page.waitForTimeout(400);
ok(await page.isHidden('#modul-sheet'), 'modul-arket lukker og skjules');

// Rettet sæt
await page.click('#btn-rettet-saet'); await page.waitForSelector('#saet-sheet.open');
ok(true, 'rettet-sæt-arket åbner');
await page.click('#saet-backdrop', { position: { x: 5, y: 5 } }); await page.waitForTimeout(400);
ok(await page.isHidden('#saet-sheet') && await page.isHidden('#saet-backdrop'), 'rettet-sæt-arket lukker via baggrunden');

// Historik: liste og kalender
await page.click('.nav-btn[data-view="historik"]'); await page.waitForSelector('#hist-mode-kalender:not(.hidden)');
ok(await page.isHidden('#hist-mode-liste'), 'Historik åbner i kalenderen');
await page.click('.hist-mode-tab[data-mode="liste"]'); await page.waitForSelector('.entry-row');
const rk = (await page.textContent('.entry-row[data-id="e1"]')).replace(/\s+/g, ' ');
ok(rk.includes('08:00') && rk.includes('1t 35m') && rk.includes('Undervisning'), 'listerække: ' + rk.trim());
const hoved = await page.$$eval('.entry-day-head, .day-header, h3', h => h.map(x => x.textContent.trim()).slice(0, 2));
console.log('  dagoverskrift:', hoved.join(' | '));
await page.click('.entry-row[data-id="e2"]'); await page.waitForSelector('#hist-sheet.open');
const d = new Date(); const iDag = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
ok(await page.inputValue('#hist-date') === iDag && await page.inputValue('#hist-start') === '10:00', 'formularen får dato og tid (datoInput, fmtTime)');
await page.click('#hist-sheet-close'); await page.waitForTimeout(400);
ok(await page.isHidden('#hist-sheet'), 'historik-arket lukker');
const kalTab = await page.$('#kal-vis-tabs button'); 
const visKnap = await page.$('.hist-mode-tab[data-mode="kalender"]');
if (visKnap) { await visKnap.click(); await page.waitForTimeout(400); }
const kalTxt = (await page.textContent('#kal-view')).replace(/\s+/g, ' ');
ok(kalTxt.includes('08:00–09:35') || kalTxt.includes('1t 35m'), 'kalenderen tegner med fmtTime/fmtMins: ' + kalTxt.slice(0, 90));
await page.click('.kal-vis-tab[data-vis="uge"]'); await page.waitForTimeout(300);
{ const u = (await page.textContent('#kal-view')).replace(/\s+/g,' '); ok(u.includes('2t 20m') && u.includes('SRP "store"'), 'ugevisning tegnes: ' + u.slice(-120)); }
await page.click('.kal-vis-tab[data-vis="maaned"]'); await page.waitForTimeout(300);
ok((await page.$$('.kal-md-uge')).length >= 4, 'månedsvisning tegnes');
await page.click('.kal-vis-tab[data-vis="aar"]'); await page.waitForTimeout(300);
ok((await page.$$('.kal-aar-md')).length === 12, 'årsvisning tegnes');
await page.click('.kal-vis-tab[data-vis="dag"]'); await page.waitForTimeout(300);
ok((await page.textContent('#kal-total')) === '2t 20m', 'kalenderens total: ' + await page.textContent('#kal-total'));
// Står man i listen og skifter fane, åbner Historik igen i kalenderen
await page.click('.hist-mode-tab[data-mode="liste"]');
await page.click('.nav-btn[data-view="hjem"]'); await page.click('.nav-btn[data-view="historik"]');
await page.waitForSelector('#hist-mode-kalender:not(.hidden)');
ok(await page.isHidden('#hist-mode-liste'), 'Historik åbner i kalenderen igen efter et fanebesøg');

// Rapporter
await page.click('.nav-btn[data-view="rapporter"]'); await page.waitForTimeout(500);
const rap = (await page.textContent('#view-rapporter')).replace(/\s+/g, ' ');
ok(rap.includes('1t 35m') && rap.includes('45m'), 'rapporten bruger fmtMins');
ok(rap.includes('Undervisning'), 'rapporten skriver arbejdstypen med stort');

// Aktiviteter: alle tre ark
await page.click('.nav-btn[data-view="aktiviteter"]'); await page.waitForTimeout(300);
for (const [knap, ark, luk] of [['#btn-new-activity', 'act-sheet', '#act-sheet-close'], ['#btn-import-text', 'import-sheet', '#import-sheet-close'], ['#btn-copy-year', 'copy-sheet', '#copy-sheet-close']]) {
  await page.click(knap); await page.waitForSelector(`#${ark}.open`);
  await page.click(luk); await page.waitForTimeout(400);
  ok(await page.isHidden('#' + ark), ark + ' åbner og lukker');
}
const akt = await page.textContent('#view-aktiviteter');
ok(akt.includes('3g Ng & <b>Bio</b>') && akt.includes('SRP "store"'), 'aktivitetsnavne escapes korrekt');

// Indstillinger
await page.click('.nav-btn[data-view="indstillinger"]'); await page.waitForTimeout(200);
ok(await page.isVisible('#view-indstillinger'), 'indstillinger vises');

await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
