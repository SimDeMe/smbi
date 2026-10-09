import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
const HER = fileURLToPath(new URL('.', import.meta.url));   // tid/test/
const DIR = HER + 'ud';                                       // skærmbilleder
fs.mkdirSync(DIR, { recursive: true });
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
  // Fredag 2. oktober 2026 kl. 10, som i ferie.mjs
  await page.clock.setFixedTime(new Date(2026, 9, 2, 10, 0));
  await page.goto(BASE);
  return page;
}
const act = (id, name, extra = {}) => [`users/u1/activities/${id}`, { name, type: 'opgave', color: '#0E86C8', schoolYear: '2026/27', order: 1, isArchived: false, parentId: null, ...extra }];
const settings = ['users/u1/settings/config', { currentSchoolYear: '2026/27' }];
const post = (id, a, s, min) => [`users/u1/entries/${id}`, { activityId: a, workType: null, startTime: { __ts: s }, endTime: { __ts: s + min * 60000 }, durationMinutes: min, note: '', isModule: false, autoStopped: false }];
const tilRapport = async page => { await page.click('.nav-btn[data-view="rapporter"]'); await page.waitForTimeout(500); };
const kurve = (page, n) => page.$$eval('.udv-kort[data-udv]', (k, n) => JSON.parse(k[n].dataset.udv).data, n);

const browser = await chromium.launch();

// Tre timer hver hverdag fra 10. august, på en løbende opgave og en, der
// blev afsluttet 14. september
{
  const seed = [settings,
    act('a1', 'Hold-arbejde', { budgetHours: 800 }),
    act('a2', 'Studietur', { budgetHours: 40, optjening: 'afslutning', isArchived: true, archivedAt: { __ts: new Date(2026, 8, 14, 12).getTime() } })];
  let n = 0;
  for (let d = new Date(2026, 7, 10); d < new Date(2026, 9, 2); d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const s = new Date(d); s.setHours(8);
    seed.push(post('e' + n++, d < new Date(2026, 8, 14) && d.getDay() === 5 ? 'a2' : 'a1', s.getTime(), 180));
  }
  const page = await side(browser, { seed });
  await tilRapport(page);

  const kort = await page.$$('.udv-kort');
  ok(kort.length === 3, 'tre grafer under skoleåret: ' + kort.length);
  const titler = await page.$$eval('.udv-titel', e => e.map(x => x.textContent));
  ok(titler.join() === 'Belastning og arbejde,Arbejdet mod belastning,Leveret mod optjent', 'titlerne: ' + titler.join());

  // Ugerne: tre timer hver hverdag er 15 t om ugen; hele normperioden er med
  const uger = await page.$eval('.udv-uger', k => JSON.parse(k.dataset.uger).data);
  const uge = t => uger.find(w => w[0] === t);
  ok(uge(new Date(2026, 8, 7).getTime())?.[2] === 15 * 60, 'arbejdet i ugen fra 7. sep.: ' + uge(new Date(2026, 8, 7).getTime())?.[2] / 60 + ' t');
  ok(uger[0][0] === new Date(2026, 5, 1).getTime() && uger.at(-1)[1] === new Date(2027, 5, 1).getTime(), 'ugerne dækker normperioden');
  ok(uge(new Date(2026, 10, 2).getTime())?.[2] === null && uge(new Date(2026, 10, 2).getTime())?.[3] > 0, 'uger frem i tiden: intet arbejdet, men belastning');
  ok(uge(new Date(2026, 6, 13).getTime())?.[3] === 0 && uge(new Date(2026, 6, 13).getTime())?.[4] === 0, 'sommerferien: hverken belastning eller norm');
  // Summen af ugernes belastning er normen
  const sumBel = uger.reduce((s, w) => s + w[3], 0) / 60;
  ok(Math.abs(sumBel - 1690) <= 2, 'ugernes belastning giver normen: ' + Math.round(sumBel));

  // Sidste punkt i forskelskurven er chippens tal
  const chip = (await page.textContent('.rapport-summary .forecast-chip')).trim();
  const chipT = Number(chip.match(/(\d+)t/)[1]) * (chip.includes('overskud') ? -1 : 1);
  const skema = await kurve(page, 0);
  ok(Math.round(skema.at(-1)[1] / 60) === chipT, `forskelskurven ender i chippens tal: ${Math.round(skema.at(-1)[1] / 60)} / ${chip}`);
  ok(skema[0][0] === new Date(2026, 5, 1).getTime() && skema[0][1] === 0, 'kurven begynder i 0 ved normperiodens start');
  ok(skema.length >= 18 && skema.length <= 20, 'et punkt om ugen: ' + skema.length);
  // Hele juni og juli uden registreringer: bagud — men ikke i sommerferien
  const v = t => skema.find(p => p[0] === t)?.[1];
  const ferieStart = new Date(2026, 6, 6).getTime(), ferieSlut = new Date(2026, 6, 27).getTime();
  ok(v(ferieStart) === v(ferieSlut), 'kurven står stille i sommerferien: ' + v(ferieStart) / 60 + ' / ' + v(ferieSlut) / 60);

  // Akkordkurven ender i saldoen
  const saldo = (await page.textContent('.akkord-saldo-tal')).trim();
  const akkord = await kurve(page, 1);
  const m = saldo.match(/([+−])(?:(\d+)t)?\s*(?:(\d+)m)?/);
  const saldoM = (m[1] === '−' ? -1 : 1) * ((+m[2] || 0) * 60 + (+m[3] || 0));
  ok(Math.abs(akkord.at(-1)[1] - saldoM) <= 1, `akkordkurven ender i saldoen: ${akkord.at(-1)[1]}m / ${saldo}`);
  // Fortegnet forklares med samme ord i sammendraget og i grafen
  const sub = await page.textContent('.akkord-saldo-sub');
  ok(sub.includes(akkord.at(-1)[1] >= 0 ? 'optjent mere end brugt' : 'brugt mere end optjent'), 'saldoens fortegn forklaret: ' + sub);
  ok((await page.$$eval('.udv-nu', e => e[2].textContent)).includes(akkord.at(-1)[1] >= 0 ? 'optjent mere end brugt' : 'brugt mere end optjent'), 'samme ord i grafens overskrift');
  const under = await page.$$eval('.udv-under', e => e[2].textContent);
  ok(under.includes('Over nul') && under.includes('Under nul: du har brugt mere tid, end du har optjent'), 'undertitlen forklarer begge fortegn');

  // Studieturen (ved afslutning) har optjent sine 15 brugte timer undervejs og
  // optjener resten af de 40 t, da den afsluttes 14. september
  const a = t => akkord.find(p => p[0] === t)?.[1];
  const foer = a(new Date(2026, 8, 14).getTime()), efter = a(new Date(2026, 8, 21).getTime());
  const spring = (efter - foer) / 60;
  ok(spring > 20 && spring < 32, `springet ved afslutningen (≈ de 25 t, der er tilbage): ${Math.round(spring)} t`);

  // Hover viser datoen og tallet
  const svg = await page.$('.udv-kort[data-udv] svg');
  await svg.scrollIntoViewIfNeeded();
  const bx = await svg.boundingBox();
  await page.mouse.move(bx.x + bx.width * 0.3, bx.y + bx.height / 2);
  const tip = (await page.textContent('.udv-kort[data-udv] .udv-tip')).trim();
  const tipInde = await page.evaluate(() => { const t = document.querySelector('.udv-kort[data-udv] .udv-tip').getBoundingClientRect(), k = document.querySelector('.udv-kort[data-udv]').getBoundingClientRect(); return t.left >= k.left && t.right <= k.right; });
  ok(/\d+\. \w+.*t (merarbejde|overskud)/.test(tip) && tipInde, 'hover viser dato og tal: ' + tip);

  // Hover på ugegrafen viser ugen
  const svgU = await page.$('.udv-uger svg');
  await svgU.scrollIntoViewIfNeeded();
  const bu = await svgU.boundingBox();
  await page.mouse.move(bu.x + bu.width * 0.5, bu.y + bu.height / 2);
  const tipU = (await page.textContent('.udv-uger .udv-tip')).trim();
  ok(/^Uge \d+.*belastning \d+ t · norm \d+ t$/.test(tipU), 'hover på ugegrafen viser ugens tal: ' + tipU);

  ok((await page.$$eval('.udv-kort[data-udv]', k => k[0].querySelectorAll('tbody tr').length)) === skema.length, 'tabellen har en række pr. punkt');
  ok((await page.$$eval('.udv-uger tbody tr', r => r.length)) === uger.length, 'ugetabellen har en række pr. uge');
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'intet vandret overløb ved 390');
  await page.locator('.udv-sektion').screenshot({ path: DIR + '/udvikling.png' });

  // Ikke i ugen
  await page.click('.rapport-tab[data-period="uge"]'); await page.waitForTimeout(300);
  ok((await page.$$('.udv-kort')).length === 0, 'ingen grafer i ugevisningen');
  await page.context().close();
}

// Uden budgetter: ingen akkordkurve
{
  const s = new Date(2026, 8, 7, 8).getTime();
  const page = await side(browser, { seed: [settings, act('a1', 'Diverse'), post('e1', 'a1', s, 120)] });
  await tilRapport(page);
  const titler = await page.$$eval('.udv-titel', e => e.map(x => x.textContent));
  ok(titler.join() === 'Belastning og arbejde,Arbejdet mod belastning', 'uden budgetter ingen akkordkurve: ' + titler.join());
  await page.context().close();
}

await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
