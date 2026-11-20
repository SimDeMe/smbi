# Færdige punkter fra ToDo.md

Afkrydsede punkter flyttes hertil fra `ToDo.md`, med deres overskrifter bevaret.

## Tidsregistrering (`tid/`) — forslag fra gennemtest

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
- [x] **Perioder på opgaver og hold.** Skolens faste perioder — hele
  skoleåret, grundforløb, efter grundforløb og eksamensperiode — med datoer
  pr. skoleår i Indstillinger (`aktivitetsperiode.js`). Løbende opgaver og
  hold uden normgrundlag optjener kun over periodens arbejdsdage, og
  «foran/bagud skema» regner med, at budgettet bruges i perioden. «Ved
  afslutning» optjener nu den brugte tid undervejs og resten ved afslutning.
- [x] **Eksamenstid i maj.** Engangsopgaver kan optjenes i næste
  normperiode (flueben): tiden tæller i år, budgettet næste år.
- [x] **Vintertermin.** Oprettes som engangsopgave — ingen periode.

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
- [x] **6. ferieuge** er med i normen på 1690 t. Den lægges derfor ikke ind
  som ferie, men oprettes som en opgave «6. ferieuge» på 37 t, og hver
  fridag registreres som 7t 24m på den. Indstillinger og hjælpesiden siger
  det nu; intet ekstra felt i appen.
