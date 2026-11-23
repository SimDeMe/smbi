// Opgaverne efter de seks trin. Fire slags:
//  · 'valg': multiple choice. «rigtig» er indekset i «valg».
//  · 'peg': eleven klikker i figuren. «rigtig» er en eller flere af figurens
//    dele (se DELE). «forkert» giver en særlig forklaring for en forkert del.
//  · 'tid': eleven klikker i grafen. «rigtig» er tidsintervaller i grafens
//    enhed (døgn: timer efter kl. 6; år: måneder efter 1. januar). Intervallerne
//    er regnet ud fra modellen og kontrolleres i test.mjs.
//  · 'kaede': udsagn sættes i rækkefølge; nogle er falske.
// «figur» er det trin, figuren står som (2 søbrise kl. 14, 3 landbrise kl. 4,
// 4 sommermonsun, 5 vintermonsun). Ved 'tid' vises hele kurven i grafen.

export const DELE = {
  'vind-jord': 'vinden ved jorden',
  'vind-top': 'luftstrømmen højt oppe',
  'lodret-land': 'den lodrette luftbevægelse over land',
  'lodret-hav': 'den lodrette luftbevægelse over havet',
  'land-lavt': 'luften tæt ved jorden over land',
  'hav-lavt': 'luften tæt ved havoverfladen',
  'land-hoejt': 'luften højt oppe over land',
  'hav-hoejt': 'luften højt oppe over havet',
  land: 'landoverfladen',
  hav: 'havet',
  bjerg: 'Himalaya',
  regn: 'området med skyer og regn',
};

export const OPGAVER = [
  {
    type: 'valg', figur: 2,
    spm: 'Solen tilfører land og hav lige meget energi. Hvorfor bliver land alligevel varmest om dagen?',
    valg: [
      'Land får mere sollys end havet',
      'På land opvarmes kun et tyndt lag; i havet blandes varmen ned i dybden, og vand skal have meget energi for at blive varmere',
      'Havet kaster næsten alt sollyset tilbage',
    ],
    rigtig: 1,
    forklaring: 'Jord leder varme dårligt, så energien samles i et tyndt lag ved overfladen. I havet trænger lyset ned, bølger og strømme blander varmen ned, vand har stor varmekapacitet, og fordampning bruger energi.',
  },
  {
    type: 'tid', figur: 2,
    spm: 'Klik i grafen på det tidspunkt, hvor land er varmest.',
    rigtig: [[7.5, 10]],
    forkert: 'Find toppen af den brune kurve for land.',
    forklaring: 'Land er varmest midt på eftermiddagen, ikke kl. 12. Så længe land får mere energi fra solen, end det mister, bliver det ved med at blive varmere – lige som sandet under lampen.',
  },
  {
    type: 'peg', figur: 2,
    spm: 'Klik på søbrisen.',
    rigtig: ['vind-jord'],
    forkert: {
      'vind-top': 'Det er strømmen højt oppe, der går den anden vej – ud over havet. Søbrisen er vinden ved jorden.',
      'lodret-land': 'Her stiger luften over det varme land. Søbrisen er vinden ved jorden fra havet mod land.',
      'lodret-hav': 'Her synker luften over havet. Søbrisen er vinden ved jorden fra havet mod land.',
    },
    forklaring: 'Søbrisen er vinden ved jorden, der blæser fra havet ind over land om eftermiddagen.',
  },
  {
    type: 'peg', figur: 2,
    spm: 'Klik der, hvor lufttrykket ved jorden er lavest om eftermiddagen.',
    rigtig: ['land-lavt', 'land'],
    forkert: {
      'hav-lavt': 'Over havet er luften koldere, og trykket ved jorden er højere. Herfra blæser det ind mod land.',
      hav: 'Over havet er luften koldere, og trykket ved jorden er højere. Herfra blæser det ind mod land.',
      'land-hoejt': 'Højt oppe over land er trykket højere end over havet i samme højde. Ved jorden er det omvendt.',
      'hav-hoejt': 'Spørgsmålet gælder trykket ved jorden.',
    },
    forklaring: 'Luften over det varme land udvider sig, og højt oppe strømmer luft ud over havet. Derfor falder trykket ved jorden over land: et termisk lavtryk.',
  },
  {
    type: 'peg', figur: 2,
    spm: 'Klik der, hvor luften synker om eftermiddagen.',
    rigtig: ['lodret-hav'],
    forkert: {
      'lodret-land': 'Over det varme land stiger luften.',
      'vind-jord': 'Det er søbrisen ved jorden. Find den lodrette bevægelse nedad.',
      'vind-top': 'Det er strømmen højt oppe. Find den lodrette bevægelse nedad.',
    },
    forklaring: 'Luften, der strømmer ud over havet højt oppe, synker over det kølige hav og strømmer tilbage mod land ved jorden. Det lukker cirkulationen.',
  },
  {
    type: 'tid', figur: 2,
    spm: 'Klik i grafen på et tidspunkt, hvor det blæser fra land ud mod havet.',
    rigtig: [[14.2, 24], [0, 3.3]],
    forkert: 'På det tidspunkt er land varmere end havet, så det blæser fra havet mod land: søbrise.',
    forklaring: 'Landbrisen blæser, når land er koldere end havet: om aftenen, natten og tidligt om morgenen – dér, hvor den brune kurve ligger under den blå.',
  },
  {
    type: 'valg', figur: 3,
    spm: 'Hvorfor er landbrisen om natten svagere end søbrisen om dagen?',
    valg: [
      'Temperaturforskellen mellem land og hav er mindre om natten',
      'Havet er meget koldere om natten end om dagen',
      'Der er ingen trykforskel om natten',
    ],
    rigtig: 0,
    forklaring: 'Havets temperatur ændrer sig næsten ikke. Om natten bliver land kun nogle grader koldere end havet, mens det om eftermiddagen er mange grader varmere. Desuden er kold luft ved jorden stabil, så cirkulationen bliver lavere.',
  },
  {
    type: 'peg', figur: 3,
    spm: 'Det er nat. Klik der, hvor luften stiger.',
    rigtig: ['lodret-hav'],
    forkert: {
      'lodret-land': 'Om natten er land koldere end havet. Over det kolde land synker luften.',
      'vind-jord': 'Det er landbrisen ved jorden. Find den lodrette bevægelse opad.',
      'vind-top': 'Det er strømmen højt oppe. Find den lodrette bevægelse opad.',
    },
    forklaring: 'Om natten er havet det varmeste sted. Luften stiger over havet, og ved jorden blæser landbrisen fra land ud mod havet.',
  },
  {
    type: 'valg', figur: 4,
    spm: 'Hvad har søbrisen og sommermonsunen til fælles?',
    valg: [
      'Begge skyldes Jordens rotation',
      'Land bliver varmere end havet, så der dannes lavtryk over land, og vinden blæser fra havet ind over land',
      'Begge blæser fra et lavtryk over havet mod et højtryk over land',
    ],
    rigtig: 1,
    forklaring: 'Det er samme princip – termisk tryk. Forskellen er skalaen: brisen er nogle titals kilometer og skifter hver dag; monsunen dækker et helt kontinent og skifter med årstiden.',
  },
  {
    type: 'peg', figur: 4,
    spm: 'Klik der, hvor der falder mest regn om sommeren.',
    rigtig: ['regn', 'lodret-land'],
    forkert: {
      'hav-lavt': 'Over havet synker luften om sommeren, så der dannes kun få skyer.',
      'hav-hoejt': 'Over havet synker luften om sommeren, så der dannes kun få skyer.',
      'lodret-hav': 'Her synker luften. Synkende luft opvarmes og giver ikke regn.',
      hav: 'Havet leverer fugten, men regnen falder, hvor luften stiger: over land og op mod bjergene.',
    },
    forklaring: 'Den fugtige luft fra havet stiger over land og op mod Himalaya. Den afkøles, vanddampen kondenserer, og der falder kraftig regn.',
  },
  {
    type: 'valg', figur: 4,
    spm: 'Hvorfor giver sommermonsunen så meget regn?',
    valg: [
      'Vinden fra Centralasien er fugtig',
      'Fugtig luft fra havet stiger op over land og mod bjergene, afkøles og kondenserer',
      'Havet er koldere end land, så vanddampen kondenserer over havet',
    ],
    rigtig: 1,
    forklaring: 'Luften har optaget vanddamp over det varme hav. Når den stiger, udvider den sig og afkøles. Kondensationen frigiver varme, som får luften til at stige endnu mere og forstærker monsunen.',
  },
  {
    type: 'valg', figur: 4,
    spm: 'Sommermonsunen strømmer fra havet ind over Indien, men vinden kommer fra sydvest – ikke direkte fra syd. Hvorfor?',
    valg: [
      'Jordens rotation afbøjer vinden',
      'Himalaya skubber vinden mod vest',
      'Solen står i sydvest om sommeren',
    ],
    rigtig: 0,
    forklaring: 'Luft, der bevæger sig over store afstande, afbøjes af Jordens rotation (corioliseffekten) – på den nordlige halvkugle mod højre. Det betyder noget for monsunen, men næsten ikke for en brise, som kun bevæger sig nogle titals kilometer.',
  },
  {
    type: 'tid', figur: 5,
    spm: 'Klik i grafen på en måned, hvor det blæser fra land ud mod havet (vintermonsun).',
    rigtig: [[9, 12], [0, 2.3]],
    forkert: 'I den måned er land varmere end havet, så vinden blæser fra havet: sommermonsun.',
    forklaring: 'Vintermonsunen blæser, når kontinentet er koldere end havet: fra efteråret til forår – dér, hvor den brune kurve ligger under den blå. Det er den tørre tid.',
  },
  {
    type: 'kaede', figur: 2,
    spm: 'Byg kæden for søbrisen: sæt udsagnene i den rigtige rækkefølge. Pas på – nogle af dem er falske.',
    // Rækkefølgen her er facit. Kortene blandes, når opgaven vises.
    led: [
      'Solen opvarmer land og hav',
      'Land bliver hurtigt varmere end havet',
      'Luften over land opvarmes og udvider sig',
      'Højt oppe strømmer luft fra land ud over havet',
      'Ved jorden opstår lavtryk over land og højtryk over havet',
      'Ved jorden blæser det fra havet mod land: søbrise',
    ],
    falske: [
      'Havet bliver hurtigt varmere end land',
      'Den varme luft giver højtryk ved jorden over land',
      'Vinden blæser fra lavtryk mod højtryk',
      'Luften stiger over det kølige hav',
    ],
    forklaring: 'Land og hav opvarmes forskelligt. Den varme luft over land udvider sig, så trykket højt oppe bliver højest over land, og luft strømmer ud over havet. Derfor falder trykket ved jorden over land og stiger over havet – og ved jorden blæser det fra højtryk mod lavtryk.',
  },
];
