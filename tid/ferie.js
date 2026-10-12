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
import { helligdage, SKOLENS_FERIE } from './skolekalender.js';

export { helligdage, SKOLENS_FERIE };

const DAG_MS = 86400000;

const erHverdag = d => d.getDay() !== 0 && d.getDay() !== 6;
const erHelligdag = d => helligdage(d.getFullYear()).has(datoInput(d));

// ─── Ferie ────────────────────────────────────────────────
// Skolens plan (SKOLENS_FERIE) står i skolekalender.js sammen med helligdagene.

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
