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
- `geografi/TermiskTryk3.html` — har allerede bløde overgange i «Trin for trin»;
  se om rækkefølgen inden for hvert trin kan vise årsagskæden
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

## Sidespalte og højdebudget — de øvrige simuleringer

Læg dem om én ad gangen efter `geografi/Stigningsregn.html` (afsnit 7 i
`design_rules.md`): `node værktøj/pladstjek.mjs <side>` før og efter, kig på
skærmbillederne, nyt versionsnummer, modellen uændret. Tallet er, hvor meget
panelet manglede ved 1366×625 (`pladstjek --alle`, 5. oktober 2026).

Først (mangler mest plads): `geografi/TermiskTryk3.html` (1190 px),
`biologi/enzymkinetik.html` (858), `geografi/vulkanudbrud.html` (596),
`geografi/drivhuseffekten.html` (564).

Derefter — kan ikke ses straks på nogen af de lave skærme:

- [ ] `geografi/magnetiskNord.html` — 544 px (mangler også ved 1920×940)
- [ ] `biologi/DNA_Simulering.html` — 540 px
- [ ] `geografi/Aarstider.html` — 522 px (mangler også ved 1920×940)
- [ ] `geografi/pladegraenser.html` — 491 px
- [ ] `biologi/oelbrygning.html` — 490 px (v2.0)
- [ ] `biologi/enzymhastighed.html` — 472 px
- [ ] `biologi/bio-blocks/index.html` — 472 px (blokprogrammering; figuren er
  hele bredden, så sidespalten skal måske tænkes anderledes)
- [ ] `geografi/poroesitetPermeabilitet.html` — 452 px
- [ ] `geografi/Tidevand.html` — 450 px (three.js → `window.tilpasFigur`;
  mangler også ved 1920×940)
- [ ] `biologi/transkription.html` — 449 px (v1.0; mangler også ved 1920×940)
- [ ] `biologi/fotosyntese.html` — 441 px
- [ ] `biologi/KvindensCyklus/FinalSim.html` — 428 px
- [ ] `biologi/osmose.html` — 391 px
- [ ] `geografi/drivhuseffektenSimpel.html` — 342 px (v1.0; trinvis, så
  højdelåsen fra afsnit 5 skal med)
- [ ] `biologi/membran.html` — 317 px (three.js → `window.tilpasFigur`)
- [ ] `geografi/Dugpunkt.html` — 261 px
- [ ] `geografi/boelger.html` — 194 px

Kan ses efter rulning ved 1366×625, men ikke ved 1280×577 — mindst haster:

- [ ] `geografi/kompas.html` — mangler 274 px ved 1280×577
- [ ] `biologi/gaerbobler.html` — mangler 216 px ved 1280×577
- [ ] `biologi/membran2d.html` — mangler 147 px ved 1280×577

Skal ses på, før de lægges om:

- [ ] `geografi/groenlandspumpen.html` — «efter rul» overalt, men pladstjek
  måler figuren til 15×15 px; find ud af, hvad der skal måles som figur.
- [ ] `geografi/stensamling.html` (v2.4) og `geografi/stensamling/beskaer.html`
  — en samling og et værktøj, ikke en figur med skydere. Nok bedre at lade
  pladstjek springe dem over end at presse dem ind i et højdebudget.
- [ ] `biologi/gaerbobler2/index.html` — har intet `.rig`-panel og kommer
  derfor ikke med i `pladstjek --alle`. Gammelt design, eller afløst af
  `gaerbobler.html`?
