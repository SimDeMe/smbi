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
- [ ] **Tjek ferieplanerne igen.** Gennemgå skolens ferieplan for lærerne
  hvert år, og ret perioderne under Indstillinger → Ferie, så de passer
  (2026/27: 25 dage — planen skriver juli 2027, men mener 2026). Og få styr på
  **6. ferieuge**: Er de 37 timer ferie-fridage med i normen på 1650 t eller
  ej? Er de *ikke* med (229 × 7,4 t ≈ 1695 t, 224 × 7,4 t ≈ 1658 t tyder på
  det), lægges dagene ind som ferie, når de er aftalt med ledelsen. Er de
  med, registreres de som tid i stedet. Overvej om appen skal have et felt
  til det, så det ikke skal huskes.
