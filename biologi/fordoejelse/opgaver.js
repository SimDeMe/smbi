// Korte undersøgelsesopgaver. «vis» sætter modellen op, så eleven kan undersøge spørgsmålet:
// fane, evt. pH i fanen «Enzymer og pH», forholdene i rundturen og et trin [id, brøkdel].
// Forklaringerne er forslag til, hvad en god besvarelse kommer ind på — ikke en facitliste.

export const OPGAVER = [
  {
    spm: 'Hvilke organer går maden ikke igennem?',
    gør: 'Klik dig gennem organerne under «Tilhørende organer». Hvad sender hvert af dem ud i kanalen?',
    vis: {fane: 'opbygning', del: 'lever'},
    forklaring: 'Spytkirtlerne, leveren med galdeblæren og bugspytkirtlen ligger uden for kanalen. De sender deres safter ind gennem udførselsgange: spyt med amylase til munden, galde til tolvfingertarmen og bugspyt med bikarbonat og enzymer til tolvfingertarmen.',
  },
  {
    spm: 'Hvor spaltes stivelse — og af hvilke enzymer?',
    gør: 'Afspil madens vej, og hold øje med stivelseskæden og enzymmærket ved siden af den.',
    vis: {fane: 'forloeb', normale: true, trin: ['mund', 0.02]},
    forklaring: 'Spytamylase begynder at spalte stivelse til maltose i munden og arbejder videre, til maden bliver sur i mavesækken. Bugspyttets amylase spalter resten i tolvfingertarmen, og maltase i tyndtarmens slimhinde spalter maltose til glukose, som optages i blodet.',
  },
  {
    spm: 'Hvorfor virker amylase ikke i mavesækken?',
    gør: 'Sæt pH til mavesækkens, og sammenlign amylase og pepsin. Flyt derefter pH op mod 7.',
    vis: {fane: 'enzymer', ph: 2},
    forklaring: 'Amylase har sit optimum ved pH ≈ 7. Ved mavens pH ≈ 2 ændrer enzymet form (denaturerer), så det aktive center ikke længere passer til stivelsen. Pepsin er omvendt: det har optimum ved pH ≈ 2 og virker næsten ikke ved pH 7. Hvert enzym virker der, hvor pH passer til det.',
  },
  {
    spm: 'Hvad sker der, hvis mavesækken ikke laver syre?',
    gør: 'Under «Hvad nu hvis …?» er pH i mavesækken sat til 7 (fx med syreneutraliserende medicin). Følg stivelse og protein fra mavesækken og videre.',
    vis: {fane: 'forloeb', phMave: 7, galde: true, trin: ['mavesaek', 0.6]},
    forklaring: 'Spytamylase kan arbejde videre i mavesækken, men pepsin virker ikke. Alligevel bliver proteinet spaltet til aminosyrer, for trypsin og peptidaserne i tyndtarmen klarer det. Mavesyren er altså ikke nødvendig for selve nedbrydningen, men den dræber bakterier i maden og hjælper med at optage fx jern og B12.',
  },
  {
    spm: 'Hvad sker der, hvis galden mangler?',
    gør: 'Galden er slået fra under «Hvad nu hvis …?». Følg fedtet fra tolvfingertarmen og helt ud.',
    vis: {fane: 'forloeb', phMave: 2, galde: false, trin: ['tolvfingertarm', 0.25]},
    forklaring: 'Galde er ikke et enzym. Galdesaltene deler store fedtdråber i små (emulgering), så lipase får en meget større overflade at arbejde på. Uden galde bliver fedtet i store dråber, lipase spalter kun en del af det, og resten ender i afføringen. Den bliver fedtet — og lys, fordi galdefarvestoffet heller ikke kommer med.',
  },
  {
    spm: 'Hvor optages glukose, aminosyrer, fedt og vand — og hvor ender de?',
    gør: 'Se trinene Tyndtarmen og Tyktarmen. Hvad står der under «Optagelse», og hvad sker der med vandet?',
    vis: {fane: 'forloeb', normale: true, trin: ['tyndtarm', 0.5]},
    forklaring: 'Glukose og aminosyrer optages gennem tarmtotterne i tyndtarmen til blodet og føres via portåren til leveren. Fedtsyrer og glycerol optages også i tyndtarmen, men går til lymfen. Det meste vand optages faktisk i tyndtarmen, men der kommer hele tiden nye fordøjelsessafter til, så tarmindholdet er tyndt. Tyktarmen optager det vand og salt, der er tilbage, så afføringen bliver fast.',
  },
  {
    spm: 'Hvorfor ender kostfibrene i afføringen?',
    gør: 'Følg kostfibrene hele vejen. Hvilke enzymer virker på dem?',
    vis: {fane: 'forloeb', normale: true, trin: ['tyktarm', 0.3]},
    forklaring: 'Kroppen har ingen enzymer, der kan spalte bindingerne i kostfibrene (fx cellulose). De går derfor uspaltet igennem til tyktarmen, hvor tarmbakterier gærer en del af dem. Resten giver afføringen fylde og holder på vand.',
  },
];
