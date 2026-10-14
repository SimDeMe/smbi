// Elevtekst til Island-tværsnittet. Fra ISLAND-MODEL.md afsnit 1–2,
// fagligt præciseret efter ejerens ønske 14. oktober 2026. Ret teksten der først, så her.
// `lag` er de dele af figuren, der fremhæves, når trinnet er valgt.

export const overblik = {
  titel: 'Kort fortalt',
  tekst: [
    'Island ligger på Den Midtatlantiske Ryg, hvor to lithosfæreplader bevæger sig fra hinanden. Kappen stiger op under ryggen, og når trykket falder, smelter en lille del af den til magma. Under Island er kappen varmere end normalt, så der dannes mere magma og en tykkere skorpe. Den tykke skorpe og den varme kappe bidrager til at løfte Island over havet.'
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
      'En lithosfæreplade består af skorpen og den stive, øverste del af kappen. Under pladerne er kappen også overvejende fast sten, men den er så varm, at den kan flyde meget langsomt – ligesom isen i en gletsjer. Når pladerne bevæger sig fra hinanden, stiger denne kappe op under ryggen.'
    ],
    seEfter: 'pilene i kappen, der peger op mod ryggen.',
    lag: ['kappe']
  },
  {
    titel: 'Lavere tryk får stenen til at smelte',
    tekst: [
      'En lille del af kappens sten smelter, uden at stenen bliver varmere. Når stenen stiger op, falder trykket, og dermed falder den temperatur, hvor smeltningen begynder. Stenen køler lidt af under opstigningen, men smeltetemperaturen falder hurtigere. Derfor kan der dannes magma, mens det meste af stenen stadig er fast.',
      'Tryk påvirker også vands kogepunkt: På Mount Everest koger vand ved ca. 70 °C. Det er en sammenligning med trykkets betydning; kappens sten smelter, den koger ikke.'
    ],
    seEfter: 'de små dråber magma, der først opstår, når kappen er steget et stykke op.',
    lag: ['smelt']
  },
  {
    titel: 'Magmaen bliver til ny skorpe',
    tekst: [
      'Magma er mindre tæt end stenen omkring den og kan stige op gennem små mellemrum og sprækker. Noget samler sig i magmaområder i skorpen, her tegnet som magmakamre. De kan bestå af både smelte og krystaller. Noget størkner i dybet; noget når overfladen som lava ved spalteudbrud og vulkaner. Det meste bliver til basalt og beslægtede bjergarter.',
      'Pladerne fører den nye skorpe væk fra de aktive riftzoner. Derfor er klipperne generelt yngst i de aktive zoner og ældre mod øst og vest. Islands riftzoner har flyttet sig gennem tiden; den ene midterlinje i figuren er en forenkling.'
    ],
    seEfter: 'magmakamrene og den nye skorpe, der flytter sig ud til siderne.',
    lag: ['magma', 'skorpe']
  },
  {
    titel: 'Hvorfor ligger Island over havet?',
    tekst: [
      'Et typisk stykke af Den Midtatlantiske Ryg ligger under havet. Under Island forbindes den ekstra magmatilførsel med varmere, opstrømmende kappe. I denne model begynder smeltningen derfor dybere, og mere magma danner en tykkere skorpe. Skorpen er omtrent 20–40 km tyk mange steder under Island, mod ca. 7 km for almindelig havbundsskorpe; tykkelsen varierer.',
      'Den tykke skorpe er mindre tæt end kappen og giver øen opdrift. Varm kappe er også mindre tæt og bidrager til at løfte området. Det er altså både skorpen og forholdene i kappen, der hjælper Island op over havet.'
    ],
    seEfter: 'skift mellem «Den Midtatlantiske Ryg» og «Island». Hvor begynder smeltningen, og hvor tyk bliver skorpen?',
    lag: ['skorpe', 'smelt', 'overflade']
  },
  {
    titel: 'Hvor kommer den ekstra varme fra?',
    tekst: [
      'Et hotspot er et område med usædvanlig stor og langvarig vulkansk aktivitet. Under Island forbindes det med ekstra varm, opstrømmende kappe. Mange geologer forklarer det med en kappeplume: varm, overvejende fast sten, der stiger langsomt op fra stor dybde.',
      'Plumen er en fortolkning af målinger, ikke en søjle, man har set direkte. Langsomme jordskælvsbølger og magmaens kemi støtter forklaringen, men bølgerne påvirkes også af stenens sammensætning og smelte. Den dybe opstrømnings form og oprindelse diskuteres stadig.'
    ],
    seEfter: 'laget «Hotspot (fortolkning)», som kan slås til og fra.',
    lag: ['hotspot']
  }
];

// Tekstalternativ til figuren for hver tilstand (skærmlæser og uden SVG).
export const beskrivelse = {
  ryg: 'Skematisk tværsnit af et typisk stykke af Den Midtatlantiske Ryg langt fra Island, set fra syd. Den Nordamerikanske plade bevæger sig mod vest og den Eurasiske mod øst. Ryggen ligger under havet, og skorpen er tynd. Kappen stiger op under ryggen, og smeltningen begynder forholdsvis tæt under pladerne. Et lille magmakammer fører magma op til havbunden.',
  island: 'Skematisk tværsnit gennem Island, set fra syd. Samme pladebevægelse som ved resten af ryggen. Under Island er kappen varmere (hotspot – en fortolkning), smeltningen begynder dybere, der dannes mere magma, og skorpen er meget tykkere. Tyk skorpe og varm kappe bidrager til landets højde over havet. Skorpe og stiv kappe udgør tilsammen lithosfærepladerne. Magmakamre i skorpen fører magma op til sprækker og vulkaner i riftzonen.'
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
