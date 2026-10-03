import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
const HER = fileURLToPath(new URL('.', import.meta.url));   // tid/test/
const BASE = 'http://localhost:8777/tid/';
const DIR = HER + 'ud';                                       // skærmbilleder
fs.mkdirSync(DIR, { recursive: true });
const fejl = [];
const ok = (b, msg) => { console.log((b ? 'OK   ' : 'FEJL ') + msg); if (!b) fejl.push(msg); };

async function side(browser, cfg) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'da-DK', acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => fejl.push('pageerror: ' + e.message));
  for (const [frag, fil] of [['firebase-app.js', 'fake-app.js'], ['firebase-auth.js', 'fake-auth.js'], ['firebase-firestore.js', 'fake-fs.js']])
    await page.route('**/' + frag, r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(HER + fil, 'utf8') }));
  await page.route('**/feedback.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('https://fonts.**', r => r.abort());
  await page.addInitScript(c => { window.__fsCfg = c; }, cfg);
  await page.clock.setFixedTime(new Date(2026, 9, 2, 10, 0));
  await page.goto(BASE);
  return page;
}

// Henter backuppen via knappen i Indstillinger og læser filen
async function hentBackup(page) {
  await page.click('.nav-btn[data-view="indstillinger"]'); await page.waitForTimeout(300);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btn-export-json')]);
  return [dl.suggestedFilename(), JSON.parse(fs.readFileSync(await dl.path(), 'utf8'))];
}

const start = new Date(2026, 9, 1, 8, 10).getTime();
const slut  = new Date(2026, 9, 1, 9, 45).getTime();
const browser = await chromium.launch();

// ── Backuppen har indstillinger, aktiviteter og registreringer — alt ──
{
  const page = await side(browser, { seed: [
    ['users/u1/settings/config', { currentSchoolYear: '2026/27', normHours: 1500,
      ferie: { '2026/27': [{ fra: '2026-10-12', til: '2026-10-16' }] },
      portefoljeAndet: { '2026/27': [{ navn: 'Frikøb (TR)', timer: 100 }] },
      normFaktorer: { '2026/27': { faktor: 2.35, reduktion: 0.9 } } }],
    ['users/u1/activities/h1', { name: '3g Ng', type: 'hold', color: '#0E86C8', schoolYear: '2026/27', order: 1, isArchived: false, parentId: null,
      budgetHours: 288, normGrundlag: { moduler: 41, elever: 28, fordybelsestid: 15 },
      rettedeSaet: [{ id: 's1', dato: '2026-09-20', elevtimer: 2, navn: 'Rapport 1' }] }],
    ['users/u1/activities/o1', { name: 'SRP', type: 'opgave', color: '#E8336D', schoolYear: '2026/27', order: 2, isArchived: true, parentId: null, budgetHours: 40 }],
    ['users/u1/entries/e1', { activityId: 'h1', workType: 'undervisning', startTime: { __ts: start }, endTime: { __ts: slut },
      durationMinutes: 95, note: 'Fotosyntese', isModule: true, autoStopped: false }],
    ['users/u1/entries/e2', { activityId: null, isBreak: true, startTime: { __ts: slut }, endTime: { __ts: slut + 15 * 60000 }, durationMinutes: 15 }]
  ] });
  await page.waitForTimeout(400);
  const [navn, b] = await hentBackup(page);

  ok(/^tidsregistrering-backup-\d{4}-\d{2}-\d{2}\.json$/.test(navn), 'filnavn: ' + navn);
  ok(b.format === 'tid-backup' && b.formatVersion === 2 && typeof b.exportedAt === 'string', 'hovedet: format, version, tidspunkt');
  ok(b.user?.uid === 'u1', 'brugerens uid står i filen');

  ok(b.settings?.normHours === 1500 && b.settings?.currentSchoolYear === '2026/27', 'indstillingerne er med');
  ok(b.settings?.ferie?.['2026/27']?.[0]?.fra === '2026-10-12', 'ferien er med');
  ok(b.settings?.portefoljeAndet?.['2026/27']?.[0]?.timer === 100, 'andet i porteføljen er med');
  ok(b.settings?.normFaktorer?.['2026/27']?.faktor === 2.35, 'holdfaktorerne er med');

  ok(b.activities?.length === 2, 'begge aktiviteter, også den arkiverede: ' + b.activities?.length);
  const hold = b.activities.find(a => a.id === 'h1');
  ok(hold?.rettedeSaet?.[0]?.navn === 'Rapport 1' && hold?.normGrundlag?.moduler === 41, 'holdets rettede sæt og normgrundlag');

  ok(b.entries?.length === 2, 'begge registreringer, også pausen: ' + b.entries?.length);
  const e1 = b.entries.find(e => e.id === 'e1');
  ok(e1?.startTime === new Date(start).toISOString() && e1?.endTime === new Date(slut).toISOString(), 'tidspunkter som ISO-tekst: ' + e1?.startTime);
  ok(e1?.note === 'Fotosyntese' && e1?.workType === 'undervisning', 'registreringens felter');
  ok(b.entries.find(e => e.id === 'e2')?.isBreak === true, 'pausen er markeret');

  ok((await page.textContent('#toast')).includes('2 aktiviteter, 2 registreringer'), 'beskeden siger, hvad der kom med');
  await page.context().close();
}

// ── Uden gemte indstillinger: settings er null, filen kommer stadig ──
{
  const page = await side(browser, { seed: [] });
  await page.waitForTimeout(400);
  await page.evaluate(() => window.__fs.store.delete('users/u1/settings/config'));
  // onboarding ligger over appen, når der ingen aktiviteter er
  await page.click('#btn-onboarding-skip').catch(() => {});
  const [, b] = await hentBackup(page);
  ok(b.settings === null && b.activities.length === 0 && b.entries.length === 0, 'tom bruger giver en gyldig, tom backup');
  await page.context().close();
}

// ── Gendan: ret i backuppen som en AI ville, og læs den ind igen ──
const grundData = () => ({ seed: [
  ['users/u1/settings/config', { currentSchoolYear: '2026/27', normHours: 1690 }],
  ['users/u1/activities/h1', { name: '3g Ng', type: 'hold', color: '#0E86C8', schoolYear: '2026/27', order: 1, isArchived: false, parentId: null, budgetHours: 288 }],
  ['users/u1/activities/o1', { name: 'SRP', type: 'opgave', color: '#E8336D', schoolYear: '2026/27', order: 2, isArchived: false, parentId: null, budgetHours: 40 }],
  ['users/u1/entries/e1', { activityId: 'h1', workType: 'undervisning', startTime: { __ts: start }, endTime: { __ts: slut }, durationMinutes: 95, note: '', isModule: true, autoStopped: false }],
  ['users/u1/entries/e2', { activityId: 'o1', workType: null, startTime: { __ts: slut + 3600000 }, endTime: { __ts: slut + 7200000 }, durationMinutes: 60, note: '', isModule: false, autoStopped: false }]
] });
const indlaes = async (page, obj, navn = 'rettet.json') => {
  await page.setInputFiles('#gendan-fil', { name: navn, mimeType: 'application/json', buffer: Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj)) });
  await page.waitForSelector('#gendan-sheet.open'); await page.waitForTimeout(200);
};
const celler = async page => page.$$eval('.gendan-tabel tbody tr', rs => rs.map(r => [...r.querySelectorAll('td')].map(t => Number(t.textContent))));

{
  const page = await side(browser, grundData());
  await page.waitForTimeout(400);
  const [, b] = await hentBackup(page);
  ok(Array.isArray(b.om) && b.om.some(l => l.includes('ISO 8601')), 'filen forklarer selv sit format');

  b.entries.find(e => e.id === 'e1').note = 'Fotosyntese';                       // ændret
  b.entries = b.entries.filter(e => e.id !== 'e2');                               // slettet
  b.activities.push({ id: 'ny-vejl', name: 'Vejledning', type: 'opgave', schoolYear: '2026/27', budgetHours: 20 });  // ny, uden farve og orden
  b.entries.push({ activityId: 'h1', workType: 'undervisning', startTime: '2026-10-05T10:00:00+02:00', endTime: '2026-10-05T11:35:00+02:00', note: 'Skema', isModule: true });
  b.entries.push({ activityId: 'ny-vejl', startTime: '2026-10-05T12:00', endTime: '2026-10-05T12:30' });          // uden tidszone og id
  b.settings.normHours = 1500;
  await indlaes(page, b);

  ok(JSON.stringify(await celler(page)) === JSON.stringify([[1, 0, 0, 2], [2, 1, 1, 0]]), 'arket: nye/ændres/slettes/uændret ' + JSON.stringify(await celler(page)));
  ok((await page.textContent('#gendan-body')).includes('Indstillinger: ændres'), 'indstillingerne ændres');
  ok(!(await page.isDisabled('#btn-do-gendan')), 'Gendan kan trykkes');
  await page.waitForTimeout(300); await page.screenshot({ path: DIR + '/gendan.png' });

  const [sikker] = await Promise.all([page.waitForEvent('download'), page.click('#btn-do-gendan')]);
  ok(sikker.suggestedFilename().startsWith('tidsregistrering-foer-gendannelse-'), 'backup af de nuværende data hentes først: ' + sikker.suggestedFilename());
  const foer = JSON.parse(fs.readFileSync(await sikker.path(), 'utf8'));
  ok(foer.entries.length === 2 && foer.settings.normHours === 1690, 'sikkerhedskopien er de gamle data');
  await page.waitForTimeout(300);
  const st = await page.evaluate(() => {
    const s = window.__fs.store, ud = {};
    for (const [p, d] of s) ud[p] = JSON.parse(JSON.stringify(d, (k, v) => v && v.ms != null && v.toDate ? { ms: v.ms } : v));
    return ud;
  });
  const poster = Object.entries(st).filter(([p]) => p.startsWith('users/u1/entries/'));
  ok(poster.length === 3 && !st['users/u1/entries/e2'], 'tre registreringer, e2 er slettet');
  ok(st['users/u1/entries/e1'].note === 'Fotosyntese', 'e1 er rettet');
  const skema = poster.map(([, d]) => d).find(d => d.note === 'Skema');
  ok(skema?.startTime?.ms === new Date('2026-10-05T10:00:00+02:00').getTime() && skema.durationMinutes === 95, 'ny post med tidszone, varighed regnet ud');
  const vejl = poster.map(([, d]) => d).find(d => d.activityId === 'ny-vejl');
  ok(vejl?.startTime?.ms === new Date(2026, 9, 5, 12, 0).getTime() && vejl.durationMinutes === 30 && vejl.workType === null, 'ny post uden tidszone læses som lokal tid');
  const na = st['users/u1/activities/ny-vejl'];
  ok(na && na.color && na.order === 3 && na.parentId === null && na.isArchived === false, 'ny aktivitet får farve, orden og standardfelter');
  ok(st['users/u1/settings/config'].normHours === 1500, 'indstillingerne er skrevet');
  await page.context().close();
}

// ── Fejl i filen: intet gendannes, og fejlene står i arket ──
{
  const page = await side(browser, grundData());
  await page.waitForTimeout(400);
  const [, b] = await hentBackup(page);
  b.entries.push({ activityId: 'findes-ikke', startTime: '2026-10-05T10:00', endTime: '2026-10-05T11:00' });
  b.entries.push({ activityId: 'h1', startTime: '2026-10-05T12:00', endTime: '2026-10-05T11:00' });
  b.entries.push({ activityId: 'h1', startTime: '2026-10-05T13:00' });
  b.activities.push({ name: 'Hold under opgave', type: 'hold', schoolYear: '2026/27', parentId: 'o1' });
  await indlaes(page, b);
  const t = await page.textContent('#gendan-body');
  ok(t.includes('«findes-ikke» findes ikke'), 'ukendt aktivitet er en fejl');
  ok(t.includes('slutter før den starter'), 'slut før start er en fejl');
  ok(t.includes('endTime mangler'), 'manglende sluttid er en fejl');
  ok(t.includes('et hold kan ikke ligge under'), 'hold under en opgave er en fejl');
  ok(await page.isDisabled('#btn-do-gendan'), 'Gendan kan ikke trykkes');
  await page.screenshot({ path: DIR + '/gendan-fejl.png' });

  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  await indlaes(page, '{ ikke json');
  ok((await page.textContent('#gendan-body')).includes('ikke gyldig JSON') && await page.isDisabled('#btn-do-gendan'), 'ødelagt fil afvises');

  // Den uændrede fil: intet at gøre
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  const [, b2] = await hentBackup(page);
  await indlaes(page, b2);
  ok((await page.textContent('#gendan-body')).includes('intet at gendanne') && await page.isDisabled('#btn-do-gendan'), 'samme data: intet at gendanne');
  ok(await page.evaluate(() => window.__fs.entries().length) === 2, 'intet er skrevet');
  await page.context().close();
}

// ── Gammel backup uden indstillinger: de nuværende beholdes, og nyere poster varsles ──
{
  const page = await side(browser, grundData());
  await page.waitForTimeout(400);
  const gammel = { exportedAt: new Date(slut + 1000).toISOString(),
    activities: [{ id: 'h1', name: '3g Ng', type: 'hold', color: '#0E86C8', schoolYear: '2026/27', order: 1, isArchived: false, parentId: null, budgetHours: 288 },
                 { id: 'o1', name: 'SRP', type: 'opgave', color: '#E8336D', schoolYear: '2026/27', order: 2, isArchived: false, parentId: null, budgetHours: 40 }],
    entries: [{ id: 'e1', activityId: 'h1', workType: 'undervisning', startTime: new Date(start).toISOString(), endTime: new Date(slut).toISOString(), durationMinutes: 95, note: '', isModule: true, autoStopped: false }] };
  await page.click('.nav-btn[data-view="indstillinger"]'); await page.waitForTimeout(300);
  await indlaes(page, gammel, 'gammel.json');
  const t = await page.textContent('#gendan-body');
  ok(t.includes('dine nuværende beholdes'), 'indstillinger uden for filen beholdes');
  ok(t.includes('1 registrering er lavet, efter backuppen blev taget, og slettes'), 'advarsel om nyere registreringer: ' + t.replace(/\s+/g, ' ').slice(0, 300));
  await Promise.all([page.waitForEvent('download'), page.click('#btn-do-gendan')]);
  await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__fs.store.get('users/u1/settings/config')?.normHours) === 1690, 'indstillingerne er urørte');
  ok(await page.evaluate(() => window.__fs.entries().length) === 1, 'den nyere registrering er slettet');
  await page.context().close();
}

await browser.close();
if (fejl.length) { console.log(`\n${fejl.length} fejl`); process.exit(1); }
