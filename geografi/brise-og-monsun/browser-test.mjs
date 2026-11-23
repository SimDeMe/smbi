// Bruger den eksisterende Playwright-installation fra repoets pladstjek.
import { chromium } from '../../værktøj/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
const billeder = new URL('../../værktøj/ud/', import.meta.url);
mkdirSync(billeder, { recursive: true });
const billede = navn => ({ path: fileURLToPath(new URL(navn, billeder)) });

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 577 } });
  const fejl = []; page.on('pageerror', e => fejl.push(e.message));
  await page.goto(`http://localhost:${process.env.PORT || 8777}/geografi/brise-og-monsun/`);
  await page.evaluate(() => document.fonts.ready);
  const ur = () => page.locator('#ur').innerText();

  // Trin 0: tiden løber selv fra kl. 6 til kl. 14, og land bliver varmest.
  await page.waitForFunction(() => document.getElementById('ur').textContent === 'kl. 14:00', null, { timeout: 15000 });
  assert.match(await page.locator('#forskel').innerText(), /Land er \d+ °C varmere/);
  assert.ok((await page.locator('#g-land').getAttribute('d')).length > 200);

  for (const [w, h] of [[1280, 577], [1366, 625], [1536, 730], [740, 750], [390, 750]]) {
    await page.setViewportSize({ width: w, height: h });
    for (let i = 0; i < 6; i++) {
      await page.locator(`[data-trin="${i}"]`).click();
      await page.waitForTimeout(80);
      const m = await page.evaluate(() => ({
        bund: document.querySelector('.betjening').getBoundingClientRect().bottom,
        graf: document.querySelector('#graf').getBoundingClientRect().height,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      assert.equal(m.overflow, false, `vandret rulning ${w} trin ${i}`);
      assert.ok(m.graf > 80, `grafen er for lav ${w} trin ${i}: ${m.graf}`);
      if (w >= 900) assert.ok(m.bund <= h + 1, `kontroller under skærmen ${w}×${h} trin ${i}: ${m.bund}`);
    }
  }
  await page.setViewportSize({ width: 1366, height: 625 });

  // Søbrise: lavtryk ved jorden over land. Landbrise: omvendt.
  await page.locator('[data-trin="2"]').click();
  assert.equal(await page.locator('.etiket.vind').innerText().then(t => t.split('\n')[0]), 'Søbrise');
  await page.waitForTimeout(1500);
  await page.screenshot(billede('brise-soebrise.png'));
  await page.locator('[data-trin="3"]').click();
  assert.equal(await ur(), 'kl. 04:00');
  assert.match(await page.locator('.etiket.vind').innerText(), /^Landbrise/);
  assert.match(await page.locator('#forskel').innerText(), /koldere/);

  // »Følg et døgn« starter kl. 6 og får vinden til at vende.
  await page.locator('#foelg-knap').click();
  assert.equal(await page.locator('#foelg-knap').getAttribute('aria-pressed'), 'true');
  await page.waitForFunction(() => document.querySelector('.etiket.vind')?.textContent.startsWith('Søbrise'), null, { timeout: 15000 });
  await page.locator('#foelg-knap').click();
  assert.equal(await page.locator('#foelg-knap').getAttribute('aria-pressed'), 'false');
  const stoppet = await ur(); await page.waitForTimeout(400);
  assert.equal(await ur(), stoppet);

  // Monsun: sommer og vinter.
  await page.locator('[data-trin="4"]').click();
  assert.equal(await ur(), 'juli');
  assert.match(await page.locator('.etiket.vind').innerText(), /^Sydvestmonsun/);
  assert.notEqual(await page.locator('#sommerskyer').getAttribute('opacity'), '0');
  await page.waitForTimeout(1500);
  await page.screenshot(billede('brise-sommermonsun.png'));
  await page.locator('#naeste').click();
  assert.equal(await ur(), 'januar');
  assert.match(await page.locator('.etiket.vind').innerText(), /^Nordøstmonsun/);
  assert.equal(await page.locator('#sammenlign').isVisible(), true);
  await page.locator('#forklar-knap').click();
  assert.equal(await page.locator('.etiket.vind').isVisible(), false);
  await page.locator('#forklar-knap').click();

  // Pause fryser lærredet; fokusvisning og Escape.
  await page.locator('#pause').click();
  const c = await page.locator('canvas').evaluate(c => c.toDataURL());
  await page.waitForTimeout(250);
  assert.equal(await page.locator('canvas').evaluate(c => c.toDataURL()), c);
  await page.locator('#pause').click();
  await page.locator('#fokus').click();
  assert.equal(await page.locator('body').evaluate(b => b.classList.contains('fokus')), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('body').evaluate(b => b.classList.contains('fokus')), false);

  // Tastatur: næste trin med Enter.
  await page.locator('[data-trin="0"]').click();
  await page.locator('#naeste').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-trin="1"]').getAttribute('aria-current'), 'step');

  // Reduceret bevægelse: start med pause og vis sluttilstanden i trin 0.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  assert.equal(await page.locator('#pause').getAttribute('aria-pressed'), 'true');
  assert.equal(await ur(), 'kl. 14:00');

  await page.setViewportSize({ width: 390, height: 750 });
  await page.locator('[data-trin="2"]').click();
  await page.screenshot({ ...billede('brise-mobil.png'), fullPage: true });
  await page.setViewportSize({ width: 1280, height: 577 });
  await page.locator('[data-trin="3"]').click();
  await page.screenshot(billede('brise-landbrise-1280.png'));
  assert.deepEqual(fejl, []);
  console.log('Browser: seks trin på fem skærmstørrelser, døgnforløb, vindskifte, monsun, forklar selv, pause, fokus, tastatur og reduceret bevægelse OK.');
} finally {
  await browser.close();
}
