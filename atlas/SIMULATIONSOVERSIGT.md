# Ressourcegennemgang til #46

Gennemgået 14. oktober 2026 mod `main` ved
`59bdf7ca9c573b4eebeb17ae69c7657bb92c6ae3`. Dette er belæg for
[kernestofkortlægningen](KERNESTOF.md), ikke en godkendelse af alle modellernes
tal eller dokumentation for elevers målopfyldelse. Lokale originalmaterialer
er ikke tilgængelige her; næste gennemgang er beskrevet i
[overdragelsen til Claude](OVERDRAGELSE-CLAUDE.md).

## Afgrænsning og metode

Inventaret sammenholder kort og links i `geografi.html`, hele `geografi/`,
`GeoOpgaver/`, `Øvelser/Geografi/`, `Progressioner/`, atlasregisteret og øvrige undervisningsfiler
fundet ved fil- og indholdssøgning. Der er **16 elevressourcer direkte i
`geografi/`: 15 simulationer/procesfigurer og ét interaktivt stenkatalog**.
Alle 16 er åbnet i Chromium og betjent; indhold og modelkode er læst for at
skelne regnemodel, animation, observation og elevopgave. Opgaveark og alle
17 geografivejledningers `.qmd` er indholdsgennemgået; deres renderede formater
er kontrolleret for tilstedeværelse. Forsøgene er ikke udført fysisk.

Testdato, afprøvede handlinger og faktiske aflæsninger findes i
[gennemgang-46.json](gennemgang-46.json). Afprøvningen ved 1366×625 er en
funktionsgennemgang. Den erstatter ikke #47's layout-, browser-, touch- eller
tilgængelighedstest. Ingen simulationskode eller eksisterende URL er ændret.

K1–K12 og F1–F10 henviser til de redaktionelle id'er i KERNESTOF.md.
Ø1–Ø17 og O1–O5 nedenfor er kun lokale krydshenvisninger i denne gennemgang.
Koblinger angiver **bidrag**, aldrig automatisk fuld dækning.

## De 16 elevressourcer

### Årstider og vejr

| Ressource | Faktisk funktion og afprøvet elevhandling | Antagelser og grænse for bidraget | Kobling og eksisterende opgaver |
| --- | --- | --- | --- |
| [Årstider](../geografi/Aarstider.html) | Skift København mellem sommer og vinter og aflæs daglængde; vælg Nordpolen. Dato, soltid og aksehældning styrer solhøjde, dagskurve og beregnet indstråling. | Astronomisk idealisering; figuren er ikke i størrelsesforhold. Beregnet indstråling er ikke en målt lokal strålingsbalance eller en temperaturprognose. Uddybninger mærket B-niveau er frivillige, ikke nye C-krav. | K5, forudsætning for K7–K8; F2/F7. Ø1 giver en anden, empirisk undersøgelse af overflader. |
| [Dugpunkt](../geografi/Dugpunkt.html) | Afkøl luft med fast vandindhold fra 20 til 0 °C; relativ fugtighed når mætning og kondens vises. Nulstil og sammenlign med en tørrere luftpakke. | Kapacitetskurven er en enkel eksponentialtilnærmelse. Kondens i modellen må ikke uden videre læses som geografisk nedbør i mm; luftvolumen og fysisk forløb skal fastholdes. Ingen fuld sky-/vejrdynamik. | K5/K6; F1/F7. Forberedelse til Stigningsregn og O3/O4. |
| [Stigningsregn](../geografi/Stigningsregn.html) | Flyt luftpakken over bjerg med tastatur; aflæs højde, temperatur, fugtighed og udfældning på luv-/læside. Starttemperatur og vandindhold kan ændres. | Idealiseret bjerg og faste tør-/fugtadiabatiske temperaturfald; ikke målt nedbør ved en bestemt lokalitet. Fast fugtadiabat er en forenkling. | K5/K6, mulig kobling til K7; F5 først med empiriske data, F7 direkte. O3/O4 giver regneopgaver. |
| [Termiske tryksystemer](../geografi/TermiskTryk3.html) | Dag/nat skifter temperatur-, tryk- og vindrespons; casevalg og seks forklaringstrin forbinder opvarmning, luftsøjle, trykflader og vind. Cases omfatter brise, vinterhøjtryk og monsun. | Begrebslig idealisering med foreskrevne overfladeegenskaber; hverken fuld vejrprognose eller global trecellecirkulation med Coriolis og jetstrømme. | K5, del af K7. Ø8/Ø9 om konvektion; Ø9 spørger videre til Hadleycellen og plantebælter. |

### Klima, hav og kyst

| Ressource | Faktisk funktion og afprøvet elevhandling | Antagelser og grænse for bidraget | Kobling og eksisterende opgaver |
| --- | --- | --- | --- |
| [Drivhuseffekten, udvidet](../geografi/drivhuseffekten.html) | Trinvis energiforklaring, undersøgelsestilstand og quiz. Fordobl CO₂ fra 280 til 560 ppm og aflæs ændret modeltemperatur; albedo kan også ændres. | Forenklet global energibalancemodel; scenarierespons er ikke en lokal klimaprognose. CO₂ er en inputparameter, ikke resultat af et modelleret globalt kulstofkredsløb med lagre og strømme. | K8, dele af K5 og K11's energistrømme; F7. Ø1/Ø4 og Ø7 kan knytte målinger og modelkritik til klima. |
| [Drivhuseffekten, enkel](../geografi/drivhuseffektenSimpel.html) | Fem forklaringstrin; gå til sidste trin og åbn modelbeskrivelsen. Viser kort-/langbølget stråling og atmosfærisk tilbagestråling. | Kvalitativ procesfigur, udtrykkeligt uden tal og beregningsmodel. Kan ikke levere temperaturfølsomhed, tidsserie eller kulstofbudget. En enklere faglig indgang, ikke en dublet der bør slettes. | K8 og energistrømme under K11; F1/F7. Ø4 har allerede et spørgsmål om forskellen på håndklæder og atmosfærens drivhuseffekt. |
| [Grønlandspumpen](../geografi/groenlandspumpen.html) | Vælg smeltescenarie og fri leg; ændr kulde/ferskvand og følg opblanding, nedsynkning og styrke over tid; start forfra. | Kvalitativ, tidskomprimeret tærskelmodel. Reaktionstid og eventuel standsning er modeladfærd, ikke observerede AMOC-tidsskalaer eller sandsynligheder. Vinddrevet Golfstrøm og den atlantiske omvæltningscirkulation skal skelnes. | K5/K8, klimaperspektiv til K7. Ø5/Ø6/Ø17 undersøger temperatur/salt/densitet. |
| [Tidevand](../geografi/Tidevand.html) | Sammenlign Fundy og København; ændr månedag og klokkeslæt, aflæs niveau, spænd og månefase, og slå solbidrag til/fra. | Idealiseret ligevægtstidevand med stedpresets; viser ikke fuld lokal hydrodynamik, stormflod eller sejladsprognose. Stedamplitudernes kilde og definition skal efterkontrolleres. | K4, naturproces og menneskelige anvendelser først ved tilføjet case; F2/F7. Ø3 kan give en særskilt empirisk kystundersøgelse. |
| [Konstruktive/destruktive bølger](../geografi/boelger.html) | Sommerbrise/storm ændrer periode, stejlhed og sandbalance; lad strandtiden gå og nulstil. Bølgelængde, frekvens og op-/tilbageskyl aflæses. | Dybvandsrelationen L = gT²/(2π); sandtransportens størrelse er didaktisk kalibreret, ikke et valideret sedimentbudget for en virkelig strand. Grænsen omkring 1:40 er en forenkling. Brug ikke modellen som lavvands-/tsunamimodel. | K4; F7. Ø3 kobler til virkelig kystudvikling; Ø16 undersøger særskilt lavvandsbølgers hastighed. |

### Geologi, ressourcer og vand

| Ressource | Faktisk funktion og afprøvet elevhandling | Antagelser og grænse for bidraget | Kobling og eksisterende opgaver |
| --- | --- | --- | --- |
| [Pladegrænser](../geografi/pladegraenser.html) | Afprøv ryg, to subduktionstyper, kollision og transform. Flyt tid/målepunkt; aflæs bl.a. havbundsalder, dybde eller bjergkædeudvikling. | Skematiske tværsnit/kort, ikke et globalt observationskatalog. Jordskælv er modelhændelser. Koden skelner kendt polaritetstidsskala for de seneste ca. 5,2 mio. år fra genererede ældre intervaller. Jordens samlede udviklingshistorie er bredere end denne model. | K1/K2/K4; F2/F7. Ø2/Ø10, fremtidigt datalag #48 og lokale Google Earth-opgaver kan supplere. |
| [Vulkanudbrud](../geografi/vulkanudbrud.html) | Gennemgå alle trin for strato-, skjold- og hotspotvulkan; skift til fri udforskning og ændr lupdybde/vandindhold. Tryk, gas og massefylde vises. | Idealiserede magmatyper og opløseligheds-/opdriftsforløb. Ikke prognose for en konkret vulkan. Skeln mellem trykaflastning, tilførsel af vand og hotspotfortolkning; tilstedeværelsen af en 3D-/snitfigur validerer ikke alle tal. | K1/K2; F1/F7. Ø10/Ø2 giver fysiske analogier/målinger. Island-demoen skal genbruge og stedfæste dette bidrag med egne kildeforbehold. |
| [Reserve og ressource](../geografi/raastoffer.html) | Øg teknologi fra 0 til 30 %, aflæs ændret reserve; gå et år frem, åbn opgaver og nulstil. Pris, vækst, efterforskning og genanvendelse kan undersøges systematisk. | Afrundede globale kobbertal og idealiseret omkostningsfordeling/marked; ikke landespecifik minedriftsprognose. R/P er et forhold ved givne antagelser, ikke en udløbsdato. Nulstil ændrer tiden, ikke nødvendigvis skyderne. | K2/K9/K10, råstofperspektiv til K11; F6/F7/F8. Ø15 har allerede scenarier, egen strategi, cirkulære strømme, konfliktmineraler og modelkritik. |
| [Porøsitet og permeabilitet](../geografi/poroesitetPermeabilitet.html) | Sammenlign ler/grus, ændr sortering og hæld 100 ml på; aflæs porøsitet, gennemløbstid og vandmængde. | Hulrum tælles i et 2D-billede; Hazen-/Darcybaseret idealisering af strømning. Efterkontrollér anvendelsesområdet især ved ler. Ikke en samlet grundvands-, forurenings- eller indvindingsmodel for et opland. | K6, del af K4/K7. Ø13/Ø14 giver egne jordmålinger; O1/O2 giver kredsløb og opland. |
| [Skolens stensamling](../geografi/stensamling.html) | Søg basalt, åbn beskrivelse; brug bestemmelsesnøgle og filtrering. 49 poster i fire grupper ved gennemgangen, med egenskaber, anvendelser og nogle fotos. | Katalog og bestemmelsesstøtte, ikke dynamisk simulation af bjergarternes kredsløb. Digitale fotos erstatter ikke alle fysiske bestemmelsestest. Lokal nummerering og manglende fotos skal sammenholdes med den faktiske samling. | K2, dele af K1/K4/K10; F1 og klassifikation. Ø2 samt lokale mineral-/bjergartsøvelser kan kobles til. |

### Orientering og repræsentation

| Ressource | Faktisk funktion og afprøvet elevhandling | Antagelser og grænse for bidraget | Kobling og eksisterende opgaver |
| --- | --- | --- | --- |
| [Kompas](../geografi/kompas.html) | Sæt kurs og egen drejning til 90°; aflæs kurs/indstilling og åbn opgaver med feedback. | Idealiseret kompas med misvisning sat til 0°. Træner retning og orientering, ikke valg og analyse af GIS-lag alene. | Især metodebidrag til F2/F4; anvend med rigtigt kompas og kort i felt. Ikke selvstændigt navngivet kernestofpunkt. |
| [Magnetisk nord](../geografi/magnetiskNord.html) | Skift 1831/2025, flyt kompassted og vend feltet; aflæs ændret misvisning, inklination og polposition. | Centreret dipolmodel. Historiske polpositioner og interpolering gør ikke den viste lokale misvisning til en fuld IGRF/WMM-beregning. Ikke navigationstjeneste; kilder/årgange skal præciseres før empirisk brug. | F2/F7 og forklarende perspektiv til K1's paleomagnetisme. Ikke et ekstra C-krav om elektromagnetisme. |

## 17 forsøgs- og undersøgelsesvejledninger

Links går til den gennemgåede kilde. Hver mappe har også HTML, PDF og Word.
En tilknytning nedenfor er en faglig mulighed; ikke alle er allerede krydslinket
fra den tilhørende simulation. HF/NV-varianter skal tilpasses stx C frem for at
blive behandlet som nationalt C-pensum.

| Id og kilde | Faktisk elevundersøgelse og bearbejdning | Bidrag / afgrænsning |
| --- | --- | --- |
| Ø1 [Albedo og overfladetemperatur](../Øvelser/Geografi/albedo-og-overfladetemperatur/albedo-og-overfladetemperatur.qmd) | IR-målinger ude og lampemålinger på gråtoner; hypoteser, tabeller/grafer, kontrolvariable og fejl. | K5/K8; F3/F5/F7. Målt overfladetemperatur er ikke global ligevægtstemperatur. |
| Ø2 [Bjergarters densitet](../Øvelser/Geografi/bjergarters-densitet/bjergarters-densitet.qmd) | Masse og vandfortrængning for fire bjergarter, beregn densitet og usikkerhed; drøft subduktion/isostasi. | K1/K2; F3/F5/F7. Tjek absolutte formuleringer om hvilken plade der altid subducerer ved lokal fagreview. |
| Ø3 [Digital kystopmåling ved Røjle](../Øvelser/Geografi/digital-kystopmaaling-rojle/digital-kystopmaaling-rojle.qmd) | MiljøGIS, historiske kort/ortofotos, mål afstand og ændringsrate over ca. 100 år; erosionssikring, arealbrug og samfund. | K4/K8; F2/F4/F5/F8. Eksterne GIS-lags tilgængelighed/aktualitet kræver særskilt kontrol. |
| Ø4 [Drivhuseffekt i miniature](../Øvelser/Geografi/drivhuseffekt-i-miniature/drivhuseffekt-i-miniature.qmd) | Lampe/termometer/håndklæder, temperaturkurver og ligevægt; sammenlign med klimadata som eleven skal finde. | K8; F3/F5/F7. Spørgsmål 7 problematiserer allerede konvektion kontra IR-absorption; ikke en fysisk kopi af atmosfæren. |
| Ø5 [Grønlandspumpen, model](../Øvelser/Geografi/groenlandspumpen-model/groenlandspumpen-model.qmd) | Kvalitativ tank med kulde/varme, foto/video og spørgsmål om salt, vind, rotation og begrænsninger. | K5/K8; F3/F7. Ingen numerisk databehandling er påkrævet af et rent kvalitativt forsøg. |
| Ø6 [Grønlandspumpen, NV](../Øvelser/Geografi/groenlandspumpen-nv/groenlandspumpen-nv.qmd) | Separate temperatur-/saltforsøg og cirkulation; beregn v = s/t, diskutér hypoteser, klima og økosystemer. | K5/K8; F3/F5/F7, mulig F10. NV-ramme er ikke i sig selv gennemført stx-fagsamspil. |
| Ø7 [Havniveau og isafsmeltning](../Øvelser/Geografi/havniveau-og-isafsmeltning/havniveau-og-isafsmeltning.qmd) | Sammenlign land-/havis i kar; volumen og vandstandsændring, hypoteser og fejlkilder. | K8/K4; F3/F5/F7. Spørgsmål 10's tal for Nordatlantens havniveau ved stop af »Golfstrømmen« kræver kilde-/begrebskontrol. |
| Ø8 [Konvektionskammer](../Øvelser/Geografi/konvektionskammer/konvektionskammer.qmd) | Kvalitative røgobservationer, skitse og høj-/lavtryksspørgsmål. | K5; F3/F7. Ikke en observation af Jordens globale cirkulation. |
| Ø9 [Konvektionskammer med opgaver](../Øvelser/Geografi/konvektionskammer-med-opgaver/konvektionskammer-med-opgaver.qmd) | Samme type forsøg; spørgsmål om Hadleycellen, passat/Coriolis og klima/plantebælter ved ækvator og vendekredse. | K5 har altså eksisterende stof ud over lokale briser. Manglen er en sammenhængende global undersøgelse med kort/data, ikke fravær af alle plantebæltespørgsmål. |
| Ø10 [Lavas viskositet](../Øvelser/Geografi/lavas-viskositet/lavas-viskositet.qmd) | Fire analogvæsker ned ad rampe, gentagelser, hastighed/rang/graf; temperatur, SiO₂ og vulkantyper. | K1/K2; F3/F5/F7. Analogvæsker er ikke virkelige magmaers reologi. |
| Ø11 [Oliens migration](../Øvelser/Geografi/oliens-migration/oliens-migration.qmd) | Lagprøver, olie/vand/sand og densitet; dannelse, migration, fælder og energimiljøspørgsmål. | K2/K11, fragment af K3. Ikke samlet globalt kulstofbudget eller energimiks. Ældre reserve-/forbrugsdel er bevidst fravalgt i konverteringen, jf. øvelsesoversigten. |
| Ø12 [Terrænprofil](../Øvelser/Geografi/opmaaling-af-terraenprofil/opmaaling-af-terraenprofil.qmd) | Feltmåling af menneskeskabt høj ved skolen; akkumuler x/h, tegn profil, hældning og overhøjning. | K4; F2/F3/F5. Godt eksisterende feltarbejde; ikke en forklaring af alle danske istidslandskaber. |
| Ø13 [Porøsitet/permeabilitet, HF](../Øvelser/Geografi/poroesitet-og-permeabilitet-hf/poroesitet-og-permeabilitet-hf.qmd) | To jordprøver, 100 ml, gennemløb/tilbageholdelse, grafer/rater; grundvand, forurening, landbrug og tør sommer. | K6/K7; F3/F5/F7. HF-stilladsering kan genbruges på C. |
| Ø14 [Porøsitet/permeabilitet med opgaver](../Øvelser/Geografi/poroesitet-og-permeabilitet-med-opgaver/poroesitet-og-permeabilitet-med-opgaver.qmd) | Fire jordtyper, porøsitet/permeabilitet/markkapacitet; problemformulering om jord, nedsivning, landbrug og vanding. | K6/K7/K9; F3/F5/F6. Vandressourceudnyttelse berøres allerede, men ikke et fuldt oplandsbudget. |
| Ø15 [Reserve og ressource](../Øvelser/Geografi/reserve-og-ressource/reserve-og-ressource.qmd) | Fem dele: pris, teknologi, genanvendelse, fire tidsscenarier og egen 100-årsstrategi. Beregn R/P og procentændring, tegn grafer; cirkularitet, konfliktmineraler og usikkerhed. | K2/K9/K10; F6/F7/F8. En simulationsundersøgelse, ikke selvstændige empiriske målinger af kobberressourcer. |
| Ø16 [Tsunamibølgers hastighed](../Øvelser/Geografi/tsunamiboelgers-hastighed/tsunamiboelgers-hastighed.qmd) | Bølger i tank ved tre dybder og gentagelser; v = 5L/t sammenlignes med √(gd), fejl og Sumatra/Sri Lanka-eksempel. | K1/K4; F3/F5/F7. Lavvandsbølger, ikke den samme fysik som kystmodellens dybvandsbølgelængde. |
| Ø17 [Temperatur, salinitet og densitet](../Øvelser/Geografi/vands-temperatur-salinitet-og-densitet/vands-temperatur-salinitet-og-densitet.qmd) | To kvalitative forsøg med adskilte vandmasser og fjernet skillevæg; forklar densitet/cirkulation. | K5/K8; F3/F7. Ingen talbaseret analyse i denne variant. |

## Opgaveark og øvrige undervisningsressourcer

| Id / ressource | Indhold og vurdering |
| --- | --- |
| O1 [Vandets kredsløb, C](../GeoOpgaver/Vandets%20kredsløb-c-niv.html) | Tegn samlet system med magasiner, transport, opholdstid og vandbalance; sammenlign 30 mm regn på tre arealtyper, sortér begreber. Eksisterende samlet kredsløbsopgave til K6, men ingen observationstidsserie eller oplandsberegning med faktisk forbrug. |
| O2 [Oplande, C](../GeoOpgaver/oplande-C-niv.html) | Find danske åer, tegn vandskel og jyske højderyg; kortarbejde til K4/K6 og F2/F4. Opgaveark, ikke en digital oplandsmodel. |
| O3 [Stigningsregn, C](../GeoOpgaver/stigningsregn-C-niv.html) | Regn på luftpakker, temperaturfald, mætning og læside; K5/K6/F7. Lærebogsafhængig introduktion, ikke empiriske regnmålinger. |
| O4 [Stigningsregn, HF](../GeoOpgaver/stigningsregn-HF-niv.html) | Mere stilladseret variant af samme emne; tælles som variant, ikke ekstra kernestofdækning. |
| O5 [Demografisk transition, NF](../GeoOpgaver/Demografisk_transition_NF.html) + [svar](../GeoOpgaver/Demografisk_transition_NF_SVAR.html) | Demografiske faser og levevilkår med eksterne lærebogssider 300–306. Muligt supplerende stof og samfundsperspektiv; ikke selvstændigt navngivet kernestofkrav eller belæg for hele K7/K9. Svarfilen er ikke en sjette selvstændig elevopgave. |
| [Havets motor, arkiveret præsentation](../temp/havets-motor/havets-motor.qmd) | Brobygning til 8. klasse med bl.a. klimatal København/Goose Bay og havstrømsforsøg. Udkast uden for det publicerede fagbibliotek; genbrug først efter niveau-/kildekontrol. Hele klimaforskellen kan ikke uden videre tilskrives én havstrøm. To tilhørende ark, `ark-a.qmd` (tankforsøg) og `ark-b.qmd` (densitetstabel/tegn cirkulation), er også gennemgået. Deres tal/analogi kræver samme kildekontrol. Renderede udgaver i `temp/havets-motor/_output/`. |
| [Progressionsplaner](../Progressioner/3_samlet-progression-just-in-time.md) | Tre forfatterdokumenter: grundinstruktion, udvidet progression og seneste progression med fysik efter behov. Plan 2 B7/D1–D4 og plan 3 Bro/5.1–5.4 har konkrete idéer til kulstof-/energi-/verdensmålsmodeller, dataøvelser og projekt; de er genbrugelige briefs, ikke allerede leverede modeller/datasæt. Den hævdede fulde kernestofdækning er en planhensigt. Ældre krav om én HTML-fil og fast rækkefølge erstatter ikke de aktuelle CLAUDE-/designregler eller atlasbibliotekets frie navigation. |
| [Øvelsesoversigt](../Øvelser/oversigt.html) og [originalkatalog](../Øvelser/Forsogsvejledninger.md) | Belæg for konverteringsvalg og **henvisninger** til lokale originaler. De er ikke selve originalerne. Katalogets 25 geografigrupper er ikke 25 gennemgåede/publicerede C-øvelser. |

### Begrundede fravalg og dubletter

- `geografi/stensamling/beskaer.html` og `.py`: forfatterværktøj til beskæring
  af fotos; forklarer den 17. HTML-fil i `geografi/`, men er ikke elevsimulation.
- `atlas/`: geografisk navigation til seks eksisterende modeller, ikke seks
  nye modeller. Grundkort og stedmarkører er ikke fulde geofaglige datalag.
- `index.html`/`forside.js`: reduceret stigningsregnsdemo; genbrug af proces,
  ikke en selvstændig syttende elevressource.
- `geografi/Interaktiv figur - Drivhuseffekten (specifikation).md`: hensigt og
  begrebsliste, ikke implementeret ekstra klimazone-/hydrotermfigur.
- Renderet HTML/PDF/Word, gentagne øvelsesvarianter og fælles JS-moduler tælles
  ikke som selvstændige simulationer. Relevant forskel mellem varianter er
  registreret ovenfor.
- `studiekort/`: generelt kortværktøj; »Kulstofkredsløbet« er en pladsholder
  i et tomt titelfelt, ikke et eksisterende geofagligt kortsæt.
- Biologibiblioteket, `tid/`, admin-/designsider, matematikspil og kørespil er
  ikke naturgeografiske simulationer. Et muligt tværfagligt genbrug er ikke
  dermed dokumenteret som et gennemført C-forløb.
- Eksterne Geolink-/undervisningssider og private lærebøger er ikke inventeret
  indholdsmæssigt. De samt lokalt SM-DRIVE-materiale står **U**, også når en
  henvisning findes i repositoryet.

## Hvad afprøvningen kan og ikke kan vise

Afprøvningen viser, at centrale elevhandlinger udfører noget observerbart,
og at ressourcerne har det beskrevne indhold. Som stikprøve svarer
råstofmodellens udgangstal til 32 × (1 − 0,30) = 22,4 mio. t primær udvinding
om året og 1.000 / 22,4 ≈ 45 års R/P. Kystmodellens bølgelængde ved 11 s er
9,81 × 11² / (2π) ≈ 189 m. Det underbygger disse regnesammenhænge, ikke
ressourceprognoser eller sandtransportens kalibrering.

Den faglige opfølgning skal især kontrollere empiriske presetkilder,
idealiserede modellers anvendelsesområde og koblingen til faktiske steder.
Browsergennemgang, kildekodelæsning og læsning af vejledninger er ikke
klasseafprøvning, fysisk forsøgsafprøvning eller uafhængig fuld modelvalidering.
