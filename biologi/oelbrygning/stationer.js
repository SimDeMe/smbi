/* ═══════════════════════════════════════════════════════════
   stationer.js — registret over brygningens stationer.

   Hver station er én fil med den samme kontrakt:

     id, nr, navn        — navn i fanen og i adressen
     tid                 — {maks, fart, skridt, proeve, tekst(t)} eller null
     knapper, handlinger — skydere og knapper under figuren
     ligninger, maalere  — rækkerne i panelet
     start(batch, v)     — laver stationens tilstand ud fra batchen
     skridt(st, dt, v)   — flytter modellen dt frem (stationens tidsenhed)
     nu(st), faerdig(st) — stationens ur, og om den er nået til vejs ende
     maal(st)            — lægger et punkt i grafen
     animer(st, dt, rt)  — luppens molekyler, også når uret står
     tegn(g, st, rt)     — figuren
     graf(st)            — grafens opsætning
     aflaes(st)          — tallene til instrumenterne
     aktiv(st)           — hvilke ligninger, der kører lige nu
     afslut(st, batch)   — skriver resultatet i batchen til næste station

   En ny station er én ny fil plus én linje her.
   ═══════════════════════════════════════════════════════════ */
import maesk from './station-maesk.js';
import kog   from './station-kog.js';
import gaer  from './station-gaer.js';
import smag  from './station-smag.js';

export const STATIONER = [maesk, kog, gaer, smag];
