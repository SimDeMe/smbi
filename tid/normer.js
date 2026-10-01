// normer.js — et holds vejledende arbejdstid, delt op i de tre arbejdstyper
//
// Skolens holdoversigt regner et holds budget ud med én formel:
//
//   budget = (årsnorm × reduktion + elever × fordybelsestid / 27 + puljetimer)
//            × forberedelsesfaktor + tillæg
//
// Skolen deler ikke budgettet op, men formlen kan læses som tre normer:
//
//   undervisning = årsnorm × reduktion + puljetimer
//   forberedelse = undervisning × (faktor − 1)
//   retning      = elever × fordybelsestid / 27 × faktor
//
// og et tillæg (fx +15 t til intern NF-eksamen), der står for sig.
// Står flere ens hold som én aktivitet (fx tre NV-hold), ganges det hele med
// antalHold — de har samme årsnorm, og på NV er fordybelsestiden 0, så
// elevtallet ikke spiller ind.
// Reduktionen er en reel nedskæring: holdet undervises kun i 90 % af
// årsnormen (grunden er ikke oplyst), og forberedelsen regnes af de timer,
// der faktisk undervises.
// Faktoren og reduktionen skifter fra skoleår til skoleår og ligger derfor i
// indstillingerne pr. skoleår (2025/26: 2,35 og 0,9 — i 2021/22: 2,55 og 0,93).

import { getSettings } from './indstillinger.js';
import { MODULER, skemaLaengde } from './skema.js';

// Årsnormen tastes i moduler à 95 min, som læreren kender den. Formlen
// regner i klokketimer, så modulerne omregnes: 1 modul = 95/60 t.
// Ældre hold har årsnormen gemt i timer (aarsnorm) og bruger den uændret.
const MODUL_TIMER = skemaLaengde(MODULER[0]) / 60;

export function aarsnormTimer(g) {
  if (Number.isFinite(g?.moduler))  return g.moduler * MODUL_TIMER;
  if (Number.isFinite(g?.aarsnorm)) return g.aarsnorm;
  return null;
}

// Timer → moduler, til at vise en ældre årsnorm i formularen
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

// Har holdet et normgrundlag? Årsnormen (moduler eller ældre timer) er det eneste, der skal være udfyldt;
// resten tæller som 0, hvis det mangler (et NV-hold har ingen fordybelsestid).
export const harNormgrundlag = a =>
  a?.type === 'hold' && aarsnormTimer(a.normGrundlag) != null;

// De tre normer og tillægget i timer — eller null, hvis holdet ikke har
// et normgrundlag og bare har et budget skrevet ind i hånden
export function beregnNormer(g, { faktor, reduktion }) {
  const aarsnorm = aarsnormTimer(g);
  if (aarsnorm == null) return null;
  const tal = v => Number.isFinite(v) ? v : 0;
  const antal = Number.isFinite(g.antalHold) && g.antalHold > 0 ? g.antalHold : 1;
  const undervisning = (aarsnorm * reduktion + tal(g.puljetimer)) * antal;
  const forberedelse = undervisning * (faktor - 1);
  const retning      = tal(g.elever) * tal(g.fordybelsestid) / 27 * faktor * antal;
  const tillaeg      = tal(g.tillaeg) * antal;
  return {
    undervisning, forberedelse, retning, tillaeg,
    total: undervisning + forberedelse + retning + tillaeg
  };
}

export const normerFor = a =>
  harNormgrundlag(a) ? beregnNormer(a.normGrundlag, faktorerFor(a.schoolYear)) : null;

// Aktivitetens budget i timer: beregnet ud fra normgrundlaget, hvis der er
// et, ellers det indtastede budget (eller null)
export function budgetTimer(a) {
  const n = normerFor(a);
  return n ? n.total : (a?.budgetHours ?? null);
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
