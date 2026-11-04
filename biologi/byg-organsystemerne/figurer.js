import { hent, flet } from '../byg-biologi/figurer.js';
// Skematiske forfrafigurer. Kroppens højre side er til venstre på tegningen.
const flade = (d, farve) => `<path d="${d}" fill="${farve}" stroke="#334155" stroke-width="2"/>`;
const streg = (d, farve, bredde = 8) =>
  `<path d="${d}" fill="none" stroke="${farve}" stroke-width="${bredde}" stroke-linecap="round" stroke-linejoin="round"/>`;
const oval = (x, y, rx, ry, farve) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${farve}" stroke="#334155" stroke-width="2"/>`;

const hudfarve = '#f6d8c2';
const blaa = '#437ab7';
const roed = '#cb4860';
const groen = '#53a577';
const lilla = '#a682c2';
const orange = '#df9861';
const gul = '#e9bc53';

const krop = flade('M415 96 C387 88 387 25 430 25 C473 25 473 88 445 96 L445 111 Q467 117 489 126 L509 207 L530 276 Q529 294 514 288 L486 221 L471 176 L469 233 Q484 264 470 307 L457 388 L466 419 Q452 427 431 421 L428 315 L424 315 L419 421 Q398 427 384 419 L394 388 L383 307 Q369 264 387 233 L389 176 L374 221 L346 288 Q331 294 330 276 L351 207 L371 126 Q393 117 415 111Z', '#fcf2e8');

const systemer = [
  {
    id: 'kredsloeb', navn: 'Kredsløbet', intro: 'Følg forbindelsen mellem hjertet, lungerne og resten af kroppen.',
    lag: ['Pumpen og de store kar', 'Forbindelserne til vævene'],
    dele: [
      ['hjertet', 'Hjertet pumper blod til lungerne og videre rundt i kroppen.', [447, 175], [1, 150],
        flade('M429 155 C407 142 407 181 447 195 C473 177 465 146 447 157 Q437 145 429 155Z', roed)],
      ['aorta', 'Aorta fører blod fra venstre hjertekammer ud til kroppen.', [447, 226], [1, 225],
        streg('M441 158 Q441 125 459 128 Q474 134 451 169 L447 250 M447 250 L457 297', roed)],
      ['hulvenerne', 'Øvre og nedre hulvene fører blod fra kroppen tilbage til højre forkammer.', [408, 224], [-1, 225],
        streg('M405 124 L413 160 M413 175 L405 251 L395 297', blaa)],
      ['lungernes kapillærer', 'I lungernes kapillærer optager blodet ilt og afgiver kuldioxid.', [391, 156], [-1, 125],
        streg('M413 165 L399 156 Q384 139 385 156 Q387 170 399 165 L438 184', lilla, 6)],
      ['kroppens kapillærer', 'I kroppens kapillærer udveksler blodet blandt andet ilt, kuldioxid og næringsstoffer med vævene.', [425, 297], [-1, 300],
        streg('M395 297 Q401 280 410 296 T425 297 T441 297 T457 297', lilla, 7)],
    ],
  },
  {
    id: 'aandedraet', navn: 'Åndedrættet', intro: 'Følg luften fra næsen til lungerne, og find musklen der hjælper med at trække den ind.',
    lag: ['De øvre luftveje og lungerne', 'Luftfordeling og ventilation'],
    dele: [
      ['næsehulen', 'Næsehulen varmer, fugter og filtrerer indåndingsluften.', [421, 62], [-1, 60],
        flade('M405 69 Q412 52 433 55 L437 69Z', orange)],
      ['luftrøret', 'Luftrøret leder luft fra struben til de to hovedbronkier.', [429, 113], [1, 105],
        streg('M433 73 L429 104 L429 141', blaa, 12)],
      ['lungerne', 'Lungerne rummer forgrenede luftveje, som ender i lungeblærer.', [465, 162], [1, 166],
        flade('M416 123 C393 122 379 167 387 198 Q405 204 422 185 L422 136Z M443 123 C467 122 482 167 473 198 Q455 204 437 185 L437 136Z', orange)],
      ['bronkierne', 'De to hovedbronkier fordeler luften til hver sin lunge og forgrener sig videre.', [410, 157], [-1, 156],
        streg('M429 141 L404 163 L396 179 M404 163 L399 151 M429 141 L455 163 L463 180 M455 163 L461 150', blaa, 6)],
      ['mellemgulvet', 'Når mellemgulvet trækker sig sammen, flader det ud. Brysthulen bliver større, og luft strømmer ind.', [430, 205], [1, 230],
        streg('M378 220 Q430 185 482 220', roed, 9)],
    ],
  },
  {
    id: 'fordoejelse', navn: 'Fordøjelsen', intro: 'Følg fødens vej, og find organet der sender galde til tarmen.',
    lag: ['Fra mund til mavesæk', 'Tarmene og leveren'],
    dele: [
      ['mundhulen', 'I munden findeler tænderne føden, og spyttets amylase begynder at nedbryde stivelse.', [425, 71], [-1, 67],
        oval(425, 71, 16, 6, roed)],
      ['spiserøret', 'Bølger af muskelsammentrækninger i spiserørets væg fører føden til mavesækken.', [430, 142], [1, 133],
        streg('M432 77 Q430 119 432 156 L440 179', orange, 10)],
      ['mavesækken', 'Mavesækken ælter føden. Syre og enzymet pepsin bidrager til fordøjelsen af protein.', [456, 203], [1, 194],
        flade('M436 174 C448 180 453 170 466 180 C491 200 457 226 427 216 L427 205 Q449 200 436 184Z', roed)],
      ['leveren', 'Leveren danner galde, der findeler fedt til små dråber i tyndtarmen.', [408, 191], [-1, 186],
        flade('M388 182 Q413 172 433 187 Q427 208 389 208Z', '#a85856')],
      ['tyndtarmen', 'I tyndtarmen nedbrydes føden videre, og størstedelen af næringsstofferne optages.', [441, 252], [1, 251],
        streg('M427 210 Q410 218 423 231 H445 Q456 231 448 240 H410 Q403 248 413 252 H445 Q453 259 443 266 H430 L418 277', orange, 8)],
      ['tyktarmen', 'Tyktarmen optager blandt andet vand og salte fra tarmindholdet.', [400, 255], [-1, 253],
        streg('M418 277 H400 V226 H462 V272 Q458 281 430 284 L430 297', lilla, 9)],
    ],
  },
  {
    id: 'urinveje', navn: 'Urinsystemet', intro: 'Følg urinen fra de organer, der danner den, til kroppens yderside.',
    lag: ['Fra blod til urin', 'Lagring og udskillelse'],
    dele: [
      ['nyrerne', 'Nyrerne danner urin og regulerer blandt andet kroppens vand- og saltbalance.', [399, 211], [-1, 208],
        flade('M410 190 C385 180 381 221 396 225 Q407 227 408 215 Q396 207 410 201Z M450 186 C475 176 479 217 464 221 Q453 223 452 211 Q464 203 450 197Z', roed)],
      ['urinlederne', 'En urinleder fører urin fra hver nyre til blæren.', [447, 235], [1, 235],
        streg('M405 209 Q408 250 420 263 M455 205 Q452 246 440 263', gul, 6)],
      ['urinblæren', 'Urinblæren lagrer urinen mellem vandladningerne.', [429, 273], [-1, 273],
        flade('M411 265 Q430 253 449 265 Q454 282 430 289 Q406 282 411 265Z', orange)],
      ['urinrøret', 'Urinrøret fører urin fra blæren til kroppens yderside.', [429, 300], [1, 306],
        streg('M430 289 L429 310', gul, 6)],
    ],
  },
  {
    id: 'nerver', navn: 'Nervesystemet', intro: 'Find centralnervesystemet og følg dets forbindelser ud til kroppen.',
    lag: ['Centralnervesystemet', 'Det perifere nervesystem'],
    dele: [
      ['hjernen', 'Hjernen bearbejder sanseindtryk og medvirker blandt andet til at styre bevægelse og adfærd.', [430, 52], [-1, 55],
        flade('M407 60 C392 50 410 32 421 39 C430 29 450 38 450 46 Q463 55 447 64 Q441 75 425 66 Q413 72 407 60Z', lilla)],
      ['rygmarven', 'Rygmarven leder signaler mellem hjerne og krop og indgår i mange reflekser.', [430, 183], [1, 167],
        streg('M430 65 L430 253', lilla, 10)],
      ['nerver til armene', 'Armnerverne fører blandt andet sansesignaler ind mod rygmarven og motoriske signaler ud til musklerne.', [366, 192], [-1, 197],
        streg('M430 134 L385 148 L348 269 M430 134 L475 148 L512 269', gul, 5)],
      ['nerver til benene', 'Bennerverne forbinder blandt andet hud og muskler i benene med centralnervesystemet.', [457, 339], [1, 345],
        streg('M430 237 L404 278 L399 403 M430 237 L453 278 L457 403', gul, 5)],
    ],
  },
  {
    id: 'hormoner', navn: 'Hormonsystemet', intro: 'Find eksempler på kirtler, der frigiver hormoner til blodet.',
    lag: ['I hovedet og halsen', 'I bughulen'],
    dele: [
      ['hypofysen', 'Hypofysen frigiver hormoner, der blandt andet regulerer vækst og aktiviteten i andre kirtler.', [430, 71], [-1, 70],
        oval(430, 71, 8, 6, lilla)],
      ['skjoldbruskkirtlen', 'Skjoldbruskkirtlen danner hormoner, som blandt andet regulerer kroppens stofskifte.', [431, 108], [1, 110],
        flade('M413 96 Q426 96 427 105 H433 Q435 96 447 96 Q452 115 443 119 Q435 119 432 112 H428 Q422 121 415 117 Q408 112 413 96Z', roed)],
      ['binyrerne', 'Binyrerne danner blandt andet adrenalin, kortisol og aldosteron.', [400, 193], [-1, 193],
        flade('M386 198 Q396 178 412 196Z M449 193 Q460 174 475 194Z', gul)],
      ['bugspytkirtlen', 'Celler i bugspytkirtlen frigiver blandt andet insulin og glukagon, som regulerer blodsukkeret.', [443, 220], [1, 223],
        flade('M405 229 Q414 214 429 219 Q446 207 469 215 Q464 229 436 231 Q417 239 405 229Z', orange)],
    ],
  },
  {
    id: 'lymfe', navn: 'Lymfe og immunforsvar', intro: 'Find strukturerne der leder lymfe tilbage mod blodet, og organerne der medvirker i immunforsvaret.',
    lag: ['Transport og filtrering', 'Organer i immunforsvaret'],
    dele: [
      ['lymfekarrene', 'Lymfekarrene opsamler overskydende vævsvæske og fører den tilbage til blodbanen.', [437, 259], [1, 260],
        streg('M399 383 L404 277 L437 259 L437 147 L452 123 M456 382 L454 277 L437 259 M437 170 L478 149 L511 263 M437 170 L382 149 L349 263', groen, 6)],
      ['lymfeknuderne', 'Lymfeknuder filtrerer lymfen og er steder, hvor immunceller kan reagere på fremmede stoffer.', [384, 151], [-1, 150],
        oval(384, 151, 9, 8, groen) + oval(477, 151, 9, 8, groen) + oval(405, 277, 9, 8, groen) + oval(454, 277, 9, 8, groen)],
      ['brisselen', 'I brisselen modnes T-celler. Organet er typisk større hos børn end hos voksne.', [426, 137], [1, 123],
        flade('M411 121 Q419 111 427 124 Q439 114 443 127 L439 151 Q428 159 426 148 Q415 157 411 143Z', lilla)],
      ['milten', 'Milten filtrerer blodet, bidrager til immunforsvaret og fjerner blandt andet gamle røde blodlegemer.', [468, 204], [1, 202],
        flade('M470 188 Q483 189 478 206 Q472 224 459 215 Q452 207 470 188Z', roed)],
    ],
  },
  {
    id: 'bevaegelse', navn: 'Bevægeapparatet', intro: 'Se, hvordan knogler, led, muskler og sener arbejder sammen. Figuren fremhæver udvalgte eksempler.',
    lag: ['Støtte og bevægelighed', 'Kraft og kraftoverførsel'],
    dele: [
      ['rygsøjlen', 'Rygsøjlen bærer kroppen og beskytter rygmarven. Den er bygget af hvirvler.', [428, 206], [-1, 207],
        streg('M428 105 Q423 165 428 206 T428 259', '#a89072', 13)],
      ['lårbenene', 'Lårbenene bærer vægt og danner led med bækkenet og underbenene.', [401, 311], [-1, 311],
        streg('M396 268 L402 347 M457 268 L450 347', '#a89072', 12)],
      ['knæleddene', 'Knæleddene gør det blandt andet muligt at bøje og strække underbenet.', [402, 352], [-1, 372],
        oval(402, 352, 10, 9, blaa) + oval(451, 352, 10, 9, blaa)],
      ['skeletmusklen', 'En skeletmuskel udvikler træk, når dens fibre aktiveres. Her ses en muskel på forsiden af låret.', [462, 299], [1, 291],
        flade('M456 265 Q477 277 466 309 L454 331 Q445 309 452 288Z', roed)],
      ['senen', 'Senen overfører musklens træk til knoglen. Her ses senen fra lårets strækkemuskel til knæskallen.', [454, 329], [1, 404],
        streg('M454 325 L451 344', orange, 6)],
    ],
  },
  {
    id: 'hud', navn: 'Huden', intro: 'Se et forstørret snit gennem huden. Hvilke dele beskytter kroppen, og hvor dannes sved?',
    baggrund: flade('M285 105 H575 V355 H285Z', '#fcf2e8'),
    lag: ['Hudens lag', 'Hår og sved'],
    dele: [
      ['overhuden', 'Overhuden danner en barriere, der begrænser vandtab og hæmmer indtrængen af mikroorganismer.', [332, 120], [-1, 120],
        flade('M285 105 H575 V135 H285Z', '#c98672')],
      ['læderhuden', 'Læderhuden består af bindevæv og rummer blandt andet blodkar, nerver og kirtler.', [332, 206], [-1, 207],
        flade('M285 135 H575 V283 H285Z', hudfarve)],
      ['underhuden', 'Underhuden ligger under selve huden. Dens fedtvæv isolerer og fungerer som energilager.', [332, 319], [-1, 319],
        flade('M285 283 H575 V355 H285Z', '#f4d184')],
      ['hårsækken', 'Hårsækken omgiver hårroden. Håret dannes af celler ved hårsækkens bund.', [410, 232], [1, 204],
        flade('M382 137 Q417 155 431 226 Q431 251 410 252 Q395 244 393 211Z', orange) +
        streg('M374 66 Q397 132 411 230', '#623b29', 8)],
      ['svedkirtlen', 'Svedkirtlen danner sved. Når sveden fordamper fra hudens overflade, afgiver kroppen varme.', [521, 262], [1, 280],
        streg('M522 105 L523 247 Q545 249 536 267 Q528 282 509 271 Q499 262 511 251 Q522 245 529 257 Q536 269 520 269 Q511 268 517 258', blaa, 6)],
    ],
  },
  {
    id: 'reproduktion', navn: 'Forplantningen', intro: 'Sammenlign to skematiske snit. Hvor dannes kønscellerne, og hvilken vej bevæger de sig?',
    baggrund: `<text x="332" y="89" text-anchor="middle" class="fig-navn">Ægceller</text>
      <text x="525" y="89" text-anchor="middle" class="fig-navn">Sædceller</text>`,
    lag: ['Hvor kønscellerne dannes', 'Transport og udvikling'], foersteLag: 2,
    dele: [
      ['æggestokken', 'I æggestokkene modnes ægceller. Æggestokkene danner også blandt andet østrogen og progesteron.', [297, 193], [-1, 191],
        oval(297, 193, 16, 11, orange) + oval(377, 193, 16, 11, orange)],
      ['testiklen', 'I testiklerne dannes sædceller. Testiklerne danner også testosteron.', [546, 300], [1, 302],
        oval(546, 300, 18, 23, orange)],
      ['æggelederen', 'Æggelederen fører ægcellen mod livmoderen. Befrugtningen sker oftest i æggelederen.', [302, 160], [-1, 134],
        streg('M293 175 Q297 150 319 157 L331 169 M381 175 Q377 150 355 157 L343 169', roed, 8)],
      ['livmoderen', 'Et tidligt embryo kan sætte sig fast i livmoderens slimhinde. Her kan det udvikle sig under en graviditet.', [337, 224], [-1, 248],
        flade('M312 170 Q337 160 362 170 Q365 193 345 214 L344 240 H330 L329 214 Q309 193 312 170Z', lilla)],
      ['sædlederen', 'Sædlederen fører sædceller fra bitestiklen mod urinrøret ved sædafgang.', [552, 192], [1, 194],
        streg('M563 291 Q578 262 557 211 Q542 167 520 173 Q502 177 504 198 L511 221', blaa, 7)],
    ],
  },
];

export const NOEGLE = 'byg-organsystemerne.v1';
const nefron = hent('nefron');
export const ORD = flet(Object.fromEntries(systemer.flatMap(({ dele }) =>
  dele.map(([ord, tekst]) => [ord, { ord, tekst }]))), nefron.ord);

const oversigter = systemer.map(({ id, navn, intro, lag, dele, baggrund = krop, foersteLag = Math.ceil(dele.length / 2) }) => ({
  id, navn, intro,
  vb: [860, 446],
  boks: [232, 42],
  mobilBredde: 650,
  lag: lag.map((navn, i) => ({
    navn,
    ord: (i === 0 ? dele.slice(0, foersteLag) : dele.slice(foersteLag))
      .map(([ord]) => ord),
  })),
  dele: [{ ord: null, svg: baggrund }, ...dele.map(([ord, , , , svg]) => ({ ord, svg }))],
  pladser: dele.map(([ord, , maal, [side, y], svg]) => ({
    ord, maal, x: 430 + side * 292, y, omr: svg,
  })),
}));

// Nefronet er en lup på urinsystemet og står lige efter det.
const i = oversigter.findIndex((f) => f.id === 'urinveje') + 1;
export const FIGURER = [...oversigter.slice(0, i), nefron.figur, ...oversigter.slice(i)];
