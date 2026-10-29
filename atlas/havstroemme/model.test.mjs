// Modelprøve: strømmenes retning og hvirvlernes omløb. Kør: node atlas/havstroemme/model.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { lavFelt, modRetning, fart, STROEMME, HVIRVLER } from './model.js';
import { afkod, klasseFor, KLASSER } from './havtemperatur.js';

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

console.log('Modellen: strømretninger, hvirvlernes omløb, landmasken og havtemperaturen består.');
