// ferie.js — arbejdsdage i normperioden
//
// Foran/bagud regnes på arbejdsdage, ikke på kalenderdage: weekender,
// helligdage og den ferie, læreren har lagt ind under Indstillinger, er ikke
// dage, normen skal arbejdes på. Ellers står man «bagud» efter sommerferien
// for tre uger, man aldrig skulle have arbejdet.
//
// Ferien gemmes pr. skoleår i indstillingerne:
//   ferie: { "2026/27": [{ fra:"2026-07-06", til:"2026-07-27" }, …] }
// Begge datoer er med. Ferie-fridagene (6. ferieuge) er med i normen og
// hører ikke til her — de registreres som tid på en opgave.
//
// Samme liste rummer elevernes ferier, markeret med elev: true. Det er
// arbejdsdage for læreren — de tæller med i normen — men der ligger ingen
// opgaver i dem, så belastningen er 0 (se belastning.js). ferieFor giver
// kun lærerens ferie, elevferieFor kun elevernes.

import { getSettings } from './indstillinger.js';
import { datoInput, addDays } from './periode.js';

const DAG_MS = 86400000;

// ─── Helligdage ───────────────────────────────────────────
// Påskedag efter den gregorianske regel (Meeus/Jones/Butcher)
function paaskedag(aar) {
  const a = aar % 19, b = Math.floor(aar / 100), c = aar % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const md = Math.floor((h + l - 7 * m + 114) / 31), dag = (h + l - 7 * m + 114) % 31 + 1;
  return new Date(aar, md - 1, dag);
}

// De danske helligdage, der kan falde på en hverdag. Store bededag er
// afskaffet fra 2024; grundlovsdag og juleaftensdag er arbejdsdage
// (skolens ferieplan tæller 24/12 som en feriedag).
const helligCache = new Map();
export function helligdage(aar) {
  if (helligCache.has(aar)) return helligCache.get(aar);
  const p = paaskedag(aar);
  const dage = [
    new Date(aar, 0, 1),                       // nytårsdag
    addDays(p, -3), addDays(p, -2),            // skærtorsdag, langfredag
    addDays(p, 1),                             // 2. påskedag
    ...(aar < 2024 ? [addDays(p, 26)] : []),   // store bededag
    addDays(p, 39),                            // Kristi himmelfartsdag
    addDays(p, 50),                            // 2. pinsedag
    new Date(aar, 11, 25), new Date(aar, 11, 26)
  ];
  const s = new Set(dage.map(datoInput));
  helligCache.set(aar, s);
  return s;
}

const erHverdag = d => d.getDay() !== 0 && d.getDay() !== 6;
const erHelligdag = d => helligdage(d.getFullYear()).has(datoInput(d));

// ─── Ferie ────────────────────────────────────────────────
// Skolens ferieplan for lærerne (Middelfart Gymnasium), som den står i
// «Forslag til lærernes ferie». Den bruges, indtil læreren selv har gemt
// ferie for skoleåret — en gemt liste, også en tom, går forud.
// Ret hvert år efter den nye plan.
//
// Elevernes ferier er fra «Ferieplan for elever og lærere 2026-27», de dage,
// hvor læreren arbejder. Dagene 4.–7. august er ikke med: eleverne har
// stadig ferie, men lærerne er på skolen til møder og forberedelse.
export const SKOLENS_FERIE = {
  '2026/27': [
    { fra: '2026-07-06', til: '2026-07-27' },   // sommer, 16 dage (planen skriver 2027, men mener 2026)
    { fra: '2026-12-21', til: '2026-12-24' },   // jul, 4 dage
    { fra: '2027-02-15', til: '2027-02-16' },   // vinter, uge 7, 2 dage
    { fra: '2027-03-22', til: '2027-03-24' },   // påske, 3 dage — i alt 25
    { fra: '2026-06-29', til: '2026-07-03', elev: true },   // sommer, før lærerens ferie
    { fra: '2026-07-28', til: '2026-08-03', elev: true },   // sommer, til første dag på skolen 4/8
    { fra: '2026-10-12', til: '2026-10-16', elev: true },   // efterår, uge 42
    { fra: '2026-12-28', til: '2026-12-31', elev: true },   // jul
    { fra: '2027-02-17', til: '2027-02-19', elev: true },   // vinter, resten af uge 7
    { fra: '2027-05-07', til: '2027-05-07', elev: true }    // fredag efter Kristi himmelfart
  ]
};

// Hele listen, som Indstillinger viser den. En liste, der er gemt, før
// elevferien kom til, får skolens elevferie med, til listen gemmes igen.
export function ferieListe(aarMaerkat, s = getSettings()) {
  const gemt = s.ferie?.[aarMaerkat];
  const skolens = SKOLENS_FERIE[aarMaerkat] ?? [];
  if (!gemt) return skolens;
  if (s.ferieMedElev?.[aarMaerkat]) return gemt;
  return [...gemt.filter(p => !p.elev), ...skolens.filter(p => p.elev)];
}

export const ferieFor = (aarMaerkat, s = getSettings()) =>
  ferieListe(aarMaerkat, s).filter(p => !p.elev);
export const elevferieFor = (aarMaerkat, s = getSettings()) =>
  ferieListe(aarMaerkat, s).filter(p => p.elev);

// Alle feriedatoer som 'ÅÅÅÅ-MM-DD'
function ferieDatoer(perioder) {
  const s = new Set();
  for (const { fra, til } of perioder) {
    if (!fra || !til) continue;
    const slut = tilDato(til);
    for (let d = tilDato(fra); d <= slut; d = addDays(d, 1)) s.add(datoInput(d));
  }
  return s;
}

// 'ÅÅÅÅ-MM-DD' → Date ved midnat, lokal tid
export const tilDato = str => { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); };

// ─── Optælling ────────────────────────────────────────────
// Arbejdsdage i [fra, til) — fra og til er midnat
function taelArbejdsdage(fra, til, ferie) {
  let n = 0;
  for (let d = new Date(fra); d < til; d = addDays(d, 1))
    if (erHverdag(d) && !erHelligdag(d) && !ferie.has(datoInput(d))) n++;
  return n;
}

// Feriedage, der faktisk koster en arbejdsdag — en weekend eller en
// helligdag inde i ferien tæller ikke. Skal give 25 med skolens plan.
export function taelFeriedage(perioder) {
  let n = 0;
  for (const dato of ferieDatoer(perioder)) {
    const d = tilDato(dato);
    if (erHverdag(d) && !erHelligdag(d)) n++;
  }
  return n;
}

export function arbejdsdageIPerioden(start, slut, perioder) {
  return taelArbejdsdage(start, slut, ferieDatoer(perioder));
}

// Hvor stor en del af normperiodens arbejdsdage, der er gået ved `nu`.
// Dagen i dag tæller med den del af døgnet, der er gået, så markøren
// glider i stedet for at hoppe ved midnat.
export function forloebIArbejdsdage(start, slut, perioder, nu = new Date()) {
  if (nu <= start) return 0;
  if (nu >= slut) return 1;
  const ferie = ferieDatoer(perioder);
  const total = taelArbejdsdage(start, slut, ferie);
  if (total === 0) return Math.min(1, (nu - start) / (slut - start));
  const iDag = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate());
  let gaaet = taelArbejdsdage(start, iDag, ferie);
  if (erHverdag(iDag) && !erHelligdag(iDag) && !ferie.has(datoInput(iDag)))
    gaaet += (nu - iDag) / DAG_MS;
  return Math.min(1, gaaet / total);
}
