// Elevteksten fra CIRKULATION-MODEL.md, afsnit 2 (godkendt 15. oktober 2026).
// fokus: hvor globussen drejer hen; saet: tilstand, trinet sætter.
export const TRIN = [
  {
    titel: 'Solen varmer ækvator mest',
    tekst: 'Ved ækvator står solen højt hele året, så hver kvadratmeter får meget energi. Mod polerne rammer strålerne skråt og fordeles på et større areal. Luften ved ækvator bliver derfor varmest.',
    se: 'solen, der lyser lige ned nær ækvator, og hvordan den flytter sig, når du skubber til måneden.',
    fokus: [-20, 5], fremhaev: 'sol',
  },
  {
    titel: 'Varm luft stiger – ITK',
    tekst: 'Den varme, fugtige luft stiger op. Når den stiger, udvider den sig og køles af, og vanddampen bliver til skyer og kraftig regn. Ved jorden efterlades et bælte med lavt tryk. Det kaldes ITK, den intertropiske konvergenszone: stedet, hvor vindene fra nord og syd mødes (konvergerer).',
    se: 'det hvide bælte af høje tordenskyer rundt om Jorden og det grønne regnbælte på land.',
    fokus: [15, 5], fremhaev: 'itk',
  },
  {
    titel: 'Luften synker ved 30° – Hadleycellen',
    tekst: 'Højt oppe, ved tropopausen (toppen af den del af atmosfæren, hvor vejret foregår), strømmer luften mod nord og syd. Omkring 30° synker den. Synkende luft opvarmes og bliver tør, så der dannes et højtryksbælte med klart vejr. Her ligger Sahara, Den Arabiske Halvø og Australiens ørken. Ved jorden strømmer luften tilbage mod ITK. Den lukkede ring kaldes Hadleycellen.',
    se: 'luftringen i snittet og ørkenbæltet ved 30°.',
    fokus: [20, 20], fremhaev: 'hadley',
  },
  {
    titel: 'Jorden drejer – Corioliseffekten',
    tekst: 'Jorden drejer mod øst. Set fra jorden ser det ud, som om alt, der bevæger sig over lange afstande, bliver bøjet af: til højre på den nordlige halvkugle og til venstre på den sydlige. Det kaldes Corioliseffekten. Den er nul ved ækvator og størst ved polerne. Derfor blæser passaten ikke lige mod ækvator, men fra nordøst (nordøstpassaten) og fra sydøst (sydøstpassaten).',
    se: 'tryk på «Stop Jorden» og igen på «Drej Jorden», og se vinden bøje af. Slip en ballon begge gange.',
    fokus: [-35, 5], fremhaev: 'coriolis',
  },
  {
    titel: 'Tre celler – vestenvind og polarfront',
    tekst: 'Mellem 30° og 60° strømmer luften ved jorden mod polerne og bøjes af til vestenvind – den vind, der giver Danmark det skiftende vejr. Ved polerne synker kold luft og strømmer ud som polar østenvind. Omkring 60° mødes den kolde polarluft og den mildere luft fra syd ved polarfronten. Her stiger luften, og der dannes lavtryk. Sammen med Hadleycellen giver det tre celler på hver halvkugle: Hadley-, Ferrel- og polarcellen.',
    se: 'de seks luftringe i snittet og de tre vindbælter på hver halvkugle.',
    fokus: [5, 35], fremhaev: 'tre', saet: { rotation: 1 },
  },
  {
    titel: 'ITK følger solen',
    tekst: 'Solen står lodret over Krebsens vendekreds i juni og over Stenbukkens i december. ITK og hele vindsystemet følger med, men en til to måneder forsinket, fordi land og hav skal varmes op først. Over havet flytter ITK sig kun lidt. Over kontinenter, som varmes hurtigt op, flytter den sig langt.',
    se: 'tryk på «Afspil år», og se ITK vandre – mest over Asien og Afrika.',
    fokus: [40, 5], fremhaev: 'itk', saet: { kontinenter: 1 },
  },
  {
    titel: 'Monsun',
    tekst: 'Om sommeren varmes Asien kraftigt op, og ITK trækkes helt op over Nordindien. Sydøstpassaten krydser ækvator og bøjes til højre: Den bliver til en fugtig sydvestmonsun, der giver Indien regntid fra juni til september. Om vinteren ligger der et koldt højtryk over Asien, og vinden vender: tør nordøstmonsun fra land. Det er samme mekanisme som sø- og landbrise, bare over et helt kontinent og et helt år.',
    se: 'Mumbai i januar og i juli. Hvor kommer vinden fra, og hvor ligger ITK?',
    fokus: [75, 12], fremhaev: 'monsun', saet: { kontinenter: 1, rotation: 1, maaned: 7 },
  },
];
