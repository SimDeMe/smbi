# Designskabelon — gælder alle nye sider

Sitet er ved at blive lagt om til ét fælles formsprog: **papirfarvet baggrund,
sorte blækrammer, hårde skygger, regnbuestribe og tre skrifter.** Nye sider
skal følge skabelonen herunder. Kopiér fra en side, der allerede er lagt om.

**Referencer, i prioriteret rækkefølge:**

| Fil | Bruges som forlæg til |
| --- | --- |
| `index.html` + `forside.css` | forside, kort, sektioner, knapper |
| `geografi/Stigningsregn.html` | simulering med canvas + skydere + instrumenter |
| `geografi/drivhuseffektenSimpel.html` | trinvis SVG-figur med forklaringsspalte |
| `biologi/membran.html` + `biologi/membran/` | større simulering delt op i moduler |

Lagt om indtil videre: forsiden, fagforsiderne, `born.html`, `admin.html`,
`contact.html`, `Stigningsregn.html`, `drivhuseffektenSimpel.html`,
`drivhuseffekten.html`, `poroesitetPermeabilitet.html`, `TermiskTryk3.html`,
`Dugpunkt.html`, `groenlandspumpen.html`,
`biologi/transkription.html`, `biologi/enzymkinetik.html`,
`biologi/osmose.html`, `biologi/DNA_Simulering.html`, `biologi/enzymhastighed.html`,
`geografi/Tidevand.html`, `geografi/boelger.html`, `biologi/membran.html`,
`biologi/fotosyntese.html`, `biologi/bio-blocks/index.html`,
`biologi/membran2d.html`, `biologi/KvindensCyklus/FinalSim.html`,
`navneApp/`, `tid/`
(brug dem som forlæg, når `--accent:var(--bio)` skal
bruges). Resten af `geografi/`, `biologi/` og `style.css`-siderne kører
stadig det gamle design — rør dem kun, når opgaven handler om dem.

## 0. Filstruktur — én fil eller flere

**Alle nye simuleringer må deles op i flere filer** — 2D såvel som 3D, store
som små. Det er et frit valg, ikke et krav: en lille figur må gerne blive i én
selvstændig HTML-fil. Del op, når det gør siden lettere at læse og rette, og
altid når mindst ét af disse er sandt:

* JavaScript-delen er over ca. 600 linjer,
* siden består af flere uafhængige dele, der kan bygges og rettes hver for sig
  (fx én transportmekanisme ad gangen),
* siden indeholder en beregningsmodel eller fagdata, som skal kunne læses og
  rettes uden at scrolle forbi tegnekode.

Et lille eksempel i ren canvas 2D + SVG er `geografi/boelger.html`: `model.js`
(bølgemodellen), `strand.js` (profil og sand), `boelger.js`, `opskyl.js`,
`kort.js` (bølgekortet) og `side.js`.

Koden lægges i ES-moduler i en undermappe med sidens navn:

```
biologi/membran.html            CSS, markup, importmap — siden selv
biologi/membran/side.js         indgangen: binder DOM, moduler og løkke sammen
biologi/membran/model.js        rammen: scene, kamera, styring, render-løkke
biologi/membran/struktur.js     figurens opbygning
biologi/membran/molekyler.js    fagdata
biologi/membran/transport.js    registret over sidens delmekanismer
biologi/membran/transport-*.js  én delmekanisme pr. fil
```

Samme opdeling holder uden three.js: `biologi/membran2d.html` er den samme
side i ren canvas 2D, og der er `model.js` lærred og kamera i stedet for
scene og orbit. Se `biologi/membran2d/PLAN.md`.

**Bliver i HTML-filen:** `:root`-tokens, al CSS, hele markup'en og importmappet.
Skabelonen bygger på, at hver side har sin egen tokenblok og kan bruges som
forlæg for den næste — en fælles stilfil ville ødelægge det. (`forside.css` er
forsidens, `style.css` er det gamle design; ingen af dem er fælles kode for nye
sider.)

**Flytter ud:** beregningsmodellen, figurens opbygning, fagdata og de
uafhængige delmekanismer.

**Del efter fagligt indhold, ikke efter teknisk lag.** En fil pr.
transportmekanisme eller pr. klimazone giver mening; en fil ved navn `utils.js`
eller `state.js` gør ikke — den slags opdeling skaber bare tilstand, der skal
sendes frem og tilbage. De uafhængige dele samles i et lille register med én
fast kontrakt, så en ny del er *én ny fil plus én linje*:

```js
export default {
  id:'pumpe', navn:'Na⁺/K⁺-pumpen',
  byg(ctx),              // laver figurens dele
  opdater(t, dt, ctx),   // flytter dem ét billede frem
  aflaes(ctx),           // returnerer tallene til .gauges
  ryd(ctx)               // ved skift
};
```

**Krav:** `<script type="module" src="…/side.js">`, importmappet placeret
**før** det første modul, og stadig ingen build og ingen npm-pakker. Moduler
kræver en server — det gør siderne i forvejen på grund af de rod-relative
links, så `python3 -m http.server 8777` er uændret arbejdsgangen. Modulerne
arver dokumentets importmap, så de kan skrive `import * as THREE from 'three'`
uden at kende CDN-adressen.

## 1. Tokens — kopiér uændret ind i `:root`

```css
:root{
  --paper:#FFF9EE;  --paper-2:#FFF3DC;  --panel:#FFFFFF;
  --ink:#17211F;    --slate:#566B68;

  --pink:#E8336D; --blue:#0E86C8; --lime:#5FB030; --amber:#FFB300;
  --grape:#7A4FD6; --coral:#FF6A3D; --teal:#0FA593;

  --bio:var(--pink);   /* biologi-sider */
  --geo:var(--blue);   /* geografi-sider */
  --accent:var(--geo); /* sidens egen farve — sæt én gang, brug overalt */

  --display:'Archivo',system-ui,sans-serif;
  --body:'Source Serif 4',Georgia,serif;
  --mono:'IBM Plex Mono',ui-monospace,monospace;

  --wide:'wdth' 118;
  --max:1180px;        /* 980px, hvis siden er én smal spalte */

  --hard:4px 4px 0 var(--ink);
  --hard-lg:7px 7px 0 var(--ink);
}
```

Skrifterne hentes fra Google Fonts i `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..900&family=IBM+Plex+Mono:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,300..600&display=swap" rel="stylesheet">
```

**Sådan bruges de tre skrifter:**

* `--display` (Archivo) — overskrifter, knapper, tal i instrumenter, mærkater i
  SVG. Altid `font-weight:700–800`; overskrifter får
  `font-variation-settings:var(--wide)` og negativ `letter-spacing`.
* `--body` (Source Serif 4) — al brødtekst. Sidens `font-size` er `17px`.
* `--mono` (IBM Plex Mono) — etiketter, enheder, øjenbryn, fodnoter. Altid
  `text-transform:uppercase; letter-spacing:0.12–0.14em` og lille (≈0.6rem).
  Klassen `.mono` findes færdig.

**Enheder skrives altid, som de staves.** Versalerne i mono-mærkaterne må
ikke lave `mmol/L` om til `MMOL/L`, `kJ/mol` om til `KJ/MOL` eller `pH` om til
`PH` — en forkert skrevet enhed er en faglig fejl, ikke en designdetalje. Skal
en enhed stå inde i et mærkat med `text-transform:uppercase`, så pak den ind:

```css
.enhed{text-transform:none}
```

```html
<span class="fact">Kropsvæske <b>≈ 300</b> <span class="enhed">mmol/L</span></span>
```

Det gælder også tekst, der sættes fra JavaScript: hold enheden i sit eget
element, så aflæsningen kan opdateres uden at røre den. Og vælg en enhed,
eleverne kender — `mmol/L` frem for `mOsm/L`, `°C` frem for `K` — medmindre
emnet netop handler om den anden.

**Farvebrug:** højst én accentfarve pr. side (`--accent`). Regnbuen bruges kun
i topstriben og i brandmærket. Lyse toner til flader: `#C7E6F6` blå,
`#FBD3E1` pink, `#D6EFC4` grøn, `#E2D6F8` lilla, `#FFD9C9` koral,
`#FFE9DC` "pas på"-bokse.

## 2. Sidens skelet

Rækkefølgen er altid den samme:

```html
<header class="top" id="site-top">
  <div class="rainbow"></div>              <!-- 7 px regnbuestribe -->
  <div class="top-bar"> brand + .top-nav </div>
</header>

<main>
  <div class="wrap head">                  <!-- sidehoved -->
    <span class="eyebrow mono"><span class="blink"></span>Fag · emne</span>
    <h1>Titel med <span class="hi" style="--hc:#C7E6F6">fremhævning</span></h1>
    <p class="lead">Én sætning om hvad man gør her.</p>
  </div>

  <div class="wrap">
    <section class="rig"> ... selve simuleringen ... </section>
  </div>
</main>

<footer class="foot"> brand + .foot-links </footer>
```

Fast krom, der skal med på hver side:

* **Topbjælken** er `position:sticky` med `border-bottom:2px solid var(--ink)`
  og halvgennemsigtig papirbaggrund + `backdrop-filter:blur(10px)`.
  Brandet er `smbi.dk` med `.brand-mark` (conic-gradient-firkant med blækkant).
  Undersider har to links: faget og forsiden.
* **`.hi`** lægger en skæv farveklat bag et ord i `h1` (`--hc` styrer farven).
* **Bunden** er `--ink`-flade med `#FFF6E0` tekst og pilleformede links.
* **Ingen `.smbi-home`-knap mere.** Den flydende hjem-knap i gammelt design
  erstattes af topbjælkens navigation.
* **Iframe-krom:** sidste script på siden skjuler `#site-top`, `.foot` og
  `.head`, når `window.top !== window.self`, så figuren kan lægges i en iframe.

## 3. `.rig` — signaturpanelet

Alt interaktivt bor i ét panel:

```
.rig        hvid flade, border:2.5px solid ink, radius 18px, box-shadow var(--hard-lg)
 ├ .rig-bar   9 px stribe i --accent
 ├ .rig-head  lys stribe (#E7F4FB) med pulserende .dot + .mono-status,
 │            værktøjsknapper (.btn-mini) til højre
 ├ .stage     selve figuren: prikket baggrund
 │            radial-gradient(circle at 1px 1px,#E6EDEB 1px,transparent 0) 0 0/16px 16px
 │            canvas/svg har selv border:2px solid ink + radius 12px
 ├ .gauges    instrumenter i et grid, adskilt af 2 px blækstreger,
 │            hver med sin lyse baggrund (#FFF1EC, #F1ECFC, #EDF8E4, #E7F4FB)
 ├ .knobs     skydere på --paper-2
 └ .facts     pilleformede nøgletal/signaturforklaring nederst
```

Kun de dele, siden har brug for. Alle indre rækker adskilles med
`border-top:2px solid var(--ink)` — panelet skal se ud som ét apparat.

**Knapper:** blækkant, hård skygge, og de flytter sig ved klik.

```css
.btn:hover  {transform:translate(-2px,-2px); box-shadow:6px 6px 0 var(--ink)}
.btn:active {transform:translate(2px,2px);   box-shadow:1px 1px 0 var(--ink)}
```

`.btn-mini` er den lille udgave (2 px skygge) til `.rig-head`.

**Skydere** styles i alle tre browsere (`::-webkit-slider-runnable-track`,
`::-webkit-slider-thumb`, `::-moz-range-track`, `::-moz-range-thumb`): 10 px
bane med blækkant, 22 px rund gribeknap med blækkant og hård skygge. Hver
slider får sin egen `--track`-gradient og `--kc`-knapfarve.

## 4. Hold siden let

Byg kun det, opgaven beder om — skabelonen er en ramme, ikke en tjekliste, der
skal fyldes ud. Tilføj ikke på eget initiativ:

* En statuspille/-boks der i ord gentager, hvad instrumenterne (`.gauges`)
  allerede viser (fx "Enzymerne arbejder" oven på et mætningsinstrument, der
  viser det samme tal). Vælg ét sted at vise en given oplysning.
* Lange forklarende tekstblokke under panelet (teorigennemgang, øvelser,
  "prøv selv"-lister) medmindre brugeren har bedt om dem. Sådan indhold hører
  hjemme i undervisningsmaterialet ved siden af, ikke som fast del af hver ny
  simulering.

Spørg, hvis det er uklart om siden skal have forklarende tekst under panelet
— tilføj det ikke som standard.

## 5. Faste krav til hver side

* **`<html lang="da">`**, sigende `<title>` der ender på `— smbi.dk`, og en
  `<meta name="description">` på én sætning. Dertil hovedets faste blok med
  kanonisk adresse, delekort og ikoner — se `seo.md`, og husk sidens adresse i
  `sitemap.xml`.
* **Tilgængelighed:** `:focus-visible{outline:3px solid var(--grape)}`,
  `aria-label` på figurer, `aria-live="polite"` på det felt der ændrer sig,
  `<title>`/`<desc>` i SVG'er, og et skjult statusfelt (`.sr`) til skærmlæsere.
  Betjening skal kunne klares med tastatur alene.
* **Farve er aldrig eneste signal** — kombinér med stregtype, mærkat eller form
  (fx kortbølget = fuldt optrukket, langbølget = stiplet).
* **Responsivt:** brydepunkter ved 960 px (to spalter → én), 700 px (brede
  SVG'er får deres egen vandrette rulning med `min-width`, resten af siden
  ruller kun lodret) og 620 px (mindre skrift, `--hard` i stedet for
  `--hard-lg`, padding 16 px).
* **Højdebudget — figuren skal kunne ses sammen med sine knapper.**
  Panelets højde må ikke afhænge af spaltens bredde alene. Gør den det,
  vokser figuren ud over skærmen, og man kan ikke se visualisering,
  instrumenter og skydere på én gang. Hver simuleringsside har derfor
  tokenet `--fig` i `:root`, en `max-width` på den kasse, figuren bor i
  (bredden følger af formatforholdet), og scriptet `Højdebudget` nederst
  på siden:

  ```css
  :root{--fig:456px}                                    /* udgangspunkt */
  .stage{max-width:calc(var(--fig)*800/400 + 20px);margin-inline:auto}
  ```

  Scriptet måler, hvad panelet bruger til alt andet end figuren, og
  lægger resten af skærmhøjden i `--fig`. Tre ting hører med:

  * Budgettet **kan kun gøre figuren mindre** — aldrig bredere end
    spalten i forvejen tillod. På en høj skærm sker der ingenting.
  * Kan panelet alligevel ikke komme til at passe (for mange rækker
    under figuren, eller en sidespalte der er højere end den), **giver
    budgettet op** og lader figuren beholde sin fulde størrelse.
    En figur, der er skrumpet uden gevinst, er det værste af begge dele.
  * Sætter siden selv lærredets størrelse i JavaScript (three.js,
    et lærred uden fast formatforhold), så skal `--fig` læses dér i
    stedet — `Math.min(…, budget)` — og siden udstiller
    `window.tilpasFigur`, som scriptet kalder, når budgettet skifter.

  Kopiér fra `geografi/Stigningsregn.html` (lærred med fast forhold),
  `geografi/TermiskTryk3.html` (lærred uden fast forhold) eller
  `biologi/membran/model.js` (three.js).

* **`@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`**
* **`@media print`** — skjul `.top`, `.foot` og navigationsknapper, så det
  aktuelle billede kan komme på ét A4.
* **Rammen skal stå stille.** Har siden trin eller tilstande med forskellig
  mængde tekst, må panelet ikke hoppe i højden, når man klikker videre — så
  flytter figuren, knapperne og trinprikkerne sig for hvert klik. Mål alle
  tilstande én gang ved indlæsning og lås panelet til den højeste
  (`min-height` i px); mål igen ved `resize`, ved skift af projektortilstand
  og på `document.fonts.ready`. Den plads, der bliver til overs på de korte
  trin, samles ét sted (fx ved at hænge navigationen i bunden med
  `margin-top:auto`), og indhold der kun vises i ét trin, får sin plads
  reserveret med `visibility:hidden` frem for `hidden`/`display:none`.
  Låsen gælder kun to-spaltelayoutet — under 960 px står tingene under
  hinanden, og der ville den kun give dødt luftrum.
* **Deling og tavle:** hvis siden har trin eller tilstande, så afspejl dem i
  `location.hash` (`#trin=3`) og accepter dem også som query (`?trin=3`).
  Projektortilstand (`?projektor=1` / `?mode=teach`) skjuler sidens krom og
  skalerer teksten op.
* **Ingen eksterne afhængigheder** ud over Google Fonts — og three.js fra CDN
  på de sider, der er ægte 3D (aftalt undtagelse, se `geografi/Tidevand.html`).
  Ingen build, ingen npm-pakker, ingen ikonbibliotek-CDN i nye sider.

## 6. Når fysikken/modellen ændres

Simuleringernes beregninger er undervisningsindhold. Ved omlægning af designet
skal modellen være **uændret** — omskriv kun rammen, og kontrollér resultatet
mod den gamle udgave over et gitter af inputkombinationer, før du kalder det
færdigt (sådan blev `Stigningsregn.html` lagt om: 0 afvigelse over 250
kombinationer).
