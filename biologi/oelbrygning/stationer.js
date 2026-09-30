/* ═══════════════════════════════════════════════════════════
   stationer.js — registret over brygningens stationer.

   Hver station er én fil med den samme kontrakt:

     id, nr, navn        — navn i fanen og i adressen
     tid                 — {maks, fart, skridt, proeve, auto, tekst(t)} eller null
                           (auto: hvor længe stationen køres, når en adresse
                           peger på en senere station)
     knapper             — skydere og valglister under figuren:
                           {id, navn, type:'valg'?, valg, vaerdi, adr,
                            laas (efter start), genstart (før start),
                            deaktiv(v, alle), spaend, track}
     handlinger          — knapper under figuren
     kolonner            — hvor mange spalter knapperne står i (valgfrit)
     ligninger, maalere  — rækkerne i panelet
     signatur            — nøgletal/signatur nederst (tekst eller funktion af v)
     start(batch, v)     — laver stationens tilstand ud fra batchen
     skridt(st, dt, v)   — flytter modellen dt frem (stationens tidsenhed)
     nu(st), faerdig(st) — stationens ur, og om den er nået til vejs ende
     stop(st)            — (valgfri) uret stopper af sig selv
     maal(st)            — lægger et punkt i grafen
     animer(st, dt, rt)  — luppens molekyler, også når uret står
     tegn(g, st, rt)     — figuren
     graf(st)            — grafens opsætning
     aflaes(st)          — tallene til instrumenterne
     lignTekst(st)       — (valgfri) ligningerne med tal i
     aktiv(st)           — hvilke ligninger, der kører lige nu
     vedValg(id, v)      — (valgfri) retter andre værdier, når en knap skifter
     afslut(st, batch)   — skriver resultatet i batchen til næste station

   En ny station er én ny fil plus én linje her.
   ═══════════════════════════════════════════════════════════ */
import indmaesk from './station-indmaesk.js';
import maesk    from './station-maesk.js';
import skyl     from './station-skyl.js';
import kog      from './station-kog.js';
import gaer     from './station-gaer.js';
import smag     from './station-smag.js';

export const STATIONER = [indmaesk, maesk, skyl, kog, gaer, smag];
