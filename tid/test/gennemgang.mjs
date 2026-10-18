// Frivillig gennemgang mod falsk Firebase. Ingen produktionsdata.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lavSide, seed, fejl } from './timer-test.js';
const her = fileURLToPath(new URL('.', import.meta.url));
mkdirSync(her + 'ud', { recursive: true });
const ts = s => ({ __ts: Date.parse(s) });
const post = (id, fra, til, extra = {}) => [`users/u1/entries/${id}`, {
  activityId: 'a', workType: null, startTime: ts(fra), endTime: til ? ts(til) : null,
  durationMinutes: til ? (Date.parse(til) - Date.parse(fra)) / 60000 : null, note: '', ...extra
}];
const data = [...seed,
  ['users/u1/activities/a', { ...seed[1][1], name: 'SRP & <vejledning> med et meget langt aktivitetsnavn' }],
  post('midnat', '2026-10-01T21:30:00Z', '2026-10-01T22:30:00Z'),
  post('fri', '2026-10-02T06:00:00Z', '2026-10-02T07:00:00Z', { activityId: null }),
  post('auto', '2026-10-02T06:30:00Z', '2026-10-02T08:00:00Z', { autoStopped: true }),
  post('pause', '2026-10-02T08:00:00Z', '2026-10-02T08:15:00Z', { activityId: null, isBreak: true }),
  post('sidste', '2026-10-02T09:00:00Z', '2026-10-02T09:30:00Z'),
  post('fremtid', '2026-10-02T13:00:00Z', '2026-10-02T14:00:00Z'),
  ['users/u1/lectioSchedules/2026-27', { events: [{ id: 'plan', start: '2026-10-02T10:15:00', end: '2026-10-02T11:00:00', group: 'Planlagt' }] }]
];
const browser = await chromium.launch();
async function side(width = 390, cfg = {}, server = null) {
  const p = await lavSide(browser, { seed: data, sync: true, ...cfg }, server, width);
  await p.clock.setFixedTime(new Date('2026-10-02T10:00:00Z'));
  await p.waitForFunction(() => document.querySelector('#gennemgang-antal').textContent === '4 til kontrol');
  return p;
}
const knap = (p, id, handling) => p.locator(`#hjem-gennemgang button[data-post="${id}"][data-handling="${handling}"]`);
const aabn = p => p.locator('#hjem-gennemgang summary').click();
try {
  for (const width of [340, 390, 1280]) {
    const p = await side(width);
    assert.equal(await p.locator('#hjem-gennemgang').getAttribute('open'), null);
    const antal = await p.evaluate(() => __fs.entries().length);
    const total = await p.locator('#hjem-total').textContent();
    await p.locator('#hjem-gennemgang summary').focus();
    await p.keyboard.press('Enter');
    assert.match(await p.locator('#gennemgang-liste').textContent(), /Ubundet tid · Overlap/);
    assert.match(await p.locator('#gennemgang-liste').textContent(), /Overlap · Automatisk stoppet/);
    assert.match(await p.locator('#gennemgang-liste').textContent(), /SRP & <vejledning> med et meget langt aktivitetsnavn/);
    assert.equal(await p.locator('#gennemgang-liste vejledning').count(), 0);
    assert.match(await p.locator('#gennemgang-liste').textContent(), /Mulig pause · 10:15–11:00/);
    assert.equal(await knap(p, 'pause', 'accepter').count(), 0);
    assert.equal(await knap(p, 'fremtid', 'ret').count(), 0);
    assert.equal(await p.locator('[data-hul]').count(), 2);
    assert.equal(await p.evaluate(() => __fs.entries().length), antal, 'Åbning udfylder aldrig huller');
    assert.equal(await p.locator('#hjem-total').textContent(), total);
    assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await p.locator('#hjem-gennemgang').scrollIntoViewIfNeeded();
    await p.screenshot({ path: her + `ud/gennemgang-${width}.png`, fullPage: true });
    // Accept gælder kun ubundet tid; overlap forsvinder ikke ved accept.
    await knap(p, 'fri', 'accepter').click();
    await p.waitForSelector('#gennemgang-accepterede button[data-post="fri"]');
    assert.match(await p.locator('#gennemgang-liste').textContent(), /Overlap/);
    assert.equal(await knap(p, 'fri', 'accepter').count(), 0);
    assert.equal(await p.locator('#hjem-total').textContent(), total);
    assert.equal(await p.evaluate(() => __fs.store.get('users/u1/entries/fri').activityId), null);
    // Enter/Tab og fokus består efter urets gentegning.
    await knap(p, 'fri', 'fortryd').focus();
    await p.waitForTimeout(1100);
    assert.equal(await p.evaluate(() => document.activeElement.dataset.handling), 'fortryd');
    await p.keyboard.press('Enter');
    await knap(p, 'fri', 'accepter').waitFor();
    // Ret fra listen genbruger originalens id; sletning/ændring opdaterer listen.
    await knap(p, 'auto', 'ret').click();
    await p.waitForSelector('#hist-sheet.open');
    assert.equal(await p.inputValue('#hist-start'), '08:30');
    await p.fill('#hist-start', '09:00');
    await p.click('#hist-save-btn');
    await p.waitForSelector('#hist-sheet', { state: 'hidden' });
    await p.waitForFunction(() => !document.querySelector('#gennemgang-liste').textContent.includes('Overlap'));
    assert.equal(await p.evaluate(() => __fs.entries().length), antal);
    await p.locator('[data-hul="1"]').click();
    await p.waitForSelector('#hist-sheet.open');
    assert.equal(await p.inputValue('#hist-start'), '10:15');
    assert.equal(await p.inputValue('#hist-end'), '11:00');
    await p.keyboard.press('Escape');
    await p.waitForSelector('#hist-sheet', { state: 'hidden' });
    assert.equal(await p.evaluate(() => document.activeElement.dataset.hul), '1');
    assert.equal(await p.evaluate(() => __fs.entries().length), antal);
    await p.context().close();
    console.log(`OK   ${width} px: frivillig fold-ud, overlap/auto-stop, pauser, accept uden beregningsændring, rettelse, hul og tastatur`);
  }
  {
    const p = await side(); await aabn(p);
    await knap(p, 'fri', 'accepter').click();
    await p.waitForSelector('#gennemgang-accepterede button[data-post="fri"]');
    // En ny enhed læser den gemte accept; senere ændring gør den ugyldig.
    const gemt = await p.evaluate(() => [...__fs.store].map(([sti, d]) => [sti, { ...d, startTime: d.startTime?.toMillis ? { __ts: d.startTime.toMillis() } : d.startTime, endTime: d.endTime?.toMillis ? { __ts: d.endTime.toMillis() } : d.endTime }]));
    const q = await side(390, { seed: gemt }); await aabn(q);
    assert.equal(await knap(q, 'fri', 'fortryd').count(), 1);
    await q.evaluate(() => { const sti = 'users/u1/entries/fri'; __fs.put(sti, { ...__fs.store.get(sti), endTime: __fs.Timestamp.fromMillis(Date.parse('2026-10-02T07:10:00Z')) }); });
    await knap(q, 'fri', 'accepter').waitFor();
    assert.equal(await knap(q, 'fri', 'fortryd').count(), 0);
    await q.evaluate(() => { __fs.store.delete('users/u1/entries/auto'); __fs.notify(); });
    await knap(q, 'auto', 'ret').waitFor({ state: 'detached' });
    await p.context().close(); await q.context().close();
    console.log('OK   Accept følger kontodata til ny browser og bliver ugyldig efter ændring af tidsrummet');
  }
  {
    const server = { store: new Map(data), pages: [], paused: new Set() };
    const p = await side(390, { holdWrites: true }, server);
    const q = await side(390, {}, server);
    await aabn(p); await aabn(q);
    await p.context().setOffline(true);
    await knap(p, 'fri', 'accepter').click();
    await p.waitForSelector('#gennemgang-accepterede button[data-post="fri"]');
    assert.match(await p.locator('#lagringsstatus-tekst').textContent(), /Gemt på denne enhed/);
    assert.equal(await knap(q, 'fri', 'fortryd').count(), 0);
    await p.context().setOffline(false);
    await p.evaluate(() => __fs.ack());
    await knap(q, 'fri', 'fortryd').waitFor();
    // Afvist ændring rulles tilbage og kan forsøges igen.
    await knap(p, 'fri', 'fortryd').click();
    await p.evaluate(() => __fs.ack('permission-denied'));
    await p.waitForFunction(() => document.querySelector('#gennemgang-fejl').textContent.includes('Kunne ikke gemme'));
    await knap(p, 'fri', 'fortryd').waitFor({ state: 'visible' });
    assert.equal(await knap(p, 'fri', 'fortryd').isEnabled(), true);
    await p.evaluate(() => __fs.listenerError('entries'));
    await p.waitForFunction(() => document.querySelector('#gennemgang-antal').textContent === 'Kunne ikke hentes');
    assert.equal(await p.locator('#hjem-gennemgang [data-post]').count(), 0);
    await p.locator('#lagringsstatus summary').click(); await p.click('#lagringsstatus-kontroller');
    await p.waitForFunction(() => document.querySelector('#gennemgang-antal').textContent === '4 til kontrol');
    // Logout/kontoskift rydder accept, liste og åbent panel, også ved sent svar.
    await knap(p, 'fri', 'fortryd').click();
    await p.evaluate(() => __auth.change(null));
    await p.evaluate(() => __fs.ack('permission-denied'));
    await p.evaluate(async () => {
      __fs.put('users/u2/settings/config', { currentSchoolYear: '2026/27' });
      __fs.put('users/u2/activities/a', { name: 'Anden konto', type: 'opgave', schoolYear: '2026/27' });
      await __auth.change({ uid: 'u2' });
    });
    await p.waitForFunction(() => document.querySelector('#gennemgang-antal').textContent === 'Intet til kontrol');
    assert.equal(await p.locator('#gennemgang-accepterede').textContent(), '');
    assert.equal(await p.locator('#gennemgang-fejl').textContent(), '');
    assert.equal(await p.locator('#hjem-gennemgang').getAttribute('open'), null);
    await p.context().close(); await q.context().close();
    console.log('OK   To enheder, offline/serverkvittering, rollback, genforsøg efter lytterfejl og kontoskift med sent svar');
  }
  {
    const p = await side();
    const model = await p.evaluate(async () => {
      const { gennemgaaDag, faellesNoegle } = await import('/tid/gennemgang.js');
      const t = s => __fs.Timestamp.fromMillis(Date.parse(s));
      const e = (id, fra, til, extra = {}) => ({ id, activityId: 'a', startTime: t(fra), endTime: til ? t(til) : null, ...extra });
      const liste = [
        e('lang', '2026-10-01T23:00:00Z', '2026-10-02T09:00:50Z'),
        e('indre', '2026-10-02T06:00:00Z', '2026-10-02T07:00:00Z'),
        e('sekunder', '2026-10-02T09:01:10Z', '2026-10-02T09:10:00Z'),
        e('pause', '2026-10-02T09:10:00Z', '2026-10-02T09:20:00Z', { isBreak: true, activityId: null }),
        e('aaben', '2026-10-02T09:20:00Z', null, { activityId: null }),
        e('fremtid', '2026-10-02T11:00:00Z', '2026-10-02T12:00:00Z', { autoStopped: true }),
        e('nul', '2026-10-02T08:00:00Z', '2026-10-02T08:00:00Z')
      ];
      const r = gennemgaaDag(liste, new Date('2026-10-02T10:00:00Z'));
      const foer = gennemgaaDag(liste, new Date('2026-10-02T09:30:00Z'));
      const efter = gennemgaaDag(liste, new Date('2026-10-02T22:01:00Z'));
      const stor = gennemgaaDag(Array.from({ length: 550 }, (_, i) => e('u' + i, '2026-10-02T06:00:00Z', '2026-10-02T07:00:00Z', { activityId: null })), new Date('2026-10-02T10:00:00Z'));
      const accept = e('accept', '2026-10-02T06:00:00Z', '2026-10-02T07:00:00Z', { activityId: null });
      accept.faellesTidAccepteret = faellesNoegle(accept);
      const gammel = faellesNoegle(accept);
      accept.startTime = t('2026-10-02T06:10:00Z');
      accept.faellesTidAccepteret = gammel;
      const forældet = gennemgaaDag([accept], new Date('2026-10-02T10:00:00Z'));
      return { ids: r.kontrol.map(p => p.e.id).sort(), huller: r.huller.length, foer: foer.huller.length, efter: efter.kontrol.map(p => p.e.id), stor: stor.kontrol.length, forældet: forældet.kontrol.length };
    });
    assert.deepEqual(model, { ids: ['indre', 'lang'], huller: 0, foer: 0, efter: [], stor: 550, forældet: 1 });
    await p.clock.setFixedTime(new Date('2026-10-02T22:01:00Z'));
    await p.waitForFunction(() => document.querySelector('#gennemgang-antal').textContent === 'Intet til kontrol');
    assert.equal(await p.locator('#gennemgang-accepterede').textContent(), '');
    assert.deepEqual(fejl, []);
    await p.context().close();
    console.log('OK   Indlejrede intervaller, sekunder, pauser, aktiv timer, fremtid, nulvarighed, 550 poster, forældet accept og midnat');
  }
} finally { await browser.close(); }
