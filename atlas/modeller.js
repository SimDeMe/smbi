// Registeret er atlassets eneste kilde til steder, processer og modelkort.
// Koordinater følger GeoJSON: [længdegrad, breddegrad] i grader.
export const steder = [
  {
    id: 'island', navn: 'Island', koordinater: [-19, 64.9],
    forklaring: 'Island ligger på den Midtatlantiske Ryg, hvor pladerne bevæger sig fra hinanden. Et hotspot bidrager også til vulkanismen.',
    modelnote: 'Generelle modeller – ikke en gengivelse af en bestemt islandsk vulkan.',
    forbehold: 'Et fagligt eksempel på pladetektonik og vulkanisme. Modellerne er generelle og gengiver ikke en bestemt islandsk vulkan.',
    // Stedets egen fordybelse: målt terræn med en fortolket geologisk gennemskæring.
    fordybelse: { titel: 'Under Island', sti: '/atlas/island/model3d.html?snit=vatnajokull', kort: '/atlas/island/kort.html',
      beskrivelse: 'Hvor ligger vulkanerne? Kort med terræn, havbund og vulkansystemer fra målte data. Skær det samme 3D-landskab op og undersøg kildebaserede magmasystemer ved Vatnajökull, Reykjanes og Hekla.' }
  },
  {
    id: 'nordatlanten', navn: 'Grønland / Nordatlanten', kortnavn: 'Nordatlanten', koordinater: [-37, 58],
    forklaring: 'I Nordatlanten kan afkøling og høj saltholdighed gøre havvand tungere og bidrage til dannelsen af dybvand.',
    modelnote: 'Regionalt eksempel – markøren angiver ikke ét nedsynkningspunkt.',
    forbehold: 'Markøren angiver en region syd for Grønland, ikke et enkelt nedsynkningspunkt. Grønlandspumpen er en idealiseret model af dele af havcirkulationen.',
    modeller: ['havstroemme']
  },
  {
    id: 'stillehavet', navn: 'Det tropiske Stillehav', kortnavn: 'ENSO · Stillehavet', koordinater: [-145, 0],
    forklaring: 'I det tropiske Stillehav påvirker passatvindene og havtemperaturen hinanden. Samspillet kaldes ENSO og har faserne El Niño, La Niña og neutral.',
    modelnote: 'Regionalt klimasystem · idealiseret undervisningsmodel.',
    forbehold: 'Markøren ligger på ækvator i det centrale Stillehav, midt i Niño 3.4-området (5° N–5° S, 170° V–120° V). ENSO omfatter samspillet mellem hav og atmosfære over et langt større område. Simuleringen viser processerne med illustrative modelværdier, ikke observationer eller en vejrprognose.'
  },
  {
    id: 'alperne', navn: 'Alperne', koordinater: [10, 46.5],
    forklaring: 'Når fugtig luft tvinges op over en bjergkæde, afkøles den. Vanddamp kan kondensere og give nedbør; på læsiden kan luften blive varm og tør.',
    modelnote: 'Skematisk bjergmodel – ikke en lokal vejrprognose.',
    forbehold: 'Alperne er et eksempel på stigningsregn og føhn. Modellen bruger et skematisk bjerg og beregner ikke det aktuelle vejr i Alperne.'
  },
  {
    id: 'afrikas-horn', navn: 'Afrikas Horn', koordinater: [44, 8],
    forklaring: 'Etiopien, Eritrea, Djibouti og Somalia har nogle af verdens højeste andele af underernærede. Landbruget og kvægdriften er afhængige af regntider, der kommer med ITK – og i 2020–2023 slog fem regntider i træk fejl.',
    modelnote: 'Regionalt eksempel · landedata fra FAO og FN · nedbør som klimanormal.',
    forbehold: 'Markøren angiver regionen, ikke et bestemt punkt. I det meste af Somalia og det sydlige Etiopien falder regnen i to korte regntider (marts–maj og oktober–december); i Etiopiens højland falder det meste om sommeren. Landetallene er gennemsnit for hele lande, så forskellen mellem fx Etiopiens frodige højland og Somalias tørre lavland ses ikke. Eritrea har ingen FAO-tal for underernæring og kalorieforsyning.',
    // Knapper på stedets side: lag, der passer til stedet, og landenes egne tal.
    lag: [
      { tekst: 'Vis underernæring på temakortet', lag: 'tema', tema: 'underernaering' },
      { tekst: 'Vis nedbør måned for måned (april)', lag: 'nedboer', maaned: 3 }
    ],
    lande: [['231', 'Etiopien'], ['232', 'Eritrea'], ['262', 'Djibouti'], ['706', 'Somalia']],
    // Globale modeller, der hjælper med at forklare stedet. De bevarer deres
    // globale note og bliver ikke stedbundne af det.
    modeller: ['global-cirkulation']
  }
];

export const modeller = [
  { id: 'jordskaelvsboelger-a', titel: 'Jordskælvsbølger model A', emne: 'Seismiske bølger', niveau: 'Naturgeografi C / B', steder: [],
    beskrivelse: 'Se hvordan P- og S-bølger bevæger sig. Aflæs tre seismogrammer, justér afstandscirklerne, og find et skjult epicenter.',
    modelnote: 'Idealiseret lokalt område · syntetiske seismogrammer',
    sti: '/atlas/jordskaelvsboelger-a/', soegeord: 'jordskælv seismik lokalisering epicenter hypocenter fokus p-bølger s-bølger trilateration bølgefart' },
  { id: 'jordskaelvsboelger-b', titel: 'Jordskælvsbølger model B', emne: 'Seismiske bølger', niveau: 'Naturgeografi C / B', steder: [],
    beskrivelse: 'Se P-, S- og overfladebølger ryste klippen, find et skjult skælv med S−P-metoden og tre cirkler, og følg bølgerne gennem Jordens kerne.',
    modelnote: 'Modelområde og beregnet strålegang gennem Jorden (ak135)',
    sti: '/atlas/jordskaelvsboelger-b/', soegeord: 'jordskælv seismik seismogram seismograf epicenter lokalisering richter magnitude skyggezone kerne lehmann p-bølger s-bølger overfladebølger' },
  { id: 'termisk-lavtryk', titel: 'Termiske tryk', emne: 'Vejr og klima', niveau: 'NV / Naturgeografi C', steder: [],
    beskrivelse: 'Tre luftsøjler, den midterste opvarmes eller afkøles. Se trykfladerne løfte sig eller synke, luften strømme i højden og et lavtryk eller højtryk opstå ved jorden.',
    modelnote: 'Hydrostatisk principmodel med illustrative tal',
    sti: '/geografi/termiske-tryk/', soegeord: 'termiske tryk termisk lavtryk højtryk varme kulde sol afkøling lufttryk konvektion nedsynkning vind atmosfære' },
  { id: 'global-cirkulation', titel: 'Global cirkulation', emne: 'Global atmosfære', niveau: 'Naturgeografi C / B', steder: [],
    beskrivelse: 'Følg vinden på en levende globus. Skift årstid, stop Jordens rotation, og undersøg passat, ITK og monsun.',
    sti: '/atlas/cirkulation/', soegeord: 'vind tryk hadley ferrel polar coriolis monsun passat atmosfære ITK' },
  { id: 'havstroemme', titel: 'Havstrømme', emne: 'Havcirkulation', niveau: 'Naturgeografi C / B', steder: [],
    beskrivelse: 'Følg varme og kolde strømme på en globus. Se vinden drive hvirvlerne, slip en flaskepost, og følg transportbåndet ned i dybet.',
    modelnote: 'Skematiske hovedstrømme · relativ fart',
    sti: '/atlas/havstroemme/', soegeord: 'havstrømme golfstrømmen hvirvel gyre humboldt benguela kuroshio agulhas varm kold strøm termohalin transportbånd amoc dybvand flaskepost hav el nino la nina enso stillehavet' },
  { id: 'pladegraenser', titel: 'Pladegrænser', emne: 'Pladetektonik', niveau: 'Naturgeografi C / B', steder: ['island'],
    beskrivelse: 'Undersøg spredning, subduktion og bevaring ved forskellige pladegrænser.',
    sti: '/geografi/pladegraenser.html', soegeord: 'tektonik kontinenter jordskælv ryg' },
  { id: 'vulkanudbrud', titel: 'Vulkanudbrud', emne: 'Vulkanisme', niveau: 'Naturgeografi C / B', steder: ['island'],
    beskrivelse: 'Følg magmaets vej op, og undersøg sammenhængen mellem magma, gas og udbrudstype.',
    sti: '/geografi/vulkanudbrud.html', soegeord: 'lava hotspot basalt magma' },
  { id: 'bjergarternes-kredsloeb', titel: 'Bjergarternes kredsløb', emne: 'Bjergarter', niveau: 'NV / Naturgeografi C', steder: [],
    beskrivelse: 'Følg en sten gennem kredsløbet, find ud af hvor ved pladegrænserne skolens sten er dannet, og se hvorfor langsom afkøling giver store korn.',
    modelnote: 'Skematisk snit · typiske tider · tommelfingerregel for kornstørrelse',
    sti: '/atlas/bjergarternes-kredsloeb/', soegeord: 'bjergart bjergarter sten stensamling magmatisk sedimentær metamorf granit gnejs sandsten kvartsit marmor eklogit forvitring erosion omdannelse størkning kornstørrelse afkøling krystal' },
  { id: 'groenlandspumpen', titel: 'Grønlandspumpen', emne: 'Havcirkulation', niveau: 'NV / Naturgeografi C / B', steder: ['nordatlanten'],
    beskrivelse: 'Skru på kulde og smeltevand, og undersøg hvordan havcirkulationen reagerer i en kvalitativ model.',
    sti: '/geografi/groenlandspumpen.html', soegeord: 'grønland hav salt temperatur dybvand termohalin amoc' },
  { id: 'enso', titel: 'ENSO — El Niño & La Niña', emne: 'Hav og klima', niveau: 'Naturgeografi C / B', steder: ['stillehavet'],
    beskrivelse: 'Skru på passatvinden, følg det varme vand og termoklinen i Stillehavet, og undersøg samspillet mellem hav og atmosfære. Klik på begreberne undervejs.',
    sti: '/geografi/enso.html', soegeord: 'enso el nino la nina southern oscillation stillehavet passatvind termoklin opvelling walker feedback temperatur hav klima' },
  { id: 'stigningsregn', titel: 'Stigningsregn & føhn', emne: 'Vejr og klima', niveau: 'Naturgeografi C / B', steder: ['alperne'],
    beskrivelse: 'Løft en luftpakke over et bjerg, og følg temperatur, kondensation og nedbør.',
    sti: '/geografi/Stigningsregn.html', soegeord: 'bjerg regn føhn foehn fugt alper' },
  { id: 'drivhus-enkel', titel: 'Drivhuseffekten — forenklet', emne: 'Global atmosfære', niveau: 'NV / Naturgeografi C', steder: [],
    beskrivelse: 'Følg sollys og varmestråling trin for trin, og undersøg atmosfærens betydning for Jordens energibalance.',
    sti: '/geografi/drivhuseffektenSimpel.html', soegeord: 'global klima co2 kuldioxid stråling drivhusgas energi' },
  { id: 'drivhus-udvidet', titel: 'Drivhuseffekten — udvidet', emne: 'Global atmosfære', niveau: 'Naturgeografi C / B', steder: [],
    beskrivelse: 'Undersøg energibalancen med tal, albedo og tilbagekoblinger i en idealiseret global model.',
    sti: '/geografi/drivhuseffekten.html', soegeord: 'global klima co2 kuldioxid albedo feedback stråling energi' }
];

// Forsøgsvejledninger fra Øvelser/Geografi/ (samme titler og tekster som kortene på
// geografi.html). Stien er /Øvelser/Geografi/<id>/<id>.html, med .pdf ved siden af.
// `steder` kobler til stedmarkørerne (og 'danmark' til landekortet), `opgaver` til
// undersøgelserne under Processer: 'plade', 'seismik' og 'klima'.
export const oevelser = [
  { id: 'albedo-og-overfladetemperatur', titel: 'Albedo og overfladetemperatur', emne: 'Klima · Vejr', niveau: 'NV / C', steder: [], opgaver: ['klima'],
    beskrivelse: 'Mål temperaturen på gråtoner under en lampe og på overflader omkring skolen, og forklar is-albedo-tilbagekoblingen.' },
  { id: 'bjergarters-densitet', titel: 'Bjergarternes densitet', emne: 'Geologi', steder: ['island'], opgaver: ['plade'],
    beskrivelse: 'Vej granit, basalt, peridotit og eklogit i luft og i vand, og brug densiteten til at forklare, hvorfor oceanbunden synker.' },
  { id: 'bjergarternes-kredsloeb', titel: 'Bjergarternes kredsløb', emne: 'Geologi', niveau: 'NV / C', steder: ['danmark'], opgaver: ['plade'],
    beskrivelse: 'Sortér bjergartsprøver efter, hvor i kredsløbet de er dannet, og undersøg en stor sten i jeres nærområde.' },
  { id: 'digital-kystopmaaling-rojle', titel: 'Digital opmåling af kystlinjen ved Røjle Klint', emne: 'Kyst', steder: ['danmark'], opgaver: [],
    beskrivelse: 'Optegn kystlinjen på historiske kort og luftfotos i MiljøGIS, og se hvor der er eroderet og aflejret.' },
  { id: 'drivhuseffekt-i-miniature', titel: 'Drivhuseffekt i miniature', emne: 'Klima · Vejr', niveau: 'NV / C', steder: [], opgaver: ['klima'],
    beskrivelse: 'Lampe, termometer og et, to, tre og fire lag viskestykke: hvor meget varmere bliver det for hvert lag?' },
  { id: 'groenlandspumpen-model', titel: 'Grønlandspumpen', emne: 'Klima · Hav', steder: ['nordatlanten'], opgaver: [],
    beskrivelse: 'Modelforsøg med hele cirkulationen i ét kar: is i den ene ende, varme i den anden.' },
  { id: 'groenlandspumpen-nv', titel: 'Grønlandspumpen — NV-udgave', emne: 'Klima · Hav', niveau: 'NV / C', steder: ['nordatlanten'], opgaver: [],
    beskrivelse: 'Koldt mod varmt og salt mod fersk med skilleplade, og derefter hele pumpen i ét kar.' },
  { id: 'havniveau-og-isafsmeltning', titel: 'Havniveau og isafsmeltning', emne: 'Klima · Hav · Kyst', niveau: 'NV / C', steder: ['nordatlanten'], opgaver: ['klima'],
    beskrivelse: 'To kar under en lampe: is på land og is i havet — hvilken hæver vandstanden, når den smelter?' },
  { id: 'hawaii-og-stillehavspladens-hastighed', titel: 'Hawaii og Stillehavspladens hastighed', emne: 'Geologi', niveau: 'C', steder: [], opgaver: ['plade', 'seismik'],
    beskrivelse: 'Undersøg Hawaii–Emperor-kæden i Google Earth, og beregn ud fra vulkanernes alder, hvor hurtigt Stillehavspladen har flyttet sig.' },
  { id: 'konvektionskammer-med-opgaver', titel: 'Konvektionskammer — med journalopgaver', emne: 'Vejr', steder: [], opgaver: ['klima'],
    beskrivelse: 'Konvektionsforsøget med journaldel: fotodokumentation med H og L markeret og spørgsmål om det termiske lavtryk.' },
  { id: 'kortoevelse-istidslandskaber', titel: 'Kortøvelse til istidslandskaber', emne: 'Geologi · Landskab', niveau: 'NF / C', steder: ['danmark'], opgaver: [],
    beskrivelse: 'Find hovedopholdslinjen i GEUS\' geologiportal, og sammenlign terræn og jordarter vest og øst for den og nord for Limfjorden.' },
  { id: 'lavas-viskositet', titel: 'Lavas viskositet', emne: 'Geologi · Landskab', steder: ['island'], opgaver: ['seismik'],
    beskrivelse: 'Lad fire væsker løbe ned ad et skråt bræt, og forklar ud fra farten, hvorfor nogle vulkaner er høje og andre brede.' },
  { id: 'ledeblokke', titel: 'Ledeblokke', emne: 'Geologi · Landskab', niveau: 'NF / C', steder: ['danmark'], opgaver: [],
    beskrivelse: 'Bestem ledeblokke, find deres oprindelsessted i Norge, Sverige og Østersøen, og afgør, hvilket isfremstød der har bragt dem.' },
  { id: 'lokalisering-af-jordskaelv', titel: 'Lokalisering af jordskælv', emne: 'Geologi', niveau: 'C', steder: [], opgaver: ['seismik'],
    beskrivelse: 'Aflæs P- og S-bølger på rigtige seismogrammer fra et canadisk jordskælv, og find epicentret med cirkler i Google Earth.' },
  { id: 'maaling-af-luftfugtighed', titel: 'Måling af luftfugtighed', emne: 'Vejr · Vand', niveau: 'NF / C', steder: ['alperne'], opgaver: ['klima'],
    beskrivelse: 'Mål luftfugtigheden inde og ude med et psykrometer, find dugpunktet, og beregn, hvor mange gram vanddamp der er i klasselokalet.' },
  { id: 'opmaaling-af-terraenprofil', titel: 'Opmåling af terrænprofil', emne: 'Geologi · Landskab', steder: ['danmark'], opgaver: [],
    beskrivelse: 'Opmål et terrænprofil i felten, og tegn landskabets form ud fra jeres egne målepunkter.' },
  { id: 'p-og-s-boelger-i-slinky', titel: 'P- og S-bølger i en slinky', emne: 'Geologi', niveau: 'C', steder: [], opgaver: ['seismik'],
    beskrivelse: 'Design selv et forsøg, der måler P- og S-bølgernes fart i en slinky-fjeder, og film bølgerne.' },
  { id: 'soe-og-landbrise', titel: 'Sø- og landbrise', emne: 'Vejr · Klima', niveau: 'NF / C', steder: [], opgaver: ['klima'],
    beskrivelse: 'Varm en skål sand og en skål vand under en lampe, og lad dem køle af igen: hvorfor vender vinden ved kysten om aftenen?' },
  { id: 'tsunamiboelgers-hastighed', titel: 'Tsunamibølgers hastighed', emne: 'Geologi', steder: [], opgaver: ['seismik'],
    beskrivelse: 'Mål bølgers fart i et vandkar ved tre dybder, sammenlign med v = √(g·d), og regn på en tsunami over oceanet.' },
  { id: 'vandbalancen', titel: 'Vandbalancen', emne: 'Vand · Grundvand · Klima', niveau: 'C', steder: ['danmark'], opgaver: ['klima'],
    beskrivelse: 'Følg nedbør og fordampning måned for måned med DMI\'s tal, og find ud af, hvornår der dannes grundvand — i et gennemsnitsår og i tørkeåret 2018.' },
  { id: 'vands-temperatur-salinitet-og-densitet', titel: 'Vands temperatur, salinitet og densitet', emne: 'Hav', steder: ['nordatlanten'], opgaver: [],
    beskrivelse: 'To skillepladeforsøg: hvad temperaturforskel og saltforskel hver for sig gør ved to vandmasser.' },
  { id: 'vindmoeller-og-solceller', titel: 'Vindmøller og solceller', emne: 'Energi · Ressourcer', niveau: 'NF / C', steder: ['danmark'], opgaver: [],
    beskrivelse: 'Mål vind og sol med en modelvindmølle og et solcellepanel, aflæs elsystemet lige nu, og find den bedste placering til en vindmøllepark på Fyn.' }
];
