/* graenser.js — registret over pladegrænser.
   En ny grænsetype er én ny fil plus én linje her. Kontrakten:

     id, navn, gruppe, kort, eksempler   navn på knappen og i fakta
     beskrivelse, kortTekst              aria-label på tværsnit og kort
     tid:  { maks, skridt, start, tempo, enhed }   tempo = enheder pr. sekund
     fart: { min, maks, skridt, start, navn }      cm/år
     ekstra: [{ id, navn, min, maks, skridt, start, enhed }]   valgfri skydere
     maal: { start }                     målepunktet i km fra grænsen (valgfrit)
     skaelvRate, skaelv(ctx)             et nyt jordskælv { X, d, Y }
     opdater(dt, ctx)                    flytter partiklerne ét billede frem
     tegnSnit(c, ctx), tegnKort(c, ctx)  de to figurer
     aflaes(ctx)                         tallene til instrumenterne
     fakta(ctx)                          [tekst, link?, linktekst?] til fakta-foden
     haendelse(ctx)                      valgfri: et stort jordskælv lige nu
     ryd()                               ved skift og nulstil

   ctx = { t, v, e: { ekstra skydere }, X (målepunktet, km), skaelv: [...] } */

import ryg from './ryg.js';
import oceanKontinent from './ocean-kontinent.js';
import oceanOcean from './ocean-ocean.js';
import kollision from './kollision.js';
import transform from './transform.js';

export const GRAENSER = [
  ryg,
  oceanKontinent,
  oceanOcean,
  kollision,
  transform
];
