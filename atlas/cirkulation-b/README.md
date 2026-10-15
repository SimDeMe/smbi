# Global cirkulation – model B

Claudes bud på cirkulationsmodellen ud fra briefet i
[../CIRKULATION-MODEL.md](../CIRKULATION-MODEL.md), lavet parallelt med
ChatGPT's udgave i `../cirkulation/`. Ejeren vælger, hvad der skal videre.
Siden er ikke linket fra atlasset endnu og har `noindex`.

Adresse: `/atlas/cirkulation-b/`

## Hvad man kan

- Globus med animerede vindpartikler ved jorden, farvet efter vindbælte
  (passat, vestenvind, polar østenvind, monsun) og med navne på kortet, så
  farven ikke er eneste signal.
- Klimabånd på land: grønt regnbælte ved ITK, ørkenbånd ved højtrykkene,
  is ved polerne. ITK som et bånd af skyer, der vandrer med måneden.
- Snit fra Sydpol til Nordpol med seks luftringe (partikler, der følger
  strømfunktionen), tordensky ved ITK, solen over sin bredde og tryk ved jorden.
- Månedsskyder og «Afspil år», «Stop Jorden» (én celle pr. halvkugle, vinden
  retter sig ud), «Kontinenter» (ITK bugter sig ind over Asien, Afrika,
  Australien og Sydamerika), «Slip en ballon», navne til/fra, pause og fokus.
- Syv trin med den godkendte elevtekst; hvert trin drejer globussen og
  fremhæver det, der skal ses.
- Aflæsning ved musen, ved klik og midt på globussen med piletaster (bredde,
  længde, vindbælte, retning og modelfart).

## Filer

| Fil | Ansvar |
| --- | --- |
| `model.js` | ITK's bredde, bælterne, vindfeltet, strømfunktionen, solens bredde |
| `globus.js` | Globus, vindspor, skyer, etiketter, balloner (D3 på Canvas 2D) |
| `snit.js` | Snittet med luftringene |
| `tekst.js` | Trinene (elevtekst fra CIRKULATION-MODEL.md, afsnit 2) |
| `app.js` | Betjening, trin og animationsløkke |

D3 og TopoJSON hentes fra `../vendor/`, landene fra `../data/countries-110m.json`.

## Modellen

Afsnit 0 og 4 i CIRKULATION-MODEL.md. Vinden ved jorden regnes i en
«modelbredde», hvor ITK er 0°, højtrykkene ±30° og polarfronterne ±60°. Den
meridionale vind går mod ITK i Hadleycellen, mod polen i Ferrelcellen og mod
ækvator i polarcellen. Corioliseffekten laver vind mod ækvator om til østenvind
og vind mod polen til vestenvind; den er nul ved ækvator. Derfor bliver
sydøstpassaten, der krydser ækvator mod en ITK over Indien, til sydvestmonsun.

Kontrolleret i Node: nordøstpassat ved 15° N, sydøstpassat ved 15° S,
sydvestlig vestenvind ved 45° N, nordvestlig ved 45° S, polar østenvind ved
±75°, sydvestmonsun ved Mumbai i juli og nordøstmonsun i januar.
