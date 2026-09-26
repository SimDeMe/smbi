/* model.js — hvornår er en bølge konstruktiv, og hvornår er den destruktiv?

   Hele siden hviler på ét spørgsmål: Når en bølge har skyllet op ad
   stranden og er begyndt at løbe tilbage — når tilbageskyllet så at blive
   færdigt, før den næste bølge kommer?

     • Ja, med tid til overs: stranden når at blive drænet mellem bølgerne,
       så en del af vandet siver ned i sandet. Tilbageskyllet får mindre vand
       og bliver svagere end opskyllet → sandet bliver liggende oppe på
       stranden. Konstruktiv bølge.

     • Nej: den næste bølge løber ind i det forrige tilbageskyl og bremses,
       og sandet er så vådt, at intet siver ned. Tilbageskyllet bliver
       stærkere end opskyllet → sandet føres ud mod revlen. Destruktiv bølge.

   Tiden for ét opskyl + tilbageskyl vokser med bølgehøjden (en høj bølge
   skyller længere op og er længere om at løbe tilbage), mens tiden mellem
   to bølger er bølgeperioden. Forholdet mellem de to afhænger derfor kun af
   bølgens stejlhed H/L — og grænsen ligger ved en stejlhed på ca. 1:40, i
   god overensstemmelse med de klassiske bølgerendeforsøg (Johnson 1949).
   Hvor MEGET sand der flyttes, afhænger af bølgens størrelse; hvilken VEJ,
   afhænger af dens stejlhed.

   Det er en undervisningsmodel: de to mekanismer er dem, grundbogen bruger,
   og konstanterne er valgt, så tallene får en rimelig størrelse. */

export const G = 9.81;

export const GRAENSE   = 1 / 40;   // stejlheden, hvor tilbageskyllet lige netop når at slutte
export const MAKS_STEJL = 1 / 7;   // stejlere kan en bølge ikke blive — så bryder den på dybt vand

// Varighed af ét opskyl + tilbageskyl: t = C·√(H/g). C er valgt, så
// tiden netop er lig med perioden, når stejlheden er 1:40.
const C_SKYL = Math.sqrt(2 * Math.PI / GRAENSE);   // ≈ 15,9

export const OP_ANDEL = 0.36;      // opskyllet tager ca. en tredjedel af tiden, tilbageskyllet resten
const NEDSIV_MAKS = 0.5;           // højst halvdelen af opskyllets vand kan nå at sive ned
const BREMS_MAKS  = 0.8;
const K_SAND = 1.85;               // m³ pr. m kyst pr. døgn — sætter sandmængdens størrelse
export const OPSKYL_H = 0.8;       // lodret opskylshøjde som andel af bølgehøjden

// Dybvandsbølgelængden følger af perioden: L = g·T² / 2π
export const boelgelaengde = T => G * T * T / (2 * Math.PI);

// Den højeste bølge, der kan findes ved en given periode
export const maksHoejde = T => MAKS_STEJL * boelgelaengde(T);

export function beregn(H, T){
  const L = boelgelaengde(T);
  const stejlhed = H / L;
  const frekvens = 60 / T;                         // bølger pr. minut

  // ── Tidsregnskabet ──────────────────────────────────
  const tSkyl = C_SKYL * Math.sqrt(H / G);         // ét opskyl + tilbageskyl, s
  const forhold = tSkyl / T;                       // = √(stejlhed · 40)
  const luft = T - tSkyl;                          // s til overs (+) eller for lidt (−)

  // ── De to mekanismer ────────────────────────────────
  // Nedsivning: jo mere tid stranden får til at dræne mellem bølgerne,
  // jo mere af opskyllets vand når at synke ned i sandet.
  const nedsivning = NEDSIV_MAKS * Math.max(0, 1 - forhold);
  // Bremsning: den del af opskyllet, der møder det forrige tilbageskyl.
  const bremsning = Math.min(BREMS_MAKS, Math.max(0, (forhold - 1) / forhold));

  // ── Strømhastigheder og sand ────────────────────────
  // Sand flyttes med strømhastigheden i tredje potens.
  const u0   = Math.sqrt(G * H);                   // strømhastighed ved kystlinjen, m/s
  const vOp  = u0 * (1 - bremsning);
  const vTil = u0 * Math.sqrt(1 - nedsivning);     // mindre vand → svagere tilbageskyl
  const op   = Math.pow(1 - bremsning, 3);         // sand op ad stranden (andel af u0³)
  const ned  = Math.pow(1 - nedsivning, 1.5);      // sand ned ad stranden (andel af u0³)
  const balance = op - ned;
  const netto = K_SAND * Math.pow(u0, 3) * balance / T;  // m³ pr. m kyst pr. døgn

  // Så højt op ad stranden når opskyllet (lodret, m). Bremses det, når
  // det kortere — rækkevidden går med hastigheden i anden potens.
  const opskylsHoejde = OPSKYL_H * H * Math.pow(1 - bremsning, 2);

  return { H, T, L, stejlhed, frekvens, tSkyl, forhold, luft,
           nedsivning, bremsning, u0, vOp, vTil, op, ned, balance, netto,
           opskylsHoejde };
}

export function type(m){
  if (m.balance >  0.04) return { navn: 'Konstruktiv', ord: 'aflejring', farve: '#0FA593', lys: '#D6EFC4' };
  if (m.balance < -0.04) return { navn: 'Destruktiv',  ord: 'erosion',   farve: '#FF6A3D', lys: '#FFD9C9' };
  return { navn: 'På grænsen', ord: 'hverken eller', farve: '#566B68', lys: '#EEF1F0' };
}
