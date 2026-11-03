// Seks korte trin. Forkortet fra elevteksten i CIRKULATION-MODEL.md, afsnit 2.
// Ejerens ønske 3. november 2026: byg op ét fænomen ad gangen. Trin 1–4
// står ved jævndøgn uden kontinenter, så ITK ligger midt over ækvator og
// cellerne er symmetriske; først derefter flytter ITK sig med solen (trin 5),
// og til sidst trækker kontinenterne ITK ind over land (trin 6).
// fokus: hvor globussen drejer hen; saet: tilstand, trinet sætter.
// koreografi: hvad der tegnes frem hvornår (sekunder), når man går ét trin
// frem — i den rækkefølge, det sker. Se koreografi.js.

// Forårsjævndøgn: solen står lodret over ækvator (model.js: solbredde = 0).
export const JAEVNDOEGN = 3.7;
const ROLIG = { rotation: 1, kontinenter: 0, maaned: JAEVNDOEGN };

export const TRIN = [
  {
    titel: 'Solen varmer ækvator',
    tekst: 'Ved ækvator stiger varm, fugtig luft op. Den køles af, og der dannes tordenskyer og regn. Ved jorden bliver der lavtryk – ITK.',
    proev: 'Find ITK på globussen og tordenskyen i snittet.',
    fokus: [-20, 5], fremhaev: 'itk', saet: ROLIG,
  },
  {
    titel: 'Luften synker ved 30°',
    tekst: 'Højt oppe strømmer luften mod nord og syd og synker ved ca. 30°. Synkende luft er tør: højtryk og ørken. Ved jorden løber den tilbage mod ITK. Ringen hedder Hadleycellen.',
    proev: 'Følg Hadleycellen i snittet.',
    fokus: [20, 20], fremhaev: 'hadley', saet: ROLIG,
    // Luften stiger ved ITK, strømmer ud i højden og synker ved 30° – først da
    // bliver der højtryk, og først med højtrykket kommer ørkenen.
    koreografi: [
      { el: 'hadleyspor', fra: 0.2, til: 2.6 },
      { el: 'hoejtryk', fra: 2.1, til: 2.8 },
      { el: 'oerken', fra: 2.5, til: 3.3 },
    ],
  },
  {
    titel: 'Jorden drejer – vinden bøjer af',
    tekst: 'Vinden ved jorden løber mod ITK. Fordi Jorden drejer, bøjer Corioliseffekten den til højre på den nordlige halvkugle og til venstre på den sydlige. Derfor kommer passaten fra nordøst og sydøst.',
    proev: 'Peg på passaten nord og syd for ITK: hvorfra kommer vinden?',
    fokus: [-35, 5], fremhaev: 'coriolis', saet: ROLIG,
    // Kun afbøjningen ændrer sig; cellerne står fast. Først rettes vinden ud,
    // så den går lige mod ITK, så bøjes den af. To store pile viser retningen;
    // passatens navne kommer først, når pilene er væk, så de ikke dækker dem.
    // Roligt tempo, så der er tid til at læse og se (simulationsdesign.md:
    // synkronisér, undgå samtidige bevægelser, elevstyret tempo).
    koreografi: [
      { el: 'lige', fra: 1.2, til: 2.6 },
      { el: 'boej', fra: 5.4, til: 9.4 },
      { el: 'pile-ud', fra: 11.5, til: 12.4 },
      { el: 'navn-passat', fra: 12.2, til: 12.9 },
    ],
  },
  {
    titel: 'Tre celler på hver halvkugle',
    tekst: 'Hadley-, Ferrel- og polarcellen. Ferrelcellen giver vestenvind mellem 30° og 60° – og Danmark skiftende vejr.',
    proev: 'Find vestenvinden over Danmark.',
    fokus: [10, 42], fremhaev: 'tre', saet: ROLIG,
    // Cellerne bygges ud fra ækvator: Hadley driver Ferrel, og polarfronten
    // opstår, hvor Ferrel- og polarcellen mødes. Vestenvinden til sidst.
    koreografi: [
      { el: 'celle-Hadley', fra: 0.1, til: 0.9 },
      { el: 'navn-passat', fra: 0.6, til: 1.1 },
      { el: 'celle-Ferrel', fra: 0.9, til: 1.7 },
      { el: 'celle-Polar', fra: 1.6, til: 2.4 },
      { el: 'front', fra: 2.2, til: 2.8 },
      { el: 'navn-polar', fra: 2.3, til: 2.8 },
      { el: 'navn-vest', fra: 2.6, til: 3.2 },
    ],
  },
  {
    titel: 'ITK følger solen',
    tekst: 'Ved jævndøgn står solen lodret over ækvator, i juni over Krebsens vendekreds. ITK følger efter mod sommerhalvkuglen med omkring en måneds forsinkelse, og højtrykkene og vestenvindsbæltet flytter sig med.',
    proev: 'Afspil året, og se ITK og bælterne flytte sig med solen.',
    fokus: [0, 12], fremhaev: 'itk', saet: { rotation: 1, kontinenter: 0, maaned: 7 },
    // Solen flytter sig først; ITK og bælterne følger efter.
    koreografi: [
      { el: 'sol', fra: 0.6, til: 2.6 },
      { el: 'maaned', fra: 1.8, til: 5 },
    ],
  },
  {
    titel: 'Kontinenterne – monsun',
    tekst: 'Land bliver varmere end hav om sommeren. Derfor trækkes ITK langt ind over land – over Indien op til ca. 25° N i juli. Sydøstpassaten krydser ækvator og bøjes til fugtig sydvestmonsun. Om vinteren vender vinden: tør nordøstmonsun.',
    proev: 'Slå «Kontinenter» fra og til, eller afspil året, og hold øje med Indien.',
    fokus: [75, 12], fremhaev: 'monsun', saet: { rotation: 1, kontinenter: 1, maaned: 7 },
    // Kontinenterne tones ind: ITK trækkes ind over Indien, og først derefter
    // får monsunen sit navn.
    koreografi: [
      { el: 'kontinenter', fra: 1, til: 4 },
      { el: 'navn-monsun', fra: 3.8, til: 4.5 },
    ],
  },
];
