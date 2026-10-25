// Danner danmark-dagi.json til atlassets Danmarkskort (DAGI 1:500.000).
// Kør: node atlas/data/danmark-dagi.mjs <mappe med rådata>
//
// Mappen skal indeholde kommuner.geojson og regioner.geojson fra
// https://raw.githubusercontent.com/ok-dk/dagi/master/geojson/ (se
// danmark-dagi.LICENSE) samt topojson-server 3.0.1 installeret med
// `npm i topojson-server@3.0.1` i samme mappe.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const RAA = process.argv[2];
if (!RAA) throw new Error('Angiv mappen med rådata');
const her = fileURLToPath(new URL('.', import.meta.url));
const { topology } = createRequire(`${RAA}/`)('topojson-server');

// d3-geo og topojson fra atlassets egne vendor-filer, så punkt-i-polygon
// regnes med samme bibliotek som kortet.
const kontekst = {};
vm.createContext(kontekst);
for (const navn of ['d3-array', 'd3-geo', 'topojson-client']) {
  vm.runInContext(readFileSync(`${her}../vendor/${navn}.min.js`, 'utf8'), kontekst);
}
const { d3, topojson } = kontekst;

const kommuner = JSON.parse(readFileSync(`${RAA}/kommuner.geojson`, 'utf8'));
const regioner = JSON.parse(readFileSync(`${RAA}/regioner.geojson`, 'utf8'));

// Et sikkert indre punkt: midten af det bredeste stykke af en vandret linje
// gennem den største polygon (et tyngdepunkt kan ligge uden for en bugtet kommune).
function indrePunkt(polygon) {
  const ring = polygon[0];
  const ys = ring.map(p => p[1]);
  const y = (Math.min(...ys) + Math.max(...ys)) / 2 + 1e-7;
  const xs = [];
  for (let i = 1; i < ring.length; i++) {
    const [a, b] = [ring[i - 1], ring[i]];
    if ((a[1] > y) !== (b[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
  }
  xs.sort((p, q) => p - q);
  let bedst = [0, 0];
  for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i + 1] - xs[i] > bedst[1] - bedst[0]) bedst = [xs[i], xs[i + 1]];
  return [(bedst[0] + bedst[1]) / 2, y];
}
const areal = polygon => Math.abs(d3.geoArea({ type: 'Polygon', coordinates: polygon }));
const regionFor = punkt => regioner.features.find(r => d3.geoContains(r, punkt))?.properties.REGIONNAVN;

// Kildens kommuner er delt i en figur pr. ø; saml dem pr. kommunekode.
const samlet = new Map();
for (const f of kommuner.features) {
  const { KOMKODE: kode, KOMNAVN: navn } = f.properties;
  const polygoner = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
  if (!samlet.has(kode)) samlet.set(kode, { navn, polygoner: [] });
  samlet.get(kode).polygoner.push(...polygoner);
}
// Afrund til 1e-5° (ca. 1 m) før topologien, så delte grænser forbliver delte.
const rund = p => [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5];
const features = [...samlet].map(([kode, { navn, polygoner }]) => {
  const stoerst = polygoner.reduce((a, b) => areal(b) > areal(a) ? b : a);
  // Ertholmene ligger uden for kildens regionsfigurer; de hører til Hovedstaden.
  const punkt = indrePunkt(stoerst);
  const region = regionFor(punkt) ?? (navn === 'Christiansø' ? 'Region Hovedstaden' : null);
  if (!region) throw new Error(`Ingen region for ${navn}`);
  return {
    type: 'Feature', id: kode,
    // p: indre punkt til kommunenavnet, ikke et administrativt centrum.
    properties: { navn, region: region.replace('Region ', ''), p: punkt.map(v => Math.round(v * 1e4) / 1e4) },
    geometry: { type: 'MultiPolygon', coordinates: polygoner.map(p => p.map(r => r.map(rund))) }
  };
}).sort((a, b) => a.id.localeCompare(b.id));

const antal = {};
for (const f of features) antal[f.properties.region] = (antal[f.properties.region] || 0) + 1;
// 98 kommuner + Ertholmene (Christiansø), som ikke er en kommune.
const forventet = { Hovedstaden: 30, Sjælland: 17, Syddanmark: 22, Midtjylland: 19, Nordjylland: 11 };
for (const [r, n] of Object.entries(forventet)) if (antal[r] !== n) throw new Error(`${r}: ${antal[r]} ≠ ${n}`);

const topo = topology({ kommuner: { type: 'FeatureCollection', features } }, 2e5);
const json = JSON.stringify(topo);
writeFileSync(`${her}danmark-dagi.json`, json);

// Kontrol efter kvantisering: kendte punkter på land og i vand.
const t = JSON.parse(json);
const land = topojson.merge(t, t.objects.kommuner.geometries);
const kommuneVed = p => topojson.feature(t, t.objects.kommuner).features.find(f => d3.geoContains(f, p))?.properties.navn;
for (const [p, navn] of [[[10.2039, 56.1629], 'Aarhus'], [[14.7066, 55.1009], 'Bornholm'],
  [[11.6, 56.72], 'Norddjurs'], [[11.0, 57.29], 'Læsø'], [[15.19, 55.32], 'Christiansø']]) {
  if (kommuneVed(p) !== navn) throw new Error(`${p} ligger i ${kommuneVed(p)}, ikke ${navn}`);
}
for (const p of [[9.2, 56.97], [10.97, 55.25], [12.72, 55.85], [18.07, 59.33]]) {
  if (d3.geoContains(land, p)) throw new Error(`${p} burde være vand eller udland`);
}
console.log(`danmark-dagi.json: ${features.length} figurer, ${(json.length / 1024).toFixed(0)} kB`, antal);
