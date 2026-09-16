# Gærbobleforsøget i laboratoriet

En udgave af gærbobleforsøget bygget som kemiformler.dk's superanimationer:
et laboratoriebord, hvor eleven selv udfører forsøget, kan lave fejl og til
sidst ser forsøget som en tegneserie. Den står ved siden af
`biologi/gaerbobler.html` og ændrer ikke den.

Åbn **`index.html`**. Mappen har ingen afhængigheder og ingen moduler, så den
virker også direkte fra harddisken (`file://`). Læreren SM-Simon ligger i
`simon/` inde i mappen.

## Hvad viser den

Eleven undersøger, hvordan temperaturen påvirker gæringen: tre kolber med
sukker, gær og vand ved stuetemperatur, ca. 37 °C og ca. 60 °C. CO₂ bobler
gennem gærrør med BTB, og eleven tæller selv boblerne i ti sekunder.

* **En rigtig opstilling.** Sukker, tørgær, måleglas, BTB, spatel, termometer
  og en håndtæller på bordet, tre kolber, to varmeplader, tre gærrør i et
  stativ på hylden og en affaldsspand. Alt bruges ved at trække det derhen,
  hvor det skal bruges. Varmepladerne indstilles med − og +.
* **Tiden går i virkelig tid**, så boblerne kan tælles. Et klik på uret (eller
  knappen Vent 5 min) spoler fem minutter frem.
* **Eleven tæller selv i ti sekunder.** Tælleren trækkes hen på en kolbe. En
  lup viser gærrøret tæt på, og eleven trykker på mellemrum eller Boble for
  hver boble. Efter ti sekunder ganges tallet op med seks til bobler pr.
  minut. Modellen tæller de rigtige bobler ved siden af, så tegneserien kan
  vise, om tællingen passede.
* **Påskeæg: bægerglasset.** Midt på bordet står et bægerglas, der ikke hører
  til forsøget. Dryppes der BTB i det, kommer SM-Simon, sætter det op på
  hylden og opdager, at flasken er tom. Så kommer kemilæreren Kemi-Niller med
  en ny og glemmer sin kaffe, som kan hældes i en kolbe. Hele historien står i
  `niller/README.md`.
* **Fri leg.** Træk og hæld udføres altid, også når det er forkert: dobbelt
  gær, BTB i kolben, for meget vand i kolben eller gærrøret, en kolbe uden
  sukker, et gærrør uden vand, en kolbe på gulvet eller i spanden, en kolbe
  kogt ved 90 °C og en tælling, mens kolben stadig bliver varmere. Kun det,
  der fysisk ikke kan lade sig gøre, afvises: spatel, termometer, sukker, gær,
  vand eller BTB ned gennem en prop og to kolber på samme plads.
* **SM-Simon** lader fejlen ske og kommenterer den (`BEMAERK` i
  `js/laerer.js`), ofte med et vink om at starte et nyt forsøg. Ved overløb
  tørrer han op, og en tabt kolbe fejer han op og erstatter.
* **Tegneserie.** Når der er talt bobler i alle tre kolber, låses knappen op.
  Ruderne viser forsøget med elevens egne tal, én rød rude for hver fejl og
  til sidst resultatskemaet og en graf over bobler pr. minut mod temperaturen
  for alle forsøg (`js/tegneserie.js`).
* **Intro.** Første gang siden åbnes, siger en pop-up kort, hvad forsøget
  undersøger, og hvad eleven skal gøre. `?intro=0` springer den over.

## Modellen

Gæringen, CO₂-mætningen og BTB i gærrøret er Simons model fra
`biologi/gaerbobler/gaering.js` med de samme tal og formler, skrevet om til
det fælles `NK`-navnerum i `js/model.js`. To ting er tilføjet: hastigheden er
proportional med mængden af gær (20 g giver det samme som før), og luften i en
lukket kolbe udvider sig, når den varmes op, og giver bobler, der ikke kommer
fra gæren.

## Sprites

Alle ligger i `sprites/` som SVG og tegnes med `drawImage`. Ankrene står i
`S.ANKER` i `js/scene.js`. `kolbe.svg`, `varmeplade.svg`, `haand.svg` og
`koekkenrulle.svg` er de samme som i kemiformler.dk's superanimationer.

| Fil | Indhold | Anker |
|-----|---------|-------|
| `kolbe.svg` | konisk kolbe 250 mL, tegnet 96 x 128 | åbningen (48, 2,5); inderside i `S.KOLBE_INDRE` |
| `gaerroer.svg` | S-bøjet gærrør, 80 x 106 | stilken (11, 100); vandet i den nederste bue tegnes i koden |
| `maaleglas.svg` | måleglas 100 mL | tuden (8, 6) |
| `btb.svg` | dråbeflaske med BTB | spidsen (17, 2) |
| `termometer.svg` | termometer | kuglens bund (7, 118); søjlen tegnes i koden |
| `sukker.svg`, `gaer.svg` | 25 g sukker i bægerglas, 20 g tørgær i pose | tuden (5, 5) og åbningen (12, 4) |
| `spatel.svg` | spatel | bladets spids (6, 108) |
| `taeller.svg` | håndtæller | bunden (22, 52); tallet tegnes i koden |
| `spand.svg` | affaldsspand | bunden (44, 88) |
| `baegerglas.svg` | bægerglasset, der ikke hører til forsøget | tuden (68, 3) |

Proppen, væsker, bobler, skum, dampe, glasskår, spild, stativet, lokalet og
luppen tegnes i koden.

## Filer

```
index.html          markup: scene, panel, intro, teori, tegneserie, rundvisning
css/stil.css        alt udseende. NB: decimaltal med PUNKTUM i CSS
js/kerne.js         NK-navnerum, positurer, væskeniveau, tegnehjælpere
js/model.js         biologien og tallene: gæring, mætning, BTB, farver
js/lyd.js           lydene med Web Audio, ingen lydfiler
js/sprites.js       indlæser SVG'erne og tegner dem drejet om et anker
js/figur.js         en lærer på scenen: gang, arm, ansigt, taleboble og scener
js/scene.js         tegnebordet (1000 x 600): mål, lokalet, kolber, gærrør, luppen
js/forsoeg.js       trinene, tilstanden, tiden og tællingen
js/handlinger.js    klik, træk og slip: hvad der sker med hvad
js/bord.js          tegning af bordet og styring med musen
js/laerer.js        SM-Simons scener og bemærkningerne om fejl
js/tegneserie.js    tegneserien med fejlruder, resultatskema og graf
js/rundvisning.js   spotlight-rundvisningen bag ?-knappen
js/app.js           panel, måleskema, knapper, tastatur, tegneløkke
simon/              SM-Simon: hans ansigt, hans sprites og hans glimt
niller/             Kemi-Niller: gæsten fra kemilokalet ved siden af
```

## At rette i den

**Biologien og tallene** står i `js/model.js`. **Trinene** står i `TRIN`
øverst i `js/forsoeg.js` med tekst, hint og hvilken genstand hintet markerer.
Hvornår et trin er gjort, afgøres i `trinGjort`. **Fejlene** noteres med
`iagttag(noegle, bemaerk)`; nøglerne står i en kommentar under `TRIN`.
SM-Simons replik til hver står i `BEMAERK` i `js/laerer.js`, og rudens tekst og
tegning i `FEJL` i `js/tegneserie.js`.

**Koreografierne** (`koer`) er lister af trin: `flyt` en genstand til en
positur, vent med `hver` og gør noget undervejs, eller `kald` en funktion.
Lærerens scener (`laererKoer`) virker på samme måde med `gaa`, `sig`, `arm` og
`udtryk`. Formatet står øverst i `simon/simon.js`.

Genveje: <kbd>Mellemrum</kbd> boble · <kbd>V</kbd> vent 5 min · <kbd>I</kbd> hint ·
<kbd>N</kbd> nyt forsøg · <kbd>S</kbd> tegneserie · <kbd>T</kbd> teori ·
<kbd>M</kbd> lyd · <kbd>H</kbd> rundvisning · <kbd>Esc</kbd> luk.
