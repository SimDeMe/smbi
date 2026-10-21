// Landenes energi- og vandressourcer. Kilder, år og metode: data/ressourcer.LICENSE.
import { farver, klasser, klasseFor, vaerditekst, INGEN_DATA } from './temakort.js';
import { landFraKort } from './landemenu.js';
export { klasser, vaerditekst, INGEN_DATA };
export const AFLAESNING = '#samfundaflaesning';
export const KILDER = [
  ['Our World in Data · energi og metode', 'https://github.com/owid/energy-data'],
  ['FAO / Verdensbanken · vandstress', 'https://databank.worldbank.org/metadataglossary/world-development-indicators/series/ER.H2O.FWST.ZS']
];
export const ENERGIKILDER = { renewables: 'Vedvarende energi', coal: 'Kul', oil: 'Olie', gas: 'Gas', nuclear: 'Atomkraft', hydro: 'Vandkraft', solar: 'Sol', wind: 'Vind', biofuel: 'Bioenergi', other_renewables: 'Øvrig vedvarende' };
export const valg = { lag: 'energi', basis: 'el', kilde: 'renewables' };
let data, henter;
export async function hent() {
  henter ??= fetch(new URL('./data/samfund.json', import.meta.url), { signal: AbortSignal.timeout(15000) })
    .then(r => { if (!r.ok) throw Error('Landedata kunne ikke hentes'); return r.json(); })
    .then(d => { if (d.energiaar !== 2023 || d.vandaar !== 2022 || !d.lande?.['208']?.el) throw Error('Ugyldige landedata'); return d; })
    .catch(e => { henter = null; throw e; });
  data = await henter; return data;
}
export function indikator() {
  const vand = valg.lag === 'vand';
  const kildenavn = valg.kilde === 'biofuel' && valg.basis === 'energi' ? 'Biobrændstoffer' : ENERGIKILDER[valg.kilde];
  const ind = vand ? { navn: 'Vandstress', enhed: '%', decimaler: 1, graenser: [25, 50, 75, 100],
    klassenavne: ['intet stress', 'lavt', 'middel', 'højt', 'kritisk'], aar: 2022,
    forklaring: 'Vandindvinding i % af fornybare ferskvandsressourcer efter naturens vandbehov. Over 100 % er muligt. Landsgennemsnit skjuler lokale og sæsonmæssige forskelle.' }
    : { navn: kildenavn, enhed: '%', decimaler: 1, graenser: [10, 25, 50, 75, 90], aar: 2023,
      forklaring: valg.basis === 'el' ? 'Andel af landets elproduktion. El er kun en del af energiforbruget; importeret el indgår ikke.'
        : 'Andel af primærenergi, substitutionsmetoden. Traditionel biomasse er udeladt. Lavere landedækning end for el. Biobrændstoffer er her især ethanol og biodiesel.' };
  return { ...ind, farver: farver(ind) };
}
export const vaerdi = land => valg.lag === 'vand' ? land?.vand ?? null : land?.[valg.basis]?.[valg.kilde] ?? null;
export function farve(feature) {
  const { id } = landFraKort(feature);
  if (!id || id === '010') return null;
  const ind = indikator(), k = klasseFor(ind, vaerdi(data?.lande[id]));
  return k < 0 ? INGEN_DATA : ind.farver[k];
}
export function rangering() {
  return Object.entries(data?.lande || {}).map(([id, l]) => ({ id, navn: l.navn, v: vaerdi(l) }))
    .filter(l => l.v != null).sort((a, b) => b.v - a.v || a.navn.localeCompare(b.navn, 'da'));
}
export function aflaes(feature, navne) {
  if (!feature) return 'hav';
  const { id, navn, note } = landFraKort(feature, navne), land = data?.lande[id];
  const ind = indikator(), v = vaerdi(land);
  const mix = valg.lag === 'energi' && v != null ? ' · ' + ['coal', 'oil', 'gas', 'nuclear', 'renewables']
    .map(k => land?.[valg.basis]?.[k] == null ? null : `${ENERGIKILDER[k]} ${land[valg.basis][k].toLocaleString('da-DK', { maximumFractionDigits: 1 })} %`).filter(Boolean).join(' · ') : '';
  return `${navn}: ${vaerditekst(ind, v)} (${ind.aar})${mix}${note && v != null ? ` (tal for hele ${land.navn})` : ''}`;
}
