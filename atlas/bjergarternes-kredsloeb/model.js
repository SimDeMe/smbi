// Fagligt indhold for «Bjergarternes kredsløb»: bjergarterne og de processer,
// der fører fra den ene til den anden, stederne ved pladegrænserne, hvor de
// dannes, og afkølingen, der bestemmer kornstørrelsen. Ingen DOM, så modulet
// kan testes i node (model.test.mjs).
//
// `sten` peger på en post i skolens stensamling (/geografi/stensamling/), så
// eleven ser samme sten og billede som i samlingen.

export const GRUPPER = {
  kappe: { navn: 'Kappen', farve: '#c98a4b' },
  magma: { navn: 'Magma', farve: '#e8562a' },
  magmatisk: { navn: 'Magmatiske bjergarter', farve: '#f29a76' },
  sediment: { navn: 'Løst sediment', farve: '#e9c46a' },
  sedimentaer: { navn: 'Sedimentære bjergarter', farve: '#8cc084' },
  metamorf: { navn: 'Metamorfe bjergarter', farve: '#79b4d9' }
};

export const BJERGARTER = {
  peridotit: { navn: 'Peridotit', gruppe: 'kappe', sten: 'peridotit', kort: 'Kappens grønne, tunge bjergart. Den er fast, men kan flyde meget langsomt.' },
  'magma-basaltisk': { navn: 'Basaltisk magma', gruppe: 'magma', kort: 'Tyndtflydende, kiselfattig smelte fra kappen, ca. 1100–1250 °C.' },
  'magma-andesitisk': { navn: 'Andesitisk magma', gruppe: 'magma', kort: 'Sejere smelte med mere kisel og vand – dannes over subduktionszoner.' },
  'magma-granitisk': { navn: 'Granitisk magma', gruppe: 'magma', kort: 'Sej, kiselrig smelte, ca. 700–850 °C – opsmeltet kontinental skorpe.' },
  basalt: { navn: 'Basalt', gruppe: 'magmatisk', sten: 'basalt', kort: 'Finkornet og mørk: basaltisk lava, der er størknet hurtigt på overfladen.' },
  gabbro: { navn: 'Gabbro', gruppe: 'magmatisk', sten: 'gabbro', kort: 'Grovkornet og mørk: basaltisk magma, der er størknet langsomt i dybet.' },
  andesit: { navn: 'Andesit', gruppe: 'magmatisk', sten: 'andesit', kort: 'Finkornet, grå lava fra vulkanerne over en subduktionszone.' },
  diorit: { navn: 'Diorit', gruppe: 'magmatisk', sten: 'diorit', kort: 'Grovkornet «salt og peber»: andesitisk magma, størknet i dybet.' },
  rhyolit: { navn: 'Rhyolit', gruppe: 'magmatisk', sten: 'rhyolit', kort: 'Lys, finkornet lava – granitisk magma, der nåede overfladen.' },
  granit: { navn: 'Granit', gruppe: 'magmatisk', sten: 'granit', kort: 'Grovkornet og spættet: granitisk magma, størknet langsomt flere km nede.' },
  grus: { navn: 'Sten og grus', gruppe: 'sediment', kort: 'Klippestykker, der er brudt løs og rundet af floder, bølger eller is.' },
  sand: { navn: 'Sand', gruppe: 'sediment', kort: 'Korn på 0,06–2 mm – mest kvarts, som er hårdt og ikke forvitrer kemisk.' },
  ler: { navn: 'Ler og slam', gruppe: 'sediment', kort: 'Bittesmå lermineraler, dannet når feldspat og mørke mineraler forvitrer kemisk.' },
  kalkslam: { navn: 'Kalkslam', gruppe: 'sediment', kort: 'Skaller og skeletter af kalk fra alger og dyr i havet. Kalken kommer fra opløste bjergarter.' },
  konglomerat: { navn: 'Konglomerat', gruppe: 'sedimentaer', sten: 'konglomerat', kort: 'Rundede sten og grus, kittet sammen.' },
  sandsten: { navn: 'Sandsten', gruppe: 'sedimentaer', sten: 'sandsten', kort: 'Sandkorn, presset og kittet sammen af mineraler fra grundvandet.' },
  lersten: { navn: 'Lersten og lerskifer', gruppe: 'sedimentaer', sten: 'lerskifer', kort: 'Sammenpresset ler – finkornet og ofte lagdelt.' },
  kalksten: { navn: 'Kalksten', gruppe: 'sedimentaer', sten: 'kalksten', kort: 'Hærdet kalkslam fra et varmt, lavt hav, ofte med fossiler.' },
  kridt: { navn: 'Skrivekridt', gruppe: 'sedimentaer', sten: 'kridt', kort: 'Kalkplader fra encellede alger – Danmarks undergrund er fuld af det.' },
  tagskifer: { navn: 'Tagskifer', gruppe: 'metamorf', sten: 'tagskifer', kort: 'Lersten omdannet ved lav temperatur: kløves i tynde plader.' },
  glimmerskifer: { navn: 'Glimmerskifer', gruppe: 'metamorf', sten: 'glimmerskifer', kort: 'Lersten omdannet ved middel temperatur: glimmeret glimter i lag.' },
  gnejs: { navn: 'Gnejs', gruppe: 'metamorf', sten: 'gnejs', kort: 'Høj temperatur: mineralerne er samlet i lyse og mørke bånd.' },
  migmatit: { navn: 'Migmatit', gruppe: 'metamorf', sten: 'migmatit', kort: 'Gnejs, der er begyndt at smelte: lyse årer af størknet smelte.' },
  kvartsit: { navn: 'Kvartsit', gruppe: 'metamorf', sten: 'kvartsit', kort: 'Sandsten, hvor kvartskornene er vokset sammen til en tæt, hård sten.' },
  marmor: { navn: 'Marmor', gruppe: 'metamorf', sten: 'marmor', kort: 'Kalksten, hvor kalkspatten er omkrystalliseret til større korn.' },
  eklogit: { navn: 'Eklogit', gruppe: 'metamorf', sten: 'eklogit', kort: 'Basalt fra havbunden omdannet ved meget højt tryk i en subduktionszone.' }
};

// De fem processer i kredsløbet. tid: typisk varighed og spænd i mio. år –
// størrelsesordener, ikke målinger fra et bestemt sted.
export const PROCESSER = {
  smeltning: { navn: 'Smeltning i kappen', kort: 'Trykket falder, når kappen stiger op, og en lille del af den smelter.' },
  stoerkning: { navn: 'Størkning', kort: 'Magmaen afkøles og krystalliserer. Langsom afkøling i dybet giver store korn, hurtig afkøling på overfladen små.' },
  erosion: { navn: 'Forvitring og erosion', kort: 'Vand, frost, planter og is bryder klippen ned. Floder, bølger, vind og is fører stykkerne væk.' },
  diagenese: { navn: 'Aflejring og sammenkitning', kort: 'Sedimentet aflejres i lag, begraves under nye lag, presses sammen og kittes af mineraler fra grundvandet.' },
  omdannelse: { navn: 'Omdannelse', kort: 'Tryk og varme dybt nede omdanner mineralerne, mens stenen er fast. Den smelter ikke.' },
  opsmeltning: { navn: 'Opsmeltning', kort: 'Bliver det varmt nok – eller kommer der vand til – begynder stenen at smelte til magma.' }
};

const T = (typisk, min, max) => ({ typisk, min, max });
const LAVA = T(0, 0, 0.001), PLUTON = T(0.1, 0.01, 1);
const OVERFLADE = T(1, 0.01, 10), DYBT = T(20, 5, 50);
const SAMMENKIT = T(10, 1, 50), OMDAN = T(10, 1, 30), SMELT = T(1, 0.1, 10);

// Overgange fra hver bjergart: proces, resultat, tid og stedet ved pladegrænserne.
export const OVERGANGE = {
  peridotit: [
    { proces: 'smeltning', til: 'magma-basaltisk', tid: T(1, 0.1, 5), sted: 'ryg', tekst: 'Under en spredningsryg stiger kappen op, trykket falder, og 10–20 % af den smelter.' },
    { proces: 'smeltning', til: 'magma-basaltisk', tid: T(1, 0.1, 5), sted: 'hotspot', tekst: 'Over en hotspot stiger varmt kappemateriale op og smelter delvis.' }
  ],
  'magma-basaltisk': [
    { proces: 'stoerkning', til: 'basalt', tid: LAVA, sted: 'ryg', tekst: 'Lavaen størkner på havbunden ved ryggen – på få timer til år. Små korn.' },
    { proces: 'stoerkning', til: 'gabbro', tid: PLUTON, sted: 'ryg', tekst: 'Magmaen størkner langsomt i magmakammeret under ryggen. Store korn.' }
  ],
  'magma-andesitisk': [
    { proces: 'stoerkning', til: 'andesit', tid: LAVA, sted: 'bue', tekst: 'Lavaen fra en stratovulkan størkner hurtigt. Små korn.' },
    { proces: 'stoerkning', til: 'diorit', tid: PLUTON, sted: 'buedyb', tekst: 'Magmaen størkner langsomt i et magmakammer under vulkanerne. Store korn.' }
  ],
  'magma-granitisk': [
    { proces: 'stoerkning', til: 'rhyolit', tid: LAVA, sted: 'bue', tekst: 'Den seje magma når overfladen i et eksplosivt udbrud og størkner hurtigt.' },
    { proces: 'stoerkning', til: 'granit', tid: PLUTON, sted: 'buedyb', tekst: 'Magmaen størkner langsomt flere km nede i skorpen. Store korn.' }
  ],
  basalt: [
    { proces: 'erosion', til: 'ler', tid: OVERFLADE, sted: 'sokkel', tekst: 'Basalt, der kommer op på land (fx på Island), forvitrer kemisk til ler.' },
    { proces: 'omdannelse', til: 'eklogit', tid: OMDAN, sted: 'subduktion', tekst: 'Havbunden trækkes ned i en subduktionszone. Ved over ca. 50 km dybde bliver basalten til tung eklogit.' }
  ],
  gabbro: [
    { proces: 'erosion', til: 'grus', tid: DYBT, sted: 'sokkel', tekst: 'Gabbro kommer kun til overfladen, hvis skorpen hæves, og det ovenover eroderes – fx hvor havbund presses op på land.' },
    { proces: 'omdannelse', til: 'eklogit', tid: OMDAN, sted: 'subduktion', tekst: 'Den nederste del af havbunden trækkes ned i subduktionszonen og omdannes ved meget højt tryk.' }
  ],
  andesit: [
    { proces: 'erosion', til: 'ler', tid: OVERFLADE, sted: 'sokkel', tekst: 'Vulkanens lava forvitrer; feldspat og mørke mineraler bliver til ler.' },
    { proces: 'erosion', til: 'grus', tid: OVERFLADE, sted: 'sokkel', tekst: 'Floder fra vulkanerne fører sten og grus ned mod lavlandet.' }
  ],
  diorit: [
    { proces: 'erosion', til: 'grus', tid: DYBT, sted: 'sokkel', tekst: 'Skorpen hæves, vulkanerne eroderes væk, og dioritten kommer frem.' },
    { proces: 'omdannelse', til: 'gnejs', tid: OMDAN, sted: 'bjergkaede', tekst: 'Når kontinenter støder sammen, presses dioritten ned og omdannes til gnejs.' }
  ],
  rhyolit: [
    { proces: 'erosion', til: 'ler', tid: OVERFLADE, sted: 'sokkel', tekst: 'Lavaen forvitrer til ler og lidt kvartssand.' }
  ],
  granit: [
    { proces: 'erosion', til: 'sand', tid: DYBT, sted: 'sokkel', tekst: 'Granitten hæves og eroderes. Kvartskornene holder og bliver til sand.' },
    { proces: 'erosion', til: 'ler', tid: DYBT, sted: 'sokkel', tekst: 'Feldspaten i granitten forvitrer kemisk til ler.' },
    { proces: 'omdannelse', til: 'gnejs', tid: OMDAN, sted: 'bjergkaede', tekst: 'I en bjergkæde presses granitten dybt ned og bliver stribet: granitgnejs.' },
    { proces: 'opsmeltning', til: 'magma-granitisk', tid: SMELT, sted: 'bjergkaede', tekst: 'Dybt i en fortykket bjergkæde bliver det så varmt, at granitten smelter igen.' }
  ],
  grus: [
    { proces: 'diagenese', til: 'konglomerat', tid: SAMMENKIT, sted: 'sokkel', tekst: 'Grus aflejres af hurtigt strømmende floder og kittes sammen.' }
  ],
  sand: [
    { proces: 'diagenese', til: 'sandsten', tid: SAMMENKIT, sted: 'sokkel', tekst: 'Sandet aflejres i floder, deltaer eller ved kysten, begraves og kittes.' }
  ],
  ler: [
    { proces: 'diagenese', til: 'lersten', tid: SAMMENKIT, sted: 'sokkel', tekst: 'Leret bundfælder i stille vand – på sokkelhavet eller i dybhavet – og presses sammen.' }
  ],
  kalkslam: [
    { proces: 'diagenese', til: 'kalksten', tid: SAMMENKIT, sted: 'sokkel', tekst: 'Kalkskaller i et varmt, lavt hav hober sig op og hærdes, fx bryozokalken ved Stevns.' },
    { proces: 'diagenese', til: 'kridt', tid: SAMMENKIT, sted: 'sokkel', tekst: 'Kalkplader fra alger drysser ned i et åbent, varmt hav. Danmarks skrivekridt er ca. 70 mio. år gammelt og stadig blødt.' }
  ],
  konglomerat: [
    { proces: 'erosion', til: 'grus', tid: OVERFLADE, sted: 'sokkel', tekst: 'Konglomeratet hæves og eroderes; stenene frigøres igen.' },
    { proces: 'omdannelse', til: 'kvartsit', tid: OMDAN, sted: 'bjergkaede', tekst: 'Et konglomerat af kvartsrige sten omdannes i en bjergkæde til kvartsit, hvor stenene er trukket ud til linser.' }
  ],
  sandsten: [
    { proces: 'erosion', til: 'sand', tid: OVERFLADE, sted: 'sokkel', tekst: 'Sandstenen hæves og eroderes. Kvartskornene bliver til sand igen.' },
    { proces: 'omdannelse', til: 'kvartsit', tid: OMDAN, sted: 'bjergkaede', tekst: 'Begravet dybt i en bjergkæde vokser kvartskornene sammen til kvartsit.' }
  ],
  lersten: [
    { proces: 'erosion', til: 'ler', tid: OVERFLADE, sted: 'sokkel', tekst: 'Lerstenen hæves, forvitrer og skylles ud som ler igen.' },
    { proces: 'omdannelse', til: 'tagskifer', tid: OMDAN, sted: 'bjergkaede', tekst: 'Svag opvarmning (ca. 200–400 °C) og tryk: lermineralerne lægger sig vinkelret på trykket.' }
  ],
  kalksten: [
    { proces: 'erosion', til: 'kalkslam', tid: OVERFLADE, sted: 'sokkel', tekst: 'Regnvand med CO₂ opløser kalken. Den føres til havet, hvor alger og dyr bygger nye skaller.' },
    { proces: 'omdannelse', til: 'marmor', tid: OMDAN, sted: 'bjergkaede', tekst: 'Opvarmet under tryk omkrystalliserer kalkspatten til marmor.' }
  ],
  kridt: [
    { proces: 'erosion', til: 'kalkslam', tid: OVERFLADE, sted: 'sokkel', tekst: 'Kridtet opløses af regnvand og bliver til nye skaller i havet.' },
    { proces: 'omdannelse', til: 'marmor', tid: OMDAN, sted: 'bjergkaede', tekst: 'Presset ned i en bjergkæde bliver kridtet til marmor.' }
  ],
  tagskifer: [
    { proces: 'omdannelse', til: 'glimmerskifer', tid: OMDAN, sted: 'bjergkaede', tekst: 'Dybere og varmere (ca. 400–600 °C): lermineralerne bliver til glimmer.' },
    { proces: 'erosion', til: 'ler', tid: DYBT, sted: 'sokkel', tekst: 'Bjergkæden eroderes, og skiferen forvitrer til ler.' }
  ],
  glimmerskifer: [
    { proces: 'omdannelse', til: 'gnejs', tid: OMDAN, sted: 'bjergkaede', tekst: 'Over ca. 600 °C samles mineralerne i lyse og mørke bånd: gnejs.' },
    { proces: 'erosion', til: 'ler', tid: DYBT, sted: 'sokkel', tekst: 'Bjergkæden hæves og eroderes; glimmer og ler skylles væk.' }
  ],
  gnejs: [
    { proces: 'omdannelse', til: 'migmatit', tid: OMDAN, sted: 'bjergkaede', tekst: 'Ved ca. 650–750 °C begynder de lyse mineraler at smelte i årer.' },
    { proces: 'erosion', til: 'sand', tid: DYBT, sted: 'sokkel', tekst: 'Bjergkæden eroderes ned til roden; gnejsens kvarts bliver til sand.' },
    { proces: 'opsmeltning', til: 'magma-granitisk', tid: SMELT, sted: 'bjergkaede', tekst: 'Gnejsen smelter, og smelten samler sig til granitisk magma.' }
  ],
  migmatit: [
    { proces: 'opsmeltning', til: 'magma-granitisk', tid: SMELT, sted: 'bjergkaede', tekst: 'Smelten fra mange årer samler sig og stiger op som granitisk magma.' },
    { proces: 'erosion', til: 'sand', tid: DYBT, sted: 'sokkel', tekst: 'Bjergkædens rod hæves og eroderes – som i Sverige og Norge.' }
  ],
  kvartsit: [
    { proces: 'erosion', til: 'sand', tid: DYBT, sted: 'sokkel', tekst: 'Kvartsitten er meget hård, men bliver til sidst til sand igen.' }
  ],
  marmor: [
    { proces: 'erosion', til: 'kalkslam', tid: DYBT, sted: 'sokkel', tekst: 'Marmoren hæves og opløses af regnvand; kalken bliver til nye skaller i havet.' }
  ],
  eklogit: [
    { proces: 'opsmeltning', til: 'magma-andesitisk', tid: SMELT, sted: 'subduktion', tekst: 'Pladen afgiver vand. Vandet sænker smeltepunktet i kappen ovenover, som smelter: andesitisk magma stiger op mod vulkanerne.' }
  ]
};
// Løse sedimenter og magma kan heller ikke stå stille for evigt, men har her kun de viste veje.

// Steder ved pladegrænserne. x, y: placering i snittet (viewBox 1000 × 520).
export const STEDER = {
  hotspot: { navn: 'Hotspot', x: 92, y: 118, eksempel: 'Hawaii, Island (sammen med ryggen), Oslo-riften for ca. 300 mio. år siden',
    tekst: 'En søjle af varmt kappemateriale stiger op og smelter delvis, når trykket falder. Basaltisk lava bygger skjoldvulkaner. Hvor en kontinental plade revner (en riftzone), kommer basalten op gennem sprækker, og den kan blande sig med smeltet skorpe.',
    dannes: ['basalt', 'scoria', 'diabas', 'rhombeporfyr', 'peridotit'] },
  ryg: { navn: 'Spredningsryg', x: 232, y: 148, eksempel: 'Den Midtatlantiske Ryg, Østpacifiske Ryg',
    tekst: 'Pladerne glider fra hinanden, kappen stiger op og smelter delvis. Basaltlava størkner på havbunden som pudelava, gange af diabas fylder sprækkerne, og gabbro størkner i magmakamrene nedenunder. Sådan dannes hele oceanbunden – lag for lag.',
    dannes: ['basalt', 'diabas', 'gabbro', 'peridotit'] },
  dybhav: { navn: 'Dybhavet', x: 335, y: 180, eksempel: 'Det centrale Stillehav og Atlanterhavet',
    tekst: 'Langt fra land drysser fint ler og skaller af plankton ned på havbunden – få mm til et par cm pr. 1000 år. Kalkskallerne bliver kun liggende, hvor havet er lavere end ca. 4–5 km; dybere nede opløses de. Havbunden bliver ældre, koldere og tungere, jo længere den kommer fra ryggen.',
    dannes: ['lerskifer'] },
  subduktion: { navn: 'Subduktionszone', x: 470, y: 330, eksempel: 'Japan, Andesbjergene, Marianergraven',
    tekst: 'Den tunge oceanplade glider ned under den anden plade. Trykket stiger hurtigere end temperaturen, fordi pladen er kold. Ved over ca. 50 km dybde bliver basalten til eklogit, og pladen afgiver vand til kappen ovenover.',
    dannes: ['eklogit'] },
  bue: { navn: 'Vulkanbue', x: 540, y: 62, eksempel: 'Andesbjergene, Japan, Indonesien',
    tekst: 'Vandet fra den nedadgående plade får kappen til at smelte. Magmaen stiger op, optager kisel fra skorpen og bliver sej og gasrig. Stratovulkanerne har eksplosive udbrud med aske og pimpsten.',
    dannes: ['andesit', 'rhyolit', 'obsidian', 'pimpsten', 'tuf', 'scoria'] },
  buedyb: { navn: 'Under vulkanerne', x: 560, y: 205, eksempel: 'Sierra Nevada (USA), batolitterne i Andesbjergene',
    tekst: 'Det meste af magmaen når aldrig op. Den størkner langsomt flere km nede i store magmakamre (plutoner) til grovkornet diorit og granit. Den sidste, vandrige rest trænger ud i sprækker som pegmatit.',
    dannes: ['granit', 'diorit', 'pegmatit'] },
  sokkel: { navn: 'Lavland, kyst og sokkelhav', x: 705, y: 112, eksempel: 'Danmark: skrivekridt, Stevns, moleret ved Limfjorden',
    tekst: 'Floderne fører sten, sand og ler fra bjergene ud til kysten og havet. Grus aflejres i hurtigt vand, sand ved kyster og i deltaer, ler i stille vand. I varme, lave have hober kalkskaller sig op. Lagene begraves og kittes langsomt til sten.',
    dannes: ['konglomerat', 'sandsten', 'lerskifer', 'kalksten', 'kridt', 'flint', 'moler', 'kul'] },
  bjergkaede: { navn: 'Bjergkæde', x: 880, y: 250, eksempel: 'Himalaya, Alperne, de skandinaviske fjelde for ca. 420 mio. år siden',
    tekst: 'Når to kontinenter støder sammen, presses skorpen sammen og fortykkes. Dybt i bjergkædens rod omdannes bjergarterne af tryk og varme – jo dybere, jo højere grad – og nederst kan skorpen smelte til granitisk magma.',
    dannes: ['tagskifer', 'glimmerskifer', 'gnejs', 'migmatit', 'kvartsit', 'marmor', 'granit', 'pegmatit'] }
};

// Sten fra stensamlingen, der indgår i «Hvor er stenen dannet?»: alle steder,
// hvor stenen typisk dannes, tæller som rigtigt svar. Ledeblokkenes porfyrer,
// Kinnediabas og kalktuf er udeladt: De knytter sig til ét bestemt sted
// eller til en kilde, ikke til en pladegrænse.
export function stederFor(sten) {
  return Object.entries(STEDER).filter(([, s]) => s.dannes.includes(sten)).map(([id]) => id);
}
export const QUIZSTEN = [...new Set(Object.values(STEDER).flatMap(s => s.dannes))];

// Udfordringer til «Stenens rejse».
export const MAAL = [
  { id: 'kvartsit', tekst: 'Fra granit til kvartsit', start: 'granit', slut: 'kvartsit' },
  { id: 'marmor', tekst: 'Fra kridt til marmor', start: 'kridt', slut: 'marmor' },
  { id: 'eklogit', tekst: 'Fra kappen til eklogit', start: 'peridotit', slut: 'eklogit' },
  { id: 'migmatit', tekst: 'Fra ler til migmatit', start: 'ler', slut: 'migmatit' },
  { id: 'rundt', tekst: 'Hele vejen rundt: magmatisk → sedimentær → metamorf → magmatisk', start: 'granit', slut: null }
];

// Er en rejse (liste af bjergarts-id'er) gennemført for målet?
export function opfyldt(maal, rejse) {
  if (rejse[0] !== maal.start) return false;
  if (maal.slut) return rejse.includes(maal.slut);
  const grupper = rejse.map(id => BJERGARTER[id].gruppe);
  const i = grupper.indexOf('sedimentaer'), j = grupper.indexOf('metamorf', i), k = grupper.indexOf('magmatisk', j);
  return i > 0 && j > i && k > j;
}

// Samlet typisk tid for en række overgange (mio. år).
export const samletTid = trin => trin.reduce((sum, o) => sum + o.tid.typisk, 0);

export function tidstekst({ typisk, min, max }) {
  const tal = x => x >= 1 ? x.toLocaleString('da-DK', { maximumFractionDigits: 0 }) : x >= 0.01 ? x.toLocaleString('da-DK', { maximumSignificantDigits: 1 }) : null;
  if (max <= 0.001) return 'timer til få år';
  if (typisk < 1) return `ca. ${Math.round(typisk * 1e6).toLocaleString('da-DK')} år (${Math.round(min * 1e6).toLocaleString('da-DK')}–${Math.round(max * 1e6).toLocaleString('da-DK')} år)`;
  return `ca. ${tal(typisk)} mio. år (${tal(min)}–${tal(max)})`;
}

// ---------- Afkøling og kornstørrelse ----------

// Afkølingstid for en plade af magma med tykkelsen h (m): t ≈ (h/2)² / κ, hvor
// κ ≈ 1·10⁻⁶ m²/s er stens termiske diffusivitet (Turcotte & Schubert,
// Geodynamics, kap. 4). Størrelsesorden: krystallisationsvarme, form og vand,
// der cirkulerer, kan ændre tiden et par gange.
export const KAPPA = 1e-6;
export const SEK_PR_AAR = 3.156e7;
export const afkoelingstid = h => (h / 2) ** 2 / KAPPA;

// Kornstørrelse (mm) som tommelfingerregel tilpasset kendte bjergarter:
// d = 0,3 mm · (t / 72 døgn)^0,21. Den giver ca. 0,3 mm i en 5 m tyk lavastrøm,
// 0,5–1 mm i en 20 m tyk gang og 3–8 mm i plutoner på 1–10 km.
// Under 0,05 mm kan kornene ikke ses; ved meget hurtig afkøling dannes glas.
const T0 = 72 * 86400;
export const kornstoerrelse = t => 0.3 * (t / T0) ** 0.21;

export const KROPPE = {
  lava: { navn: 'Lavastrøm på overfladen', min: 0.05, max: 30, start: 5, enhed: 'm' },
  gang: { navn: 'Gang i en sprække', min: 0.5, max: 100, start: 20, enhed: 'm' },
  pluton: { navn: 'Magmakammer dybt nede (pluton)', min: 200, max: 20000, start: 3000, enhed: 'm' }
};

export const MAGMAER = {
  basaltisk: { navn: 'Basaltisk', lava: 'basalt', gang: 'diabas', pluton: 'gabbro', glas: 'basaltglas',
    mineraler: [['plagioklas', '#e9e5da', .5], ['pyroxen', '#2c3a2f', .38], ['olivin', '#6f8a3a', .07], ['magnetit', '#111111', .05]] },
  granitisk: { navn: 'Granitisk', lava: 'rhyolit', gang: 'rhyolit', pluton: 'granit', glas: 'obsidian',
    mineraler: [['kvarts', '#bfc3c4', .3], ['kalifeldspat', '#e4a58c', .35], ['plagioklas', '#f2eee6', .25], ['biotit', '#1c1a18', .1]] }
};

export function kornklasse(d) {
  if (d < 0.05) return { navn: 'glas', tekst: 'glasagtig – ingen korn at se' };
  if (d < 1) return { navn: 'finkornet', tekst: 'finkornet – kornene kan næsten ikke ses' };
  if (d <= 5) return { navn: 'middelkornet', tekst: 'middelkornet (1–5 mm)' };
  return { navn: 'grovkornet', tekst: 'grovkornet (over 5 mm)' };
}

// Hele resultatet for en magma i et legeme med tykkelsen h (m).
export function stoerkn(magma, krop, h) {
  const t = afkoelingstid(h);
  const d = kornstoerrelse(t);
  const m = MAGMAER[magma];
  const klasse = kornklasse(d);
  const bjergart = klasse.navn === 'glas' ? m.glas : m[krop];
  return { t, d, klasse, bjergart };
}

export function tidsord(t) {
  const dage = t / 86400, aar = t / SEK_PR_AAR;
  const rund = x => x.toLocaleString('da-DK', { maximumSignificantDigits: x < 10 ? 1 : 2 });
  if (dage < 1 / 24) return `${rund(t / 60)} minutter`;
  if (dage < 1) return `${rund(t / 3600)} timer`;
  if (aar < 1) return `${rund(dage)} døgn`;
  if (aar < 1e6) return `${rund(aar)} år`;
  return `${rund(aar / 1e6)} mio. år`;
}
