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

async function side(browser, cfg, w = 390, h = 844) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', locale: 'da-DK' });
  const page = await ctx.newPage();
  // Det frosne ur standser CSS-overgangene — uden dem viser skærmbilledet den rigtige fane
  await page.emulateMedia({ reducedMotion: 'reduce' });
  page.on('pageerror', e => fejl.push('pageerror: ' + e.message));
  for (const [frag, fil] of [['firebase-app.js', 'fake-app.js'], ['firebase-auth.js', 'fake-auth.js'], ['firebase-firestore.js', 'fake-fs.js']])
    await page.route('**/' + frag, r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(HER + fil, 'utf8') }));
  await page.route('**/feedback.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('https://fonts.**', r => r.abort());
  await page.addInitScript(c => { window.__fsCfg = c; }, cfg);
  // Fredag 2. oktober 2026 kl. 14 — uge 40
  await page.clock.setFixedTime(new Date(2026, 9, 2, 14, 0));
  await page.goto(BASE);
  return page;
}
const act = (id, name, extra = {}) => [`users/u1/activities/${id}`, { name, type: 'opgave', color: '#0E86C8', schoolYear: '2026/27', order: 1, isArchived: false, parentId: null, ...extra }];
const settings = ['users/u1/settings/config', { currentSchoolYear: '2026/27' }];
const dato = (d, h, m = 0, md = 8) => new Date(2026, md, d, h, m).getTime();   // september
const post = (id, a, s, e, extra = {}) => [`users/u1/entries/${id}`, { activityId: a, workType: null, startTime: { __ts: s }, endTime: e == null ? null : { __ts: e }, durationMinutes: e == null ? null : Math.round((e - s) / 60000), note: '', isModule: false, autoStopped: false, ...extra }];

const seed = [settings, act('a1', 'SRP'), act('a2', 'Retning'),
  // Mandag 28/9: modul, pause, modul, et hul på 45 min, tre timer
  post('m1', 'a1', dato(28, 8), dato(28, 9, 35)),
  post('m2', null, dato(28, 9, 35), dato(28, 9, 40), { isBreak: true }),
  post('m3', 'a2', dato(28, 9, 40), dato(28, 11, 15)),
  post('m4', null, dato(28, 12), dato(28, 15)),
  // Tirsdag 29/9: ét modul — start med sekunder
  post('t1', 'a1', dato(29, 8, 10) + 30000, dato(29, 9, 45) + 30000),
  // Onsdag 30/9: to poster, der overlapper en time
  post('o1', 'a1', dato(30, 8), dato(30, 10)),
  post('o2', 'a2', dato(30, 9), dato(30, 10)),
  // Lørdag 26/9 i ugen før
  post('l1', 'a2', dato(26, 10), dato(26, 12)),
  // I gang lige nu — tæller ikke med endnu
  post('nu', 'a1', new Date(2026, 9, 2, 13).getTime(), null)];

const browser = await chromium.launch();
for (const w of [390, 1280]) {
  const page = await side(browser, { seed }, w);
  await page.waitForTimeout(400);
  await page.click('.nav-btn[data-view="rapporter"]');
  await page.click('.rapport-tab[data-period="lectio"]'); await page.waitForSelector('.lectio-uge');
  const uger = await page.$$eval('.lectio-uge', l => l.map(u => ({
    nr: u.querySelector('.lectio-uge-nr').textContent, sum: u.querySelector('.lectio-uge-sum').textContent,
    raekker: [...u.querySelectorAll('tbody tr')].map(r => r.textContent.replace(/\s+/g, ' ').trim()) })));
  const [u40, u39] = uger;
  if (w === 390) {
    ok(await page.$eval('.rapport-tab-active', b => b.dataset.period) === 'lectio', 'fanen Lectio er valgt');
    ok(u40.nr === 'Uge 40' && u39.nr === 'Uge 39', 'nyeste uge øverst: ' + uger.slice(0, 3).map(u => u.nr));
    ok(uger.length > 10 && !uger.some(u => u.nr === 'Uge 41'), 'ugerne går tilbage til skoleårets start, ikke frem: ' + uger.at(-1).nr + '–' + uger[0].nr);
    console.log('  ' + u40.raekker.join(' | '));
    ok(u40.raekker[0] === 'man 28/9 08:00 14:15 6t 15m', 'mandag: fra 08:00 til 08:00 + 6t 15m: ' + u40.raekker[0]);
    ok(u40.raekker[1].includes('15:00') && u40.raekker[1].includes('45m uden registrering'), 'mandagens hul står med småt: ' + u40.raekker[1]);
    ok(u40.raekker[2] === 'tir 29/9 08:10 09:45 1t 35m', 'tirsdag: sekunderne skæres væk, længden holder: ' + u40.raekker[2]);
    ok(!u40.raekker[3].startsWith('Sidste'), 'tirsdag har ingen note — sekunderne giver ikke et hul');
    ok(u40.raekker[3] === 'ons 30/9 08:00 11:00 3t', 'onsdag: overlap tæller dobbelt, som i rapporten: ' + u40.raekker[3]);
    ok(u40.raekker[4].includes('1t overlap'), 'overlappet står med småt: ' + u40.raekker[4]);
    ok(u40.raekker.some(r => /^tor 1\/10 ?–$/.test(r)) && u40.raekker.some(r => /^fre 2\/10 ?–$/.test(r)), 'dage uden tid og en igangværende post: –');
    ok(!u40.raekker.some(r => r.startsWith('lør') || r.startsWith('søn')), 'en weekend uden tid er udeladt');
    ok(u40.sum === '10t 50m', 'ugens sum: ' + u40.sum);
    ok(u39.raekker.some(r => r === 'lør 26/9 10:00 12:00 2t'), 'en lørdag med tid står med: ' + u39.raekker.at(-1));
    // Tilbage til regnskabet
    await page.click('.rapport-tab[data-period="skolear"]'); await page.waitForTimeout(200);
    ok(!(await page.$('.lectio')) && await page.$eval('.rapport-tab-active', b => b.dataset.period) === 'skolear', 'Skoleår viser regnskabet igen');
    await page.click('.rapport-tab[data-period="lectio"]'); await page.waitForSelector('.lectio-uge');
  }
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${w} px: intet vandret overløb`);
  ok(await page.$eval('.rapport-tab[data-period="lectio"]', x => getComputedStyle(x).backgroundColor) === 'rgb(213, 238, 233)', `${w} px: Lectio-fanen er farvet som valgt`);
  await page.screenshot({ path: `${DIR}/lectio-${w}.png`, clip: { x: 0, y: 0, width: w, height: 800 } });
  await page.context().close();
}

await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
