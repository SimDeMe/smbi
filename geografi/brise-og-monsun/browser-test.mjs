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

  // Opgaverne: valg, peg på figuren, klik i grafen, byg kæden og resultat.
  await page.locator('[data-trin="6"]').click();
  assert.match(await page.locator('#opg-nr').innerText(), /OPGAVE 1 AF 14/);
  assert.equal(await page.locator('.betjening').isVisible(), false);
  assert.equal(await page.locator('.etiket.vind').isVisible(), false, 'etiketter skjult før svar');
  const peg = async (vx, vy) => { const r = await page.locator('.scene').boundingBox(); await page.mouse.click(r.x + vx / 1200 * r.width, r.y + vy / 500 * r.height); };
  const grafKlik = async t => {
    const p = await page.evaluate(t => {
      const g = document.getElementById('graf'), periode = document.body.dataset.scene === 'brise' ? 24 : 12;
      return new DOMPoint(32 + 220 * t / periode, 66).matrixTransform(g.getScreenCTM());
    }, t);
    await page.mouse.click(p.x, p.y);
  };
  const svar = () => page.locator('#opg-svar').innerText();
  const videre = () => page.locator('#opg-naeste').click();
  // 1 valg: forkert
  await page.locator('#opg-valg > button').first().click();
  assert.match(await svar(), /Ikke rigtigt/);
  await videre();
  // 2 graf: først forkert (kl. 9), så rigtigt (ca. kl. 15)
  assert.match(await page.locator('#ur').innerText(), /hele døgnet/);
  await grafKlik(3);
  assert.match(await svar(), /Ikke rigtigt.*kl\. 09:00/);
  assert.ok(await page.locator('#g-opg .g-rigtig').count() > 0, 'rigtige tidspunkter markeres');
  assert.match(await page.locator('#opg-naeste').innerText(), /Prøv igen/);
  await videre();
  assert.equal(await page.locator('#opg-grafpunkter .opg-punkt').count(), 12, 'tastaturpunkter i grafen');
  await grafKlik(8.8);
  assert.match(await svar(), /Rigtigt\. Du valgte kl\. 1[45]:[0-5]0/);
  await videre();
  // 3 peg: luftstrømmen højt oppe er forkert, søbrisen ved jorden rigtig
  await peg(560, 165);
  assert.match(await svar(), /luftstrømmen højt oppe/);
  assert.ok(await page.locator('#opg-fremhaev path').count() > 0);
  await videre();
  await peg(560, 372);
  assert.match(await svar(), /Rigtigt/);
  await videre();
  // 4 lavtryk ved jorden over land
  await peg(760, 300); assert.match(await svar(), /^✓ Rigtigt!/); await videre();
  // 5 luften synker over havet (først forkert over land)
  await peg(930, 268); assert.match(await svar(), /stiger/); await videre();
  await peg(200, 268); assert.match(await svar(), /Rigtigt/); await videre();
  // 6 graf: landbrise kl. 24
  await grafKlik(18); assert.match(await svar(), /^✓ Rigtigt!/); await videre();
  // 7 valg rigtigt
  await page.locator('#opg-valg > button').first().click(); assert.match(await svar(), /Rigtigt/); await videre();
  // 8 nat: luften stiger over havet
  assert.match(await page.locator('#trin-navn').innerText(), /Opgaver/);
  await peg(200, 317); assert.match(await svar(), /^✓ Rigtigt!/); await videre();
  // 9 valg
  await page.locator('#opg-valg > button').nth(1).click(); await videre();
  // 10 monsun: regn over land
  assert.equal(await page.locator('body').getAttribute('data-scene'), 'monsun');
  await peg(250, 300); assert.match(await svar(), /Ikke rigtigt/); await videre();
  await peg(790, 300); assert.match(await svar(), /Rigtigt/); await videre();
  // 11–12 valg
  await page.locator('#opg-valg > button').nth(1).click(); await videre();
  await page.locator('#opg-valg > button').first().click(); await videre();
  // 13 graf: vintermonsun i november
  assert.match(await page.locator('#ur').innerText(), /hele året/);
  await grafKlik(10.5); assert.match(await svar(), /^✓ Rigtigt!.*november/); await videre();
  // 14 byg kæden med klik
  assert.equal(await page.locator('.figur-raekke').isVisible(), false, 'figuren gemmes ved kæden');
  const facit = ['Solen opvarmer land og hav', 'Land bliver hurtigt varmere end havet', 'Luften over land opvarmes og udvider sig', 'Højt oppe strømmer luft fra land ud over havet', 'Ved jorden opstår lavtryk over land og højtryk over havet', 'Ved jorden blæser det fra havet mod land: søbrise'];
  for (let i = 0; i < facit.length; i++) {
    await page.locator(`.kaede-bunke .kaede-kort[data-tekst="${facit[i]}"]`).click();
    await page.locator('.kaede-felt .kaede-tom').first().click();
  }
  await page.locator('.kaede-tjek').click();
  assert.equal(await page.locator('.kaede-felt.rigtig').count(), 6);
  await page.screenshot(billede('brise-opgave-kaede.png'));
  await videre();
  assert.match(await page.locator('#opg-spm').innerText(), /Du fik 9 af 14 rigtige/);
  assert.equal(await page.locator('#opg-prikker li.forkert').count(), 5);
  await page.locator('[data-trin2], [data-trin1]').click();
  assert.equal(await page.locator('[data-trin="0"]').getAttribute('aria-current'), 'step');
  assert.equal(await page.locator('.betjening').isVisible(), true);
  assert.equal(await page.locator('#opg-lag').isVisible(), false);

  // Opgaverne på elevskærme: svar og «Næste» skal kunne nås uden at rulle forbi.
  for (const [w, h] of [[1280, 577], [390, 750]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.locator('[data-trin="6"]').click();
    if (await page.locator('[data-igen]').count()) await page.locator('[data-igen]').click();
    assert.match(await page.locator('#opg-nr').innerText(), /OPGAVE 1 AF 14/);
    if (w === 1280) await page.locator('#opg-valg > button').first().click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (w === 1280) { await page.evaluate(() => scrollTo(0, 0)); await page.screenshot(billede('brise-opgave-1280.png')); }
    else await page.screenshot({ ...billede('brise-opgave-mobil.png'), fullPage: true });
  }
  await page.setViewportSize({ width: 1366, height: 625 });
  await page.locator('[data-trin="0"]').click();

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
  console.log('Browser: opgaver (valg, peg, graf, kæde, resultat), seks trin på fem skærmstørrelser, døgnforløb, vindskifte, monsun, forklar selv, pause, fokus, tastatur og reduceret bevægelse OK.');
} finally {
  await browser.close();
}
