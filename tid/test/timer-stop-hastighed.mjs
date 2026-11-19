// Stop på mobil: knappen svarer med det samme, og serverens rundture sendes
// samtidig. Hver rundtur er her 400 ms. Før rettelsen kom opslag, kontrol,
// post og commit efter hinanden (≈ 1600 ms); nu er det to (≈ 800 ms).
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { lavSide, seed, aaben, fejl } from './timer-test.js';
const browser = await chromium.launch();
const RT = 400;
try {
  {
    const page = await lavSide(browser, { seed: [...seed, aaben('e1', 30)], readDelay: RT, txReadDelay: RT, transactionDelay: RT });
    await page.waitForSelector('#timer-card:not(.hidden)');
    const t0 = Date.now();
    await page.click('#btn-stop-timer');
    assert.equal(await page.locator('#btn-stop-timer').textContent(), 'Stopper…');
    assert(await page.locator('#btn-stop-timer').isDisabled());
    assert(await page.locator('#banner-stop').isDisabled());
    await page.waitForFunction(() => __fs.entries()[0].endTime);
    const tid = Date.now() - t0;
    assert(tid < 3 * RT, `stoppet tog ${tid} ms — rundturene går stadig efter hinanden`);
    await page.waitForSelector('#timer-card.hidden', { state: 'attached' });
    assert.match(await page.locator('#toast').textContent(), /Stoppet · 30/);
    assert.equal(await page.locator('#btn-stop-timer').textContent(), '■ Stop');
    assert(!(await page.locator('#btn-stop-timer').isDisabled()));
    await page.context().close();
    console.log(`OK   Stop svarer straks med «Stopper…» og er gemt efter ${tid} ms (to rundture á ${RT} ms)`);
  }
  {
    // En fejl giver knappen tilbage, og timeren kører videre
    const page = await lavSide(browser, { seed: [...seed, aaben('e1', 30)], failTransaction: true });
    await page.waitForSelector('#timer-card:not(.hidden)');
    await page.click('#btn-stop-timer');
    await page.waitForFunction(() => document.getElementById('btn-stop-timer').textContent === '■ Stop');
    assert(!(await page.locator('#btn-stop-timer').isDisabled()));
    assert.equal((await page.evaluate(() => __fs.entries()))[0].endTime, null);
    await page.context().close();
    console.log('OK   Fejlet stop giver knappen tilbage; timeren er uændret');
  }
  assert.deepEqual(fejl, []);
} finally { await browser.close(); }
