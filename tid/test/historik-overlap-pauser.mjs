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

// ── Punkt 7: intet banner på Hjem ──
{
  const page = await side(browser, { seed: [settings, act('a1', 'SRP'), post('e1', 'a1', Date.now() - 10 * 60000, null)] });
  await page.waitForSelector('#timer-card:not(.hidden)');
  await page.waitForTimeout(200);
  ok(await page.isVisible('#timer-card') && !(await page.isVisible('#active-timer-banner')), 'Hjem: timerkort ja, banner nej');
  await tilHistorik(page);
  ok(await page.isVisible('#active-timer-banner'), 'Historik: banner vises');
  await page.click('.nav-btn[data-view="hjem"]');
  ok(!(await page.isVisible('#active-timer-banner')), 'tilbage på Hjem: banner skjult igen');
  await page.context().close();
}

// ── Punkt 4 + 6: overlap og pauser i listen ──
{
  const page = await side(browser, { seed: [settings, act('a1', '3g Ng'), act('a2', 'SRP', { order: 2 }),
    post('e1', 'a1', idag(8, 0), idag(9, 35)),
    post('p1', null, idag(9, 35), idag(9, 50), { isBreak: true }),
    post('e2', 'a1', idag(9, 50), idag(11, 25)),
    post('e3', 'a2', idag(11, 0), idag(11, 40)),   // overlapper e2
    post('e4', 'a2', idag(13, 0), idag(14, 0)),
  ] });
  await page.waitForTimeout(300);
  await tilHistorik(page);
  await page.selectOption('#hist-period-select', 'dag');
  await page.waitForSelector('.entry-row');
  const rk = await page.$$eval('.entry-row', r => r.map(x => x.dataset.id));
  ok(rk.length === 4 && !rk.includes('p1'), 'pausen er ikke et kort: ' + rk.join(','));
  ok(await page.$('.entry-pause-line[data-id="p1"]') != null, 'pausen er en mellemlinje: ' + (await page.textContent('.entry-pause-line')).replace(/\s+/g, ' ').trim());
  const ov = await page.$$eval('.entry-row', r => r.filter(x => x.querySelector('.entry-overlap')).map(x => x.dataset.id).sort());
  ok(ov.join() === 'e2,e3', 'overlap-mærkat på e2 og e3: ' + ov.join());
  await page.screenshot({ path: DIR + '/liste.png', fullPage: true });

  await page.click('.entry-pause-line');
  await page.waitForSelector('#hist-sheet.open');
  ok((await page.textContent('#hist-sheet-title')) === 'Redigér kort pause', 'pauselinjen åbner pausen');
  await page.click('#hist-sheet-close'); await page.waitForTimeout(400);

  // Ny post hen over 3g Ng 08:00–09:35
  await page.click('#btn-new-entry');
  await page.waitForSelector('#hist-sheet.open');
  await page.fill('#hist-start', '09:00'); await page.fill('#hist-end', '10:00');
  await page.waitForTimeout(300);
  const t = await page.textContent('#hist-overlap');
  ok(await page.isVisible('#hist-overlap') && t.includes('3g Ng 08:00–09:35') && t.includes('Kort pause'), 'formular advarer: ' + t);
  await page.screenshot({ path: DIR + '/form.png' });
  await page.fill('#hist-start', '15:00'); await page.fill('#hist-end', '16:00');
  await page.waitForTimeout(200);
  ok(!(await page.isVisible('#hist-overlap')), 'ingen advarsel 15–16');
  // Varighedsknap uden input-hændelse
  await page.fill('#hist-start', '13:30'); await page.fill('#hist-end', '');
  await page.click('#hist-varighed-row .skema-chip[data-min="10"]');
  await page.waitForTimeout(200);
  ok(await page.isVisible('#hist-overlap'), 'varighedsknap udløser advarsel (13:30–13:40 over SRP 13–14)');
  // Retter man en eksisterende post, overlapper den ikke sig selv
  await page.click('#hist-sheet-close'); await page.waitForTimeout(400);
  await page.click('.entry-row[data-id="e4"]');
  await page.waitForSelector('#hist-sheet.open'); await page.waitForTimeout(300);
  ok(!(await page.isVisible('#hist-overlap')), 'e4 overlapper ikke sig selv');
  // Anden dato: hentes for den dato
  await page.click('#hist-sheet-close'); await page.waitForTimeout(400);
  await page.click('#btn-new-entry'); await page.waitForSelector('#hist-sheet.open');
  const imorgen = new Date(); imorgen.setDate(imorgen.getDate() + 1);
  const iso = `${imorgen.getFullYear()}-${String(imorgen.getMonth() + 1).padStart(2, '0')}-${String(imorgen.getDate()).padStart(2, '0')}`;
  await page.fill('#hist-date', iso); await page.fill('#hist-start', '09:00'); await page.fill('#hist-end', '10:00');
  await page.waitForTimeout(300);
  ok(!(await page.isVisible('#hist-overlap')), 'samme klokkeslæt i morgen: ingen advarsel');
  await page.context().close();
}

// ── Punkt 5: «Alle» viser at listen er afskåret og kan udvides ──
{
  const seed = [settings, act('a1', 'SRP')];
  const nu = Date.now();
  for (let i = 0; i < 520; i++) { const s = nu - (i + 1) * 6 * 3600000; seed.push(post('x' + i, 'a1', s, s + 3600000)); }
  const page = await side(browser, { seed });
  await page.waitForTimeout(300);
  await tilHistorik(page);
  await page.selectOption('#hist-period-select', 'alt');
  await page.waitForSelector('#hist-more-btn');
  ok((await page.$$('.entry-row')).length === 500, '500 rækker og: ' + (await page.textContent('.hist-more-txt')));
  await page.selectOption('#hist-period-select', 'uge');
  ok(await page.$('#hist-more-btn') == null, '«Denne uge»: ingen knap (ugen er hentet helt)');
  await page.selectOption('#hist-period-select', 'alt');
  await page.click('#hist-more-btn');
  await page.waitForFunction(() => document.querySelectorAll('.entry-row').length === 520);
  ok(await page.$('#hist-more-btn') == null, 'efter «Vis 500 mere»: alle 520, ingen knap');
  await page.context().close();
}

// ── Kalenderen åbner en post, listen ikke har hentet ──
{
  const seed = [settings, act('a1', 'SRP'), post('gammel', 'a1', idag(8, 0), idag(9, 0))];
  // 505 planlagte poster frem i tiden skubber dagens post ud af listens 500
  for (let i = 0; i < 505; i++) { const s = Date.now() + (i + 2) * 86400000; seed.push(post('f' + i, 'a1', s, s + 3600000)); }
  const page = await side(browser, { seed });
  await page.waitForTimeout(300);
  await tilHistorik(page);
  await page.click('.hist-mode-tab[data-mode="kalender"]');
  await page.waitForSelector('.kal-block[data-id="gammel"]');
  await page.click('.kal-block[data-id="gammel"]');
  await page.waitForSelector('#hist-sheet.open');
  ok((await page.textContent('#hist-sheet-title')) === 'Redigér registrering', 'kalenderen åbner gammel post til redigering');
  ok(await page.inputValue('#hist-start') === '08:00', 'med postens tider');
  await page.fill('#hist-end', '09:30');
  await page.click('#hist-save-btn'); await page.waitForTimeout(300);
  const e = await page.evaluate(() => __fs.entries().filter(x => x.activityId === 'a1' && x.startMs < Date.now() + 86400000));
  ok(e.length === 1 && e[0].durationMinutes === 90, `gem retter posten (${e.length} post, ${e[0]?.durationMinutes} m)`);
  await page.context().close();
}

// ── Bred skærm: intet vandret overløb i listen ──
{
  const page = await side(browser, { seed: [settings, act('a1', '3g Ng'), post('e1', 'a1', idag(8), idag(9)), post('p1', null, idag(9), idag(9, 15), { isBreak: true }), post('e2', 'a1', idag(8, 30), idag(10))] }, 1280);
  await page.waitForTimeout(300);
  await tilHistorik(page);
  await page.selectOption('#hist-period-select', 'dag');
  await page.waitForSelector('.entry-row');
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'intet vandret overløb ved 1280');
  await page.screenshot({ path: DIR + '/liste-bred.png' });
  await page.context().close();
}

await browser.close();
console.log(fejl.length ? '\n' + fejl.length + ' fejl:\n' + fejl.join('\n') : '\nAlt OK');
process.exit(fejl.length ? 1 : 0);
