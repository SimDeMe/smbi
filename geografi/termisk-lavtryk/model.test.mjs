import assert from 'node:assert/strict';
import {beregn} from './model.js';

for (const styrke of [0, .01, .25, .65, 1]) {
  const udvidet = beregn(styrke, 0);
  const medUdveksling = beregn(styrke, styrke);
  assert.equal(udvidet.varmBund, 1000, 'Varme alene ændrer ikke søjlens masse');
  assert.equal(udvidet.koldBund, 1000);
  assert.equal(medUdveksling.varmBund + medUdveksling.koldBund, 2000,
    'Ens tværsnit: summen af bundtrykkene følger den bevarede masse');
  assert(medUdveksling.varmTop < medUdveksling.varmBund, 'Trykket falder opad');
  assert(medUdveksling.koldTop < medUdveksling.koldBund);
  if (styrke > 0) {
    assert(udvidet.laghoejde > 4000, 'Opvarmning udvider luftlaget');
    assert(udvidet.varmTop > udvidet.koldTop, 'Højere tryk i samme højde før udveksling');
    assert(medUdveksling.varmTop > medUdveksling.koldTop, 'Øvre trykgradient er stadig udad');
    assert(medUdveksling.varmBund < medUdveksling.koldBund, 'Nedre trykgradient er indad');
  }
}
// Uafhængige kontroltal, beregnet for 15 °C / 45 °C og 3.000 m.
assert(Math.abs(beregn(0, 0).koldTop - 700.6081) < .0001);
assert(Math.abs(beregn(1, 0).laghoejde - 4416.4498) < .0001);
assert(Math.abs(beregn(1, 1).varmTop - 717.2677) < .0001);
assert.equal(beregn(1, 1).varmBund, 990);
assert.equal(beregn(1, 1).koldBund, 1010);
console.log('Udvidelse, trykgradienter og bevarelse af luftmasse: OK');
