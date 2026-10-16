// Temakort (koropletkort): landene farves efter et nøgletal fra landemenuens
// demografidata (FN WPP 2024, UNDP HDR 2025, Verdensbanken; se data/lande.LICENSE).
// Samme datafil som Demografi-fanen, så tallene altid er de samme som dér.
//
// Klassegrænserne er faste og runde, ikke kvantiler: eleven kan genkende
// tallene, og kortene ser ens ud fra gang til gang. Hvor et tal har en faglig
// grænse (fertilitet 2,1, UNDP's HDI-grupper, 0 ved tilvækst og migration),
// bruges den. Tal med fortegn får en divergerende skala (lilla under 0,
// orange over), resten en sekventiel skala fra lys til mørk.
//
// Befolkningstal (antal) vises med vilje ikke: et koropletkort over antal
// får store lande til at se »vigtige« ud. Kort over tal pr. areal, pr.
// indbygger eller i procent kan sammenlignes på tværs af landenes størrelse.

import { hentDemografi } from './demografi.js';
import { landFraKort } from './landemenu.js';

// ColorBrewer (Cynthia Brewer, Apache 2.0): YlOrRd og PuOr.
const SEKVENS = {
  4: ['#ffffb2', '#fecc5c', '#fd8d3c', '#e31a1c'],
  5: ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026'],
  6: ['#ffffb2', '#fed976', '#feb24c', '#fd8d3c', '#f03b20', '#bd0026'],
  7: ['#ffffb2', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026'],
  8: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#b10026']
};
const LILLA = ['#542788', '#8073ac', '#b2abd2', '#d8daeb'];   // mørkest først
const ORANGE = ['#fee0b6', '#fdb863', '#e08214', '#b35806', '#7f3b08'];   // lysest først
export const INGEN_DATA = '#d6d3cb';

// Klasse i: værdier ≥ graenser[i-1] og < graenser[i].
// nul: antallet af klasser under 0 (divergerende skala).
// neutral: klassen lige efter dem ligger om 0 (fx migration −1 til 1) og bliver gråhvid.
function farver({ graenser, nul, neutral }) {
  const n = graenser.length + 1;
  if (nul == null) return SEKVENS[n];
  const under = nul;
  const over = n - nul - (neutral ? 1 : 0);
  return [...LILLA.slice(LILLA.length - under), ...(neutral ? ['#f2f0ea'] : []), ...ORANGE.slice(0, over)];
}

const andel = (land, aar, fra, til) => {
  const p = land.pyramide?.[aar];
  if (!p) return null;
  const sum = (a, b) => p.maend.slice(a, b).reduce((s, v) => s + v, 0) + p.kvinder.slice(a, b).reduce((s, v) => s + v, 0);
  const alle = sum(0, 21);
  return alle ? 100 * sum(fra, til) / alle : null;
};

// aar: årvalg for tal med tidsserie. Nøgleåret (2023) tages fra nøgletallene,
// de andre år fra serien (5-års trin) eller pyramiden. Efter 2023 er tallene
// FN's fremskrivning (mellemvariant).
const SERIEAAR = [1950, 1980, 2000, 2023, 2050, 2100];
function fraSerie(navn) {
  return (land, aar, d) => {
    if (aar === d.noegleaar) return land.noegletal[navn];
    const i = d.serieaar.indexOf(aar);
    return i < 0 ? null : land.serie?.[navn]?.[i] ?? null;
  };
}

export const EMNER = [
  ['Befolkning', [
    { id: 'taethed', navn: 'Befolkningstæthed', enhed: 'indb. pr. km²', decimaler: 0,
      graenser: [10, 25, 50, 100, 250, 500], forklaring: 'indbyggere pr. km² landareal' },
    { id: 'vaekst', navn: 'Befolkningstilvækst', enhed: '% pr. år', decimaler: 2,
      graenser: [-0.5, 0, 1, 2, 3], nul: 2, forklaring: 'naturlig tilvækst plus nettomigration' },
    { id: 'naturlig', navn: 'Naturlig tilvækst', enhed: '‰', decimaler: 1, aar: SERIEAAR,
      graenser: [-5, 0, 5, 10, 20, 30], nul: 2, forklaring: 'fødselsrate minus dødsrate, pr. 1000 indbyggere',
      vaerdi: (land, aar, d) => {
        const f = fraSerie('cbr')(land, aar, d), m = fraSerie('cdr')(land, aar, d);
        return f == null || m == null ? null : f - m;
      } },
    { id: 'migration', navn: 'Nettomigration', enhed: '‰', decimaler: 1,
      graenser: [-5, -1, 1, 5], nul: 2, neutral: true, forklaring: 'ind- minus udvandrede pr. 1000 indbyggere' },
    { id: 'byandel', navn: 'Byandel', enhed: '%', decimaler: 1,
      graenser: [20, 40, 60, 80], forklaring: 'andel, der bor i byer (landenes egne definitioner)' },
    { id: 'medianalder', navn: 'Medianalder', enhed: 'år', decimaler: 1,
      graenser: [20, 25, 30, 35, 40, 45], forklaring: 'halvdelen af befolkningen er yngre' },
    { id: 'unge', navn: 'Andel 0–14 år', enhed: '%', decimaler: 1, aar: SERIEAAR,
      graenser: [15, 20, 25, 30, 35, 40], forklaring: 'børn i procent af hele befolkningen',
      vaerdi: (land, aar) => andel(land, aar, 0, 3) },
    { id: 'aeldre', navn: 'Andel 65+ år', enhed: '%', decimaler: 1, aar: SERIEAAR,
      graenser: [5, 10, 15, 20, 25], forklaring: 'ældre i procent af hele befolkningen',
      vaerdi: (land, aar) => andel(land, aar, 13, 21) }
  ]],
  ['Fødsel og død', [
    { id: 'cbr', navn: 'Fødselsrate', enhed: '‰', decimaler: 1, aar: SERIEAAR,
      graenser: [10, 15, 20, 25, 30, 40], forklaring: 'levendefødte pr. 1000 indbyggere pr. år', vaerdi: fraSerie('cbr') },
    { id: 'cdr', navn: 'Dødsrate', enhed: '‰', decimaler: 1, aar: SERIEAAR,
      graenser: [6, 8, 10, 15, 20, 30], forklaring: 'døde pr. 1000 indbyggere pr. år', vaerdi: fraSerie('cdr') },
    { id: 'tfr', navn: 'Samlet fertilitet', enhed: 'børn pr. kvinde', decimaler: 2,
      graenser: [1.5, 2.1, 3, 4, 5], forklaring: '2,1 er erstatningsniveauet, hvor befolkningen på sigt holder sig konstant uden migration' },
    { id: 'spaedbarn', navn: 'Spædbørnsdødelighed', enhed: '‰', decimaler: 1,
      graenser: [5, 10, 20, 40, 60], forklaring: 'døde før 1 år pr. 1000 levendefødte' },
    { id: 'boern', navn: 'Børnedødelighed', enhed: '‰', decimaler: 1,
      graenser: [5, 10, 25, 50, 75, 100], forklaring: 'døde før 5 år pr. 1000 levendefødte' },
    { id: 'levealder', navn: 'Middellevetid', enhed: 'år', decimaler: 1,
      graenser: [60, 65, 70, 75, 80], forklaring: 'forventet levetid ved fødslen' }
  ]],
  ['Udvikling', [
    { id: 'hdi', navn: 'HDI', enhed: '', decimaler: 3,
      graenser: [0.55, 0.7, 0.8], klassenavne: ['lav', 'middel', 'høj', 'meget høj'],
      forklaring: 'Human Development Index; grupper som UNDP' },
    { id: 'bni', navn: 'BNI pr. indbygger', enhed: '$ (PPP)', decimaler: 0,
      graenser: [2000, 5000, 10000, 20000, 40000, 60000], forklaring: 'købekraftskorrigeret, 2021-dollar' },
    { id: 'skoleaar', navn: 'Skolegang', enhed: 'år', decimaler: 1,
      graenser: [4, 6, 8, 10, 12], forklaring: 'gennemsnitlig skolegang for voksne over 25 år' }
  ]]
];

export const INDIKATORER = Object.fromEntries(EMNER.flatMap(([, liste]) => liste.map(i => [i.id, i])));
for (const ind of Object.values(INDIKATORER)) {
  ind.farver = farver(ind);
  if (ind.farver.length !== ind.graenser.length + 1) throw new Error(`Forkert antal farver: ${ind.id}`);
}

export const fmt = (v, d = 1) => v.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d });
const graensetekst = (ind, v) => {
  const d = Number.isInteger(v) ? 0 : ind.id === 'hdi' ? 2 : 1;
  return v < 0 ? `−${fmt(-v, d)}` : fmt(v, d);
};

// Signaturens klasser som tekst: »under 10«, »10–25«, »500 og derover«.
export function klasser(ind) {
  const g = ind.graenser;
  return ind.farver.map((farve, i) => {
    let tekst;
    if (i === 0) tekst = `under ${graensetekst(ind, g[0])}`;
    else if (i === g.length) tekst = `${graensetekst(ind, g[i - 1])} og derover`;
    else tekst = `${graensetekst(ind, g[i - 1])} til ${graensetekst(ind, g[i])}`;
    if (ind.klassenavne) tekst = `${ind.klassenavne[i]} (${tekst})`;
    return { farve, tekst };
  });
}
export function klasseFor(ind, v) {
  if (v == null || Number.isNaN(v)) return -1;
  let i = 0;
  while (i < ind.graenser.length && v >= ind.graenser[i]) i++;
  return i;
}

export function vaerditekst(ind, v) {
  if (v == null) return 'ingen data';
  const tal = v < 0 ? `−${fmt(-v, ind.decimaler)}` : fmt(v, ind.decimaler);
  return ind.enhed ? `${tal} ${ind.enhed}` : tal;
}

// Tilstand: data, valgt indikator og år. Globussen spørger via farve() og aflaes().
let data = null;
export const valg = { id: 'tfr', aar: 2023 };
export const indikator = () => INDIKATORER[valg.id];
export const aarFor = ind => ind.aar ? valg.aar : data?.noegleaar ?? 2023;
export const fremskrivning = ind => Boolean(ind.aar && data && valg.aar > data.noegleaar);

export async function hent() {
  data = await hentDemografi();
  if (!data?.lande?.['208']?.noegletal || !Array.isArray(data.serieaar)) throw new Error('Demografidata er ugyldige');
  return data;
}

function vaerdiFor(ind, land) {
  if (!land) return null;
  return ind.vaerdi ? ind.vaerdi(land, aarFor(ind), data) : land.noegletal?.[ind.id] ?? null;
}

// Værdi for et kortobjekt (Nordcypern og Somaliland får FN's tal for hele landet).
export function vaerdiForKort(feature, ind = indikator()) {
  if (!data) return null;
  const { id } = landFraKort(feature);
  return vaerdiFor(ind, data.lande[id]);
}

// Farve for et kortobjekt; null = laget tegner ikke landet (fx Antarktis).
export function farve(feature) {
  if (!data) return null;
  const { id } = landFraKort(feature);
  if (!id || id === '010') return null;
  const ind = indikator();
  const k = klasseFor(ind, vaerdiFor(ind, data.lande[id]));
  return k < 0 ? INGEN_DATA : ind.farver[k];
}

// Alle lande med værdi, størst først (til tabel og optælling).
export function rangering(ind = indikator()) {
  if (!data) return [];
  return Object.entries(data.lande)
    .map(([id, land]) => ({ id, navn: land.navn, v: vaerdiFor(ind, land) }))
    .filter(r => r.v != null)
    .sort((a, b) => b.v - a.v || a.navn.localeCompare(b.navn, 'da'));
}

export function optaelling(ind = indikator()) {
  const antal = ind.farver.map(() => 0);
  for (const { v } of rangering(ind)) antal[klasseFor(ind, v)]++;
  return antal;
}

// Tekst til aflæsningen: »Danmark: 1,50 børn pr. kvinde«.
export function aflaes(feature, navne) {
  if (!feature) return 'hav';
  const { id, navn, note } = landFraKort(feature, navne);
  const ind = indikator();
  const v = vaerdiForKort(feature, ind);
  return `${navn}: ${vaerditekst(ind, v)}${note && v != null ? ` (tal for hele ${data.lande[id].navn})` : ''}`;
}
