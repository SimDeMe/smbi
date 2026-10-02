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

let SW = 'block';
async function side(browser, cfg, w = 390) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, serviceWorkers: SW });
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

// Den version, appen skal vise: cachenavnet i service workeren
const VERSION = /const CACHE = '([^']+)'/.exec(fs.readFileSync(HER + '../service-worker.js', 'utf8'))[1];
const browser = await chromium.launch();
{
  const page = await side(browser, { seed: [settings, act('a1', 'SRP')] });
  await page.waitForTimeout(300);
  await page.click('.nav-btn[data-view="indstillinger"]'); await page.waitForTimeout(300);
  ok((await page.textContent('.app-version')) === 'Tid-appen · ikke installeret', 'uden service worker: ' + await page.textContent('.app-version'));
  await page.context().close();
}
SW = 'allow';
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p0 = await ctx.newPage();
  await p0.goto('http://localhost:8777/navneApp/');
  await p0.evaluate(async () => { await caches.open('navne-app-v8'); await caches.open('tid-v1'); });
  const page = await ctx.newPage();
  page.on('pageerror', e => fejl.push('pageerror: ' + e.message));
  for (const [frag, fil] of [['firebase-app.js', 'fake-app.js'], ['firebase-auth.js', 'fake-auth.js'], ['firebase-firestore.js', 'fake-fs.js']])
    await page.route('**/' + frag, r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(HER + fil, 'utf8') }));
  await page.route('https://fonts.**', r => r.abort());
  await page.addInitScript(c => { window.__fsCfg = c; }, { seed: [settings, act('a1', 'SRP')] });
  await page.goto(BASE);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(1500);
  const noegler = await page.evaluate(() => caches.keys());
  ok(noegler.includes('navne-app-v8') && noegler.includes(VERSION) && !noegler.includes('tid-v1'), 'kun tids gamle caches slettes: ' + noegler.join());
  await page.click('.nav-btn[data-view="indstillinger"]'); await page.waitForTimeout(300);
  ok((await page.textContent('.app-version')) === 'Tid-appen · ' + VERSION, 'version: ' + await page.textContent('.app-version'));
  await page.locator('.app-version').scrollIntoViewIfNeeded();
  await page.screenshot({ path: DIR + '/version.png' });
  await ctx.close();
}
await browser.close();
console.log(fejl.length ? '\nFEJL:\n' + fejl.join('\n') : '\nAlt OK');
process.exitCode = fejl.length ? 1 : 0;
