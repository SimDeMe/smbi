# Fagets indhold og atlasdækning – Naturgeografi C

**Udkast 14. oktober 2026 til #46; status og ejerens afgørelser opdateret
15. oktober 2026 (se nedenfor).** Formålet er en samlet oversigt over,
hvad faget indeholder i praksis, og hvad atlasset og simulationerne derfor skal
dække. Oversigten er grundlag for et færdigt roadmap; den bestiller ikke selv
udvikling. Den supplerer [KERNESTOF.md](KERNESTOF.md), som mapper læreplanens
ordlyd, med en mere finkornet liste over **indholdsenheder**: de begreber,
processer, figurer og steder, eleverne faktisk arbejder med.

## Grundlag

Indholdsenhederne er fundet ved at lægge tre kilder oven på hinanden:

1. **Læreplanen** Naturgeografi C – stx, august 2024, §2.2 (K1–K12, se KERNESTOF.md).
2. **Grundbogen** *Naturgeografi C*, 4. udg., Praxis (kapitel 1–7, s. 7–190).
3. **Ejerens undervisning:** de fire ngC-forløb 2025/26 (*Klima og fødevarer*,
   *Vand og jord*, *Pladetektonik og naturkatastrofer*, *Energi og
   teknologi*), de syv eksamensspørgsmål 2026, ældre forløb fra 2018/19 og
   2a ng 2024/25 (bl.a. *Kort og bæredygtighed*). Kun brugt som belæg for
   indholdet; undervisningsfilerne er ikke ændret.

**Eksamensspørgsmål 2026**, nævnt som "Eks." nedenfor:
1 Klimazoner og fødevarer · 2 Monsun og sø- og landbrise · 3 Grundvand og
trusler mod drikkevandet · 4 Istider og det danske landskab · 5 Vulkaner ·
6 Jordskælv · 7 Klimaforandringer.

**Atlasdækning i dag:** seks modelkort, tre steder (Island, Nordatlanten,
Alperne) og et valgfrit pladegrænselag (PB2002). Biblioteket `geografi/`
har 16 elevressourcer (se [SIMULATIONSOVERSIGT.md](SIMULATIONSOVERSIGT.md)).

**Siden udkastet (status 15. oktober 2026, Atlas v433):** klimazoner som
globalt lag (Köppen–Geiger og Vahl) og en landemenu med demografi og
hydrotermfigurer (B5), jordskælvslag fra USGS og vulkanlag fra Smithsonian
GVP (A5, A6), et Danmarkskort og Island som 3D-model. De 11 afprøvede
øvelser nedenfor er flyttet til `Øvelser/Geografi/`, og 22
forsøgsvejledninger er koblet til atlassets steder, undersøgelser og søgning
(`oevelser` i `modeller.js`). Statuskolonnerne i tabellerne er fra udkastet;
A5, A6 og B5 er nu mindst delvist dækket i atlasset, men modellerne for
seismiske bølger og lokalisering mangler stadig.

**Statusord i tabellerne**

- **Dækket:** en eksisterende smbi-ressource bærer enheden; atlasset skal højst have et link/sted.
- **Delvis:** en ressource rører enheden, men den centrale sammenhæng mangler.
- **Mangler:** ingen smbi-ressource.

## A. Jordens og landskabernes processer (K1–K4)

| # | Indholdsenhed | Eleven skal kunne | Belæg | smbi i dag | Atlasbehov | Status |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | Geologisk tid og Jordens udvikling | Placere hændelser på tidsskalaen (kvartær, holocæn, antropocæn, masseuddøen) | K1; bog s. 53–56; pladetektonik mod. 1 | – | Interaktiv geologisk tidslinje, der kan genbruges fra andre modeller | Mangler |
| A2 | Jordens opbygning | Lagene, densitet og tilstand; endogene kræfter | K1; s. 62–63; mod. 1 | Ø2 densitet (forsøg) | Indgår i A6-modellen (snit gennem Jorden) | Delvis |
| A3 | Kontinentaldrift → pladetektonisk model | Wegeners belæg, havbundsspredning, palæomagnetisme, havbundens alder | K1; s. 63–69; mod. 2 (GPlates, højdeprofil over Midtatlanten) | Pladegrænser, Magnetisk nord; **atlaslaget Havbund (v441)** med profil og spredningshastighed | ~~Lag: havbundens alder~~ leveret (Seton m.fl. 2020). Rekonstruktion af kontinenternes placering over tid (kilde: fx GPlates) | Delvis (laget leveret) |
| A4 | Pladegrænsetyper | Fire typer med processer og landformer; relative bevægelser på kort | K1; s. 66–69; mod. 2, 9 | Pladegrænser; atlasets pladegrænselag | Steder fra undervisningen: Midtatlanten/Island, Afar, Andes, Japan Trench, Marianergraven, Cascadia, Himalaya, Nordanatoliske forkastning, Sunda | Dækket (lag findes; flere steder) |
| A5 | Vulkaner og hotspots | Vulkantyper, VEI, udbrudsforløb; hotspotkæde og pladehastighed; hvorfor man bor ved vulkaner | K1; s. 70–74; mod. 3–4; **Eks. 5** | Vulkanudbrud, Ø10 | **Lag: aktive vulkaner** (Smithsonian GVP). Sted Hawaii med øernes alder vs. afstand → pladehastighed. Sted Vesuv/Napoli | Delvis |
| A6 | Jordskælv og seismiske bølger | Forkastning, hypo-/epicenter, P-/S-/overfladebølger, skyggezoner, lokalisering ud fra S–P-tid, sikring mod skælv | K1; s. 74–79; mod. 7–8; **Eks. 6** | Ø16 tsunami (forsøg); Pladegrænser viser modelskælv | **Ny model: seismiske bølger og skyggezoner** gennem Jordens indre + **lokalisering af skælv** (tre stationer, cirkler). **Lag: jordskælv** (USGS, dybde). Steder Nepal 2015, Tokyo | Mangler |
| A7 | Bjergarter og bjergarternes kredsløb | Tre hovedgrupper, dannelsesmiljø, kredsløbet koblet til pladetektonik | K2; s. 57–61; mod. 6 | Stensamling, Ø2; **Bjergarternes kredsløb (v442)**: stenens rejse, steder ved pladegrænserne med quiz på stensamlingen, afkøling og kornstørrelse | ~~Ny model~~ leveret | Dækket |
| A8 | Råstoffer: kul, olie og gas, reserve og ressource | Dannelse, kulrækken, fælder; forskellen mellem ressource og reserve; konsekvenser af udvinding | K2/K11; s. 182–187; energi mod. 3 (Garzweiler) | Reserve og ressource, Ø11 | Sted Garzweiler/Lützerath (mineudvidelse over tid). Kuldannelse som trin i K-kulstofmodellen (E4) | Delvis |
| A9 | Istider og det danske landskab | Weichsels fremstød, hovedopholdslinjen, moræne, smeltevandsslette, tunneldal, bakkeø, hævet havbund; ledeblokke; aktualismen | K4; s. 137–153; vand mod. 8–9; **Eks. 4** | – | **Ny model: isens landskabsdannelse** (gletsjer → landformer). **Danmarkslag:** hovedopholdslinje, landskabstyper/jordarter (GEUS). Steder Røjle Klint, Mols Bjerge, Karup smeltevandsslette | Mangler |
| A10 | Kyst og fluviale landskaber | Bølgers erosion/aflejring, tidevand, kystudvikling; åer og oplande | K4; s. 154–165; Ø3 Røjle | Bølger, Tidevand, Ø3, O2 | Sted Røjle Klint (Ø3's historiske kort). Lille behov | Dækket |
| A11 | Jordbund | Jordtyper og kornstørrelser; podzol, brunjord, rødjord og deres klima | K4/K6/K7; vand mod. 1, 7; Geoviden *Jordbund* | Porøsitet og permeabilitet, Ø13/Ø14 | Jordprofiler knyttet til klimazonerne i B5 (samme sted-klik) | Delvis |

## B. Klima og vejr (K5, K7, K8)

| # | Indholdsenhed | Eleven skal kunne | Belæg | smbi i dag | Atlasbehov | Status |
| --- | --- | --- | --- | --- | --- | --- |
| B1 | Solstråling, årstider og strålingsbalancen | Indstråling efter breddegrad og årstid; kort-/langbølget stråling; strålingsbalancefiguren | K5/K8; s. 84–89; klima mod. 11 (figuren trænet ved tavlen hele året) | Årstider, Drivhus enkel/udvidet, Ø1 | **Lag: årsmiddelindstråling/strålingsoverskud** som bro til B3 | Dækket |
| B2 | Luftfugtighed, adiabater og nedbørstyper | Dugpunktskurven, tør-/fugtadiabat; stignings-, konvergens- og frontregn | K5/K6; s. 89–94; vand mod. 2 | Dugpunkt, Stigningsregn, O3/O4 | **Front- og konvergensregn mangler** som model. Undervisningen bruger **de norske fjelde** til stigningsregn – overvej sted Vestnorge ud over Alperne | Delvis |
| B3 | Vind, tryk og lokale vinde | Termiske høj-/lavtryk, trykgradient; sø- og landbrise; føhn | K5; s. 94–96; klima mod. 6–10; **Eks. 2** | Termiske tryksystemer, Stigningsregn, Ø8/Ø9 | Ingen ny model nødvendig | Dækket |
| B4 | Global atmosfærisk cirkulation | Corioliseffekten; 3-cellemodellen; passat, vestenvind, ITK; ITK's årlige vandring og monsun | K5; s. 96–102; klima mod. 7–10 (tegnes ved tavlen, aflæses i earth.nullschool); **Eks. 1–2** | Termiske tryksystemer (kun monsun-case); atlasets "globale atmosfæretema" er en tekst; **atlaslaget Nedbør (v445)** viser ITK's vandring og monsunen måned for måned i observerede data | **Ny globusmodel: 3-cellemodel med Coriolis og ITK/monsun januar ↔ juli.** Steder Mumbai/Indien, Sahel, Afrikas Horn | Mangler |
| B5 | Klimazoner, plantebælter og hydrotermfigurer | Aflæse og tegne hydrotermfigur; forklare zone og plantebælte ud fra B1/B4; kobling til afgrøder | K5/K7; s. 104–113; klima mod. 4–5 (fem steder, Accra/København); **Eks. 1** | – | **Lag: klimazoner/plantebælter** + **klik på et sted → hydrotermfigur** fra klimanormaler, zone, plantebælte (og jordbund A11). Det mest oplagte atlaselement i faget | Mangler |
| B6 | Havstrømme og energitransport | Varmetransport fra ækvator mod polerne; termohalin cirkulation | K5/K8; s. 96–97 | Grønlandspumpen, Ø5/Ø6/Ø17 | **Lag: overfladestrømme**, så Grønlandspumpen får global sammenhæng | Delvis |
| B7 | Klimaændringer: naturlige og menneskeskabte | Milanković-cykler og istider; observeret opvarmning og CO₂; drivhuseffekt; havniveau; konsekvenser | K8; s. 113–118, 182, 188; energi mod. 3; **Eks. 7** | Drivhus udvidet, Ø4, Ø7, Grønlandspumpen | **Datafigur: observeret temperatur og CO₂** (kildeangivet). Milanković/istidscyklus kobles til A9. Model og observation holdes adskilt | Delvis |

## C. Vand (K6)

| # | Indholdsenhed | Eleven skal kunne | Belæg | smbi i dag | Atlasbehov | Status |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | Vandets kredsløb og vandbalancen | Magasiner, strømme og opholdstid; N = E + A + ΔR måned for måned | K6; s. 119–124; vand mod. 5; ældre vandbalanceøvelse | O1 | **Ny model: vandbalance for et sted** (nedbør og fordampning over året → overskud/underskud, grundvandsdannelse). Genbruger B5's klimadata | Mangler |
| C2 | Grundvand og drikkevand | Grundvandsdannelse, magasiner, ler/sand, boring og sænkningstragt, saltvandsintrusion, nitrat og pesticider, BNBO | K6; s. 126–131; vand mod. 6–7, 9 (Fjordudsigten, nitrat i Aalborg); **Eks. 3** | Porøsitet og permeabilitet, Ø13/Ø14 | **Ny tværsnitsmodel: grundvand** – indvinding nær kyst, ler- vs. sanddække og nitratets vej. Steder Aalborg (kridt), en kystkommune | Mangler |
| C3 | Oplande og vandskel | Topografisk opland og grundvandsopland | K6/K4; vand mod. 5 | O2 | Danmarkslag: hovedvandskel (jyske højderyg) | Delvis |
| C4 | Global vandforsyning | Vandstress og regionale forskelle | K6; s. 132–135 | – | **Datalag: vandstress** (fx WRI Aqueduct) | Mangler |

## D. Mad, mennesker og bæredygtighed (K7, K9, K10, K12)

| # | Indholdsenhed | Eleven skal kunne | Belæg | smbi i dag | Atlasbehov | Status |
| --- | --- | --- | --- | --- | --- | --- |
| D1 | Bæredygtighed og verdensmål | Tre dimensioner; verdensmål og indikatorer; målkonflikter | K9/K12; s. 28–31; klima mod. 1–3 | Ø15 (delvis) | Ikke en simulation. **Verdensmål-felt på modelkort og steder** (hvilke mål berøres) | Mangler |
| D2 | Fødevareproduktion, fordeling og sult | Naturgrundlag for landbrug; kJ-forsyning, GHI; sult og sårbarhed på Afrikas Horn; grøn revolution | K7/K10; s. 21–43; klima mod. 2, 12–13 | O5 (demografi) | **Datalag: Global Hunger Index og kalorieforsyning** (kildeangivet år). Steder Afrikas Horn, Ghana | Mangler |
| D3 | Levevilkår og udvikling | BNP, HDI, børnedødelighed, erhvervsfordeling, demografisk transition | K7/K9; s. 21–23, 43–52 | O5 | **Datalag: HDI/BNP**; kobles til D2 | Mangler |
| D4 | Teknologi under forskellige vilkår | Grøn revolution, solparker i ørken vs. Danmark, byggeteknik mod skælv, vindmølleplacering | K10; s. 39–41, 172–179; energi mod. 1 | Reserve og ressource | Indgår i E2 og A6; ingen selvstændig model | Delvis |

## E. Energi og kulstof (K3, K11)

| # | Indholdsenhed | Eleven skal kunne | Belæg | smbi i dag | Atlasbehov | Status |
| --- | --- | --- | --- | --- | --- | --- |
| E1 | Energiforbrug og energimiks | Udvikling i verdens energiforbrug; energimiks og forbrug pr. indbygger; energi, effekt, virkningsgrad | K11; s. 169–171; energi mod. 1 (Our World in Data, Energinet) | – | **Datalag: energiforbrug pr. indbygger og andel vedvarende** | Mangler |
| E2 | Vedvarende energi | Sol (indstråling, solfanger vs. solcelle, nyttevirkning), vind (vind³, ruhed, placering), vandkraft | K11/K10; s. 172–179; energi mod. 1–2; 2018/19 vindmølleforløb | Årstider (indstråling) | **Ny model: sol- og vindpotentiale for et sted** (indstråling fra B1, vind fra B4; areal → årsproduktion). Steder: solparker i Nordafrika/Danmark/Kina, havvind i Nordsøen | Mangler |
| E3 | Kernekraft og fossil energi | Fordele/ulemper, CO₂-udledning | K11; s. 180–187 | Ø11, Reserve og ressource | Indgår i E4 og A8 | Delvis |
| E4 | Det globale kulstofkredsløb | Lagre og strømme (Gt C, Gt C/år); hurtigt vs. langsomt kredsløb; menneskets bidrag; Keeling-kurven | K3/K8; s. 182; energi mod. 3 | – (drivhusmodellernes CO₂-skyder) | **Ny model: kulstofkredsløb med lagre og strømme** og aktuelle tal (Global Carbon Budget). Bogens tal er fra 2013 (6–7 Gt C/år, 400 ppm) | Mangler |

## F. Metode og kort (F2, F4)

| # | Indholdsenhed | Eleven skal kunne | Belæg | smbi i dag | Atlasbehov | Status |
| --- | --- | --- | --- | --- | --- | --- |
| F1 | Kort, koordinater og projektioner | Bredde/længde, målestok, projektionsforvrængning, tematiske kort | F4; s. 13–19; klima mod. 1 (The True Size); 2a24 *Kort og bæredygtighed* | Kompas, Magnetisk nord, selve atlasset | **Koordinat- og målestoksvisning på globussen.** Lille projektionsdemo (globus vs. Mercator) | Delvis |
| F2 | GIS og fjernanalyse | Vælge lag, sammenligne over tid, højdeprofiler | F4/F5; mod. med Google Earth, GPlates, GEUS, nullschool | Ø3 | Atlassets lag skal kunne kombineres og have kilde/årstal synligt | Delvis |

## Roadmapforslag

Rangeret efter **eksamensvægt** (eksamensspørgsmål og moduler i
undervisningen), **hul i smbi** og **atlasegnethed** (giver det mening på en
globus?). Store modeller kræver faglig modelbeskrivelse før kode, som #49.

| Trin | Leverance | Indholdsenheder | Begrundelse |
| --- | --- | --- | --- |
| **1** | Klimazoner med klik → hydrotermfigur, plantebælte og jordbund | B5, A11, (C1-data) | Eks. 1; to moduler; intet i smbi; selve kernen i et geografisk atlas. Datagrundlaget genbruges i C1 og E2 |
| **1** | 3-cellemodel på globussen med Coriolis og ITK/monsun januar ↔ juli | B4 (+ B3-link) | Eks. 1–2; tre-fire moduler; ingen model. Bygger direkte på globussen |
| **2** | Jordskælvs- og vulkanlag (#48 fortsat; **lagene er leveret i v430**) + model for seismiske bølger og lokalisering | A5, A6 | Eks. 5–6. Allerede planlagt i #48; modellen mangler helt |
| **2** | Istidslandskab: model + Danmarkslag | A9, C3 | Eks. 4; intet i smbi. Danmarkslaget bærer også C2 og C3 |
| **2** | Grundvandstværsnit | C2 | Eks. 3; intet ud over porøsitetsmodellen |
| **3** | Kulstofkredsløbet med lagre og strømme | E4, B7 | K3 er et selvstændigt kernestofpunkt uden ressource; ligger under Eks. 7 |
| **3** ✓ | Havbundens alder + bjergarternes kredsløb (**leveret v441–v442**) | A3, A7 | Styrker Island-demonstrationen (#49) |
| **4** | Datalag: energi, GHI, HDI, vandstress + verdensmål-felt i registeret | E1, D1–D3, C4 | Billigt med god kildeangivelse; giver K7/K9–K12 en atlasindgang |
| **4** | Vandbalance og sol/vind-potentiale for valgt sted | C1, E2 | Genbruger trin 1's klimadata |
| **5** | Geologisk tidslinje, front-/konvergensregn, havstrømslag, projektionsdemo | A1, B2, B6, F1 | Mindre huller |

Allerede dækket og kun med behov for atlaslink/sted: B1, B3, A4, A10
(Årstider, drivhusmodellerne, Termiske tryksystemer, Pladegrænser, Bølger, Tidevand).

## Afprøvede øvelser flyttet til smbi.dk

Alle 11 er flyttet til `Øvelser/Geografi/` (oktober 2026) og vises nu i
atlasset under de relevante steder, undersøgelser og i søgningen:

| Øvelse | Enhed | Original |
| --- | --- | --- |
| Sø- og landbrise | B3 | Geolink-dokument; kopi i Katalog/Geolink/Øvelser |
| Måling af luftfugtighed (psykrometer) | B2 | Geolink, *Vand og jord* mod. 2 |
| Solfangerforsøg | E2 | 2b 2025/26, *Energi og teknologi* |
| P- og S-bølger i slinky | A6 | Kun Lectio/Geolink-beskrivelse |
| Lokalisering af jordskælv | A6 | Geolink-pdf; 2018/19-udgave til Google Earth |
| Hawaii og Stillehavspladens hastighed | A5 | 2018/19 *Forløb 4 – Geologi* + facit |
| Ledeblokke | A9 | NF *Mammutter*-udgave |
| Kortøvelse til istidslandskaber | A9 | Forsøgsarkiv gruppe 24 |
| Bjergarternes kredsløb, del I–III | A7 | 1g6 NV 2019/20 |
| Vandbalancen | C1 | 2018/19 (ophav "FG" uafklaret) |
| Vindmøller og solceller / Planlægning af vindmølleparker | E2 | NF-øvelse 2017; Geolink NG 2022 |

## Ejerens afgørelser (15. oktober 2026)

1. **Rangeringen er godkendt.** Jordskælvs- og vulkanlagene er allerede
   leveret (v430); det, der står tilbage af trin 2 for A5/A6, er modellen
   for seismiske bølger og lokalisering.
2. **Ja, datalag med samfundsdata (GHI, HDI, energi, vandstress) skal med i
   atlasset**, med kilde og årstal synligt, ligesom de naturgeografiske lag.
3. **Ja, atlasset skal have et Danmarkskort i højere opløsning** til istid,
   grundvand og oplande (A9, C2, C3), og ikke kun Danmark som sted.
4. **Ja, Vestnorge skal være sted for stigningsregn** ud over Alperne (B2).

### Ressourcer og samfund · 18. oktober 2026

- **C4:** lag for vandstress er leveret med FAO/SDG 6.4.2-data (2022),
  klassegrænser, datatabel, kilde og elevspørgsmål.
- **E1:** energimiks er leveret (2023, elproduktion/primærenergi og andele
  for ti energikilder). Energiforbrug pr. indbygger og tidsudvikling mangler.
- **E2/D4:** globalt oversigtslag for solindstråling og middelvind i 50 m
  højde er leveret (NASA POWER 2001–2020), med forbindelse til forsøget
  Vindmøller og solceller. En lokal produktionsmodel med areal,
  virkningsgrad, vindfordeling og ruhed er fortsat åben.
- Samfundsdata hedder nu **Ressourcer og samfund** i lagmenuen. GHI er
  fortsat en åben opgave; det er Global Hunger Index, ikke solindstråling.
