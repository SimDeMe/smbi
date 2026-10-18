import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const her = fileURLToPath(new URL('.', import.meta.url));
mkdirSync(her + 'ud', { recursive: true });
import { lavSide, seed, aaben, fejl } from './timer-test.js';
const browser = await chromium.launch();
const side = (cfg, server, width) => lavSide(browser, cfg, server, width);
const entries = page => page.evaluate(() => __fs.entries());
try {
  {
    const page = await side({ transactionDelay: 200 });
    await page.evaluate(async () => {
      const { startTimer } = await import('/tid/timer.js');
      await Promise.all([startTimer('a', null), startTimer('a', null), startTimer('b', null)]);
    });
    assert.equal((await entries(page)).length, 1);
    assert.equal((await entries(page))[0].activityId, 'a');
    await page.waitForSelector('#timer-card:not(.hidden)');
    await page.context().setOffline(true);
    await page.click('.qs-btn[data-id="b"]');
    assert.match(await page.locator('#toast').textContent(), /Offline/);
    await page.click('#btn-stop-timer');
    assert.equal((await entries(page))[0].endTime, null);
    await page.context().setOffline(false);
    await page.waitForTimeout(400);
    assert.equal((await entries(page))[0].activityId, 'a');
    assert.equal((await entries(page))[0].endTime, null);
    await page.context().close();
    console.log('OK   Hurtige tryk giver én timer; offline start/stop køres aldrig senere');
  }
  {
    const server = { store: new Map(seed), pages: [], paused: new Set() };
    const p = await side({ clientId: 'telefon', transactionDelay: 100 }, server);
    const q = await side({ clientId: 'computer', transactionDelay: 100 }, server, 1280);
    await Promise.all([
      p.evaluate(async () => (await import('/tid/timer.js')).startTimer('a', null)),
      q.evaluate(async () => (await import('/tid/timer.js')).startTimer('b', null))
    ]);
    let open = [...server.store].filter(([path, data]) => path.includes('/entries/') && !data.endTime);
    assert.equal(open.length, 1);
    assert((await Promise.all([p.locator('#toast').textContent(), q.locator('#toast').textContent()])).some(t => t.includes('anden enhed')));
    await p.waitForSelector('#timer-card:not(.hidden)'); await q.waitForSelector('#timer-card:not(.hidden)');
    // Begge enheder skifter fra samme kendte timer. Kun ét skift vinder.
    await Promise.all([
      p.evaluate(async () => (await import('/tid/timer.js')).startTimer('a', 'forberedelse')),
      q.evaluate(async () => (await import('/tid/timer.js')).startTimer('b', 'retning'))
    ]);
    open = [...server.store].filter(([path, data]) => path.includes('/entries/') && !data.endTime);
    assert.equal(open.length, 1);
    // En enhed med gammel lyttertilstand må ikke stoppe den nye timer.
    await q.waitForTimeout(150); server.paused.add(q);
    const foer = [...server.store].filter(([path]) => path.includes('/entries/'));
    await p.evaluate(async () => (await import('/tid/timer.js')).startTimer('a', 'undervisning'));
    const efter = [...server.store].filter(([path]) => path.includes('/entries/'));
    assert.notDeepEqual(efter, foer);
    await q.evaluate(async () => (await import('/tid/timer.js')).stopActiveTimer());
    assert.deepEqual([...server.store].filter(([path]) => path.includes('/entries/')), efter);
    await p.context().close(); await q.context().close();
    console.log('OK   To enheder: samtidige starter/skift giver én vinder; gammel stophandling afvises');
  }
  {
    const page = await side({ seed: [...seed, aaben('e1'), aaben('e2', 10), aaben('e3', 15)] });
    await page.waitForSelector('#timer-status:not(.hidden)');
    assert.match(await page.locator('#timer-status').textContent(), /3 åbne timere/);
    assert.equal(await page.locator('#timer-status button').count(), 4);
    await page.click('.qs-btn[data-id="b"]');
    assert.equal((await entries(page)).length, 3);
    await page.locator('#timer-status button').last().click();
    await page.waitForFunction(() => __fs.entries().every(e => e.endTime));
    await page.context().close();
    console.log('OK   Alle åbne timere fra ældre klienter vises; nye starter afvises, og alle kan stoppes atomisk');
  }
  {
    const page = await side({ seed: [...seed, aaben('e1')], failTransaction: true });
    await page.waitForSelector('#timer-card:not(.hidden)');
    await page.click('.qs-btn[data-id="b"]');
    const e = await entries(page);
    assert.equal(e.length, 1); assert.equal(e[0].endTime, null);
    await page.context().close();
    console.log('OK   Fejlet transaktion efterlader den gamle timer helt uændret');
  }
  {
    const page = await side({ seed: [...seed, aaben('e1', 2)] });
    await page.waitForSelector('#timer-card:not(.hidden)');
    await page.click('.qs-btn[data-id="b"]');
    await page.waitForFunction(() => __fs.entries().length === 2);
    const e = await entries(page);
    assert.equal(e.find(x => x.id === 'e1').endMs, e.find(x => x.id !== 'e1').startMs);
    assert.equal(e.filter(x => !x.endTime).length, 1);
    await page.screenshot({ path: her + 'ud/timer-sikkerhed-mobil.png', fullPage: true });
    await page.setViewportSize({ width: 1280, height: 750 });
    await page.screenshot({ path: her + 'ud/timer-sikkerhed-desktop.png', fullPage: true });
    await page.context().close();
    console.log('OK   Skift lukker og starter ved nøjagtigt samme tidspunkt');
  }
  {
    const page = await side({ seed: [seed[0], [seed[1][0], { ...seed[1][1], type: 'hold' }], seed[2], aaben('e1', 120)] });
    await page.click('#btn-1-modul');
    await page.click('.modul-when-btn[data-when="nu"]');
    await page.click('#btn-do-modul');
    await page.waitForFunction(() => __fs.entries().some(e => e.isModule && !e.endTime));
    const e = await entries(page);
    assert.equal(e.find(x => x.id === 'e1').endMs, e.find(x => x.isModule).startMs);
    assert.equal(e.filter(x => !x.endTime).length, 1);
    await page.context().close();
    const expired = aaben('e1', 120);
    const auto = await side({ seed: [seed[0], seed[1], seed[2], [expired[0], { ...expired[1], plannedDurationMinutes: 95 }]] });
    await auto.waitForFunction(() => __fs.entries()[0].endTime);
    const [afsluttet] = await entries(auto);
    assert.equal(afsluttet.endMs, afsluttet.startMs + 95 * 60000);
    assert.equal(afsluttet.durationMinutes, 95);
    assert.equal(afsluttet.autoStopped, false);
    await auto.context().close();
    console.log('OK   Modulstart er atomisk; et udløbet modul stoppes præcist efter sin planlagte længde');
  }
  assert.deepEqual(fejl, []);
} finally { await browser.close(); }
