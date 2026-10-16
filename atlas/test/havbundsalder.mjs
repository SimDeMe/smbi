// Kontrollér havbundsgitteret, aflæsningen, profilerne og rasterprojektionen.
//   node atlas/test/havbundsalder.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { NX, NY, TRIN, afkod, alderI, profil, hastighed, PROFILER, periode, beskriv, rasterTil, klasseFor, KLASSER } from '../havbundsalder.js';

const naer = (a, b, tol, tekst) => assert.ok(Math.abs(a - b) <= tol, `${tekst}: ${a} skulle være ${b} ± ${tol}`);
const fil = fs.readFileSync(new URL('../data/havbundsalder.bin', import.meta.url));
assert.equal(createHash('sha256').update(fil).digest('hex'), '21b8249d8f05cc8aa6507a7b6adab65333a8988e3c44651a09302936a0799eab', 'filen er den, LICENSE beskriver');
const k = afkod(zlib.gunzipSync(fil));
assert.equal(k.length, NX * NY);
assert.throws(() => afkod(new Uint8Array(100)), /ugyldige/);

// Nøgletal (arealvægtet), som data/havbundsalder.py skriver i LICENSE.
let sum = 0, vaegt = 0, maks = 0, gyldige = 0, ung = 0;
for (let y = 0; y < NY; y++) {
  const w = Math.cos((89.9 - .2 * y) * Math.PI / 180);
  for (let x = 0; x < NX; x++) {
    const v = k[y * NX + x];
    if (!v) continue;
    const a = (v - 1) / TRIN;
    gyldige++; sum += a * w; vaegt += w; maks = Math.max(maks, a);
    if (a < 20) ung += w;
  }
}
naer(gyldige / (NX * NY), .493, .002, 'andel celler med alder');
naer(sum / vaegt, 62.9, .2, 'arealvægtet middelalder (Seton m.fl.: 64,2)');
naer(maks, 338.6, .3, 'ældste havbund (Østmiddelhavet)');
naer(ung / vaegt, .20, .01, 'andel yngre end 20 mio. år');

// Kendte steder.
assert.ok(alderI(-28.7, 60.5, k) < 2, 'Reykjanesryggen er ung');
assert.ok(alderI(-113.9, -22.7, k) < 1.5, 'Østpacifiske Ryg er ung');
assert.ok(alderI(-73, 27, k) > 150, 'jurassisk havbund ud for Bahamas');
assert.ok(alderI(152, 18, k) > 140, 'gammel havbund ved Marianergraven');
assert.equal(alderI(9.5, 56.2, k), null, 'Jylland har ingen havbundsalder');
assert.equal(alderI(3, 56, k), null, 'Nordsøen er kontinental skorpe');
assert.ok(alderI(-180, 0, k) !== undefined && alderI(180, 0, k) === alderI(-180, 0, k), 'datolinjen hænger sammen');
assert.equal(periode(47), 'eocæn (palæogen)');
assert.equal(periode(120), 'tidlig kridt');
assert.equal(periode(170), 'jura');
assert.match(beskriv(3.24), /3,2 mio\. år gammel – pliocæn/);
assert.match(beskriv(null), /ingen havbundsalder/);
assert.equal(klasseFor(19.9), 0); assert.equal(klasseFor(20), 1); assert.equal(klasseFor(250), 10);
assert.equal(KLASSER.length, 11);

// Profilerne krydser en ryg, og halv spredningshastighed passer med kendte værdier
// (Atlanten ca. 1–2,5, Østpacifik 5–11, Australien–Antarktis ca. 3–4 cm/år).
const forventet = { sydatlanten: [1.5, 2.5], nordatlanten: [1.2, 2.0], reykjanes: [1.0, 1.6], oestpacifik: [5, 11.5], indiske: [2.8, 4] };
for (const p of PROFILER) {
  const prof = profil(p.fra, p.til, 360, k);
  assert.ok(prof.ryg !== null && prof.punkter[prof.ryg].alder < 1.5, `${p.id}: ryg fundet`);
  assert.ok(prof.punkter.filter(q => q.alder !== null).length > .9 * prof.punkter.length, `${p.id}: dækket af havbund`);
  for (const i of [Math.round(prof.ryg * .4), Math.round(prof.ryg + (360 - prof.ryg) * .6)]) {
    const h = hastighed(prof, i);
    assert.ok(h.cm >= forventet[p.id][0] && h.cm <= forventet[p.id][1], `${p.id}: ${h.cm.toFixed(2)} cm/år ved ${Math.round(h.km)} km`);
  }
  naer(prof.punkter.at(-1).km, prof.laengde, 1e-6, 'profilens længde');
}
const vest = profil([140, 30], [175, 30], 200, k);
assert.equal(vest.ryg, null, 'en profil uden ryg har ingen ryg');
assert.equal(hastighed(vest, 50), null);
const kort = profil([-28.7, 60.5], [-28.6, 60.5], 20, k);
assert.equal(hastighed(kort, 10).cm, null, 'ingen hastighed tæt på ryggen');

// Rasterets baglæns projektion skal ramme det samme punkt som D3's geoOrthographic.
const kontekst = { console };
vm.createContext(kontekst);
for (const f of ['d3-array', 'd3-geo']) vm.runInContext(fs.readFileSync(new URL(`../vendor/${f}.min.js`, import.meta.url), 'utf8'), kontekst);
const d3 = kontekst.d3;
// Kunstigt gitter: klasse efter længde- og breddefelter på 15°.
const kunst = new Uint16Array(NX * NY);
const kunstklasse = (lon, lat) => (Math.floor((lon + 180) / 15) + 3 * Math.floor((lat + 90) / 15)) % 11;
for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
  kunst[y * NX + x] = 1 + TRIN * (20 * kunstklasse(-180 + .2 * x + .1, 89.9 - .2 * y) + 10);
}
for (const [centrum, skala] of [[[-22, 42], 240], [[150, -60], 600], [[10, 85], 300], [[-170, 0], 2000]]) {
  const w = 300, h = 220;
  const projektion = d3.geoOrthographic().translate([w / 2, h / 2]).scale(skala).rotate([-centrum[0], -centrum[1]]).clipAngle(90);
  const billede = new Uint8ClampedArray(4 * w * h);
  const klasser = rasterTil(billede, w, h, { centrum, skala, cx: w / 2, cy: h / 2, linjer: false, k: kunst });
  let ens = 0, alle = 0;
  for (let j = 0; j < h; j += 3) for (let i = 0; i < w; i += 3) {
    const p = projektion.invert([i + .5, j + .5]);
    const inde = Math.hypot(i + .5 - w / 2, j + .5 - h / 2) <= skala;
    if (!inde) { assert.equal(klasser[j * w + i], -2, 'uden for kloden tegnes intet'); continue; }
    alle++;
    if (klasser[j * w + i] === klasseFor(alderI(p[0], p[1], kunst))) ens++;
  }
  assert.ok(alle > 100 && ens / alle > .99, `projektion ${centrum}: ${ens}/${alle}`);
}

console.log('Alle test af havbundens alder bestået.');
