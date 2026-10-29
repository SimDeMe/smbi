import assert from 'node:assert/strict';
import {beregn, trykIHoejde, hoejdeAfTryk} from './model.js';

const naer = (a, b, tol = 1e-4) => assert(Math.abs(a - b) < tol, `${a} ≠ ${b}`);
// retning 1: opvarmning og lavtryk; retning −1: afkøling og højtryk.
for (const retning of [1, -1]) for (const styrke of [0, .01, .25, .65, 1]) {
  const s = retning * styrke;
  const udvidet = beregn(s, 0), slut = beregn(s, s);
  assert.equal(udvidet.midtBund, 1000, 'Temperatur alene ændrer ikke søjlens masse');
  assert.equal(udvidet.sideBund, 1000);
  assert.equal(slut.midtBund + 2 * slut.sideBund, 3000,
    'Ens tværsnit: summen af bundtrykkene følger den bevarede masse');
  for (const p of [900, 700, 500]) naer(trykIHoejde(slut.midtBund, slut.midtT, hoejdeAfTryk(p, slut.midtBund, slut.midtT)), p);
  if (styrke > 0) {
    // f > 0: midten har det højeste tryk i højden og det laveste ved jorden.
    const f = (midt, side) => retning * (midt - side);
    assert(f(trykIHoejde(1000, udvidet.midtT, 5000), trykIHoejde(1000, udvidet.sideT, 5000)) > 0,
      'Tryk i 5 km over midten afviger, før luft flyttes');
    assert(f(hoejdeAfTryk(500, 1000, udvidet.midtT), hoejdeAfTryk(500, 1000, udvidet.sideT)) > 0,
      'Trykfladerne løftes over varm og sænkes over kold luft');
    assert(f(trykIHoejde(slut.midtBund, slut.midtT, 5000), trykIHoejde(slut.sideBund, slut.sideT, 5000)) > 0,
      'Øvre trykgradient peger stadig samme vej efter overførslen');
    assert(f(slut.sideBund, slut.midtBund) > 0, 'Nedre trykgradient er modsat den øvre');
  }
}
// Uafhængige kontroltal for 15 °C / 35 °C (lavtryk).
const lav = beregn(1, 1);
naer(trykIHoejde(1000, 288.15, 3000), 700.6081);
naer(hoejdeAfTryk(500, 1000, 288.15), 5844.3, .1);
naer(hoejdeAfTryk(500, 1000, 308.15), 6250.0, .1);
assert.equal(lav.midtBund, 990);
assert.equal(lav.sideBund, 1005);
naer(trykIHoejde(990, 308.15, 5000), 568.60, .01);
naer(trykIHoejde(1005, 288.15, 5000), 555.42, .01);
// 900 hPa-fladen ligger lavere over lavtrykket, 500 hPa-fladen højere.
assert(hoejdeAfTryk(900, 990, 308.15) < hoejdeAfTryk(900, 1005, 288.15));
assert(hoejdeAfTryk(500, 990, 308.15) > hoejdeAfTryk(500, 1005, 288.15));
// Kontroltal for 15 °C / −5 °C (højtryk).
const hoej = beregn(-1, -1);
assert.equal(hoej.midtBund, 1010);
assert.equal(hoej.sideBund, 995);
naer(hoejdeAfTryk(500, 1000, 268.15), 5438.6, .1);
naer(trykIHoejde(1010, 268.15, 5000), 534.04, .01);
naer(trykIHoejde(995, 288.15, 5000), 549.89, .01);
assert(hoejdeAfTryk(900, 1010, 268.15) > hoejdeAfTryk(900, 995, 288.15));
assert(hoejdeAfTryk(500, 1010, 268.15) < hoejdeAfTryk(500, 995, 288.15));
console.log('Lavtryk og højtryk: udvidelse, trykgradienter og bevarelse af luftmasse: OK');
