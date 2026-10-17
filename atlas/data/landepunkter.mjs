// Danner landepunkter.json: ét punkt pr. land til cirkler og symboler på globussen.
// Kør: node atlas/data/landepunkter.mjs
//
// Punktet ligger midt inde i landets største sammenhængende landområde
// (Natural Earth 1:50m via world-atlas), ikke i tyngdepunktet: tyngdepunktet
// kan falde i havet eller i et naboland (fx for Chile, Kroatien eller USA med
// Alaska). Metoden er en enkel »polylabel«: det punkt i et fint net over
// området, der ligger længst fra kysten og grænserne.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const her = fileURLToPath(new URL('.', import.meta.url));
const kontekst = {};
vm.createContext(kontekst);
for (const navn of ['d3-array', 'd3-geo', 'topojson-client']) {
  vm.runInContext(readFileSync(`${her}../vendor/${navn}.min.js`, 'utf8'), kontekst);
}
const { d3, topojson } = kontekst;

const kort = JSON.parse(readFileSync(`${her}countries-50m.json`, 'utf8'));
const lande = topojson.feature(kort, kort.objects.countries).features;
// Samme koder som landemenuen for områder uden FN-kode i kortet.
const UDEN_KODE = { Kosovo: '412', 'N. Cyprus': null, Somaliland: null };

// Afstand (grader, længde skaleret med cos(bredde)) fra et punkt til nærmeste kant.
function kantafstand([x, y], ringe) {
  let min = Infinity;
  const k = Math.cos(y * Math.PI / 180);
  for (const ring of ringe) {
    for (let i = 1; i < ring.length; i++) {
      const [ax, ay] = ring[i - 1], [bx, by] = ring[i];
      const dx = (bx - ax) * k, dy = by - ay, px = (x - ax) * k, py = y - ay;
      const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy || 1)));
      min = Math.min(min, Math.hypot(px - t * dx, py - t * dy));
    }
  }
  return min;
}

// Plan punkt-i-polygon (lige/ulige-reglen); længder flyttes ind i ringens interval.
function indeni([x, y], ringe) {
  let inde = false;
  for (const ring of ringe) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inde = !inde;
    }
  }
  return inde;
}

function midtpunkt(feature) {
  const dele = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const stoerst = dele.map(coordinates => ({ type: 'Polygon', coordinates }))
    .reduce((a, b) => d3.geoArea(a) >= d3.geoArea(b) ? a : b);
  // Over datolinjen (Rusland, Fiji) lægges østlige længder over 180°, så ringen er sammenhængende.
  const kryds = stoerst.coordinates[0].some(([x]) => x > 170) && stoerst.coordinates[0].some(([x]) => x < -170);
  const ringe = stoerst.coordinates.map(r => r.map(([x, y]) => [kryds && x < 0 ? x + 360 : x, y]));
  const xs = ringe[0].map(p => p[0]), ys = ringe[0].map(p => p[1]);
  let [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  let bedst = null, bedstAfstand = -1;
  // Groft net, derefter to finere net omkring det bedste punkt.
  for (let runde = 0; runde < 3; runde++) {
    const N = 24;
    for (let i = 0; i <= N; i++) {
      for (let j = 0; j <= N; j++) {
        const p = [x0 + (x1 - x0) * i / N, y0 + (y1 - y0) * j / N];
        if (!indeni(p, ringe)) continue;
        const a = kantafstand(p, ringe);
        if (a > bedstAfstand) { bedst = p; bedstAfstand = a; }
      }
    }
    if (!bedst) break;
    const bx = (x1 - x0) / 6, by = (y1 - y0) / 6;
    [x0, x1, y0, y1] = [bedst[0] - bx, bedst[0] + bx, bedst[1] - by, bedst[1] + by];
  }
  bedst ??= d3.geoCentroid(stoerst);
  const lon = bedst[0] > 180 ? bedst[0] - 360 : bedst[0];
  return [+lon.toFixed(2), +bedst[1].toFixed(2)];
}

// Flere kortobjekter kan dele kode (fx Australien og Ashmore- og Cartierøerne): saml dem.
const efterId = new Map();
for (const f of lande) {
  const id = f.id ?? UDEN_KODE[f.properties?.name];
  if (!id || id === '010') continue;   // Antarktis udelades
  const dele = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  efterId.set(id, [...(efterId.get(id) ?? []), ...dele]);
}
const punkter = {};
for (const [id, dele] of efterId) punkter[id] = midtpunkt({ geometry: { type: 'MultiPolygon', coordinates: dele } });
const dk = punkter['208'];
if (!dk || Math.abs(dk[0] - 9.2) > 1 || Math.abs(dk[1] - 56) > .7) throw new Error(`Kontrol af Danmark fejlede: ${dk}`);
writeFileSync(`${her}landepunkter.json`, JSON.stringify(punkter));
console.log(Object.keys(punkter).length, 'lande', 'Danmark', dk, 'USA', punkter['840'], 'Chile', punkter['152'], 'Rusland', punkter['643']);
