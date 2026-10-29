import assert from 'node:assert/strict';
import {beregn, trykIHoejde, hoejdeAfTryk} from './model.js';

const naer = (a, b, tol = 1e-4) => assert(Math.abs(a - b) < tol, `${a} ≠ ${b}`);
for (const styrke of [0, .01, .25, .65, 1]) {
  const udvidet = beregn(styrke, 0), slut = beregn(styrke, styrke);
  assert.equal(udvidet.varmBund, 1000, 'Varme alene ændrer ikke søjlens masse');
  assert.equal(udvidet.koldBund, 1000);
  assert.equal(slut.varmBund + 2 * slut.koldBund, 3000,
    'Ens tværsnit: summen af bundtrykkene følger den bevarede masse');
  for (const p of [900, 700, 500]) naer(trykIHoejde(slut.varmBund, slut.varmT, hoejdeAfTryk(p, slut.varmBund, slut.varmT)), p);
  if (styrke > 0) {
    const t = z => [trykIHoejde(udvidet.koldBund, udvidet.koldT, z), trykIHoejde(udvidet.varmBund, udvidet.varmT, z)];
    const [k, v] = t(5000);
    assert(v > k, 'Højere tryk i 5 km over den varme søjle før udveksling');
    assert(hoejdeAfTryk(500, udvidet.varmBund, udvidet.varmT) > hoejdeAfTryk(500, 1000, udvidet.koldT),
      'Trykfladerne løftes over den varme søjle');
    assert(trykIHoejde(slut.varmBund, slut.varmT, 5000) > trykIHoejde(slut.koldBund, slut.koldT, 5000),
      'Øvre trykgradient er stadig udad efter udstrømningen');
    assert(slut.varmBund < slut.koldBund, 'Nedre trykgradient er indad');
  }
}
// Uafhængige kontroltal for 15 °C / 35 °C.
const fuld = beregn(1, 1);
naer(trykIHoejde(1000, 288.15, 3000), 700.6081);
naer(hoejdeAfTryk(500, 1000, 288.15), 5844.3, .1);
naer(hoejdeAfTryk(500, 1000, 308.15), 6250.0, .1);
assert.equal(fuld.varmBund, 990);
assert.equal(fuld.koldBund, 1005);
naer(trykIHoejde(990, 308.15, 5000), 568.60, .01);
naer(trykIHoejde(1005, 288.15, 5000), 555.42, .01);
// 900 hPa-fladen ligger lavere over lavtrykket, 500 hPa-fladen højere.
assert(hoejdeAfTryk(900, 990, 308.15) < hoejdeAfTryk(900, 1005, 288.15));
assert(hoejdeAfTryk(500, 990, 308.15) > hoejdeAfTryk(500, 1005, 288.15));
console.log('Udvidelse, trykgradienter og bevarelse af luftmasse: OK');
