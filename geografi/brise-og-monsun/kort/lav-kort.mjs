// Genererer kortdata.js: Sydasien og Det Indiske Ocean som faste SVG-stier.
// Kør fra repoets rod: node geografi/brise-og-monsun/kort/lav-kort.mjs
// Kilde: atlas/data/countries-50m.json (Natural Earth via world-atlas 2.0.2,
// public domain; se atlas/data/countries-50m.LICENSE). Bibliotekerne er
// atlassets egne kopier af d3-geo og topojson-client.
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

const rod = new URL('../../../', import.meta.url);
const ctx = vm.createContext({});
for (const f of ['d3-array', 'd3-geo', 'topojson-client', 'topojson-simplify'])
  vm.runInContext(readFileSync(new URL(`atlas/vendor/${f}.min.js`, rod), 'utf8'), ctx);
const { d3, topojson } = ctx;
// Forenkl til ca. 0,5 px i kortets målestok, så filen holdes lille.
const topo = topojson.simplify(topojson.presimplify(JSON.parse(readFileSync(new URL('atlas/data/countries-50m.json', rod), 'utf8'))), 0.01);

// Udsnit: 38–118° Ø, 32° S – 47° N. Mercator, så vindretninger er retvisende.
const B = 1000;
const ramme = { type: 'MultiPoint', coordinates: [[38, -32], [38, 47], [118, 47], [118, -32], [78, 47], [78, -32]] };
const proj = d3.geoMercator().fitWidth(B, ramme);
const [[, y0], [, y1]] = d3.geoPath(proj).bounds(ramme);
const H = Math.round(y1 - y0);
proj.translate([proj.translate()[0], proj.translate()[1] - y0]);
proj.clipExtent([[-5, -5], [B + 5, H + 5]]);
const sti = d3.geoPath(proj).digits(1);

const land = topojson.merge(topo, topo.objects.countries.geometries);
const graenser = topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b);
const ud = `// Genereret af kort/lav-kort.mjs – ret ikke i hånden.
// Natural Earth 1:50 mio. via world-atlas 2.0.2 (public domain).
// Mercator, 38–118° Ø og 32° S – 47° N, i et koordinatsystem på ${B} × ${H}.
export const BREDDE = ${B};
export const HOEJDE = ${H};
export const SKALA = ${proj.scale().toFixed(4)};
export const FLYT = [${proj.translate().map(v => v.toFixed(4)).join(', ')}];
export const LAND = '${sti(land)}';
export const GRAENSER = '${sti(graenser)}';
`;
writeFileSync(new URL('kortdata.js', import.meta.url), ud);
console.log('kortdata.js:', (ud.length / 1024).toFixed(0), 'kB,', B, '×', H);
