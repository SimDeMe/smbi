// Fagordene til «Byg cellen» med en kort forklaring til hvert.
//
// Første sætning står på det grønne kort, når laget er bygget, og som hint.
// Hele forklaringen kommer frem, når man peger på et ord, der sidder på plads.
// Et ord kan bruges på flere figurer (cellemembran, ribosom …) — forklaringen
// er den samme, så den skal passe til alle de celler, ordet sidder på.

export const ORD = {
  cellemembran: {
    ord: 'cellemembran',
    tekst: 'Den tynde hinde af fosfolipider og proteiner, der omgiver cellen. Den bestemmer, hvilke stoffer der kommer ind og ud.',
  },
  cytoplasma: {
    ord: 'cytoplasma',
    tekst: 'Den geléagtige væske inde i cellen, hvor organellerne ligger. Mange af cellens kemiske reaktioner foregår her.',
  },
  cellekerne: {
    ord: 'cellekerne',
    tekst: 'Organellen, der rummer cellens DNA. Kernen styrer cellen ved at bestemme, hvilke gener der bliver aflæst.',
  },
  kernemembran: {
    ord: 'kernemembran',
    tekst: 'Den dobbelte membran om cellekernen. Gennem porerne i den kommer mRNA ud til ribosomerne.',
  },
  ribosom: {
    ord: 'ribosom',
    tekst: 'En lille partikel af RNA og protein, hvor mRNA bliver oversat til protein. Ribosomer har ingen membran og findes i alle celler.',
  },
  ruER: {
    ord: 'ru ER',
    tekst: 'Endoplasmatisk retikulum med ribosomer på overfladen. Proteinerne, der bygges her, sendes videre til Golgi-apparatet.',
  },
  glatER: {
    ord: 'glat ER',
    tekst: 'Endoplasmatisk retikulum uden ribosomer: et net af rør af membran. Her dannes blandt andet lipider, og giftstoffer bliver nedbrudt.',
  },
  golgi: {
    ord: 'Golgi-apparat',
    tekst: 'En stak af flade membransække, der færdigbehandler og sorterer proteiner. Proteinerne sendes videre i vesikler.',
  },
  mitokondrie: {
    ord: 'mitokondrie',
    tekst: 'Organellen, hvor respirationen foregår. Glukose og ilt bliver til kuldioxid og vand, og energien bliver gemt i ATP.',
  },
  lysosom: {
    ord: 'lysosom',
    tekst: 'En lille membransæk med fordøjelsesenzymer. Den nedbryder slidte organeller og stoffer, cellen har optaget.',
  },
  vesikel: {
    ord: 'vesikel',
    tekst: 'En lille blære af membran, der fragter stoffer rundt i cellen. Smelter den sammen med cellemembranen, kommer indholdet ud (exocytose).',
  },
  cellevaeg: {
    ord: 'cellevæg',
    tekst: 'En stiv væg uden om cellemembranen, som giver cellen form og holder til trykket, når vand trænger ind. Hos planter er den af cellulose, hos bakterier af peptidoglykan.',
  },
  kloroplast: {
    ord: 'kloroplast',
    tekst: 'Den grønne organel, hvor fotosyntesen foregår. Lysenergi bruges til at lave glukose af kuldioxid og vand.',
  },
  vakuole: {
    ord: 'vakuole',
    tekst: 'En stor sæk med væske, omgivet af en membran, som fylder det meste af plantecellen. Den lagrer vand og stoffer og holder cellen spændt ud.',
  },
  kromosom: {
    ord: 'kromosom',
    tekst: 'Bakteriens arvemateriale: ét langt, ringformet DNA-molekyle. Det ligger frit i cytoplasmaet, fordi bakterien ikke har nogen cellekerne.',
  },
  plasmid: {
    ord: 'plasmid',
    tekst: 'En lille ring af DNA ved siden af kromosomet. Plasmider kan gå videre fra bakterie til bakterie og kan bære gener for resistens mod antibiotika.',
  },
  flagel: {
    ord: 'flagel',
    tekst: 'En lang, tynd tråd, som bakterien drejer rundt for at svømme.',
  },
  pili: {
    ord: 'pili',
    tekst: 'Korte hår på bakteriens overflade. Med dem hæfter bakterien sig fast, og nogle bruges til at overføre plasmider.',
  },
  kapsel: {
    ord: 'kapsel',
    tekst: 'Et slimet lag uden på cellevæggen hos nogle bakterier. Det beskytter mod udtørring og gør det sværere for immunforsvaret at fange bakterien.',
  },
  eukaryot: {
    ord: 'eukaryot',
    tekst: 'En celle med cellekerne og med organeller omgivet af membraner. Dyr, planter og svampe er bygget af eukaryote celler.',
  },
  prokaryot: {
    ord: 'prokaryot',
    tekst: 'En celle uden cellekerne og uden organeller med membran. Bakterier er prokaryote.',
  },
  // Mitokondrien og kloroplasten set indefra
  ydreMembran: {
    ord: 'ydre membran',
    tekst: 'Den yderste af de to membraner om mitokondrien og kloroplasten. Den er glat og lader små molekyler slippe igennem.',
  },
  indreMembran: {
    ord: 'indre membran',
    tekst: 'Den inderste af de to membraner om mitokondrien og kloroplasten. Den er tæt, og transportproteiner i den bestemmer, hvad der kommer ind.',
  },
  intermembranrum: {
    ord: 'intermembranrum',
    tekst: 'Det smalle rum mellem mitokondriens ydre og indre membran. Elektrontransportkæden pumper H⁺ herud, så koncentrationen af H⁺ bliver høj.',
  },
  cristae: {
    ord: 'cristae',
    tekst: 'Folderne i mitokondriens indre membran. De gør membranen stor, så der er plads til mange elektrontransportkæder og ATP-syntaser.',
  },
  matrix: {
    ord: 'matrix',
    tekst: 'Væsken inden for mitokondriens indre membran. Her bliver pyruvat nedbrudt, og citronsyrecyklussen kører.',
  },
  glykolyse: {
    ord: 'glykolyse',
    tekst: 'Første trin i respirationen: glukose spaltes til to pyruvat, og der dannes lidt ATP. Det sker i cytoplasmaet, ikke i mitokondrien.',
  },
  citronsyrecyklus: {
    ord: 'citronsyrecyklus',
    tekst: 'En kreds af reaktioner i mitokondriens matrix, hvor resten af glukosen nedbrydes til CO₂. Elektronerne afleveres til NADH og FADH₂.',
  },
  elektrontransportkaede: {
    ord: 'elektrontransportkæde',
    tekst: 'En række proteiner i den indre membran, der sender elektroner fra NADH videre til ilt, så der dannes vand. Energien pumper H⁺ ud i intermembranrummet.',
  },
  atpSyntase: {
    ord: 'ATP-syntase',
    tekst: 'Et protein i membranen, som H⁺ strømmer tilbage igennem. Strømmen driver dannelsen af ATP ud fra ADP og fosfat.',
  },
  thylakoid: {
    ord: 'thylakoid',
    tekst: 'En flad sæk af membran inde i kloroplasten. I membranen sidder klorofyllet, og her foregår lysreaktionen.',
  },
  granum: {
    ord: 'granum',
    tekst: 'En stak af thylakoider (flertal: grana). Stakkene er forbundet af enkelte lange thylakoider.',
  },
  stroma: {
    ord: 'stroma',
    tekst: 'Væsken inden for kloroplastens indre membran, uden om thylakoiderne. Her kører Calvin-cyklussen.',
  },
  lysreaktion: {
    ord: 'lysreaktion',
    tekst: 'Den del af fotosyntesen, der sker i thylakoidmembranen. Lysenergi spalter vand, så der frigives O₂, og der dannes ATP og NADPH.',
  },
  calvin: {
    ord: 'Calvin-cyklus',
    tekst: 'Den del af fotosyntesen, der sker i stroma. CO₂ bliver bundet og bygget om til sukker med energi fra ATP og NADPH fra lysreaktionen.',
  },
  virus: {
    ord: 'virus',
    tekst: 'Ikke en celle: arvemateriale i en kappe af protein, uden eget stofskifte. En virus kan kun formere sig inde i en værtscelle.',
  },
};

/** Første sætning af forklaringen. */
export function kort(id) {
  const t = ORD[id].tekst;
  const i = t.search(/[.!?](\s|$)/);
  return i < 0 ? t : t.slice(0, i + 1);
}
