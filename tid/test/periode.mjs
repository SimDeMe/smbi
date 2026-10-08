import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
const HER = fileURLToPath(new URL('.', import.meta.url));   // tid/test/
const DIR = HER + 'ud';                                       // skærmbilleder
fs.mkdirSync(DIR, { recursive: true });
const BASE = 'http://localhost:8777/tid/';
const fejl = [];
const ok = (b, msg) => { console.log((b ? 'OK   ' : 'FEJL ') + msg); if (!b) fejl.push(msg); };

// Periode (fra–til) på hold og opgaver: foran/bagud og løbende optjening
// regner med, at budgettet bruges i perioden. Fast dato: fredag 2. okt. 2026.
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

// Perioden 10. aug.–27. nov. 2026: 80 arbejdsdage, 39 + 10/24 gået ved
// fredag 2. okt. kl. 10. Skoleåret: ca. 73,4 af 229 (skolens ferieplan).
const pGrund = (39 + 10 / 24) / 80;
const pAar   = 73.4 / 229;
const browser = await chromium.launch();

// ── Foran/bagud: et grundforløb i efteråret og eksamen i foråret ──
{
  const uden = await side(browser, { seed: [settings, act('a1', 'Grundforløb', { type: 'hold', budgetHours: 300 })] });
  const n0 = await chip(uden);
  ok(n0 >= -546 && n0 <= -539, 'uden periode: bagud som før: ' + n0);
  await uden.context().close();

  const med = await side(browser, { seed: [settings, act('a1', 'Grundforløb', { type: 'hold', budgetHours: 300, fra: '2026-08-10', til: '2026-11-27' })] });
  const n1 = await chip(med);
  const forv = Math.round(300 * (pGrund - pAar));
  ok(Math.abs((n0 - n1) - forv) <= 1, `grundforløb aug–nov: ${forv} t mere bagud (${n0} → ${n1})`);
  const markoer = await med.$eval('.rapport-summary .norm-progress-marker', e => parseFloat(e.style.left));
  ok(markoer >= 34 && markoer <= 35, 'markøren står ved den forventede tid: ' + markoer + '%');

  // Kurvens sidste punkt er chippens tal — samme regning
  const sidst = await med.$eval('.udv-kort', k => JSON.parse(k.dataset.udv).data.at(-1)[1]);
  ok(Math.round(sidst / 60) === n1, `skemakurven ender i chippens tal: ${Math.round(sidst / 60)} / ${n1}`);
  await med.context().close();

  const eks = await side(browser, { seed: [settings, act('a1', 'Eksamen', { budgetHours: 100, optjening: 'afslutning', fra: '2027-05-03', til: '2027-06-25' })] });
  const n2 = await chip(eks);
  ok(Math.abs((n2 - n0) - Math.round(100 * pAar)) <= 1, `eksamen maj–juni: ${Math.round(100 * pAar)} t mindre bagud (${n0} → ${n2})`);
  await eks.context().close();
}

// ── Løbende optjening kun i perioden ──
{
  const page = await side(browser, { seed: [settings,
    act('a1', 'Udvalg', { budgetHours: 100, optjening: 'loebende', fra: '2026-08-10', til: '2026-11-27' }),
    act('a2', 'Hold uden norm', { type: 'hold', budgetHours: 100, fra: '2026-08-10', til: '2026-11-27', order: 2 }),
    act('a3', 'Teamledelse', { budgetHours: 100, optjening: 'loebende', order: 3 }),
    act('a4', 'Under', { budgetHours: 10, parentId: 'a1', order: 4 }),
  ] }, 1280);
  await tilRapport(page);
  const linjer = await page.$$eval('.rapport-akkord', l => l.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  const fmt = m => `${Math.floor(m / 60)}t ${m % 60}m`;
  const udvalg = linjer.find(l => l.includes('aug.')) || '';
  ok(udvalg.includes('10. aug.–27. nov.'), 'perioden står ved optjeningsmåden: ' + udvalg);
  // Udvalgets række har sine under-opgaver lagt sammen: 90 t + 10 t (arvet periode)
  const samlet = Math.round(100 * 60 * pGrund);
  const tal = l => { const m = l.match(/Optjent (\d+)t(?: (\d+)m)?/); return m ? Number(m[1]) * 60 + Number(m[2] || 0) : NaN; };
  ok(Math.abs(tal(udvalg) - samlet) <= 1, `udvalg optjent ${fmt(samlet)} over perioden (under-opgaven arver den): ${udvalg}`);
  const hold = linjer.find(l => l.includes('uden normgrundlag')) || '';
  ok(Math.abs(tal(hold) - Math.round(100 * 60 * pGrund)) <= 1, 'hold uden normgrundlag optjener i perioden: ' + hold);
  const team = linjer.find(l => !l.includes('aug.') && l.startsWith('Løbende')) || '';
  ok(Math.abs(tal(team) - Math.round(100 * 60 * pAar)) <= 30, 'uden periode: over hele året som før: ' + team);
  await page.screenshot({ path: DIR + '/periode-rapport.png', fullPage: true });
  await page.context().close();
}

// ── Formularen ──
{
  const page = await side(browser, { seed: [settings, act('a0', 'Findes i forvejen')] });
  await page.click('.nav-btn[data-view="aktiviteter"]'); await page.waitForTimeout(300);
  await page.click('#btn-new-activity'); await page.waitForSelector('#act-sheet.open');
  await page.fill('#act-name', 'Grundforløb');
  await page.click('.seg-opt:has(input[name="act-type"][value="hold"])');
  ok(await page.isVisible('#field-periode'), 'periodefeltet vises for hold');
  await page.fill('#act-budget', '60');
  await page.fill('#act-fra', '2026-11-27');
  await page.fill('#act-til', '2026-08-10');
  await page.click('#act-save-btn'); await page.waitForTimeout(400);
  ok(!(await aktiviteter(page))['Grundforløb'], 'til før fra gemmes ikke');
  ok((await page.textContent('#toast')).includes('slutter før'), 'og der står hvorfor');
  await page.fill('#act-fra', '2026-08-10');
  await page.fill('#act-til', '2026-11-27');
  await page.click('#act-save-btn'); await page.waitForTimeout(400);
  const a = (await aktiviteter(page))['Grundforløb'];
  ok(a?.fra === '2026-08-10' && a?.til === '2026-11-27', 'perioden gemmes: ' + JSON.stringify([a?.fra, a?.til]));
  const note = await page.textContent('.act-row-periode');
  ok(note.trim() === '10. aug.–27. nov.', 'listen viser perioden: ' + note);

  await page.click('.act-row:has(.act-row-periode)'); await page.waitForSelector('#act-sheet.open');
  ok(await page.inputValue('#act-fra') === '2026-08-10', 'perioden står i formularen igen');
  await page.fill('#act-fra', ''); await page.fill('#act-til', '');
  await page.click('#act-save-btn'); await page.waitForTimeout(400);
  const b = (await aktiviteter(page))['Grundforløb'];
  ok(b.fra === null && b.til === null, 'tomme felter = hele skoleåret');
  await page.context().close();
}

// ── Import og kopi til næste år ──
{
  const page = await side(browser, { seed: [settings, act('a0', 'Findes i forvejen')] });
  await page.click('.nav-btn[data-view="aktiviteter"]'); await page.waitForTimeout(300);
  await page.click('#btn-import-text'); await page.waitForSelector('#import-sheet.open');
  await page.fill('#import-year', '2026/27');
  await page.fill('#import-text', [
    '1g grundforløb; hold; 60; ; ; 2026-08-10; 27/11-2026',
    'Eksamen; opgave; 80; ; afslutning; 3.5.2027; 25-6-2027',
    'Udvalg; opgave; 30; ; ; 31/2-2027',
    'Vejledning; opgave; 40',
  ].join('\n'));
  await page.click('#btn-do-import'); await page.waitForTimeout(500);
  const akt = await aktiviteter(page);
  ok(akt['1g grundforløb']?.fra === '2026-08-10' && akt['1g grundforløb'].til === '2026-11-27' && akt['1g grundforløb'].type === 'hold',
     'import: hold med periode i to skrivemåder');
  ok(akt['Eksamen']?.fra === '2027-05-03' && akt['Eksamen'].til === '2027-06-25' && akt['Eksamen'].optjening === 'afslutning',
     'import: eksamen med optjening og periode');
  ok(akt['Udvalg']?.fra == null && akt['Udvalg'].til == null, 'import: en dato, der ikke findes, droppes');
  ok(akt['Vejledning']?.fra == null, 'import: uden kolonnerne = hele året');

  await page.click('#btn-copy-year'); await page.waitForSelector('#copy-sheet.open');
  await page.click('#btn-do-copy'); await page.waitForTimeout(500);
  const ny = await page.evaluate(() => [...window.__fs.store.values()]
    .filter(d => d.schoolYear === '2027/28' && d.name === '1g grundforløb'));
  ok(ny.length === 1 && ny[0].fra === '2027-08-10' && ny[0].til === '2027-11-27', 'kopien til 2027/28 flytter perioden et år frem: ' + JSON.stringify(ny.map(d => [d.fra, d.til])));
  await page.context().close();
}

await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
