// Kvitteringer og offlinekø mod falsk Firebase; ingen produktionsdata.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lavSide, seed, fejl } from './timer-test.js';
const her = fileURLToPath(new URL('.', import.meta.url));
mkdirSync(her + 'ud', { recursive: true });
const browser = await chromium.launch();
const status = (p, s) => p.waitForFunction(s => document.querySelector('#lagringsstatus').dataset.tilstand === s, s);
const tekst = p => p.locator('#lagringsstatus-tekst').textContent();
const side = (cfg = {}, server = null, width = 390) => lavSide(browser, { sync: true, ...cfg }, server, width);
async function skriv(p, metode = 'updateDoc', sti = 'activities/a') {
  await p.evaluate(async ({ metode, sti }) => {
    const fs = await import('/tid/lager.js'), { db } = await import('/tid/app.js');
    const ref = fs.doc(db, 'users/u1/' + sti);
    const args = metode === 'deleteDoc' ? [ref] : [ref, { name: 'Rettet navn' }];
    window.skriveResultat = null;
    fs[metode](...args).then(() => window.skriveResultat = 'ok', err => window.skriveResultat = err.code);
  }, { metode, sti });
}
try {
  {
    const p = await side({ serverAvailable: false });
    await status(p, 'afventer');
    assert.equal(await p.locator('#lagringsstatus-titel').textContent(), 'Afventer serveren');
    await p.context().setOffline(true); await status(p, 'offline');
    await p.context().setOffline(false); await status(p, 'afventer');
    assert.match(await tekst(p), /Forbindelse alene/);
    await p.evaluate(() => __fs.server(true)); await status(p, 'synkroniseret');
    await p.context().close();
    console.log('OK   Cache og genvundet forbindelse tæller først som synkroniseret efter serversvar');
  }
  {
    const p = await side({ delay: [['lectioSchedules', 1500]] });
    await status(p, 'afventer');
    await status(p, 'synkroniseret');
    await p.context().close();
    console.log('OK   Alle aktive lyttere skal have serverbekræftelse, også en tom Lectio-samling');
  }
  {
    const server = { store: new Map(seed), pages: [], paused: new Set() };
    const p = await side({ holdWrites: true }, server, 340);
    const q = await side({}, server, 1280);
    await status(p, 'synkroniseret'); await status(q, 'synkroniseret');
    await p.context().setOffline(true); await status(p, 'offline');
    await skriv(p);
    await p.waitForFunction(() => document.querySelector('#lagringsstatus-tekst').textContent.includes('Gemt på denne enhed'));
    assert.match(await tekst(p), /endnu ikke.*anden enhed/);
    assert.equal(await q.evaluate(() => __fs.store.get('users/u1/activities/a').name), 'SRP');
    await p.locator('#lagringsstatus summary').click();
    assert.equal(await p.locator('#lagringsstatus-kontroller').isDisabled(), true);
    await p.context().setOffline(false); await status(p, 'afventer');
    assert.equal(await p.evaluate(() => window.skriveResultat), null);
    await p.screenshot({ path: her + 'ud/lagringsstatus-340.png', fullPage: true });
    for (const width of [340, 390, 1280]) {
      await p.setViewportSize({ width, height: 750 });
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await p.locator('#lagringsstatus summary').focus();
      await p.keyboard.press('Enter');
      assert.equal(await p.locator('#lagringsstatus').getAttribute('open'), null);
      await p.keyboard.press('Enter');
      assert.notEqual(await p.locator('#lagringsstatus').getAttribute('open'), null);
      await p.keyboard.press('Tab');
      assert.equal(await p.evaluate(() => document.activeElement.id), 'lagringsstatus-kontroller');
    }
    await p.evaluate(() => __fs.ack());
    await status(p, 'synkroniseret');
    await q.waitForFunction(() => __fs.store.get('users/u1/activities/a').name === 'Rettet navn');
    assert.equal(await p.evaluate(() => window.skriveResultat), 'ok');
    assert.match(await tekst(p), /anden enhed kan hente/);
    await p.context().close(); await q.context().close();
    console.log('OK   To enheder: lokal ændring vises som ventende, indtil serveren kvitterer; mobil/desktop og tastatur virker');
  }
  {
    const p = await side({ pendingAtStart: true, pendingVisible: false });
    await status(p, 'afventer');
    // Alle snapshots siger server og ingen pending writes. Den persistente
    // kø indeholder stadig en ændring uden for de viste queries.
    await p.evaluate(() => __fs.ack()); await status(p, 'synkroniseret');
    await p.evaluate(() => __fs.holdWrites(true));
    await skriv(p, 'deleteDoc', 'entries/gammel-post'); await status(p, 'gemmer');
    await p.evaluate(() => __fs.ack()); await status(p, 'synkroniseret');
    await p.evaluate(async () => {
      const fs = await import('/tid/lager.js'), { db } = await import('/tid/app.js');
      const b = fs.writeBatch(db);
      b.set(fs.doc(db, 'users/u1/settings/udenfor-visning'), { test: true });
      b.commit().catch(() => {});
    });
    await status(p, 'gemmer');
    await p.evaluate(() => __fs.ack()); await status(p, 'synkroniseret');
    await p.context().close();
    console.log('OK   Opstartskø, sletning og batch uden for de viste queries kan ikke give falsk synkroniseret');
  }
  {
    const p = await side({ holdWrites: true });
    await status(p, 'synkroniseret');
    await skriv(p); await status(p, 'afventer');
    await p.evaluate(() => __fs.ack('permission-denied')); await status(p, 'fejl');
    assert.equal(await p.evaluate(() => __fs.store.get('users/u1/activities/a').name), 'SRP');
    assert.match(await tekst(p), /rigtige Google-konto/);
    assert.match(await tekst(p), /sendes ikke igen automatisk/);
    await p.context().setOffline(true); await p.context().setOffline(false);
    await status(p, 'fejl');
    await p.locator('#lagringsstatus summary').click();
    await p.click('#lagringsstatus-kontroller'); await status(p, 'synkroniseret');
    assert.equal(await p.evaluate(() => __fs.store.get('users/u1/activities/a').name), 'SRP');
    await p.evaluate(() => __fs.listenerError('activities'));
    await status(p, 'fejl');
    await p.screenshot({ path: her + 'ud/lagringsstatus-fejl.png', fullPage: true });
    await p.click('#lagringsstatus-kontroller'); await status(p, 'synkroniseret');
    await p.evaluate(() => __fs.listenerError('entries', 'unavailable'));
    await status(p, 'fejl');
    assert.equal(await p.locator('#hjem-total').textContent(), 'Kunne ikke hentes');
    await p.click('#lagringsstatus-kontroller'); await status(p, 'synkroniseret');
    await p.waitForFunction(() => document.querySelector('#hjem-total').textContent === '0m');
    await p.evaluate(() => __fs.holdWrites(false));
    await skriv(p); await status(p, 'synkroniseret');
    assert.equal(await p.evaluate(() => window.skriveResultat), 'ok');
    await p.context().close();
    console.log('OK   Afviste ændringer rulles tilbage; fejl forklares, overlever netværksskift og kan kontrolleres uden genafsendelse');
  }
  {
    const p = await side({ holdWrites: true });
    await status(p, 'synkroniseret');
    await skriv(p); await status(p, 'afventer');
    await p.evaluate(async () => {
      const { initLagringsstatus } = await import('/tid/lager.js');
      const { db } = await import('/tid/app.js');
      initLagringsstatus(db, null);
    });
    assert.equal(await p.locator('#lagringsstatus').isHidden(), true);
    await p.evaluate(() => __fs.ack('permission-denied'));
    await p.evaluate(async () => {
      const fs = await import('/tid/lager.js'), { db } = await import('/tid/app.js');
      fs.initLagringsstatus(db, 'u2');
      fs.onSnapshot(fs.collection(db, 'users/u2/entries'), () => {});
      fs.lagringStartet();
    });
    await status(p, 'synkroniseret');
    await p.context().close();
    console.log('OK   Logout og kontoskift rydder gamle statusser, lyttere og sene skrivefejl');
  }
  {
    const p = await side();
    await p.click('.nav-btn[data-view="historik"]');
    await p.click('.nav-btn[data-view="aktiviteter"]');
    await p.evaluate(() => __auth.change(null));
    assert.equal(await p.locator('#lagringsstatus').isHidden(), true);
    await p.evaluate(() => __auth.change({ uid: 'u1' }));
    await status(p, 'synkroniseret');
    await skriv(p);
    await p.waitForFunction(() => window.skriveResultat === 'ok');
    await p.waitForFunction(() => document.querySelector('.qs-btn[data-id="a"]').textContent.includes('Rettet navn'));
    // Samme uid må ikke stoppe de lyttere, visningerne allerede bruger.
    await p.evaluate(() => __auth.change({ uid: 'u1' }));
    await status(p, 'synkroniseret');
    await p.evaluate(async () => {
      __fs.put('users/u2/settings/config', { currentSchoolYear: '2026/27' });
      __fs.put('users/u2/activities/a', { name: 'Anden konto', type: 'opgave', order: 1, schoolYear: '2026/27' });
      await __auth.change({ uid: 'u2' });
    });
    await p.waitForFunction(() => document.querySelector('.qs-btn[data-id="a"]').textContent.includes('Anden konto'));
    await status(p, 'synkroniseret');
    await p.click('.nav-btn[data-view="historik"]');
    await status(p, 'synkroniseret');
    assert.equal(await p.locator('.kal-block').count(), 0);
    await p.context().close();
    console.log('OK   Appens lyttere virker efter genlogin og følger en ny konto, også efter åbnet Historik og Aktiviteter');
  }
  {
    const p = await side({ transactionDelay: 600 });
    await status(p, 'synkroniseret');
    await p.click('.qs-btn[data-id="a"]');
    await status(p, 'gemmer');
    assert.match(await tekst(p), /afventer serverens bekræftelse/);
    await status(p, 'synkroniseret');
    await p.evaluate(() => window.__fsCfg.failTransaction = true);
    await p.click('.qs-btn[data-id="b"]'); await status(p, 'fejl');
    assert.match(await tekst(p), /Kontrollér forbindelsen/);
    assert.equal(await p.evaluate(() => __fs.entries().filter(e => !e.endTime).length), 1);
    await p.context().close();
    console.log('OK   Timertransaktioner vises som i gang til serverkvittering; en transaktionsfejl bevarer timeren og giver hjælp');
  }
  assert.deepEqual(fejl, []);
} finally { await browser.close(); }
