/* ─────────────────────────────────────────────────────────
   Mineraler i stensamlingen.

   Én post pr. mineral. Felterne er beskrevet i LÆS-MIG.md.
   En ny sten er én ny post her — koden er gruppens bogstaver
   plus næste ledige nummer, og et nummer genbruges aldrig.
   ───────────────────────────────────────────────────────── */

export default [
  {
    id:'kvarts', kode:'MI-01', nr:[],
    navn:'Kvarts', andreNavne:['bjergkrystal','røgkvarts','ametyst'],
    type:'Silikat',
    kort:'Jordskorpens mest almindelige mineral — hårdt, glasglinsende og uden spaltning.',
    kendetegn:'Ridser glas uden besvær. Brækker med muslet brud som glas i stedet for at kløve i flader. Oftest klar, hvid eller grålig; i granit ligner det små grå glasstumper.',
    formel:'SiO₂', haardhed:'7', densitet:'2,65', streg:'hvid', glans:'glasglans',
    spaltning:'ingen — muslet brud',
    dannelse:'Krystalliserer sidst i en afkølende granitisk magma og i hydrotermale gange, hvor varmt vand afsætter kisel. Er så modstandsdygtigt, at det bliver tilbage, når andre mineraler forvitrer — derfor består det meste sand af kvarts.',
    findested:'Overalt: i granit, gnejs, sandsten og kvartsit. I Danmark som sandkorn og i ledeblokke; store krystaller fra Alperne og Brasilien.',
    anvendelse:'Glas, silicium til solceller og elektronik, kvartsure.',
    forveksles:'Calcit (ridses af kniv og bruser i syre) og feldspat (har plane spalteflader).',
    kend:{korn:['krystal'], syre:false, opbygning:['massiv'], haard:['glas'], farve:['lys']},
    farver:['#EDEAE3','#D8D4CC','#F7F5F0'], tegning:'krystal',
    placering:'', billeder:[
      {fil:'MI-01-kvarts-1.jpg', tekst:'Hvid mælkekvarts og små, klare kvartskrystaller'},
      {fil:'MI-01-kvarts-2.jpg', tekst:'Grålig kvarts med rødlige pletter. Klassesæt nr. 13'}
    ]
  },
  {
    id:'kalifeldspat', kode:'MI-02', nr:[],
    navn:'Kalifeldspat', andreNavne:['ortoklas','mikroklin'],
    type:'Silikat',
    kort:'Den laksefarvede feldspat, der giver granit sin røde farve.',
    kendetegn:'Rød, laksefarvet eller hvid. Blanke, plane spalteflader, der glimter, når man drejer stenen i lyset. Ridser glas.',
    formel:'KAlSi₃O₈', haardhed:'6', densitet:'2,56', streg:'hvid', glans:'glasglans',
    spaltning:'god i to retninger, næsten vinkelrette',
    dannelse:'Krystalliserer i kiselrig (felsisk) magma sammen med kvarts. Kæmpekrystaller dannes i pegmatitgange, hvor restsmelten er rig på vand.',
    findested:'Granit, pegmatit og gnejs. Almindelig i de røde granitter på Bornholm og i svenske ledeblokke på stranden.',
    anvendelse:'Porcelæn, glasur og keramik.',
    forveksles:'Plagioklas (oftest hvid-grå med fine parallelle striber på spaltefladen) og kvarts (ingen spalteflader).',
    kend:{korn:['krystal'], syre:false, opbygning:['massiv'], haard:['glas'], farve:['lys','roed']},
    farver:['#E9A58A','#F3C4AE','#D9876B'], tegning:'krystal',
    placering:'', billeder:[
      {fil:'MI-02-kalifeldspat-1.jpg', tekst:'Kødfarvet kalifeldspat med blanke spalteflader'},
      {fil:'MI-02-kalifeldspat-2.jpg', tekst:'Grå kalifeldspat (mikroklin). Samling nr. 9'}
    ]
  },
  {
    id:'plagioklas', kode:'MI-03', nr:[],
    navn:'Plagioklas', andreNavne:['kalknatronfeldspat','labradorit'],
    type:'Silikat',
    kort:'Den hvidgrå feldspat — findes i næsten alle magmatiske bjergarter.',
    kendetegn:'Hvid til grå, ofte med tynde, parallelle striber (tvillingstriber) på spaltefladen. Labradorit har et blåt farvespil.',
    formel:'NaAlSi₃O₈ – CaAl₂Si₂O₈', haardhed:'6–6,5', densitet:'2,6–2,8', streg:'hvid', glans:'glasglans',
    spaltning:'god i to retninger',
    dannelse:'Krystalliserer i både basisk og sur magma. Den kalkrige udgave dannes ved høj temperatur (gabbro, basalt), den natriumrige ved lavere (granit).',
    findested:'Gabbro, basalt, diorit, andesit og granit. Labradorit fra Norge (larvikit) og Labrador i Canada.',
    anvendelse:'Larvikit og labradorit bruges som facadesten og bordplader.',
    forveksles:'Kalifeldspat (rødlig, uden striber) og calcit (blødere, bruser i syre).',
    kend:{korn:['krystal'], syre:false, opbygning:['massiv'], haard:['glas'], farve:['lys']},
    farver:['#E4E6E4','#C9CDCB','#F2F3F1'], tegning:'krystal',
    placering:'', billeder:[]
  },
  {
    id:'muskovit', kode:'MI-04', nr:[],
    navn:'Muskovit', andreNavne:['lys glimmer','kaliglimmer'],
    type:'Silikat · glimmer',
    kort:'Lys glimmer, der kan flækkes i papirtynde, bøjelige blade.',
    kendetegn:'Sølvglinsende og næsten gennemsigtig. Kan pilles af i tynde, bøjelige flager med en neglespids.',
    formel:'KAl₂(AlSi₃O₁₀)(OH)₂', haardhed:'2–2,5', densitet:'2,8', streg:'hvid', glans:'perlemorsglans',
    spaltning:'perfekt i én retning',
    dannelse:'Krystalliserer i granit og pegmatit og dannes ved metamorfose af ler — derfor er glimmerskifer fuld af den.',
    findested:'Pegmatit, granit, glimmerskifer og gnejs. Små flager glimter i mange danske sandarter.',
    anvendelse:'Elektrisk isolering og som glimmerpigment i maling og kosmetik.',
    forveksles:'Biotit (samme form, men sort) og gips (ikke bøjelig, flækker ikke i så tynde blade).',
    kend:{korn:['krystal'], syre:false, opbygning:['skifret'], haard:['negl'], farve:['lys']},
    farver:['#E8E1CF','#CFC6AE','#F6F1E4'], tegning:'blade',
    placering:'', billeder:[]
  },
  {
    id:'biotit', kode:'MI-05', nr:[],
    navn:'Biotit', andreNavne:['mørk glimmer','magnesiaglimmer'],
    type:'Silikat · glimmer',
    kort:'Sort glimmer — de små blanke, sorte flager i granit.',
    kendetegn:'Sort eller mørkebrun, blank og flager af i tynde blade, når man piller i den med en kniv.',
    formel:'K(Mg,Fe)₃(AlSi₃O₁₀)(OH)₂', haardhed:'2,5–3', densitet:'2,9–3,4', streg:'hvid til grå', glans:'glasglans',
    spaltning:'perfekt i én retning',
    dannelse:'Krystalliserer i granit og diorit og dannes ved metamorfose af lerholdige sedimenter.',
    findested:'Granit, gnejs og glimmerskifer. Meget almindelig i danske ledeblokke.',
    anvendelse:'Bruges ikke meget selv, men forvitrer let og giver jorden kalium og jern.',
    forveksles:'Hornblende (hårdere, kløver ikke i blade).',
    kend:{korn:['krystal'], syre:false, opbygning:['skifret'], haard:['kniv','negl'], farve:['moerk']},
    farver:['#2E2A26','#4B4238','#1C1A18'], tegning:'blade',
    placering:'', billeder:[]
  },
  {
    id:'hornblende', kode:'MI-06', nr:[],
    navn:'Hornblende', andreNavne:['amfibol'],
    type:'Silikat · amfibol',
    kort:'Sort, stængelformet mineral med to spalteretninger i 124°.',
    kendetegn:'Sort til mørkegrøn, aflange krystaller med blanke spalteflader. Hårdere end biotit og flager ikke.',
    formel:'Ca₂(Mg,Fe)₄Al(AlSi₇O₂₂)(OH)₂', haardhed:'5–6', densitet:'3,0–3,4', streg:'grågrøn', glans:'glasglans',
    spaltning:'god i to retninger (ca. 56° og 124°)',
    dannelse:'Krystalliserer i intermediær magma (diorit, andesit) og dannes ved metamorfose af basalt til amfibolit.',
    findested:'Diorit, andesit, amfibolit og mange gnejser. Almindelig i ledeblokke fra Sverige og Norge.',
    anvendelse:'Amfibolit bruges som skærver og facadesten.',
    forveksles:'Augit (kortere, næsten retvinklet spaltning) og biotit (blød, flager).',
    kend:{korn:['krystal'], syre:false, opbygning:['massiv'], haard:['glas','kniv'], farve:['moerk']},
    farver:['#23302A','#35463C','#141A17'], tegning:'staengler',
    placering:'', billeder:[
      {fil:'MI-06-hornblende-1.jpg', tekst:'Sorte, blanke stykker hornblende. Klassesæt nr. 7'}
    ]
  },
  {
    id:'augit', kode:'MI-07', nr:[],
    navn:'Augit', andreNavne:['pyroxen'],
    type:'Silikat · pyroxen',
    kort:'Sort, kort og kantet mineral — det mørke i gabbro og basalt.',
    kendetegn:'Sort til mørkegrøn, korte søjleformede krystaller med to spalteretninger næsten i ret vinkel.',
    formel:'(Ca,Na)(Mg,Fe,Al)(Si,Al)₂O₆', haardhed:'5,5–6', densitet:'3,2–3,6', streg:'grågrøn', glans:'glasglans',
    spaltning:'god i to retninger (ca. 87° og 93°)',
    dannelse:'Krystalliserer tidligt i basisk magma, sammen med olivin og kalkrig plagioklas.',
    findested:'Gabbro, basalt og diabas. Fx i Bornholms diabasgange og i islandsk basalt.',
    anvendelse:'Ingen særlig — men en vigtig del af oceanbunden.',
    forveksles:'Hornblende (længere krystaller, spaltning i 124°).',
    kend:{korn:['krystal'], syre:false, opbygning:['massiv'], haard:['glas','kniv'], farve:['moerk']},
    farver:['#1E2320','#343B35','#0F1311'], tegning:'krystal',
    placering:'', billeder:[]
  },
  {
    id:'olivin', kode:'MI-08', nr:[],
    navn:'Olivin', andreNavne:['peridot','krysolit'],
    type:'Silikat',
    kort:'Olivengrønne, glasagtige korn — hovedmineralet i Jordens kappe.',
    kendetegn:'Flaske- til olivengrøn, glasglans og kornet. Ofte som grønne korn i basalt eller som en hel, sukkerkornet klump.',
    formel:'(Mg,Fe)₂SiO₄', haardhed:'6,5–7', densitet:'3,3–3,4', streg:'hvid', glans:'glasglans',
    spaltning:'dårlig — muslet brud',
    dannelse:'Krystalliserer først af alle i en afkølende basisk magma, ved over 1200 °C. Den øvre kappe består for det meste af olivin.',
    findested:'Peridotit, gabbro og basalt. Grønne olivinknolde i basalt fra Hawaii, Kanarieøerne og Eifel.',
    anvendelse:'Smykkesten (peridot), ildfaste sten og forsøg med CO₂-binding.',
    forveksles:'Grønt glas og grøn kvarts (hårdere, ikke kornet).',
    kend:{korn:['krystal','store'], syre:false, opbygning:['massiv'], haard:['glas'], farve:['groen']},
    farver:['#7F9A3A','#9DB451','#5E7629'], tegning:'korn',
    placering:'', billeder:[
      {fil:'MI-08-olivin-1.jpg', tekst:'Grønne olivinkorn med mørke og rødbrune korn imellem. Nr. 23'}
    ]
  },
  {
    id:'granat', kode:'MI-09', nr:[],
    navn:'Granat', andreNavne:['almandin','pyrop'],
    type:'Silikat',
    kort:'Mørkerøde, næsten kuglerunde krystaller med mange flader.',
    kendetegn:'Vinrød til rødbrun. Sidder som runde krystaller med 12 eller 24 flader i skifer og gnejs. Hård — ridser glas.',
    formel:'(Fe,Mg,Ca)₃Al₂(SiO₄)₃', haardhed:'6,5–7,5', densitet:'3,6–4,3', streg:'hvid', glans:'glasglans',
    spaltning:'ingen',
    dannelse:'Vokser under metamorfose ved højt tryk og høj temperatur — en granat i en skifer viser, at stenen har været dybt nede i skorpen.',
    findested:'Glimmerskifer, gnejs og eklogit. Granatrige ledeblokke fra Sverige; granatsand på vestkyststrande.',
    anvendelse:'Sandblæsning, slibepapir, vandskæring og smykker.',
    forveksles:'Rødt glas og rubin — men granat sidder næsten altid som runde krystaller i en metamorf sten.',
    kend:{korn:['krystal'], syre:false, opbygning:['massiv'], haard:['glas'], farve:['roed']},
    farver:['#7A1F2B','#9E2F3B','#551520'], tegning:'krystal',
    placering:'', billeder:[]
  },
  {
    id:'calcit', kode:'MI-10', nr:[],
    navn:'Calcit', andreNavne:['kalkspat','dobbeltspat'],
    type:'Karbonat',
    kort:'Kalkens mineral — bruser i syre og kløver i skæve terninger.',
    kendetegn:'Hvid eller klar. Kløver i rhomber (skæve terninger). Ridses let af en kniv og bruser med fortyndet saltsyre. Klar calcit (dobbeltspat) viser skrift dobbelt.',
    formel:'CaCO₃', haardhed:'3', densitet:'2,71', streg:'hvid', glans:'glasglans',
    spaltning:'perfekt i tre retninger (rhomber)',
    dannelse:'Udfældes fra vand og bygges ind i skaller og skeletter hos alger, muslinger og koraller. Hovedmineralet i kalksten, kridt og marmor.',
    findested:'Kalksten, kridt, marmor og drypsten. I Danmark i kridtet ved Stevns og Møns Klint og som krystaller i hulrum i flint og kalk.',
    anvendelse:'Cement, kalk til landbrug, kridt, fyldstof i papir og tandpasta.',
    forveksles:'Kvarts (ridser glas, bruser ikke) og gips (ridses af negl).',
    kend:{korn:['krystal'], syre:true, opbygning:['massiv'], haard:['kniv'], farve:['lys']},
    farver:['#F3EFE6','#E3DCCB','#FFFFFF'], tegning:'krystal',
    placering:'', billeder:[
      {fil:'MI-10-calcit-1.jpg', tekst:'Kalkspat, nr. 15 — bagerst et klart stykke dobbeltspat'}
    ]
  },
  {
    id:'gips', kode:'MI-11', nr:[],
    navn:'Gips', andreNavne:['alabast','marieglas','ørkenrose'],
    type:'Sulfat',
    kort:'Så blødt, at det kan ridses med en fingernegl.',
    kendetegn:'Hvid, klar eller rosa. Ridses af en negl og bruser ikke i syre. Findes som klare plader (marieglas), fibre eller rosetter (ørkenrose).',
    formel:'CaSO₄·2H₂O', haardhed:'2', densitet:'2,3', streg:'hvid', glans:'glas- til silkeglans',
    spaltning:'perfekt i én retning',
    dannelse:'Udfældes, når havvand eller søvand fordamper i et varmt og tørt klima — en evaporit ligesom stensalt.',
    findested:'Saltaflejringer i Nordtyskland og Polen, ørkener i Nordafrika. I den danske undergrund i Zechstein-saltet.',
    anvendelse:'Gipsplader, gipsbind og cement.',
    forveksles:'Calcit (hårdere, bruser i syre) og halit (smager salt, kløver i terninger).',
    kend:{korn:['krystal'], syre:false, opbygning:['skifret'], haard:['negl'], farve:['lys']},
    farver:['#F5F1EA','#E7DFD2','#FFFFFF'], tegning:'blade',
    placering:'', billeder:[
      {fil:'MI-11-gips-1.jpg', tekst:'Gips. Klassesæt nr. 43'},
      {fil:'MI-11-gips-2.jpg', tekst:'Hvid og grå gips med blanke flader. Klassesæt nr. 12'}
    ]
  },
  {
    id:'halit', kode:'MI-12', nr:[],
    navn:'Halit', andreNavne:['stensalt','køkkensalt'],
    type:'Halogenid',
    kort:'Stensalt — kløver i terninger og smager salt.',
    kendetegn:'Klar, hvid eller rødlig. Kløver i terninger med rette vinkler, er blød og opløses i vand. Smager salt (men smag ikke på samlingens sten).',
    formel:'NaCl', haardhed:'2,5', densitet:'2,16', streg:'hvid', glans:'glasglans',
    spaltning:'perfekt i tre retninger (terninger)',
    dannelse:'Udfældes, når havvand fordamper i lukkede bassiner. Tykke lag fra Zechstein-havet for ca. 255 mio. år siden ligger dybt under Danmark og har presset sig op som saltdiapirer.',
    findested:'Saltdiapiren ved Hvornum og saltværket ved Mariager, Nordtyskland, Polen.',
    anvendelse:'Køkkensalt, vejsalt og kemisk industri (klor og natronlud).',
    forveksles:'Calcit (kløver skævt, bruser i syre) og gips (ridses af negl, smager ikke salt).',
    kend:{korn:['krystal'], syre:false, opbygning:['massiv'], haard:['negl','kniv'], farve:['lys']},
    farver:['#F4EEEA','#E8D6CF','#FFFFFF'], tegning:'krystal',
    placering:'', billeder:[
      {fil:'MI-12-halit-1.jpg', tekst:'Klare til grålige stykker stensalt. Klassesæt nr. 9'}
    ]
  },
  {
    id:'pyrit', kode:'MI-13', nr:[],
    navn:'Pyrit', andreNavne:['svovlkis','kattesølv'],
    type:'Sulfid',
    kort:'Svovlkis — messinggule terninger, der ligner guld.',
    kendetegn:'Messinggul metalglans, ofte som terninger. Hård og giver en sortgrøn streg. Guld er blødt og giver gul streg.',
    formel:'FeS₂', haardhed:'6–6,5', densitet:'5,0', streg:'sortgrøn', glans:'metalglans',
    spaltning:'dårlig',
    dannelse:'Dannes i iltfri mudder, hvor bakterier omdanner sulfat til sulfid, og i hydrotermale gange.',
    findested:'Alunskifer på Bornholm, i kridt og ler (også som knolde) og i malmgange i Norge og Spanien.',
    anvendelse:'Tidligere til svovlsyre. Forvitrer til syre — okkerproblemer i vandløb, når pyritholdig jord drænes.',
    forveksles:'Guld (blødt, gul streg) og kobberkis (mere grøngul og blødere).',
    kend:{korn:['krystal'], syre:false, opbygning:['massiv'], haard:['glas'], farve:['metal']},
    farver:['#C9A94A','#E1C66A','#9C7F2E'], tegning:'krystal',
    placering:'', billeder:[]
  },
  {
    id:'magnetit', kode:'MI-14', nr:[],
    navn:'Magnetit', andreNavne:['magnetjernsten'],
    type:'Oxid',
    kort:'Sort jernmineral, der trækker i en magnet.',
    kendetegn:'Sort med metalglans, tung og magnetisk — en magnet hænger fast, eller et kompas slår ud.',
    formel:'Fe₃O₄', haardhed:'5,5–6,5', densitet:'5,2', streg:'sort', glans:'metalglans',
    spaltning:'ingen',
    dannelse:'Krystalliserer i basisk magma og i metamorfe bjergarter. Magnetitkorn i basalt husker magnetfeltets retning, da lavaen størknede — det er grundlaget for studiet af polvendinger.',
    findested:'Kiruna i Sverige (malm), gabbro, basalt og sort sand på strande.',
    anvendelse:'Jernmalm.',
    forveksles:'Hæmatit (rød streg, ikke magnetisk) og augit (ikke magnetisk, lettere).',
    kend:{korn:['krystal'], syre:false, opbygning:['massiv'], haard:['glas','kniv'], farve:['moerk','metal']},
    farver:['#2A2B2E','#45474C','#16171A'], tegning:'krystal',
    placering:'', billeder:[]
  },
  {
    id:'haematit', kode:'MI-15', nr:[],
    navn:'Hæmatit', andreNavne:['blodsten','rødjernsten'],
    type:'Oxid',
    kort:'Jernoxid med rødbrun streg — farver jord og sandsten røde.',
    kendetegn:'Sort-sølvgrå med metalglans eller rødbrun og jordagtig. Streg altid rødbrun. Ikke magnetisk.',
    formel:'Fe₂O₃', haardhed:'5–6', densitet:'5,3', streg:'rødbrun', glans:'metal- eller mat glans',
    spaltning:'ingen',
    dannelse:'Dannes, når jern iltes — i ørken- og tropejord, i båndet jernformation fra da ilten kom i atmosfæren, og i hydrotermale gange.',
    findested:'Båndet jernformation i Australien og Brasilien. Farver Nexø-sandsten og mange ørkensandsten røde.',
    anvendelse:'Jernmalm og rødt farvepigment (okker).',
    forveksles:'Magnetit (sort streg, magnetisk).',
    kend:{korn:['krystal','fine'], syre:false, opbygning:['massiv'], haard:['kniv','glas'], farve:['roed','metal']},
    farver:['#6B2F24','#8E4032','#3B1E1A'], tegning:'massiv',
    placering:'', billeder:[]
  },
  {
    id:'jernspat', kode:'MI-16', nr:[],
    navn:'Jernspat', andreNavne:['siderit'],
    type:'Karbonat',
    kort:'Jernets karbonat — brun, tung og kløver i skæve terninger som calcit.',
    kendetegn:'Lys- til mørkebrun, ofte med rustbrune flader, hvor overfladen er forvitret. Kløver i rhomber ligesom calcit, men føles tung i hånden. Ridses af kniv. Bruser kun svagt eller slet ikke i kold, fortyndet saltsyre — tydeligt først i varm syre.',
    formel:'FeCO₃', haardhed:'3,5–4,5', densitet:'3,9', streg:'hvid', glans:'glasglans til perleglans',
    spaltning:'perfekt i tre retninger (rhomber)',
    dannelse:'Udfældes fra varmt vand i hydrotermale gange og i iltfrit mudder, hvor jern bliver i opløsning i stedet for at ruste. Ved overfladen ilter jernet, og stenen får en brun skorpe af rust.',
    findested:'Kryolitbruddet ved Ivittuut i Sydvestgrønland, hvor den sad sammen med kryolitten. Store malmforekomster ved Erzberg i Østrig. Som knolde (lerjernsten) i ler og kullag.',
    anvendelse:'Jernmalm.',
    forveksles:'Calcit (lys, lettere og bruser kraftigt i kold syre) og hæmatit (rødbrun streg).',
    kend:{korn:['krystal'], opbygning:['massiv'], haard:['kniv'], farve:['moerk']},
    farver:['#6E4A2A','#8C6239','#3F2A17'], tegning:'krystal',
    placering:'', billeder:[
      {fil:'MI-16-jernspat-1.jpg', tekst:'Brune spaltestykker af jernspat med rustbrune flader'}
    ]
  }
];
