// Danner små, lokale visningsdata fra Birds 52 pladepolygoner og Eulerpoler.
// Brug: node atlas/data/plader.mjs PB2002_plates.dig.txt PB2002_poles.dat.txt
// Ingen npm-pakker: samme lokale D3 som i atlasset bruges til sfærisk geometri.
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const navne = {
  AF: 'Afrikanske Plade', AM: 'Amurpladen', AN: 'Antarktiske Plade', AP: 'Altiplanopladen',
  AR: 'Arabiske Plade', AS: 'Ægæiske Plade', AT: 'Anatolske Plade', AU: 'Australske Plade',
  BH: 'Birds Head-pladen', BR: 'Balmoral Reef-pladen', BS: 'Bandahavspladen', BU: 'Burmapladen',
  CA: 'Caribiske Plade', CL: 'Carolinepladen', CO: 'Cocospladen', CR: 'Conway Reef-pladen',
  EA: 'Påskeøpladen', EU: 'Eurasiske Plade', FT: 'Futunapladen', GP: 'Galápagospladen',
  IN: 'Indiske Plade', JF: 'Juan de Fuca-pladen', JZ: 'Juan Fernández-pladen', KE: 'Kermadecpladen',
  MA: 'Marianerpladen', MN: 'Manuspladen', MO: 'Maokepladen', MS: 'Molukkerhavspladen',
  NA: 'Nordamerikanske Plade', NB: 'Nordbismarckpladen', ND: 'Nordandespladen', NH: 'Ny Hebrider-pladen',
  NI: "Niuafo'ou-pladen", NZ: 'Nazcapladen', OK: 'Okhotskpladen', ON: 'Okinawapladen',
  PA: 'Stillehavspladen', PM: 'Panamapladen', PS: 'Filippinske Havplade', RI: 'Riverapladen',
  SA: 'Sydamerikanske Plade', SB: 'Sydbismarckpladen', SC: 'Scotiapladen', SL: 'Shetlandpladen',
  SO: 'Somaliske Plade', SS: 'Salomonhavspladen', SU: 'Sundapladen', SW: 'Sydsandwichpladen',
  TI: 'Timorpladen', TO: 'Tongapladen', WL: 'Woodlarkpladen', YA: 'Yangtzepladen'
};
const kontekst = vm.createContext({});
for (const fil of ['d3-array.min.js', 'd3-geo.min.js']) {
  vm.runInContext(fs.readFileSync(new URL('../vendor/' + fil, import.meta.url), 'utf8'), kontekst);
}
const d3 = kontekst.d3;
const graenser = JSON.parse(fs.readFileSync(new URL('./pladegraenser.json', import.meta.url)));
const orogener = { type: 'MultiPolygon', coordinates: graenser.orogener.map(([, flad]) =>
  [Array.from({ length: flad.length / 2 }, (_, i) => flad.slice(i * 2, i * 2 + 2))]) };
const normaliser = x => x > 180 ? x - 360 : x;
const afrund = x => Math.round(x * 1e5) / 1e5;

function ankerpunkt(polygon) {
  // Kartografisk placering, ikke en målestation. Vælg et indre punkt med god
  // afstand til randen, om muligt uden for de brede deformationszoner.
  const ring = polygon.coordinates[0];
  const centrum = d3.geoCentroid(polygon);
  const [[vest, syd], [oest, nord]] = d3.geoBounds(polygon);
  const bredde = oest >= vest ? oest - vest : oest + 360 - vest;
  const kandidater = [centrum];
  for (let i = 1; i < 20; i++) for (let j = 1; j < 20; j++) {
    kandidater.push([normaliser(vest + bredde * i / 20), syd + (nord - syd) * j / 20]);
  }
  for (let i = 0; i < ring.length; i += Math.max(1, Math.floor(ring.length / 50))) {
    kandidater.push(d3.geoInterpolate(centrum, ring[i])(.5), d3.geoInterpolate(centrum, ring[i])(.8));
  }
  const indre = kandidater.filter(p => d3.geoContains(polygon, p));
  const sikre = indre.filter(p => !d3.geoContains(orogener, p));
  const valg = sikre.length ? sikre : indre;
  if (!valg.length) throw new Error('Intet indre ankerpunkt fundet');
  let bedste = valg[0], afstand = -1;
  for (const p of valg) {
    const margin = Math.min(...ring.map(q => d3.geoDistance(p, q)));
    if (margin > afstand) { bedste = p; afstand = margin; }
  }
  const punkt = bedste.map(afrund);
  if (!d3.geoContains(polygon, punkt)) throw new Error('Afrundet anker ligger uden for pladen');
  return { punkt, iOrogen: d3.geoContains(orogener, punkt) };
}

const [polygonfil, polfil] = process.argv.slice(2);
if (!polygonfil || !polfil) throw new Error('Angiv PB2002_plates.dig.txt og PB2002_poles.dat.txt');
const poler = Object.fromEntries(fs.readFileSync(polfil, 'latin1').trim().split(/\r?\n/).map(l => {
  const [id, lat, lon, fart] = l.trim().split(/\s+/);
  return [id, [+lon, +lat, +fart]];
}));
const plader = [];
let id = null, ring = [];
for (const l of fs.readFileSync(polygonfil, 'latin1').trim().split(/\r?\n/)) {
  if (l.startsWith('***')) {
    if (ring.at(-1)[0] !== ring[0][0] || ring.at(-1)[1] !== ring[0][1]) ring.push([...ring[0]]);
    const polygon = { type: 'Polygon', coordinates: [ring.toReversed()] };
    const { punkt, iOrogen } = ankerpunkt(polygon);
    if (!navne[id] || !poler[id]) throw new Error('Ukendt plade: ' + id);
    plader.push({ id, navn: navne[id], punkt, areal: afrund(d3.geoArea(polygon)),
      pol: poler[id], usikker: iOrogen || id === 'SL' });
    id = null; ring = [];
  } else if (id === null) id = l.slice(0, 2);
  else {
    const [lon, lat] = l.split(',').map(Number);
    ring.push([normaliser(lon), lat]);
  }
}
if (plader.length !== 52 || new Set(plader.map(p => p.id)).size !== 52) throw new Error('Forventede 52 plader');
plader.sort((a, b) => b.areal - a.areal);
const data = { kilde: 'Bird (2003), PB2002, tabel 1 og originalfiler',
  polreference: 'PA', radiusKm: 6371, plader };
const fil = new URL('./plader.json', import.meta.url);
fs.writeFileSync(fil, JSON.stringify(data) + '\n');
console.log(fileURLToPath(fil), plader.length, 'plader; indre pile-/navnepunkter beregnet fra polygonerne');
