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
const inde = (page, sel) => page.evaluate(s => document.querySelector(s).contains(document.activeElement), sel);
const tabRundt = async (page, sel, n = 25) => { for (let i = 0; i < n; i++) { await page.keyboard.press('Tab'); if (!(await inde(page, sel))) return false; } return true; };

{
  const page = await side(browser, { seed: [settings, act('a1', 'SRP'), act('h1', '3g Ng', { type: 'hold', order: 2 }), post('e1', 'a1', idag(8), idag(9))] });
  await page.waitForTimeout(400);
  await page.click('.nav-btn[data-view="aktiviteter"]'); await page.waitForTimeout(200);
  await page.focus('#btn-new-activity'); await page.keyboard.press('Enter');
  await page.waitForSelector('#act-sheet.open');
  const a = await page.evaluate(() => { const s = document.getElementById('act-sheet'); return [s.getAttribute('role'), s.getAttribute('aria-modal'), document.getElementById(s.getAttribute('aria-labelledby'))?.textContent, document.getElementById('app').inert]; });
  ok(a[0] === 'dialog' && a[1] === 'true' && a[2] === 'Ny aktivitet' && a[3] === true, 'act-sheet: dialog, navngivet, appen inert: ' + a.join());
  ok(await inde(page, '#act-sheet'), 'fokus i arket ved åbning');
  ok(await tabRundt(page, '#act-sheet', 40), 'Tab bliver i arket (40 tryk)');
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  ok(await page.isHidden('#act-sheet'), 'Escape lukker');
  ok(await page.evaluate(() => document.activeElement.id) === 'btn-new-activity', 'fokus tilbage på knappen');
  ok(await page.evaluate(() => !document.getElementById('app').inert), 'appen er ikke inert efter lukning');

  // Historik-arket med Escape og bagefter normal brug
  await page.click('.nav-btn[data-view="historik"]'); await page.click('.hist-mode-tab[data-mode="liste"]'); await page.waitForSelector('.entry-row');
  await page.focus('.entry-row[data-id="e1"]'); await page.keyboard.press('Enter');
  await page.waitForSelector('#hist-sheet.open');
  ok(await page.evaluate(() => document.getElementById('hist-sheet').getAttribute('aria-labelledby')) === 'hist-sheet-title', 'hist-sheet bruger sin titel');
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  ok(await page.isHidden('#hist-sheet') && await page.evaluate(() => document.activeElement.dataset?.id) === 'e1', 'Escape lukker, fokus tilbage på rækken');
  await page.click('#btn-new-entry'); await page.waitForSelector('#hist-sheet.open');
  await page.click('#hist-sheet-close'); await page.waitForTimeout(400);
  ok(await page.isHidden('#hist-sheet') && await page.evaluate(() => !document.getElementById('app').inert), 'luk-knap virker stadig');

  // Hjem: modul-arket og rettet sæt
  await page.click('.nav-btn[data-view="hjem"]'); await page.waitForTimeout(200);
  await page.focus('#btn-1-modul'); await page.keyboard.press('Enter'); await page.waitForSelector('#modul-sheet.open');
  ok(await tabRundt(page, '#modul-sheet'), 'Tab bliver i modul-arket');
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  ok(await page.isHidden('#modul-sheet') && await page.evaluate(() => document.activeElement.id) === 'btn-1-modul', 'modul: Escape og fokus tilbage');
  await page.focus('#btn-rettet-saet'); await page.keyboard.press('Enter'); await page.waitForSelector('#saet-sheet.open');
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  ok(await page.isHidden('#saet-sheet') && await page.evaluate(() => document.activeElement.id) === 'btn-rettet-saet', 'rettet sæt: Escape og fokus tilbage');
  // Hurtigt åbn-luk-åbn: arket må ikke forsvinde af den gamle lukke-timer
  await page.click('#btn-1-modul'); await page.waitForSelector('#modul-sheet.open');
  await page.keyboard.press('Escape'); await page.click('#btn-1-modul'); await page.waitForTimeout(500);
  ok(await page.isVisible('#modul-sheet'), 'genåbnet ark bliver stående');
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  await page.context().close();
}

// Onboarding
{
  const page = await side(browser, { seed: [settings] });
  await page.waitForSelector('#onboarding:not(.hidden)');
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.activeElement.id) === 'btn-onboarding-activities', 'onboarding: fokus på første knap');
  await page.keyboard.press('Shift+Tab'); ok(await inde(page, '#onboarding'), 'onboarding: Shift+Tab bliver i vinduet'); ok(await tabRundt(page, '#onboarding', 10), 'onboarding: Tab bliver i vinduet');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok(await page.isHidden('#onboarding') && await page.evaluate(() => !document.getElementById('app').inert), 'Escape springer over, appen kan nås igen');
  await page.context().close();
}
await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
