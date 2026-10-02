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
- [ ] **«Bagud skema» er misvisende i efteråret.** Forløbet regnes lineært fra
  1. juni, så sommerferien tæller som arbejdstid («▼ 323 t bagud» i oktober).
  Spring ferien over, fx med en indstilling for ferieuger eller arbejdsuger
  pr. år. Den største faglige svaghed i akkordregnskabet.
- [ ] **Import sætter ingen optjeningsmåde.** Alt bliver «Løbende». Tillad en
  femte kolonne (`afslutning`) eller vis en huskeseddel efter import.
- [ ] **Støj i holdets faktorlinje.** Skjul «Retning (skønnet) 0,0», når der
  ikke er registreret retning.
- [ ] **Ugevisningen bliver høj af en post hen over midnat.** Klip vinduet,
  eller marker «…fortsætter» i stedet for at udvide aksen til 00.
- [ ] **Navne trunkeres i hurtigstart** («Eksamen …»). To linjer, eller fuld
  bredde til lange navne.

### Tilgængelighed

- [ ] **Arkene har ingen tastaturhåndtering.** Intet `role="dialog"` /
  `aria-modal`, Escape lukker ikke, og Tab går ud bag arket og
  onboarding-overlayet. Mindst: Escape lukker, fokus i arket ved åbning,
  resten af siden `inert`.
- [ ] **Små tryk-mål i måneds- og årsvisningen.** Ugenummer-knapperne er 32 px
  brede, månedsrækkerne 24 px høje; specifikationen siger min. 44 pt.

### Dokumentation og kode

- [ ] **Hjælpesiden er forældet.** `hjaelp.html` nævner «modul-længde» og
  «ugestart», som ikke findes; specifikationen siger auto-stop 240 min, koden
  600.
- [ ] **Vis appens version** nederst i Indstillinger (fx `tid-v27`).
- [x] **Dubletter.** `esc`, `capitalize`, `fmtMins` og `fmtTime` ligger nu i
  `format.js`, `openSheet`/`closeSheet` i `ark.js` — tastaturpunktet ovenfor
  er dermed én rettelse i `ark.js`.
- [ ] Testopsætningen (falsk Firebase + Playwright) kunne ligge i `tid/test/`
  som regressionstest.
