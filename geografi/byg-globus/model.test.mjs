import assert from 'node:assert/strict';
import { afstand, punktKorrekt, AFSNIT, LAG, zoneForKlasse } from './model.js';

// Geometrien skal virke over datolinjen og ved polerne, også for tastatursvar.
assert(Math.abs(afstand([179, 0], [-179, 0]) - 2) < 1e-9);
assert(Math.abs(afstand([0, 90], [120, 90])) < 1e-9);
assert(Math.abs(afstand([0, 0], [180, 0]) - 180) < 1e-9);
assert(punktKorrekt([34.9, 0], [30, 0]));
assert(!punktKorrekt([35.1, 0], [30, 0]));
assert(!punktKorrekt([NaN, 0], [30, 0]));
assert(!punktKorrekt(null, [30, 0]));
for (const nr of [null, undefined, 0, 17]) assert.equal(zoneForKlasse(nr),null);
assert.deepEqual(AFSNIT.flatMap(a => a.lag), Object.keys(LAG));
assert.equal(LAG.dele.ord.length, 7);
assert.equal(LAG.have.ord.length, 5);
assert.deepEqual(LAG.linjer.ord.map(o => o.punkt[1]), [90, 66.56, 23.44, 0, -23.44, -66.56, -90]);
assert.deepEqual(Array.from({length:16}, (_, i) => zoneForKlasse(i+1)), [
  ...Array(4).fill('tropisk'), ...Array(5).fill('subtropisk'), ...Array(5).fill('tempereret'), ...Array(2).fill('polar')
]);
for (const lag of Object.values(LAG)) {
  assert.equal(new Set(lag.ord.map(o => o.id)).size, lag.ord.length);
  for (const o of lag.ord) assert(o.punkt[0] >= -180 && o.punkt[0] <= 180 && Math.abs(o.punkt[1]) <= 90);
}
console.log('Globusmodel: sfærisk afstand, datolinje, poler, svartolerance og fire zoner OK.');
