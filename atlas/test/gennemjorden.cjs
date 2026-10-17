// Regression: alle kombinationer af P/S skal kunne afspilles uden JS-fejl.
// CHROMIUM=/usr/bin/chromium node atlas/test/gennemjorden.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.ATLAS_URL || 'http://127.0.0.1:8777';
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  const fejl = [];
  for (const [w, h] of [[1366, 625], [390, 750]]) for (const reduceret of [false, true]) {
    const side = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: reduceret ? 'reduce' : 'no-preference' });
    side.on('pageerror', e => fejl.push(`${w}/${reduceret}: ${e.message}`));
    await side.goto(base + '/atlas/jordskaelvsboelger-b/#del-3');
    await side.waitForFunction(() => /Første P:/.test(document.querySelector('#jord-aflaes').textContent));
    const saet = async (sel, value) => { await side.fill(sel, String(value)); await side.dispatchEvent(sel, 'input'); };
    const laes = () => side.locator('#jord-aflaes').textContent();
    // S alene er den oprindelige fejl; derefter alle øvrige valgkombinationer.
    for (const [p, s] of [[false, true], [false, false], [true, false], [true, true]]) {
      for (const [sel, valgt] of [['#jord-p', p], ['#jord-s', s]]) {
        if (await side.locator(sel).getAttribute('aria-pressed') !== String(valgt)) await side.click(sel);
      }
      await saet('#jord-afstand', 60);
      const tekst = await laes();
      assert.equal(/Første P:/.test(tekst), p, tekst);
      assert.equal(/S: 18 min/.test(tekst), s, tekst);
      assert.equal(/S − P =/.test(tekst), p && s, tekst);
      assert.deepEqual(fejl, [], 'valg af bølgetype må ikke kaste');
      await saet('#jord-tid', 180);
      const foer = await side.locator('#jord').evaluate(e => e.toDataURL());
      await side.click('#jord-afspil');
      if (reduceret) {
        assert.equal(await side.locator('#jord-tid').inputValue(), '300');
      } else {
        await side.waitForFunction(() => Number(document.querySelector('#jord-tid').value) > 195);
        await side.click('#jord-afspil');
      }
      if (p || s) assert.notEqual(await side.locator('#jord').evaluate(e => e.toDataURL()), foer, 'en valgt bølge skal flytte sig');
      const pause = await side.locator('#jord').evaluate(e => e.toDataURL());
      await side.waitForTimeout(100);
      assert.equal(await side.locator('#jord').evaluate(e => e.toDataURL()), pause, 'pause skal standse bølgerne');
    }
    // S-skyggen: ingen ankomst ved 125°, og heller ingen S−P eller fejl.
    await side.click('#jord-p');
    await saet('#jord-afstand', 125);
    assert.match(await laes(), /Ingen S-bølger/);
    assert.doesNotMatch(await laes(), /S − P =/);
    await side.click('#jord-kerne'); await side.click('#jord-kerne');
    // Start forfra efter slutningen, stadig med kun S valgt.
    await saet('#jord-tid', 1560);
    await side.click('#jord-afspil');
    if (reduceret) assert.equal(await side.locator('#jord-tid').inputValue(), '120');
    else {
      await side.waitForFunction(() => { const t = Number(document.querySelector('#jord-tid').value); return t > 0 && t < 120; });
      await side.click('#jord-afspil');
    }
    assert.deepEqual(fejl, []);
    console.log(`${w}×${h}, reduceret bevægelse ${reduceret}: P/S-valg, afspilning, pause, S-skygge og genstart OK`);
    await side.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
