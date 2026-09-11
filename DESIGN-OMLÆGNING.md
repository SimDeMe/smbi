# Omlægning til det nye design — prioriteret plan

Status pr. 9. august 2026. Skabelonen er beskrevet i `CLAUDE.md`.
Forlæg: `index.html` + `forside.css`, `geografi/Stigningsregn.html`,
`geografi/drivhuseffektenSimpel.html`.

**Lagt om: 24 sider. Tilbage: 21.** (`bio-tree.html`, `geografi/straalingsbalance.html`
og omdirigeringen `biologi/bio-blocks.html` er fjernet i stedet for lagt om.)

Rækkefølgen nedenfor er valgt efter, hvad eleverne og du selv møder oftest,
ikke efter hvad der er nemmest.

---

## ✅ Etape 0 — luk hullerne i det, der allerede er lagt om (færdig)

* `forside.css` fik `@media print` — krom, filterknapper, søgefelt, billedbånd
  og videoer ryger væk, og kort brækkes ikke over midt i en overskrift.
  Dækker også `index.html`, der arver den.
* `geografi/Stigningsregn.html` fik:
  * skjult `.sr`-felt med `aria-live="polite"`, der opsummerer højde,
    temperatur, luftfugtighed, proces og opsamlet nedbør. Instrumenterne
    opdateres for hver optegning og kan derfor ikke selv være `aria-live` —
    feltet skrives først, når luftpakken har stået stille i 700 ms.
  * `Projektor`-knap i `.rig-head` plus `?projektor=1` / `?mode=teach`.
  * delbar tilstand i adressen: `#t=28&v=20&x=520` (starttemperatur,
    start-vandindhold, luftpakkens position), som også accepteres som query.
* Modellen er uændret: **0 afvigelser over 40.326 tilstande fordelt på 1.222
  inputkombinationer**, sammenlignet mod udgaven i `HEAD`.
* De manglende links er med i de nye fagforsider (etape 1).

---

## ✅ Etape 1 — fagforsiderne (færdig)

`geografi.html` og `biologi.html` er skrevet om til skabelonen og hænger nu på
`forside.css` i stedet for `style.css`.

* Sidehoved med øjenbryn, `h1` med `.hi`-klat, lead og nøgletal.
* Simuleringerne står i `.sim`-kort grupperet under `.grp`-overskrifter —
  geografi i tre grupper (klima, tryk/hav, jord), biologi i tre
  (celle/enzymer, genetik, krop).
* Vejledninger, opgaver, forløb og spil ligger i `.stack`-stakke, holdt for
  sig som på forsiden.
* Nyt fælles `fag.js`: søgefelt der filtrerer alle kort på tværs af siden,
  skjuler tomme grupper og stakke, melder antal træffere i et `aria-live`-felt,
  rydder på Escape og kan deles med `?soeg=grundvand`.
* Alle simuleringer og materialer er nu linket fra deres fagforside — også
  `groenlandspumpen`, `straalingsbalance`, `DNA_Simulering`, `transkription`
  og `bio-tree`, som manglede før.

Nye/ændrede tokens i `forside.css`: `.head`, `.soeg`, `.videos`, `.sr`,
`.other-grid.other-2`, `[hidden]{display:none!important}`.

---

## Etape 2 — de tunge geografi-simulationer

De resterende tre har deres eget ad-hoc-formsprog med filspecifikt præfiks
(`--dh-*`, `--gp-*` …) og den gamle flydende `.smbi-home`-knap.

> **Krav ved hver enkelt:** modellen skal være **uændret**. Kontrollér mod den
> gamle udgave over et gitter af inputkombinationer, før den kaldes færdig —
> som ved `Stigningsregn.html` (0 afvigelse over 250 kombinationer).

### ✅ 3 — `geografi/poroesitetPermeabilitet.html` (færdig)

Skåret fra 2165 til 1568 linjer og lagt om til skabelonen. Siden er nu
**ét billede og to skydere** — ingen trin, ingen opgaver, ingen sammenligning.

* De fire trin, måleglasset, tragten, nedsivningsgrafen, sammenligningsbilledet,
  jordprøve-menuen, hjælpepanelet og elevopgaverne er væk. Tilbage er
  tværsnittet, `.gauges`, `.knobs` og `.facts`.
* **Nedsivningen foregår i samme billede som kornene.** Vandet står oven på
  jorden, den våde front vandrer ned, dråber forlader prøven forneden, og
  bagefter står markkapaciteten tilbage som en svagere blå tone.
* **Sorteringsskyderen er vendt om og vist i procent.** Ved 100 % er alle korn
  nøjagtig lige store på billedet (`sigmaTegn = 0`). Det er en idealisering —
  modellens `sigma` er stadig 0,35 phi i den ende — men det er den, billedet
  skal vise.
* Kornene tegnes som cirkler i stedet for uregelmæssige klumper, og antallet på
  tværs går fra ca. 46 (ler) til 12 (grus), så kornstørrelsen kan ses direkte.
  Målestokken nederst i billedet bærer den ægte forstørrelse.
* Lærredet har fast opløsning (1000×560) og skaleres med CSS — så afhænger
  pakningen ikke af vinduets bredde, og der skal ikke bygges om ved `resize`.
* Porøsiteten tælles stadig i pixels på billedet, så tallet og billedet er det
  samme. Pakning + kalibrering tager 2–17 ms.
* Modellen er **uændret: 0 afvigelser over 12.801 inputkombinationer** (11
  felter + tidsfaktoren pr. kombination), sammenlignet mod udgaven i `HEAD`.
* Delbar tilstand: `#k=0.625&s=92` (kornstørrelse, sortering i procent), som
  også accepteres som query. `Projektor`-knap plus `?projektor=1` / `?mode=teach`.

Opgaverne skal senere ligge **ved siden af** simuleringen — i flere niveauer —
i stedet for inde i den.

### ✅ 4 — `geografi/drivhuseffekten.html` (færdig)

Lagt om fra 1955 til 2324 linjer. Modsat den lille søster beholder den *alt*
indhold — otte trin, energibudgettet i W/m², to skydere, 14 opgaver og
printarket. Kun rammen er ny.

* Sidens krom er skabelonens: topbjælke, `.wrap head`, `.rig` med `.rig-bar`,
  `.rig-head`, `.stage`, `.gauges`, `.knobs`, `.facts` og bund. `.dh-app`-laget
  med `--dh-*`-paletten og `.smbi-home` er væk.
* **Tilstandsvælgeren bor nu i `.rig-head`** sammen med `Projektor`,
  `Om modellen` og et link til den forenklede udgave. `?mode=teach/explore/quiz`
  virker som før, og `#trin=6` er lagt oveni — den skrives ved hvert trinskift
  og kan skiftes direkte i adresselinjen (`hashchange`).
* **Instrumenterne står i venstre spalte under figuren**, ikke i en fuldbreddes
  række: termometret og balanceindikatoren aflæser figuren og hører til på
  samme side af panelet. Pladsen er reserveret fra trin 1 med `visibility`, så
  panelet ikke vokser, når de dukker op i trin 2 og 3.
* **Rammen står stille.** `.rig-body` måles over alle otte trin ved
  indlæsning og låses til den højeste; målingen gentages ved `resize`,
  projektorskift, tilstandsskift og `document.fonts.ready`.
* Figuren er malet om i sidens palette (kortbølget `--amber` fuldt optrukket,
  langbølget `--coral` stiplet, konvektion `--blue`), og pilene har fået
  blækkant som i `drivhuseffektenSimpel.html`, så de står lige skarpt på den
  mørke himmel og den lyse jord. Stregtypen er stadig det andet signal ved
  siden af farven, og signaturen i `.facts` viser begge dele.
* Modellen er **uændret: 0 afvigelser over 184.720 sammenlignede værdier** —
  `te`, `dF`, `dT`, `ts`, `tilC` og hele `energi()` over albedo 0,10–0,50 ×
  CO₂ 280–1120 ppm × fire ubalancer × med/uden atmosfære × med/uden drivhus ×
  tre temperaturer, plus `DATA.trin` og `DATA.opgaver` ord for ord, målt mod
  udgaven i `HEAD`.

### ✅ 5 — `geografi/TermiskTryk3.html` (færdig)

Lagt om fra 1210 til 1625 linjer. Vintage-temaet (`--cream`, `--navy`,
Cormorant Garamond) og de tre løse spalter er væk; alt bor nu i ét `.rig`.

* **Panelet i rækkefølge:** `.rig-bar`, `.rig-head` (status, `Fri simulation` /
  `Trin for trin`, `Nulstil case`, `Projektor`), case-rækken med beskrivelsen,
  `.stage` med kanvasset, trin-navigationen, kausalkæden, `.gauges`, `.knobs`
  og `.facts`. Den flydende `.smbi-home` er erstattet af topbjælken.
* **Kausalkæden er blevet knapper** i to spalter — de kan nås med tastatur,
  markerer det aktive trin med `aria-current` og dæmper de trin, man endnu
  ikke er nået til.
* **Instrumenterne** er fire: venstre felt, højre felt, ΔT med udslag til
  begge sider af nulpunktet og overfladevinden. Hver med sin lyse baggrund.
* **Figuren er malet om i sidens palette** — blækstreger, papirfarver, H/L som
  runde mærker med både bogstav og ordet *højtryk*/*lavtryk*, uforstyrret
  reference stiplet over for den fuldt optrukne trykflade. Himlen fylder hele
  figuren, så nattetonen ikke efterlader en lys ramme.
* **Rammen står stille:** case-teksten, vindteksten og statuslinjen måles over
  alle varianter ved indlæsning og låses; målingen gentages ved `resize`,
  projektorskift og `document.fonts.ready`. Panelet står på 1741 px gennem
  alle fire cases og alle seks trin.
* `Fysikken bag`, `Tjek dig selv` og `Til underviseren` er fjernet.
* Deling: `#case=sibirien&trin=4&t=2.00`, som også accepteres som query.
  `?projektor=1` / `?mode=teach` virker som på `Stigningsregn.html`.
* Modellen er **uændret: 0 afvigelser over 298.543 sammenlignede værdier
  fordelt på 96.182 inputkombinationer** — `stepTemps`, `derive`, `jumpToTime`,
  `surfTempAt`, `dispAt`, `crossoverZ` og `cellVel` over alle fire cases hen
  over døgnet, alle ni overfladekombinationer, ekspert-ΔT fra −15 til +15 og
  alle gate-trin, målt mod udgaven i `HEAD`.

### ✅ 8 — `geografi/Dugpunkt.html` (færdig)

Lagt om fra 324 til 782 linjer. Grafen, de tre løse instrumenter og de to
skydere er nu skabelonens `.rig` — Stigningsregn-siden brugt som forlæg, da de
deler samme mætningsformel.

* **Instrumenterne genbruger sidens faste komponenter:** termometer (`.thermo`),
  bue-hygrometer (`.arc`, samme geometri som på `Stigningsregn.html`) og en
  regnmåler-cylinder (`.cyl`) med nulstil-knap. Kun tre instrumenter — ingen
  fjerde gauge er tilføjet, da siden ikke har en fjerde størrelse at vise.
  Grafen selv er stadig kernen: mætningskurven, aksefelterne og luftens punkt.
* **Regnskyen er malet om fra emoji til vektor.** Den gamle `🌧️`-sky med en
  CSS-positioneret overlay er erstattet af en blækstreget sky med dråber,
  tegnet direkte på kanvasset over punktet, når luften er mættet — samme
  visuelle sprog som resten af sitet, uden overlay-positionering der skal
  følge kanvassets skalering.
* Den flydende `.smbi-home` er væk til fordel for topbjælken, og der er
  tilføjet en `Projektor`-knap (`?projektor=1` / `?mode=teach`) samt delbar
  tilstand `#t=20&v=10`, som også accepteres som query.
* Modellen er **uændret: 0 afvigelser over 186.265 sammenlignede værdier
  fordelt på 37.253 inputkombinationer og -sekvenser** — `getMaxCapacity` og
  hele forgreningen i `updateSimulation` (temperatur- og vanddamp-kilde) over
  temperatur 0–35 °C, vanddamp 0–40 g/m³ og 500 tilfældige skydeforløb (for at
  teste akkumuleringen af opsamlet nedbør), målt mod udgaven i `HEAD`.

### ✅ 6 — `geografi/groenlandspumpen.html` (færdig)

Lagt om fra 1153 til 1287 linjer. Modellen (afsnit 1–5 i scriptet: den
skjulte fysik, geometrien, partiklerne, tidsbåndet og selve tegningen) er
**byte-for-byte uændret** — kontrolleret med `diff` mod udgaven i `HEAD`,
0 afvigelser. Kun rammen og brugerfladen omkring er ny.

* Den bespoke `.gp-app`-fuldskærmschrome (egen topbjælke, `.smbi-home`,
  Cambria/Calibri) er væk til fordel for skabelonens `.top`/`.wrap head`/
  `.rig`. `.stage` låser scenen til `aspect-ratio:1280/680`, så det
  uændrede `tilpas()` (som måler containerens `getBoundingClientRect()`)
  fortsat fungerer uden at scriptet er rørt.
* **De fem elevopgaver er fjernet** fra siden efter aftale — samme mønster
  som `poroesitetPermeabilitet.html`. De kan senere lægges som et
  selvstændigt ark ved siden af.
* Statusteksten ("Pumpen kører" / "bliver træg" / …) er flyttet fra en stor
  fritstående overskrift til en `.proc`-pille oven på scenen (samme mønster
  som `Stigningsregn.html`), farvet efter tilstand. Spørgsmåls-pillen
  (`.spg`) sidder øverst i midten. `.rig-head` samler Scenarie-vælgeren,
  Forfra, Pause, hjælp-knappen og en ny `Projektor`-knap.
* Hjælpepanelet (legenden med tungt/let vand, strøm, synkezone, smeltevand,
  Danmark) er genbrugt, men skal nu se ud som sitets øvrige paneler: ink-kant,
  hård skygge, `--display`-overskrift.
* Ny delbar tilstand `#k=0.22&f=0` (kulde- og ferskvandsskyder), som også
  accepteres som query, plus `Projektor`-knap / `?projektor=1` / `?mode=teach`.
  **Fejl fundet og rettet under test:** den forsinkede skrivning til adressen,
  som `koerScenarie('idag')` sætter i gang ved indlæsning, blev ikke
  annulleret, når et delt link satte skyderne om lige efter — den overskrev
  derfor det delte link med standardværdierne et øjeblik senere.
  `laesTilstand()` rydder nu den ventende timer.
* **Ikke lavet i denne omgang:** selve kanvas-illustrationen (sol, is,
  Danmark, partiklernes tunghedsfarve) er stadig malet i sin egen palette,
  ikke sitets ink-streg-stil som fx `TermiskTryk3.html`. Farve er stadig
  vandmassens eneste signal ud over fart — et evt. sekundært signal
  (mønster/stregtype) er ikke tilføjet. Begge dele kan tages som en separat
  finish-runde uden at røre modellen.

Etape 2 er dermed gennemført.

---

## Etape 3 — biologi-simulationerne

Samme øvelse på biologisiden. Her skal `--accent:var(--bio)` bruges.

### ✅ 10 — `biologi/transkription.html` (færdig — skrevet helt om)

Den eneste af sagerne, hvor modellen **ikke** er bevaret: den gamle side var en
drag-og-slip-øvelse, der stoppede ved mRNA'et, og den er erstattet af en ny
simulering, `Fra gen til protein` (1634 linjer). Filnavnet er beholdt, så
gamle links stadig virker.

* **Hele det centrale dogme i ét apparat.** Fem trin: genet i DNA'et,
  transkription base for base, mRNA'et gennem kernemembranen, translation
  kodon for kodon med tRNA, og det færdige protein. Samme figur hele vejen —
  DNA, mRNA og aminosyrekæde vokser frem i hver sin bane, så eleverne ser
  sammenhængen frem for fem løsrevne billeder.
* **Genet er 8 kodoner** (`ATG TTC GGA AAG TCA CAT GTG TGA` →
  Met-Phe-Gly-Lys-Ser-His-Val-STOP). Kort nok til at alt kan stå på skærmen
  samtidig, og valgt så alle mutationstyper kan findes af eleverne selv.
  Kodontabellen er den rigtige, alle 64 kodoner, i en boks der flyder over
  panelet og fremhæver det kodon, ribosomet står på.
* **Punktmutationer.** Man klikker på en base i DNA'et — begge strenge er
  klikbare, og basepar ændres altid parvis — og hele kæden regnes igennem igen.
  Dommen skrives ud i fem kategorier: stille, ændret aminosyre, nonsens,
  stopkodon væk og startkodon væk, med proteinet før og efter ved siden af
  hinanden.
* Trin i `#trin=4`, `Projektor`-knap plus `?projektor=1` / `?mode=teach`,
  tempo-skyder til de to animerede trin, `aria-live`-status og tastaturbetjening.
* **Rammen står stille:** panelet måles ved indlæsning over alle fem trin *og*
  over én mutation af hver slags, så mutationsboksen ikke kan skubbe figuren.
  Målt: 761 px konstant over 11 mutationer og alle trin, 867 px i
  projektortilstand.

### ✅ 15 — `biologi/enzymkinetik.html` (færdig — erstatter `bio-glass/`, skrevet helt om)

`bio-glass/` var en selvstændig app med tre moduler (fordøjelse, kinetik,
glykolyse) på Matter.js og Chart.js, hvoraf kun kinetik-modulet fungerede
efter hensigten. De to andre er droppet, og kinetik-modulet er genopbygget
fra bunden som én simulering uden eksterne afhængigheder.

* Hvert enzym har nu ét fysisk bindingssted — en lille lomme på kanten af
  enzymet — som substraterne skal ramme for at kunne binde. Reaktionen er
  modelleret som E + S ⇌ ES → E + P: et bundet substrat konkurrerer mellem
  katalyse (temperatur- og pH-afhængig) og simpel frigivelse uomdannet, i
  stedet for den gamle udgaves øjeblikkelige kollisions-tjek.
  Substraterne docker i enzymets lomme.
* Samme temperatur/pH-model som før (pH-klokkekurve om 7,0, denaturering
  over 55 °C), men uden Matter.js/Chart.js — kanvas-fysikken og rate-søjlen
  er skrevet fra bunden.
* Alle links til `bio-glass/index.html` er opdateret til
  `biologi/enzymkinetik.html` (forsiden, fagforsiden).

### ✅ 11 — `biologi/DNA_Simulering.html` (færdig)

Lagt om fra 684 til 1356 linjer, `drivhuseffektenSimpel.html` brugt som
forlæg (trinvis SVG-figur). `--accent:var(--bio)`, projektortilstand og
`aria-live`-status er på plads. Modellen er urørt.

### ✅ 12 — `biologi/enzymhastighed.html` (færdig)

Lagt om fra 635 til 1023 linjer. Samme commit fjernede den gamle, ubrugte
`geografi/straalingsbalance.html` og dens links fra forsiden og fagforsiden.

### ✅ 13 — `biologi/osmose.html` (færdig)

Lagt om fra 389 til 980 linjer.

### 14 — `bio-tree.html` (fjernet)

Slettet i stedet for lagt om — indgik ikke i undervisningen længere. Links
fra `index.html` og `biologi.html` er fjernet samtidig.

### ✅ 16 — `biologi/bio-blocks/index.html` (færdig)

Redesignet. Omdirigeringsfilen `biologi/bio-blocks.html` (12 linjer) blev
fjernet tidligere, og `index.html` linker direkte til `biologi/bio-blocks/`.

Appens egen `style.css` (843 linjer) er slettet: markup og al CSS — også
figurens, for molekylerne er SVG inde i bordet — står nu i `index.html`
efter skabelonens afsnit 0. JavaScript-modulerne i `js/` er uændrede på
motorsiden; kun farverne i `js/modules/` er lagt om til sitets palet, og
`js/deling.js` er ny.

Betjeningen sidder i ét `.rig`: `.rig-head` med værktøjsknapperne, en
vælgerrække (modul, form, visning, niveau), byggestenene, bordet, en
statuslinje med `aria-live`, vandinstrumentet og signaturforklaringen.
Forklaringen på knop og ring er flyttet fra startkortet ned i `.facts`, hvor
den bliver stående, mens man trækker. Modul, niveau og projektortilstand
afspejles i `location.hash` og accepteres som query
(`#modul=protein&niveau=B`, `?modul=fedt&projektor=1`).

Tilbage står to ting, der er funktioner og ikke design, og som ligger på
`biologi/bio-blocks/bio-blocks-todo.md`: bordet kan stadig kun betjenes med
træk-og-slip (ikke med tastatur alene), og projektortilstanden forstørrer
sidens krom, men ikke molekylerne — `#svg-space` har ingen `viewBox`.

| # | Fil | Linjer | Indhold |
| --- | --- | --- | --- |
| 9 | `biologi/KvindensCyklus/FinalSim.html` | 1322 | 3 canvas, 1 skyder — links hertil er fjernet fra fagforsiden |

---

## Etape 4 — øvrige indgangssider

Små sider, som stadig hænger på `style.css`. Kan tages samlet på én gang, når
etape 1–3 er i hus.

### ✅ 17 — `contact.html` (færdig)

Lagt om til skabelonen: topbjælke, `.wrap head` med eyebrow/`h1`/lead, og
formularen i et `.kontakt`-panel (samme blækkant + hård skygge som `.rig`,
med `.rig-bar` i `--teal` og `.rig-head` med status-prik — kontakt er
hverken bio eller geo). Formspree-afsendelsen er uændret (samme
`action`-URL og felter), kun rammen og statusboksen (busy/ok/err) er nye.
`site.js` og `@phosphor-icons` er væk; siden bruger `forside.css` og
`fag.js` (kun til årstallet i bunden).

| # | Fil | Linjer |
| --- | --- | --- |
| 18 | `born.html` | 68 |
| 19 | `admin.html` | 105 |

---

## Etape 5 — opgaver og vejledninger

Ren tekst og arbejdsark. De skal typisk kunne printes, så `@media print` er
det vigtigste her — ikke `.rig`. Overvej en let variant af skabelonen:
topbjælke + `.wrap head` + brødtekst, uden instrumentpanel.

**GeoOpgaver** (6): `Demografisk_transition_NF.html` (315) ·
`Demografisk_transition_NF_SVAR.html` (308) · `Vandets kredsløb-c-niv.html` (293) ·
`stigningsregn-HF-niv.html` (234) · `stigningsregn-C-niv.html` (232) ·
`oplande-C-niv.html` (95)

**GeoVejledninger**: mappen findes ikke længere (2026-09-11). De tre
vejledninger er lagt om til Quarto-øvelser under `Øvelser/Geografi/` —
`poroesitet-og-permeabilitet-hf/`, `konvektionskammer-med-opgaver/` og
`poroesitet-og-permeabilitet-med-opgaver/` — og skal derfor ikke lægges om
efter HTML-skabelonen.

**BiologiC/NatureNurture** (9): `1_DNA/test.html` (383) ·
`2_Proteinsyntese/Opgaver_print.html` (380) · `1_DNA/Modulplan_lærer.html` (226) ·
`Forløbsplan.html` (223) · `1_DNA/RapportVejledning.html` (176) ·
`2_Proteinsyntese/DNAFraKiwi_vejledning.html` (173) ·
`undervisningsbeskrivelse.html` (141) · `2_Proteinsyntese/index.html` (95) ·
`1_DNA/index.html` (94) · `index.html` (94)

---

## Etape 6 — værktøjer

Egne apps med egen logik. Lavest prioritet, fordi de bruges af dig og ikke i
undervisningen. Nogle har bevidst deres eget udtryk — beslut fra sag til sag,
om de overhovedet skal med.

| Fil | Linjer | Bemærkning |
| --- | --- | --- |
| `censorUr.html` | 674 | |
| `ForBørn/Mathsteroids/Mathsteroids.html` | 667 | Spil — måske undtaget |
| ~~`tid/index.html` + `hjaelp.html` + `installer.html`~~ | 660 + 190 + 175 | **Lagt om.** Egen `styles.css` med egne tokens (den skal virke offline), accent `--teal`. Appen har regnbuestribe og brandmærke i sin egen topbjælke i stedet for sidens; vejledningerne har det almindelige krom |
| `studiekort/index.html` | 523 | |
| `Arbejdstidskalender_2026-27.html` | 359 | Eget pergament-design med egen `--paper`; printes på papir |
| ~~`navneApp/index.html`~~ | 32 | **Lagt om.** Bruger `/forside.css` til krommet og sin egen `css/style.css` til appen |

---

## Tværgående oprydning

Punkter, der går igen på tværs af alle etaper. Ordn dem *undervejs* på hver
side i stedet for som en separat runde.

* **`.smbi-home` optræder i 39 filer.** Den flydende hjem-knap skal erstattes
  af topbjælkens navigation. Kan ikke søges-og-erstattes maskinelt — hver side
  skal have `<header class="top">` indsat.
* **41 filer mangler `— smbi.dk` i `<title>`.**
* **43 filer mangler `<meta name="description">`.**
* **`<html lang="da">` er på plads overalt** — intet at gøre.
* **Rammen skal stå stille** på alle sider med trin eller tilstande: mål alle
  tilstande ved indlæsning, lås `min-height`, mål igen ved `resize`,
  projektorskift og `document.fonts.ready`.
* **`style.css` kan slettes**, når `studiekort/index.html` er omlagt — den er
  den sidste side, der henter den.
  `backup-gammelt-design/` og `smbi-design/` skal ikke røres.
* **`site.js`** (årstal + gammelt søgefelt) bruges kun af de sider, der
  stadig kører `style.css`. Den kan følge `style.css` i graven — `fag.js`
  har overtaget rollen på de nye sider.

---

## Næste arbejdsgang

**Etape 3:** `biologi/KvindensCyklus/FinalSim.html` (1322 linjer, 3 canvas,
1 skyder) er nu det eneste tilbageværende punkt — links hertil er allerede
fjernet fra fagforsiden.

**Sideløbende:** opgaver til `poroesitetPermeabilitet.html` — et selvstændigt
ark ved siden af simuleringen, i flere niveauer (C, HF), der henviser til
delbare tilstande som `?k=0.125&s=92`.
