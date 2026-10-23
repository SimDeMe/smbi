// Korte pauser: alle huller under 30 min lukkes — også poster fra Lectio,
// poster lagt ind i omvendt rækkefølge og poster fra før denne version.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
const HER = fileURLToPath(new URL('.', import.meta.url));
const BASE = 'http://localhost:8777/tid/';
const fejl = [];
const ok = (b, msg) => { console.log((b ? 'OK   ' : 'FEJL ') + msg); if (!b) fejl.push(msg); };

async function side(browser, cfg, w = 390) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => fejl.push('pageerror: ' + e.message));
  page.on('dialog', d => d.accept());
  for (const [frag, fil] of [['firebase-app.js', 'fake-app.js'], ['firebase-auth.js', 'fake-auth.js'], ['firebase-firestore.js', 'fake-fs.js']])
    await page.route('**/' + frag, r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(HER + fil, 'utf8') }));
  await page.route('**/feedback.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('https://fonts.**', r => r.abort());
  await page.addInitScript(c => { window.__fsCfg = c; }, cfg);
  await page.goto(BASE);
  await page.waitForTimeout(400);
  return page;
}
const act = (id, name, extra = {}) => [`users/u1/activities/${id}`, { name, type: 'opgave', color: '#0E86C8', schoolYear: '2026/27', order: 1, isArchived: false, parentId: null, ...extra }];
const settings = (extra = {}) => ['users/u1/settings/config', { currentSchoolYear: '2026/27', ...extra }];
const kl = (h, m = 0, dage = 0) => { const d = new Date(); d.setDate(d.getDate() + dage); d.setHours(h, m, 0, 0); return d.getTime(); };
const post = (id, a, s, e, extra = {}) => [`users/u1/entries/${id}`, { activityId: a, workType: null, startTime: { __ts: s }, endTime: e == null ? null : { __ts: e }, durationMinutes: e == null ? null : Math.round((e - s) / 60000), note: '', isModule: false, autoStopped: false, ...extra }];
const pauser = page => page.evaluate(() => __fs.entries().filter(e => e.isBreak).map(e => [e.startMs, e.endMs]).sort((a, b) => a[0] - b[0]));
const kørIgen = page => page.evaluate(() => import('/tid/pauser.js').then(m => m.lukSkoleaaretsPauser('u1')));
const somTekst = l => l.map(([a, b]) => `${new Date(a).toTimeString().slice(0, 5)}–${new Date(b).toTimeString().slice(0, 5)}`).join(', ');

// En dag som fra Lectio: ingen pauser gemt. I går og i dag.
const dag = (d = 0, p = '') => [
  post(p + 'l1', 'a1', kl(8, 0, d), kl(9, 35, d), { lectioEventId: 'x1' + p }),
  post(p + 'l2', 'a1', kl(9, 50, d), kl(11, 25, d), { lectioEventId: 'x2' + p }),   // 15 min
  post(p + 'l3', 'a1', kl(12, 0, d), kl(13, 0, d)),                                // 35 min: tom tid
  post(p + 'l4', 'a1', kl(13, 10, d), kl(14, 0, d)),                               // 10 min
];

const browser = await chromium.launch();

// ── Opstart lukker gamle huller i hele skoleåret ──
{
  const page = await side(browser, { seed: [settings(), act('a1', '3g Ng'), ...dag(0), ...dag(-1, 'g')] });
  const p = await pauser(page);
  ok(somTekst(p) === '09:35–09:50, 13:00–13:10, 09:35–09:50, 13:00–13:10', 'to pauser pr. dag, i går og i dag: ' + somTekst(p));
  ok(p.length === 4 && !p.some(([a]) => a === kl(11, 25)), 'hullet på 35 min står tomt');

  // Rapporten for i dag har pauserne med
  await page.click('.nav-btn[data-view="rapporter"]');
  await page.click('.rapport-tab[data-period="dag"]');
  await page.waitForTimeout(300);
  const t = (await page.textContent('#rapport-content')).replace(/\s+/g, ' ');
  ok(/Pauser 25m/.test(t), 'rapporten i dag: Pauser 25m');

  // En ny kørsel (næste opstart, en anden enhed) laver ingen dubletter
  await kørIgen(page);
  ok((await pauser(page)).length === 4, 'ny kørsel: stadig fire pauser');
  await page.context().close();
}

// ── Slået fra, og igangværende timer ──
{
  const page = await side(browser, { seed: [settings({ autoShortBreaks: false }), act('a1', 'SRP'), ...dag(0)] });
  ok((await pauser(page)).length === 0, 'slået fra: ingen pauser');
  await page.context().close();

  const p2 = await side(browser, { seed: [settings(), act('a1', 'SRP'),
    post('t', 'a1', kl(8, 0), null),                 // timer i gang siden 8
    post('k', 'a1', kl(8, 30), kl(9, 0))] });        // inden i den løbende tid
  ok((await pauser(p2)).length === 0, 'igangværende timer dækker tiden efter sin start');
  await p2.context().close();
}

// ── Omvendt rækkefølge i Historik: hullet efter den nye post lukkes også ──
{
  const page = await side(browser, { seed: [settings(), act('a1', 'SRP'), post('sen', 'a1', kl(10, 0), kl(11, 0))] });
  await page.click('.nav-btn[data-view="historik"]');
  await page.waitForSelector('#view-historik:not(.hidden)');
  await page.click('#btn-new-entry'); await page.waitForSelector('#hist-sheet.open');
  await page.fill('#hist-start', '08:30'); await page.fill('#hist-end', '09:40');
  await page.selectOption('#hist-act-sel', 'a1');
  await page.click('#hist-save-btn'); await page.waitForTimeout(400);
  ok(somTekst(await pauser(page)) === '09:40–10:00', 'pausen efter den nye post: ' + somTekst(await pauser(page)));
  await page.context().close();
}

// ── Slettet pause kommer ikke igen ──
{
  const page = await side(browser, { seed: [settings(), act('a1', 'SRP'),
    post('a', 'a1', kl(8, 0), kl(9, 0)), post('b', 'a1', kl(9, 20), kl(10, 0))] });
  ok(somTekst(await pauser(page)) === '09:00–09:20', 'opstart lukker hullet');
  const id = await page.evaluate(() => __fs.entries().find(e => e.isBreak).id);
  await page.click('.nav-btn[data-view="historik"]');
  await page.waitForSelector('#view-historik:not(.hidden)');
  await page.click('.hist-mode-tab[data-mode="liste"]');
  await page.selectOption('#hist-period-select', 'dag');
  await page.click(`.entry-pause-line[data-id="${id}"]`);
  await page.waitForSelector('#hist-sheet.open');
  await page.click('#hist-delete-btn'); await page.waitForTimeout(400);
  ok((await pauser(page)).length === 0, 'pausen er slettet');
  const afvist = await page.evaluate(() => __fs.store.get('users/u1/settings/config').afvisteHuller);
  ok(afvist && afvist[String(kl(9, 0))] === kl(9, 20), 'hullet er husket som afvist');

  await kørIgen(page);
  ok((await pauser(page)).length === 0, 'ny kørsel: pausen kommer ikke igen');

  // Slettes posten før hullet, glemmes afvisningen
  await page.click('.entry-row[data-id="a"]'); await page.waitForSelector('#hist-sheet.open'); await page.waitForTimeout(200);
  await page.click('#hist-delete-btn'); await page.waitForTimeout(400);
  const efter = await page.evaluate(() => __fs.store.get('users/u1/settings/config').afvisteHuller);
  ok(Object.keys(efter || {}).length === 0, 'slettet nabopost: afvisningen er glemt');
  await page.context().close();
}

// ── Dagen ryddes og tastes ind igen: pauserne kommer igen ──
// Både når pausen slettes før og efter posterne omkring den
for (const pauseFoerst of [true, false]) {
  const page = await side(browser, { seed: [settings(), act('a1', 'SRP'),
    post('m1', 'a1', kl(8, 0), kl(9, 35)), post('m2', 'a1', kl(9, 50), kl(11, 25))] });
  ok((await pauser(page)).length === 1, 'opstart: én pause');
  await page.click('.nav-btn[data-view="historik"]');
  await page.waitForSelector('#view-historik:not(.hidden)');
  await page.click('.hist-mode-tab[data-mode="liste"]');
  await page.selectOption('#hist-period-select', 'dag'); await page.waitForTimeout(200);
  const raekkefoelge = pauseFoerst ? ['.entry-pause-line', '.entry-row', '.entry-row'] : ['.entry-row', '.entry-pause-line', '.entry-row'];
  for (const sel of raekkefoelge) {
    await page.click(sel); await page.waitForSelector('#hist-sheet.open'); await page.waitForTimeout(200);
    await page.click('#hist-delete-btn'); await page.waitForTimeout(400);
  }
  ok(await page.evaluate(() => __fs.entries().length) === 0, 'dagen er ryddet');
  for (const [s, e] of [['08:00', '09:35'], ['09:50', '11:25']]) {
    await page.click('#btn-new-entry'); await page.waitForSelector('#hist-sheet.open');
    await page.fill('#hist-start', s); await page.fill('#hist-end', e);
    await page.selectOption('#hist-act-sel', 'a1');
    await page.click('#hist-save-btn'); await page.waitForTimeout(400);
  }
  ok(somTekst(await pauser(page)) === '09:35–09:50', `genindtastet (pausen slettet ${pauseFoerst ? 'først' : 'i midten'}): pausen er der igen`);
  await page.context().close();
}

// ── Knappen «Registrér pauser» i dagsrapporten ──
// Lukker også afviste huller og virker, selv om de automatiske er slået fra
for (const w of [390, 1280]) {
  const page = await side(browser, { seed: [settings({ autoShortBreaks: false, afvisteHuller: { [kl(9, 35)]: kl(9, 50) } }),
    act('a1', 'SRP'), ...dag(0)] }, w);
  ok((await pauser(page)).length === 0, `${w} px: slået fra, ingen pauser ved opstart`);
  await page.click('.nav-btn[data-view="rapporter"]');
  ok(await page.$('#rapport-registrer-pauser') == null, 'knappen står ikke i skoleårsrapporten');
  await page.click('.rapport-tab[data-period="dag"]'); await page.waitForTimeout(200);
  const knap = page.getByRole('button', { name: 'Registrér pauser' });
  ok(await knap.isVisible(), 'knappen står i dagsrapporten');
  await knap.click(); await page.waitForTimeout(400);
  ok(somTekst(await pauser(page)) === '09:35–09:50, 13:00–13:10', 'knappen registrerer begge pauser, også den afviste: ' + somTekst(await pauser(page)));
  ok((await page.textContent('#toast')).includes('2 pauser registreret'), 'besked: ' + await page.textContent('#toast'));
  ok(/Pauser 25m/.test((await page.textContent('#rapport-content')).replace(/\s+/g, ' ')), 'rapporten viser pauserne med det samme');
  const afvist = await page.evaluate(() => __fs.store.get('users/u1/settings/config').afvisteHuller);
  ok(Object.keys(afvist || {}).length === 0, 'dagens afvisning er glemt');
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'ingen vandret rulning');
  await page.locator('.rapport-pauser').scrollIntoViewIfNeeded();
  await page.screenshot({ path: HER + `ud/rapport-pauser-${w}.png` });

  // Igen: intet nyt, ingen dubletter, og knappen kan bruges med tastaturet
  await page.focus('#rapport-registrer-pauser'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  ok((await pauser(page)).length === 2, 'andet tryk laver ingen dubletter');
  ok((await page.textContent('#toast')).includes('Ingen huller under 30 min'), 'besked: ' + await page.textContent('#toast'));

  // En dag uden registreringer har ingen knap
  await page.click('#rapport-prev'); await page.click('#rapport-prev'); await page.waitForTimeout(200);
  ok(await page.$('#rapport-registrer-pauser') == null, 'tom dag: ingen knap');
  await page.context().close();
}

await browser.close();
if (fejl.length) { console.log(`\n${fejl.length} fejl`); process.exit(1); }
