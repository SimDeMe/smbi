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

async function side(browser, cfg) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => fejl.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('  console:', m.text()); });
  for (const [frag, fil] of [['firebase-app.js', 'fake-app.js'], ['firebase-auth.js', 'fake-auth.js'], ['firebase-firestore.js', 'fake-fs.js']])
    await page.route('**/' + frag, r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(HER + fil, 'utf8') }));
  await page.route('**/feedback.js', r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.addInitScript(c => { window.__fsCfg = c; }, cfg);
  await page.goto(BASE);
  return page;
}
const act = (id, name, extra = {}) => [`users/u1/activities/${id}`, { name, type: 'opgave', color: '#0E86C8', schoolYear: '2026/27', order: 1, isArchived: false, parentId: null, ...extra }];
const settings = ['users/u1/settings/config', { currentSchoolYear: '2026/27' }];

const browser = await chromium.launch();

// ── Punkt 1: skift inden for et minut giver ingen 0 m-post ──
{
  const page = await side(browser, { seed: [settings, act('a1', 'SRP'), act('a2', 'Rettearbejde', { order: 2 })] });
  await page.waitForSelector('.qs-btn[data-id="a1"]');
  await page.click('.qs-btn[data-id="a1"]');
  await page.waitForSelector('#timer-card:not(.hidden)');
  await page.click('.qs-btn[data-id="a2"]');
  await page.waitForFunction(() => document.getElementById('timer-act-name').textContent === 'Rettearbejde');
  await page.waitForTimeout(200);
  let e = await page.evaluate(() => __fs.entries());
  ok(e.length === 1 && e[0].activityId === 'a2' && e[0].endTime == null, `hurtigt skift: kun den nye post findes (${e.length} poster)`);

  // Har timeren kørt 5 min, gemmes den ved skift
  await page.evaluate(() => { const [p, d] = [...__fs.store.entries()].find(([p, d]) => p.includes('/entries/') && d.endTime == null); __fs.put(p, { ...d, startTime: __fs.Timestamp.fromMillis(Date.now() - 5 * 60000) }); });
  await page.waitForTimeout(100);
  await page.click('.qs-btn[data-id="a1"]');
  await page.waitForFunction(() => document.getElementById('timer-act-name').textContent === 'SRP');
  await page.waitForTimeout(200);
  e = await page.evaluate(() => __fs.entries());
  const gemt = e.find(x => x.activityId === 'a2');
  ok(gemt && gemt.durationMinutes === 5 && gemt.endTime, `skift efter 5 min: posten gemt med ${gemt?.durationMinutes} m`);

  // Stop inden for et minut: posten slettes og toasten siger det
  await page.click('#btn-stop-timer');
  await page.waitForSelector('#timer-card.hidden', { state: 'attached' });
  await page.waitForTimeout(200);
  e = await page.evaluate(() => __fs.entries());
  ok(e.length === 1 && !e.some(x => x.activityId === 'a1'), `stop efter få sek.: posten slettet (${e.length} tilbage)`);
  ok((await page.textContent('#toast')).includes('ikke gemt'), 'toast: ' + await page.textContent('#toast'));
  await page.screenshot({ path: DIR + '/p1.png' });
  await page.context().close();
}

// ── Punkt 2: hurtigstart følger med, når en aktivitet kommer til ──
{
  const page = await side(browser, { seed: [settings, act('a1', 'SRP')] });
  await page.waitForSelector('.qs-btn[data-id="a1"]');
  await page.evaluate(() => __fs.put('users/u1/activities/a9', { name: 'Ny fra telefonen', type: 'opgave', color: '#5FB030', schoolYear: '2026/27', order: 9, isArchived: false, parentId: null }));
  await page.waitForSelector('.qs-btn[data-id="a9"]', { timeout: 3000 }).catch(() => {});
  ok(await page.$('.qs-btn[data-id="a9"]') != null, 'ny aktivitet dukker op i hurtigstart uden navigation');
  await page.evaluate(() => { const d = __fs.store.get('users/u1/activities/a1'); __fs.put('users/u1/activities/a1', { ...d, name: 'SRP omdøbt' }); });
  await page.waitForTimeout(300);
  ok((await page.textContent('.qs-btn[data-id="a1"] .qs-name')) === 'SRP omdøbt', 'omdøbning slår igennem i hurtigstart');
  // Tom start: onboarding springes over, aktivitet tilføjes bagefter
  await page.context().close();
  const p2 = await side(browser, { seed: [settings] });
  await p2.waitForSelector('#onboarding:not(.hidden)');
  await p2.click('#btn-onboarding-skip');
  ok(await p2.isVisible('#home-empty'), 'tom hurtigstart vises');
  await p2.evaluate(() => __fs.put('users/u1/activities/a1', { name: 'Første', type: 'opgave', color: '#5FB030', schoolYear: '2026/27', order: 1, isArchived: false, parentId: null }));
  await p2.waitForSelector('.qs-btn[data-id="a1"]', { timeout: 3000 }).catch(() => {});
  ok(await p2.$('.qs-btn[data-id="a1"]') != null && !(await p2.isVisible('#home-empty')), 'første aktivitet erstatter «Ingen aktiviteter»');
  await p2.screenshot({ path: DIR + '/p2.png' });
  await p2.context().close();
}

// ── Punkt 3: igangværende post før aktiviteterne ──
{
  const start = Date.now() - 12 * 60000;
  const page = await side(browser, {
    delay: [['activities', 1500]],
    seed: [settings, act('a1', 'SRP', { color: '#E8336D' }),
      ['users/u1/entries/e1', { activityId: 'a1', workType: null, startTime: { __ts: start }, endTime: null, durationMinutes: null, isModule: false, autoStopped: false, note: '' }]]
  });
  await page.waitForSelector('#timer-card:not(.hidden)');
  const foer = await page.textContent('#timer-act-name');
  console.log('  før aktiviteterne:', foer);
  await page.waitForTimeout(1900);
  ok((await page.textContent('#timer-act-name')) === 'SRP', 'timerkort viser SRP, når aktiviteterne kommer');
  ok((await page.textContent('#banner-act-name')) === 'SRP', 'banner viser SRP');
  const farve = await page.$eval('#timer-card', el => el.style.getPropertyValue('--act-color'));
  ok(farve === '#E8336D', 'timerkortets farve er aktivitetens: ' + farve);
  await page.screenshot({ path: DIR + '/p3.png' });
  await page.context().close();
}

await browser.close();
console.log(fejl.length ? '\n' + fejl.length + ' fejl:\n' + fejl.join('\n') : '\nAlt OK');
process.exit(fejl.length ? 1 : 0);
