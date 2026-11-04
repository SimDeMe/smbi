// Hjertet skåret igennem og set forfra, som i lærebøgerne. Hjertets højre side
// ligger derfor til venstre i billedet.
import { glat } from '../../byg-motor/tegn.js';
import { F, defs, vene, arterie, stroemPil, lille } from './tegning.js';

// ── Hjertets omrids (muskelvæggen) ──────────────────────────
const omrids = glat([[352, 232], [324, 272], [314, 338], [326, 420], [350, 500], [398, 566], [470, 616],
  [556, 652], [612, 650], [664, 612], [704, 532], [716, 442], [712, 356], [704, 292], [690, 244],
  [648, 226], [590, 232], [530, 236], [470, 228], [410, 222]]);

// ── Hulrummene ──────────────────────────────────────────────
const hfk = glat([[378, 252], [352, 286], [350, 336], [372, 368], [398, 382], [446, 384], [456, 350],
  [456, 296], [440, 258], [412, 246]]);
const hfkHals = 'M402 372 H450 V412 H402Z';                      // åbningen ned til kammeret
const hk = glat([[372, 404], [366, 456], [388, 514], [438, 564], [500, 596], [516, 548], [512, 470],
  [506, 418], [476, 400], [420, 398]]);
const vfk = glat([[612, 252], [600, 284], [604, 324], [628, 340], [668, 334], [686, 302], [680, 262], [644, 246]]);
const vfkHals = 'M606 326 H654 V376 H606Z';
const vk = glat([[562, 372], [548, 430], [552, 512], [578, 584], [608, 612], [636, 588], [660, 512],
  [664, 432], [652, 384], [612, 364]]);

const hulrum = (d, gradient) => `<path d="${d}" fill="url(#${gradient})"/>`;
const skygge = (d) => `<path d="${d}" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="5"/>`;

// ── Skillevæggen mellem kamrene ─────────────────────────────
const skillevaeg = `<path d="M512 410 Q522 392 552 386 Q546 450 552 512 Q560 560 590 604 Q548 604 512 584 Q518 540 516 480Z"
  fill="url(#hj-fibre)" stroke="${F.muskelMoerk}" stroke-width="2"/>`;

// ── Karrene ─────────────────────────────────────────────────
// Aorta: op fra venstre kammer, buen over mod højre og ned bag hjertet.
const aortaSti = 'M572 392 C566 300 548 200 556 150 C566 86 640 74 690 92 C736 110 744 160 744 200';
const aorta = arterie(aortaSti, 46)
  + arterie('M600 84 V22', 20) + arterie('M640 78 V20', 18) + arterie('M676 86 L700 26', 18)
  + stroemPil(569, 236, -96) + stroemPil(735, 128, 70)
  + lille(714, 30, 'til hoved og arme', F.iltrigMoerk, 'start');
// Lungearterien: op fra højre kammer, deler sig i én gren til hver lunge.
const lungearterie = vene('M492 424 C494 340 500 260 512 196', 44)
  + vene('M512 196 C560 182 640 176 770 182', 32)
  + vene('M512 196 C470 192 380 190 258 194', 32)
  + stroemPil(497, 310, -86) + stroemPil(740, 181, 2) + stroemPil(282, 193, 180)
  + lille(262, 226, 'til lungen', F.iltfattigMoerk, 'start') + lille(766, 214, 'til lungen', F.iltfattigMoerk, 'end');
// Hulvenerne: øvre fra hoved og arme, nedre fra underkroppen.
const hulvener = vene('M398 18 V268', 48) + vene('M300 680 V470 C300 400 318 360 368 352', 44)
  + stroemPil(398, 110, 90) + stroemPil(300, 560, -90)
  + lille(430, 30, 'fra hoved og arme', F.iltfattigMoerk, 'start') + lille(330, 668, 'fra underkroppen', F.iltfattigMoerk, 'start');
// Lungevenerne: to fra hver lunge; dem fra højre lunge går bag hjertet og ses ikke.
const lungevener = arterie('M770 262 C730 262 700 270 664 280', 24) + arterie('M770 318 C730 318 700 312 668 304', 24)
  + stroemPil(732, 262, 180) + stroemPil(732, 318, 180)
  + lille(724, 350, 'fra lungen', F.iltrigMoerk, 'start');

// ── Klapperne ───────────────────────────────────────────────
const sejl = (x, y, v) => `<path d="M${x} ${y} q${v * 6} 22 ${v * 2} 46 q${v * 8} -4 ${v * 18} -34 q${-v * 4} -8 ${-v * 20} -12Z"
  fill="${F.klap}" stroke="${F.klapKant}" stroke-width="2" stroke-linejoin="round"/>`;
const sejlklapper = sejl(404, 398, 1) + sejl(448, 398, -1) + sejl(608, 362, 1) + sejl(652, 362, -1);
// senetråde fra klappernes spidser ned til papillærmusklerne
const papil = (x, y) => `<path d="M${x - 14} ${y + 16} Q${x} ${y - 16} ${x + 14} ${y + 16}Z" fill="${F.muskel}" stroke="${F.muskelMoerk}" stroke-width="2"/>`;
const traade = (fra, til) => fra.map(([x, y]) => `M${x} ${y} L${til[0]} ${til[1]}`).join(' ');
const senetraade = papil(424, 520) + papil(470, 540) + papil(600, 548) + papil(640, 530)
  + `<path d="${traade([[406, 444], [414, 438]], [424, 508])} ${traade([[446, 444], [438, 438]], [470, 528])}
     ${traade([[610, 408], [618, 402]], [600, 536])} ${traade([[650, 408], [642, 402]], [640, 518])}"
     stroke="#FBF3DC" stroke-width="2.4" stroke-linecap="round" fill="none"/>
     <path d="${traade([[406, 444], [414, 438]], [424, 508])} ${traade([[446, 444], [438, 438]], [470, 528])}
     ${traade([[610, 408], [618, 402]], [600, 536])} ${traade([[650, 408], [642, 402]], [640, 518])}"
     stroke="${F.klapKant}" stroke-width=".8" stroke-linecap="round" fill="none"/>`;
// lommeklapperne: tre små lommer ved udgangen til aorta og lungearterien (to ses)
const lomme = (x, y, g) => `<g transform="translate(${x} ${y}) rotate(${g})">
  <path d="M-19 0 Q-10 -15 0 -2 Q10 -15 19 0 Q10 6 0 4 Q-10 6 -19 0Z" fill="${F.klap}" stroke="${F.klapKant}" stroke-width="2" stroke-linejoin="round"/></g>`;
const lommeklapper = lomme(493, 426, -2) + lomme(572, 394, -4);

export default {
  id: 'hjerte',
  navn: 'Hjertet',
  intro: 'Hjertet skåret igennem og set forfra. Hjertets højre side ligger derfor til venstre i billedet. Blå er iltfattigt blod, rød er iltrigt.',
  vb: [1000, 680],
  boks: [206, 42],
  mobilBredde: 720,
  lag: [
    { navn: 'Fire hulrum og en væg', ord: ['hoejreForkammer', 'hoejreKammer', 'venstreForkammer', 'venstreKammer', 'skillevaeg'] },
    { navn: 'Karrene ind og ud', ord: ['hulvener', 'lungearterie', 'lungevener', 'aorta'], ekstra: ['kranspulsaare'],
      ekstraFejl: { kranspulsaare: 'Kranspulsårerne ligger uden på hjertet og forsyner selve hjertemusklen. De ses ikke i et snit gennem hulrummene.' } },
    { navn: 'Klapperne holder retningen', ord: ['sejlklapper', 'lommeklapper', 'senetraade'] },
  ],
  dele: [
    { ord: null, svg: defs + `<path d="${omrids}" fill="url(#hj-muskel)" stroke="${F.muskelMoerk}" stroke-width="3"/>` },
    { ord: 'hoejreForkammer', svg: hulrum(hfk, 'hj-fattig') + hulrum(hfkHals, 'hj-fattig') + skygge(hfk)
      + stroemPil(426, 360, 90, F.iltfattigLys) },
    { ord: 'hoejreKammer', svg: hulrum(hk, 'hj-fattig') + skygge(hk) + stroemPil(478, 470, -80, F.iltfattigLys) },
    { ord: 'venstreForkammer', svg: hulrum(vfk, 'hj-rig') + hulrum(vfkHals, 'hj-rig') + skygge(vfk)
      + stroemPil(630, 320, 90, F.iltrigLys) },
    { ord: 'venstreKammer', svg: hulrum(vk, 'hj-rig') + skygge(vk) + stroemPil(578, 470, -96, F.iltrigLys) },
    { ord: 'skillevaeg', svg: skillevaeg },
    { ord: 'aorta', svg: aorta },
    { ord: 'lungearterie', svg: lungearterie },
    { ord: 'hulvener', svg: hulvener },
    { ord: 'lungevener', svg: lungevener },
    { ord: 'senetraade', svg: senetraade },
    { ord: 'sejlklapper', svg: sejlklapper },
    { ord: 'lommeklapper', svg: lommeklapper },
  ],
  pladser: [
    // venstre kolonne
    { ord: 'hulvener', x: 125, y: 60, maal: [398, 70],
      omr: `<path d="M398 18 V268 M300 680 V470 C300 400 318 360 368 352" fill="none" stroke-width="64"/>`,
      fejl: { aorta: 'Aorta udgår fra venstre hjertekammer. De her kar er blå og fører blodet fra kroppen ind i hjertet.',
              lungevener: 'Lungevenerne kommer fra lungerne. De her kar kommer oppe- og nedefra, altså fra kroppen.' } },
    { ord: 'lungearterie', x: 125, y: 162, maal: [300, 194],
      omr: `<path d="M492 424 C494 340 500 260 512 196 M512 196 C560 182 640 176 770 182 M512 196 C470 192 380 190 258 194" fill="none" stroke-width="54"/>`,
      fejl: { lungevener: 'Følg pilene: blodet i det her kar løber væk fra hjertet, ud mod lungen.',
              aorta: 'Aorta er rød og går til kroppen. Det her blå kar kommer fra højre hjertekammer.' } },
    { ord: 'hoejreForkammer', x: 125, y: 270, maal: [392, 300],
      omr: `<path d="${hfk}"/>`,
      fejl: { venstreForkammer: 'Husk, at hjertet ses forfra: hjertets højre side står til venstre i billedet.',
              hoejreKammer: 'Kamrene er de store rum forneden. Her er det rummet øverst, som hulvenerne munder ud i.' } },
    { ord: 'lommeklapper', x: 125, y: 380, maal: [480, 424],
      omr: `<circle cx="493" cy="422" r="26"/><circle cx="572" cy="390" r="26"/>`,
      fejl: { sejlklapper: 'Sejlklapperne sidder mellem forkammer og kammer. Pladsen peger på udgangen fra kammeret til en arterie.' } },
    { ord: 'hoejreKammer', x: 125, y: 490, maal: [390, 470],
      omr: `<path d="${hk}"/>`,
      fejl: { venstreKammer: 'Hjertet ses forfra, så højre side står til venstre. Se også væggen: den her er tynd.',
              hoejreForkammer: 'Forkamrene ligger øverst. Det her rum ligger nederst og pumper blodet ud i lungearterien.' } },
    { ord: 'skillevaeg', x: 125, y: 600, maal: [532, 556],
      omr: `<path d="M512 410 Q522 392 552 386 Q546 450 552 512 Q560 560 590 604 Q548 604 512 584 Q518 540 516 480Z"/>`,
      fejl: { venstreKammer: 'Pladsen peger på muskelvæggen mellem de to kamre, ikke på hulrummet.' } },
    // højre kolonne
    { ord: 'aorta', x: 875, y: 60, maal: [700, 96],
      omr: `<path d="${aortaSti}" fill="none" stroke-width="66"/>`,
      fejl: { lungearterie: 'Karret er rødt og udgår fra venstre hjertekammer. Det fører iltrigt blod ud til hele kroppen.',
              hulvener: 'Følg pilene: blodet løber væk fra hjertet. Venerne fører blod ind i hjertet.' } },
    { ord: 'lungevener', x: 875, y: 290, maal: [760, 290],
      omr: `<path d="M770 262 C730 262 700 270 664 280 M770 318 C730 318 700 312 668 304" fill="none" stroke-width="40"/>`,
      fejl: { lungearterie: 'Karrene er røde og fører blodet ind i hjertet. Iltrigt blod kommer tilbage fra lungerne.',
              hulvener: 'Hulvenerne munder ud i højre forkammer. De her kar fører iltrigt blod ind i venstre forkammer.' } },
    { ord: 'venstreForkammer', x: 875, y: 196, maal: [664, 268],
      omr: `<path d="${vfk}"/>`,
      fejl: { hoejreForkammer: 'Husk, at hjertet ses forfra: hjertets venstre side står til højre i billedet.',
              venstreKammer: 'Kamrene er de store rum forneden. Det her rum modtager blodet fra lungevenerne.' } },
    { ord: 'sejlklapper', x: 875, y: 392, maal: [658, 388],
      omr: `<rect x="394" y="390" width="64" height="62" rx="16"/><rect x="598" y="354" width="64" height="62" rx="16"/>`,
      fejl: { lommeklapper: 'Lommeklapperne sidder ved udgangen til arterierne. Her sidder klappen mellem forkammer og kammer.',
              senetraade: 'Senetrådene er de tynde snore. Pladsen peger på de flige, de holder fast i.' } },
    { ord: 'venstreKammer', x: 875, y: 596, maal: [618, 582],
      omr: `<path d="${vk}"/>`,
      fejl: { hoejreKammer: 'Hjertet ses forfra, så venstre side står til højre. Se også muskelvæggen: den her er tykkest.',
              venstreForkammer: 'Forkamrene ligger øverst. Det her rum ligger nederst og pumper blodet ud i aorta.' } },
    { ord: 'senetraade', x: 875, y: 490, maal: [646, 466],
      omr: `<rect x="400" y="432" width="84" height="110" rx="20"/><rect x="590" y="396" width="66" height="146" rx="20"/>`,
      fejl: { sejlklapper: 'Klapperne er de lyse flige foroven. Pladsen peger på de tynde snore, der holder dem.',
              skillevaeg: 'Skillevæggen er den stribede muskel mellem kamrene. Pladsen peger på de tynde snore inde i kammeret.' } },
  ],
};
