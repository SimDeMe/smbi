// Fem korte trin. Forkortet fra elevteksten i CIRKULATION-MODEL.md, afsnit 2
// (ejerens ønske 17. oktober 2026: kortere og enklere, færre trin).
// fokus: hvor globussen drejer hen; saet: tilstand, trinet sætter.
// koreografi: hvad der tegnes frem hvornår (sekunder), når man går ét trin
// frem — i den rækkefølge, det sker. Se koreografi.js.
export const TRIN = [
  {
    titel: 'Solen varmer ækvator',
    tekst: 'Ved ækvator stiger varm, fugtig luft op. Den køles af, og der dannes tordenskyer og regn. Ved jorden bliver der lavtryk – ITK.',
    proev: 'Træk i måneden, og se solen og ITK flytte sig.',
    fokus: [-20, 5], fremhaev: 'itk',
  },
  {
    titel: 'Luften synker ved 30°',
    tekst: 'Højt oppe strømmer luften mod nord og syd og synker ved ca. 30°. Synkende luft er tør: højtryk og ørken. Ved jorden løber den tilbage mod ITK. Ringen hedder Hadleycellen.',
    proev: 'Følg Hadleycellen i snittet.',
    fokus: [20, 20], fremhaev: 'hadley',
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
    tekst: 'Corioliseffekten bøjer vinden til højre på den nordlige halvkugle og til venstre på den sydlige. Derfor kommer passaten fra nordøst og sydøst.',
    proev: 'Slå «Jorden drejer» fra og til igen.',
    fokus: [-35, 5], fremhaev: 'coriolis',
    // Først en Jord, der står stille (vinden går lige mod ITK), så drejer den,
    // og vinden bøjer af. Navnene kommer, når passaten har fået sin retning.
    // Roligt tempo: der skal være tid til at læse trinteksten og se billedet.
    // Koreografien venter, til globussen har drejet på plads, Jorden står
    // stille i ca. 3 s, og drejningen tager ca. 4 s (simulationsdesign.md:
    // synkronisér, undgå samtidige bevægelser, elevstyret tempo).
    koreografi: [
      { el: 'stille', fra: 1.2, til: 2.6 },
      { el: 'drej', fra: 5.6, til: 9.6 },
      { el: 'navn-passat', fra: 9.4, til: 10.2 },
    ],
  },
  {
    titel: 'Tre celler på hver halvkugle',
    tekst: 'Hadley-, Ferrel- og polarcellen. Ferrelcellen giver vestenvind mellem 30° og 60° – og Danmark skiftende vejr.',
    proev: 'Find vestenvinden over Danmark.',
    fokus: [10, 42], fremhaev: 'tre', saet: { rotation: 1 },
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
    titel: 'ITK følger solen – monsun',
    tekst: 'ITK flytter sig mod sommerhalvkuglen, mest over land. Over Indien vender vinden: fugtig sydvestmonsun om sommeren, tør nordøstmonsun om vinteren.',
    proev: 'Afspil året, og hold øje med Indien.',
    fokus: [75, 12], fremhaev: 'monsun', saet: { kontinenter: 1, rotation: 1, maaned: 7 },
    // Solen flytter sig først; ITK og vinden følger efter og vender over Indien.
    koreografi: [
      { el: 'sol', fra: 0.1, til: 1.7 },
      { el: 'maaned', fra: 0.9, til: 3.5 },
      { el: 'navn-monsun', fra: 3.2, til: 3.8 },
    ],
  },
];
