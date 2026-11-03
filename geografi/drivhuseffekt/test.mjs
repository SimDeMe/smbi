import assert from 'node:assert/strict';
import { ABSORPTION, starttilstand, energistroemme, udvikl } from './model.mjs';

// Uafhængig analytisk løsning af den stationære tolagsmodel:
// luft⁴ = jord⁴/2 og jord⁴ = 1/(1 - absorption/2).
const uden = udvikl(starttilstand(), 500, true, false);
const med = udvikl(starttilstand(), 500, true, true);
assert.ok(Math.abs(uden.jord - 1) < 1e-8);
assert.ok(Math.abs(med.jord - (1/(1-ABSORPTION/2))**.25) < 1e-8);
assert.ok(Math.abs(med.luft**4 - med.jord**4/2) < 1e-8);
assert.ok(med.jord > uden.jord);

// Brutto-udsendelsen vokser med temperaturen, også uden sollys.
const varm = energistroemme({jord:1.1,luft:.9},false,true);
const koel = energistroemme({jord:.9,luft:.7},false,true);
assert.ok(varm.jordUd > koel.jordUd && koel.jordUd > 0);
assert.ok(varm.modstraaling > koel.modstraaling && koel.modstraaling > 0);
assert.equal(varm.modstraaling,varm.luftTilRum);

// Intern udveksling ophæver sig: samlet energitilvækst = ind - ud til rummet.
for(const sol of [false,true])for(const gas of [false,true]){
  const f=energistroemme({jord:1.1,luft:.85},sol,gas);
  const jordNet=f.solInd+f.modstraaling-f.jordUd;
  const luftNet=f.luftAbsorberet-f.modstraaling-f.luftTilRum;
  assert.ok(Math.abs(jordNet+luftNet-(f.solInd-f.jordTilRum-f.luftTilRum))<1e-12);
}
const afskaermet=udvikl({...med},20,false,true);
assert.ok(afskaermet.jord<med.jord);
const udenVirkning=udvikl({...med},30,true,false);
assert.ok(udenVirkning.jord<med.jord);
assert.equal(energistroemme(med,true,true).solInd,energistroemme(med,true,false).solInd);
assert.equal(energistroemme(med,true,false).modstraaling,0);
assert.deepEqual(udvikl({...med},0),med);
console.log('Model: analytiske referenceværdier, energibevarelse, temperaturrespons og sammenligning OK.');

// Referencepunkter og fysisk respons for den forstærkede situation.
const { SCENARIER, FORSTAERKET_ABSORPTION, temperaturC } = await import('./model.mjs');
for (const s of SCENARIER) {
  const slut = udvikl(starttilstand(), 600, true, s.absorption);
  assert.ok(Math.abs(temperaturC(slut) - s.temperatur) < 1e-7);
}
const foer = energistroemme(med, true, ABSORPTION);
const efter = energistroemme(med, true, FORSTAERKET_ABSORPTION);
assert.equal(foer.solInd, efter.solInd);
assert.ok(efter.luftAbsorberet > foer.luftAbsorberet);
assert.ok(efter.modstraaling > foer.modstraaling);
assert.ok(efter.jordTilRum < foer.jordTilRum);
assert.ok(udvikl({...med}, 20, true, FORSTAERKET_ABSORPTION).jord > med.jord);
console.log('Tre temperaturreferencer og øget absorption/modstråling ved uændret soltilførsel OK.');
