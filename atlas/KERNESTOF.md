# Kernestof og modeldækning – Naturgeografi C

**Status: arbejdsudkast, ikke verificeret fuld læreplansmapping.** Skal kontrolleres punkt for punkt mod den gældende officielle læreplan for den relevante uddannelse (fx stx, august 2024), inklusive faglige mål, kernestof, supplerende stof og metoder. Undgå at kalde oversigten fuldstændig, før den kontrol er udført.

Formålet er at forbinde faglige mål, eksisterende simulationer, kommende modeller, steder, data og elevundersøgelser. **Biblioteket er ikke en fast undervisningsrækkefølge.**

## Statuskoder
- **E**: eksisterende model/ressource (funktion og faglig kvalitet skal stadig kontrolleres).
- **D**: eksisterende, men kræver didaktisk eller teknisk videreudvikling.
- **M**: mangler relevant model eller ressource.
- **U**: uafklaret faglig dækning; kontroller mod læreplanen.

## Foreløbig oversigt
| Fagligt tema / undersøgelse | Eksisterende SMBI-fil(er) | Status | Mulig atlasfunktion / næste skridt |
| --- | --- | --- | --- |
| Pladetektonik og pladegrænser | `geografi/pladegraenser.html` | E | Island, globale grænser, subduktion |
| Vulkanisme | `geografi/vulkanudbrud.html` | E | Island og udvalgte pladegrænser |
| Bjergarter, råstoffer og ressourceforvaltning | `geografi/raastoffer.html`, `geografi/stensamling.html` | E/U | Kortlæg konkret faglig dækning og geografiske cases |
| Landskabsdannelse, erosion og aflejring | – | M | Dansk istidslandskab, randmoræner, smeltevandssletter |
| Jordens årstider og solindstråling | `geografi/Aarstider.html` | E | Globalt tema; kobling til breddegrad |
| Atmosfærens energibalance og drivhuseffekt | `geografi/drivhuseffektenSimpel.html`, `geografi/drivhuseffekten.html` | E | Global proces, ikke tilfældig markør |
| Temperatur, tryk og lokale vindsystemer | `geografi/TermiskTryk3.html` | E | Eksempler fra kystområder |
| Fugtighed, dugpunkt og nedbør | `geografi/Dugpunkt.html`, `geografi/Stigningsregn.html` | E | Stigningsregn i bjergregioner |
| Global atmosfærisk cirkulation | – | M/U | Dynamisk globalt temalag eller model |
| Klimazoner og klimaændringer | Drivhusmodeller som delressource | D/U | Klima-/observationsdata med kilde og periode |
| Havcirkulation og salt-/temperaturforhold | `geografi/groenlandspumpen.html` | E | Nordatlanten; tydelig idealisering |
| Vandkredsløb og grundvand | `geografi/poroesitetPermeabilitet.html` | D/U | Tværsnit, infiltration og målinger |
| Bølger, tidevand og kystprocesser | `geografi/boelger.html`, `geografi/Tidevand.html` | E/U | Kystnære undersøgelser |
| Geografisk orientering | `geografi/kompas.html`, `geografi/magnetiskNord.html` | E/U | Kort, retninger og navigation |
| Bæredygtighed, energi og ressourcevalg | Råstoffer og klima som delressourcer | U | Konkrete problemstillinger og data frem for kun animationer |

**Bemærk:** Filnavne dokumenterer kun, at ressourcen eksisterer. De dokumenterer ikke, at den dækker et bestemt læreplansmål eller er fagligt valideret.

## Faglige metoder og arbejdsformer – skal kortlægges særskilt
| Metode | Atlasmulighed | Foreløbig status |
| --- | --- | --- |
| Kortlæsning og rumlige mønstre | Pladegrænser, vulkaner, jordskælv | Under udvikling |
| Kvantitative data, grafer og enheder | Målinger, sammenligning og dataeksport | Delvist / uafklaret |
| Modeller og modelkritik | Antagelser, følsomhed og begrænsninger på hvert modelkort | Delvist |
| Feltarbejde og lokale undersøgelser | Koble sted, kort, observation og elevopgave | Mangler samlet struktur |
| Problemorienteret arbejde og bæredygtighed | Lokale og globale cases med flere forklaringsniveauer | Uafklaret |

## Metadata for hver model
Ved videreudvikling registreres: id, titel, faglige mål, kernestof/emner, C/B-relevans, modeltype (stedbundet/global/generel), steder/koordinater, kildegrundlag, modelantagelser, relevante variable, elevopgave, status og URL. Lad være med at tvinge alle metadata ind i `atlas/modeller.js`, før en enkel struktur er afprøvet.

## Kvalitetssikringsproces
1. Hent og gennemgå den **gældende officielle læreplan**; registrér version, dato, URL og uddannelsestype. Kopiér ikke uforholdsmæssigt store dele af teksten.
2. Lav en præcis mål-for-mål-mapping med reference til læreplanens afsnit; skeln kernestof fra faglige mål og arbejdsformer.
3. Åbn samtlige relevante sider i `geografi/`; beskriv faktisk funktionalitet og begrænsninger.
4. Klassificér hvert punkt E/D/M/U og prioriter efter faglig betydning, elevudbytte og genbrugsværdi.
5. Gennemgå mappingen fagligt med ejeren før større nye modeller igangsættes.

## Første prioriteringer
1. Pladetektonik som atlas-temalag og Island som demonstration.
2. Kortlæg eksisterende vejr-/klimamodeller før nyudvikling.
3. Udvikl på sigt en model for **danske istidslandskaber** (ikke en generisk alpegletsjer/V-dal), herunder randmoræner og smeltevandssletter.

Relateret: `atlas/ROADMAP.md` og `atlas/ISLAND-DEMO.md`.
