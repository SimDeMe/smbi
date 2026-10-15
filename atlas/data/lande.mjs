// Danner demografi.json og klima.json til atlassets landemenu.
// Kør: node atlas/data/lande.mjs <mappe med rådata>
//
// Rådata hentes manuelt (se lande.LICENSE) og lægges i samme mappe:
//   pyr.csv.gz      WPP2024_PopulationByAge5GroupSex_Medium.csv.gz
//   dem.csv.gz      WPP2024_Demographic_Indicators_Medium.csv.gz
//   hdr.csv         HDR25_Composite_indices_complete_time_series.csv
//   wb_lande.json   api.worldbank.org/v2/country?format=json&per_page=400
//   wb_by.json      api.worldbank.org/v2/country/all/indicator/SP.URB.TOTL.IN.ZS?format=json&per_page=20000&date=2015:2025
//   temp9120.txt, nedb9120.txt, temp6190.txt, nedb6190.txt, st.txt
//                   DWD CLIMAT multi_annual (middeltemperatur og nedbør) og
//                   stationslisten, omkodet til UTF-8 uden CR.
import { readFileSync, writeFileSync, createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const RAA = process.argv[2];
if (!RAA) throw new Error('Angiv mappen med rådata');
const her = fileURLToPath(new URL('.', import.meta.url));
const fil = navn => `${RAA}/${navn}`;

// d3-geo og topojson fra atlassets egne vendor-filer, så punkt-i-polygon
// regnes med samme bibliotek som globussen.
const kontekst = {};
vm.createContext(kontekst);
for (const navn of ['d3-array', 'd3-geo', 'topojson-client']) {
  vm.runInContext(readFileSync(`${her}../vendor/${navn}.min.js`, 'utf8'), kontekst);
}
const d3 = kontekst.d3, topojson = kontekst.topojson;

function csvLinje(linje) {
  const felter = []; let felt = '', citat = false;
  for (let i = 0; i < linje.length; i++) {
    const t = linje[i];
    if (citat) {
      if (t === '"' && linje[i + 1] === '"') { felt += '"'; i++; }
      else if (t === '"') citat = false;
      else felt += t;
    } else if (t === '"') citat = true;
    else if (t === ',') { felter.push(felt); felt = ''; }
    else felt += t;
  }
  felter.push(felt);
  return felter;
}

async function* csvRaekker(sti) {
  const strøm = sti.endsWith('.gz') ? createReadStream(sti).pipe(createGunzip()) : createReadStream(sti);
  let hoved;
  for await (const linje of createInterface({ input: strøm, crlfDelay: Infinity })) {
    if (!hoved) { hoved = csvLinje(linje.replace(/^﻿/, '')); continue; }
    if (!linje) continue;
    const f = csvLinje(linje);
    yield Object.fromEntries(hoved.map((h, i) => [h, f[i]]));
  }
}

// Pyramidetal i tusinder med fire betydende cifre; små lande bevarer dermed detaljen.
const cifre = v => +(+v).toPrecision(4);
const tal = (v, d = 1) => v === '' || v == null || !Number.isFinite(+v) ? null : +(+v).toFixed(d);

// ---------- Demografi ----------
const PYRAMIDEAAR = [1950, 1980, 2000, 2023, 2050, 2100];
const NOEGLEAAR = 2023; // seneste estimat i WPP 2024; senere år er fremskrivning
const SERIEAAR = [...Array.from({ length: 15 }, (_, i) => 1950 + 5 * i), 2023, ...Array.from({ length: 16 }, (_, i) => 2025 + 5 * i)];
const lande = {};

for await (const r of csvRaekker(fil('dem.csv.gz'))) {
  if (r.LocTypeName !== 'Country/Area' || r.Variant !== 'Medium') continue;
  const id = r.LocID.padStart(3, '0');
  const land = lande[id] ??= { iso3: r.ISO3_code, iso2: r.ISO2_code, fnNavn: r.Location, pyramide: {}, serie: { aar: SERIEAAR, cbr: [], cdr: [], bef: [] } };
  const aar = +r.Time;
  const i = SERIEAAR.indexOf(aar);
  if (i >= 0) {
    land.serie.cbr[i] = tal(r.CBR); land.serie.cdr[i] = tal(r.CDR);
    land.serie.bef[i] = tal(r.TPopulation1July, 1);
  }
  if (aar === NOEGLEAAR) {
    land.noegletal = {
      befolkning: tal(r.TPopulation1July, 1), // tusinder
      taethed: tal(r.PopDensity, 1), vaekst: tal(r.PopGrowthRate, 2),
      cbr: tal(r.CBR), cdr: tal(r.CDR), tfr: tal(r.TFR, 2),
      levealder: tal(r.LEx), levealderM: tal(r.LExMale), levealderK: tal(r.LExFemale),
      spaedbarn: tal(r.IMR), boern: tal(r.Q5), medianalder: tal(r.MedianAgePop),
      migration: tal(r.CNMR)
    };
  }
}

for await (const r of csvRaekker(fil('pyr.csv.gz'))) {
  if (r.LocTypeName !== 'Country/Area' || !PYRAMIDEAAR.includes(+r.Time)) continue;
  const land = lande[r.LocID.padStart(3, '0')];
  const p = land.pyramide[r.Time] ??= { maend: [], kvinder: [] };
  const i = +r.AgeGrpStart / 5;
  p.maend[i] = cifre(r.PopMale); p.kvinder[i] = cifre(r.PopFemale);
}

const hdi = {};
for await (const r of csvRaekker(fil('hdr.csv'))) {
  if (!/^[A-Z]{3}$/.test(r.iso3)) continue;
  hdi[r.iso3] = { hdi: tal(r.hdi_2023, 3), rang: r.hdi_rank_2023 ? +r.hdi_rank_2023 : null, bni: tal(r.gnipc_2023, 0), skoleaar: tal(r.mys_2023, 1) };
}
const hdiAntal = Object.values(hdi).filter(h => h.rang).length;

const wbBy = {};
for (const r of JSON.parse(readFileSync(fil('wb_by.json'), 'utf8'))[1]) {
  if (r.date === String(NOEGLEAAR) && r.value != null) wbBy[r.countryiso3code] = tal(r.value, 1);
}
const hovedstad = {};
for (const r of JSON.parse(readFileSync(fil('wb_lande.json'), 'utf8'))[1]) {
  if (r.capitalCity && r.longitude) hovedstad[r.id] = { navn: r.capitalCity, punkt: [+r.longitude, +r.latitude] };
}

const daNavn = new Intl.DisplayNames(['da'], { type: 'region' });
for (const [id, land] of Object.entries(lande)) {
  let navn = land.iso2 ? daNavn.of(land.iso2) : land.fnNavn;
  if (!navn || navn === land.iso2) navn = land.fnNavn;
  land.navn = navn;
  const h = hdi[land.iso3];
  if (h) Object.assign(land.noegletal, { hdi: h.hdi, hdiRang: h.rang, bni: h.bni, skoleaar: h.skoleaar });
  if (wbBy[land.iso3] != null) land.noegletal.byandel = wbBy[land.iso3];
  for (const aar of PYRAMIDEAAR) {
    const p = land.pyramide[aar];
    if (!p || p.maend.length !== 21 || p.kvinder.length !== 21 || [...p.maend, ...p.kvinder].some(v => v == null)) throw new Error(`Pyramide mangler: ${id} ${aar}`);
  }
  if (land.serie.cbr.length !== SERIEAAR.length || land.serie.cbr.some(v => v == null)) throw new Error(`Serie mangler: ${id}`);
}

// Kontrol mod kendte værdier fra kilderne (Danmark 2023).
const dk = lande['208'];
if (dk.navn !== 'Danmark' || Math.abs(dk.noegletal.befolkning - 5948.1) > .2 || dk.noegletal.tfr !== 1.51 || dk.noegletal.hdi !== 0.962) {
  throw new Error('Kontrol af Danmark fejlede: ' + JSON.stringify(dk.noegletal));
}
const pyrSum = [...dk.pyramide[2023].maend, ...dk.pyramide[2023].kvinder].reduce((a, b) => a + b, 0);
if (Math.abs(pyrSum - dk.noegletal.befolkning) > 1) throw new Error('Pyramide og befolkningstal passer ikke');

const demografi = {
  kilde: 'FN, World Population Prospects 2024 (mellemvariant); UNDP Human Development Report 2025; Verdensbanken (WDI)',
  noegleaar: NOEGLEAAR, pyramideaar: PYRAMIDEAAR, hdiAntal,
  aldersgrupper: Array.from({ length: 21 }, (_, i) => i === 20 ? '100+' : `${5 * i}–${5 * i + 4}`),
  lande: Object.fromEntries(Object.entries(lande).sort().map(([id, l]) => [id, {
    navn: l.navn, iso3: l.iso3, noegletal: l.noegletal, pyramide: l.pyramide,
    serie: { cbr: l.serie.cbr, cdr: l.serie.cdr, bef: l.serie.bef }
  }])),
  serieaar: SERIEAAR
};
writeFileSync(`${her}demografi.json`, JSON.stringify(demografi));

// ---------- Klima ----------
const verden = JSON.parse(readFileSync(`${her}countries-50m.json`, 'utf8'));
const omraader = topojson.feature(verden, verden.objects.countries).features.filter(f => f.id);
const grove = new Map(omraader.map(f => [f, d3.geoBounds(f)]));
const stationer = {};
for (const linje of readFileSync(fil('st.txt'), 'utf8').split('\n').slice(1)) {
  const [wmo, navn, lat, lon, hoejde, land] = linje.split(';');
  if (wmo && navn != null) stationer[wmo] = { wmo, navn: navn.trim(), punkt: [+lon, +lat], hoejde: +hoejde, land: land?.trim() };
}
function laesNormal(sti) {
  const ud = {};
  for (const linje of readFileSync(fil(sti), 'utf8').split(/\r?\n/).slice(1)) {
    const [wmo, ...m] = linje.split(';');
    if (!wmo || m.length !== 12) continue;
    const v = m.map(x => x.trim() === '' ? NaN : +x);
    if (v.every(Number.isFinite)) ud[wmo] = v;
  }
  return ud;
}
function findLand(punkt) {
  for (const [f, [[v, s], [o, n]]] of grove) {
    const iLaengde = v <= o ? punkt[0] >= v && punkt[0] <= o : punkt[0] >= v || punkt[0] <= o;
    if (punkt[1] >= s - .01 && punkt[1] <= n + .01 && iLaengde && d3.geoContains(f, punkt)) return f.id;
  }
  // Kyststationer kan ligge lige uden for den generaliserede kyst: nærmeste land inden for ca. 25 km.
  let bedst = null, afstand = 25 / 6371;
  for (const f of omraader) {
    const [[v, s], [o, n]] = grove.get(f);
    if (punkt[1] < s - 1 || punkt[1] > n + 1) continue;
    const g = f.geometry;
    for (const poly of g.type === 'Polygon' ? [g.coordinates] : g.coordinates) for (const ring of poly) for (const p of ring) {
      const a = d3.geoDistance(punkt, p);
      if (a < afstand) { afstand = a; bedst = f.id; }
    }
  }
  return bedst;
}
const perioder = [
  { navn: '1991–2020', t: laesNormal('temp9120.txt'), n: laesNormal('nedb9120.txt') },
  { navn: '1961–1990', t: laesNormal('temp6190.txt'), n: laesNormal('nedb6190.txt') }
];
// Stationer tildeles land ved punkt-i-polygon. Ligger en station tæt (<30 km)
// på det land, hvor flertallet af DWD's stationer med samme landenavn ligger,
// hører den til dette land, så fx St. Georges (Fransk Guyana) ved grænsefloden
// ikke bliver Brasiliens station. Fjerne områder som Hongkong bevares.
const fund = [];
for (const periode of perioder) {
  for (const wmo of Object.keys(periode.t)) {
    const st = stationer[wmo];
    if (!st || !periode.n[wmo] || !Number.isFinite(st.punkt[0])) continue;
    const t = periode.t[wmo], n = periode.n[wmo];
    // Groft urimelige værdier i rapporterede normaler udelades.
    if (t.some(x => x < -60 || x > 45) || n.some(x => x < 0 || x > 2000)) continue;
    const id = findLand(st.punkt);
    if (id) fund.push({ ...st, id, periode: periode.navn, t, n });
  }
}
function naer(punkt, id, km) {
  return omraader.some(f => f.id === id && (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates)
    .some(poly => poly.some(ring => ring.some(p => d3.geoDistance(punkt, p) * 6371 < km))));
}
const flertal = {};
for (const s of fund) ((flertal[s.land] ??= {})[s.id] ??= 0, flertal[s.land][s.id]++);
const kandidater = {};
for (const s of fund) {
  const optalt = flertal[s.land];
  const bedst = Object.keys(optalt).reduce((a, b) => optalt[a] >= optalt[b] ? a : b);
  if (s.land && optalt[s.id] < optalt[bedst] && naer(s.punkt, bedst, 30)) continue;
  ((kandidater[s.id] ??= {})[s.periode] ??= []).push(s);
}

function klimaafstand(a, b) {
  const middel = x => x.reduce((s, v) => s + v, 0) / 12;
  const sum = x => x.reduce((s, v) => s + v, 0);
  const amp = x => Math.max(...x) - Math.min(...x);
  return Math.abs(middel(a.t) - middel(b.t)) / 4 + Math.abs(Math.log((sum(a.n) + 50) / (sum(b.n) + 50))) / .4 +
    Math.abs(amp(a.t) - amp(b.t)) / 8 + d3.geoDistance(a.punkt, b.punkt) * 6371 / 1500;
}
// Flere objekter kan dele landekode (fx Ashmore- og Cartierøerne og Australien).
const efterId = new Map();
for (const f of omraader) efterId.set(f.id, [...(efterId.get(f.id) ?? []), f]);
const klima = {};
for (const [id, figurer] of efterId) {
  const valg = kandidater[id];
  if (!valg) continue;
  const liste = valg['1991–2020'] ?? valg['1961–1990'];
  const dele = figurer.flatMap(f => f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates)
    .map(coordinates => ({ type: 'Polygon', coordinates }));
  const areal = dele.reduce((s, d) => s + d3.geoArea(d), 0) * 6371 ** 2;
  // Ekstra stationer skal ligge på en landdel over 5000 km², ikke på fjerne småøer.
  const store = dele.filter(d => d3.geoArea(d) * 6371 ** 2 >= 5000);
  // Bjergstationer over 1000 m (fx Paganella, 2125 m) er ikke typiske for mindre lande.
  const ekstra = liste.filter(s => store.some(d => d3.geoContains(d, s.punkt)) && (areal >= 1.2e6 || !(s.hoejde > 1000)));
  const antal = Math.min(1 + ekstra.length, areal < 150e3 ? 1 : areal < 1.2e6 ? 2 : areal < 5e6 ? 3 : 4);
  const iso3 = lande[id]?.iso3;
  const start = hovedstad[iso3]?.punkt ?? d3.geoCentroid(figurer[0]);
  const valgt = [liste.reduce((a, b) => d3.geoDistance(a.punkt, start) <= d3.geoDistance(b.punkt, start) ? a : b)];
  // Supplér med de stationer, der adskiller sig mest i klima og afstand.
  while (valgt.length < antal) {
    const rest = ekstra.filter(s => !valgt.includes(s));
    if (!rest.length) break;
    valgt.push(rest.reduce((bedst, s) => {
      const v = Math.min(...valgt.map(x => klimaafstand(x, s)));
      return v > bedst.v ? { s, v } : bedst;
    }, { v: -1 }).s);
  }
  klima[id] = valgt.map(s => ({
    navn: s.navn, wmo: s.wmo, omraade: s.land, punkt: s.punkt.map(v => +v.toFixed(2)), hoejde: s.hoejde,
    periode: s.periode, t: s.t, n: s.n
  }));
}
const kbh = klima['208']?.find(s => s.wmo === '06186');
if (!kbh || kbh.t[6] !== 18.3) throw new Error('Kontrol af København fejlede');
writeFileSync(`${her}klima.json`, JSON.stringify({
  kilde: 'Deutscher Wetterdienst (DWD), Climate Data Center: CLIMAT multi_annual, klimanormaler fra WMO-medlemslandenes vejrtjenester, CC BY 4.0',
  lande: klima
}));

// Lille navneindeks, som globussen kan hente straks (hover og landemenu).
const ekstraNavne = {
  '010': 'Antarktis', '086': 'Det Britiske Territorium i Det Indiske Ocean', '239': 'South Georgia og South Sandwich Islands',
  '248': 'Åland', '260': 'De Franske Sydlige og Antarktiske Territorier', '334': 'Heard- og McDonaldøerne',
  '574': 'Norfolkøen', '612': 'Pitcairn'
};
writeFileSync(`${her}landeindeks.json`, JSON.stringify(Object.fromEntries(
  [...Object.entries(lande).map(([id, l]) => [id, l.navn]), ...Object.entries(ekstraNavne)].sort())));

console.log(`Demografi: ${Object.keys(demografi.lande).length} lande · Klima: ${Object.keys(klima).length} lande, ` +
  `${Object.values(klima).flat().length} stationer (${Object.values(klima).flat().filter(s => s.periode === '1961–1990').length} med 1961–1990)`);
