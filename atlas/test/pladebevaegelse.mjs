// Uafhængige referenceprøver for v = ω × r og de versionsbundne kilder.
// node atlas/test/pladebevaegelse.mjs [--originaler /mappe/med/PB2002-filer]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { beregnBevaegelse, formaterFart } from '../pladebevaegelse.js';

const naer = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${a} ≠ ${b}`);
const nul = [0, 0, 0];
const v = beregnBevaegelse([0, 90, 1], nul, [0, 0]);
naer(v.oest, 2 * Math.PI * 6371e5 / 360e6);
naer(v.nord, 0); naer(v.retning, 90);
naer(beregnBevaegelse([0, 90, 1], nul, [0, 60]).fart, v.fart / 2);
naer(beregnBevaegelse([0, 90, 1], nul, [0, 90]).fart, 0);
assert.equal(beregnBevaegelse([24, 50, .7], [24, 50, .7], [140, -30]).retning, null);
assert.equal(formaterFart(1.23), '1,2 cm/år');
for (const punkt of [[0, 0], [179.99, -60], [-179.99, 80], [34, 90]]) {
  const a = [25, 45, .8], b = [-60, -30, 1.2], c = [130, 70, .5];
  const ab = beregnBevaegelse(a, b, punkt), ba = beregnBevaegelse(b, a, punkt);
  const ac = beregnBevaegelse(a, c, punkt), bc = beregnBevaegelse(b, c, punkt);
  for (const felt of ['nord', 'oest']) {
    naer(ab[felt], -ba[felt]); naer(ab[felt], ac[felt] - bc[felt]);
  }
}
console.log('Analytiske hastigheder, breddegradsafhængighed, poler og referenceskift: OK');

const data = JSON.parse(fs.readFileSync(new URL('../data/plader.json', import.meta.url)));
assert.equal(data.plader.length, 52);
assert.equal(new Set(data.plader.map(p => p.id)).size, 52);
assert.equal(data.polreference, 'PA');
assert.equal(data.radiusKm, 6371);
const plader = Object.fromEntries(data.plader.map(p => [p.id, p]));
const island = beregnBevaegelse(plader.NA.pol, plader.EU.pol, [-22, 65]);
assert.ok(island.fart > 1.7 && island.fart < 2.1 && island.retning > 270 && island.retning < 300);
for (const p of data.plader) {
  assert.ok(p.punkt.every(Number.isFinite) && p.pol.every(Number.isFinite));
  assert.ok(p.areal > 0 && p.navn.length > 3);
  assert.equal(typeof p.usikker, 'boolean');
}
assert.equal(plader.SL.usikker, true);
console.log('52 entydige plader, lokal bevægelse ved Island og usikker Shetlandmodel: OK');

if (process.argv[2] !== '--originaler') process.exit(0);
const mappe = process.argv[3];
const sha = {
  'PB2002_plates.dig.txt': 'ff7e25dbf29658d4330b38e95e876533c5cdfd292ef71fa806e2340edfa3abc0',
  'PB2002_poles.dat.txt': '887d208bda44cea75ee0c778c1883476906757a3d8035608a6cff7b79cf40f2e',
  'PB2002_steps.dat.txt': '513babb111c65cd275274e2edcb249085d00e007c79d8755e1b4b79f60806f37'
};
const originaler = {};
for (const [fil, sum] of Object.entries(sha)) {
  const bytes = fs.readFileSync(path.join(mappe, fil)).filter(b => b !== 13);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), sum, `Ukendt kildeversion: ${fil}`);
  originaler[fil] = bytes.toString('latin1');
}
for (const l of originaler['PB2002_poles.dat.txt'].trim().split('\n')) {
  const [id, lat, lon, fart] = l.trim().split(/\s+/);
  assert.deepEqual(plader[id].pol, [+lon, +lat, +fart]);
}

const kontekst = vm.createContext({});
for (const fil of ['d3-array.min.js', 'd3-geo.min.js']) {
  vm.runInContext(fs.readFileSync(new URL('../vendor/' + fil, import.meta.url), 'utf8'), kontekst);
}
const d3 = kontekst.d3;
let id, ring = [], antal = 0, areal = 0;
for (const l of originaler['PB2002_plates.dig.txt'].trim().split('\n')) {
  if (l.startsWith('***')) {
    const polygon = { type: 'Polygon', coordinates: [ring.toReversed()] };
    assert.ok(d3.geoContains(polygon, plader[id].punkt), `Pilepunkt uden for ${id}`);
    naer(plader[id].areal, d3.geoArea(polygon), .000006);
    areal += d3.geoArea(polygon); antal++;
    id = undefined; ring = [];
  } else if (!id) id = l.slice(0, 2);
  else ring.push(l.split(',').map(Number));
}
assert.equal(antal, 52); naer(areal, 4 * Math.PI, .0001);

let maxFartfejl = 0, maxRetningsfejl = 0, trin = 0;
for (const l of originaler['PB2002_steps.dat.txt'].trim().split('\n')) {
  const t = l.trim().split(/\s+/), navn = t[1].replace(/^:/, '');
  const a = plader[navn.slice(0, 2)], b = plader[navn.slice(3, 5)];
  const midt = d3.geoInterpolate(t.slice(2, 4).map(Number), t.slice(4, 6).map(Number))(.5);
  const v = beregnBevaegelse(a.pol, b.pol, midt);
  // Birds tabel 2: mm/år og heltalsgrader ved storcirkelstykkets midtpunkt.
  const fartfejl = Math.abs(v.fart - Number(t[8]) / 10);
  const retningsfejl = Math.abs((v.retning - Number(t[9]) + 540) % 360 - 180);
  assert.ok(fartfejl < .008, `Trin ${t[0]}: ${fartfejl} cm/år`);
  if (Number(t[8]) > 1) assert.ok(retningsfejl < .51, `Trin ${t[0]}: ${retningsfejl}°`);
  maxFartfejl = Math.max(maxFartfejl, fartfejl);
  maxRetningsfejl = Math.max(maxRetningsfejl, retningsfejl); trin++;
}
assert.equal(trin, 5819);
console.log(`Versionsbundne poler, 52 indre pilepunkter og ${trin} uafhængige kildehastigheder: OK`);
console.log({ maxFartfejl_cmPrAar: maxFartfejl, maxRetningsfejl_grader: maxRetningsfejl });
