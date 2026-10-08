/* opgaver.js — opgavemodens trin: en lille tur gennem modellen, der giver
   begreberne reserve og ressource, R/P-forholdet og sammenhængen med pris
   og efterspørgsel.

   Hvert trin:
     titel       kort emne til mono-linjen
     tekst       opgaven, som eleven læser
     opstil      skydernes stilling, når trinnet åbnes (tiden nulstilles altid);
                 udelades en skyder, bliver den, hvor den står
     marked      «Markedet styrer» til eller fra
     maal(a, p, s)  sand, når eleven har gjort det, opgaven beder om
                 (a = aflæsningen, p = skyderne, s = modellens tilstand)
     forklaring  låses op, når målet er nået */

const STANDARD = { pris: 9000, teknologi: 0, efterforskning: 0.8, vaekst: 2.5, genanv: 30 };
const harMangel = s => s.historik.some(h => h.aar > 0 && h.mangel > 0.05);

export const OPGAVER = [
  {
    titel: 'Reserve og ressource',
    tekst: 'Kig på kassen. Bredden er hele ressourcen af kobber. Hvor stor er reserven, og hvor mange procent af ressourcen er det? Hvad skal der til, for at noget af ressourcen tæller som reserve?',
    opstil: STANDARD, marked: false,
    maal: () => true,
    forklaring: 'Reserven (1.000 mio. t) er kun ca. 18 % af ressourcen (5.600 mio. t). For at tælle som reserve skal kobberet både være kendt og kunne udvindes med fortjeneste ved den nuværende pris og teknologi. Resten er enten uopdaget eller for dyrt at udvinde.',
  },
  {
    titel: 'Prisen falder',
    tekst: 'Kobberprisen halveres. Sæt prisen ned på 4.500 USD/t. Hvad sker der med reserven og med R/P-forholdet? Er der forsvundet kobber fra undergrunden?',
    opstil: STANDARD, marked: false,
    maal: (a, p) => p.pris <= 4500,
    forklaring: 'Reserven falder til under en fjerdedel, men intet kobber er forsvundet. Det er bare flyttet ned i «kendt, ikke rentabel», fordi det koster mere at udvinde, end det kan sælges for. Reserven er altså et økonomisk begreb og ikke kun et geologisk. Læg også mærke til, at udvindingen stiger, når kobber bliver billigt, så R/P-forholdet falder ekstra meget.',
  },
  {
    titel: 'Prisen stiger',
    tekst: 'Find den laveste pris, hvor reserven er mindst 1.500 mio. t. Hvor meget skal prisen stige for at give 50 % mere reserve? Og hvad sker der, hvis I bliver ved med at hæve prisen?',
    opstil: STANDARD, marked: false,
    maal: a => a.reserve >= 1500,
    forklaring: 'Omkring 13.000 USD/t: Prisen skal stige mere end reserven. De billigste forekomster er allerede med, og hver ny forekomst, der bliver rentabel, er dyrere end den forrige. Derfor vokser reserven langsommere og langsommere, jo højere prisen bliver.',
  },
  {
    titel: 'Ny teknologi',
    tekst: 'Prisen står fast på 9.000 USD/t. Kan I få reserven op på 1.500 mio. t uden at røre prisen?',
    opstil: STANDARD, marked: false,
    maal: (a, p) => a.reserve >= 1500 && p.pris === 9000,
    forklaring: 'Ja, med ca. 35 % billigere udvinding. Bedre teknologi, fx større maskiner eller bedre metoder til at få metallet ud af malmen, flytter grænsen for det rentable nedad på samme måde som en højere pris. Lavgradig malm, der før var affald, bliver til reserve.',
  },
  {
    titel: 'Pris og efterspørgsel',
    tekst: 'Sæt prisen op på 18.000 USD/t, og hold øje med instrumentet Udvinding. Hvorfor bliver der brudt mindre kobber, når prisen stiger? Hvad gør det ved R/P-forholdet?',
    opstil: STANDARD, marked: false,
    maal: (a, p) => p.pris >= 18000,
    forklaring: 'Når kobber bliver dyrt, køber man mindre af det. Man sparer, genbruger mere eller skifter til andre materialer (substitution), fx aluminium i ledninger. Efterspørgslen falder, og R/P-forholdet stiger af to grunde på én gang: Reserven bliver større, og produktionen bliver mindre.',
  },
  {
    titel: 'Genanvendelse',
    tekst: 'Prisen er tilbage på 9.000 USD/t. Skru genanvendelsen op til 60 %. Hvad sker der med udvindingen og med R/P-forholdet? Hvorfor ændrer selve reserven sig ikke?',
    opstil: STANDARD, marked: false,
    maal: (a, p) => p.genanv >= 60,
    forklaring: 'Genanvendt kobber dækker en større del af forbruget, så der skal brydes mindre i minerne. R/P-forholdet stiger fra ca. 45 til ca. 78 år, men reserven i undergrunden er den samme. Det er den cirkulære materialestrøm: Råstoffet bruges igen i stedet for at blive brudt på ny.',
  },
  {
    titel: 'R/P som prognose',
    tekst: 'Nu står forbruget stille (0 % vækst), og der efterforskes ikke. Aflæs R/P-forholdet, og tryk ▶ Kør tiden. Kommer manglen, når R/P-forholdet sagde, den ville?',
    opstil: { ...STANDARD, vaekst: 0, efterforskning: 0 }, marked: false,
    maal: (a, p, s) => harMangel(s),
    forklaring: 'Ja, næsten præcist: R/P var 45 år, og manglen kommer i år 44. R/P-forholdet passer kun, når alt står stille: samme forbrug, ingen nye fund, samme pris og samme teknologi. Det sker næsten aldrig i virkeligheden.',
  },
  {
    titel: 'Forbruget vokser',
    tekst: 'Forbruget vokser nu med 2,5 % om året, men der efterforskes stadig ikke. Kør tiden igen. Hvornår kommer manglen nu, og hvorfor passer R/P-forholdet fra år 0 ikke længere?',
    opstil: { ...STANDARD, efterforskning: 0 }, marked: false,
    maal: (a, p, s) => harMangel(s),
    forklaring: 'Manglen kommer allerede omkring år 30. R/P-forholdet regner med dagens produktion, men når forbruget vokser, tæres reserven hurtigere op for hvert år. En voksende global middelklasse og den grønne omstilling får netop forbruget af kobber til at vokse.',
  },
  {
    titel: 'Markedet styrer',
    tekst: 'Alt er tilbage ved udgangspunktet, og «Markedet styrer» er slået til: Prisen stiger, når reserven bliver knap. Kør mindst 50 år. Følg prisen, reserven og R/P-forholdet. Hvorfor vokser reserven, selvom vi bruger mere og mere kobber? Varer det ved?',
    opstil: STANDARD, marked: true,
    maal: (a, p, s) => s.aar >= 50,
    forklaring: 'Når reserven bliver knap, stiger prisen. Så bliver flere forekomster rentable, der efterforskes mere, og forbruget dæmpes. Derfor holder R/P-forholdet sig omkring 35 år i årtier. Det er grunden til, at verden endnu ikke er løbet tør for et råstof. Men ressourcen er ikke uendelig: Når prisen ikke kan stige mere, og de billige forekomster er brugt, kommer manglen alligevel.',
  },
];
