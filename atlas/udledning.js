// Klimaforandringer: landenes CO₂-udledning som temakort, opgjort på to måder.
// National (territorial) opgørelse: det, der udledes inden for landets grænser;
// det er den, landene rapporterer til FN's klimakonvention.
// Forbrugsbaseret opgørelse: udledningen fra produktionen af det, landets
// indbyggere forbruger, uanset hvor varerne er lavet. Import lægges til,
// eksport trækkes fra.
// Data: Global Carbon Budget 2025 via Our World in Data (data/udledning.json,
// dannet af data/udledning.py). Kun CO₂ fra fossile brændsler og industri.
//
// Samme farver, klasser og signatur som temakortet (temakort.js). De to
// opgørelser har samme klassegrænser, så kortene kan sammenlignes direkte.

import { farver, klasser, klasseFor, fmt, INGEN_DATA } from './temakort.js';
import { landFraKort } from './landemenu.js';

export { klasser, INGEN_DATA };
export const AFLAESNING = '#udledningaflaesning';

export const OPGOERELSER = {
  national: { navn: 'Nationale CO₂-udledninger', kort: 'national', i_alt: 'n', pr: 'nc',
    forklaring: 'udledt inden for landets grænser' },
  forbrug: { navn: 'Forbrugsbaserede CO₂-udledninger', kort: 'forbrug', i_alt: 'f', pr: 'fc',
    forklaring: 'udledt ved at producere det, landets indbyggere forbruger – også i andre lande' }
};

export const MAAL = {
  pr: { navn: 'Pr. indbygger', enhed: 't CO₂ pr. indbygger', decimaler: 1,
    graenser: [1, 2.5, 5, 7.5, 10, 15] },
  alt: { navn: 'I alt', enhed: 'mio. t CO₂', decimaler: 1,
    graenser: [1, 10, 50, 100, 500, 1000] },
  // Kun på det forbrugsbaserede lag: hvor meget større forbruget er end den nationale udledning.
  handel: { navn: 'Forskel fra national', enhed: '% af national', decimaler: 0, kunForbrug: true,
    graenser: [-25, -10, 10, 25, 50], nul: 2, neutral: true,
    forklaring: 'forbrugsbaseret minus national i procent af national. Over 0: landet importerer mere CO₂ i varer, end det eksporterer' }
};
for (const maal of Object.values(MAAL)) maal.farver = farver(maal);

let data = null, henter = null;
export const valg = { opgoerelse: 'national', maal: 'pr', aar: 2023 };
export const aarliste = () => data?.aar ?? [1990, 2000, 2010, 2023];

export async function hent() {
  henter ??= fetch(new URL('./data/udledning.json', import.meta.url), { signal: AbortSignal.timeout(15000) })
    .then(svar => { if (!svar.ok) throw new Error('Udledningsdata kunne ikke hentes'); return svar.json(); })
    .then(d => { if (!d?.lande?.['208']?.n || !Array.isArray(d.aar)) throw new Error('Udledningsdata er ugyldige'); return d; })
    .catch(fejl => { henter = null; throw fejl; });
  data = await henter;
  return data;
}

// Den aktuelle kombination af opgørelse, mål og år som »indikator« i temakortets form.
export function indikator() {
  const opg = OPGOERELSER[valg.opgoerelse];
  const maal = MAAL[valg.maal]?.kunForbrug && valg.opgoerelse !== 'forbrug' ? MAAL.pr : MAAL[valg.maal];
  const id = maal === MAAL.pr ? 'pr' : maal === MAAL.alt ? 'alt' : 'handel';
  return { ...maal, id, opgoerelse: valg.opgoerelse,
    navn: id === 'handel' ? 'Forbrugsbaseret i forhold til national' : `${opg.navn} ${maal.navn.toLowerCase()}`,
    forklaring: maal.forklaring || opg.forklaring };
}

function vaerdiFor(ind, land, aar = valg.aar) {
  const i = data?.aar.indexOf(aar);
  if (!land || i == null || i < 0) return null;
  if (ind.id === 'handel') {
    const f = land.f[i], n = land.n[i];
    return f == null || !n ? null : 100 * (f - n) / n;
  }
  const opg = OPGOERELSER[ind.opgoerelse];
  return land[ind.id === 'pr' ? opg.pr : opg.i_alt][i];
}

export function vaerditekst(ind, v) {
  if (v == null) return 'ingen data';
  const tal = v < 0 ? `−${fmt(-v, ind.decimaler)}` : `${ind.id === 'handel' && v > 0 ? '+' : ''}${fmt(v, ind.decimaler)}`;
  return `${tal} ${ind.enhed}`;
}

export function vaerdiForKort(feature, ind = indikator()) {
  if (!data || !feature) return null;
  return vaerdiFor(ind, data.lande[landFraKort(feature).id]);
}

export function farve(feature) {
  if (!data) return null;
  const { id } = landFraKort(feature);
  if (!id || id === '010') return null;
  const ind = indikator();
  const k = klasseFor(ind, vaerdiFor(ind, data.lande[id]));
  return k < 0 ? INGEN_DATA : ind.farver[k];
}

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

// Den anden opgørelse i parentes, så eleven kan sammenligne uden at skifte lag.
function sammenligning(ind, land) {
  if (!land) return '';
  if (ind.id === 'handel') {
    const i = data.aar.indexOf(valg.aar);
    return land.f[i] == null ? '' : ` (forbrug ${fmt(land.f[i], 0)}, nationalt ${fmt(land.n[i], 0)} mio. t)`;
  }
  const anden = { ...ind, opgoerelse: ind.opgoerelse === 'national' ? 'forbrug' : 'national' };
  const v = vaerdiFor(anden, land);
  return v == null ? '' : ` (${anden.opgoerelse === 'national' ? 'nationalt' : 'forbrug'} ${fmt(v, ind.decimaler)})`;
}

// »Danmark: 8,3 t CO₂ pr. indbygger (nationalt 4,8)«.
export function aflaes(feature, navne) {
  if (!feature) return 'hav';
  const { id, navn, note } = landFraKort(feature, navne);
  const ind = indikator();
  const land = data?.lande[id];
  const v = vaerdiFor(ind, land);
  return `${navn}: ${vaerditekst(ind, v)}${v == null ? '' : sammenligning(ind, land)}${note && v != null ? ` (tal for hele ${land.navn})` : ''}`;
}
