import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lavSide, fejl } from './timer-test.js';
const her = fileURLToPath(new URL('.', import.meta.url));
mkdirSync(her + 'ud', { recursive: true });
const event = { id: 'modul/52', activityId: '52', group: '2x Bio', title: 'Celler', start: '2026-10-19T08:10:00', end: '2026-10-19T09:45:00', timeZone: 'Europe/Copenhagen' };
const settings = ['users/u1/settings/config', { currentSchoolYear: '2026/27', autoShortBreaks: false }];
const hold = ['users/u1/activities/a', { name: '2x Bio', type: 'hold', order: 1, schoolYear: '2026/27' }];
const seed = [settings, hold, ['users/u1/lectioSchedules/2026-27', { fetchedAt: '2026-10-18T12:00:00Z', events: [event, { ...event, id: 'aflyst', cancelled: true }, { ...event, id: 'heldag', allDay: true }] }]];
const post = (id, fra, til, extra = {}) => [`users/u1/entries/${id}`, { activityId: 'a', workType: 'undervisning', startTime: { __ts: Date.parse(fra) }, endTime: { __ts: Date.parse(til) }, durationMinutes: (Date.parse(til) - Date.parse(fra)) / 60000, ...extra }];
const aaben = async page => {
  await page.evaluate(async e => (await import('/tid/lectio-kalender.js')).visLectio(e), event);
  await page.waitForSelector('#lectio-sheet.open');
};
const formular = async page => { await aaben(page); await page.getByRole('button', { name: 'Registrér undervisning', exact: true }).click(); await page.waitForSelector('#hist-sheet.open'); await page.waitForFunction(() => !document.getElementById('hist-overlap').textContent.startsWith('Kontrollerer')); await page.waitForTimeout(320); };
const browser = await chromium.launch();
try {
  for (const width of [340, 390, 1280]) {
    const p = await lavSide(browser, { seed }, null, width);
    await formular(p);
    assert.equal(await p.inputValue('#hist-act-sel'), 'a');
    assert.equal(await p.inputValue('#hist-start'), '08:10');
    assert.equal(await p.inputValue('#hist-end'), '09:45');
    assert(await p.isChecked('input[name="hist-wt"][value="undervisning"]'));
    assert.equal((await p.evaluate(() => __fs.entries())).length, 0);
    await p.keyboard.press('Tab'); assert(await p.locator('#hist-sheet').evaluate(e => e.contains(document.activeElement)));
    await p.screenshot({ path: her + `ud/lectio-registrering-${width}.png`, fullPage: true });
    assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await p.click('#hist-save-btn'); await p.waitForSelector('#hist-sheet', { state: 'hidden' });
    const [e] = await p.evaluate(() => __fs.entries());
    assert.equal(e.durationMinutes, 95); assert.equal(e.lectioEventId, event.id);
    assert.equal(e.startMs, Date.parse('2026-10-19T06:10:00Z'));
    await aaben(p); assert.match(await p.textContent('#lectio-sheet-body'), /Allerede registreret/);
    await p.getByRole('button', { name: 'Redigér registrering' }).click();
    await p.fill('#hist-note', 'Kontrolleret'); await p.click('#hist-save-btn');
    await p.waitForSelector('#hist-sheet', { state: 'hidden' });
    assert.equal((await p.evaluate(() => __fs.entries())).length, 1);
    await p.evaluate(async e => (await import('/tid/lectio-kalender.js')).visLectio(e), { ...event, id: 'ny-import/52', start: '2026-10-20T10:00:00', end: '2026-10-20T11:35:00' });
    assert.match(await p.textContent('#lectio-sheet-body'), /Allerede registreret/);
    await p.keyboard.press('Escape');
    // Sletning frigiver den faste reference; importen alene har stadig nul tid.
    await p.evaluate(async () => { const fs = await import('/tid/lager.js'); const { db } = await import('/tid/app.js'); await fs.deleteDoc(fs.doc(db, 'users/u1/entries/' + __fs.entries()[0].id)); });
    await formular(p); await p.click('#hist-save-btn'); await p.waitForSelector('#hist-sheet', { state: 'hidden' });
    assert.equal((await p.evaluate(() => __fs.entries())).length, 1);
    for (const extra of [{ cancelled: true }, { allDay: true }, { group: '' }]) {
      await p.evaluate(async e => (await import('/tid/lectio-kalender.js')).visLectio(e), { ...event, ...extra });
      assert.equal(await p.getByRole('button', { name: 'Registrér undervisning', exact: true }).count(), 0);
      await p.keyboard.press('Escape');
    }
    await p.context().close();
  }
  console.log('OK   Godkendt Lectio-registrering, redigering/sletning, ingen autoimport, tastatur og 340/390/1280 px');
  {
    const manual = post('manuel', '2026-10-19T06:10:20Z', '2026-10-19T07:45:20Z');
    const p = await lavSide(browser, { seed: [...seed, manual] }); await aaben(p);
    assert.match(await p.textContent('#lectio-sheet-body'), /Allerede registreret/); await p.context().close();
    const q = await lavSide(browser, { seed: [settings, [hold[0], { ...hold[1], name: 'Andet navn' }], manual] });
    await formular(q); assert.equal(await q.inputValue('#hist-act-sel'), '');
    await q.selectOption('#hist-act-sel', 'a'); await q.click('#hist-save-btn');
    assert.match(await q.textContent('#hist-overlap'), /allerede registreret/);
    assert.equal((await q.evaluate(() => __fs.entries())).length, 1); await q.context().close();
  }
  console.log('OK   Eksisterende manuel undervisning opdages; ukendt hold kræver valg og genkontrol');
  {
    const p = await lavSide(browser, { seed: [...seed, ['users/u1/activities/andet', { ...hold[1], order: 2 }]] });
    await formular(p); assert.equal(await p.inputValue('#hist-act-sel'), '');
    await p.selectOption('#hist-act-sel', 'a'); await p.click('#hist-save-btn');
    await p.waitForSelector('#hist-sheet', { state: 'hidden' });
    assert.equal((await p.evaluate(() => __fs.entries()))[0].activityId, 'a');
    await p.context().close();
  }
  console.log('OK   To hold med samme navn kræver et aktivt valg');
  {
    const p = await lavSide(browser, { seed: [...seed, post('overlap', '2026-10-17T10:00:00Z', '2026-10-19T06:30:00Z', { workType: 'forberedelse' })] });
    await formular(p); assert.match(await p.textContent('#hist-overlap'), /Overlapper med/);
    await p.click('#hist-save-btn'); assert.equal((await p.evaluate(() => __fs.entries())).length, 1);
    await p.check('#hist-lectio-bekraeft');
    await p.fill('#hist-start', '08:15'); assert(!await p.isChecked('#hist-lectio-bekraeft'));
    await p.waitForFunction(() => document.getElementById('hist-overlap').textContent.startsWith('OBS'));
    await p.check('#hist-lectio-bekraeft'); await p.click('#hist-save-btn'); await p.waitForSelector('#hist-sheet', { state: 'hidden' });
    assert.equal((await p.evaluate(() => __fs.entries())).length, 2); await p.context().close();
  }
  console.log('OK   Lange overlap fra tidligere dage opdages; ændret tidspunkt kræver ny godkendelse');
  {
    const server = { store: new Map(seed), pages: [], paused: new Set() };
    const p = await lavSide(browser, { transactionDelay: 150 }, server);
    const q = await lavSide(browser, { transactionDelay: 150 }, server, 1280);
    await Promise.all([formular(p), formular(q)]);
    await Promise.all([p.click('#hist-save-btn'), q.click('#hist-save-btn')]);
    await p.waitForTimeout(600);
    assert.equal([...server.store.keys()].filter(k => k.includes('/entries/')).length, 1);
    assert((await Promise.all([p.textContent('#toast'), q.textContent('#toast')])).some(t => t.includes('allerede registreret')));
    await p.context().close(); await q.context().close();
  }
  console.log('OK   To samtidige enheder opretter kun én post');
  {
    const p = await lavSide(browser, { seed }); await formular(p);
    await p.context().setOffline(true); await p.click('#hist-save-btn');
    assert.equal((await p.evaluate(() => __fs.entries())).length, 0);
    await p.context().setOffline(false); await p.waitForTimeout(100);
    assert.equal((await p.evaluate(() => __fs.entries())).length, 0);
    await p.click('#hist-save-btn'); await p.waitForSelector('#hist-sheet', { state: 'hidden' });
    assert.equal((await p.evaluate(() => __fs.entries())).length, 1); await p.context().close();
    const q = await lavSide(browser, { seed, failTransaction: true }); await formular(q); await q.click('#hist-save-btn');
    await q.waitForFunction(() => !document.getElementById('hist-save-btn').disabled);
    assert.equal((await q.evaluate(() => __fs.entries())).length, 0);
    await q.evaluate(() => __auth.change(null)); await q.waitForSelector('#hist-sheet', { state: 'hidden' });
    await q.context().close();
  }
  console.log('OK   Offline, transaktionsfejl og logout efterlader ingen skjulte registreringer');
  {
    const p = await lavSide(browser, { seed, serverAvailable: false }); await aaben(p);
    assert.match(await p.textContent('#lectio-sheet-body'), /Kunne ikke kontrollere/);
    await p.evaluate(() => __fs.server(true)); await p.getByRole('button', { name: 'Kontrollér igen', exact: true }).click();
    await p.getByRole('button', { name: 'Registrér undervisning', exact: true }).click();
    await p.waitForSelector('#hist-sheet.open');
    await p.evaluate(() => __fs.server(false)); await p.click('#hist-save-btn');
    await p.waitForFunction(() => !document.getElementById('hist-save-btn').disabled);
    assert.equal((await p.evaluate(() => __fs.entries())).length, 0); await p.context().close();
    const q = await lavSide(browser, { seed, readDelay: 100 });
    await formular(q); await q.click('#hist-save-btn');
    await q.evaluate(() => __auth.change({ uid: 'u2' }));
    await q.waitForTimeout(300);
    assert.equal(await q.evaluate(() => [...__fs.store.keys()].filter(k => k.includes('/entries/')).length), 0);
    await q.context().close();
  }
  console.log('OK   Serverfejl afviser gemning; kontoskift under opslag opretter intet');
  {
    const p = await lavSide(browser, { seed });
    const nat = { ...event, id: 'nat', activityId: '53', start: '2026-10-24T23:30:00', end: '2026-10-25T03:30:00' };
    await p.evaluate(async e => (await import('/tid/lectio-kalender.js')).visLectio(e), nat);
    await p.getByRole('button', { name: 'Registrér undervisning', exact: true }).click();
    await p.click('#hist-save-btn'); await p.waitForSelector('#hist-sheet', { state: 'hidden' });
    const [e] = await p.evaluate(() => __fs.entries());
    assert.equal(e.durationMinutes, 300); // midnat og skift til vintertid
    assert.equal(e.endMs, Date.parse('2026-10-25T02:30:00Z'));
    await p.context().close();
  }
  console.log('OK   Lectio-tider hen over midnat og vintertid bevarer det rigtige tidsrum');
  {
    // Med korte pauser slået til: hullet før og efter modulet bliver pauser
    const foer = post('foer', '2026-10-19T05:00:00Z', '2026-10-19T06:00:00Z');   // 07:00–08:00
    const efter = post('efter', '2026-10-19T07:55:00Z', '2026-10-19T08:30:00Z'); // 09:55–10:30
    const p = await lavSide(browser, { seed: [[settings[0], { currentSchoolYear: '2026/27' }], hold, seed[2], foer, efter] });
    await p.waitForTimeout(300);
    assert.equal((await p.evaluate(() => __fs.entries().filter(e => e.isBreak))).length, 0);   // 115 min: tom tid
    await formular(p); await p.click('#hist-save-btn'); await p.waitForSelector('#hist-sheet', { state: 'hidden' });
    await p.waitForTimeout(300);
    const pauser = (await p.evaluate(() => __fs.entries().filter(e => e.isBreak))).map(e => [e.startMs, e.endMs]).sort((a, b) => a[0] - b[0]);
    assert.deepEqual(pauser, [[Date.parse('2026-10-19T06:00:00Z'), Date.parse('2026-10-19T06:10:00Z')],
      [Date.parse('2026-10-19T07:45:00Z'), Date.parse('2026-10-19T07:55:00Z')]]);
    await p.context().close();
  }
  console.log('OK   Registrering fra Lectio lukker de korte huller før og efter modulet');
  assert.deepEqual(fejl, []);
} finally { await browser.close(); }
