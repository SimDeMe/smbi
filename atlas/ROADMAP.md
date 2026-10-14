# Udviklingsplan – SMBI naturgeografisk atlas

Status: plan vedtaget 14. oktober 2026. Arbejd direkte på `main` i små, testede og tilbagerullelige commits, jf. `CLAUDE.md` og `design_rules.md`.

## Vision
Et frit, ikke-lineært naturgeografisk atlas, hvor elever kan gå fra en geografisk lokalitet på globusen til en korrekt forklaring, en interaktiv model og en konkret undersøgelse. Atlas og det eksisterende geografibibliotek skal fungere som to ligeværdige indgange til de samme selvstændige simulationer.

## Tre parallelle spor
1. **Atlas og geografiske data:** forbedr brugerflade, navigation og temalag med dokumenterede kilder.
2. **Faglig kortlægning:** kortlæg kernestof, faglige mål og metoder for Naturgeografi C mod hele `geografi/`-biblioteket.
3. **Gennemarbejdet demonstration:** Island fra globus til et rumligt tværsnit, procesforklaring og elevundersøgelse.

## Eksisterende udgangspunkt
- `atlas/` indeholder allerede en D3/Canvas 2D-globus, søgning, steder, processer, modelregister og tests.
- `atlas/modeller.js` forbinder pt. seks simulationer til atlasset. Der findes flere geografimodeller i `geografi/`, som skal kortlægges før flere links tilføjes.
- Bevar `geografi.html`, eksisterende URL'er og modeller; undgå at omskrive fungerende simulationer som led i atlasarbejdet.
- Brug Canvas 2D-globusen som navigationslag, indtil en dokumenteret funktion kræver andet. En særskilt Three.js-model kan anvendes til Island-tværsnittet.

## Faser og leverancer
| Fase | Leverance | Afslutningskriterium |
| --- | --- | --- |
| 1. Atlas-review | Test- og forbedringsliste fra eksisterende prototype | Globus og primære kontroller kan bruges på elevlaptop; touch/tastatur og navigation fungerer |
| 2. Kernestofkort | `atlas/KERNESTOF.md` valideret mod gældende officiel læreplan og hele `geografi/` | Hvert relevant mål har status og mindst ét forslag til model, undersøgelse eller ressource |
| 3. Register | Udvid `atlas/modeller.js` med relevante, kvalitetssikrede metadata | Atlas, bibliotek og eksisterende links er fortsat konsistente |
| 4. Temalag | Første fagligt korrekte pladegrænselag, senere jordskælv og vulkaner | Kilder/licenser, usikkerheder, tegnforklaring og mobiltest er dokumenteret |
| 5. Island | `atlas/ISLAND-DEMO.md` implementeret som vertikal demonstration | Sted → forklaring → rumlig model → undersøgelse → anvendelse fungerer |
| 6. Klasseafprøvning | Korte elevopgaver og observerede forbedringspunkter | En elev kan gennemføre 10–15 minutters forløb og forklare en relevant sammenhæng |

Tidsrammen 6–8 uger er kun en grov arbejdsramme, ikke en deadline. Trin 1 og 2 kan foregå parallelt. Begynd ikke med tunge 3D-effekter, før den faglige model og elevopgaven er specificeret.

## Fælles didaktiske principper
- **Forstå:** sammenhængende forklaring af systemet.
- **Se:** rumlig/fysisk visualisering med tydelige antagelser.
- **Undersøg:** eleven kan manipulere meningsfulde variable eller undersøge rumlige mønstre.
- **Mål:** aflæs eller sammenlign dokumenterede størrelser, hvor det giver mening.
- **Anvend:** en kort opgave forbinder modellen til et virkeligt sted eller problem.

Dette er muligheder, ikke fem obligatoriske UI-knapper. Den primære figur og centrale kontroller prioriteres på skolelaptops; sekundære forklaringer og indstillinger kan åbnes efter behov.

## Kvalitetskrav
- Faglig korrekthed: skeln mellem observerede data, rekonstruktioner, idealiserede modeller og hypoteser/scenarier.
- Dokumentér dataenes kilde, årgang, licens, opløsning og usikkerheder. Ingen opdigtede koordinater eller pladegrænser.
- Brug reelle geografiske eksempler; generelle modeller må ikke fremstå som stedsspecifikke målinger.
- Test mindst 1280×577, 1366×625, 1536×730, mobil 390×750 og smal delt visning.
- Test tastatur, touch, reduced motion, fejltilstande og at eksisterende URL'er fortsat virker.
- Arbejd på `main`, test før push og lav små commits, så rollback er let.

## Beslutninger og afgrænsning
- Ingen login, elevprofiler, LMS eller lineært obligatorisk kursus.
- Ingen total omlægning af eksisterende simulationskode.
- Globus og bibliotek skal kunne anvendes uafhængigt.
- Fase 1–2 prioriteres før nye avancerede temalag; Island er den første komplette demonstration.
- Afvent faglig og visuel vurdering før der udvikles tilsvarende demonstrationsmoduler for Grønland, dansk istidslandskab eller global atmosfære.

## GitHub-opgaver
Se issues oprettet til: (1) kernestofkortlægning, (2) atlas-review, (3) dokumenterede pladetektoniske temalag, (4) Island-demonstration. Eksisterende issue #45 beskriver den første MVP og skal ikke implementeres forfra.

## Næste handling
Start med at afprøve `https://smbi.dk/atlas/` på en elevlaptop og gennemgå `atlas/KERNESTOF.md` mod læreplanen. Derefter kan Codex implementere forbedringerne og de første temalag.
