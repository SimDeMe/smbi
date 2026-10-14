// Elevtekst til Island-tværsnittet. Ordret fra ISLAND-MODEL.md afsnit 1–2,
// godkendt af ejeren 14. oktober 2026. Ret teksten der først, så her.
// `lag` er de dele af figuren, der fremhæves, når trinnet er valgt.

export const overblik = {
  titel: 'Kort fortalt',
  tekst: [
    'Island ligger på Den Midtatlantiske Ryg, hvor to lithosfæreplader bevæger sig fra hinanden. Kappen stiger op under ryggen, og når trykket falder, smelter en lille del af den til magma. Under Island er kappen varmere end normalt, så der dannes mere magma og en tykkere skorpe, som når over havet.'
  ],
  seEfter: 'Vælg et trin for at få forklaringen trin for trin.',
  lag: []
};

export const trin = [
  {
    titel: 'Pladerne bevæger sig fra hinanden',
    tekst: [
      'Jordens yderste lag er delt i lithosfæreplader. Gennem Island går Den Midtatlantiske Ryg, hvor den Nordamerikanske plade bevæger sig mod vest og den Eurasiske mod øst – samlet ca. 2 cm om året, omtrent som negle vokser. På 1 million år bliver det til ca. 20 km.'
    ],
    seEfter: 'den røde dobbeltlinje gennem Island og pilene, der peger hver sin vej.',
    lag: ['plader', 'graense']
  },
  {
    titel: 'Kappen stiger op',
    tekst: [
      'Under pladerne ligger kappen. Den er ikke flydende magma, men fast sten, der er så varm, at den kan flyde meget langsomt – ligesom isen i en gletsjer. Når pladerne bevæger sig fra hinanden, stiger kappen op under ryggen.'
    ],
    seEfter: 'pilene i kappen, der peger op mod ryggen.',
    lag: ['kappe']
  },
  {
    titel: 'Lavere tryk får stenen til at smelte',
    tekst: [
      'Kappen smelter, uden at den bliver varmere. Det skyldes, at den temperatur, hvor sten smelter, afhænger af trykket: Jo lavere tryk, jo lavere smeltetemperatur. Vand opfører sig på samme måde, når det koger: På toppen af Mount Everest koger det ved ca. 70 °C i stedet for 100 °C.',
      'Dybt nede holder det høje tryk kappen fast, selv om den er over 1 000 °C varm. Når kappen stiger op, falder trykket, mens temperaturen næsten er den samme. Til sidst smelter noget af den til magma.'
    ],
    seEfter: 'de små dråber magma, der først opstår, når kappen er steget et stykke op.',
    lag: ['smelt']
  },
  {
    titel: 'Magmaen bliver til ny skorpe',
    tekst: [
      'Magma er lettere end stenen omkring den og stiger derfor op. Den samler sig i magmakamre nogle kilometer under overfladen og kommer op gennem sprækker som spalteudbrud eller i vulkaner. Den størkner til basalt, som det meste af Island og havbunden består af.',
      'Pladerne fører den nye skorpe væk til begge sider. Derfor er klipperne yngst midt på Island og ældst mod øst- og vestkysten.'
    ],
    seEfter: 'magmakamrene og den nye skorpe, der flytter sig ud til siderne.',
    lag: ['magma', 'skorpe']
  },
  {
    titel: 'Hvorfor ligger Island over havet?',
    tekst: [
      'Resten af Den Midtatlantiske Ryg ligger 2–3 km under havoverfladen. Under Island er kappen varmere. Varmere kappe begynder at smelte dybere nede, så der dannes mere magma. Det giver en skorpe på ca. 20–40 km mod ca. 7 km under resten af ryggen.'
    ],
    seEfter: 'skift mellem «Den Midtatlantiske Ryg» og «Island». Hvor begynder smeltningen, og hvor tyk bliver skorpen?',
    lag: ['skorpe', 'smelt', 'overflade']
  },
  {
    titel: 'Hvor kommer den ekstra varme fra?',
    tekst: [
      'Et område med usædvanlig varm kappe kaldes et hotspot. Mange geologer forklarer det med en kappeplume: en søjle af varm kappe, der stiger langsomt op fra stor dybde.',
      'Ingen har set plumen direkte. Jordskælvsbølger bevæger sig langsommere gennem kappen under Island, hvilket tyder på varm sten. Hvor dybt den varme kappe når, og om der er en egentlig søjle, er forskerne stadig uenige om.'
    ],
    seEfter: 'laget «Hotspot (fortolkning)», som kan slås til og fra.',
    lag: ['hotspot']
  }
];

// Tekstalternativ til figuren for hver tilstand (skærmlæser og uden SVG).
export const beskrivelse = {
  ryg: 'Skematisk tværsnit af et typisk stykke af Den Midtatlantiske Ryg langt fra Island, set fra syd. Den Nordamerikanske plade bevæger sig mod vest og den Eurasiske mod øst. Ryggen ligger under havet, og skorpen er tynd. Kappen stiger op under ryggen, og smeltningen begynder forholdsvis tæt under pladerne. Et lille magmakammer fører magma op til havbunden.',
  island: 'Skematisk tværsnit gennem Island, set fra syd. Samme pladebevægelse som ved resten af ryggen. Under Island er kappen varmere (hotspot – en fortolkning), smeltningen begynder dybere, der dannes mere magma, og skorpen er meget tykkere, så landet når op over havet. Magmakamre i skorpen fører magma op til sprækker og vulkaner i riftzonen.'
};

// Mærkerne fra ISLAND-MODEL.md afsnit 3, elevens version.
export const maerker = [
  ['Island ligger, hvor den Nordamerikanske og Eurasiske plade mødes', 'Målt'],
  ['Pladerne glider ca. 2 cm/år fra hinanden', 'Målt'],
  ['Skorpen under Island er meget tyk', 'Målt'],
  ['Der er mange udbrud, mest af basalt', 'Målt'],
  ['Stenen smelter, fordi trykket falder', 'Model'],
  ['Kappen under Island er varmere end normalt', 'Fortolkning'],
  ['Varmen kommer fra en dyb kappeplume', 'Fortolkning (diskuteret)'],
  ['Lagenes tykkelse og form i tværsnittet', 'Skematisk tegning']
];
