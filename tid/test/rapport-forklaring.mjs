import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lavSide, fejl } from './timer-test.js';
const her = fileURLToPath(new URL('.', import.meta.url)); mkdirSync(her + 'ud', { recursive: true });
const aar = '2025/26';
const settings = ['users/u1/settings/config', { currentSchoolYear: aar, normHours: 1000, portefoljeAndet: { [aar]: [{ navn: 'Frikøb <TR>', timer: 100 }] }, normFaktorer: { [aar]: { faktor: 2.5, reduktion: .85 } }, ferie: { [aar]: [] }, ferieMedElev: { [aar]: true }, periodeDatoer: { [aar]: { skolestart: '2025-08-12', gfSlut: '2025-10-29', srStart: '2025-11-05', eksamenFra: '2025-06-01', eksamenTil: '2025-06-24' } } }];
const akt = (id, name, extra = {}) => [`users/u1/activities/${id}`, { name, type: 'opgave', order: 1, schoolYear: aar, budgetHours: 60, optjening: 'manuel', fremdrift: 25, ...extra }];
const post = (id, activityId, minutes, extra = {}) => [`users/u1/entries/${id}`, { activityId, workType: null, startTime: { __ts: Date.parse('2025-10-02T06:00:00Z') }, endTime: { __ts: Date.parse('2025-10-02T06:00:00Z') + minutes * 60000 }, durationMinutes: minutes, ...extra }];
const seed = [settings, akt('a', 'Opgave <A>'), akt('b', 'Afsluttet', { budgetHours: 40, optjening: 'afslutning', isArchived: true }), post('e1', 'a', 60), post('e2', 'b', 120), post('e3', null, 30), post('pause', null, 10, { isBreak: true })];
const tekst = async (p, s) => (await p.locator(s).innerText()).replace(/\s+/g, ' ').trim();
const browser = await chromium.launch();
try {
  for (const width of [340, 390, 1280]) {
    const p = await lavSide(browser, { seed }, null, width);
    await p.clock.setFixedTime(new Date('2026-10-02T10:00:00Z'));
    await p.click('.nav-btn[data-view="rapporter"]');
    await p.waitForFunction(() => document.querySelector('.rapport-total')?.textContent === '3t 40m');
    const kort = p.locator('.rapport-hovedtal');
    assert.equal(await kort.count(), 3);
    assert.deepEqual(await p.locator('.rapport-hovedtal-navn').allTextContents(), ['Registreret tid', 'Afvigelse fra forventet belastning', 'Akkordsaldo']);
    // Uafhængige referenceværdier: 60+120+30+10=220 min; fuldt forløbet
    // normperiode: 1000−100=900 t belastning; optjent 60×25%+40=55 t.
    assert.equal(await tekst(p, '[data-hovedtal="belastning"] .rapport-hovedtal-tal'), '−896t 20m');
    assert.equal(await tekst(p, '.akkord-saldo-tal'), '+51t 20m');
    assert.match(await tekst(p, '[data-hovedtal="belastning"] summary'), /Plus = mere end forventet/);
    assert.match(await tekst(p, '[data-hovedtal="akkord"] > summary'), /Plus = optjent mere end brugt/);
    const summary = p.locator('[data-hovedtal="registreret"] summary');
    await summary.focus(); await p.keyboard.press('Enter');
    assert(await p.locator('[data-hovedtal="registreret"]').evaluate(d => d.open));
    assert.match(await tekst(p, '[data-hovedtal="registreret"]'), /Aktive aktiviteter 1t Afsluttede aktiviteter 2t Ubundet tid 30m Korte pauser \(fælles tid\) 10m/);
    await p.locator('[data-hovedtal="belastning"] summary').click();
    assert.match(await tekst(p, '[data-hovedtal="belastning"]'), /Forventet belastning 900t/);
    assert.match(await tekst(p, '[data-hovedtal="belastning"]'), /Opgave <A> 860t Afsluttet 40t/);
    await p.locator('[data-hovedtal="akkord"] > summary').click();
    assert.match(await tekst(p, '[data-hovedtal="akkord"]'), /Optjent på opgaver og hold 55t Brugt \(inkl. fælles tid og pauser\) 3t 40m Optjent − brugt \+51t 20m/);
    await p.locator('[data-hovedtal="indstillinger"] summary').click();
    const cfg = await tekst(p, '[data-hovedtal="indstillinger"]');
    for (const value of ['2025-06-01 – 2026-05-31', 'Frikøb <TR> 100 t', '900 t', '59,17 %', '2,5', '0,85', '2025-08-12 – 2025-10-29', '2025-11-05', 'Lærerferie (begge datoer med): ingen', 'Elevferie (begge datoer med): ingen']) assert(cfg.includes(value), value);
    assert.equal(await p.locator('.rapport-summary script, .rapport-summary tr b').count(), 0);
    const saldo = await tekst(p, '.akkord-saldo-tal');
    await p.uncheck('#akkord-fordel'); await p.waitForTimeout(100);
    assert.equal(await tekst(p, '.akkord-saldo-tal'), saldo);
    assert(await p.locator('[data-hovedtal="akkord"]').evaluate(d => d.open));
    assert.match(await tekst(p, '[data-hovedtal="akkord"]'), /står særskilt/);
    await p.screenshot({ path: her + `ud/rapport-forklaring-${width}.png`, fullPage: true });
    assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    while (await p.locator('.rapport-summary details[open]').count()) await p.locator('.rapport-summary details[open] summary').first().click();
    await p.evaluate(() => document.getElementById('main-content').scrollTo(0, 0));
    await p.screenshot({ path: her + `ud/rapport-hovedtal-${width}.png` });
    // Historiske og kommende perioder er tydeligt afgrænset.
    await p.click('#rapport-next'); await p.click('#rapport-next');
    await p.waitForFunction(() => document.querySelector('.rapport-hovedtal-tal')?.textContent === '± 0m');
    assert.equal(await tekst(p, '.akkord-saldo-tal'), '± 0m');
    assert.equal(await tekst(p, '.rapport-total'), '0m');
    await p.click('.rapport-tab[data-period="dag"]');
    assert.equal(await p.locator('.rapport-hovedtal').count(), 1);
    assert.match(await tekst(p, '.rapport-summary'), /gælder hele normperioden/);
    await p.click('#rapport-vis-skoleaar'); assert.equal(await p.locator('.rapport-hovedtal').count(), 3);
    await p.context().close();
  }
  console.log('OK   Tre adskilte hovedtal, referenceberegninger, historisk/fremtidig periode, indstillinger, fordeling, tastatur og 340/390/1280 px');
  {
    // En aktuel periode med holdnormer, underopgave og overført optjening:
    // hovedtal og forklaringer skal fortsat følge de eksisterende modeller.
    const current = [[settings[0], { ...settings[1], currentSchoolYear: '2026/27' }],
      ['users/u1/activities/a', { name: 'Bio', type: 'hold', order: 1, schoolYear: '2026/27', budgetHours: 100, normGrundlag: { moduler: 20, elever: 10, fordybelsestid: 2 }, rettedeSaet: [{ dato: '2026-09-01', elevtimer: 1 }] }],
      ['users/u1/activities/f', { name: 'Overopgave', type: 'opgave', order: 2, schoolYear: '2026/27', budgetHours: 20, optjening: 'manuel', fremdrift: 25 }],
      ['users/u1/activities/c', { name: 'Underopgave', type: 'opgave', order: 3, schoolYear: '2026/27', parentId: 'f', budgetHours: 5, optjening: 'manuel', fremdrift: 50 }],
      akt('o', 'Overført', { naesteAar: true, optjening: 'afslutning', isArchived: true, budgetHours: 10 }),
      ['users/u1/entries/hold', { activityId: 'a', workType: 'undervisning', startTime: { __ts: Date.parse('2026-09-01T06:00:00Z') }, endTime: { __ts: Date.parse('2026-09-01T07:35:00Z') }, durationMinutes: 95 }]];
    const p = await lavSide(browser, { seed: current }); await p.clock.setFixedTime(new Date('2026-10-02T10:00:00Z'));
    await p.click('.nav-btn[data-view="rapporter"]');
    await p.waitForFunction(() => document.querySelector('.rapport-total')?.textContent === '1t 35m');
    const values = await p.evaluate(() => {
      const mins = s => { const t = document.querySelector(s).textContent; return (t.startsWith('−') ? -1 : 1) * ((+(t.match(/(\d+)t/)?.[1] || 0))*60 + (+(t.match(/(\d+)m/)?.[1] || 0))); };
      const data = [...document.querySelectorAll('.udv-kort[data-udv]')].map(k => JSON.parse(k.dataset.udv).data.at(-1)[1]);
      return { afvigelse: mins('.rapport-hovedtal-tal'), saldo: mins('.akkord-saldo-tal'), data };
    });
    assert(Math.abs(values.afvigelse - values.data[0]) <= 1);
    assert(Math.abs(values.saldo - values.data[1]) <= 1);
    await p.locator('[data-hovedtal="akkord"] > summary').click();
    assert.match(await tekst(p, '[data-hovedtal="akkord"]'), /Overført \(fra sidste år\)/);
    assert.match(await tekst(p, '[data-hovedtal="akkord"]'), /Underopgave/);
    await p.context().close();
  }
  console.log('OK   Holdnormer, underopgave og overført optjening stemmer med grafens eksisterende regning');
  assert.deepEqual(fejl, []);
} finally { await browser.close(); }
