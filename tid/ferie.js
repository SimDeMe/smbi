// ferie.js — arbejdsdage i normperioden
//
// Foran/bagud regnes på arbejdsdage, ikke på kalenderdage: weekender,
// helligdage og den ferie, læreren har lagt ind under Indstillinger, er ikke
// dage, normen skal arbejdes på. Ellers står man «bagud» efter sommerferien
// for tre uger, man aldrig skulle have arbejdet.
//
// Ferien gemmes pr. skoleår i indstillingerne:
//   ferie: { "2026/27": [{ fra:"2026-07-06", til:"2026-07-27" }, …] }
// Begge datoer er med. Ferie-fridagene (6. ferieuge) lægges ind på samme
// måde, når de er aftalt.

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
export const ferieFor = aarMaerkat => getSettings().ferie?.[aarMaerkat] || [];

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
