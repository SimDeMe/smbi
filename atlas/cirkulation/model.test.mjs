// Modelprøve: retningerne i CIRKULATION-MODEL.md, afsnit 0. Kør: node atlas/cirkulation/model.test.mjs
import assert from 'node:assert/strict';
import { vind, vindbaelte, fraRetning, retningsnavn, itkBredde, itkMiddel, stroemfunktion } from './model.js';

// Jævndøgn-agtig måned, hvor ITK ligger tæt på ækvator.
const maaned = [...Array(120)].map((_, i) => 1 + i / 10).reduce((a, m) => Math.abs(itkMiddel(m)) < Math.abs(itkMiddel(a)) ? m : a, 1);
const fra = (lat, lon = -30, m = maaned, valg = { rotation: 1, kontinenter: 0 }) => retningsnavn(fraRetning(vind(lat, lon, m, valg)));

assert.equal(fra(15), 'nordøst');
assert.equal(fra(-15), 'sydøst', 'sydøstpassat ved 15° S');
assert.equal(fra(45), 'sydvest', 'vestenvind fra sydvest ved 45° N');
assert.equal(fra(-45), 'nordvest', 'vestenvind fra nordvest ved 45° S');
assert.match(fra(75), /øst/, 'polar østenvind ved 75° N');
assert.match(fra(-75), /øst/, 'polar østenvind ved 75° S');
assert.equal(vindbaelte(15, -30, maaned), 'Nordøstpassat');
assert.equal(vindbaelte(-45, -30, maaned), 'Vestenvind');

// Corioliseffekten er nul ved ækvator.
assert.equal(Math.abs(vind(0, -30, maaned).u), 0);

// Uden rotation: ingen østlig/vestlig vind, luften går mod ITK.
for (const lat of [-60, -20, 30, 70]) {
  const w = vind(lat, -30, maaned, { rotation: 0 });
  assert.equal(Math.abs(w.u), 0);
  assert.equal(Math.sign(w.v), lat > itkMiddel(maaned) ? -1 : 1, `mod ITK ved ${lat}°`);
}

// ITK følger sommerhalvkuglen og flytter sig mest over land.
assert.ok(itkMiddel(8) > 8 && itkMiddel(2) < 0, 'ITK ca. 10° N i august, syd for ækvator i februar');
assert.ok(itkBredde(7, 82, 1) > 20, 'ITK over Nordindien i juli');
const udsving = l => itkBredde(7.5, l, 1) - itkBredde(1.5, l, 1);
assert.ok(udsving(82) > 2 * udsving(-150), 'større udsving over Indien end over Stillehavet');

// Monsun over Mumbai (19° N, 73° Ø): fra sydvest i juli, fra nordøst i januar.
const k = { rotation: 1, kontinenter: 1 };
assert.equal(vindbaelte(16, 75, 7, k), 'Sydvestmonsun');
assert.match(fra(19, 73, 7, k), /sydvest|vest|syd/, 'pålandsvind i juli');
assert.match(fra(19, 73, 1, k), /nordøst|nord|øst/, 'fralandsvind i januar');
assert.equal(vindbaelte(19, 73, 1, k), 'Nordøstmonsun');

// Snittet: Hadleycellen og Ferrelcellen drejer modsat.
assert.ok(Math.sign(stroemfunktion(15, 0.5, maaned)) !== Math.sign(stroemfunktion(45, 0.5, maaned)));

console.log('Modellen: passat, vestenvind, polar østenvind, Coriolis, stop Jorden, ITK og monsun består.');
