import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
const HER = fileURLToPath(new URL('.', import.meta.url));   // tid/test/
const BASE = 'http://localhost:8777/tid/';
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

await browser.close();
if (fejl.length) { console.log(`\n${fejl.length} fejl`); process.exit(1); }
