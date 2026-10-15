# Kernestof og modeldækning – Naturgeografi C

**Status 14. oktober 2026: repository- og læreplansgennemgang udført til
[#46](https://github.com/SimDeMe/smbi/issues/46).** Alle 12 kernestofpunkter,
10 faglige mål og de eksisterende naturgeografiske ressourcer er kortlagt.
Sammenligningen med ejerens lokale materialer er derefter udført i
[INDHOLD.md](INDHOLD.md), de 11 afprøvede øvelser er flyttet til
`Øvelser/Geografi/`, og ejeren har taget stilling til prioriteringen
(15. oktober 2026). #46 er dermed afsluttet. Dette er ikke en attest på fuld
læreplansdækning; den videre prioritering står i INDHOLD.md.

Biblioteket rummer mange brugbare procesmodeller og forsøg, især om tektonik,
vejr, jordvand og klima. De største sammenhængende huller i det gennemgåede
repository er globalt kulstofkredsløb og databaserede undersøgelser, der
forbinder energi, teknologi, samfund og verdensmål. Lokalkataloget peger
allerede på mulige materialer til flere af hullerne. Genbrug skal afklares
før større nyudvikling. **Biblioteket er ikke en fast undervisningsrækkefølge.**

## Grundlag, belæg og statuskoder

Ministeriets [aktuelle stx-oversigt](https://uvm.dk/uddannelse-til-unge/gymnasiale-uddannelser/fag-og-laereplaner/stx-laereplaner/)
henviste ved kontrollen 14. oktober 2026 til **Naturgeografi C – stx,
august 2024, bilag 120A**:
[officiel læreplan, 4 sider](https://uvm.dk/media/xvjog3ij/240613-naturgeografi-c-stx-august-2024.pdf).
Genkontrollér versionen ved senere opdateringer.

[Vejledning til naturgeografi B/C, stx](https://uvm.dk/media/zlsj2rzb/240923vejledning-til-naturgeografi-b-c-stx.pdf)
har **Juni 2024** på forsiden, selv om filnavnet begynder med 240923.
Vejledningen er fortolkningshjælp; den indfører ikke yderligere bindende krav.
B-niveauets dybde eller sidernes B-mærkede udvidelser bliver ikke C-krav.
Kildekontrollens dato og PDF-fingeraftryk findes i
[gennemgang-46.json](gennemgang-46.json).

| Kategori | Normativ henvisning | Hvad kortlægningen vurderer |
| --- | --- | --- |
| Kernestof | §2.2, s. 1–2 | Indholdsområder og bidrag fra ressourcer; ingen bestemt simulation er et krav |
| Faglige mål | §2.1, s. 1 | Mulige elevhandlinger; faktisk målopfyldelse kræver elevprodukter/observationer |
| Metoder og arbejdsformer | §2.1 og §3.1–3.4, s. 1–3 | Empiri, felt, kort, data, skriftlighed, løsning og samspil |
| Supplerende stof | §2.3, s. 2 | Valgte natur-, samfunds- og kulturfaglige problemstillinger knyttet til kernestof |

**Afgrænsning:** `main` ved `59bdf7c`, 16 elevressourcer i `geografi/`,
17 geografiske forsøgs-/undersøgelsesvejledninger, fem opgaveark med én
svarfil samt relevante arkiv-/indgangssider og de tre progressionsplaner i
`Progressioner/`. Planernes modeller og dataopgaver er forslag; deres
tilgængelige elevudgaver er vurderet særskilt. Det komplette
[ressourceinventar](SIMULATIONSOVERSIGT.md) beskriver funktion, afprøvede
elevhandlinger, antagelser, opgavekoblinger og begrundede fravalg. Ø1–Ø17 og
O1–O5 i tabellerne nedenfor henviser til dette inventar.

- **E:** eksisterende ressource. Afprøvet funktion og indhold beskrives i
  inventaret; E er hverken fuld emnedækning eller fuld faglig validering.
- **D:** konkret udviklings-/sammenkoblingsbehov med belæg i inventaret.
- **M:** specificeret mangel **i det gennemgåede repository**, ikke i ejerens
  samlede undervisning. En manglende samlet model er ikke automatisk mangel
  på alle andre relevante ressourcer.
- **U:** uafklaret, fx lokale originalers indhold, kildepræcision eller
  undervisningens faktisk opnåede kompetencer.

Koder kan kombineres, fordi et punkt kan have delressourcer og mangle en
bestemt sammenhæng samtidig. **Lokalmaterialernes dækning er U for alle
punkter**, indtil Claude har sammenholdt originalerne. Elevhandlinger og
løsningsforslag nedenfor er redaktionelle anbefalinger, ikke nye læreplanskrav.

## Kernestof, §2.2 – alle 12 punkter

K1–K12 er egne reference-id'er i kildens rækkefølge. Emneangivelserne er
forkortelser; den officielle formulering findes i PDF'en på den angivne side.

### Jordens og landskabernes processer – s. 1

| Id / punkt | Eksisterende bidrag og belæg | Status, afgrænsning og næste elevundersøgelse |
| --- | --- | --- |
| K1 Jordens udvikling, pladetektonik, jordskælv og vulkaner | Pladegrænser: fem typer med tid/snit og skælvsfordeling; Vulkanudbrud: tre typer og dannelsesforløb. Ø2, Ø10 og Ø16 giver densitet, viskositet og tsunamiundersøgelse. Magnetisk nord kan perspektivere paleomagnetisme. | **E/D.** Stærke procesdele; Jordens samlede udvikling og empirisk global fordeling er ikke samlet belyst. Modelskælv er ikke et katalog. Lad eleven sammenholde pladegrænse med virkelige skælv/vulkaner, tid og databegrænsninger. #48 har nu kildebelagte lag for pladegrænser, jordskælv (USGS) og vulkaner (GVP), og øvelserne om lokalisering af jordskælv og P-/S-bølger er koblet til atlasset. Lokale Google Earth-opgaver kan genbruges. |
| K2 Geologiske processer/kredsløb og menneskers ressourcebrug | Stensamlingens 49 poster, Pladegrænser, Vulkanudbrud, Råstoffer; Ø2/Ø10/Ø11/Ø15. Olieøvelsen behandler dannelse/migration; kobberøvelsen forbinder geologisk ressource og økonomisk reserve. | **E/D.** Mange dele, men ikke en samlet undersøgelse af bjergartskredsløb over geologisk tid og menneskelig udnyttelse. Sammenbind fysiske prøver, procesforklaring og ressourcevalg. Undersøg lokal bjergartskredsløbsøvelse først. |
| K3 Globalt kulstofkredsløb i geofaglige sammenhænge | Drivhusmodellernes CO₂-input og Ø11's fossile dannelse er relevante brudstykker. Stensamlingen beskriver bl.a. kul og karbonatbjergarter. Progressionsplan 2, B7, og plan 3, Bro, skitserer lager-/strømmodel og Keeling-opgave. | **E/M.** Ingen færdig samlet elevressource med globale lagre, strømme og kobling mellem hurtige og geologiske kredsløb fundet. En CO₂-skyder forklarer ikke, hvor atmosfærens kulstof kommer fra. Prioritér efter lokal kontrol en kildebelagt lager-/strømfigur med budget og ændret menneskelig flux; behøver ikke begynde som stor simulation. |
| K4 Natur-/menneskeskabte landskaber, dannelse/udvikling og produktion/samfund | Bølger, Tidevand og Pladegrænser; Ø3's historiske kystkort, erosionsrate og kystsikring/arealbrug; Ø12's feltprofil af menneskeskabt høj; O2's vandskel. | **E/D.** Empirisk kyst og feltarbejde findes allerede. Samlet glacial landskabsdannelse og forbindelse til jord/landbrug er ikke udarbejdet i elevbiblioteket. Genbrug lokal istidskortøvelse; sammenhold terræn, jord og faktisk arealbrug før en ny 3D-landskabsmodel. |

### Klima og vejrs betydning for menneskets livsvilkår – s. 2

| Id / punkt | Eksisterende bidrag og belæg | Status, afgrænsning og næste elevundersøgelse |
| --- | --- | --- |
| K5 Globalt vindsystem/klimasystem, klimazoner og plantebælter | Årstider, TermiskTryk3, Dugpunkt, Stigningsregn, Grønlandspumpen; Ø8/Ø9/Ø17. **Ø9 spørgsmål 5–7 behandler Hadleycellen, passat/Coriolis og klima/plantebælter**. | **E/D.** Globalt stof er ikke helt fraværende. Der mangler en sammenhængende undersøgelse af global cirkulation, klimazonering og vegetation med geografiske data. Sammenlign klimadiagrammer, breddegrad, vind og vegetation ved flere lokaliteter; kontrollér lokalt globalvind-materiale før en ny globusmodel. |
| K6 Vandkredsløb, grundvandsdannelse og vandressourceudnyttelse | O1 behandler hele kredsløbet inkl. magasiner/transport/vandbalance; O2 oplande; Dugpunkt/Stigningsregn og jordvandssimulation. Ø13/Ø14 måler jord og spørger til landbrug, vanding og forurening. | **E/D.** Ikke kun en permeabilitetsmodel. Behovet er at samle oplandets nedbør, fordampning, afstrømning, grundvand og faktisk indvinding/forbrug i en dataopgave. Brug lokal Vandbalancen-original og offentlige oplands-/forsyningsdata før evt. tværsnitsmodel. |
| K7 Klimaets betydning for produktion og grundlæggende livsvilkår | Stigningsregn/TermiskTryk3 giver processer; Ø14 kobler jord, nedbør og vanding, Ø13 tør sommer; arkiveret Havets motor sammenligner klimatal. O5 giver muligt demografisk perspektiv. | **E/D.** Produktions-/levevilkårskoblinger findes som spørgsmål, men en sammenlignende, kildebelagt geografisk case er ikke samlet i biblioteket. Undersøg fx klimadata, vandbehov og produktion i to regioner; lokale fødevare-/levevilkårsmaterialer har første prioritet til genbrug. |
| K8 Klimaændringer og samfundsudviklingens klimapåvirkning | Begge drivhusressourcer, Grønlandspumpen, Ø1/Ø4/Ø7 og kystspørgsmål i Ø3. Den udvidede model reagerer på CO₂/albedo, og Ø4 beder eleven finde observerede temperaturdata. | **E/D.** Observerede data efterspørges, men en aktuel kildeangivet serie og emissions-/samfundscase er ikke samlet med modellerne. Skeln observation, idealiseret respons og fremtidsscenarie; knyt emissioner/arealanvendelse til K3. AMOC-/havniveaupåstande kræver kildeeftersyn. |

### Innovation, bæredygtighed og ressourceforvaltning – s. 2

| Id / punkt | Eksisterende bidrag og belæg | Status, afgrænsning og næste elevundersøgelse |
| --- | --- | --- |
| K9 Bæredygtig udvikling under forskellige natur-/samfundsforhold, forbrug/produktion | Råstofmodellen og Ø15's scenarier/egen strategi/cirkularitet; Ø14's jord-/vandingsspørgsmål; Ø3's kystsikring og anvendelse. | **E/D.** Substantielt bæredygtighedsarbejde findes. Behovet er sammenligning mellem steder og afvejning af miljø, forbrug/produktion og sociale/økonomiske forhold. Genbrug lokale by-/fødevarecases; begrund et valg med data og konsekvenser. |
| K10 Teknologiudvikling under forskellige natur-/samfundsforhold | Råstoffer viser teknologi som lavere omkostning; Ø15 del 2/5 og journalspørgsmål 6–7 behandler strategi/begrænsninger. Stensamlingens anvendelser giver yderligere stof. | **E/D.** En omkostningsskyder er ikke en sammenligning af virkelige teknologier og deres geografiske vilkår. Tilføj en konkret teknologis muligheder, ressourcekrav, økonomi og konsekvenser i to sammenhænge; lokale energi-/fødevareforløb kan være grundlag. |
| K11 Energiressourcer, energistrømme, teknologier og forbrug | Drivhusressourcerne viser atmosfæriske energistrømme; Ø11 fossilt råstof/olie; Ø15 kobber til omstilling og genanvendelse. Progressionsplan 2, D1, og plan 3, 5.1, foreslår energidata og sol-/vindforsøg. | **E/M.** Ingen samlet sammenligning af energikilder, teknologier og faktisk energiforbrug fundet. Strålingsbalance alene dækker ikke hele punktet. Undersøg lokal Vindmøller og solceller-original. Første leverance kan være energi-/effekt-/forbrugsopgave med geografisk energimiks og konsekvenser, ikke ny kraftværkssimulation. |
| K12 FN's Verdensmål for bæredygtig udvikling | Ø15/Ø14/Ø3 giver relevante problemstillinger. Originalkataloget henviser til bæredygtige byer og ældre udviklingsmål, men indeholder ikke selve deres undervisningsindhold. Progressionsplan 2, D4, og plan 3, 5.4, skitserer målkonflikter og et slutprojekt. | **M** for en eksplicit elevundersøgelse af de nuværende FN-verdensmål med indikatorer/målkonflikter som færdigt elevmateriale. Projektforslag findes i planerne; modellen/datasættet er ikke leveret. Lokalt **U**. Vælg relevante mål til eksisterende vand-/energi-/råstofcase og vurder løsninger med indikatorer. Ældre udviklingsmål må ikke uden kontrol ligestilles med SDG'erne. |

## Faglige mål, §2.1, s. 1 – alle 10 mål

F1–F10 følger kildens rækkefølge. **E/D vurderer materialernes understøttelse.
Elevernes faktiske kompetencer står U**; de kan ikke måles ved at tælle filer
eller se en animation.

| Id / mål i kort form | Konkret eksisterende elevhandling og belæg | Udviklingsbehov / hvordan læreren kan se kompetencen |
| --- | --- | --- |
| F1 Fagsprog mundtligt og skriftligt | **E/D:** Ø-vejledningernes journalspørgsmål, vulkan-/trykforklaringer og stensamlingens klassifikation giver begreber og skriftlige svarmuligheder. | Sammenbind med kort mundtlig årsagsforklaring og skriftligt svar ud fra egne resultater; giv feedback på begrebsbrug. En ordliste alene viser ikke anvendelse. |
| F2 Identificere/genkende/klassificere rumlige mønstre | **E/D:** Ø3 sammenligner kystkort over tid, O2 lokaliserer oplande, Årstider sammenligner breddegrader; pladegrænser viser skematiske mønstre. | Lad eleven beskrive og klassificere et mønster på faktiske data. Stenklassifikation og atlasmarkører er ikke alene belæg for klassifikation af rumlige mønstre. |
| F3 Simpelt empirisk arbejde i laboratorium og felt | **E/D:** Ø1/Ø2/Ø6/Ø10/Ø13/Ø14/Ø16 m.fl. har egne forsøg/målinger, Ø12 terrænopmåling; Ø3 bruger historiske billeddata. | Forbind ressourcerne til modeller; kræv rådata, fremgangsmåde og fejlkilder. Ø15's simulerede kobbertal er ikke selvstændigt empiriforsøg. |
| F4 Udvælge/anvende digitale kort, geoinformation og repræsentationer | **E/D:** Ø3 bruger MiljøGIS, O2 kort/vandskel; atlas og orienteringsmodeller støtter adgang og retning. | Træn valg af lag, periode og målestok med begrundelse. Kontroller eksterne GIS-links og lokale Google Earth-originaler; navigation alene dokumenterer ikke informationsvalg. |
| F5 Empiribaseret beskrivelse af udvikling/processer | **E/D:** Ø3's historiske kystændring, Ø12's profil og forsøg med gentagelser/grafer giver data; Ø4 efterspørger ekstern klimakurve. | Kræv forklaring med henvisning til målinger/observationer og usikkerhed. Skeln modeloutput fra observerede data; pak evt. kildeangivne klimadata til sammenligning. |
| F6 Indkredse problemstillinger og bruge enkle problemformuleringer | **E/D:** Ø14 har konkret jord-/vandproblem, Ø15 starter med forsyningsspørgsmål og lader eleven finde strategi. | Lad eleven afgrænse/omformulere spørgsmålet, vælge variable og begrunde undersøgelsen; ikke kun følge en fast klikrækkefølge. |
| F7 Forstå/kritisk anvende geofaglige og enkle matematiske modeller | **E/D:** Ø15 R/P/scenarier, Ø16 v = √(gd) mod egne målinger; Ø4/Ø5 diskuterer analogiers begrænsninger. Simulationerne giver følsomhedsundersøgelser. | Forklar antagelser, ændr én variabel og vurder modellen mod data/virkeligt sted. Informationsbokse støtter, men er ikke elevens egen modelkritik. |
| F8 Formidling, samfundsdebat og mulige teknologiske/innovative løsninger | **E/D:** Ø15's egen strategi, cirkularitet/konfliktmineraler; Ø3's kystsikring og Ø14's vand-/landbrugsspørgsmål. | Saml aktuel kildebelagt case; formidl begrundet løsningsvalg med interessemodsætninger/usikkerhed. En syntetisk markedsmodel er ikke aktuel debatkilde. |
| F9 Naturgeografis identitet og metoder | **E/D:** Feltprofil, historisk GIS, kvantitative/kvalitative forsøg og modeller giver forskellige arbejdsmetoder. | Reflektér over metodernes muligheder og forbind lokal observation til global sammenhæng og menneskers vilkår. Et stort metodeudvalg dokumenterer ikke elevens metodebevidsthed. |
| F10 Problemstillinger i samspil med andre fag | **E/U:** NV-/NF-varianter, klima, jord, olie og råstoffer giver muligheder for fysik, kemi, biologi og samfundsfag. | Se et eksplicit fælles fagspørgsmål, begge fags bidrag og elevprodukt i et konkret forløb. HF/NV-mærker eller procentregning dokumenterer ikke dette alene. Afklar lokalt med Claude/ejeren. |

## Metoder og arbejdsformer – særskilt vurdering

§3.1–3.2 kræver virkelighedsnære temaer, eksperimentelt arbejde, feltarbejde og
ekskursioner samt varierede arbejdsformer, herunder løsningsorienteret arbejde
i ét eller flere forløb. Empirisk arbejde udgør **ca. 20 % af undervisningstiden**
(§3.2, s. 3); det er ikke en kvote af simulationslinks. §3.2–3.4 omfatter også
skriftlighed, digitale værktøjer og fagligt samspil. Denne kortlægning kan ikke
afgøre undervisningstidsfordelingen.

| Arbejdsform/metode | Belæg i biblioteket | Opfølgning |
| --- | --- | --- |
| Observation, hypotese, kontrol og måling | Mange Ø-vejledninger, med både kvantitative og rent kvalitative varianter | Vælg efter problemstilling; bevar rådata/fejlkilder. Fysisk gennemførelse er U her. |
| Feltarbejde og ekskursion | Ø12 ved skolen, Ø1's udemålinger; Ø3 er digital historisk analyse | Forbind model og lokal undersøgelse. Ø3 er ikke automatisk fysisk ekskursion; konkret ekskursionsplan afklares lokalt. |
| Databehandling, enheder og grafer | Ø2 densitet, Ø3 rate, Ø6 hastighed, Ø15 R/P, Ø16 bølgehastighed | Sammenlign beregning, måling og usikkerhed; bevar dataenes art og kilde. |
| Kort/GIS og skala | Ø3, O2 og atlas som indgang | Udvælg lag/målestok aktivt. #48's pladegrænselag med signatur/modelkritik foreligger; kommende skælvs-/vulkanlag tælles ikke som eksisterende dækning. |
| Skriftlighed og mundtlig formidling | Journal-/regneopgaver findes; modellen producerer ikke elevens forklaring | Læreren vælger passende produkter/feedback. Ingen ny fast rapportkvote indføres her. |
| Gruppe-/projektarbejde og løsninger | O1's gruppeprodukt, Ø15's egen strategi, flere gruppeundersøgelser | Saml case med begrundet løsning og fagsamspil. Faktisk varieret undervisning kan kun ejeren dokumentere. |

## Supplerende stof, §2.3 – casevalg

Kernestof og supplerende stof skal tilsammen understøtte målene.
Supplerende stof vælges med eleverne og omfatter natur-, samfunds- og
kulturfaglige problemstillinger knyttet til kernestof; globale forhold og
forskellige dele af verden tilstræbes. Der er ingen national liste over
bestemte steder eller krævet Island-model.

- **Island:** valgt demonstrationscase til K1/K2 og F2/F7; turisme, risiko og
  energi kan give perspektiver, hvis de faktisk undersøges. Casevalget er
  ikke belæg for, at tektonik er bibliotekets største mangel.
- **Nordatlanten/Grønland:** eksisterende klima-/cirkulationsressourcer kan
  perspektiveres med aktuelle data og livsvilkår. Brobygningspræsentationen
  er materiale til revision, ikke færdigt dokumenteret C-forløb.
- **Dansk kyst/opland:** Ø3, Ø12 og O1/O2 forbinder sted, proces og anvendelse.
  Istidslandskab er en senere mulighed; undersøg lokalt kortmateriale først.
- **Demografisk transition:** O5 er muligt samfundsperspektiv, ikke et ekstra
  selvstændigt kernestofkrav til stx C.

## Prioriteret opfølgning

Prioriteten gælder **efter lokal sammenligning**, bortset fra overdragelsen.
Begrundelsen er kernestofbredde, elevudbytte og genbrug. En ny model er én
mulig leverance; tekst, datasæt, feltvejledning og kortopgave kan være bedre.

| Prioritet | Konkrete næste leverancer | Hvorfor / beslutning før nyudvikling |
| --- | --- | --- |
| 0 ✓ | **Udført 14.–15. oktober 2026:** se INDHOLD.md. Claude sammenligner lokale originaler og retter mapping med fil-/sidebelæg; ejerens faglige review | Kataloget viser vind, vandbalance, energi, verdensmål og bjergartskredsløb. En repository-mangel bestiller ikke automatisk genskabelse. Se [overdragelsen](OVERDRAGELSE-CLAUDE.md). |
| 1 | Sammenhængende kulstofressource med lagre/strømme, enheder/tidsskalaer, menneskelig ændring og CO₂-kobling | K3 har tydelig systemmangel; genbrug i K2/K8/K11 og modelkritik. Begynd med kildebelagt figur og budgetopgave, hvis lokal ressource ikke løser behovet. |
| 1 | Energi-/produktionscase med teknologi, forbrug, løsninger og konkrete SDG-indikatorer | K7/K9–K12 er kun delvist samlet. Genbrug Ø15/Ø14 og lokale vind-/sol-/by-/fødevarematerialer; dataopgave før bred energisimulator. |
| 2 | Global cirkulation → klima/vegetation med klimadiagrammer og kort | K5 har procesdele og Ø9's spørgsmål, men mangler samlet geografisk anvendelse. Genbrug lokale globalvind-opgaver først. |
| 2 | Kobl kredsløb, opland, jordmålinger og indvinding i et vandbudget | K6 har allerede kredsløbs-/oplandsopgaver og forsøg. Forbind med faktiske data før ny tværsnitsmodel. |
| 2 | Kyst/terræn/bjergarter med historiske kort, landskabsdannelse og arealbrug | K2/K4; begynd med Ø3/Ø12 og lokal istids-/bjergartsøvelse. |
| Løbende | Kilde-/forbeholdsopfølgning og få konkrete elevopgaver til eksisterende modeller | Efterkontrollér tidevands-/magnetfeltpresets, AMOC-begreber, modelkalibrering og måling kontra scenarie. Detaljer i inventar/overdragelse; ingen stiltiende modelændringer i #46. |

Den vedtagne atlasretning fortsætter særskilt som **#47 → #48 → #49**:
brugbar stor globus, kildebelagte pladegrænser og fagligt afklaret
Island-demonstration. Den er ikke omprioriteret til et fast panellayout eller
omskrivning af fungerende simulationer. Registeret har fortsat seks modeller;
nye koblinger bør bygge på denne gennemgang og lokal kontrol.

## Vedligeholdelse og afslutning af #46

Ved nye/ændrede ressourcer opdateres belæg, status og relevante K-/F-id'er.
Registrér modeltype, variable, antagelser, kilde/årgang, geografi og mulig
elevhandling. Alle oplysninger behøver ikke straks et nyt felt i `modeller.js`.

Repositorydelen er gennemgået og funktionsafprøvet. Åbent før #46 afsluttes:
lokal materialesammenligning, ejerens faglige stillingtagen til usikkerheder
og endelig prioritering før større nye modeller. Ingen klasseafprøvning eller
lokal arkivgennemgang er foregivet som udført.

Relateret: [ressourceinventar](SIMULATIONSOVERSIGT.md),
[afprøvningsbelæg](gennemgang-46.json),
[Claude-overdragelse](OVERDRAGELSE-CLAUDE.md),
[ROADMAP.md](ROADMAP.md) og [ISLAND-DEMO.md](ISLAND-DEMO.md).
