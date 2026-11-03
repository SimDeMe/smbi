# Byg cellen

`biologi/byg-cellen.html`: eleven sætter fagord på dyrecellen, plantecellen og
bakterien. Figuren bygges lag for lag. Lagets dele står grå, de senere lag er
skjult, og en del får farve, når ordet sidder rigtigt.

Idéen er Niels Kræmmers »Byg figuren« fra kemiformler.dk
(`animationer/superanimationer/sc1.5_byg_figuren/` i
github.com/Napoleon53/NK_hjemmeside), brugt med hans tilladelse. Koden og
figurerne her er skrevet til smbi.dk og deler intet med hans.

## Bestillingen

1. **Pointen i én sætning.** Et fagord om cellen giver mening, når det sidder
   på den struktur, det betegner. Så kommer forklaringen af, hvad den gør.
2. **Hvad den afløser.** Intet.
3. **Naboerne.** `membran.html` og `membran2d.html` ejer membranens opbygning
   og transporten. `transkription.html` ejer proteinsyntesen. `fotosyntese.html`
   ejer processerne. Her står kun en sætning om funktionen.
4. **Loftet.** 4 faner med én figur hver og 1–3 lag med 2–5 ord hvert. 30
   pladser i alt og ét ord i overskud på tre af fanerne.
5. **Layoutet.** Stor figur plus panel: opgaven, bakken med ord, beskeden,
   Giv et hint og Indsend svar, lagene og Byg forfra. På smal skærm ligger
   panelet over figuren og klæber under topbjælken.

| Fane | Lag | Fagord |
|:--|:--|:--|
| Dyrecellen `#dyr` | Grundplanen | cellemembran, cytoplasma, cellekerne (+ cellevæg i overskud) |
| | Fra gen til protein | kernemembran, ribosom, ru ER, Golgi-apparat |
| | Energi, lager og affald | mitokondrie, glat ER, lysosom, vesikel |
| Plantecellen `#plante` | Det, dyrecellen ikke har | cellevæg, kloroplast, vakuole |
| | Det, alle eukaryote celler har | cellemembran, cellekerne, mitokondrie, cytoplasma |
| Bakterien `#bakterie` | Grundplanen | cellevæg, cellemembran, cytoplasma, kromosom (+ cellekerne i overskud) |
| | Ekstraudstyret | plasmid, ribosom, flagel, pili, kapsel |
| Celletyperne `#typer` | To slags celler | eukaryot, prokaryot (+ virus i overskud) |

Et ord i overskud er en typisk elevfejl, der aldrig kan forsvares som rigtig:
dyreceller har ingen cellevæg, bakterier ingen cellekerne, og en virus er ikke
en celle. Det samme ord kan stå på flere figurer (cellemembran, ribosom …).
Forklaringen i `ordliste.js` skal derfor passe til alle de celler, ordet sidder på.

## Sådan virker den

- Træk et ord hen på en gul plads, eller klik på ordet og så på pladsen. Et ord
  kan trækkes fra en plads til en anden, og så bytter ordene plads. Slippes det
  ved siden af pladserne, går det tilbage i bakken. Slip inden for 30 px af en
  plads rammer pladsen.
- **Indsend svar:** rigtige ord låses, og delen får farve. Forkerte ord ryger
  tilbage, og beskeden forklarer den første fejl. Er det en typisk ombytning,
  bruges pladsens `fejl`-tekst, ellers ordets egen forklaring.
- **Giv et hint** gør én plads orange og viser forklaringen på det rigtige ord.
  Et tryk mere (**Vis svaret**) sætter ordet på. Et lag giver en stjerne, hvis
  det bygges uden fejl og uden hint.
- Det grønne kort viser lagets ord med første sætning af forklaringen. Knappen
  fører altid videre (Næste lag eller Næste figur) og bygger aldrig forfra.
  Byg forfra står for sig selv nederst.
- **Svær udgave:** alle ord på én gang. Fanerne begynder forfra, når den slås
  til eller fra.
- Peger man på et ord, der sidder rigtigt, kommer hele forklaringen frem.
- **Fokus** skjuler sidehovedet, topbjælken og bunden.
- Tastatur: Tab til ordet og Enter, Tab til pladsen og Enter. Delete sender
  ordet tilbage, Esc fjerner valget, og Enter uden for en knap indsender. Tasterne
  1–4 skifter fane, og piletasterne virker på fanerne.
- Browseren husker, hvilke figurer der er bygget (✓ og ★ på fanerne), under
  nøglen `byg-cellen.v1`. Siden virker også uden.

## Filerne

| Fil | Indhold |
|:--|:--|
| `../byg-cellen.html` | siden: sidehoved, faner, scene, panel, »Om figurerne« |
| `stil.css` | alt udseende, også den grå udgave af figuren |
| `ordliste.js` | fagordene og forklaringerne |
| `motor.js` | én figur: lag, bakke, træk og klik, Indsend svar, hint, det grønne kort |
| `side.js` | fanerne, Svær udgave, fokus, links, tastatur og konfetti |
| `tegn.js` | tegnehjælp: bløde kurver, mitokondrier, kloroplaster, ribosomer, bølger |
| `fig-dyr.js`, `fig-plante.js`, `fig-bakterie.js`, `fig-typer.js` | figurerne, lagene og pladserne |
| `selvtest.mjs` | `node biologi/byg-cellen/selvtest.mjs` |

## En figur

```js
{
  id, navn, intro, vb: [bredde, højde],
  lag: [{ navn, ord: [...], ekstra: [...], ekstraFejl: { ord: tekst } }],
  dele: [{ ord, svg }],          // tegnes i rækkefølge; farves, når `ord` sidder
  pladser: [{ ord, x, y, maal: [x, y] | null, titel, omr, fejl: { ord: tekst } }],
}
```

- `x, y` er midten af pladsen. Alle pladser er 186 × 42, så længden ikke
  afslører ordet.
- `maal` er prikken. Den sidder ved sit eget gule felt og aldrig på noget, en
  anden plads handler om. `null` giver en titel uden streg (Celletyperne).
- `omr` er det gule felt om **hele** det, pladsen handler om: hele membranen,
  alle ribosomerne i klyngen og så videre. En figur med `fill="none"` tegnes
  som en streg (ringe og bånd).
- `fejl` er højst 160 tegn og må ikke indeholde svaret. Selvtesten tjekker det.
- Tegn kun det, pladserne bruger, og tegn aldrig to ting, der ligner hinanden,
  ved hver sin plads. Golgi-apparatet har derfor ingen små blærer i enderne,
  for de ville ligne vesiklerne.

## Forenklinger (står også på siden)

- Cellerne er ikke i samme målestok. Bakterie 1–5 µm, dyrecelle 10–30 µm,
  plantecelle 10–100 µm.
- Der er tegnet få organeller af hver slags.
- ER er tegnet som buer og rør, ikke som ét net, der hænger sammen med
  kernemembranen.
- I plantecellen ligger cellemembranen et stykke fra cellevæggen, så de kan
  skelnes.
- Udeladt: kernelegeme, cytoskelet, peroxisomer og centrioler.

## Ideer, der ikke er lavet

- Flere figurer med samme motor: kloroplasten, mitokondrien, nefronet,
  hjertet, og i geografi fx pladegrænser og frontsystemer. En ny figur er en ny
  `fig-*.js`. Ordene lægges i `ordliste.js`, og figuren skrives ind i `FIGURER`
  i `side.js`.
- Udskrift af figuren som noteark, tom og med facit.
