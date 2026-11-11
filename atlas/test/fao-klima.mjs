import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { udtraek } from '../data/fao-klima.mjs';

const json = sti => JSON.parse(readFileSync(new URL(sti, import.meta.url)));
const supplement = json('../data/fao-klima.json');
const klima = json('../data/klima.json');
const stationer = supplement.lande['706'];
assert.deepEqual(klima.lande['706'], stationer, 'Runtime-data følger FAO-supplementet');
assert.deepEqual(stationer.map(s => s.navn), ['MOGADISCIO', 'LUG-GANANE', 'KHISMAIO', 'HARGEISA']);
assert.deepEqual(stationer[0].punkt, [45.35, 2.03], 'Mogadishu må ikke få nabopostens koordinater');
assert.equal(stationer[0].n.reduce((a, b) => a + b), 474);
assert.equal(stationer[0].t[0], 26.55);
assert.deepEqual(stationer[3].punkt, [44.08, 9.5]);
assert.equal(stationer[3].hoejde, 1326);
for (const s of stationer) {
  assert(!('wmo' in s), 'FAO-koder er ikke WMO-numre');
  assert.equal(s.periode, 'Måleperiode ikke oplyst');
  for (const felt of ['t', 'n', 'tmin', 'tmax']) assert.equal(s[felt].length, 12);
  for (let i = 0; i < 12; i++) {
    assert(s.n[i] >= 0 && s.tmin[i] <= s.tmax[i]);
    assert.equal(s.t[i], +((s.tmin[i] + s.tmax[i]) / 2).toFixed(2));
  }
}
assert.equal(klima.lande['208'][0].wmo, '06186');
assert.equal(klima.lande['208'][0].t[6], 18.3, 'DWD-normaler bevares');
assert.throws(() => udtraek(Buffer.from('forkert kilde')), /Ukendt CLIMWAT/);
if (process.argv[2]) assert.deepEqual(udtraek(readFileSync(process.argv[2])), supplement, 'Importen kan reproduceres fra FAO-arkivet');
console.log('FAO: kilde, stationsplacering, månedstal, temperaturmetode og DWD-regression OK');
