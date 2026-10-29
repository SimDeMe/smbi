// Modelprøve: strømmenes retning og hvirvlernes omløb. Kør: node atlas/havstroemme/model.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { lavFelt, modRetning, fart, STROEMME, HVIRVLER } from './model.js';
import { afkod, afkodEnso, medFase, klasseFor, KLASSER } from './havtemperatur.js';

const felt = lavFelt();
const mod = (lon, lat) => modRetning(felt.stroem(lon, lat));
const navn = (lon, lat) => felt.hvem(lon, lat)?.navn;

assert.equal(navn(-74.5, 35.5), 'Golfstrømmen');
assert.match(mod(-74.5, 35.5), /nordøst|nord/, 'Golfstrømmen løber mod nordøst');
assert.equal(felt.hvem(-74.5, 35.5).type, 'varm');
assert.match(mod(-25, 53), /nordøst|øst/, 'Nordatlantiske strøm mod Europa');
assert.match(mod(-17, 27), /syd/, 'Kanariske strøm mod syd');
assert.equal(felt.hvem(-17, 27).type, 'kold');
assert.match(mod(-73.5, -24), /nord/, 'Humboldtstrømmen mod nord');
assert.match(mod(12, -24), /nord/, 'Benguelastrømmen mod nord');
assert.match(mod(-125, 37), /syd/, 'Californiske strøm mod syd');
assert.match(mod(137, 33.5), /nordøst|øst/, 'Kuroshio mod nordøst');
assert.match(mod(33, -30), /sydvest|syd/, 'Agulhasstrømmen mod sydvest');
assert.match(mod(-56, 55), /syd/, 'Labradorstrømmen mod syd');
for (const lon of [-120, -20, 60, 150]) assert.match(mod(lon, -55), /øst/, `cirkumpolarstrømmen mod øst ved ${lon}°`);
for (const [lon, lat] of [[-40, 14.5], [-150, 13], [-120, -4], [80, -15]]) assert.match(mod(lon, lat), /vest/, `ækvatorialstrøm mod vest ved ${lon}°`);
assert.match(mod(-150, 7), /øst/, 'modstrømmen mod øst');

// Hvirvlerne: med uret i nord, mod uret i syd. Krydsproduktet af position
// (fra centrum) og strøm er negativt for omløb med uret set ovenfra.
for (const h of HVIRVLER) {
  let sum = 0;
  for (let a = 0; a < 360; a += 5) {
    const lon = h.centrum[0] + h.rx * Math.cos(a * Math.PI / 180), lat = h.centrum[1] + h.ry * Math.sin(a * Math.PI / 180);
    const w = felt.stroem(lon, lat);
    sum += Math.cos(a * Math.PI / 180) * h.rx * w.v - Math.sin(a * Math.PI / 180) * h.ry * w.u;
  }
  assert.ok(h.medUret ? sum < 0 : sum > 0, `${h.navn} drejer ${h.medUret ? 'med' : 'mod'} uret`);
  assert.equal(h.medUret, h.centrum[1] > 0, 'med uret netop på den nordlige halvkugle');
}

// Land giver ingen strøm.
const tørt = lavFelt((lon, lat) => lon > -10 && lon < 30 && lat > 0 && lat < 30);
assert.equal(fart(tørt.stroem(10.5, 15.5)), 0);
assert.ok(tørt.erLand(10, 15) && !tørt.erLand(-40, 15));

// Randstrømmene er de hurtigste.
const hurtigst = Math.max(...STROEMME.map(s => s.fart));
assert.ok(STROEMME.filter(s => s.fart === hurtigst).every(s => s.randstroem));

// Havtemperaturen (NOAA OISST, årsmiddel): kolde strømme ved vestkysterne,
// varme ved østkysterne, og Europa varmere end Labrador.
const sst = afkod(gunzipSync(readFileSync(new URL('../data/havtemperatur.bin', import.meta.url))));
const T = (lon, lat) => sst.temperatur(lon, lat);
assert.equal(T(20, 5), null, 'Afrika er land');
assert.ok(T(150, 0) > 28.5, 'varmepoolen i Vestpacific');
assert.ok(T(-79, -10) < T(-140, -10) - 5, 'koldt vand ud for Peru');
assert.ok(T(12, -22) < T(-10, -22) - 2, 'koldt vand ud for Namibia');
assert.ok(T(5, 65) > T(-54, 55) + 4, 'Norskehavet varmere end Labradorhavet, længere mod nord');
assert.ok(T(-75, 33) > T(-122, 33) + 5, 'Golfstrømmen varmere end Californiske strøm');
assert.equal(KLASSER[klasseFor(-1.8)].fra, -2);
assert.equal(KLASSER[klasseFor(29.9)].fra, 29);

// El Niño og La Niña: passatstrømmen svækkes/styrkes, modstrømmen omvendt;
// Atlanten er uændret, og normalfasen giver det oprindelige felt.
const u = (lon, lat) => felt.stroem(lon, lat).u;
const normalt = { sek: u(-140, -4), mod: u(-150, 7), atl: u(-25, -4.5), hum: felt.stroem(-73, -26).v };
felt.saetFase('elnino');
assert.equal(felt.fase, 'elnino');
assert.ok(u(-140, -4) < 0 && u(-140, -4) > normalt.sek / 2, 'El Niño: svagere sydlig ækvatorialstrøm, stadig mod vest');
assert.ok(u(-150, 7) > normalt.mod * 1.5, 'El Niño: stærkere modstrøm mod øst');
assert.ok(felt.stroem(-73, -26).v < normalt.hum, 'El Niño: svagere Humboldtstrøm');
assert.equal(u(-25, -4.5), normalt.atl, 'El Niño ændrer ikke Atlanten');
felt.saetFase('lanina');
assert.ok(u(-140, -4) < normalt.sek * 1.2 && u(-150, 7) < normalt.mod, 'La Niña: stærkere passatstrøm, svagere modstrøm');
felt.saetFase('normal');
assert.equal(u(-140, -4), normalt.sek);
assert.throws(() => felt.saetFase('monsun'));

// Målt afvigelse (NOAA ERSST v5): El Niño varmer det østlige Stillehav,
// La Niña køler det centrale; Vestpacific bliver lidt koldere under El Niño.
const enso = afkodEnso(gunzipSync(readFileSync(new URL('../data/enso.bin', import.meta.url))));
const nino34 = f => { let s = 0, n = 0; for (let lat = -4.5; lat <= 4.5; lat++) for (let lon = -169.5; lon <= -120.5; lon++) { s += enso[f](lon, lat); n++; } return s / n; };
assert.ok(nino34('elnino') > 2 && nino34('elnino') < 2.8, 'Niño 3.4 ca. +2,4 °C i 1997/98');
assert.ok(nino34('lanina') < -1.2 && nino34('lanina') > -2, 'Niño 3.4 ca. −1,6 °C i 2010/11');
assert.ok(enso.elnino(-82.5, -5.5) > 3.5, 'El Niño: meget varmt ud for Peru');
assert.ok(enso.elnino(150.5, 5.5) < 0, 'El Niño: koldere i Vestpacific');
const nino = medFase(sst, enso, 'elnino'), nina = medFase(sst, enso, 'lanina'), normal = medFase(sst, enso, 'normal');
assert.ok(nino.temperatur(-82.5, -5.5) > T(-82.5, -5.5) + 3.5 && nina.temperatur(-150, 0) < T(-150, 0) - 1);
assert.equal(normal.temperatur(-150, 0), T(-150, 0)); assert.equal(normal.afvigelse(-150, 0), null);
assert.equal(nino.temperatur(20, 5), null, 'land forbliver land');
for (let lat = -89.5; lat < 90; lat += 3) for (let lon = -179.5; lon < 180; lon += 3) { const t = nina.temperatur(lon, lat); assert.ok(t === null || t >= -1.8, 'aldrig under frysepunktet'); }
assert.equal(medFase(sst, null, 'elnino').afvigelse(-150, 0), null, 'uden data vises normalen');

console.log('Modellen: strømretninger, hvirvlernes omløb, landmasken, havtemperaturen og El Niño/La Niña består.');
