import assert from 'node:assert/strict';
import { LUFTMASSER, PROFILER, skybase, pakketemperatur, omgivelser, tilstand, fritLoeft } from './model.mjs';
const taet = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} ≠ ${b}`);
const fugtig = LUFTMASSER.maritimTropisk, toer = LUFTMASSER.kontinentalTropisk;
// Uafhængige håndregninger: (22−18)/(9,8−1,8)=0,5 km.
taet(skybase(fugtig), 500);
taet(pakketemperatur(500, fugtig), 17.1);
taet(pakketemperatur(1000, fugtig), 14.1);
taet(pakketemperatur(2500, fugtig), 5.1);
taet(skybase(toer), 2500);
taet(pakketemperatur(1000, toer), 16.2);
// Betinget profil: ved 0,5 km er underskuddet 1,4 °C. Over skybasen
// indhentes 1 °C/km, så fri opstigning begynder over 1,9 km.
taet(tilstand(1900, fugtig, 'betinget').forskel, 0);
assert.equal(fritLoeft(fugtig, 'betinget'), 1910);
assert.ok(tilstand(800, fugtig, 'betinget').sky);
assert.ok(tilstand(800, fugtig, 'betinget').acceleration < 0);
assert.ok(tilstand(2500, fugtig, 'betinget').acceleration > 0);
assert.equal(fritLoeft(toer, 'betinget'), null);
// Inversion: temperaturstigning 4,8 °C indtil 800 m, kontinuitet ved knækket.
taet(omgivelser(800, fugtig, 'inversion'), 26.8);
taet(omgivelser(1800, fugtig, 'inversion'), 19.8);
for (const m of Object.values(LUFTMASSER)) {
  for (const profil of Object.keys(PROFILER)) taet(tilstand(0, m, profil).forskel, 0);
  for (let z = 50; z <= 4000; z += 50) {
    assert.ok(tilstand(z, m, 'stabil').acceleration < 0);
    assert.ok(tilstand(z, m, 'ustabil').acceleration > 0);
    assert.ok(tilstand(z, m, 'inversion').acceleration < 0);
  }
  // Ingen temperaturspring ved kondensation.
  assert.ok(Math.abs(pakketemperatur(skybase(m) - .001, m) - pakketemperatur(skybase(m) + .001, m)) < .00002);
}
console.log('Modelkontrol bestået: skybase, temperaturer, fri opstigning, inversion og alle luftmasser.');
