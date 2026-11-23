// Opgaverne efter de seks trin. To slags:
//  · type 'peg': eleven klikker i figuren. «rigtig» er en eller flere af
//    figurens dele (se DELE nedenfor). «forkert» giver en særlig forklaring,
//    når eleven peger på en bestemt forkert del.
//  · type 'valg': multiple choice. «rigtig» er indekset i «valg».
// Figuren står i opgaverne som i trinnet «Drivhuseffekten» (nuværende reference).

export const DELE = {
  sol: 'Solen',
  solstraaling: 'solens kortbølgede stråling',
  jordoverflade: 'jordoverfladen',
  gas: 'en drivhusgas',
  jordstraaling: 'jordens varmestråling, som bliver absorberet af en drivhusgas',
  'jordstraaling-direkte': 'jordens varmestråling, som slipper direkte ud i rummet',
  modstraaling: 'atmosfærisk modstråling mod jordoverfladen',
  'atmosfaere-ud': 'atmosfærens varmestråling mod rummet',
  luften: 'et tomt sted i luften',
};

export const OPGAVER = [
  {
    type: 'valg',
    spm: 'Hvad er forskellen på solstrålingen og jordens varmestråling?',
    valg: [
      'Solstrålingen er kortbølget, jordens varmestråling er langbølget',
      'Solstrålingen er langbølget, jordens varmestråling er kortbølget',
      'Der er ingen forskel – jorden kaster bare sollyset tilbage',
    ],
    rigtig: 0,
    forklaring: 'Den meget varme Sol udsender kortbølget stråling. Den langt koldere jordoverflade udsender langbølget varmestråling (infrarød stråling). Det er ny stråling, ikke sollys, der kastes tilbage.',
  },
  {
    type: 'peg',
    spm: 'Klik på kortbølget stråling i figuren.',
    rigtig: ['solstraaling'],
    forkert: {
      sol: 'Det er Solen selv. Klik på strålingen, der går fra Solen ned mod jorden.',
      jordstraaling: 'Det er langbølget varmestråling fra den varme jordoverflade.',
      'jordstraaling-direkte': 'Det er langbølget varmestråling fra den varme jordoverflade.',
      modstraaling: 'Det er langbølget varmestråling, som atmosfæren udsender.',
      'atmosfaere-ud': 'Det er langbølget varmestråling, som atmosfæren udsender.',
    },
    forklaring: 'De gule, lige baner fra Solen er kortbølget solstråling. Alle de røde, bølgede baner er langbølget varmestråling.',
  },
  {
    type: 'peg',
    spm: 'Klik der, hvor solstrålingen absorberes og bliver til varme.',
    rigtig: ['jordoverflade'],
    forkert: {
      gas: 'I modellen går solstrålingen uhindret gennem atmosfæren. Drivhusgasserne absorberer jordens varmestråling, ikke sollyset.',
      luften: 'Solstrålingen passerer gennem luften uden at blive absorberet i denne model.',
    },
    forklaring: 'Solstrålingen absorberes ved jordoverfladen – land og hav – som derved bliver varm.',
  },
  {
    type: 'valg',
    spm: 'Hvad sker der med jordoverfladen, hvis sollyset bliver afskærmet?',
    valg: [
      'Den holder straks op med at udsende varmestråling',
      'Den udsender stadig varmestråling, men køler af og udsender efterhånden mindre',
      'Den bliver varmere, fordi drivhusgasserne holder på varmen',
    ],
    rigtig: 1,
    forklaring: 'Alt stof udsender varmestråling på grund af sin temperatur – også uden sollys. Uden tilførsel af energi køler overfladen af, og jo koldere den er, desto mindre udsender den.',
  },
  {
    type: 'peg',
    spm: 'Klik på en drivhusgas, der absorberer jordens varmestråling.',
    rigtig: ['gas'],
    forkert: {
      jordstraaling: 'Det er selve varmestrålingen. Klik på drivhusgassen, hvor strålingen ender.',
    },
    forklaring: 'Drivhusgasser som vanddamp og CO₂ absorberer noget af jordens langbølgede varmestråling. Luftens hovedbestanddele, N₂ og O₂, gør det næsten ikke.',
  },
  {
    type: 'valg',
    spm: 'Hvad gør drivhusgasserne med jordens varmestråling?',
    valg: [
      'De spejler den tilbage mod jorden, som et låg',
      'De absorberer noget af den, så energien overføres til luften',
      'De absorberer det hele, så intet slipper ud i rummet',
    ],
    rigtig: 1,
    forklaring: 'Drivhusgasserne absorberer en del af varmestrålingen og opvarmer luften. Det er ikke en spejling, og noget af jordens stråling slipper stadig direkte ud i rummet.',
  },
  {
    type: 'valg',
    spm: 'Hvorfor udsender atmosfæren selv varmestråling?',
    valg: [
      'Fordi den er varm – alt stof over det absolutte nulpunkt udsender varmestråling',
      'Fordi den reflekterer den varmestråling, den har absorberet',
      'Fordi solstrålingen får drivhusgasserne til at lyse',
    ],
    rigtig: 0,
    forklaring: 'Atmosfæren udsender ny stråling på grund af sin egen temperatur. Det er ikke den samme stråling, der bliver sendt videre.',
  },
  {
    type: 'peg',
    spm: 'Klik på atmosfærisk modstråling.',
    rigtig: ['modstraaling'],
    forkert: {
      'atmosfaere-ud': 'Den stråling udsendes også af atmosfæren, men den går mod rummet. Modstrålingen går ned mod jordoverfladen.',
      jordstraaling: 'Det er jordens egen varmestråling på vej op. Modstrålingen kommer fra atmosfæren og går ned mod jorden.',
      'jordstraaling-direkte': 'Det er jordens egen varmestråling på vej op. Modstrålingen kommer fra atmosfæren og går ned mod jorden.',
      solstraaling: 'Det er solstråling. Modstrålingen er langbølget varmestråling fra atmosfæren.',
    },
    forklaring: 'Modstrålingen er den varmestråling, atmosfæren udsender ned mod jordoverfladen. Her går banerne fra drivhusgasserne skråt ned mod jorden.',
  },
  {
    type: 'valg',
    spm: 'I hvilke retninger udsender atmosfæren varmestråling?',
    valg: [
      'Kun ned mod jordoverfladen',
      'Kun op mod rummet',
      'I alle retninger – både mod rummet og mod jordoverfladen',
    ],
    rigtig: 2,
    forklaring: 'Atmosfæren stråler i alle retninger. Noget forsvinder ud i rummet, og noget når jordoverfladen som modstråling.',
  },
  {
    type: 'peg',
    spm: 'Klik på varmestråling fra jordoverfladen, der slipper direkte ud i rummet.',
    rigtig: ['jordstraaling-direkte'],
    forkert: {
      jordstraaling: 'Den varmestråling ender ved en drivhusgas og bliver absorberet.',
      'atmosfaere-ud': 'Den stråling går også mod rummet, men den kommer fra atmosfæren, ikke fra jordoverfladen.',
    },
    forklaring: 'Ikke al jordens varmestråling bliver absorberet. Banen længst til højre går fra jordoverfladen hele vejen ud i rummet.',
  },
  {
    type: 'valg',
    spm: 'Med samme solstråling er jordoverfladen ca. +15 °C med drivhuseffekt og ca. −18 °C uden. Hvorfor?',
    valg: [
      'Drivhusgasserne gør solstrålingen kraftigere',
      'Jordoverfladen modtager både solstråling og atmosfærisk modstråling',
      'Jordoverfladen holder op med at udsende varmestråling',
    ],
    rigtig: 1,
    forklaring: 'Solstrålingen er den samme. Med drivhusgasser modtager overfladen også modstråling fra atmosfæren og bliver derfor varmere. Den udsender stadig varmestråling – endda mere, fordi den er varmere.',
  },
  {
    type: 'valg',
    spm: 'Hvad sker der i modellen, når der kommer flere drivhusgasser?',
    valg: [
      'Solstrålingen bliver stærkere',
      'Atmosfæren lukker helt af, så ingen varmestråling slipper ud',
      'Mere varmestråling absorberes, modstrålingen øges, og overfladen bliver varmere',
    ],
    rigtig: 2,
    forklaring: 'Solstrålingen er uændret. Mere af jordens varmestråling absorberes i atmosfæren, modstrålingen øges, og overfladen bliver gradvist varmere. Noget stråling slipper stadig ud.',
  },
  {
    type: 'kaede',
    spm: 'Byg kæden: sæt udsagnene i den rigtige rækkefølge. Pas på – nogle af dem er falske.',
    // Rækkefølgen her er facit. Kortene blandes, når opgaven vises.
    led: [
      'Solen udsender kortbølget stråling',
      'Solstrålingen absorberes ved jordoverfladen, som bliver varm',
      'Den varme jordoverflade udsender langbølget varmestråling',
      'Drivhusgasser absorberer noget af varmestrålingen, og luften bliver varm',
      'Den varme atmosfære udsender varmestråling i alle retninger',
      'Modstrålingen absorberes ved jordoverfladen, som bliver varmere',
    ],
    falske: [
      'Solen udsender langbølget stråling',
      'Solstrålingen absorberes af drivhusgasserne',
      'Drivhusgasserne spejler varmestrålingen tilbage mod jorden',
      'Atmosfæren udsender kun varmestråling ud mod rummet',
    ],
    forklaring: 'Energien kommer fra Solen som kortbølget stråling og bliver til varme ved jordoverfladen. Den varme overflade udsender langbølget varmestråling, som drivhusgasserne delvis absorberer. Den varme atmosfære udsender selv stråling i alle retninger – også ned mod overfladen, som derfor bliver varmere.',
  },
];
