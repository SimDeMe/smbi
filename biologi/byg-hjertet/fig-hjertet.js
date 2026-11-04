// Hjertet skåret igennem og set forfra, som i lærebøgerne. Hjertets højre side
// ligger derfor til venstre i billedet.
//
// Sådan hænger rør og kamre sammen:
// - Karrene tegnes BAG hjertevæggen, så de kommer frem under hjertets kant.
// - Hvert kar har en «munding»: en kanal i blodets farve gennem væggen fra
//   hulrummet ud til karret. Den tegnes oven på væggen og dækker kantstregen,
//   så blodet løber uden afbrydelse fra rør til hulrum.
// - Forkammer og kammer på samme side er ét sammenhængende hulrum, klippet i
//   to ved klapringen. Så er der ingen søm, hvor blodet løber igennem.
// - Rør og hulrum har samme flade farve: rød for iltrigt, blå for iltfattigt blod.
import { glat } from '../../byg-motor/tegn.js';
import { F, defs, stroemPil, lille } from './tegning.js';

const r1 = (v) => Math.round(v * 10) / 10;
const BLAA = { farve: F.iltfattig, kant: F.iltfattigMoerk, lys: F.iltfattigLys };
const ROED = { farve: F.iltrig, kant: F.iltrigMoerk, lys: F.iltrigLys };

/** Blodkar som rør: mørk kant, blodets farve og en lys glans langs midten. Flere stykker
 *  tegnes lag for lag (alle kanter, så al farve, så al glans), så grenene flyder sammen uden søm. */
const kar = (stykker, t) => {
  const lag = (f) => stykker.map(([d, b]) => f(d, b)).join('');
  return lag((d, b) => `<path d="${d}" fill="none" stroke="${t.kant}" stroke-width="${b + 6}"/>`)
    + lag((d, b) => `<path d="${d}" fill="none" stroke="${t.farve}" stroke-width="${b}"/>`)
    + lag((d, b) => `<path d="${d}" fill="none" stroke="${t.lys}" stroke-width="${r1(b * 0.34)}" opacity=".55"/>`);
};
/** Karrets munding gennem hjertevæggen: blodets farve med samme bløde skygge langs siderne som hulrummene. */
const munding = (d, b, t) => `<g clip-path="url(#hj-k-hjerte)"><path d="${d}" fill="none" stroke="${t.farve}" stroke-width="${b}"/>
  <path d="${d}" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="${b}"/>
  <path d="${d}" fill="none" stroke="${t.farve}" stroke-width="${b - 10}"/></g>`;
/** Et overskåret kar set på skrå: en flad ellipse for enden. v er karrets retning i grader. */
const ende = (x, y, b, v, t) => `<g transform="translate(${x} ${y}) rotate(${v - 90})">
  <ellipse rx="${(b + 6) / 2}" ry="${r1(b * 0.2 + 3)}" fill="${t.farve}" stroke="${t.kant}" stroke-width="3"/>
  <ellipse rx="${r1(b / 2 - 3)}" ry="${r1(b * 0.12)}" fill="${t.kant}" opacity=".7"/></g>`;

// ── Hjertets omrids (muskelvæggen) ──────────────────────────
const omrids = glat([[396, 230], [440, 236], [494, 245], [551, 244], [610, 236], [660, 240], [692, 262],
  [708, 306], [718, 370], [722, 452], [712, 536], [684, 608], [640, 652], [586, 664], [520, 638],
  [460, 612], [400, 574], [358, 532], [328, 500], [316, 440], [314, 370], [316, 310], [330, 262], [360, 238]]);

// ── Hulrummene ──────────────────────────────────────────────
// Højre side: forkammer, klapring, kammer og udløbet op til lungearterien.
const hoejre = glat([[380, 256], [420, 252], [450, 266], [460, 306], [460, 360], [458, 410], [456, 444],
  [468, 456], [474, 420], [474, 330], [474, 290], [477, 266], [511, 266], [514, 290], [516, 350],
  [518, 420], [520, 480], [518, 540], [510, 584], [482, 592], [452, 582], [426, 560], [412, 522],
  [406, 466], [404, 454], [390, 476], [376, 490], [344, 490], [336, 460], [334, 400], [336, 340], [348, 284]]);
// Venstre side: forkammer, klapring, kammer og udløbet op til aorta.
const venstre = glat([[612, 256], [660, 252], [688, 270], [696, 304], [690, 336], [668, 352], [656, 372],
  [670, 392], [678, 440], [674, 520], [654, 584], [622, 616], [594, 612], [574, 576], [562, 510],
  [558, 440], [548, 400], [540, 366], [542, 346], [562, 342], [580, 356], [604, 374], [604, 352],
  [592, 322], [592, 284]]);

// klip langs klapringene: forkammer ovenfor, kammer nedenfor
const klip = `<defs>
  <clipPath id="hj-k-hfk"><path d="M300 200 H470 V446 L404 454 V540 H300Z"/></clipPath>
  <clipPath id="hj-k-hk"><path d="M300 540 H404 V454 L470 446 V200 H560 V700 H300Z"/></clipPath>
  <clipPath id="hj-k-vfk"><rect x="586" y="200" width="180" height="168"/></clipPath>
  <clipPath id="hj-k-vk"><path d="M520 200 H586 V368 H766 V700 H520Z"/></clipPath>
  <clipPath id="hj-k-h"><path d="${hoejre}"/></clipPath>
  <clipPath id="hj-k-hjerte"><path d="${omrids}" transform="translate(518 450) scale(1.012) translate(-518 -450)"/></clipPath>
  <clipPath id="hj-k-v"><path d="${venstre}"/></clipPath>
  <radialGradient id="hj-muskel-u" gradientUnits="userSpaceOnUse" cx="460" cy="340" r="430">
    <stop offset="0" stop-color="${F.muskelLys}"/><stop offset=".55" stop-color="${F.muskel}"/><stop offset="1" stop-color="#CF8579"/>
  </radialGradient>
</defs>`;

// Et hulrum: flad blodfarve med en blød skygge inden for kanten, så rummet får dybde.
const hulrum = (d, side, del, t) => `<g clip-path="url(#hj-k-${del})">
  <path d="${d}" fill="${t.farve}"/>
  <path d="${d}" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="14" clip-path="url(#hj-k-${side})"/>
  <path d="${d}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="5" clip-path="url(#hj-k-${side})"/></g>`;
// klapringen: en svag stiplet linje, der skiller forkammer fra kammer, før klapperne er sat på
const ring = (d, t) => `<path d="${d}" fill="none" stroke="${t.kant}" stroke-width="2.5" stroke-dasharray="5 5" stroke-linecap="round" opacity=".55"/>`;

// ── Skillevæggen mellem kamrene ─────────────────────────────
// Tegnes før kamrene, så de dækker dens sider: det, der ses, er netop muskelen imellem.
const skillevaegSti = 'M506 330 Q528 318 548 340 L556 440 L566 520 Q576 574 600 616 Q556 624 516 594 Q504 560 510 480Z';
const skillevaeg = `<path d="${skillevaegSti}" fill="url(#hj-fibre)" stroke="${F.muskelMoerk}" stroke-width="1.5" stroke-opacity=".6"/>`;

// ── Karrene ─────────────────────────────────────────────────
// Lungearterien: op fra højre kammer, foran aorta, deler sig under aortabuen.
// Grenen til højre lunge løber bag aorta og øvre hulvene.
const laTrunk = 'M494 262 V240 C494 205 540 186 614 180';
const laVenstreGren = 'M614 180 C660 176 712 176 772 178';
const laHoejreGren = 'M614 182 C540 184 420 188 264 192';
const lungearterieBag = kar([[laHoejreGren, 34]], BLAA) + ende(264, 192, 34, 180, BLAA)
  + stroemPil(304, 191, 180) + lille(268, 228, 'til lungen', F.iltfattigMoerk, 'start');
const lungearterieForan = kar([[laTrunk + laVenstreGren.replace('M614 180', ''), 38]], BLAA) + ende(772, 178, 38, 0, BLAA)
  + stroemPil(522, 208, -42) + stroemPil(740, 177, 0)
  + lille(714, 152, 'til lungen', F.iltfattigMoerk, 'start');
const lungearterieMund = munding('M494 274 V236', 38, BLAA);

// Aorta: op fra venstre kammer, buen over og ned bag hjertet.
const aortaSti = 'M551 262 V150 C551 92 584 74 622 74 C664 74 684 104 684 150 V300';
const aorta = kar([['M588 96 L580 26', 20], ['M624 90 V22', 18], ['M660 98 L676 28', 18], [aortaSti, 42]], ROED)
  + ende(580, 26, 20, -96, ROED) + ende(624, 22, 18, -90, ROED) + ende(676, 28, 18, -77, ROED)
  + stroemPil(612, 74, 0) + stroemPil(684, 236, 90)
  + lille(694, 30, 'til hoved og arme', F.iltrigMoerk, 'start');
const aortaMund = munding('M551 352 V236', 40, ROED);

// Hulvenerne: øvre fra hoved og arme, nedre fra underkroppen.
const hulvener = kar([['M395 24 V250', 42], ['M360 690 V500', 40]], BLAA) + ende(395, 24, 42, 90, BLAA)
  + stroemPil(395, 130, 90) + stroemPil(360, 626, -90)
  + lille(426, 34, 'fra hoved og arme', F.iltfattigMoerk, 'start') + lille(392, 668, 'fra underkroppen', F.iltfattigMoerk, 'start');
const hulveneMund = munding('M395 264 V222', 42, BLAA) + munding('M360 470 V556', 40, BLAA);

// Lungevenerne: to fra venstre lunge; dem fra højre lunge går bag hjertet og ses ikke.
const lvOver = 'M772 276 C746 276 726 280 700 285';
const lvUnder = 'M772 330 C746 330 726 322 702 313';
const lungevener = kar([[lvOver, 22], [lvUnder, 22]], ROED) + ende(772, 276, 22, 180, ROED) + ende(772, 330, 22, 180, ROED)
  + stroemPil(738, 277, 180) + stroemPil(738, 328, 176)
  + lille(726, 366, 'fra lungen', F.iltrigMoerk, 'start');
const lungeveneMund = munding('M680 288 L714 284', 22, ROED) + munding('M680 309 L720 315', 22, ROED);

// ── Klapperne ───────────────────────────────────────────────
const sejl = (x, y, v) => `<path d="M${x} ${y} q${v * 6} 22 ${v * 2} 46 q${v * 8} -4 ${v * 18} -34 q${-v * 4} -8 ${-v * 20} -12Z"
  fill="${F.klap}" stroke="${F.klapKant}" stroke-width="2" stroke-linejoin="round"/>`;
const sejlklapper = sejl(408, 452, 1) + sejl(454, 446, -1) + sejl(607, 364, 1) + sejl(655, 364, -1);
// papillærmusklerne vokser op fra kammerets bund; foden går i ét med væggen
const papil = (x, y) => `<path d="M${x - 17} ${y + 44} Q${x - 12} ${y + 2} ${x} ${y - 16} Q${x + 12} ${y + 2} ${x + 17} ${y + 44}Z" fill="url(#hj-muskel-u)"/>
  <path d="M${x - 17} ${y + 44} Q${x - 12} ${y + 2} ${x} ${y - 16} Q${x + 12} ${y + 2} ${x + 17} ${y + 44}" fill="none" stroke="${F.muskelMoerk}" stroke-width="2"/>`;
const traadSti = [[[410, 498], [418, 490]], [450, 542], [[452, 492], [444, 484]], [490, 554],
  [[609, 410], [618, 402]], [600, 556], [[653, 410], [644, 402]], [648, 532]];
let traadD = '';
for (let i = 0; i < traadSti.length; i += 2) for (const [x, y] of traadSti[i]) traadD += `M${x} ${y} L${traadSti[i + 1][0]} ${traadSti[i + 1][1]} `;
const senetraade = `<g clip-path="url(#hj-k-h)">${papil(450, 556) + papil(490, 568)}</g>`
  + `<g clip-path="url(#hj-k-v)">${papil(600, 570) + papil(648, 546)}</g>`
  + `<path d="${traadD}" stroke="#FBF3DC" stroke-width="2.4" stroke-linecap="round" fill="none"/>
     <path d="${traadD}" stroke="${F.klapKant}" stroke-width=".8" stroke-linecap="round" fill="none"/>`;
// lommeklapperne: tre små lommer ved udgangen til lungearterien og aorta (to ses)
const lomme = (x, y) => `<path transform="translate(${x} ${y})" d="M-20 0 Q-10 -15 0 -2 Q10 -15 20 0 Q10 6 0 4 Q-10 6 -20 0Z"
  fill="${F.klap}" stroke="${F.klapKant}" stroke-width="2" stroke-linejoin="round"/>`;
const lommeklapper = lomme(494, 276) + lomme(551, 348);

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
  // Rækkefølgen er dybden: karrene bag hjertet først, så væggen, hulrummene, mundingerne og klapperne.
  dele: [
    { ord: 'lungearterie', svg: lungearterieBag },
    { ord: 'aorta', svg: aorta },
    { ord: 'hulvener', svg: hulvener },
    { ord: 'lungevener', svg: lungevener },
    { ord: 'lungearterie', svg: lungearterieForan },
    { ord: null, svg: defs + klip + `<path d="${omrids}" fill="url(#hj-muskel-u)" stroke="${F.muskelMoerk}" stroke-width="3"/>` },
    { ord: 'skillevaeg', svg: skillevaeg },
    { ord: 'hoejreForkammer', svg: hulrum(hoejre, 'h', 'hfk', BLAA) + ring('M403 455 L464 445', BLAA) + stroemPil(412, 330, 90, F.iltfattigLys) },
    { ord: 'hoejreKammer', svg: hulrum(hoejre, 'h', 'hk', BLAA) + stroemPil(497, 380, -90, F.iltfattigLys) },
    { ord: 'venstreForkammer', svg: hulrum(venstre, 'v', 'vfk', ROED) + ring('M603 368 L662 368', ROED) + stroemPil(640, 330, 95, F.iltrigLys) },
    { ord: 'venstreKammer', svg: hulrum(venstre, 'v', 'vk', ROED) + stroemPil(554, 420, -98, F.iltrigLys) },
    { ord: 'hulvener', svg: hulveneMund },
    { ord: 'lungearterie', svg: lungearterieMund },
    { ord: 'aorta', svg: aortaMund },
    { ord: 'lungevener', svg: lungeveneMund },
    { ord: 'senetraade', svg: senetraade },
    { ord: 'sejlklapper', svg: sejlklapper },
    { ord: 'lommeklapper', svg: lommeklapper },
  ],
  pladser: [
    // venstre kolonne
    { ord: 'hulvener', x: 125, y: 60, maal: [395, 76],
      omr: `<path d="M395 24 V250 M360 680 V540" fill="none" stroke-width="62"/>`,
      fejl: { aorta: 'Aorta udgår fra venstre hjertekammer. De her kar er blå og fører blodet fra kroppen ind i hjertet.',
              lungevener: 'Lungevenerne kommer fra lungerne. De her kar kommer oppe- og nedefra, altså fra kroppen.' } },
    { ord: 'lungearterie', x: 125, y: 162, maal: [300, 192],
      omr: `<path d="${laTrunk} ${laVenstreGren} ${laHoejreGren}" fill="none" stroke-width="50"/>`,
      fejl: { lungevener: 'Følg pilene: blodet i det her kar løber væk fra hjertet, ud mod lungen.',
              aorta: 'Aorta er rød og går til kroppen. Det her blå kar kommer fra højre hjertekammer.' } },
    { ord: 'hoejreForkammer', x: 125, y: 270, maal: [376, 300],
      omr: `<path d="${hoejre}" clip-path="url(#hj-k-hfk)"/>`,
      fejl: { venstreForkammer: 'Husk, at hjertet ses forfra: hjertets højre side står til venstre i billedet.',
              hoejreKammer: 'Kamrene er de store rum forneden. Her er det rummet øverst, som hulvenerne munder ud i.' } },
    { ord: 'lommeklapper', x: 125, y: 380, maal: [480, 278],
      omr: `<circle cx="494" cy="274" r="26"/><circle cx="551" cy="346" r="26"/>`,
      fejl: { sejlklapper: 'Sejlklapperne sidder mellem forkammer og kammer. Pladsen peger på udgangen fra kammeret til en arterie.' } },
    { ord: 'hoejreKammer', x: 125, y: 490, maal: [470, 530],
      omr: `<path d="${hoejre}" clip-path="url(#hj-k-hk)"/>`,
      fejl: { venstreKammer: 'Hjertet ses forfra, så højre side står til venstre. Se også væggen: den her er tynd.',
              hoejreForkammer: 'Forkamrene ligger øverst. Det her rum ligger nederst og pumper blodet ud i lungearterien.' } },
    { ord: 'skillevaeg', x: 125, y: 600, maal: [536, 540],
      omr: `<path d="${skillevaegSti}"/>`,
      fejl: { venstreKammer: 'Pladsen peger på muskelvæggen mellem de to kamre, ikke på hulrummet.' } },
    // højre kolonne
    { ord: 'aorta', x: 875, y: 60, maal: [640, 76],
      omr: `<path d="${aortaSti}" fill="none" stroke-width="62"/>`,
      fejl: { lungearterie: 'Karret er rødt og udgår fra venstre hjertekammer. Det fører iltrigt blod ud til hele kroppen.',
              hulvener: 'Følg pilene: blodet løber væk fra hjertet. Venerne fører blod ind i hjertet.' } },
    { ord: 'venstreForkammer', x: 875, y: 196, maal: [664, 280],
      omr: `<path d="${venstre}" clip-path="url(#hj-k-vfk)"/>`,
      fejl: { hoejreForkammer: 'Husk, at hjertet ses forfra: hjertets venstre side står til højre i billedet.',
              venstreKammer: 'Kamrene er de store rum forneden. Det her rum modtager blodet fra lungevenerne.' } },
    { ord: 'lungevener', x: 875, y: 300, maal: [756, 302],
      omr: `<path d="${lvOver} ${lvUnder}" fill="none" stroke-width="40"/>`,
      fejl: { lungearterie: 'Karrene er røde og fører blodet ind i hjertet. Iltrigt blod kommer tilbage fra lungerne.',
              hulvener: 'Hulvenerne munder ud i højre forkammer. De her kar fører iltrigt blod ind i venstre forkammer.' } },
    { ord: 'sejlklapper', x: 875, y: 400, maal: [660, 390],
      omr: `<rect x="398" y="438" width="70" height="64" rx="16"/><rect x="598" y="358" width="66" height="60" rx="16"/>`,
      fejl: { lommeklapper: 'Lommeklapperne sidder ved udgangen til arterierne. Her sidder klappen mellem forkammer og kammer.',
              senetraade: 'Senetrådene er de tynde snore. Pladsen peger på de flige, de holder fast i.' } },
    { ord: 'senetraade', x: 875, y: 498, maal: [650, 480],
      omr: `<rect x="404" y="482" width="100" height="92" rx="20"/><rect x="590" y="404" width="68" height="168" rx="20"/>`,
      fejl: { sejlklapper: 'Klapperne er de lyse flige foroven. Pladsen peger på de tynde snore, der holder dem.',
              skillevaeg: 'Skillevæggen er den stribede muskel mellem kamrene. Pladsen peger på de tynde snore inde i kammeret.' } },
    { ord: 'venstreKammer', x: 875, y: 600, maal: [630, 560],
      omr: `<path d="${venstre}" clip-path="url(#hj-k-vk)"/>`,
      fejl: { hoejreKammer: 'Hjertet ses forfra, så venstre side står til højre. Se også muskelvæggen: den her er tykkest.',
              venstreForkammer: 'Forkamrene ligger øverst. Det her rum ligger nederst og pumper blodet ud i aorta.' } },
  ],
};
