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
`geografi/Tidevand.html`, `geografi/boelger.html`, `geografi/vulkanudbrud.html`, `geografi/stensamling.html`, `biologi/membran.html`,
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

## 1. Tokens — fælles identitet, plads efter opgaven

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
  --max:1180px;        /* forsider og læsesider; simulationer op til 1600px */

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
  Klassen `.mono` findes færdig. I kontrolpaneler bruges mindst `0.72rem`
  med `letter-spacing:0.035em`, så etiketter kan læses uden at fylde
  unødigt i bredden. Reducér mellemrum før skriftstørrelse.

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

Forsider og læsesider følger dette skelet. Simulationer bruger det
kompakte sidehoved og arbejdsområde i afsnit 3a:

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

Kun de dele, siden har brug for. Indre rækker adskilles med blækstreger; i det kompakte kontrolpanel er
`1px` tilstrækkeligt. Yderrammen bevarer sitets formsprog.

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

## 3a. Simulationer — et kompakt arbejdsområde

Den visuelle identitet er fælles, men undervisningsforsiden og selve
arbejdspladsen bruger forskellige størrelser. Simulationer skal åbne
med titel, figur og primær betjening samlet på en almindelig laptop
ved 100 % zoom. Brug 1366 × 650 og 1024 × 650 CSS-pixels som kontrol;
kontrollér også 390 × 844 og projektortilstand.

* Sidehovedet har en kort titel og et udfoldeligt «Om simulationen» med
  den eksisterende indledning. Topbjælken er kompakt, og arbejdsspalten
  må være op til 1600 px bred. Mere bredde må ikke automatisk give en
  højere figur.
* `.sim-workspace` er arbejdsområdet, `.sim-visual` indeholder figuren,
  og `.sim-controls` indeholder indstillinger, målinger og trinvalg.
  Betjeningsspalten er cirka 320 px bred og kan betjenes med tastaturet.
  Et eksisterende `.rig-body` kan også være `.sim-workspace`.
* `.sim-main` beholder figurens formatforhold (`--sim-ratio`). To
  sammenhørende billeder, fx tværsnit og lup, bliver ved siden af hinanden
  i `.sim-pair`, også i laptoplayoutets mellemstørrelse.
* Prioritér skydere og tal. På laptop kan et dekorativt `.g-viz`-instrument
  udelades, når samme måling står tydeligt som tal med navn og enhed.
  Signaturer og længere forklaringer er tilgængelige i `details`;
  indhold fjernes ikke. Primær figur og relevant betjening skal forblive
  sammen, når et ekstra afsnit åbnes.
* Mange ens valg kan bruge en native `select`. Vælgeren bruger de
  eksisterende knappers hændelser, følger deres aktive tilstand og
  opdateres, hvis muligheder ændres. Der vises én betjening for samme valg.
* En ekstra målegraf kan vælges med «Simulation», «Målegraf» og «Begge».
  De relevante skydere og målinger bliver tilgængelige i alle visninger.
  «Simulation» er udgangspunktet; «Begge» kan kræve rulning i billedspalten
  på en lille skærm.
* `hidden` skal altid skjule indhold, også efter en komponent har fået
  `display:flex` eller `display:grid`. Skjulte tilstande må ikke fylde
  eller kunne tabbes til. Bevar labels, fokusmarkering og tastaturstyring.
* Telefoner har fri sidehøjde og almindelig lodret rulning. Touchbetjening
  får mindst 44 px træfflade. Print bruger igen fri højde.

CSS og arbejdsområde-script ligger i hver side, som resten af skabelonen,
så siden stadig er et selvstændigt forlæg. Ingen fælles stilfil eller build
er nødvendig. Tilpas særtilfælde som stensamlingens liste og 3D-lærredets
størrelsesfunktion til deres indhold.

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
* **Responsivt:** vælg brydepunkter efter indholdet. Arbejdsområdet bruger
  to spalter fra 900 px, når vinduet er mindst 480 px højt; mindre vinduer
  bruger almindelig lodret rulning. Et bredt canvas eller SVG kan stadig få
  sin egen vandrette rulning på en telefon. Der må ikke komme vandret
  rulning på hele siden.
* **Højdebudget gælder hele arbejdsområdet.** Mål pladsen efter det aktuelle
  sidehoved, værktøjsbjælken og eventuelle andre faste rækker. Læg den i
  `--work` på `.rig`, og figurens andel i `--fig`. Figuren tilpasses sit
  formatforhold i `.sim-main`; spalten må ikke alene bestemme højden.
  Forklaringer og sekundære valg må rulle i `.sim-controls`, så figuren
  bliver på skærmen. Et overfyldt kontrolpanel må ikke få tilpasningen til
  at opgive og gøre figuren stor igen.
  Sider, der selv måler lærredet, læser `--fig` i deres størrelsesfunktion
  og udstiller `window.tilpasFigur`. Lærredets indre pixelmål følger det
  valgte visningsmål og pixeltæthed; modellen ændres ikke.
  Se arbejdsområde-scriptet nederst i `geografi/Stigningsregn.html` og
  størrelsesfunktionen i `geografi/Aarstider.html`.

* **`@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`**
* **`@media print`** — skjul `.top`, `.foot` og navigationsknapper, så det
  aktuelle billede kan komme på ét A4.
* **Rammen skal stå stille inden for skærmen.** På en laptop er
  `.sim-workspace` afgrænset af `--work`, så trin og forklaringer ikke
  flytter figuren eller hovedbetjeningen. Lås ikke hele panelet til det
  længste forklaringstrins fulde højde. Lang tekst foldes ud i et
  `details`-element eller ruller i sin egen forklaringsdel. På telefoner
  er arbejdsområdets højde fri. En gammel `min-height`-lås på rækker
  tilsidesættes i kontrolpanelet, når den kun reserverer tom plads.
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
