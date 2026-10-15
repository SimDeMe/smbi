// Udtræk quizkort fra world-atlas 2.0.2 (Natural Earth 1:10 mio.).
// Brug: node atlas/data/quizlande.mjs <sti til countries-10m.json> [verdensdel …]
// Kilden findes i npm-pakken world-atlas@2.0.2 (SHA-256 3bc6f1d3…5f79).
// Hvert quizland bliver ét objekt med dansk navn. Ubrugte buer fjernes, og de
// bevarede omnummereres i kildens rækkefølge uden ændring af koordinater eller
// transform.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';
import { verdensdele } from '../quizmodel.js';

// Kildens områder uden egen quizplads, som hører til et quizland.
const samles = {
  'N. Cyprus': '196', 'Cyprus U.N. Buffer Zone': '196',
  Kosovo: 'XKX', Somaliland: '706', Baikonur: '398',
  'Hong Kong': '156', Macao: '156', 'USNB Guantanamo Bay': '192'
};
// Kvantiseringen kan få en lille ø til at falde sammen til en ring uden
// areal. D3 tolker den som hele kloden (Maldiverne), så hit-testen ville
// svare forkert overalt. Sådanne polygoner (over en halv klode) fjernes.
const kontekst = createContext({ Math, Object, Array, Float64Array, Uint32Array, Error, Infinity, NaN, Number, Map, Set, Symbol });
for (const fil of ['d3-array.min.js', 'd3-geo.min.js', 'topojson-client.min.js'])
  runInContext(readFileSync(new URL(`../vendor/${fil}`, import.meta.url), 'utf8'), kontekst);
const { d3, topojson } = kontekst;
const kollapset = (topologi, polygon) =>
  d3.geoArea(topojson.feature(topologi, { type: 'Polygon', arcs: polygon })) > 2 * Math.PI;
// Kildeområder med et quizlands id, som ikke er en del af landet.
const udelades = ['Ashmore and Cartier Is.', 'Dhekelia', 'Akrotiri'];

const [kilde, ...valgte] = process.argv.slice(2);
if (!kilde) throw new Error('Angiv stien til countries-10m.json');
const tekst = readFileSync(kilde);
console.log('Kilde SHA-256', createHash('sha256').update(tekst).digest('hex'));
const topologi = JSON.parse(tekst);
const kildelande = topologi.objects.countries.geometries;

for (const del of verdensdele.filter(d => !valgte.length || valgte.includes(d.id))) {
  const buer = new Map();
  const ny = i => {
    const gammel = i < 0 ? ~i : i;
    if (!buer.has(gammel)) buer.set(gammel, null);
    return i;
  };
  const geometrier = del.lande.map(land => {
    const dele = kildelande.filter(g => !udelades.includes(g.properties.name) &&
      (samles[g.properties.name] ?? g.id) === land.id);
    if (!dele.length) throw new Error(`${land.navn} (${land.id}) mangler i kilden`);
    const alle = dele.flatMap(g => g.type === 'Polygon' ? [g.arcs] : g.arcs);
    const polygoner = alle.filter(p => !kollapset(topologi, p));
    if (polygoner.length < alle.length) console.log(land.navn, alle.length - polygoner.length, 'kollapsede polygoner fjernet');
    return { type: polygoner.length === 1 ? 'Polygon' : 'MultiPolygon',
      arcs: polygoner.length === 1 ? polygoner[0] : polygoner,
      id: land.id, properties: { name: land.navn } };
  });
  const gaa = (arcs, f) => typeof arcs[0] === 'number' ? arcs.map(f) : arcs.map(a => gaa(a, f));
  geometrier.forEach(g => gaa(g.arcs, ny));
  const bevarede = [...buer.keys()].sort((a, b) => a - b);
  bevarede.forEach((gammel, nyt) => buer.set(gammel, nyt));
  geometrier.forEach(g => { g.arcs = gaa(g.arcs, i => i < 0 ? ~buer.get(~i) : buer.get(i)); });
  const ud = { type: 'Topology', transform: topologi.transform,
    objects: { countries: { type: 'GeometryCollection', geometries: geometrier } },
    arcs: bevarede.map(i => topologi.arcs[i]) };
  const fil = new URL(`./${del.data}`, import.meta.url);
  writeFileSync(fil, JSON.stringify(ud));
  console.log(del.data, geometrier.length, 'lande', bevarede.length, 'buer',
    Math.round(JSON.stringify(ud).length / 1024), 'kB');
}
