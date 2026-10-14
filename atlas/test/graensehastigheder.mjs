// Kontroller fortegn, samlet spredning, kildetal og lokal geografi.
// node atlas/test/graensehastigheder.mjs [--originaler /mappe/med/PB2002-filer]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { hastighedstekst, tvaerstekst, formaterKomponent } from '../graensehastigheder.js';
import { beregnBevaegelse } from '../pladebevaegelse.js';

assert.equal(tvaerstekst(1.84), 'Fra 1,8 cm/år'); // Samlet åbning, ikke 0,9.
assert.equal(tvaerstekst(-7.59), 'Mod 7,6 cm/år');
assert.equal(tvaerstekst(0), 'Tværs 0,0 cm/år');
assert.equal(formaterKomponent(.02), '<0,1 cm/år');
assert.equal(hastighedstekst({ klasse: 'CTF', langs: -4.55, aabning: -.42, usikker: true }), '≈ 4,6 cm/år');
assert.equal(hastighedstekst({ klasse: 'SUB', langs: 2.46, aabning: -7.59 }), '7,6 cm/år');
const data = JSON.parse(fs.readFileSync(new URL('../data/graensehastigheder.json', import.meta.url)));
assert.equal(data.enhed, 'mm/år'); assert.equal(data.kildetrin, 5819);
assert.equal(data.punkter.length, 1937);
assert.equal(new Set(data.punkter.map(p => p[0])).size, 1937);
for (const [trin, graense, klasse, usikker, lon, lat, azimut, aabning, langs] of data.punkter) {
  assert.ok(Number.isInteger(trin) && /^[A-Z]{2}[-/\\][A-Z]{2}$/.test(graense));
  assert.ok([0, 1].includes(usikker));
  assert.ok(Math.abs(lon) <= 180 && Math.abs(lat) <= 90 && azimut >= 0 && azimut <= 360);
  assert.ok(Math.abs(aabning) < 500 && Math.abs(langs) < 500);
  if (['OSR', 'CRB'].includes(klasse)) assert.ok(aabning > 0);
  if (['SUB', 'OCB', 'CCB'].includes(klasse)) assert.ok(aabning < 0);
}
for (const [trin, graense, aabning, langs] of [[4200, 'EU-NA', 18.4, -1.5], [3089, 'NZ\\SA', -75.9, 24.6],
  [2876, 'NA-PA', -4.2, 45.5], [2644, 'PA\\OK', -91.8, -13.3]]) {
  const p = data.punkter.find(p => p[0] === trin);
  assert.equal(p[1], graense); assert.equal(p[7], aabning); assert.equal(p[8], langs);
}
console.log('Fortegn, cm/år, samlet spredning samt Island, Andes, San Andreas og Japan: OK');
if (process.argv[2] !== '--originaler') process.exit(0);

const bytes = fs.readFileSync(path.join(process.argv[3], 'PB2002_steps.dat.txt')).filter(b => b !== 13);
assert.equal(createHash('sha256').update(bytes).digest('hex'), '513babb111c65cd275274e2edcb249085d00e007c79d8755e1b4b79f60806f37');
const linjer = bytes.toString('latin1').trimEnd().split('\n');
const kontekst = vm.createContext({});
for (const f of ['d3-array', 'd3-geo']) vm.runInContext(fs.readFileSync(new URL('../vendor/' + f + '.min.js', import.meta.url), 'utf8'), kontekst);
const d3 = kontekst.d3;
const plader = Object.fromEntries(JSON.parse(fs.readFileSync(new URL('../data/plader.json', import.meta.url))).plader.map(p => [p.id, p]));
for (const p of data.punkter) {
  const l = linjer[p[0] - 1];
  assert.equal(+l.slice(0, 4), p[0]); assert.equal(l.slice(6, 11), p[1]);
  assert.equal(l.slice(92, 95), p[2]);
  assert.equal(+(l[95] === '*' || p[1].includes('SL')), p[3]);
  assert.equal(+l.slice(52, 55), p[6]);
  assert.equal(+l.slice(66, 72), p[7]); assert.equal(+l.slice(73, 79), p[8]);
  const a = [+l.slice(12, 20), +l.slice(21, 28)], b = [+l.slice(29, 37), +l.slice(38, 45)];
  const midt = d3.geoInterpolate(a, b)(.5);
  assert.ok(d3.geoDistance(midt, p.slice(4, 6)) < 1.3e-7, `Punkt ${p[0]} er flyttet`);
}
for (const l of linjer) {
  const id = l.slice(6, 11), a = [+l.slice(12, 20), +l.slice(21, 28)], b = [+l.slice(29, 37), +l.slice(38, 45)];
  const midt = d3.geoInterpolate(a, b)(.5);
  const v = beregnBevaegelse(plader[id.slice(0, 2)].pol, plader[id.slice(3, 5)].pol, midt);
  const azimut = +l.slice(52, 55) * Math.PI / 180;
  const normal = v.nord * Math.sin(azimut) - v.oest * Math.cos(azimut);
  const langs = v.nord * Math.cos(azimut) + v.oest * Math.sin(azimut);
  // Den publicerede orientering er afrundet til heltalsgrader. Dens halve
  // grad plus pol-/komponentafrunding sætter sammenligningens præcision.
  const tolerance = v.fart * Math.sin(.5 * Math.PI / 180) + .012;
  assert.ok(Math.abs(normal - +l.slice(66, 72) / 10) < tolerance, `Fortegn/normal ved trin ${l.slice(0, 4)}`);
  assert.ok(Math.abs(langs - +l.slice(73, 79) / 10) < tolerance, `Langs ved trin ${l.slice(0, 4)}`);
}
console.log('1937 kildepunkter og begge komponenter uændret; 5819 uafhængige rotationsberegninger: OK');
