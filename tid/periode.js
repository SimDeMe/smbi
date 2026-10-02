// periode.js — perioder: dag, uge, måned og skoleår
//
// Rapporter og kalender bladrer i de samme perioder. En periode er en type
// (dag, uge, maaned, skolear) plus en forskydning, hvor 0 er den periode man
// står i, -1 den forrige og +1 den næste. Al regning på perioder og alle
// danske mærkater bor her, så de to visninger altid siger det samme.

import { getSettings } from './indstillinger.js';
import { getCurrentSchoolYear } from './app.js';
import { capitalize } from './format.js';

export const DAG_MS = 86400000;

export const MAANEDER = ['januar','februar','marts','april','maj','juni',
                         'juli','august','september','oktober','november','december'];
export const MAANEDER_KORT = ['jan','feb','mar','apr','maj','jun',
                              'jul','aug','sep','okt','nov','dec'];
// getDay()-rækkefølge: søndag først
export const DAGE      = ['søndag','mandag','tirsdag','onsdag','torsdag','fredag','lørdag'];
export const DAGE_KORT = ['søn','man','tir','ons','tor','fre','lør'];
// Ugen begynder mandag i den danske kalender
export const UGEDAGE_KORT = ['man','tir','ons','tor','fre','lør','søn'];

// ─── Dato-hjælpere ────────────────────────────────────────
export const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays    = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const erSammeDag = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();
export const erIDag     = d => erSammeDag(d, new Date());

// Mandagen i datoens uge
export function mandag(d) {
  const x   = startOfDay(d);
  const dow = x.getDay() === 0 ? 7 : x.getDay();
  return addDays(x, -(dow - 1));
}

// ISO-ugenummer — torsdagen i ugen bestemmer, hvilket år ugen hører til
export function ugeNr(d) {
  const tors = addDays(mandag(d), 3);
  const foerste = new Date(tors.getFullYear(), 0, 4);
  return 1 + Math.round((tors - mandag(foerste)) / (7 * DAG_MS));
}

// Antal dage i datoens måned
export const dageIMaaned = d => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

// ─── Skoleår ──────────────────────────────────────────────
// Skoleåret begynder den dag, indstillingerne siger — fx 1. juni.
export function skoleaarStart(startAar) {
  const s = getSettings();
  return new Date(startAar, (s.schoolYearStartMonth ?? 6) - 1, s.schoolYearStartDay ?? 1);
}
export const skoleaarMaerkat = startAar => `${startAar}/${String(startAar + 1).slice(2)}`;

// Startåret for det skoleår, appen står i lige nu
export const aktueltSkoleaar = () => parseInt(getCurrentSchoolYear(), 10);

// Startåret for det skoleår, en dato ligger i
export function skoleaarFor(dato) {
  const a = dato.getFullYear();
  return dato >= skoleaarStart(a) ? a : a - 1;
}

// ─── Periodens grænser ────────────────────────────────────
export function periodeStart(type, forskyd = 0) {
  const n = new Date();
  if (type === 'dag')     return addDays(startOfDay(n), forskyd);
  if (type === 'uge')     return addDays(mandag(n), forskyd * 7);
  if (type === 'maaned')  return new Date(n.getFullYear(), n.getMonth() + forskyd, 1);
  return skoleaarStart(aktueltSkoleaar() + forskyd);
}

export function periodeSlut(type, forskyd = 0) {
  const n = new Date();
  if (type === 'dag')     return addDays(startOfDay(n), forskyd + 1);
  if (type === 'uge')     return addDays(mandag(n), forskyd * 7 + 7);
  if (type === 'maaned')  return new Date(n.getFullYear(), n.getMonth() + forskyd + 1, 1);
  return skoleaarStart(aktueltSkoleaar() + forskyd + 1);
}

// Forskydningen, der rammer den periode en dato ligger i — bruges når man
// vælger en dato i datofeltet uden at skifte visning
export function forskydningFor(type, dato) {
  const n = new Date();
  if (type === 'dag')    return Math.round((startOfDay(dato) - startOfDay(n)) / DAG_MS);
  if (type === 'uge')    return Math.round((mandag(dato) - mandag(n)) / (7 * DAG_MS));
  if (type === 'maaned') return (dato.getFullYear() - n.getFullYear()) * 12
                              + (dato.getMonth()  - n.getMonth());
  return skoleaarFor(dato) - aktueltSkoleaar();
}

// Det skoleår, perioden hører til. Står vi i indeværende skoleår, bruges
// indstillingernes mærkat, så et manuelt valgt skoleår slår igennem.
export function skoleaarForPeriode(type, forskyd = 0) {
  if (type === 'skolear')
    return forskyd === 0 ? getCurrentSchoolYear()
                         : skoleaarMaerkat(aktueltSkoleaar() + forskyd);
  const aar = skoleaarFor(periodeStart(type, forskyd));
  return aar === aktueltSkoleaar() ? getCurrentSchoolYear() : skoleaarMaerkat(aar);
}

// ─── Mærkater ─────────────────────────────────────────────
export const langDato  = d => `${d.getDate()}. ${MAANEDER[d.getMonth()]} ${d.getFullYear()}`;
export const kortDato  = d => `${d.getDate()}. ${MAANEDER_KORT[d.getMonth()]}`;
export const datoInput = d =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const NAERE_DAGE = { '-2':'I forgårs', '-1':'I går', '0':'I dag', '1':'I morgen', '2':'I overmorgen' };

// Kort overskrift: "I går", "Uge 36", "September", "2026/27"
export function periodeTitel(type, forskyd = 0) {
  const s = periodeStart(type, forskyd);
  if (type === 'dag')    return NAERE_DAGE[forskyd] ?? capitalize(DAGE[s.getDay()]);
  if (type === 'uge')    return `Uge ${ugeNr(s)}`;
  if (type === 'maaned') return capitalize(MAANEDER[s.getMonth()]);
  return skoleaarMaerkat(aktueltSkoleaar() + forskyd);
}

// Undertekst: det, overskriften ikke siger — dato, datointerval eller årstal
export function periodeUnder(type, forskyd = 0) {
  const s = periodeStart(type, forskyd);
  const e = addDays(periodeSlut(type, forskyd), -1);
  if (type === 'dag')    return langDato(s);
  if (type === 'uge')    return `${kortDato(s)} – ${kortDato(e)} ${e.getFullYear()}`;
  if (type === 'maaned') return String(s.getFullYear());
  return `${kortDato(s)} ${s.getFullYear()} – ${kortDato(e)} ${e.getFullYear()}`;
}

// Til aria-labels og filnavne: "uge-36-2026", "2026-09-01"
export function periodeNoegle(type, forskyd = 0) {
  const s = periodeStart(type, forskyd);
  if (type === 'dag')    return datoInput(s);
  if (type === 'uge')    return `uge-${ugeNr(s)}-${s.getFullYear()}`;
  if (type === 'maaned') return `${s.getFullYear()}-${String(s.getMonth()+1).padStart(2,'0')}`;
  return skoleaarMaerkat(aktueltSkoleaar() + forskyd).replace('/', '-');
}

// ─── Tal ──────────────────────────────────────────────────
// Kompakt timetal til de tætte oversigter: "6,5t". Under en time skrives
// minutterne, så en kort dag ikke ser ud som ingenting.
export function kortTimer(minutter) {
  if (!minutter) return '';
  if (minutter < 60) return `${Math.round(minutter)}m`;
  const t = minutter / 60;
  // Halve timer er værd at se på en kort dag; hele timer skrives uden decimal
  return `${t.toFixed(t < 10 ? 1 : 0).replace(/[.,]0$/, '').replace('.', ',')}t`;
}
