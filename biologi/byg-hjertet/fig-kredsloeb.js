// Det dobbelte kredsløb som skema: lungerne foroven, kroppens væv forneden og
// hjertet i midten. Blodet passerer hjertet to gange på én tur rundt.
import { glat, boelge } from '../../byg-motor/tegn.js';
import { F, defs, vene, arterie, stroemPil, navn, lille } from './tegning.js';

// ── Karrenes midterlinjer ───────────────────────────────────
const lungearterieSti = 'M466 404 Q500 404 500 370 V196 Q500 176 480 176 H398 Q378 176 378 156 V100 H396';
const lungevenerSti = 'M604 100 H616 Q636 100 636 120 V270 Q636 290 616 290 H590';
const aortaSti = 'M582 404 H716 Q740 404 740 428 V572 Q740 594 718 594 H652';
const veneSti = 'M348 594 H282 Q260 594 260 572 V312 Q260 290 282 290 H410';

// ── Kapillærnettene: blodet skifter farve undervejs ────────
const kapillaerer = (x1, x2, ys, gradient) => ys.map((y, i) =>
  `<path d="${boelge(x1, y, x2, y + (i % 2 ? 4 : -4), 6, 3 + (i % 2))}" fill="none" stroke="${F.blaek}" stroke-width="7.5" stroke-linecap="round"/>
   <path d="${boelge(x1, y, x2, y + (i % 2 ? 4 : -4), 6, 3 + (i % 2))}" fill="none" stroke="url(#${gradient})" stroke-width="4.5" stroke-linecap="round"/>`).join('');
const samler = (x, y1, y2, farve, kant) =>
  `<path d="M${x} ${y1} V${y2}" stroke="${kant}" stroke-width="16" stroke-linecap="round"/><path d="M${x} ${y1} V${y2}" stroke="${farve}" stroke-width="10" stroke-linecap="round"/>`;

const lungeVaev = glat([[372, 40], [430, 22], [500, 28], [570, 22], [628, 40], [646, 92], [630, 150], [560, 164],
  [500, 158], [440, 164], [370, 150], [354, 92]]);
const kropsVaev = 'M336 530 H664 Q680 530 680 546 V650 Q680 666 664 666 H336 Q320 666 320 650 V546 Q320 530 336 530Z';
const lungeNet = samler(396, 72, 128, F.iltfattig, F.iltfattigMoerk) + samler(604, 72, 128, F.iltrig, F.iltrigMoerk)
  + kapillaerer(396, 604, [76, 92, 108, 124], 'kr-lunge');
const kropsNet = samler(652, 556, 616, F.iltrig, F.iltrigMoerk) + samler(348, 556, 616, F.iltfattig, F.iltfattigMoerk)
  + kapillaerer(348, 652, [560, 576, 594, 612], 'kr-krop');

// ── Hjertet som fire rum ────────────────────────────────────
const rum = (x, y, farve) => `<rect x="${x}" y="${y}" width="78" height="${y < 340 ? 76 : 92}" rx="18" fill="url(#${farve})"/>`;
const hjertet = `<path d="${glat([[400, 238], [500, 246], [600, 238], [616, 300], [612, 400], [580, 448], [500, 470], [420, 448], [388, 400], [384, 300]])}"
    fill="url(#hj-muskel)" stroke="${F.muskelMoerk}" stroke-width="3"/>`
  + rum(402, 252, 'hj-fattig') + rum(520, 252, 'hj-rig') + rum(402, 342, 'hj-fattig') + rum(520, 342, 'hj-rig')
  + `<path d="M500 250 V462" stroke="${F.muskelMoerk}" stroke-width="3" stroke-dasharray="2 5" opacity=".6"/>`;

const ekstraDefs = `<defs>
  <linearGradient id="kr-lunge" x1="396" x2="604" gradientUnits="userSpaceOnUse"><stop offset=".1" stop-color="${F.iltfattig}"/><stop offset=".9" stop-color="${F.iltrig}"/></linearGradient>
  <linearGradient id="kr-krop" x1="652" x2="348" gradientUnits="userSpaceOnUse"><stop offset=".1" stop-color="${F.iltrig}"/><stop offset=".9" stop-color="${F.iltfattig}"/></linearGradient>
</defs>`;

const lungekredsloeb = vene(lungearterieSti, 24) + arterie(lungevenerSti, 24)
  + `<path d="${lungeVaev}" fill="#F7D3D3" stroke="#B5707A" stroke-width="2.5"/>` + lungeNet
  + navn(500, 54, 'Lungerne', 19) + lille(500, 148, 'O₂ optages · CO₂ afgives', '#7A3B47')
  + stroemPil(500, 300, -90) + stroemPil(440, 176, 180) + stroemPil(636, 200, 90) + stroemPil(612, 290, 180);
const storeKredsloeb = arterie(aortaSti, 26) + vene(veneSti, 26)
  + `<path d="${kropsVaev}" fill="#F5E2C8" stroke="#A88660" stroke-width="2.5"/>` + kropsNet
  + navn(500, 642, 'Kroppens væv', 19) + lille(500, 659, 'O₂ afgives · CO₂ optages', '#6B5132')
  + stroemPil(660, 404, 0) + stroemPil(740, 500, 90) + stroemPil(260, 470, -90) + stroemPil(360, 290, 0);

// ── Sidste lag: træk et blodlegeme hele vejen rundt ────────
// Iltmætningen er typiske hvileværdier: ca. 75 % i iltfattigt og ca. 98 % i iltrigt blod.
const skillevaegFejl = 'Skillevæggen holder hjertets to sider adskilt. Der er ingen åbning, så iltfattigt og iltrigt blod blandes ikke.';
const rejse = {
  opgave: 'Træk blodlegemet med musen eller fingeren hele vejen rundt i den rigtige retning. Eller vælg vejen her:',
  start: 'krop', slut: 'rundt', ilt: 75,
  knuder: {
    krop: { x: 348, y: 594, navn: 'kroppens væv', tekst: 'Blodlegemet har afleveret ilt i kroppens væv. Træk det hjem mod hjertet.' },
    hfk: { x: 441, y: 290, navn: 'højre forkammer', tekst: 'Højre forkammer: blodet fra kroppen samles her.' },
    hk: { x: 441, y: 392, navn: 'højre hjertekammer', tekst: 'Højre hjertekammer: herfra pumpes blodet ud i lungekredsløbet.' },
    lungeInd: { x: 396, y: 100, navn: 'lungerne', tekst: 'Lungerne: træk blodlegemet gennem kapillærerne og se, hvad der sker med ilten.' },
    lungeUd: { x: 604, y: 100, navn: 'lungerne', tekst: 'Blodlegemet har afgivet CO₂ og optaget O₂. Nu er det iltrigt og på vej tilbage til hjertet.' },
    vfk: { x: 559, y: 290, navn: 'venstre forkammer', tekst: 'Venstre forkammer: det iltrige blod fra lungerne kommer ind her.' },
    vk: { x: 559, y: 392, navn: 'venstre hjertekammer', tekst: 'Venstre hjertekammer: den tykkeste væg, for herfra pumpes blodet ud i hele kroppen.' },
    kropInd: { x: 652, y: 594, navn: 'kroppens væv', tekst: 'Kroppens væv: træk blodlegemet gennem kapillærerne og se, hvad der sker med ilten.' },
    rundt: { x: 348, y: 594, navn: 'kroppens væv', tekst: 'Blodlegemet har afleveret ilt til vævet og er tilbage, hvor det startede.' },
  },
  veje: [
    { fra: 'krop', sti: 'M348 594 H440', valg: 'tilbage ind i kapillærerne',
      fejl: 'Blodet i kapillærerne strømmer hele tiden fra arterierne mod venerne. Det løber ikke tilbage.' },
    { fra: 'krop', til: 'hfk', sti: veneSti + ' H441', valg: 'op gennem venen til hjertet',
      baglaens: { valg: 'tilbage ned i venen', fejl: 'Venerne fører blodet mod hjertet. Klapper i venerne og trykket bagfra holder retningen.' } },
    { fra: 'hfk', sti: 'M441 290 H540', valg: 'over i venstre forkammer', fejl: skillevaegFejl },
    { fra: 'hfk', til: 'hk', sti: 'M441 290 V392', valg: 'ned i højre hjertekammer',
      baglaens: { valg: 'tilbage op i højre forkammer', fejl: 'Klappen mellem forkammer og kammer lukker, når kammeret trækker sig sammen. Blodet kan ikke løbe tilbage.' } },
    { fra: 'hk', sti: 'M441 392 L540 404', valg: 'over i venstre hjertekammer', fejl: skillevaegFejl },
    { fra: 'hk', til: 'lungeInd', sti: 'M441 392 Q441 404 466 404 ' + lungearterieSti.slice('M466 404 '.length), valg: 'ud i lungearterien',
      baglaens: { valg: 'tilbage ned gennem lungearterien', fejl: 'Højre kammer skubber blodet ud mod lungerne, og klappen ved kammerets udgang lukker, så blodet ikke løber tilbage.' } },
    { fra: 'lungeInd', til: 'lungeUd', sti: 'M396 100 C440 86 460 114 500 100 S560 86 604 100', valg: 'gennem kapillærerne i lungerne',
      ilt: [75, 98], side: -1,
      baglaens: { valg: 'tilbage gennem kapillærerne', fejl: 'Blodet strømmer hele tiden videre fra arterien mod venerne, skubbet af hjertets pumpe.' } },
    { fra: 'lungeUd', til: 'vfk', sti: lungevenerSti.replace(/H590$/, 'H559'), valg: 'ned gennem lungevenerne',
      baglaens: { valg: 'tilbage op i lungevenerne', fejl: 'Lungevenerne fører blodet mod hjertet. Forkammeret fyldes fra venerne, og blodet løber videre ned i kammeret.' } },
    { fra: 'vfk', sti: 'M559 290 H460', valg: 'over i højre forkammer', fejl: skillevaegFejl },
    { fra: 'vfk', til: 'vk', sti: 'M559 290 V392', valg: 'ned i venstre hjertekammer',
      baglaens: { valg: 'tilbage op i venstre forkammer', fejl: 'Klappen mellem forkammer og kammer lukker, når kammeret trækker sig sammen. Blodet kan ikke løbe tilbage.' } },
    { fra: 'vk', sti: 'M559 392 L460 404', valg: 'over i højre hjertekammer', fejl: skillevaegFejl },
    { fra: 'vk', til: 'kropInd', sti: 'M559 392 Q559 404 582 404 ' + aortaSti.slice('M582 404 '.length), valg: 'ud i aorta',
      baglaens: { valg: 'tilbage op gennem aorta', fejl: 'Venstre kammer skubber blodet ud i kroppen, og klappen ved kammerets udgang lukker, så blodet ikke løber tilbage.' } },
    { fra: 'kropInd', til: 'rundt', sti: 'M652 594 C610 580 580 608 540 594 S460 580 420 594 S370 606 348 594', valg: 'gennem kapillærerne i kroppen',
      ilt: [98, 75], side: 1 },
  ],
  opsummering: 'Blodlegemet kom gennem hjertet to gange på én tur: højre side sendte det til lungerne, venstre side ud i kroppen. Iltmætningen steg fra ca. 75 % til ca. 98 % i lungerne og faldt igen i kroppens væv (tal i hvile).',
};

export default {
  id: 'kredsloeb',
  navn: 'Det dobbelte kredsløb',
  intro: 'Følg blodet en tur rundt. Det kommer gennem hjertet to gange: én gang på vej til lungerne og én gang på vej ud i kroppen.',
  vb: [1000, 680],
  boks: [206, 42],
  mobilBredde: 720,
  lag: [
    { navn: 'To kredsløb', ord: ['lungekredsloeb', 'storeKredsloeb'] },
    { navn: 'Tre slags kar', ord: ['arterie', 'kapillaernet', 'vene'], ekstra: ['lymfekar'],
      ekstraFejl: { lymfekar: 'Lymfekarrene er ikke tegnet. De fører vævsvæske, ikke blod, og de går kun én vej: tilbage mod hjertet.' } },
    { navn: 'Hvor er ilten?', ord: ['iltfattigt', 'iltrigt'] },
    { navn: 'Følg et blodlegeme', ord: [], rejse },
  ],
  dele: [
    { ord: null, svg: defs + ekstraDefs + hjertet + navn(500, 498, 'Hjertet', 19)
      + lille(441, 518, 'højre side', F.iltfattigMoerk) + lille(559, 518, 'venstre side', F.iltrigMoerk) },
    { ord: 'lungekredsloeb', svg: lungekredsloeb },
    { ord: 'storeKredsloeb', svg: storeKredsloeb },
    // Lag 2 og 3 tegner ikke nyt: de farver en del af det, der allerede står.
    { ord: 'arterie', svg: arterie('M716 404 Q740 404 740 428 V560', 26) + stroemPil(740, 500, 90) },
    { ord: 'vene', svg: vene('M260 560 V312 Q260 290 282 290', 26) + stroemPil(260, 470, -90) },
    { ord: 'kapillaernet', svg: kropsNet },
    { ord: 'iltfattigt', svg: vene('M378 100 V156 Q378 176 398 176 H470', 24) },
    { ord: 'iltrigt', svg: arterie('M636 120 V270', 24) + stroemPil(636, 200, 90) },
  ],
  pladser: [
    { ord: 'lungekredsloeb', x: 125, y: 60, maal: [362, 70],
      omr: `<path d="${lungearterieSti} M396 100 H604 ${lungevenerSti}" fill="none" stroke-width="44"/><path d="${lungeVaev}"/>`,
      fejl: { storeKredsloeb: 'Den her sløjfe går kun fra hjertet op til lungerne og tilbage igen. Den anden går ud i hele kroppen.' } },
    { ord: 'iltfattigt', x: 125, y: 166, maal: [378, 132],
      omr: `<path d="M378 100 V156 Q378 176 398 176 H480 Q500 176 500 196 V370 Q500 404 466 404" fill="none" stroke-width="40"/>`,
      fejl: { iltrigt: 'Arterier fører blod væk fra hjertet, men ikke altid med meget ilt. Det her blod kommer fra kroppen og har ikke været i lungerne endnu.' } },
    { ord: 'vene', x: 125, y: 430, maal: [260, 430],
      omr: `<path d="${veneSti}" fill="none" stroke-width="44"/>`,
      fejl: { arterie: 'Følg pilen: blodet i det her kar løber ind mod hjertet.',
              kapillaernet: 'Kapillærerne er de tynde, snoede kar i vævet. Det her er et stort kar på vej tilbage til hjertet.' } },
    { ord: 'storeKredsloeb', x: 125, y: 600, maal: [330, 648],
      omr: `<path d="${aortaSti} M652 594 H348 ${veneSti}" fill="none" stroke-width="44"/><path d="${kropsVaev}"/>`,
      fejl: { lungekredsloeb: 'Den her sløjfe går ud til kroppens væv og tilbage. Lungerne ligger i den anden.' } },
    { ord: 'iltrigt', x: 875, y: 196, maal: [636, 230],
      omr: `<path d="${lungevenerSti}" fill="none" stroke-width="40"/>`,
      fejl: { iltfattigt: 'Blodet her kommer lige fra lungerne. Det er vener, fordi blodet løber mod hjertet, men blodet har netop fået ilt.' } },
    { ord: 'arterie', x: 875, y: 470, maal: [740, 470],
      omr: `<path d="${aortaSti}" fill="none" stroke-width="44"/>`,
      fejl: { vene: 'Følg pilen: blodet løber væk fra hjertet og ud mod kroppens væv.',
              kapillaernet: 'Kapillærerne er de tynde, snoede kar i vævet. Det her er et stort kar, der kommer direkte fra hjertet.' } },
    { ord: 'kapillaernet', x: 875, y: 636, maal: [600, 594],
      omr: `<rect x="340" y="548" width="320" height="76" rx="14"/>`,
      fejl: { vene: 'Pladsen peger på de tynde, snoede kar inde i vævet, hvor blodet skifter farve.',
              arterie: 'Pladsen peger på de tynde, snoede kar inde i vævet, hvor blodet skifter farve.' } },
  ],
};
