// Kontrollér nedbørsgitteret, kendte steder, solens zenitbredde og rasterprojektionen.
//   node atlas/test/nedboer.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { NX, NY, afkod, mmI, aaretI, beskriv, zenitbredde, klasseFor, KLASSER, MAANEDER, geometri, farvTil } from '../nedboer.js';

const naer = (a, b, tol, tekst) => assert.ok(Math.abs(a - b) <= tol, `${tekst}: ${a} skulle være ${b} ± ${tol}`);
const fil = fs.readFileSync(new URL('../data/nedboer.bin', import.meta.url));
assert.equal(createHash('sha256').update(fil).digest('hex'), '4442fc3e4979f35517962d30e68865c2c6dd4db54f1a4a29c5147a8ec04b47cb', 'filen er den, LICENSE beskriver');
const d = afkod(zlib.gunzipSync(fil));
assert.equal(d.length, 12 * NX * NY);
assert.throws(() => afkod(new Uint8Array(100)), /ugyldige/);

// Nøgletal (arealvægtet), som data/nedboer.py skriver i LICENSE.
const DOEGN = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
let sum = 0, vaegt = 0, maks = 0;
for (let m = 0; m < 12; m++) for (let y = 0; y < NY; y++) {
  const w = Math.cos((88.75 - 2.5 * y) * Math.PI / 180);
  for (let x = 0; x < NX; x++) {
    const v = d[m * NX * NY + y * NX + x];
    sum += v / DOEGN[m] * w; vaegt += w; maks = Math.max(maks, v);
  }
}
naer(sum / vaegt, 2.69, .01, 'globalt middel i mm/døgn (GPCP: ca. 2,7)');
naer(maks, 884, 1, 'største månedsværdi');

// Kendte nedbørsmønstre (cellemiddel, så kun grove grænser).
const aar = (lon, lat) => aaretI(lon, lat, d);
const sumAf = a => a.reduce((x, y) => x + y, 0);
const mumbai = aar(72.9, 19.1);
assert.ok(mumbai[6] > 300 && mumbai[0] < 15, `Mumbai: monsun i juli (${mumbai.map(Math.round)})`);
const niamey = aar(2.1, 13.5);
assert.ok(niamey[7] > 150 && niamey[0] < 2 && sumAf(niamey.slice(5, 9)) / sumAf(niamey) > .85, 'Niamey: regntid juni–september');
const rom = aar(12.5, 41.9);
assert.ok(rom[10] > 2.5 * rom[6], 'Rom: vinterregn, tør sommer');
const kbh = aar(12.6, 55.7);
assert.ok(kbh.every(v => v > 40 && v < 100) && sumAf(kbh) > 700 && sumAf(kbh) < 1000, 'København: regn hele året');
assert.ok(sumAf(aar(20, 22)) < 30, 'Sahara: under 30 mm på et år');
assert.ok(sumAf(aar(5.3, 60.4)) > 1.8 * sumAf(kbh), 'Bergen får langt mere end København');
const darwin = aar(130.8, -12.4);
assert.ok(darwin[0] > 250 && darwin[6] < 10, 'Darwin: regn om sommeren på den sydlige halvkugle');
const lagos = aar(3.4, 6.5);
assert.ok(lagos[7] < lagos[5] && lagos[7] < lagos[8], 'Lagos: to regntider med pause i august');
naer(mmI(-180, 0, 0, d), mmI(180, 0, 0, d), 1e-9, 'datolinjen hænger sammen');
assert.ok(Number.isFinite(mmI(0, 90, 0, d)) && Number.isFinite(mmI(0, -90, 6, d)), 'polerne har værdier');

// ITK: bredden med mest nedbør over Afrika (10° V–40° Ø) følger solen.
const itk = m => {
  let bedst = -1, b = 0;
  for (let lat = -30; lat <= 30; lat += .5) {
    let s = 0;
    for (let lon = -10; lon < 40; lon += 2.5) s += mmI(lon, lat, m, d);
    if (s > bedst) { bedst = s; b = lat; }
  }
  return b;
};
assert.ok(itk(0) < -8 && itk(6) > 8, `ITK over Afrika: ${itk(0)}° i januar, ${itk(6)}° i juli`);

// Solens zenitbredde midt i måneden (Spencer 1971; almanakværdier ± 0,5°).
for (const [m, b] of [[0, -21.3], [2, -2.4], [5, 23.3], [6, 21.6], [8, 3.2], [11, -23.3]]) naer(zenitbredde(m), b, .5, `zenitbredde ${MAANEDER[m]}`);

assert.equal(KLASSER.length, 10);
assert.equal(klasseFor(0), 0); assert.equal(klasseFor(9.9), 0); assert.equal(klasseFor(10), 1);
assert.equal(klasseFor(100), 5); assert.equal(klasseFor(399), 8); assert.equal(klasseFor(900), 9);
assert.equal(beskriv(kbh.map(() => 0.04), 0), 'under 1 mm i januar · under 1 mm på et år');
assert.match(beskriv(mumbai, 6), /^\d+ mm i juli · 1\.\d{3} mm på et år$/);
assert.equal(beskriv(null, 0), 'ingen data');

// Rasterets baglæns projektion skal ramme det samme punkt som D3's geoOrthographic.
const kontekst = { console };
vm.createContext(kontekst);
for (const f of ['d3-array', 'd3-geo']) vm.runInContext(fs.readFileSync(new URL(`../vendor/${f}.min.js`, import.meta.url), 'utf8'), kontekst);
const d3 = kontekst.d3;
for (const [centrum, skala] of [[[-22, 42], 240], [[150, -60], 600], [[10, 85], 300], [[-170, 0], 2000]]) {
  const w = 300, h = 220;
  const projektion = d3.geoOrthographic().translate([w / 2, h / 2]).scale(skala).rotate([-centrum[0], -centrum[1]]).clipAngle(90);
  const geo = geometri(w, h, { centrum, skala, cx: w / 2, cy: h / 2 });
  const billede = new Uint8ClampedArray(4 * w * h);
  const klasser = farvTil(billede, geo, { maaned: 6, fra: 6, t: 1 }, d, false);
  let ens = 0, alle = 0;
  for (let j = 0; j < h; j += 3) for (let i = 0; i < w; i += 3) {
    const p = projektion.invert([i + .5, j + .5]);
    const inde = Math.hypot(i + .5 - w / 2, j + .5 - h / 2) <= skala;
    if (!inde) { assert.equal(klasser[j * w + i], -1, 'uden for kloden tegnes intet'); continue; }
    alle++;
    if (klasser[j * w + i] === klasseFor(mmI(p[0], p[1], 6, d))) ens++;
  }
  assert.ok(alle > 100 && ens / alle > .99, `projektion ${centrum}: ${ens}/${alle}`);
}
// Under et skift er farven en blanding af de to måneder; ved t = 0 og 1 er den månedens egen.
const geo = geometri(60, 60, { centrum: [10, 10], skala: 28, cx: 30, cy: 30 });
const a = farvTil(new Uint8ClampedArray(4 * 3600), geo, { maaned: 0, fra: 0, t: 1 }, d, false);
const b = farvTil(new Uint8ClampedArray(4 * 3600), geo, { maaned: 6, fra: 0, t: 0 }, d, false);
const c = farvTil(new Uint8ClampedArray(4 * 3600), geo, { maaned: 6, fra: 6, t: 1 }, d, false);
const e = farvTil(new Uint8ClampedArray(4 * 3600), geo, { maaned: 6, fra: 0, t: 1 }, d, false);
assert.deepEqual(a, b, 't = 0 viser den gamle måned');
assert.deepEqual(c, e, 't = 1 viser den nye måned');

console.log('Alle test af nedbørslaget bestået.');
