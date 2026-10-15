import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const here = fileURLToPath(new URL('.', import.meta.url));
const browser = await chromium.launch();
try {
  for (const config of [{ udlogget: true, authPending: true }, { udlogget: true, authError: 'auth/popup-blocked' }]) {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await context.addInitScript(value => { window.__fsCfg = value; }, config);
    for (const [frag, file] of [['firebase-app.js', 'fake-app.js'], ['firebase-auth.js', 'fake-auth.js'], ['firebase-firestore.js', 'fake-fs.js']]) await context.route('**/' + frag, r => r.fulfill({ contentType: 'text/javascript', body: readFileSync(here + file, 'utf8') }));
    const page = await context.newPage(); await page.goto('http://localhost:8777/tid/lectio-import.html');
    await page.waitForSelector('#import-login'); await page.clock.install();
    await page.click('#import-login');
    if (config.authPending) {
      assert.match(await page.locator('#import-status').textContent(), /Åbner Google-login/);
      assert.equal(await page.locator('#import-login').isDisabled(), true);
      await page.clock.runFor(16000);
      assert.match(await page.locator('#import-status').textContent(), /almindelige browser/);
      assert.equal(await page.locator('#import-login').isEnabled(), true);
    } else {
      await page.waitForFunction(() => document.getElementById('import-status').textContent.includes('blokerede'));
    }
    assert.equal(await page.locator('#import-login-help').isVisible(), true);
    assert.equal(await page.locator('#import-save').isDisabled(), true);
    await context.close();
  }
  console.log('OK   Login-knappen viser fremdrift, håndterer blokering og giver en brugbar vej videre ved skjult login-vindue');
} finally { await browser.close(); }
