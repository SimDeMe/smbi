/* ─────────────────────────────────────────────────────────
   Magmatiske bjergarter — størknet magma og lava.

   Én post pr. bjergart. Felterne er beskrevet i LÆS-MIG.md.
   `mineraler` peger på et mineral med `id`, hvis det findes i
   samlingen (så bliver det et link), ellers med `navn`.
   ───────────────────────────────────────────────────────── */

export default [
  {
    id:'granit', kode:'MA-01', nr:[],
    navn:'Granit', andreNavne:[],
    type:'Dybbjergart · sur',
    kort:'Grovkornet, lys og spættet — kontinenternes typiske bjergart.',
    kendetegn:'Store korn, der alle er til at se: grå glasagtig kvarts, rød eller hvid feldspat og små sorte flager af biotit. Kornene ligger hulter til bulter uden retning.',
    kornstoerrelse:'1–10 mm', densitet:'2,6–2,7',
    mineraler:[{id:'kvarts',andel:'20–40 %'},{id:'kalifeldspat',andel:'30–50 %'},{id:'plagioklas',andel:'10–30 %'},{id:'biotit',andel:'< 10 %'},{id:'muskovit'}],
    dannelse:'Kiselrig magma, der størkner langsomt flere kilometer nede i skorpen. Den langsomme afkøling giver kornene tid til at vokse sig store. Dannes især over subduktionszoner og ved bjergkædedannelse, hvor kontinental skorpe smelter.',
    findested:'Bornholm (Rønne-, Vang- og Hammergranit), Sverige og Norge. En af de mest almindelige ledeblokke på danske strande og marker.',
    anvendelse:'Kantsten, brosten, gravsten, bordplader og skærver.',
    forveksles:'Gnejs (samme mineraler, men stribet) og diorit (mørkere, næsten uden kvarts).',
    kend:{korn:['store'], syre:false, opbygning:['massiv'], haard:['glas'], farve:['spaettet','lys','roed']},
    farver:['#D98E73','#EFE7DC','#2B2724','#B8B2A8'], tegning:'grovkornet',
    se:[{tekst:'Øvelse: bjergarternes densitet', href:'/Øvelser/Geografi/bjergarters-densitet/bjergarters-densitet.html'}],
    placering:'', billeder:[
      {fil:'MA-01-granit-1.jpg', tekst:'Grovkornet granit — lyse korn med spredte sorte'}
    ]
  },
  {
    id:'pegmatit', kode:'MA-02', nr:[],
    navn:'Pegmatit', andreNavne:[],
    type:'Gangbjergart · sur',
    kort:'Granit med kæmpekorn — krystaller på flere centimeter.',
    kendetegn:'Samme mineraler som granit, men kornene er fra 2–3 cm og op til flere meter. Ofte store plader af glimmer og kvarts, der vokser ind i feldspaten.',
    kornstoerrelse:'> 2 cm', densitet:'2,6',
    mineraler:[{id:'kalifeldspat'},{id:'kvarts'},{id:'muskovit'},{id:'biotit'}],
    dannelse:'Den sidste, vandrige rest af en granitisk magma trænger ud i sprækker. Vandet gør smelten tyndtflydende, så ionerne let vandrer hen til få, store krystaller.',
    findested:'Gange i granit og gnejs på Bornholm og i Sverige og Norge. Som ledeblokke.',
    anvendelse:'Kilde til feldspat, glimmer og sjældne grundstoffer som lithium og tantal.',
    forveksles:'Granit (mindre korn).',
    kend:{korn:['store'], syre:false, opbygning:['massiv'], haard:['glas'], farve:['spaettet','lys','roed']},
    farver:['#E6A488','#F1ECE4','#C9C3B9','#3A332D'], tegning:'kaempekorn',
    placering:'', billeder:[]
  },
  {
    id:'diorit', kode:'MA-03', nr:[],
    navn:'Diorit', andreNavne:[],
    type:'Dybbjergart · intermediær',
    kort:'Grovkornet og «salt og peber»-farvet — hvid plagioklas og sort hornblende.',
    kendetegn:'Hvide og sorte korn i omtrent lige mængder. Næsten ingen kvarts og ingen rød feldspat.',
    kornstoerrelse:'1–5 mm', densitet:'2,8–2,9',
    mineraler:[{id:'plagioklas',andel:'50–60 %'},{id:'hornblende',andel:'20–40 %'},{id:'biotit'},{id:'kvarts',andel:'< 5 %'}],
    dannelse:'Intermediær magma — typisk over subduktionszoner — der størkner langsomt i dybet. Dybdeudgaven af andesit.',
    findested:'Sverige, Norge og Andesbjergene. Som ledeblok i Danmark.',
    anvendelse:'Bygningssten og skærver.',
    forveksles:'Gabbro (mørkere, pyroxen) og granit (lysere, kvarts og rød feldspat).',
    kend:{korn:['store'], syre:false, opbygning:['massiv'], haard:['glas'], farve:['spaettet']},
    farver:['#ECECE8','#23262A','#8E9290'], tegning:'grovkornet',
    placering:'skuffen «Udbrudsprodukter 1»', billeder:[
      {fil:'MA-03-diorit-1.jpg', tekst:'Grå, middel- til finkornet bjergart med sorte og hvide korn (bestemmelsen er usikker)'}
    ]
  },
  {
    id:'gabbro', kode:'MA-04', nr:[],
    navn:'Gabbro', andreNavne:[],
    type:'Dybbjergart · basisk',
    kort:'Grovkornet og mørk — dybdeudgaven af basalt.',
    kendetegn:'Mørkegrå til sort-grønlig med synlige korn af grå plagioklas og sort pyroxen. Tung i hånden.',
    kornstoerrelse:'1–5 mm', densitet:'2,9–3,1',
    mineraler:[{id:'plagioklas',andel:'40–60 %'},{id:'augit',andel:'30–50 %'},{id:'olivin'},{id:'magnetit'}],
    dannelse:'Basisk magma fra kappen, der størkner langsomt i dybet. Udgør den nederste del af oceanbundspladen under basalten.',
    findested:'Oceanbundsskorpe, der er skubbet op på land (ophiolitter i Oman og på Cypern), Norge og Sverige.',
    anvendelse:'Facadesten og gravsten (sælges ofte som «sort granit»).',
    forveksles:'Diorit (lysere, hornblende) og basalt (finkornet).',
    kend:{korn:['store'], syre:false, opbygning:['massiv'], haard:['glas'], farve:['moerk','spaettet']},
    farver:['#2C302E','#6F746F','#141816'], tegning:'grovkornet',
    placering:'', billeder:[]
  },
  {
    id:'peridotit', kode:'MA-05', nr:[],
    navn:'Peridotit', andreNavne:['dunit','lherzolit'],
    type:'Dybbjergart · ultrabasisk',
    kort:'Grøn og tung — det stof, Jordens øvre kappe er lavet af.',
    kendetegn:'Olivengrøn til mørkegrøn, sukkerkornet og tung. Forvitrer på overfladen til en brunlig skorpe.',
    kornstoerrelse:'1–5 mm', densitet:'3,2–3,4',
    mineraler:[{id:'olivin',andel:'> 40 %'},{id:'augit'},{navn:'orthopyroxen'},{navn:'spinel'}],
    dannelse:'Størknet dybt nede eller blot en rest af kappen, der er ført op til overfladen — som knolde i basalt eller som skiver af kappe, der er skubbet op ved pladekollisioner.',
    findested:'Knolde i basalt (Hawaii, Kanarieøerne), ophiolitter (Oman, Cypern) og Norges vestkyst.',
    anvendelse:'Ildfaste sten og forsøg med at binde CO₂ i olivin.',
    forveksles:'Eklogit (røde granater) og serpentinit (blødere, fedtet glans).',
    kend:{korn:['store','fine'], syre:false, opbygning:['massiv'], haard:['glas'], farve:['groen','moerk']},
    farver:['#6E8036','#8FA14A','#3F4A24'], tegning:'finkornet',
    se:[{tekst:'Øvelse: bjergarternes densitet', href:'/Øvelser/Geografi/bjergarters-densitet/bjergarters-densitet.html'}],
    placering:'', billeder:[
      {fil:'MA-05-peridotit-1.jpg', tekst:'Tre stykker grøn peridotit'}
    ]
  },
  {
    id:'rhombeporfyr', kode:'MA-06', nr:[],
    navn:'Rhombeporfyr', andreNavne:[],
    type:'Dagbjergart · porfyrisk',
    kort:'Tæt grundmasse med feldspatkrystaller formet som rhomber — Oslo-feltets kendingssten.',
    kendetegn:'Brun, grå eller grønlig finkornet grundmasse med store lyse feldspatkrystaller, der i snit ligner skæve firkanter (rhomber).',
    kornstoerrelse:'grundmasse < 1 mm, krystaller 1–3 cm', densitet:'2,7',
    mineraler:[{id:'kalifeldspat',andel:'store krystaller'},{id:'plagioklas'},{id:'augit'}],
    dannelse:'Lava fra Oslo-riften for ca. 290 mio. år siden. Feldspatkrystallerne voksede i magmakammeret, før resten af smelten størknede hurtigt på overfladen.',
    findested:'Kun fast klippe i Oslo-feltet i Norge — derfor en ledeblok: finder man den i Danmark, er den ført hertil af isen fra Norge.',
    anvendelse:'Ledeblok, der viser isens vej.',
    forveksles:'Andre porfyrer, men rhombeformen er helt sin egen.',
    kend:{korn:['fine','store'], syre:false, opbygning:['porfyr','massiv'], haard:['glas'], farve:['moerk','spaettet']},
    farver:['#5B4E45','#E6D9C4','#3E352F'], tegning:'porfyr',
    placering:'skuffen «Udbrudsprodukter 1»', billeder:[
      {fil:'MA-06-rhombeporfyr-1.jpg', tekst:'Mørk grundmasse med rosa feldspatkrystaller — flere har rhombeform'}
    ]
  },
  {
    id:'rhyolit', kode:'MA-07', nr:[],
    navn:'Rhyolit', andreNavne:['kvartsporfyr'],
    type:'Dagbjergart · sur',
    kort:'Finkornet udgave af granit — lys og ofte rødlig.',
    kendetegn:'Lys, rødlig eller grå, så finkornet at kornene ikke kan ses. Ofte strømningsstriber og enkelte små krystaller af kvarts og feldspat.',
    kornstoerrelse:'< 1 mm', densitet:'2,4–2,6',
    mineraler:[{id:'kvarts'},{id:'kalifeldspat'},{id:'plagioklas'},{navn:'glas'}],
    dannelse:'Kiselrig og sej magma, der når overfladen og størkner hurtigt. Udbruddene er eksplosive (se stratovulkaner).',
    findested:'Island, Yellowstone og som ledeblokke fra Småland og Dalarna (Dalarna-porfyr).',
    anvendelse:'Ledeblokke; tidligere til redskaber.',
    forveksles:'Andesit (mørkere) og kvartsit (sukkerkornet, ingen strøm-striber).',
    kend:{korn:['fine'], syre:false, opbygning:['massiv','lagdelt','porfyr'], haard:['glas'], farve:['lys','roed']},
    farver:['#C98B7A','#E3B9A8','#9E6556'], tegning:'finkornet',
    se:[{tekst:'Simulering: vulkanudbrud', href:'/geografi/vulkanudbrud.html'}],
    placering:'', billeder:[
      {fil:'MA-07-rhyolit-1.jpg', tekst:'Lysegrå, finkornet rhyolit — enkelte med små lyse krystaller'}
    ]
  },
  {
    id:'andesit', kode:'MA-08', nr:[],
    navn:'Andesit', andreNavne:[],
    type:'Dagbjergart · intermediær',
    kort:'Grå, finkornet lava fra vulkanerne over subduktionszoner.',
    kendetegn:'Middelgrå til mørkegrå og finkornet, ofte med små lyse krystaller af plagioklas og sorte stænger af hornblende.',
    kornstoerrelse:'< 1 mm (med enkelte større krystaller)', densitet:'2,5–2,8',
    mineraler:[{id:'plagioklas'},{id:'hornblende'},{id:'augit'},{id:'biotit'}],
    dannelse:'Lava fra stratovulkaner over subduktionszoner. Magmaen er sejere end basalt, så udbruddene er ofte eksplosive.',
    findested:'Andesbjergene (navnet), Japan, Indonesien og Vestamerikas vulkaner.',
    anvendelse:'Skærver og bygningssten.',
    forveksles:'Basalt (mørkere, tungere) og rhyolit (lysere).',
    kend:{korn:['fine'], syre:false, opbygning:['massiv','porfyr'], haard:['glas'], farve:['moerk']},
    farver:['#6D6E6C','#8C8D8A','#4A4B49'], tegning:'porfyr',
    se:[{tekst:'Simulering: vulkanudbrud', href:'/geografi/vulkanudbrud.html'}],
    placering:'', billeder:[]
  },
  {
    id:'basalt', kode:'MA-09', nr:[],
    navn:'Basalt', andreNavne:['diabas (grovere gangudgave)'],
    type:'Dagbjergart · basisk',
    kort:'Sort, finkornet og tung — oceanbundens bjergart.',
    kendetegn:'Mørkegrå til sort og så finkornet, at kornene ikke kan ses. Ofte med små huller efter gasbobler og grønne korn af olivin. Tungere end granit.',
    kornstoerrelse:'< 1 mm', densitet:'2,9–3,0',
    mineraler:[{id:'plagioklas',andel:'45–55 %'},{id:'augit',andel:'30–40 %'},{id:'olivin'},{id:'magnetit'}],
    dannelse:'Tyndtflydende, kiselfattig magma fra kappen, der størkner hurtigt på overfladen. Dannes ved de midtoceaniske rygge og ved hotspots — ved skjoldvulkaner som på Island og Hawaii.',
    findested:'Island, Færøerne, Hawaii og Grønland. Diabasgange på Bornholm. Basaltsøjler ved Giant’s Causeway i Nordirland.',
    anvendelse:'Stenuld (Rockwool smelter basalt), skærver og brosten.',
    forveksles:'Andesit (lysere) og gabbro (grovkornet).',
    kend:{korn:['fine'], syre:false, opbygning:['massiv','huller'], haard:['glas'], farve:['moerk']},
    farver:['#2B2C2E','#3F4144','#1A1B1C'], tegning:'finkornet',
    se:[{tekst:'Simulering: vulkanudbrud', href:'/geografi/vulkanudbrud.html'},{tekst:'Øvelse: bjergarternes densitet', href:'/Øvelser/Geografi/bjergarters-densitet/bjergarters-densitet.html'}],
    placering:'skuffen «Udbrudsprodukter 1»', billeder:[
      {fil:'MA-09-basalt-1.jpg', tekst:'Mørk, finkornet basalt — nogle stykker med rustbrun overflade'},
      {fil:'MA-09-basalt-2.jpg', tekst:'Diabas fra Bornholm — den grovere gangudgave af basalt'}
    ]
  },
  {
    id:'obsidian', kode:'MA-10', nr:[],
    navn:'Obsidian', andreNavne:['vulkansk glas'],
    type:'Dagbjergart · vulkansk glas',
    kort:'Sort, blankt vulkansk glas med skarpe, muslede brudflader.',
    kendetegn:'Sort eller mørkebrun, glasblank og uden korn. Brækker med muslet brud og knivskarpe kanter.',
    kornstoerrelse:'ingen korn — glas', densitet:'2,3–2,6',
    mineraler:[{navn:'vulkansk glas (ca. 70 % SiO₂)'}],
    dannelse:'Kiselrig lava, der størkner så hurtigt, at atomerne ikke når at ordne sig i krystaller.',
    findested:'Island, De Liparske Øer, Tyrkiet og Mexico.',
    anvendelse:'Stenalderens knive og pilespidser; i dag kirurgiske skalpeller.',
    forveksles:'Flint (mat, ikke glasblank) og slagger fra industrien (ofte med bobler).',
    kend:{korn:['ingen'], syre:false, opbygning:['massiv'], haard:['glas'], farve:['moerk']},
    farver:['#111214','#2A2C31','#050506'], tegning:'glas',
    placering:'', billeder:[
      {fil:'MA-10-obsidian-1.jpg', tekst:'Sort, glasblank obsidian med muslet brud'}
    ]
  },
  {
    id:'pimpsten', kode:'MA-11', nr:[],
    navn:'Pimpsten', andreNavne:['pumice'],
    type:'Dagbjergart · vulkansk',
    kort:'Lys og fuld af gasblærer — så let, at den kan flyde.',
    kendetegn:'Lysegrå eller hvid, skumagtig og meget let. Kan flyde på vand, fordi blærerne er lukkede.',
    kornstoerrelse:'glas med blærer', densitet:'< 1 (med luft)',
    mineraler:[{navn:'vulkansk glas'}],
    dannelse:'Gasrig, kiselrig magma, der skummer op, når trykket falder under et eksplosivt udbrud. Glasset størkner, mens boblerne stadig er i det.',
    findested:'Vulkaner som Vesuv, Santorini og Island. Driver i land på strande efter store udbrud.',
    anvendelse:'Hård hud-sten, slibemiddel og letbeton.',
    forveksles:'Slagger fra basalt (mørk og tung, bobler åbne).',
    kend:{korn:['ingen'], syre:false, opbygning:['huller'], haard:['kniv','glas'], farve:['lys']},
    farver:['#E5E2DA','#CFCBC1','#F4F2EC'], tegning:'blaerer',
    se:[{tekst:'Simulering: vulkanudbrud', href:'/geografi/vulkanudbrud.html'}],
    placering:'', billeder:[]
  },
  {
    id:'tuf', kode:'MA-12', nr:[],
    navn:'Tuf', andreNavne:['vulkansk tuf'],
    type:'Pyroklastisk bjergart',
    kort:'Sammenkittet vulkansk aske — på grænsen mellem magmatisk og sedimentær.',
    kendetegn:'Let, porøs og ofte lys, gullig eller grå. Består af små askekorn og splinter af pimpsten og sten, der er kittet sammen.',
    kornstoerrelse:'< 2 mm (aske) til cm-store stykker', densitet:'1,5–2,3',
    mineraler:[{navn:'vulkansk glas'},{id:'plagioklas'},{id:'kvarts'}],
    dannelse:'Aske og stykker fra et eksplosivt udbrud falder ned eller flyder som en glødesky og kittes sammen. Tynde askelag i Moleret i Limfjorden stammer fra vulkaner for ca. 55 mio. år siden.',
    findested:'Italien, De Kanariske Øer og Island. Askelag i moleret på Mors og Fur.',
    anvendelse:'Bygningssten i Rom og i kirker i Rhinlandet.',
    forveksles:'Sandsten (tungere, afrundede korn) og kalktuf (bruser i syre).',
    kend:{korn:['fine'], syre:false, opbygning:['massiv','lagdelt','huller'], haard:['kniv'], farve:['lys']},
    farver:['#D8CBAE','#B8A987','#EFE6D2'], tegning:'finkornet',
    placering:'', billeder:[]
  },
  {
    id:'porfyr', kode:'MA-13', nr:[],
    navn:'Porfyr', andreNavne:['kvartsporfyr', 'feldspatporfyr'],
    type:'Dagbjergart · porfyrisk',
    kort:'Tæt, brunlig grundmasse med lyse feldspatkrystaller som spredte pletter.',
    kendetegn:'Rød-, lilla- eller olivenbrun grundmasse så finkornet, at kornene ikke kan ses, med skarpt afgrænsede, lyse krystaller på op til et par centimeter. Ofte med små huller. Som ledeblok er den tit rundslidt af is og vand.',
    kornstoerrelse:'grundmasse < 1 mm, krystaller 0,5–3 cm', densitet:'2,6–2,7',
    mineraler:[{id:'kalifeldspat',andel:'store krystaller'},{id:'plagioklas'},{id:'kvarts'}],
    dannelse:'Kiselrig lava, der er begyndt at krystallisere i magmakammeret, så de første, store feldspatkrystaller flyder i smelten. Resten størkner hurtigt på overfladen til en tæt grundmasse. Hullerne er gasbobler, der blev fanget i lavaen.',
    findested:'Fast klippe i Sverige, på Åland og i havbunden i Østersøen. Fundet i Danmark som ledeblok, ført hertil af isen.',
    anvendelse:'Ledeblok, der viser isens vej. Pyntesten og skærver.',
    forveksles:'Rhombeporfyr (rhombeformede krystaller i grå eller brun grundmasse) og granit (grovkornet hele vejen igennem).',
    kend:{korn:['fine','store'], syre:false, opbygning:['porfyr','huller'], haard:['glas'], farve:['moerk','spaettet','roed']},
    farver:['#6B4A4E','#D9CFA6','#4A3236'], tegning:'porfyr',
    se:[{tekst:'Simulering: vulkanudbrud', href:'/geografi/vulkanudbrud.html'}],
    placering:'skuffen «Udbrudsprodukter 1»', billeder:[
      {fil:'MA-13-porfyr-1.jpg', tekst:'Rundslidt porfyr med gullige feldspatkrystaller i mørk, rødbrun grundmasse'},
      {fil:'MA-13-porfyr-2.jpg', tekst:'Olivenbrun grundmasse med lyse, aflange krystaller og små gasblærer'},
      {fil:'MA-13-porfyr-3.jpg', tekst:'Lillabrun porfyr — krystallerne ligger tæt og i alle retninger'},
      {fil:'MA-13-porfyr-4.jpg', tekst:'Samme slags porfyr slået i stykker: rødlig, ens grundmasse med huller og enkelte krystaller'}
    ]
  },
  {
    id:'paaskallavikporfyr', kode:'MA-14', nr:['klassesæt-110'],
    navn:'Påskallavikporfyr', andreNavne:['Påskallavik porfyr'],
    type:'Porfyr · ledeblok',
    kort:'Mørk porfyr fra Småland med røde og hvide feldspatkorn.',
    kendetegn:'Mørkegrå til sortgrå grundmasse med spredte, rødbrune og hvidlige feldspatkorn. Brudfladen glimter af små flader i feldspaten, og den forvitrede overflade er lysere og mere brunlig end det friske indre.',
    kornstoerrelse:'grundmasse < 1–2 mm, feldspatkorn op til ca. 1 cm', densitet:'2,7',
    mineraler:[{id:'kalifeldspat'},{id:'plagioklas'},{id:'kvarts'},{id:'biotit'}],
    dannelse:'Kiselrig magma, hvor de første feldspatkrystaller voksede i smelten, før resten størknede til en finere grundmasse. Stenen stammer fra det prækambriske grundfjeld i Småland.',
    findested:'Påskallavik ved Kalmarsund i Småland, Sydsverige. Som ledeblok i det østlige Danmark.',
    anvendelse:'Ledeblok, der viser isens vej.',
    forveksles:'Granit (lysere og mere ensartet grovkornet) og andre porfyrer, f.eks. rhombeporfyr.',
    kend:{korn:['store'], syre:false, opbygning:['porfyr','massiv'], haard:['glas'], farve:['moerk','spaettet']},
    farver:['#3C3F42','#B8806B','#D9D2C6','#25282B'], tegning:'porfyr',
    placering:'skuffen «Udbrudsprodukter 1»', billeder:[
      {fil:'MA-14-paaskallavikporfyr-1.jpg', tekst:'Påskallavik porfyr, som sedlen lyder — med orange prik nr. 110'},
      {fil:'MA-14-paaskallavikporfyr-2.jpg', tekst:'Samme sten fra siden: frisk brudflade forrest, forvitret overflade bagved'}
    ]
  }
];
