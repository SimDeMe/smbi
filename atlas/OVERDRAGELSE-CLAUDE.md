# Overdragelse til Claude – lokal sammenligning i #46

**Næste opgave efter repositorygennemgangen, 14. oktober 2026.** Brugeren har
bedt om, at Claude overtager og sammenligner med de lokale materialer.
Dette dokument er overdragelsen; Claude er ikke kørt i denne session, og
originalmaterialerne på brugerens computer er ikke læst her.

## Start her

1. Læs de aktuelle [CLAUDE.md](../CLAUDE.md) og
   [design_rules.md](../design_rules.md), derefter
   [KERNESTOF.md](KERNESTOF.md), [SIMULATIONSOVERSIGT.md](SIMULATIONSOVERSIGT.md)
   og [#46](https://github.com/SimDeMe/smbi/issues/46).
2. Arbejd i den lokale `SimDeMe/smbi`-klon på `main`. Kontrollér status og
   synkronisér uden at overskrive brugerens ændringer. Repositorygennemgangen
   er baseret på `59bdf7c`; dokumentationscommittene ligger efter dette.
3. Find det faktiske lokale materiale. `CLAUDE.md` nævner
   `~/Library/CloudStorage/OneDrive-FællesDigital/SM-DRIVE/forsøgsvejledninger_sm-drive/`.
   [Forsogsvejledninger.md](../Øvelser/Forsogsvejledninger.md), afsnit
   **NATURGEOGRAFI**, har 25 grupper af originalhenvisninger med præfikset
   `BASE/`. **BASE er en katalogmarkør, ikke en verificeret absolut sti.**
   Brugeren har endnu ikke angivet en supplerende lokal placering her.
   Hvis materialerne ikke findes i de tilgængelige lokale mapper, få den
   konkrete placering fra ejeren; tilstedeværelse i kataloget er ikke læsning.
4. Sammenlign både forsøgsoriginaler og relevante undervisningsforløb,
   opgaver, præsentationer, datasæt og kort. Find først genbrug i arkivet;
   byg ikke de foreslåede nye modeller som led i denne sammenligning.

## Hvad der allerede er gjort

- Den aktuelle officielle stx-oversigt, læreplan **Naturgeografi C – stx,
  august 2024, bilag 120A**, og B/C-vejledningen med forside **Juni 2024** er
  kontrolleret. Kilder, sider og fingeraftryk er dokumenteret.
- Alle 12 §2.2-punkter og 10 §2.1-mål er kortlagt. K1–K12/F1–F10 er egne
  id'er i kildens rækkefølge. Metoder/arbejdsformer og supplerende stof er
  behandlet særskilt; B-stof er ikke gjort til C-krav.
- Alle 16 elevressourcer i `geografi/` er indholdsgennemgået og betjent i
  Chromium. Alle 17 geografiske øvelseskilder og fem `GeoOpgaver`-ark med
  svarvariant er læst. Arkiv, beskæringsværktøj og indgangsdubletter er
  identificeret særskilt. Se [afprøvningsbelæg](gennemgang-46.json).
- De tre `Progressioner/`-dokumenter er også læst som idé-/forløbsplaner.
  Genbrug deres kulstof-, data-, energi- og verdensmålsbriefs; de foreslåede
  modeller er ikke dokumenteret implementeret, fordi de står i en plan.
- Ingen simulationskode, modeltal, eksisterende URL eller atlaslayout er
  ændret. Kortlægningen er ikke fysisk forsøgs-/klasseafprøvning eller fuld
  uafhængig validering af alle modeltal.

## Lokale materialer at begynde med

Nedenfor er konkrete spor fra originalkataloget, **ikke fundne/læste lokale
filer**. Nummeret er katalogets geografigruppe. Søg også uden for disse
grupper; manglen på en katalogoverskrift om kulstof beviser ikke, at emnet
mangler i brugerens undervisning.

| Kortlægningspunkt | Katalogspor / karakteristisk filnavn | Det Claude skal afgøre |
| --- | --- | --- |
| K3/K8, globalt kulstof | Gruppe 15: `Nr. 2 - Vejledning - måling af kuldioxid.docx`; desuden lokale klima-/energiforløb og kulstof-/kredsløbsfigurer | Er globale lagre, strømme, hurtige/geologiske kredsløb og menneskelig påvirkning samlet behandlet? En CO₂-måling alene besvarer ikke dette. |
| K5, global cirkulation/klima/vegetation | Gruppe 4: `Øvelser i det globale vindsystem ... .docx`, bl.a. `Undervisning 2018-2019/FAG - NG/Forløb 2 - vejr og klima/`; gruppe 5/6/16: konvektion, vand/sand, sø-/landbrise | Find klimadiagrammer, klimazone-/plantebæltekort og elevernes sammenkobling af breddegrad, vind og nedbør. Ø9 i repoet har allerede Hadley-/plantebæltespørgsmål; opret ikke en dublet. |
| K6, vand | Gruppe 11: `Øvelse Vandbalancen.docx` og `... - med facitliste.docx`; gruppe 3/14: jord/grundvand/nedsivning | Supplerer originalen O1/O2 og jordøvelserne med kvantitativt vandbudget, faktisk indvinding og ressourceforvaltning? |
| K7/K9, produktion og levevilkår | Gruppe 17: `Øvelse 4 Levevilkår - erhvervsfordeling udviklingsmål.docx`; gruppe 21 under `2023 Villumforløb/Naturgeografi forløb/Fremtidens bæredygtige fødevareproduktion/` | Hvilke regioner, produktionsvilkår, samfundsdata og elevvalg behandles? Er ældre tal/udviklingsmål opdateret? |
| K9/K10/K12, bæredygtighed/teknologi/verdensmål | Gruppe 23: `Undervisningsmateriale Katalog/NG/Bæredygtighed og verdensmål/Bæredygtige byer/hjemmeforsøg bæredygtige byer.docx`; også fødevareforløbet | Er de aktuelle FN-verdensmål, indikatorer, målkonflikter og konkrete løsninger faktisk anvendt? Map indholdet, ikke mappenavnet. |
| K11, energi | Gruppe 18: `Øvelse 5 Vindmøller og solceller.docx` under `.../HF NF eksamen fra CS/1q NF eksamen del B øvelser/`; gruppe 7/13: oliemigration og lokal strålingsbalance; øvrige energiforløb | Sammenlignes energiteknologier, effekt/energi, forbrug og natur-/samfundsvilkår? Bevar bevidste fravalg i den nye oliemigrationsvejledning frem for automatisk at genindsætte gammelt stof. |
| K1/K2, geologi/kredsløb | Gruppe 9: `Bjergarternes kredsløb øvelse del I + del II + del III (1).docx`; gruppe 20: `Øvelse om pladetektonik i Google Earth_C_niveau.docx` | Find processammenhæng, geologisk tid og empiriske kortmønstre, som de eksisterende enkeltmodeller kun bidrager til i dele. |
| K4, landskab | Gruppe 24: `Kortøvelse til istidslandskaber.docx`; gruppe 12: kysterosion/oversvømmelse | Hvad kan genbruges sammen med Ø3's kyst-GIS, Ø12's feltprofil og jord/arealbrug, før en ny landskabsmodel overvejes? |
| K8/F8/F10, klima/case/fagsamspil | Gruppe 25: `NG/Klima/OD forløb - Klimandringer i Grønland/Lærervejledning - NG.pdf`; egne NV-/NF-/stx-forløb | Find faktiske data, aktuelle samfundsspørgsmål og fælles problemstillinger/produkter med andre fag. Et NF-mærke alene er ikke belæg. |

## Faglige spørgsmål til efterkontrol

Disse er reviewpunkter med konkret anledning, ikke allerede dokumenterede
fejl i alle berørte modeller. Ret først efter kilder og afklar ændringens
omfang; modelrettelser skal have egen begrundelse og relevant test.

- **AMOC/Golfstrøm:** skeln vinddrevet strøm og omvæltningscirkulation.
  Grønlandspumpens simulerede tærskel/tid er ikke et observeret prognoseår.
  Kontroller Ø7, journalspørgsmål 10, om ekstra 0,5–1 m havniveau i
  Nordatlanten. Brobygningsmaterialets klimaforskel København/Goose Bay
  kræver flere forklaringer og kildebelæg; det har også to ark under
  `temp/havets-motor/` med tankanalogi og densitetstal.
- **Tidevand og magnetfelt:** efterspor stedamplituder og polhistorikkens
  kilder/årgange. Dipolmodellens lokale misvisning må ikke præsenteres som
  fuld IGRF/WMM-beregning; tidevand er ikke en lokal farvandsprognose.
- **Jordvand:** efterkontrollér Hazen-/Darcyantagelser og især anvendelse ved
  ler; 2D-hulrum og modelgennemløb er ikke feltkalibreret grundvandsdannelse.
- **Kyst og nedbør:** didaktisk kalibreret sandtransport er ikke målt
  kystbudget. Faste adiabater/kapacitetskurver er forenklinger; hold luftens
  vandindhold, kondens og geografisk nedbør/enheder adskilt.
- **Bjergarter:** kontrollér absolutte formuleringer i Ø2 om, hvilken plade
  der altid subducerer. Stensamlingens numre/fotos kontrolleres mod samlingen.
- **Eksisterende forbehold:** Ø4 spørgsmål 7 behandler allerede, at håndklæder
  mest bremser konvektion frem for at efterligne drivhusgassers IR-absorption;
  Ø15 har allerede cirkularitet, konfliktmineraler og modelkritik. Genbrug
  dette i stedet for at beskrive det som fraværende.

## Leverance fra Claude

Opdatér KERNESTOF.md og tilføj en lokal sammenligning med disse felter:

| K-/F-id | Faktisk læst lokal fil og side/afsnit | Indhold/elevhandling | Hvad findes allerede i repoet? | Genbrug, revision eller fortsat mangel | Kilde/årgang/usikkerhed |
| --- | --- | --- | --- | --- | --- |
| Fx K11 | Udfyld efter læsning, ikke ud fra katalogtitel | Konkret belæg | Ø11/Ø15 er delressourcer | Begrund beslutningen | Notér hvad der stadig er U |

Dæk alle K1–K12/F1–F10, også hvor lokal status forbliver U; begrund det.
Hold repository- og lokaldækning adskilt. Slå dubletter sammen fagligt uden at
slette originaler, og registrér hvilket indhold der skal bevares/opdateres.
Gennemgå prioriteringen med ejeren før større nyudvikling, som #46 kræver.
Afslut først #46, når den lokale sammenligning og den faglige gennemgang er
behandlet; sig konkret til, hvis en del fortsat mangler.

Arbejd direkte på `main` i små danske commits. Ved ændrede øvelseskilder
gælder CLAUDE.md's krav om originalkontrol, opdateret øvelsesoversigt og
genrendering til HTML/PDF/Word. Bevar simulationer og URL'er. Den valgte
atlasretning #47 → #48 → #49 fortsætter med stor brugbar globus og faglig
modelbeskrivelse før avanceret Island-animation.

## Kort starttekst til en ny Claude-session

> Overtag #46 i SimDeMe/smbi. Læs først CLAUDE.md, design_rules.md og
> atlas/OVERDRAGELSE-CLAUDE.md. Repositoryets 16 geografiske elevressourcer,
> 17 øvelser og opgaveark er gennemgået og mappet i atlas/KERNESTOF.md og
> atlas/SIMULATIONSOVERSIGT.md. Sammenlign nu med mine faktiske lokale
> undervisningsmaterialer, dokumentér fil-/sidebelæg og revidér dækning og
> prioritering. Arbejd på main og bevar eksisterende simulationer. Byg ikke
> de foreslåede nye modeller som led i materialesammenligningen.
