# Fysisk enhedstest – Atlas og Island

Tjekliste til den fysiske test, der står åben i
[#47](https://github.com/SimDeMe/smbi/issues/47) og som del af milepæl F i
[#49](https://github.com/SimDeMe/smbi/issues/49). Alt herunder er afprøvet
automatisk i Chromium (og dele i Firefox/WebKit), men **ikke** på rigtige
enheder eller med skærmlæser. Testen laves af ejeren.

Kør hele listen én gang pr. enhed. Sæt `[x]` ved det, der virker som
forventet; skriv afvigelser under «Fund» nederst med enhed, side og trin.
Atlasversionen står i headeren (fx **v434**) – notér den.

| Enhed | Model og OS-version | Browser | Atlasversion | Dato |
| --- | --- | --- | --- | --- |
| iPhone | | Safari | | |
| iPad | | Safari | | |
| Mac | | Safari | | |
| Mac + VoiceOver | | Safari | | |

Test på `https://smbi.dk/atlas/` (ikke en lokal server – så indgår GitHub
Pages' cache og https). Telefon og iPad testes både på højkant og på tværs.

## 1. Globussen (`/atlas/`)

- [ ] Siden indlæses uden blank globus; teksten «Henter verdenskort …» forsvinder.
- [ ] Et vandret og lodret træk med én finger drejer globussen. Siden ruller ikke samtidig.
- [ ] Knib med to fingre zoomer globussen (zoomtallet nederst ændres). Hele siden zoomer **ikke** med.
- [ ] Når fingrene slippes efter et knib, åbnes der ingen landemenu.
- [ ] Knapperne ← ↑ ↓ → drejer, − og + zoomer, Nulstil vender tilbage til 1,0×.
- [ ] Tryk på Island-markøren åbner kortet «Island» med «Under Island» øverst og «Se kortet →» og «Se under overfladen →».
- [ ] «Luk ×» lukker dialogen; globussen står som før.
- [ ] Ingen vandret rulning af siden på telefon (højkant og tværs).
- [ ] Mac: piletaster drejer, når globussen har fokus; Escape lukker åbne dialoger.

## 2. Lagknapperne

- [ ] **Pladegrænser** (på telefon «Plader»): laget tegnes, knappen ser trykket ind, signaturen vises. «Undersøg og kilde →» og «Visning» åbner og kan lukkes.
- [ ] **Klimazoner**: laget og signaturen vises; skift af klimasystem virker.
- [ ] **Jordskælv**: prikker vises; M ≥ 5 / 6 / 7 og dybdeafkrydsning ændrer prikkerne. Feltet «Midt på globussen: …» skifter, når globussen drejes.
- [ ] **Vulkaner**: trekanter vises; aflæsningen midt på globussen virker.
- [ ] Flere lag samtidig: globussen kan stadig drejes uden mærkbar hakken.
- [ ] Et nyt tryk slår hvert lag fra igen; signaturerne forsvinder.

## 3. Landemenuen

- [ ] Tryk på et land (fx Norge) åbner en lille menu med landets navn, Demografi og Klima.
- [ ] Tryk på Danmark giver også **Landekort**; kortet åbner med Jylland, øerne og Bornholm.
- [ ] Landekortet: træk flytter, knib zoomer (1–8×), «← Globus» vender tilbage til samme vinkel og lag.
- [ ] Demografi og Klima åbner og kan lukkes; tallene kan læses uden zoom af siden.
- [ ] Et træk, der begynder på et land, åbner **ikke** menuen.
- [ ] «×» lukker menuen.

## 4. Quizzen

- [ ] «Quiz» åbner valg af verdensdel; «Start …» starter spillet. Markører og lag skjules.
- [ ] Spørgelinjen «Find …» kan læses, og et tryk på det rigtige land giver næste land.
- [ ] Et forkert tryk giver besked uden at låse spillet. «Vis landet» viser placeringen.
- [ ] Små lande (fx Luxembourg, Malta) kan rammes efter knib-zoom.
- [ ] «Afslut quiz» (Mac: også Escape) gendanner globussens vinkel, zoom og lag.

## 5. Fokustilstand

- [ ] Atlas: **Fokus** skjuler site-header og overskrift; globussen bliver større. Et nyt tryk (Mac: Escape) gendanner.
- [ ] Island-kortet, tværsnittet og 3D-landskabet: **Fokus** giver figuren mere plads; den kan slås fra igen.
- [ ] I fokus er alle primære knapper stadig synlige og kan trykkes.

## 6. Island-kortet (`/atlas/island/kort.html`)

- [ ] Reliefkortet fylder figuren uden tomme felter; de 10 vulkannavne og «100 km» kan læses.
- [ ] Tryk på kortet sætter et kryds og viser højde/dybde og koordinat.
- [ ] + og − zoomer (×1–×5); «Hele Island» nulstiller. Dobbelttryk zoomer ind.
- [ ] Uden zoom ruller et lodret strøg **siden**; efter zoom flytter træk **kortet**.
- [ ] Knib på kortet: notér hvad der sker. Kortet har ingen egen knib-zoom, så Safari zoomer sandsynligvis hele siden. Er det forvirrende?
- [ ] «Lag ▾» åbner og lukker; hvert afkrydsningsfelt slår sit lag fra og til.
- [ ] «Hotspot – hvorfor er cirklen stiplet?» og «Data og kilder» kan åbnes.
- [ ] Navigationen 1 Globus · 2 Kort · 3 Under overfladen virker.

## 7. Tværsnittet (`/atlas/island/#island`)

- [ ] Figuren og mærket «Skematisk – ikke målfast · set fra syd» kan læses; ingen knapper ligger hen over mærkerne.
- [ ] «Den Midtatlantiske Ryg» / «Island» skifter figuren.
- [ ] Trin 1–6 og «Næste →» / «← Forrige» virker; teksten skifter.
- [ ] Afspil/Pause virker. Med «Reducer bevægelse» slået til i iOS/macOS starter animationen på pause.
- [ ] «Lag ▾» skjuler og viser lag; «Hotspot (fortolkning)» findes kun ved Island.
- [ ] **3D:** blokken vises med dybde (ikke flad og ikke forstørret hen over figuren).
- [ ] **3D-drejning:** vandret træk drejer blokken; lodret strøg ruller siden og drejer ikke. Drejeknapperne ▲▼◀▶ virker. På telefon står de 2×2 uden at dække mærkerne.
- [ ] «2D» vender tilbage til det flade tværsnit.

## 8. 3D-landskab og geografiske snit (`/atlas/island/model3d.html`)

- [ ] Landskabet indlæses («Henter Islands landskab …» forsvinder) inden for få sekunder på mobilnet/skolenet. Notér tiden.
- [ ] Vandret træk drejer; lodret strøg ruller siden. Knapperne ↶ ↷ + − ⌂ virker.
- [ ] Skyderen «Lodret overdrivelse» ændrer højderne; tallet (×20) følger med.
- [ ] Udsigterne 01–05 skifter; 05 Þingvellir viser riftdalen med Almannagjá og Hrafnagjá.
- [ ] «Vis pladernes bevægelse» åbner sprækkerne og sænker riftdalen; «Nulstil» samler dem.
- [ ] «▷ Rundtur» starter og kan stoppes; den starter ikke af sig selv.
- [ ] «Tværsnit» / `?snit=vatnajokull`: blokken med magmakamre vises og kan drejes; «Følg magma» starter og pauser; «Luk tværsnit» vender tilbage.
- [ ] «Om modellen» åbner og lukkes; fokus vender tilbage til knappen.
- [ ] Enheden bliver ikke mærkbart varm, og siden genindlæses ikke af sig selv efter 2–3 minutters brug (iOS' hukommelsesgrænse).

## 9. Elevopgaven (`/atlas/island/opgave.html`)

- [ ] Alle fem knapper åbner den rigtige side i en ny fane; man kan skifte tilbage til opgaven.
- [ ] På iPad i Split View (opgave + atlas side om side) kan begge bruges.
- [ ] Udskrift/PDF fra Safari: ingen site-krom, adresser står ved knapperne, svarlinjer ved «Saml det».

## 10. VoiceOver (Mac og iPhone)

Slå VoiceOver til (Mac: ⌘F5; iPhone: Indstillinger → Tilgængelighed).

- [ ] Atlas: siden har overskrift «Verden er dit udgangspunkt.»; rotorens overskrifter og knapper kan bruges.
- [ ] Globussen læses som «Interaktiv jordglobus …» med betjeningshjælp. Markørerne læses som «Island: se forklaring og simulationer» osv.
- [ ] Lagknapperne læses med navn og tilstand (trykket/ikke trykket).
- [ ] Efter tryk på en lagknap oplæses den nye tilstand. Åbnes Danmarkskortet, oplæses «Danmarkskort åbnet …», og ved retur «Tilbage på globussen».
- [ ] Dialogen «Island» kan åbnes, læses og lukkes; fokus vender tilbage til markøren.
- [ ] Quiz: spørgsmålet «Find …» og besked om rigtigt/forkert læses op uden at skulle flytte fokus.
- [ ] Island-kortet: tekstalternativet («Kort over Island med terræn …») og navnelisten kan læses.
- [ ] Tværsnittet: tekstalternativet skifter, når Ryg/Island eller trin skiftes; lag der er slået fra, nævnes.
- [ ] 3D-landskabet: valgt udsigt og Þingvellir-teksten læses op; «Om modellen» kan læses og lukkes.
- [ ] Ingen knapper læses kun som «knap» uden navn.

## Fund

| # | Enhed/browser | Side og trin | Hvad skete der? | Alvor (stopper eleven / generer / kosmetisk) |
| --- | --- | --- | --- | --- |
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

Når testen er lavet: skriv kort resultatet ind i `ISLAND-DEMO.md`
(milepæl E «Ikke afprøvet» og milepæl F) og i #47, og opret særskilte
issues for fund, der stopper eleven.
