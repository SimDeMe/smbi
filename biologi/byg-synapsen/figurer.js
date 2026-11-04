import { hent, flet } from '../byg-biologi/figurer.js';
// Ét skematisk snit gennem en stimulerende kemisk synapse.
const blaek = '#334155';
const lilla = '#9063b6';
const blaa = '#438ac2';
const groen = '#448c69';
const orange = '#bd612f';
const streg = (d, farve = blaek, bredde = 3) =>
  `<path d="${d}" fill="none" stroke="${farve}" stroke-width="${bredde}" stroke-linecap="round" stroke-linejoin="round"/>`;
const flade = (d, farve) =>
  `<path d="${d}" fill="${farve}" stroke="${blaek}" stroke-width="2.5"/>`;
const cirkel = (x, y, r, farve) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${farve}" stroke="${blaek}" stroke-width="1.5"/>`;
const prikker = (punkter, farve) =>
  punkter.map(([x, y]) => cirkel(x, y, 4.5, farve)).join('');
const tekst = (x, y, t) =>
  `<text x="${x}" y="${y}" text-anchor="middle" class="fig-navn">${t}</text>`;

const nerveende = 'M397 23 H462 V90 C462 117 543 112 551 176 C561 232 522 260 466 260 H393 C338 260 300 233 308 184 C315 120 397 120 397 90Z';
const modtager = 'M305 344 Q311 325 351 325 H506 Q552 325 558 344 L576 439 H286Z';
const kloeft = 'M318 266 H543 V322 H318Z';
const baggrund = flade(nerveende, '#faf3f9') + flade(modtager, '#eef6fd');

const lag = [
  {
    navn: 'Nerveimpulsen ankommer',
    dele: [
      ['præsynaptisk celle', 'Den præsynaptiske celle sender signalet. Her ser du kun enden af dens akson.', [339, 175], [-1, 147],
        flade(nerveende, '#f0dcf1')],
      ['aktionspotentiale', 'Aktionspotentialet breder sig langs aksonet og depolariserer membranen i nerveenden.', [430, 68], [-1, 68],
        streg('M430 36 V103 M419 92 L430 103 L441 92', lilla, 5)],
      ['spændingsstyret Ca²⁺-kanal', 'Depolariseringen åbner spændingsstyrede calciumkanaler. Ca²⁺ strømmer ind i nerveenden.', [549, 177], [1, 145],
        flade('M528 163 H568 V173 H528Z M529 184 H569 V194 H529Z', '#9dd1ea')
        + streg('M585 178 H513 M522 171 L513 178 L522 185', blaa)
        + tekst(598, 210, 'Ca²⁺')],
    ],
  },
  {
    navn: 'Kemisk signal over kløften',
    dele: [
      ['synaptisk vesikel', 'En synaptisk vesikel er en lille membranblære, der opbevarer neurotransmitter i nerveenden.', [390, 207], [-1, 210],
        cirkel(390, 207, 22, '#ffe1a4') + prikker([[383, 200], [397, 200], [390, 213]], orange)],
      ['exocytose', 'Calciumindstrømningen får vesikler til at fusionere med cellemembranen. Neurotransmitter frigives til kløften.', [477, 251], [1, 222],
        streg('M450 260 H462 C468 260 464 235 477 235 C490 235 486 260 493 260 H504', '#9e5d9e', 4)
        + prikker([[477, 246], [474, 257]], orange)],
      ['synapsekløft', 'Synapsekløften er det smalle rum mellem cellernes membraner. Neurotransmitter kan diffundere gennem den.', [335, 293], [-1, 283],
        flade(kloeft, '#fff2d3')],
      ['neurotransmitter', 'Neurotransmitter er kemiske signalmolekyler. De diffunderer gennem kløften og kan binde sig til en receptor.', [477, 283], [1, 282],
        prikker([[479, 270], [477, 283], [465, 293], [485, 298]], orange)],
    ],
  },
  {
    navn: 'Den næste celle reagerer',
    dele: [
      ['postsynaptisk celle', 'Den postsynaptiske celle modtager signalet. Her ses en del af dens dendrit.', [343, 385], [-1, 390],
        flade(modtager, '#dceefb')],
      ['receptor', 'Her fungerer receptoren også som ionkanal. Den åbner, når neurotransmitter binder sig.', [486, 324], [1, 342],
        flade('M449 311 H468 L467 346 H453Z M483 311 H502 L498 346 H484Z', '#9fcdab')
        + prikker([[484, 309]], orange)],
      ['lokal depolarisering', 'Når positive ioner strømmer ind, bliver membranpotentialet mindre negativt lokalt. Det øger chancen for et nyt aktionspotentiale.', [475, 387], [1, 405],
        streg('M476 319 V386 M467 376 L476 386 L485 376', groen, 4)
        + tekst(475, 418, 'Positive ioner ind')],
    ],
  },
];

const dele = lag.flatMap(trin => trin.dele);
const hormon = hent('hormon');
export const ORD = flet(Object.fromEntries(dele.map(([ord, tekst]) => [ord, { ord, tekst }])), hormon.ord);
export const NOEGLE = 'byg-synapsen.v1';
export const FIGURER = [{
  id: 'kemisk', navn: 'Kemisk synapse',
  intro: 'Følg signalet oppefra og ned. Hvad bevæger sig langs aksonet, over synapsekløften og gennem receptoren?',
  vb: [880, 460], boks: [248, 42], mobilBredde: 690,
  lag: lag.map(({ navn, dele }) => ({ navn, ord: dele.map(([ord]) => ord) })),
  // Kløftens flade ligger bag vesikel, signalstoffer og kanal.
  dele: [{ ord: null, svg: baggrund }, ...[
    ...dele.filter(([ord]) => ord === 'synapsekløft'),
    ...dele.filter(([ord]) => ord !== 'synapsekløft'),
  ].map(([ord, , , , svg]) => ({ ord, svg }))],
  pladser: dele.map(([ord, , maal, [side, y], svg]) => ({
    ord, maal, x: 440 + side * 300, y, omr: svg,
  })),
}, hormon.figur];
