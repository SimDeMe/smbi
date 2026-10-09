import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
const HER = fileURLToPath(new URL('.', import.meta.url));   // tid/test/
const DIR = HER + 'ud';                                       // skærmbilleder
fs.mkdirSync(DIR, { recursive: true });
const BASE = 'http://localhost:8777/tid/';
const fejl = [];
const ok = (b, msg) => { console.log((b ? 'OK   ' : 'FEJL ') + msg); if (!b) fejl.push(msg); };

// Skolens faste perioder på hold og opgaver: foran/bagud og løbende optjening
// regner med, at budgettet bruges i perioden, og en opgave «ved afslutning»
// optjener den tid, der er brugt. Fast dato: fredag 2. okt. 2026 kl. 10.
async function side(browser, cfg, w = 390) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, serviceWorkers: 'block', locale: 'da-DK' });
  const page = await ctx.newPage();
  page.on('pageerror', e => fejl.push('pageerror: ' + e.message));
  page.on('dialog', d => d.accept());
  for (const [frag, fil] of [['firebase-app.js', 'fake-app.js'], ['firebase-auth.js', 'fake-auth.js'], ['firebase-firestore.js', 'fake-fs.js']])
    await page.route('**/' + frag, r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(HER + fil, 'utf8') }));
  await page.route('**/feedback.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('https://fonts.**', r => r.abort());
  await page.addInitScript(c => { window.__fsCfg = c; }, cfg);
  await page.clock.setFixedTime(new Date(2026, 9, 2, 10, 0));
  await page.goto(BASE);
  await page.waitForTimeout(400);
  return page;
}
const act = (id, name, extra = {}) => [`users/u1/activities/${id}`, { name, type: 'opgave', color: '#0E86C8', schoolYear: '2026/27', order: 1, isArchived: false, parentId: null, ...extra }];
const settings = ['users/u1/settings/config', { currentSchoolYear: '2026/27', fordelFaellesTid: false }];
const aktiviteter = page => page.evaluate(() => Object.fromEntries([...window.__fs.store.entries()]
  .filter(([p]) => p.includes('/activities/')).map(([, d]) => [d.name, d])));
const tilRapport = async page => {
  await page.click('.nav-btn[data-view="rapporter"]'); await page.waitForTimeout(400);
};
const chip = async page => {
  await tilRapport(page);
  const t = (await page.textContent('.rapport-summary .forecast-chip')).trim();
  return Number(t.match(/(\d+)t/)[1]) * (t.includes('bagud') ? -1 : 1);
};

// Arbejdsdage (hverdage uden helligdage og lærernes ferie) i [fra, til)
const hverdage = (fra, til) => { let n = 0; for (let d = new Date(fra); d < til; d.setDate(d.getDate() + 1)) if (d.getDay() % 6) n++; return n; };
const NU = new Date(2026, 9, 2, 10);
// Grundforløbet 10. aug.–30. okt. 2026 (ingen lærerferie eller helligdage i det)
const pGrund = (hverdage(new Date(2026, 7, 10), new Date(2026, 9, 2)) + 10 / 24) / hverdage(new Date(2026, 7, 10), new Date(2026, 9, 31));
const pAar   = 73.4 / 229;                    // skoleåret med skolens ferieplan
const browser = await chromium.launch();
const timer = l => { const m = l.match(/Optjent (\d+)t(?: (\d+)m)?|Optjent (\d+)m/); return !m ? NaN : m[3] ? Number(m[3]) : Number(m[1]) * 60 + Number(m[2] || 0); };

// ── Foran/bagud: grundforløb, efter grundforløb og eksamen ──
{
  const n0 = await (async () => {
    const p = await side(browser, { seed: [settings, act('a1', 'Hold', { type: 'hold', budgetHours: 300 })] });
    const n = await chip(p); await p.context().close(); return n;
  })();
  ok(n0 >= -546 && n0 <= -539, 'hele skoleåret: bagud som før: ' + n0);

  const med = await side(browser, { seed: [settings, act('a1', 'Grundforløb', { type: 'hold', budgetHours: 300, periode: 'grundforloeb' })] });
  const n1 = await chip(med);
  const forv = Math.round(300 * (pGrund - pAar));
  ok(Math.abs((n0 - n1) - forv) <= 1, `grundforløb: ${forv} t mere bagud (${n0} → ${n1})`);
  const sidst = await med.$eval('.udv-kort', k => JSON.parse(k.dataset.udv).data.at(-1)[1]);
  ok(Math.round(sidst / 60) === n1, `skemakurven ender i chippens tal: ${Math.round(sidst / 60)} / ${n1}`);
  await med.context().close();

  const sr = await side(browser, { seed: [settings, act('a1', '2g Bi', { type: 'hold', budgetHours: 300, periode: 'efterGf' })] });
  const n2 = await chip(sr);
  ok(Math.abs((n2 - n0) - Math.round(300 * pAar)) <= 1, `efter grundforløb: ${Math.round(300 * pAar)} t mindre bagud (${n0} → ${n2})`);
  await sr.context().close();

  // Eksamensperioden er juni 2026 — i starten af normperioden, så den er gået
  const eks = await side(browser, { seed: [settings, act('a1', 'Eksamen', { budgetHours: 100, optjening: 'afslutning', periode: 'eksamen' })] });
  const n3 = await chip(eks);
  ok(Math.abs((n0 - n3) - Math.round(100 * (1 - pAar))) <= 1, `eksamen (juni, overstået): ${Math.round(100 * (1 - pAar))} t mere bagud (${n0} → ${n3})`);
  await eks.context().close();
}

// ── Optjening ──
{
  const t = (h, m = 0) => new Date(2026, 8, 15, h, m).getTime();
  const post = (id, a, s, e) => [`users/u1/entries/${id}`, { activityId: a, workType: null, startTime: { __ts: s }, endTime: { __ts: e }, durationMinutes: Math.round((e - s) / 60000), note: '', isModule: false, autoStopped: false }];
  const page = await side(browser, { seed: [settings,
    act('a1', 'Udvalg', { budgetHours: 90, optjening: 'loebende', periode: 'grundforloeb' }),
    act('a4', 'Under', { budgetHours: 10, parentId: 'a1', order: 4 }),
    act('a2', 'Hold uden norm', { type: 'hold', budgetHours: 100, periode: 'grundforloeb', order: 2 }),
    act('a3', 'Teamledelse', { budgetHours: 100, optjening: 'loebende', order: 3 }),
    act('a5', 'NV-eksamen', { budgetHours: 15, optjening: 'afslutning', order: 5 }),
    post('e1', 'a5', t(14), t(15)),
  ] }, 1280);
  await tilRapport(page);
  const linjer = await page.$$eval('.rapport-akkord', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  const udvalg = linjer.find(l => l.startsWith('Løbende · Grundforløb')) || '';
  ok(Math.abs(timer(udvalg) - Math.round(90 * 60 * pGrund)) <= 1, `udvalg (80 t + under-opgavens 10 t) optjener over grundforløbet: ${udvalg}`);
  const hold = linjer.find(l => l.includes('uden normgrundlag')) || '';
  ok(hold.includes('Grundforløb') && Math.abs(timer(hold) - Math.round(100 * 60 * pGrund)) <= 1, 'hold uden normgrundlag optjener i perioden: ' + hold);
  const team = linjer.find(l => l.startsWith('Løbende Optjent')) || '';
  ok(Math.abs(timer(team) - Math.round(100 * 60 * pAar)) <= 30, 'hele skoleåret som før: ' + team);
  const nv = linjer.find(l => l.startsWith('Ved afslutning')) || '';
  ok(timer(nv) === 60 && nv.includes('± 0m'), 'ved afslutning: den brugte time er optjent, saldo 0: ' + nv);
  await page.screenshot({ path: DIR + '/periode-rapport.png', fullPage: true });
  await page.context().close();

  // Afsluttet: resten af budgettet optjenes
  const afs = await side(browser, { seed: [settings,
    act('a5', 'NV-eksamen', { budgetHours: 15, optjening: 'afslutning', isArchived: true, archivedAt: { __ts: t(16) } }),
    post('e1', 'a5', t(14), t(15)),
  ] }, 1280);
  await tilRapport(afs);
  const txt = (await afs.textContent('.rapport-summary')).replace(/\s+/g, ' ');
  ok(/Optjent\s*15t/.test(txt), 'afsluttet: alle 15 t optjent');
  await afs.context().close();
}

// ── Formularen ──
{
  const page = await side(browser, { seed: [settings, act('a0', 'Eksamen og prøver', { periode: 'eksamen' })] });
  await page.click('.nav-btn[data-view="aktiviteter"]'); await page.waitForTimeout(300);
  ok((await page.textContent('.act-row-periode')).trim() === 'Eksamensperiode', 'listen viser perioden');
  await page.click('#btn-new-activity'); await page.waitForSelector('#act-sheet.open');
  await page.fill('#act-name', '1g Ng');
  await page.click('.seg-opt:has(input[name="act-type"][value="hold"])');
  ok(await page.isChecked('input[name="act-periode"][value="aar"]'), 'ny aktivitet: hele skoleåret');
  await page.click('.seg-opt:has(input[name="act-periode"][value="grundforloeb"])');
  const hint = (await page.textContent('#act-periode-hint')).trim();
  ok(hint.startsWith('Grundforløb: 10. aug – 30. okt 2026 ·') && /\d+ arbejdsdage/.test(hint), 'datoerne står under valget: ' + hint);
  await page.fill('#act-budget', '60');
  await page.screenshot({ path: DIR + '/periode-form.png' });
  await page.click('#act-save-btn'); await page.waitForTimeout(400);
  ok((await aktiviteter(page))['1g Ng']?.periode === 'grundforloeb', 'perioden gemmes');

  // Under-opgave følger forælderen, men kan vælge hele året
  await page.click('#btn-new-activity'); await page.waitForSelector('#act-sheet.open');
  await page.fill('#act-name', 'NV');
  await page.selectOption('#act-parent', 'a0');
  ok(await page.isChecked('input[name="act-periode"][value="eksamen"]'), 'vælges en forælder, følger perioden med');
  await page.click('#act-save-btn'); await page.waitForTimeout(400);
  ok((await aktiviteter(page))['NV']?.periode == null, 'under-opgaven gemmes uden egen periode og følger forælderen');
  // Vælger den selv hele skoleåret, skal det stå
  await page.click('.act-row:has-text("NV")'); await page.waitForSelector('#act-sheet.open');
  ok(await page.isChecked('input[name="act-periode"][value="eksamen"]'), 'formularen viser den arvede periode');
  await page.click('.seg-opt:has(input[name="act-periode"][value="aar"])');
  await page.click('#act-save-btn'); await page.waitForTimeout(400);
  ok((await aktiviteter(page))['NV']?.periode === 'aar', 'under-opgave med hele skoleåret under en eksamensopgave gemmes som «aar»');
  await page.context().close();
}

// ── Indstillinger ──
{
  const page = await side(browser, { seed: [settings, act('a0', 'Findes i forvejen')] });
  await page.click('.nav-btn[data-view="indstillinger"]'); await page.waitForTimeout(300);
  ok(await page.inputValue('#cfg-gfslut') === '2026-10-30', 'skolens dato for grundforløbets slutning står der');
  ok(await page.inputValue('#cfg-eksamenfra') === '2026-06-01' && await page.inputValue('#cfg-eksamentil') === '2026-06-24', 'eksamensperioden 1.–24. juni 2026');
  const sum = await page.$$eval('#cfg-periode-sum li', l => l.map(x => x.textContent));
  ok(sum.length === 4 && sum[1].startsWith('Grundforløb · 10. aug – 30. okt 2026'), 'perioderne listes: ' + sum[1]);
  await page.fill('#cfg-gfslut', '2026-11-06');
  ok((await page.textContent('#cfg-periode-sum')).includes('6. nov'), 'listen følger med, når datoen rettes');
  await page.click('#cfg-save-btn'); await page.waitForTimeout(400);
  const gemt = await page.evaluate(() => window.__fs.store.get('users/u1/settings/config').periodeDatoer);
  ok(gemt?.['2026/27']?.gfSlut === '2026-11-06', 'den rettede dato gemmes: ' + JSON.stringify(gemt));
  await page.locator('.settings-section:has(#cfg-periode-sum)').screenshot({ path: DIR + '/periode-indstillinger.png' });
  await page.context().close();
}

// ── Import og kopi til næste år ──
{
  const page = await side(browser, { seed: [settings, act('a0', 'Findes i forvejen')] });
  await page.click('.nav-btn[data-view="aktiviteter"]'); await page.waitForTimeout(300);
  await page.click('#btn-import-text'); await page.waitForSelector('#import-sheet.open');
  await page.fill('#import-year', '2026/27');
  await page.fill('#import-text', [
    '1g grundforløb; hold; 60; ; ; grundforløb',
    '2g Bi; hold; 120; ; ; Efter grundforløb',
    'NV-eksamen; opgave; 15; ; afslutning; eksamen',
    'Vejledning; opgave; 40',
  ].join('\n'));
  await page.click('#btn-do-import'); await page.waitForTimeout(500);
  const akt = await aktiviteter(page);
  ok(akt['1g grundforløb']?.periode === 'grundforloeb' && akt['1g grundforløb'].type === 'hold', 'import: grundforløb');
  ok(akt['2g Bi']?.periode === 'efterGf', 'import: efter grundforløb');
  ok(akt['NV-eksamen']?.periode === 'eksamen' && akt['NV-eksamen'].optjening === 'afslutning', 'import: eksamen og optjening');
  ok(akt['Vejledning']?.periode == null, 'import: uden kolonnen = hele året');

  await page.click('#btn-copy-year'); await page.waitForSelector('#copy-sheet.open');
  await page.click('#btn-do-copy'); await page.waitForTimeout(500);
  const ny = await page.evaluate(() => [...window.__fs.store.values()].filter(d => d.schoolYear === '2027/28' && d.name === '1g grundforløb'));
  ok(ny.length === 1 && ny[0].periode === 'grundforloeb', 'kopien til 2027/28 beholder perioden');
  await page.context().close();
}

await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
