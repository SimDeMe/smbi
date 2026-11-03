# Global cirkulation

Adresse: `/atlas/cirkulation/` (kortet «Global cirkulation» i atlasset).
Fagligt grundlag: [../CIRKULATION-MODEL.md](../CIRKULATION-MODEL.md).

Kombinationen af to parallelle udkast (17. oktober 2026): funktionerne og
modellen fra Claudes model B, grafikken fra ChatGPT's model A (mørk globus,
gyldent ITK-bælte, lyst snit med ellipseceller). Begge originaler ligger i
git-historikken (`b2458bf` og `ea99956`); `/atlas/cirkulation-b/` sender
videre hertil.

## Hvad man kan

- Globus med vindspor farvet efter vindbælte og navne på kortet, så farven
  ikke er eneste signal. På pause vises faste vindpile i stedet.
- ITK som et glødende bælte, der vandrer med måneden; svagt ørkenbånd på land
  ved højtrykkene. Solen står ved sin bredde med en stråle ind mod kloden.
- Snit fra Sydpol til Nordpol som i lærebogen: et tyndt lag under en
  tropopause (16 km ved ITK, 8 km ved polerne) med seks celler (to uden
  rotation) som flade, afrundede løkker
  med løbende prikker, L ↑ / H ↓ ved jorden og tordensky ved ITK.
- Cellerne på globussen: gennemsigtige bælter (Hadley, Ferrel, polar) og
  luftringe – hver celle som en gennemsigtig 3D-«donut» rundt om jordaksen
  (højden stærkt overdrevet) med prikker, der løber rundt i løkkerne. Ringene
  følger globussen, når den drejes og vippes.
- Klimalagene «Temperatur» og «Nedbør» (knapperne øverst til højre på
  globussen, højst ét ad gangen): målte klimanormaler 1991–2020 fra atlassets
  egne data (`../data/middeltemperatur.bin`, NCEP/NCAR-reanalyse, og
  `../data/nedboer.bin`, GPCP v2.3) med atlassets farveskalaer. De følger
  måneden og glider mellem månederne, når året afspilles; aflæsningen viser
  værdien for den viste måned. Mens et lag er tændt, skjules de flade
  cellebælter (luftringene vises stadig). Modellen er skematisk, lagene er
  målinger – sammenlign fx ITK med det målte regnbælte.
- Måned og «Afspil år», kontakterne «Jorden drejer», «Kontinenter» (til fra start), «Celler»,
  «Luftringe» og «Navne», «Slip en ballon», pause og fokus.
- Seks korte trin, der bygger op ét fænomen ad gangen; hvert trin drejer
  globussen, sætter måned og kontakter og fremhæver det, der skal ses.
  Trin 1–4 står ved forårsjævndøgn uden kontinenter, så solen står over
  ækvator, ITK ligger tæt ved den, og der er hele tiden tre celler: solvarme og ITK, Hadleycellen,
  Corioliseffektens afbøjning og de tre celler. Trin 5 lader ITK og bælterne
  følge solen, og trin 6 slår kontinenterne til, så ITK trækkes ind over
  Indien, og monsunen opstår.
- Motion design: går man ét trin frem, tegnes det nye i den rækkefølge, det
  sker (`koreografi` i `tekst.js`, motoren i `koreografi.js`). Trin 2 tegner
  Hadleycellen i strømmens retning, før højtryk og ørken kommer. Trin 3
  ændrer kun vindens afbøjning (modellens `afboejning`; cellerne står fast):
  vinden rettes ud, så den går lige mod ITK, og bøjes så af, mens to store
  pile viser «bøjer til højre» og «bøjer til venstre». Det går roligt
  (ca. 13 s), så der er tid til både at læse og se. Trin 4 bygger cellerne
  ud fra ækvator; trin 5 flytter solen først og lader ITK følge efter mod
  juli; trin 6 toner kontinenterne ind. Knappen ↻ ved pilene afspiller
  trinnet igen. Andre spring og reduceret bevægelse viser trinnet færdigt,
  og en kontakt eller skyderen afbryder koreografien. Slutbilledet er det
  samme som uden koreografi.
- Aflæsning ved musen, ved klik og midt på globussen med piletaster.

## Filer

| Fil | Ansvar |
| --- | --- |
| `model.js` | ITK's bredde, bælterne, vindfeltet, strømfunktionen, solens bredde |
| `globus.js` | Globus, vindspor, ITK, etiketter, sol og balloner (D3 på Canvas 2D) |
| `snit.js` | Snittet med cellerne |
| `tekst.js` | De seks trin og deres koreografi |
| `koreografi.js` | Motion design: hvor langt hvert element er tegnet frem |
| `app.js` | Betjening, trin og animationsløkke |

D3 og TopoJSON hentes fra `../vendor/`, landene fra `../data/countries-110m.json`.
Klimalagene genbruger `../middeltemperatur.js` og `../nedboer.js` (hentning,
geometri og farvning); data og kilder er beskrevet i `../data/*.LICENSE`.

## Modellen

Uden kontinenter er modellen symmetrisk: ITK svinger ca. 6° til hver side af
ækvator. Med kontinenter er det den virkelige Jord, hvor ITK i gennemsnit
ligger ca. 4° nord for ækvator (`NORDFORSKYDNING` i `model.js`), og hvor den
bugter sig ind over land. Se [../CIRKULATION-MODEL.md](../CIRKULATION-MODEL.md).

Vinden ved jorden regnes i en «modelbredde», hvor ITK er 0°, højtrykkene ±30°
og polarfronterne ±60°. Corioliseffekten laver vind mod ækvator om til
østenvind og vind mod polen til vestenvind; den er nul ved ækvator. Derfor
bliver sydøstpassaten, der krydser ækvator mod en ITK over Indien, til
sydvestmonsun. Over land er ITK's udsving bløde, længdegradsbestemte bump –
ikke en landmaske. Hastigheder, højder og celleformer er skematiske.

## Afprøvning

```sh
node atlas/cirkulation/model.test.mjs
python3 -m http.server 8777
NODE_PATH=værktøj/node_modules ATLAS_URL=http://localhost:8777 node atlas/test/cirkulation.cjs
```

Browserprøven kører 1280×577, 1366×625, 1536×730, 390×750 og 640×625 med
reduceret bevægelse: rulning, overlap, kontakter, måned, tastatur, ballon
(klik, tryk, Enter), træk, trin, pause, fokus og manglende landekort.
