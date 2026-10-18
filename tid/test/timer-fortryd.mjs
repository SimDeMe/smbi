import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { lavSide, seed, aaben, fejl } from './timer-test.js';
const her = fileURLToPath(new URL('.', import.meta.url));
mkdirSync(her + 'ud', { recursive: true });
const browser = await chromium.launch();
const side = (cfg, server, width) => lavSide(browser, cfg, server, width);
const entries = p => p.evaluate(() => __fs.entries());
async function stop(p) {
  await p.waitForSelector('#timer-card:not(.hidden)');
  await p.click('#btn-stop-timer');
  await p.waitForSelector('#timer-handling:not(.hidden)');
}
async function ret(p, ms) {
  const tekst = await p.evaluate(ms => {
    const d = new Date(ms), to = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${to(d.getMonth()+1)}-${to(d.getDate())}T${to(d.getHours())}:${to(d.getMinutes())}${d.getSeconds() ? ":" + to(d.getSeconds()) : ""}`;
  }, ms);
  await p.fill('#timer-ret-tid', tekst);
  await p.click('#timer-ret-gem');
}
try {
  for (const age of [0.1, 20]) {
    const original = aaben('e1', age);
    original[1].note = 'Bevar min note';
    const p = await side({ seed: [...seed, original] });
    await stop(p);
    assert.equal((await entries(p)).length, age < 1 ? 0 : 1);
    await p.locator('#timer-fortryd').evaluate(el => { el.click(); el.click(); });
    await p.waitForSelector('#timer-card:not(.hidden)');
    const e = await entries(p);
    assert.equal(e.length, 1); assert.equal(e[0].id, 'e1'); assert.equal(e[0].endTime, null);
    assert.equal(e[0].startMs, original[1].startTime.__ts); assert.equal(e[0].note, 'Bevar min note');
    await p.context().close();
    console.log(`OK   Fortryd stop efter ${age} minutter gendanner samme timer, også når posten blev slettet`);
  }
  {
    const original = aaben('e1', 20);
    const p = await side({ seed: [...seed, original] });
    await p.click('.qs-btn[data-id="b"]');
    await p.waitForSelector('#timer-handling:not(.hidden)');
    await p.click('#timer-ret'); await p.waitForSelector('#timer-ret-sheet.open');
    assert.match(await p.locator('#timer-ret-forklaring').textContent(), /flyttes sammen/);
    const target = Math.floor((Date.now() - 10 * 60000) / 1000) * 1000;
    await ret(p, target);
    await p.waitForSelector('#timer-ret-sheet', { state: 'hidden' });
    let e = await entries(p);
    assert.equal(e.find(x => x.id === 'e1').endMs, target);
    assert.equal(e.find(x => x.id !== 'e1').startMs, target);
    assert.equal(e.filter(x => !x.endTime).length, 1);
    assert.equal(e.length, 2);
    await p.click('#timer-fortryd');
    await p.waitForFunction(() => __fs.entries().length === 1 && !__fs.entries()[0].endTime);
    e = await entries(p);
    assert.equal(e[0].id, 'e1'); assert.equal(e[0].startMs, original[1].startTime.__ts);
    await p.context().close();
    console.log('OK   Ret skift ti minutter tilbage flytter begge sider; fortryd fjerner skiftet uden overlap eller dobbelttælling');
  }
  {
    const p = await side({ seed: [...seed, aaben('e1', 0.1)] });
    await p.click('.qs-btn[data-id="b"]'); await p.waitForSelector('#timer-handling:not(.hidden)');
    assert.equal((await entries(p)).length, 1);
    await p.click('#timer-fortryd'); await p.waitForFunction(() => __fs.entries()[0].id === 'e1');
    assert.equal((await entries(p)).length, 1);
    await p.context().close();
    console.log('OK   Fortryd hurtigt skift gendanner den slettede original og fjerner den nye timer');
  }
  for (const width of [340, 390, 1280]) {
    const original = aaben('e1', 20);
    const p = await side({ seed: [...seed, original] }, null, width);
    await stop(p); await p.click('#timer-ret'); await p.waitForSelector('#timer-ret-sheet.open');
    assert.equal(await p.locator('#timer-ret-sheet').getAttribute('role'), 'dialog');
    await p.focus('#timer-ret-gem'); await p.keyboard.press('Tab');
    assert.equal(await p.evaluate(() => document.activeElement.id), 'timer-ret-luk');
    await p.keyboard.press('Escape'); await p.waitForSelector('#timer-ret-sheet', { state: 'hidden' });
    assert.equal(await p.evaluate(() => document.activeElement.id), 'timer-ret');
    await p.click('#timer-ret'); await p.waitForSelector('#timer-ret-sheet.open');
    const foer = await entries(p);
    await ret(p, Date.now() + 3600000);
    assert.match(await p.locator('#timer-ret-fejl').textContent(), /mellem timerens start og nu/);
    assert.deepEqual(await entries(p), foer);
    await ret(p, original[1].startTime.__ts - 60000);
    assert.match(await p.locator('#timer-ret-fejl').textContent(), /mellem timerens start og nu/);
    assert.deepEqual(await entries(p), foer);
    const target = Math.floor((Date.now() - 10 * 60000) / 1000) * 1000;
    await ret(p, target); await p.waitForSelector('#timer-ret-sheet', { state: 'hidden' });
    const [e] = await entries(p);
    assert.equal(e.endMs, target); assert.equal(e.durationMinutes, 10);
    assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await p.evaluate(() => { document.getElementById('main-content').scrollTop = 0; });
    await p.screenshot({ path: her + `ud/timer-fortryd-${width}.png`, fullPage: true });
    await p.click('#timer-ret'); await p.waitForSelector('#timer-ret-sheet.open');
    await p.waitForTimeout(300);
    const boks = await p.locator('#timer-ret-gem').boundingBox();
    assert(boks.y >= 0 && boks.y + boks.height <= 750, 'Gem er synlig i arket');
    await p.screenshot({ path: her + `ud/timer-ret-${width}.png`, fullPage: true });
    await p.context().close();
    console.log(`OK   ${width} px: ret stoppet tid, fremtid afvist, tastatur, fokus og layout`);
  }
  {
    const p = await side({ seed: [...seed, aaben('e1', 20)] });
    await stop(p); const foer = await entries(p);
    await p.context().setOffline(true); await p.click('#timer-fortryd');
    assert.match(await p.locator('#toast').textContent(), /Offline/);
    await p.context().setOffline(false); await p.waitForTimeout(250);
    assert.deepEqual(await entries(p), foer);
    await p.evaluate(() => { __fsCfg.failTransaction = true; });
    await p.click('#timer-fortryd'); await p.waitForTimeout(150);
    assert.deepEqual(await entries(p), foer);
    await p.evaluate(() => { __fsCfg.failTransaction = false; });
    await p.click('#timer-fortryd'); await p.waitForFunction(() => !__fs.entries()[0].endTime);
    await p.context().close();
    console.log('OK   Offline og fejlet fortryd skriver intet; handlingen kan prøves igen online');
  }
  {
    const p = await side({ seed: [...seed, aaben('e1', 20)] });
    await stop(p);
    await p.evaluate(() => { const path = 'users/u1/entries/e1'; __fs.put(path, { ...__fs.store.get(path), note: 'Rettet fra historikken' }); });
    const foer = await entries(p);
    await p.click('#timer-fortryd'); await p.waitForTimeout(150);
    assert.deepEqual(await entries(p), foer);
    assert.match(await p.locator('#toast').textContent(), /ændret/);
    await p.context().close();
    const q = await side({ seed: [...seed, aaben('e1', 20)] });
    await stop(q);
    await q.evaluate(() => __fs.put('users/u1/entries/manuel', { activityId: 'b', startTime: __fs.Timestamp.fromMillis(Date.now()-60000), endTime: __fs.Timestamp.now(), durationMinutes: 1 }));
    const foerOverlap = await entries(q);
    await q.click('#timer-fortryd'); await q.waitForTimeout(150);
    assert.deepEqual(await entries(q), foerOverlap);
    assert.match(await q.locator('#toast').textContent(), /overlappe/);
    await q.context().close();
    console.log('OK   Fortryd overskriver ikke manuelle rettelser og afviser nye overlap');
  }
  {
    const server = { store: new Map([...seed, aaben('e1', 20)]), pages: [], paused: new Set() };
    const p = await side({ clientId: 'telefon' }, server);
    const q = await side({ clientId: 'computer' }, server, 1280);
    await p.evaluate(async () => {
      const m = await import('/tid/timer-store.js');
      const p = __fs.entries()[0]; const { startMs, endMs, ...data } = p;
      window.__handling = await m.udfoerTimerHandling('u1', { poster: [data], kontrol: null });
    });
    await q.waitForSelector('#timer-card.hidden', { state: 'attached' });
    await q.evaluate(async () => (await import('/tid/timer.js')).startTimer('b', null));
    const foer = [...server.store];
    const err = await p.evaluate(async () => { try { await (await import('/tid/timer-store.js')).retTimerHandling(__handling, { fortryd: true }); } catch(e) { return e.message; } });
    assert.match(err, /ændret/); assert.deepEqual([...server.store], foer);
    await p.context().close(); await q.context().close();
    console.log('OK   En nyere timer på den anden enhed blokerer gammel fortryd uden delvise ændringer');
  }
  {
    const original = aaben('e1', 26 * 60);
    const p = await side({ seed: [[seed[0][0], { ...seed[0][1], autoStopAfterMinutes: 48 * 60 }], seed[1], seed[2], original] });
    await stop(p); await p.click('#timer-ret'); await p.waitForSelector('#timer-ret-sheet.open');
    const target = Math.floor((original[1].startTime.__ts + 60 * 60000) / 1000) * 1000;
    await ret(p, target); await p.waitForSelector('#timer-ret-sheet', { state: 'hidden' });
    assert.equal((await entries(p))[0].endMs, target);
    await p.context().close();
    console.log('OK   Ret tidspunkt bevarer den valgte dato ved en timer over midnat');
  }
  {
    const p = await side({ seed: [seed[0], [seed[1][0], { ...seed[1][1], type: 'hold' }], seed[2], aaben('e1', 20)] });
    await p.click('#btn-1-modul'); await p.click('.modul-when-btn[data-when="nu"]'); await p.click('#btn-do-modul');
    await p.waitForFunction(() => __fs.entries().some(e => e.isModule && !e.endTime));
    const modul = (await entries(p)).find(e => e.isModule);
    const planSlut = modul.startMs + modul.plannedDurationMinutes * 60000;
    await p.click('#timer-ret'); await p.waitForSelector('#timer-ret-sheet.open');
    await ret(p, Date.now() - 10 * 60000); await p.waitForSelector('#timer-ret-sheet', { state: 'hidden' });
    const rettet = (await entries(p)).find(e => e.isModule);
    assert.equal(rettet.startMs + rettet.plannedDurationMinutes * 60000, planSlut);
    await p.click('#timer-fortryd'); await p.waitForFunction(() => __fs.entries().length === 1 && __fs.entries()[0].id === 'e1' && !__fs.entries()[0].endTime);
    await stop(p); await p.click('#timer-ret'); await p.waitForSelector('#timer-ret-sheet.open');
    const foer = await entries(p);
    await p.evaluate(async () => (await import('/tid/timer.js')).initTimerView(null));
    await p.waitForSelector('#timer-ret-sheet', { state: 'hidden' });
    assert(await p.locator('#timer-handling').isHidden());
    assert.deepEqual(await entries(p), foer);
    await p.context().close();
    console.log('OK   Rettelse bevarer modulets planlagte slutning; fortryd og dialog ryddes ved kontoskift');
  }
  assert.deepEqual(fejl, []);
} finally { await browser.close(); }
