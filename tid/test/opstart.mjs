// Opstarten: login uden iframe-hjælper ved start, og indstillinger fra cachen
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
const HER = fileURLToPath(new URL('.', import.meta.url));
const BASE = 'http://localhost:8777/tid/';
const fejl = [];
const ok = (b, msg) => { console.log((b ? 'OK   ' : 'FEJL ') + msg); if (!b) fejl.push(msg); };

async function side(browser, cfg) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
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
const STI = 'users/u1/settings/config';
const browser = await chromium.launch();

// 1. Login: ingen popup-hjælper ved start (den indlæser en iframe på iPhone),
//    men den gives med, når man trykker på knappen
{
  const page = await side(browser, { udlogget: true });
  await page.waitForSelector('#login-screen:not(.hidden)');
  const init = await page.evaluate(() => window.__auth.init);
  ok(init && !init.resolver, 'auth startes uden popup-hjælper');
  ok(init?.persistence === 3, 'samme tre lagre som getAuth, så gamle logins overlever');
  await page.click('#btn-google-login');
  await page.waitForTimeout(100);
  ok((await page.evaluate(() => window.__auth.popup)).join() === 'true', 'signInWithPopup får hjælperen med');
  await page.context().close();
}

// 2. Indstillinger i cachen: appen åbner uden at vente på en træg server,
//    og serverens nyere udgave lægges ind, når den kommer
{
  const page = await side(browser, {
    seed: [[STI, { currentSchoolYear: '2026/27' }]],
    cache: { [STI]: { currentSchoolYear: '2025/26' } },
    delay: [['settings', 3000]]
  });
  await page.waitForSelector('#loading-screen.hidden', { state: 'attached', timeout: 1500 }).catch(() => {});
  ok(await page.isHidden('#loading-screen'), 'appen er oppe, før serveren svarer');
  ok((await page.textContent('#top-year')) === '2025/26', 'skoleåret fra cachen: ' + await page.textContent('#top-year'));
  await page.waitForTimeout(3300);
  ok((await page.textContent('#top-year')) === '2026/27', 'serverens skoleår lagt ind bagefter: ' + await page.textContent('#top-year'));
  await page.context().close();
}

// 3. Intet i cachen (ny telefon): appen venter på serveren som før
{
  const page = await side(browser, { seed: [[STI, { currentSchoolYear: '2026/27' }]] });
  await page.waitForSelector('#loading-screen.hidden', { state: 'attached' });
  ok((await page.textContent('#top-year')) === '2026/27', 'uden cache: skoleåret fra serveren');
  await page.context().close();
}

await browser.close();
if (fejl.length) { console.log('\n' + fejl.length + ' fejl:\n' + fejl.join('\n')); process.exit(1); }
