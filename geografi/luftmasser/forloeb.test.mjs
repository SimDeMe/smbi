import assert from 'node:assert/strict';
import { FORLOEB, TRINSEKUNDER, vejrtilstand } from './forloeb.mjs';
for (const profil of Object.keys(FORLOEB)) {
  assert.equal(FORLOEB[profil].trin.length, 4);
  for (let trin = 0; trin < 4; trin++) assert.equal(vejrtilstand(profil, (trin + .5) * TRINSEKUNDER).trin, trin);
  assert.equal(vejrtilstand(profil, 1000).trin, 3);
  assert.equal(vejrtilstand(profil, -1).trin, 0);
  for (let tid = 0; tid <= 28; tid += .1) {
    const v = vejrtilstand(profil, tid);
    for (const [key, value] of Object.entries(v)) if (key !== 'trin') assert.ok(value >= 0 && value <= 1);
    if (profil === 'stabil' || profil === 'inversion') { assert.equal(v.taarn, 0); assert.equal(v.regn, 0); }
    if (v.regn > 0) { assert.ok(v.taarn > .5); assert.equal(v.skyer, 1); }
    if (profil === 'betinget' && v.taarn > 0) assert.ok(v.ekstra > 0);
  }
}
assert.equal(vejrtilstand('stabil', 28).skyer, 1);
assert.equal(vejrtilstand('inversion', 28).dis, 1);
assert.equal(vejrtilstand('inversion', 28).skyer, 0);
assert.equal(vejrtilstand('ustabil', 28).regn, 1);
assert.equal(vejrtilstand('betinget', 14).taarn, 0);
assert.ok(vejrtilstand('betinget', 28).regn > .99);
console.log('Forløbskontrol bestået: fire trin, små skyer, ekstra løft før tårn, regn efter skyvækst og inversion uden byger.');
