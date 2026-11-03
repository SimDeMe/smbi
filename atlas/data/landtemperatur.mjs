// Kør node atlas/data/landtemperatur.mjs efter en opdatering af temperatur.bin.
// Arealvægtet middel over gittercentre inden for landets grænser (Natural Earth).
// Et estimat vises kun med mindst tre centre og dækning af mindst 80 % af vægten.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';
import { gunzipSync } from 'node:zlib';
import { afkod, globaltMiddel, GRUNDLAG, NX, NY, tI } from '../temperatur.js';

const fil = navn => new URL(navn, import.meta.url);
const kontekst = vm.createContext({});
for (const navn of ['d3-array', 'd3-geo', 'topojson-client']) {
  vm.runInContext(readFileSync(fil(`../vendor/${navn}.min.js`), 'utf8'), kontekst);
}
const { d3, topojson } = kontekst;
const kort = JSON.parse(readFileSync(fil('countries-50m.json'), 'utf8'));
const data = afkod(gunzipSync(readFileSync(fil('temperatur.bin'))));
const afrund = n => Math.round(100 * n) / 100;
const lande = {};
const lokale = {};
const punkter = JSON.parse(readFileSync(fil('landepunkter.json'), 'utf8'));

for (const land of topojson.feature(kort, kort.objects.countries).features) {
  const id = land.id ?? (land.properties.name === 'Kosovo' ? '412' : null);
  if (!id) continue;
  const [[vest, syd], [oest, nord]] = d3.geoBounds(land);
  const celler = [];
  for (let y = 0; y < NY; y++) {
    const lat = 89 - 2 * y;
    if (lat < syd || lat > nord) continue;
    const vaegt = Math.cos(lat * Math.PI / 180);
    for (let x = 0; x < NX; x++) {
      const lon = -179 + 2 * x;
      const indenfor = vest <= oest ? lon >= vest && lon <= oest : lon >= vest || lon <= oest;
      if (indenfor && d3.geoContains(land, [lon, lat])) celler.push([y * NX + x, vaegt]);
    }
  }
  if (celler.length < 3) {
    const punkt = punkter[id];
    if (punkt) lokale[id] = data.perioder.map((_, i) => {
      const t = tI(...punkt, i, data);
      return Number.isFinite(t) ? afrund(t) : null;
    });
    continue;
  }
  const total = celler.reduce((sum, [, v]) => sum + v, 0);
  lande[id] = data.perioder.map((_, i) => {
    let sum = 0, vaegt = 0;
    for (const [j, v] of celler) {
      const t = data.d[i * NX * NY + j];
      if (!Number.isFinite(t)) continue;
      sum += t * v;
      vaegt += v;
    }
    return vaegt >= .8 * total ? afrund(sum / vaegt) : null;
  });
}
const verden = data.perioder.map((_, i) => afrund(globaltMiddel(i, data)));
writeFileSync(fil('landtemperatur.json'), JSON.stringify({ grundlag: GRUNDLAG, perioder: data.perioder, verden, lande, lokale }) + '\n');
