# Byg cellen

`biologi/byg-cellen.html`: eleven sætter fagord på dyrecellen, plantecellen og
bakterien og inde i mitokondrien og kloroplasten. Figuren bygges lag for lag. Lagets dele står grå, de senere lag er
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
   ejer processerne. På mitokondrien og kloroplasten står kun, *hvor* respirationens
   og fotosyntesens trin foregår. Her står kun en sætning om funktionen.
4. **Loftet.** 6 faner med én figur hver og 1–3 lag med 2–5 ord hvert. 45
   pladser i alt og ord i overskud på fem af fanerne.
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
| Mitokondrien `#mitokondrie` | Opbygningen | ydre membran, intermembranrum, indre membran, matrix, cristae (+ thylakoid i overskud) |
| | Hvor respirationen sker | citronsyrecyklus, elektrontransportkæde, ATP-syntase (+ glykolyse i overskud) |
| Kloroplasten `#kloroplast` | Opbygningen | ydre membran, indre membran, thylakoid, granum, stroma (+ cristae i overskud) |
| | Hvor fotosyntesen sker | lysreaktion, Calvin-cyklus (+ citronsyrecyklus i overskud) |

Et ord i overskud er en typisk elevfejl, der aldrig kan forsvares som rigtig:
dyreceller har ingen cellevæg, bakterier ingen cellekerne, og en virus er ikke
en celle. Mitokondrien og kloroplasten bruger hinandens fagord som fælder:
thylakoid og cristae, og citronsyrecyklussen over for Calvin-cyklussen. Det samme ord kan stå på flere figurer (cellemembran, ribosom …).
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
  1–6 skifter fane, og piletasterne virker på fanerne.
- Browseren husker, hvilke figurer der er bygget (✓ og ★ på fanerne), under
  nøglen `byg-cellen.v1`. Siden virker også uden.

## Filerne

Motoren er fælles med «Byg figuren» i naturgeografi og ligger i `/byg-motor/`.
Her ligger kun figurerne og ordlisten.

| Fil | Indhold |
|:--|:--|
| `../byg-cellen.html` | siden: sidehoved, faner, scene, panel, »Om figurerne« |
| `figurer.js` | `FIGURER`, `ORD` og nøglen til browserens hukommelse |
| `side.js` | starter den fælles side med `figurer.js` |
| `ordliste.js` | fagordene og forklaringerne |
| `fig-dyr.js`, `fig-plante.js`, `fig-bakterie.js`, `fig-typer.js`, `fig-mitokondrie.js`, `fig-kloroplast.js` | figurerne, lagene og pladserne |
| `/byg-motor/stil.css` | alt udseende, også den grå udgave af figuren (`<body class="geo">` giver blå accent) |
| `/byg-motor/motor.js` | én figur: lag, bakke, træk og klik, Indsend svar, hint, det grønne kort |
| `/byg-motor/side.js` | fanerne, Svær udgave, fokus, links, tastatur og konfetti |
| `/byg-motor/tegn.js` | tegnehjælp: bløde kurver, mitokondrier, kloroplaster, ribosomer, bølger, cyklus-pile |
| `/byg-motor/selvtest.mjs` | `node byg-motor/selvtest.mjs biologi/byg-cellen.html` |

## En figur

```js
{
  id, navn, intro, vb: [bredde, højde],
  lag: [{ navn, ord: [...], ekstra: [...], ekstraFejl: { ord: tekst } }],
  boks: [b, h],                  // valgfri; standard 186 × 42
  mobilBredde: 680,              // valgfri; figurens bredde i px på mobil, hvor den ruller vandret
  dele: [{ ord, svg }],          // tegnes i rækkefølge; farves, når `ord` sidder. ord: null = baggrund med farve
  pladser: [{ ord, x, y, maal: [x, y] | null, titel, omr, fejl: { ord: tekst } }],
}
```

- `x, y` er midten af pladsen. Alle pladser på en figur er lige store (186 × 42,
  eller figurens `boks`), så længden ikke afslører ordet.
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
- Mitokondrien (1–2 µm) og kloroplasten (3–10 µm) er tegnet langt større end cellerne.
  Cristae er fire lige folder, kloroplasten har kun fire grana.
- Elektrontransportkæden og ATP-syntasen sidder i hele den indre membran; her er
  der nogle få, hver på sin fold. Thylakoidernes ATP-syntaser er ikke tegnet.

## Ideer, der ikke er lavet

En ny figur er en ny `fig-*.js`. Ordene lægges i `ordliste.js`, og figuren
skrives ind i `FIGURER` i `figurer.js`. I geografi får hvert emne sin egen side
(`geografi/byg-figuren/` er vandets kredsløb, `geografi/byg-jordens-indre/`
Jordens indre); en figur, der bygger videre på et emne, kan blive fane der. Gode figurer er dem, hvor placeringen er
selve pointen, og hvor en typisk forveksling kan stå som ord i overskud.

### Naturgeografi

| Figur | Lag | Ord i overskud / naboer |
|:--|:--|:--|
| Pladegrænserne | divergent, konvergent, transform → midtoceanisk ryg, dybhavsgrav, subduktion, vulkanbue | nabo: `geografi/pladegraenser.html` |
| Istidslandskabet i Danmark | is og smeltevand → randmoræne, moræneflade, hedeslette, tunneldal, dødishul, bakkeø | |
| Bjergartskredsløbet | de tre bjergartsgrupper → processerne på pilene (forvitring, erosion, aflejring, diagenese, metamorfose, smeltning) | nabo: `geografi/stensamling` |
| Lavtrykket og fronterne | varmfront, koldfront, varm sektor, okklusion → skytyper og nedbør langs snittet | nabo: `geografi/luftmasser` |
| Den globale cirkulation | Hadley-, Ferrel- og polarcelle → ITCZ, subtropisk højtryk, passat, vestenvind, polarfront | |
| Orografisk nedbør | luv, læ, regnskygge, kondensationsniveau, føhn | nabo: `geografi/Stigningsregn.html` |
| Grundvandet | umættet zone, grundvandsspejl, magasin, lerlag, boring, kilde → nitratens vej | |
| Jordbundsprofilen | horisonterne → podsol over for brunjord | |

### Motoren

- Udskrift af figuren som noteark, tom og med facit.

Lavet: mitokondrien og kloroplasten er faner i Byg cellen. Motoren er flyttet til `/byg-motor/`, og ord på pile er prøvet af i
vandets kredsløb (pladsen sidder på pilen, og `omr` er pilen som streg).
Jordens indre er lavet som egen side i geografi, `geografi/byg-jordens-indre.html`.

DNA og nukleotidet er lavet i [Byg DNA og proteinsyntesen](../byg-dna.html)
sammen med transkription, RNA-bearbejdning, translation og mutation.

## Pakkerne

Byg figuren i biologi er samlet i pakker, der følger undervisningen fra celle
til krop til gen. Hver pakke er én side med faner:

| Pakke | Figurer |
|:--|:--|
| [Byg cellen](../byg-cellen.html) (beta) | dyrecellen, plantecellen, bakterien, celletyperne, mitokondrien, **bladet**, kloroplasten |
| [Byg organsystemerne](../byg-organsystemerne.html) | ti organsystemer som oversigt + **nefronet** som lup på urinsystemet |
| [Byg hjertet og kredsløbet](../byg-hjertet.html) (beta) | hjertet i snit, det dobbelte kredsløb, alveolen (se `byg-hjertet/LÆS-MIG.md`) |
| [Byg nerver og hormoner](../byg-synapsen.html) | den kemiske synapse + **hormonaksen** |
| [Byg DNA og proteinsyntesen](../byg-dna.html) | nukleotid, dobbeltstreng, transkription, RNA-bearbejdning, translation, mutation + **enzymet** |

De fire fede figurer kommer fra `byg-biologi/` (bladet, nefronet, enzymet og
hormonaksen). Mappen er nu et lille bibliotek: `hent(id)` giver figuren og dens
fagord, og `flet()` lægger ordlisterne sammen og stopper ved dobbelte
forklaringer. `byg-biologi.html` sender gamle links videre (`#hjerte` →
`byg-hjertet.html#hjerte` osv.).
