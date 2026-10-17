// Fem korte trin. Forkortet fra elevteksten i CIRKULATION-MODEL.md, afsnit 2
// (ejerens ønske 17. oktober 2026: kortere og enklere, færre trin).
// fokus: hvor globussen drejer hen; saet: tilstand, trinet sætter.
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
  },
  {
    titel: 'Jorden drejer – vinden bøjer af',
    tekst: 'Corioliseffekten bøjer vinden til højre på den nordlige halvkugle og til venstre på den sydlige. Derfor kommer passaten fra nordøst og sydøst.',
    proev: 'Slå «Jorden drejer» fra og til igen.',
    fokus: [-35, 5], fremhaev: 'coriolis',
  },
  {
    titel: 'Tre celler på hver halvkugle',
    tekst: 'Hadley-, Ferrel- og polarcellen. Ferrelcellen giver vestenvind mellem 30° og 60° – og Danmark skiftende vejr.',
    proev: 'Find vestenvinden over Danmark.',
    fokus: [10, 42], fremhaev: 'tre', saet: { rotation: 1 },
  },
  {
    titel: 'ITK følger solen – monsun',
    tekst: 'ITK flytter sig mod sommerhalvkuglen, mest over land. Over Indien vender vinden: fugtig sydvestmonsun om sommeren, tør nordøstmonsun om vinteren.',
    proev: 'Afspil året, og hold øje med Indien.',
    fokus: [75, 12], fremhaev: 'monsun', saet: { kontinenter: 1, rotation: 1, maaned: 7 },
  },
];
