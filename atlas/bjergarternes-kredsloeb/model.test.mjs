// Kør med: node atlas/bjergarternes-kredsloeb/model.test.mjs
import assert from 'node:assert/strict';
import { GRUPPER, BJERGARTER, PROCESSER, OVERGANGE, STEDER, QUIZSTEN, MAAL, stederFor, opfyldt, samletTid, tidstekst,
  afkoelingstid, kornstoerrelse, kornklasse, stoerkn, tidsord, KROPPE, SEK_PR_AAR } from './model.js';
import { efterId } from '../../geografi/stensamling/samling.js';

const naer = (a, b, tol, tekst) => assert.ok(Math.abs(a - b) <= tol, `${tekst}: ${a} skulle være ${b} ± ${tol}`);

// Alle bjergarter har en gyldig gruppe, og alle henvisninger til stensamlingen findes.
for (const [id, b] of Object.entries(BJERGARTER)) {
  assert.ok(b.gruppe in GRUPPER, id);
  if (b.sten) assert.ok(efterId[b.sten], `${id}: ${b.sten} findes ikke i stensamlingen`);
  assert.ok(OVERGANGE[id]?.length, `${id} har ingen vej videre`);
}
for (const id of QUIZSTEN) assert.ok(efterId[id], `quizstenen ${id} findes ikke i stensamlingen`);
assert.ok(QUIZSTEN.length >= 25);

// Overgangene: kendt proces, kendt resultat, kendt sted, og grupperne passer med processen.
const FRA_TIL = {
  smeltning: [['kappe'], ['magma']], stoerkning: [['magma'], ['magmatisk']],
  erosion: [['magmatisk', 'sedimentaer', 'metamorf'], ['sediment']], diagenese: [['sediment'], ['sedimentaer']],
  omdannelse: [['magmatisk', 'sedimentaer', 'metamorf'], ['metamorf']], opsmeltning: [['magmatisk', 'metamorf'], ['magma']]
};
for (const [fra, liste] of Object.entries(OVERGANGE)) {
  for (const o of liste) {
    assert.ok(o.proces in PROCESSER && o.til in BJERGARTER && o.sted in STEDER, `${fra} → ${o.til}`);
    const [fg, tg] = FRA_TIL[o.proces];
    assert.ok(fg.includes(BJERGARTER[fra].gruppe) && tg.includes(BJERGARTER[o.til].gruppe), `${fra} –${o.proces}→ ${o.til}`);
    assert.ok(o.tid.min <= o.tid.typisk && o.tid.typisk <= o.tid.max, `${fra} → ${o.til}: tid`);
    assert.ok(o.tekst.length > 30);
  }
}
// Metamorfosegraden stiger: lersten → tagskifer → glimmerskifer → gnejs → migmatit.
const vej = ['lersten', 'tagskifer', 'glimmerskifer', 'gnejs', 'migmatit'];
for (let i = 1; i < vej.length; i++) assert.ok(OVERGANGE[vej[i - 1]].some(o => o.til === vej[i]), vej[i]);
// Kredsløbet er lukket: Fra hver bjergart kan man nå både sedimentære og metamorfe
// bjergarter. Magma nås fra alt undtagen kvarts- og kalkkredsløbet (kvartsit, marmor
// og deres sediment): ren kvarts smelter først ved ca. 1700 °C, og kalk afgiver CO₂
// i stedet for at smelte til granitisk magma. Det står også i modellens forklaring.
const naaet = start => {
  const set = new Set([start]), koe = [start];
  while (koe.length) for (const o of OVERGANGE[koe.shift()]) if (!set.has(o.til)) { set.add(o.til); koe.push(o.til); }
  return new Set([...set].map(id => BJERGARTER[id].gruppe));
};
const UDEN_MAGMA = ['grus', 'sand', 'kalkslam', 'konglomerat', 'sandsten', 'kalksten', 'kridt', 'kvartsit', 'marmor'];
for (const start of Object.keys(BJERGARTER)) {
  const g = naaet(start);
  for (const h of ['sedimentaer', 'metamorf']) assert.ok(g.has(h), `${start} når ikke ${h}`);
  assert.equal(g.has('magma'), !UDEN_MAGMA.includes(start), `${start}: magma`);
}
// Udfordringerne kan løses ad overgangene, og «hele vejen rundt» kræver rækkefølgen.
for (const m of MAAL) assert.ok(BJERGARTER[m.start] && (!m.slut || BJERGARTER[m.slut]), m.id);
assert.ok(opfyldt(MAAL[0], ['granit', 'sand', 'sandsten', 'kvartsit']));
assert.ok(!opfyldt(MAAL[0], ['gnejs', 'sand', 'sandsten', 'kvartsit']), 'forkert start');
const rundt = MAAL.find(m => m.id === 'rundt');
assert.ok(opfyldt(rundt, ['granit', 'sand', 'sandsten', 'kvartsit', 'sand', 'sandsten']) === false);
assert.ok(opfyldt(rundt, ['granit', 'ler', 'lersten', 'tagskifer', 'glimmerskifer', 'gnejs', 'magma-granitisk', 'granit']));
naer(samletTid([OVERGANGE.granit[0], OVERGANGE.sand[0], OVERGANGE.sandsten[1]]), 40, 1e-9, 'samlet tid');
assert.equal(tidstekst(OVERGANGE['magma-basaltisk'][0].tid), 'timer til få år');
assert.equal(tidstekst(OVERGANGE['magma-basaltisk'][1].tid), 'ca. 100.000 år (10.000–1.000.000 år)');
assert.equal(tidstekst(OVERGANGE.granit[0].tid), 'ca. 20 mio. år (5–50)');

// Stederne: eklogit kun i subduktionszonen, gnejs i bjergkæden, basalt ved ryg og hotspot.
assert.deepEqual(stederFor('eklogit'), ['subduktion']);
assert.deepEqual(stederFor('gnejs'), ['bjergkaede']);
assert.deepEqual(stederFor('basalt').sort(), ['hotspot', 'ryg']);
for (const s of Object.values(STEDER)) assert.ok(s.x > 0 && s.x < 1000 && s.y > 0 && s.y < 520 && s.tekst.length > 80);

// Afkøling: t ≈ (h/2)²/κ. En 1 m tyk lavastrøm køler på ca. 3 døgn, en 20 m tyk gang
// på ca. 3 år og en pluton på 3 km på ca. 70 000 år (Turcotte & Schubert).
naer(afkoelingstid(1) / 86400, 2.9, .1, '1 m lava, døgn');
naer(afkoelingstid(20) / SEK_PR_AAR, 3.2, .1, '20 m gang, år');
naer(afkoelingstid(3000) / SEK_PR_AAR, 71300, 500, '3 km pluton, år');
// Kornstørrelsen passer med kendte bjergarter.
const korn = h => kornstoerrelse(afkoelingstid(h));
naer(korn(5), .3, .01, '5 m lava');
assert.ok(korn(20) > .3 && korn(20) < 1, 'diabas i 20 m gang: finkornet');
assert.ok(korn(1000) > 1.5 && korn(1000) < 5, 'gabbro i 1 km pluton: middelkornet');
assert.ok(korn(10000) > 5 && korn(10000) < 12, 'granit i 10 km pluton: grovkornet');
assert.equal(kornklasse(korn(.05)).navn, 'glas');
assert.equal(stoerkn('basaltisk', 'lava', 5).bjergart, 'basalt');
assert.equal(stoerkn('basaltisk', 'gang', 20).bjergart, 'diabas');
assert.equal(stoerkn('granitisk', 'pluton', 8000).bjergart, 'granit');
assert.equal(stoerkn('granitisk', 'lava', .05).bjergart, 'obsidian');
for (const [krop, k] of Object.entries(KROPPE)) {
  assert.ok(k.min < k.start && k.start < k.max, krop);
  for (const magma of ['basaltisk', 'granitisk']) assert.ok(efterId[stoerkn(magma, krop, k.start).bjergart], `${magma} ${krop}`);
}
// Kornene vokser hele vejen op gennem tykkelserne.
let forrige = 0;
for (const h of [.05, .5, 5, 50, 500, 5000, 20000]) { const d = korn(h); assert.ok(d > forrige); forrige = d; }
assert.equal(tidsord(afkoelingstid(1)), '3 døgn');
assert.equal(tidsord(afkoelingstid(3000)), '71.000 år');
assert.equal(tidsord(afkoelingstid(.05)), '10 minutter');

console.log('Alle modeltest bestået.');
