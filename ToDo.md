- Vands termiske udvidelse-simulering? 
 - Både i en flaske/rør
 - Men også i have af forskellige dybder. Måske med en 3d jordklode?


## Motion design — trin der tegnes i årsagsrækkefølge

Som i `drivhuseffektenSimpel.html` (v1.0) og `drivhuseffekten.html` (v2.0):
det nye i et trin tegnes frem i den rækkefølge, det sker, når man går ét trin
frem. Figurens færdige billeder og modellen skal være uændrede, og med
reduceret bevægelse vises trinnene færdige.

- `geografi/pladegraenser.html` — glid mellem grænsetyperne, så det ses, at det
  er samme plader med en anden bevægelsesretning.
- `geografi/TermiskTryk3.html` (v2.0) — har allerede bløde overgange, når
  figuren bygges op trin for trin i Forklaring-fanen; se om rækkefølgen inden
  for hvert trin kan vise årsagskæden
  (opvarmning → luften udvider sig → trykket falder → vinden blæser).

## Video af simuleringerne (HyperFrames el.lign.)

Kræver at siden kan spoles: en ren funktion af tiden, som `window.dhsFilm.saet(T)`
i `drivhuseffektenSimpel.html` (`?film=1` / `?film=styret`).

- Filmtilstand i `drivhuseffekten.html` — temperaturanimationen skal så også
  styres af tiden i stedet for `performance.now()`.
- Sider med `model.js` og `opdater(t, dt)` er tættest på: `boelger/`, `membran/`,
  `membran2d/`, `pladegraenser/`.
- Korte klip (20–40 s) til Lectio, Teams og PowerPoint, og små løkker som
  forhåndsvisning på kortene på fagsiderne.

## Tidsregistrering (`tid/`) — forslag fra gennemtest

Testet i Chromium med en falsk Firebase (auth + Firestore i hukommelsen) i
390 px og 1280 px. Appen virker; punkterne er sorteret efter, hvad de giver.

### Fejl og robusthed

- [x] **Nul-minutters poster ved hurtige skift.** To tryk inden for et minut
  gemte den første som en post på 0 m («SRP 14:47–14:47 · 0m»). En timer, der
  stoppes efter under ét minut, slettes nu i stedet for at blive gemt.
- [x] **Hurtigstart følger ikke med aktiviteterne.** Den blev kun tegnet ved
  navigation til Hjem, så en ny/ændret aktivitet (fra en anden enhed, eller
  mens man står på Hjem) ikke kom med. Tegnes nu ved hvert snapshot.
- [x] **Timer-banneret kan vise forkert navn ved opstart.** Kom den
  igangværende post før aktiviteterne, stod der «Ubundet tid» til næste
  snapshot. Banner og timerkort tegnes nu igen, når aktiviteterne ændres.
- [x] **Overlappende registreringer tælles dobbelt uden advarsel.** Formularen
  advarer nu («Overlapper med 3g Ng 08:00–09:35»), og i listen får
  overlappende poster mærkatet «Overlap». Pauser tæller med, for de er fælles
  tid. Rapporten viser stadig ikke overlappet tid for sig.
- [x] **«Alle» i historiklisten er stille begrænset til 500 poster** (2–3
  måneder). Under en afskåret liste står nu «Viser de seneste 500» og en knap
  «Vis 500 mere». Samtidig rettet: kalenderen åbnede en post ældre end
  listens 500 som «Ny registrering», så Gem lavede en kopi.

### Brugsoplevelse

- [x] **Kort pause fylder historiklisten.** Pauser står nu som en tynd stiplet
  mellemlinje («Pause 15m 09:35–09:50»), der stadig kan trykkes på og rettes.
- [x] **Dobbelt timer på Hjem.** Banneret er skjult på Hjem og vises på de
  andre faner.
- [x] **«Bagud skema» er misvisende i efteråret.** Forløbet regnes nu på
  arbejdsdage (`ferie.js`): weekender, helligdage og ferien fra Indstillinger
  → Ferie (perioder pr. skoleår) springes over. Skolens plan for 2026/27 giver
  25 feriedage og 229 arbejdsdage.
- [x] **Import sætter ingen optjeningsmåde.** Femte kolonne
  (`løbende`/`afslutning`/`manuel`, også som i formularen), og importen siger,
  hvor mange opgaver der blev løbende, fordi kolonnen manglede. Budgetter med
  komma (`20,5`) læses nu rigtigt.
- [x] **Støj i holdets faktorlinje.** «Retning (skønnet)» står kun, når der
  er registreret retning.
- [x] **Ugevisningen bliver høj af en post hen over midnat.** Enderne ved
  midnat udvider ikke længere aksen: aftenen får sin første time med
  («22:00–…»), og fortsættelsen efter midnat står som en stump øverst
  («…–00:40») med den rigtige varighed.
- [x] **Navne trunkeres i hurtigstart.** Navne står på op til to linjer, og
  lange navne (over 20 tegn eller et ord over 12) får hele bredden.
- [ ] **Barsel trækkes jævnt fra hele året.** Linjerne under Indstillinger →
  Andet i porteføljen trækkes fra årsnormen fordelt over alle årets
  arbejdsdage. Det passer til frikøb og overførte timer, men en barsel ligger
  i en bestemt periode, så «foran/bagud» bliver skæv før og efter den (fx
  800 t barsel fra marts: i efteråret ser man ud til at være langt foran).
  Mulig løsning: en valgfri periode (fra–til) på en linje, så dens timer
  kun trækkes fra arbejdsdagene i perioden — som ferien i `ferie.js`.

- [x] **Perioder på opgaver og hold.** Skolens faste perioder — hele
  skoleåret, grundforløb, efter grundforløb og eksamensperiode — med datoer
  pr. skoleår i Indstillinger (`aktivitetsperiode.js`). Løbende opgaver og
  hold uden normgrundlag optjener kun over periodens arbejdsdage, og
  «foran/bagud skema» regner med, at budgettet bruges i perioden. «Ved
  afslutning» optjener nu den brugte tid undervejs og resten ved afslutning.
- [x] **Eksamenstid i maj.** Engangsopgaver kan optjenes i næste
  normperiode (flueben): tiden tæller i år, budgettet næste år.
- [x] **Vintertermin.** Oprettes som engangsopgave — ingen periode.
- [ ] **Perioder: tjek datoerne hvert år** i `SKOLENS_DATOER`
  (`aktivitetsperiode.js`): første skoledag, grundforløbets slutning,
  studieretningens start og eksamensperioden. 2026/27 er skolens plan
  (GF til 30/10, SR fra 3/11); eksamensperioden 1.–24. juni er fra
  kalenderen 2025-26.

### Hastighed

- [ ] **Hurtigere opstart på mobil.** Allerede gjort: service-workeren
  serverer hele appen fra cachen (`service-worker.js`), Firestore har
  `persistentLocalCache`, og modulerne er `modulepreload`. Mål først med en
  langsom telefon (Chrome DevTools, «Slow 4G» + 4× CPU) og se, hvor tiden går.
  Mulige syndere:
  - `onAuthStateChanged` venter på, at Firebase Auth har læst login fra
    IndexedDB, før noget vises — kunne vise appen straks, hvis en lokal
    markering siger, at man var logget ind sidst.
  - `await initIndstillingerView()` i `app.js` holder resten tilbage; læser
    den fra serveren i stedet for cachen (`getDocFromCache` først)?
  - Firebase-SDK'et (gstatic) og Google Fonts er på andre domæner og
    caches ikke af service-workeren — kun browserens egen cache. Overvej at
    lægge SDK-filerne og skrifterne lokalt i `tid/` og i cachelisten.
  - Alle views initialiseres ved opstart; kalender, rapporter og Lectio
    kunne vente, til fanen åbnes første gang.

### Tilgængelighed

- [x] **Arkene har ingen tastaturhåndtering.** Arkene og onboarding er nu
  modale dialoger (`ark.js`): navngivet efter titlen, fokus ind ved åbning og
  tilbage ved lukning, appen bagved `inert`, Tab går rundt i arket, Escape
  lukker. Rækkerne i historik og aktiviteter kan tabbes til og åbnes med
  Enter.
- [x] **Små tryk-mål i måneds- og årsvisningen.** Ugenumrene er 44 px brede
  (38 px under 360 px), månedsrækkerne i året mindst 44 px høje.

### Dokumentation og kode

- [x] **Hjælpesiden er forældet.** Indstillinger beskrevet, som de er;
  auto-stop 10 timer; listefiltrene og knapnavnene i Aktiviteter passer.
  Specifikationen er rettet til koden (600 min, start 1. juni, ferie).
- [x] **Vis appens version** nederst i Indstillinger — navnet på den cache,
  appen kører fra (`tid-v32`). Samtidig rettet: tid og navneApp slettede
  hinandens caches, når den ene blev opdateret.
- [x] **Dubletter.** `esc`, `capitalize`, `fmtMins` og `fmtTime` ligger nu i
  `format.js`, `openSheet`/`closeSheet` i `ark.js` — tastaturpunktet ovenfor
  er dermed én rettelse i `ark.js`.
- [x] Testopsætningen (falsk Firebase + Playwright) ligger i `tid/test/` —
  `node tid/test/alle.mjs` kører det hele. Se `tid/test/README.md`.
- [ ] **Tjek ferieplanerne igen.** Skolens plan for 2026/27 (25 dage — planen
  skriver juli 2027, men mener 2026) er skrevet ind i `SKOLENS_FERIE` i
  `ferie.js` og bruges, til læreren selv gemmer ferie. Læg hvert år den nye
  plan ind dér (2027/28 når den kommer).
- [x] **6. ferieuge** er med i normen på 1690 t. Den lægges derfor ikke ind
  som ferie, men oprettes som en opgave «6. ferieuge» på 37 t, og hver
  fridag registreres som 7t 24m på den. Indstillinger og hjælpesiden siger
  det nu; intet ekstra felt i appen.

## Figur og kontroller samtidig — de øvrige simuleringer

Målet er `design_rules.md` afsnit 3: på en skolelaptop skal **den centrale
figur og de primære kontroller** kunne bruges samtidig uden at scrolle. Hele
panelet behøver ikke kunne ses; grafer, forklaring og sekundære
indstillinger må ligge i faner, fold-ud-paneler eller længere nede, og
panelet låses ikke til det længste trins højde. Vælg layout efter modellen
— `geografi/Stigningsregn.html`, `geografi/TermiskTryk3.html` (v2.0, faner i
sidespalten) og `geografi/raastoffer.html` er eksempler, ikke skabeloner.
Modellen bevares; kør `node værktøj/pladstjek.mjs <side>` før og efter og kig
på skærmbillederne (også `…_rullet.png`). Udpeger værktøjet forkert figur
eller kontrol, så sæt `data-pladstjek="figur"`/`"kontrol"` på siden.

Tallet er, hvor meget spændet fra figurens top til den nederste primære
kontrol er højere end skærmen ved 1366×625 (`pladstjek --alle`, 14. oktober
2026) — dvs. figur og kontroller kan ikke ses samtidig, heller ikke efter
rulning. Den fælles årsag er næsten overalt, at kontrollerne ligger i en
række *under* en stor figur; site-header og sidehoved (≈ 300 px) gør det
værre ved start, men en fokustilstand alene løser det ikke.

Mest:

- [ ] `biologi/enzymkinetik.html` — 706 px
- [ ] `biologi/enzymhastighed.html` — 381 px
- [ ] `geografi/Aarstider.html` — 370 px
- [ ] `geografi/magnetiskNord.html` — 347 px
- [ ] `biologi/oelbrygning.html` — 330 px (11 kontroller under figuren)
- [ ] `geografi/vulkanudbrud.html` — 320 px (trinknapperne under figuren)
- [ ] `geografi/Tidevand.html` — 298 px (three.js → `window.tilpasFigur`)
- [ ] `biologi/fotosyntese.html` — 290 px
- [ ] `biologi/KvindensCyklus/FinalSim.html` — 285 px
- [ ] `geografi/pladegraenser.html` — 274 px
- [ ] `geografi/poroesitetPermeabilitet.html` — 270 px
- [ ] `biologi/DNA_Simulering.html` — 268 px (figuren alene er 660 px høj)
- [ ] `biologi/osmose.html` — 238 px

Mindre:

- [ ] `biologi/bio-blocks/index.html` — 230 px (byggestenene står *over*
  byggebordet, som alene er 620 px højt)
- [ ] `biologi/transkription.html` — 190 px
- [ ] `geografi/drivhuseffekten.html` — 174 px
- [ ] `biologi/membran.html` — 138 px (three.js; figuren er selv betjeningen,
  men skyderne for koncentration ligger under)
- [ ] `geografi/Dugpunkt.html` — 108 px
- [ ] `geografi/drivhuseffektenSimpel.html` — 91 px (trinvis; trinknapperne
  under figuren, og svg'en har tom luft over og under tegningen)
- [ ] `geografi/boelger.html` — 42 px

Kan ses samtidig efter rulning ved 1366×625, men ikke ved 1280×577:

- [ ] `geografi/kompas.html` — 121 px ved 1280×577 (figuren bliver større,
  når layoutet skifter under 1366 px)
- [ ] `biologi/gaerbobler.html` — 71 px ved 1280×577
- [ ] `biologi/membran2d.html` — 62 px ved 1280×577

I orden: `geografi/Stigningsregn.html`, `geografi/TermiskTryk3.html`,
`geografi/raastoffer.html` og `biologi/gaerbobler2/index.html` (straks på
alle tre laptopstørrelser); `geografi/groenlandspumpen.html` (efter rul).
Ingen side ruller vandret på telefon (390×750).

Ikke simuleringer: `geografi/stensamling.html` og
`geografi/stensamling/beskaer.html` — en samling og et værktøj; pladstjek
finder ingen figur og melder dem ikke som problem.

- [ ] `biologi/gaerbobler2/index.html` — eget design uden site-header. Afløser
  den `gaerbobler.html`, eller skal de begge blive?
