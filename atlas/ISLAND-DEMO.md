# Island – faglig og teknisk demonstrationsspecifikation

**Status: milepæl A–E er færdige; F (elevafprøvning) mangler.** Tværsnittet ligger i
[`island/`](island/), se «Milepæl B» og «Milepæl C» nederst. Udkast til milepæl A – den faglige
modelbeskrivelse – er godkendt i [ISLAND-MODEL.md](ISLAND-MODEL.md). Trin 2
(zoom til terræn) er bygget som `island/kort.html`, se «Trin 2 – kortet» nederst. Pladegrænselaget fra #48 er på plads. Første fulde eksempel på atlasvisionen: geografisk sted → rumlig proces → forklaring → undersøgelse → anvendelse. Byg i små leverancer på `main` efter `CLAUDE.md` og `design_rules.md`.

Arbejdet styres i [#49](https://github.com/SimDeMe/smbi/issues/49). Navigationen
bygger på reviewet i [#47](https://github.com/SimDeMe/smbi/issues/47), og
integrationen kræver første pladegrænselag fra
[#48](https://github.com/SimDeMe/smbi/issues/48), ikke de senere jordskælvs- og
vulkanlag. [#46](https://github.com/SimDeMe/smbi/issues/46) leverer den
kontrollerede læreplanskobling. Nedenstående læringsmål er mål for denne
demonstration, ikke ekstra nationale læreplanskrav.

Modelbeskrivelsen og den korte elevopgave skal være fagligt kvalitetssikrede,
før avanceret animation bygges. Det er en eksplicit startbetingelse mellem
milepæl A og de efterfølgende trin; planen er ikke i sig selv en godkendt model.

## Læringsmål

Efter 10–15 minutters undersøgelse skal en elev kunne:
1. placere Island på den Midtatlantiske Ryg og beskrive pladernes relative bevægelse;
2. forklare hovedtrækkene i, hvorfor spredningszoner kan føre til delvis opsmeltning (trykaflastning);
3. forklare, at Islands særlige vulkanske aktivitet også forbindes med en varm kappeopstrømning/hotspot, og skelne mellem veletablerede observationer og fortolkninger;
4. skelne mellem en skematisk geologisk model og konkret målte forhold ved en bestemt lokalitet.

## Elevens fem trin

1. **Find:** Vælg Island på globusen; se placering, Midtatlantiske Ryg og relevante plader.
2. **Zoom:** Vis stedbundet kort/terræn, gerne et dokumenteret område som Þingvellir eller Reykjanes; angiv datakilde.
3. **Se under overfladen:** Åbn et skematisk 3D-tværsnit med lithosfære, kappe, pladebevægelse, trykaflastningssmeltning og magmatransport.
4. **Undersøg:** Vis/skjul forklarende lag; styr en **illustrativ tidsanimation** af pladernes relative bevægelse; sammenlign situation med/uden forklaringslag. Undgå falsk kvantitativ præcision.
5. **Anvend:** Kort elevopgave: 'Hvorfor er Island vulkansk aktivt, og hvorfor er en pladegrænse alene ikke hele forklaringen?' Bed eleven bruge mindst to observationer/modellag.

## Visualisering

- **Behold eksisterende D3/Canvas-globus** som atlasnavigation.
- Byg tværsnittet som et **selvstændigt Three.js-modul** som udgangspunkt; dokumentér version, licens, ydelse og den rumlige læringsværdi. Globussen forbliver Canvas/D3. Ingen omskrivning af eksisterende `geografi/pladegraenser.html` eller `geografi/vulkanudbrud.html` som forudsætning.
- Skift mellem overflade og tværsnit med tydelige knapper. Vis dybder, lagtykkelser og bevægelseshastigheder kun med korrekt dokumentation; ellers tydelig markering **'skematiske proportioner – ikke målfast'**.
- Sørg for, at figur og primære kontroller er synlige og brugbare på skolelaptop. Sekundær forklaring kan åbnes i panel; tilbyd fokusvisning.
- Tastatur/touch, reduced motion, pause og tydelige labels. Tilbyd et læsbart 2D-/tekstalternativ og model-links, hvis 3D/WebGL fejler; globusnavigationen skal fortsat fungere.
- Ingen krav om fotorealisme; vægt læsbarhed og faglig korrekthed.

## Kilder og faglige forbehold

- Brug dokumenterede geografiske data for pladegrænser, terræn og eventuelle vulkaner. Registrér kilde, licens, dato, opløsning og usikkerhed.
- Island er et særligt eksempel: divergens ved den Midtatlantiske Ryg kombineret med ekstra magmatilførsel knyttet til hotspot/kappeopstrømning. Fremstil ikke alle detaljer af dybe kappeprocesser som direkte observerede eller uomstridte.
- En generel spredningsmodel må ikke udlægges som et præcist geofysisk tværsnit gennem Þingvellir.
- Bevar forskel på tidskomprimeret animation, faktisk pladehastighed og geologisk tid.
- Gør kildearten synlig: geografiske data viser sted og kortgrundlag; et skematisk tværsnit viser en idealiseret proces; fortolkninger forklarer geologiske sammenhænge og deres usikkerhed. En modelgrænse er ikke automatisk en direkte observation.

## Tekniske milepæle

A. Skriv og kvalitetssikr en faglig modelbeskrivelse med referencer og elevspørgsmål. Beskriv pladebevægelse → kappeopstrømning → trykfald → delvis opsmeltning → magmatransport/vulkanisme samt Islands særlige forhold. Angiv antagelser og begrænsninger, så en illustrativ animation ikke bliver en ny, udokumenteret faglig påstand.
B. Byg en statisk, korrekt mærket tværsnitsprototype.
C. Tilføj rotation, vis/skjul-lag og kontrolleret animation uden nye faglige påstande.
D. Integrér i atlas fra Island-markøren, med retur til globus og links til de to eksisterende simulationer.
E. Test 1280×577, 1366×625, 1536×730, 390×750, 640×625, touch, tastatur, 3D-fallback og relevante browsere.
F. Afprøv elevopgaven og justér efter observeret forståelse.

## Definition of done

- En elev kan følge hele kæden uden at miste overblik eller blive tvunget gennem en lineær undervisningsplatform.
- Hver figur angiver om den er skematisk eller baseret på data.
- Faglige processer, termer og enheder er kvalitetssikrede.
- Eksisterende atlas og simulations-URL'er er intakte.
- Kode, datakilder, licenser, begrænsninger og test er dokumenteret.
- En elevafprøvning dokumenterer, om forløbet kan gennemføres på 10–15 minutter, og om eleven kan forklare sammenhængen mellem Islands beliggenhed, pladespredning og vulkanisme.

Forløbet er et frivilligt demonstrationsspor; eleven skal kunne gå tilbage,
springe til en selvstændig model eller vælge noget andet i biblioteket.
Ingen login, profiler eller LMS-funktioner.

## Milepæl B – statisk tværsnit

Selvstændigt modul på `/atlas/island/` (`index.html`, `island.css`,
`island.js`, `tvaersnit.js`, `tekst.js`). Linket fra atlasset siden
milepæl D; `#island` i adressen åbner Island-tilstanden.

- Hovedkontrollen er skifteknappen «Den Midtatlantiske Ryg / Island». Lagene
  følger ISLAND-MODEL.md afsnit 4; «Hotspot (fortolkning)» kan slås fra.
- Elevteksten i `tekst.js` er ordret afsnit 1–2. Trinknapperne toner de
  øvrige lag ned, så eleven ser det, «Se efter» peger på. Ingen animation.
- Figuren er mærket «Skematisk – ikke målfast · set fra syd». Etiketterne
  bærer mærkerne Målt, Model og Fortolkning fra afsnit 3 som tekst. Der står
  bevidst ingen tal i figuren, før referencerne er slået op (afgørelse 5);
  tallene står kun i elevteksten.
- Kun forholdet mellem tilstandene er en faglig påstand: på Island er
  skorpen tykkere, lithosfæren dybere, smeltningen begynder dybere, der er
  flere dråber og kamre, og landet når over havet. Testen kontrollerer det.
- **Teknikvalg:** tegnet som SVG fra en lille geometrifunktion, ikke
  Three.js. En statisk figur har ingen gevinst af 3D, virker uden WebGL og
  bliver dermed det læsbare 2D-alternativ, milepæl C alligevel skal have.
  Three.js kan stadig bruges til rotation i milepæl C.
- Test: `atlas/test/island.py` (kaldes fra `afproev.py`) – fem
  skærmstørrelser, vandret rulning, figur og kontroller uden at rulle,
  skift, hotspot, tekst mod ISLAND-MODEL.md, trinfremhævning, tastatur,
  fokus og links.

## Milepæl C – lag, drejning og animation

Samme modul; ingen nye tal eller påstande ud over ISLAND-MODEL.md afsnit 2–3.

- **Vis/skjul-lag:** knappen «Lag» åbner de syv lag fra afsnit 4 med elevens
  ord. Et skjult lag udelades af figuren og af tekstalternativet («Laget …
  er slået fra»). Vælger eleven et trin, vises trinnets lag igen, så «Se
  efter» altid peger på noget synligt. Pladegrænsen hører til
  «Lithosfæreplader». «Hotspot (fortolkning)» findes kun ved Island.
- **2D/3D og drejning:** 2D er SVG-tværsnittet lige forfra og er
  udgangspunktet – læsbart, mærket og det fulde tekstalternativ. 3D gør
  tværsnittet til forsiden af en blok: oversiden viser ryggen, havet og
  pladernes bevægelse ovenfra med «↑ Nord» (Island som skematisk landflade,
  ikke øens omrids), siderne viser, at lagene fortsætter langs ryggen. Drej
  med træk (vandret på touch, så siden stadig kan rulle), piletaster på
  figuren, Home for standardvinklen eller de synlige drejeknapper. Drejningen
  er begrænset til ±60° og 0–45° ovenfra; blokkens hjørner projiceres, så den
  altid passer i figuren.
- **Animation:** pladerne og skorpen føres væk fra ryggen som lyse bånd, der
  flytter sig lige hurtigt til begge sider; kappen stiger langsomt op langs
  pilene; dråber dannes i forskellig højde i smeltezonen og stiger op mod
  ryggen; magma bevæger sig op gennem gangene. Kappen er mindst tre gange så
  langsom som magmaen (testet). Ingen udbrud. Tiden står som «Tiden er sat op
  – ikke målfast», fordi figuren ikke har vandrette afstande. Afspil/Pause;
  ved `prefers-reduced-motion` starter den på pause. Kun de bevægelige dele
  tegnes om pr. billede.
- **Teknikvalg:** CSS 3D frem for Three.js. Forsiden er den samme SVG som i
  2D, så etiketter, mærker og fremhævning bliver skarpe og ens i begge
  visninger, og intet kræver WebGL eller et bibliotek fra et CDN. Uden CSS 3D
  er 3D-knappen slået fra, og 2D virker som før.
- **Filer:** `blok.js` (oversiden, siderne og projektionen), `tvaersnit.js`
  (`bevaegelse()` for de bevægelige dele), `island.js` (styring).
- Test: `afproev_islandbevaegelse` i `atlas/test/island.py` – blokken passer i
  figuren på alle fem skærme og i yderstillingerne, piletaster, Home,
  drejeknapper, træk, grænser, lag og tekstalternativ, trin der viser deres
  lag, Escape og klik udenfor, afspil/pause, reduced motion, kappens og
  magmaens fart, båndenes symmetri, ingen tal i figuren og fallback uden CSS 3D.

## Milepæl D – i atlasset

- **Fra globussen:** Island-markøren (og Steder → Island) viser et kort
  «Under Island · Skematisk tværsnit · hører til dette sted» før de generelle
  simulationer, med linket «Se under overfladen →» til `/atlas/island/#island`.
  Kortet hører til stedet (`fordybelse` i `modeller.js`), ikke til
  modellisten, så søgning og Processer er uændrede. Andre steder har intet.
- **Retur:** headerlinket «← Island på globussen» og linket under tværsnittet
  går til `/atlas/#island`. Et `#<stedets id>` i atlasadressen drejer globussen
  hen til stedet, når den er klar; dialogen åbnes ikke. Ukendte ankre ignoreres.
- **Videre:** under tværsnittet linkes til Pladegrænser og Vulkanudbrud; i
  atlasset står de som før under Island-kortet. Deres URL'er er uændrede.
- Test: `afproev_islandintegration` i `atlas/test/island.py` – på alle fem
  skærme: kortet findes kun ved Island og står først, begge simulationer er
  der, klik (640: tastatur) åbner Island-tilstanden, returlinket centrerer
  Island på globussen uden åben dialog, og et ukendt anker giver ingen fejl.

## Milepæl E – test på skærme, input og browsere

Afprøvet 14. oktober 2026 i Chromium (hele `afproev.py`), Firefox og WebKit
(`andre_browsere.py`) og visuelt i rigtig Safari på macOS.

- **Skærme:** alle fem visninger (1280×577, 1366×625, 1536×730, 390×750,
  640×625) i 2D og 3D; skærmbilleder er gennemset. Fund og rettelser:
  - Ved 390 px lå drejeknapperne hen over mærket «Skematisk – ikke målfast».
    I en figur under 620 px (container query) står knapperne nu 2×2 (▲▼ over
    ◀▶), så mærker og tidsmærke har plads ved siden af. Er figuren også høj
    (mobil på højkant), holder blokken sig over knapperne; i en lav figur
    (640×625) ville det gøre blokken for lille, så der står knapperne over
    blokkens bagside som på desktop. Testet: intet mærke bag knapperne på
    nogen skærm, og på mobil ingen flade bag knapperne i nogen drejning.
  - Blokkens tilpasning regnede med, at CSS' `scale()` også skalerer dybden.
    Det gør den ikke, så blokken kunne være op til ca. 9 % større end
    beregnet ved kraftig drejning (skjult af margenen indtil nu). `blok.js`
    regner nu som browseren; udseendet er uændret.
- **Touch:** ægte touch gennem Chromiums inputprotokol (`afproev_islandtouch`):
  vandret strøg drejer blokken, lodret strøg ruller siden og drejer ikke,
  drejeknapperne kan trykkes. Prøven fejler, hvis `touch-action` ændres.
- **Tastatur, fokus og 3D-fallback:** dækkes som før af milepæl B–D's prøver
  (piletaster, Home, Escape, Tab/Enter fra atlasset, 2D uden CSS 3D). Sitet
  bruger ikke WebGL; testen kører med WebGL slået fra.
- **Firefox:** fronten blev tegnet forstørret hen over hele figuren, fordi
  Firefox maler et utransformeret barn i en `preserve-3d`-blok forkert.
  Rettet med en lille `translateZ` på fronten i 3D. Røgtesten tjekker nu, at
  figurens hjørne uden for blokken er tomt (fejler uden rettelsen).
- **WebKit/Safari:** Playwrights WebKit-build på macOS har ingen
  3D-komposition – selv en minimal CSS-kube tegnes fladt – så her prøves kun
  layout og betjening. Rigtig Safari tegner blokken korrekt (set på skærmen).
- **Globussen:** den ustabile `afproev_pladefejl` skyldtes, at
  `ResizeObserver` satte lærredets størrelse om lige efter start, hvilket
  tømmer det, og gentegningen ventede en frame. Testen kunne derfor
  fotografere et blankt lærred (2 af 15 forsøg), og eleven kunne se en blank
  frame ved hver størrelsesændring. `globus.js` tegner nu med det samme
  (0 af 30 forsøg derefter).
- **Ikke afprøvet:** fysisk telefon/iPad, Safari på iOS, skærmlæser og
  Firefox/Safari med touch på en rigtig enhed.

## Trin 2 – kortet (zoom til terræn)

Selvstændig side `/atlas/island/kort.html` (`kort.html`, `kort.css`,
`kort.js`, data i `island/data/`). Navigationen «1 Globus · 2 Kort · 3 Under
overfladen» står på både kortet og tværsnittet; atlassets Island-kort har nu
både «Se kortet →» og «Se under overfladen →».

- **Indhold:** skyggelagt terræn og havbund (højde/dybde i farver med
  skala), vulkansystemer – centralvulkaner, kalderaer og sprækkesværme, aktive
  og uddøde – pladegrænsen fra #48, 14 navngivne vulkaner, rygnavne,
  målestok og en valgfri, stiplet «Hotspot (fortolkning)». Pegning (mus,
  tryk eller pile med kryds) aflæser højde/dybde og koordinat.
- **Faglig pointe («Se efter»):** de aktive vulkansystemer følger
  pladegrænsen i et bælte fra Reykjanes til Nordisland; uddøde vulkaner
  ligger mod øst- og vestkysten (de unge klipper i midten fra
  ISLAND-MODEL.md trin 4); ryggen fortsætter under havet. Mærket «Målte og
  kortlagte data» med link til kilderne; kun hotspottet er en fortolkning.
- **Data og licenser** (`island/data/islandskort.LICENSE`):
  - ETOPO 2022 15″ (NOAA NCEI) via ERDDAP – fri brug og videreformidling.
  - NÍ's tektoniske kort 1:600 000 (Jóhannesson & Sæmundsson) – CC BY 4.0,
    kreditering på siden. Veðurstofans Catalogue of Icelandic Volcanoes er
    fravalgt, fordi den er CC BY-NC-ND 4.0 og ikke må forenkles.
  - Navne og seneste udbrud fra Smithsonian GVP.
  - Islands officielle højdemodel ÍslandsDEM (NÍ, CC BY 4.0, 10–50 m)
    findes også, men ETOPO er valgt, fordi den dækker land og havbund i ét
    gitter, og ca. 0,5 km pr. pixel er nok i denne skala.
- **Teknik:** `islandskort.py` (numpy, Pillow) henter rådata, regner hver
  pixel tilbage gennem D3's sfæriske `geoConicConformal` (64,25°/65,75° N,
  midtmeridian 19° V som ISN93) og skriver et JPEG-relief (ca. 190 KB), et
  int16-højdegitter (ca. 460 KB) og JSON med vektorer og navne (ca. 52 KB).
  Vektorerne projiceres i browseren med samme formel; testen sammenligner
  D3 med en uafhængig Python-udgave af formlen. Zoom (×1–×5) med knapper,
  dobbeltklik, + og −; træk eller pile flytter; reliefbilledet dækker altid
  figuren. Uden zoom ruller et lodret strøg siden på touch.
- **Plume og magmakamre:** ingen fri datasæt med form eller dybde. Plumen
  vises kun som omtrentlig cirkel (Wolfe m.fl. 1997; Allen m.fl. 2002);
  magmakamrenes dybder (fx Katla 2–5 km, Hekla 5–9 km) står kun i
  litteraturen og er ikke tegnet.
- Test: `afproev_islandkort` i `atlas/test/island.py` – fem skærme, intet
  tomt felt i figuren, lag, projektion mod uafhængig formel, højder ved
  Öræfajökull, Hekla, Langjökull, havet og Þingvallavatn, aflæsning, zoom,
  træk, tastatur, fokus, kilder, links fra atlasset og fejlbesked uden data.

Se `atlas/ROADMAP.md` og `atlas/KERNESTOF.md`.
