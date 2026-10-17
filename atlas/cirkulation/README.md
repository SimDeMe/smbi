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
- Snit fra Sydpol til Nordpol: seks celler (to uden rotation) som ellipser
  med løbende prikker, L ↑ / H ↓ ved jorden og tordensky ved ITK.
- Cellerne på globussen: gennemsigtige bælter (Hadley, Ferrel, polar) og
  luftringe på klodens kant med prikker, der løber rundt – som lærebogsfiguren.
- Måned og «Afspil år», kontakterne «Jorden drejer», «Kontinenter» (til fra start), «Celler» og
  «Navne», «Slip en ballon», pause og fokus.
- Fem korte trin; hvert trin drejer globussen og fremhæver det, der skal ses.
- Aflæsning ved musen, ved klik og midt på globussen med piletaster.

## Filer

| Fil | Ansvar |
| --- | --- |
| `model.js` | ITK's bredde, bælterne, vindfeltet, strømfunktionen, solens bredde |
| `globus.js` | Globus, vindspor, ITK, etiketter, sol og balloner (D3 på Canvas 2D) |
| `snit.js` | Snittet med cellerne |
| `tekst.js` | De fem trin |
| `app.js` | Betjening, trin og animationsløkke |

D3 og TopoJSON hentes fra `../vendor/`, landene fra `../data/countries-110m.json`.

## Modellen

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
