// normer.js — et holds budget delt op i undervisning, forberedelse og retning
//
// Læreren taster tal fra to kilder og skal ikke selv regne:
//
//   budget                 — holdets timer i fagfordelingen
//   årsnorm i moduler      — fra Lectio: de moduler à 95 min, holdet faktisk
//                            undervises i (skolens reduktion er trukket fra)
//   elever, elevtimer pr. elev — fra Lectio (elevernes fordybelsestid)
//
// Appen deler budgettet op med skoleårets forberedelsesfaktor:
//
//   undervisning = moduler × 95 / 60
//   forberedelse = undervisning × (faktor − 1)
//   retning      = resten af budgettet
//
// og regner retningen om til minutter pr. elevtime,
//
//   retning × 60 / (elever × elevtimer pr. elev),
//
// som kan holdes op mod skolens formel, faktor / 27 × 60 (≈ 5,2 min ved 2,35).
// Er budgettet mindre end undervisning og forberedelse, er der ingen retning,
// og manglen står i formularen.
//
// Ældre hold har normgrundlaget fra holdoversigten — årsnorm i timer,
// puljetimer, tillæg og antal hold — og regnes stadig med skolens fulde formel:
//
//   budget = (årsnorm × reduktion + elever × fordybelsestid / 27 + puljetimer)
//            × faktor + tillæg
//
// Retter man et sådant hold, gemmes det i den nye form.
// Faktoren (og den gamle reduktion) skifter fra skoleår til skoleår og ligger
// i indstillingerne pr. skoleår (2025/26: 2,35 og 0,9 — i 2021/22: 2,55 og 0,93).

import { getSettings } from './indstillinger.js';
import { MODULER, skemaLaengde } from './skema.js';

const MODUL_TIMER = skemaLaengde(MODULER[0]) / 60;     // 95 min
export const modulerTilTimer = m => m * MODUL_TIMER;
export const timerTilModuler = t => t / MODUL_TIMER;

export const STANDARD_FAKTORER = { faktor: 2.35, reduktion: 0.9 };

// Skoleårets faktorer — de gemte, ellers standardværdierne
export function faktorerFor(skoleaar) {
  const gemt = getSettings().normFaktorer?.[skoleaar] || {};
  return {
    faktor:    gemt.faktor    ?? STANDARD_FAKTORER.faktor,
    reduktion: gemt.reduktion ?? STANDARD_FAKTORER.reduktion
  };
}

// Den nye form har årsnormen i moduler; den gamle i timer
export const erModulform = g => Number.isFinite(g?.moduler);
const erTimeform = g => !erModulform(g) && Number.isFinite(g?.aarsnorm);

// Har holdet et normgrundlag? Årsnormen er det eneste, der skal være udfyldt;
// resten tæller som 0, hvis det mangler (et NV-hold har ingen elevtimer).
export const harNormgrundlag = a =>
  a?.type === 'hold' && (erModulform(a.normGrundlag) || erTimeform(a.normGrundlag));

// Holdets dele i timer — eller null. Den nye form kræver budgettet.
//   undervisning, forberedelse, retning, tillaeg, total
//   elevtimer        elever × elevtimer pr. elev (× antal hold)
//   minPrElevtime    retningen i minutter pr. elevtime
//   mangler          timer, budgettet er for lille til undervisning og forberedelse
export function beregnNormer(g, { faktor, reduktion }, budget = null) {
  const tal = v => Number.isFinite(v) ? v : 0;

  if (erModulform(g)) {
    if (!Number.isFinite(budget)) return null;
    const undervisning = modulerTilTimer(g.moduler);
    const forberedelse = undervisning * (faktor - 1);
    const rest         = budget - undervisning - forberedelse;
    const retning      = Math.max(0, rest);
    const elevtimer    = tal(g.elever) * tal(g.fordybelsestid);
    return {
      undervisning, forberedelse, retning, tillaeg: 0,
      total: undervisning + forberedelse + retning,
      elevtimer,
      minPrElevtime: elevtimer > 0 ? retning * 60 / elevtimer : null,
      mangler: Math.max(0, -rest)
    };
  }

  if (!erTimeform(g)) return null;
  const antal = Number.isFinite(g.antalHold) && g.antalHold > 0 ? g.antalHold : 1;
  const undervisning = (g.aarsnorm * reduktion + tal(g.puljetimer)) * antal;
  const forberedelse = undervisning * (faktor - 1);
  const retning      = tal(g.elever) * tal(g.fordybelsestid) / 27 * faktor * antal;
  const tillaeg      = tal(g.tillaeg) * antal;
  return {
    undervisning, forberedelse, retning, tillaeg,
    total: undervisning + forberedelse + retning + tillaeg,
    elevtimer: tal(g.elever) * tal(g.fordybelsestid) * antal,
    minPrElevtime: faktor / 27 * 60,
    mangler: 0
  };
}

export const normerFor = a =>
  harNormgrundlag(a)
    ? beregnNormer(a.normGrundlag, faktorerFor(a.schoolYear), a.budgetHours ?? null)
    : null;

// Aktivitetens budget i timer: det indtastede fra fagfordelingen — eller,
// på et ældre hold med normgrundlag i timer, det beregnede
export function budgetTimer(a) {
  if (erTimeform(a?.normGrundlag) && a?.type === 'hold') return normerFor(a).total;
  return a?.budgetHours ?? null;
}

// 176.64 → "176,6" — normerne er brøker, og én decimal er nok
export const fmtTimer = t =>
  (Math.round(t * 10) / 10).toLocaleString('da-DK', { maximumFractionDigits: 1 });

// "13,333" og "13.333" → 13.333; tomt felt → null
export function tolkTal(s) {
  const r = String(s ?? '').trim().replace(/\s/g, '').replace(',', '.');
  if (r === '') return null;
  const v = parseFloat(r);
  return Number.isFinite(v) ? v : null;
}
