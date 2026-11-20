## Øvelse: Måling af luftfugtighed — laves om før næste brug

`Øvelser/Geografi/maaling-af-luftfugtighed/` (erfaring fra 1p NF, 19/11 2026:
spørgsmål til afleveringen tog en stor del af næste modul).

- [ ] Fjern tabellen over maksimal luftfugtighed (`@tbl-1`).
- [ ] Indsæt i stedet en eller flere trykte mætningskurver (fx et overblik
  −5 til 30 °C og et udsnit omkring stuetemperatur med fint gitter), som
  eleverne aflæser på.
- [ ] Eleverne markerer deres målinger og dugpunkterne direkte på kurven
  (vandret linje fra målepunktet hen til kurven).
- [ ] Eleverne skal ikke selv tegne en kurve ud fra data — fjern den mulighed i
  databehandlingens punkt 6.
- [ ] Gennemgå databehandlingen, så den passer til kurven, og render pdf/docx/html.

- Vands termiske udvidelse-simulering? 
 - Både i en flaske/rør
 - Men også i have af forskellige dybder. Måske med en 3d jordklode?

## Biologi: Fordøjelsessystemet — simulering (ny)

`biologi/fordoejelse.html` (alfa, 20/11 2026): Blender-model bygget af
`biologi/fordoejelse/blender/fordoejelse.py`, se `biologi/fordoejelse/LÆS-MIG.md`.

- [x] **Opbygning og funktion.** 3D-model af hele fordøjelseskanalen (mund,
  spiserør, mave, tolvfingertarm, tyndtarm, tyktarm, endetarm) og de tilhørende
  organer (spytkirtler, lever, galdeblære, bugspytkirtel). Klik/hold over en
  del for navn og opgave — kort, ikke et leksikon.
- [x] **Forløbet fra mund til blod og til anus.** Maden følger kanalen i
  tempo, hvor eleven kan spole og pause. Vis både mekanisk (tygning,
  peristaltik, mavens blanding) og kemisk nedbrydning, og hvor
  næringsstofferne optages (tyndtarmens villi → blodet/lymfen; vand i
  tyktarmen) — og hvad der ender som afføring.
- [x] **Se maden blive nedbrudt.** Stivelse, protein og fedt som synlige
  molekyler, der spaltes til glukose, aminosyrer og fedtsyrer/glycerol, når
  de rette enzymer rammer dem (amylase, pepsin, trypsin, lipase m.fl.).
  Skeln mellem substrat, enzym og produkt, og vis hvor i kanalen hvert
  enzym virker.
- [x] **Enzymer og pH.** Fanen «Enzymer og pH» (20/11): pH-skyder 0–14, enzymernes
  aktivitetskurver med optimum, genveje til mund/mave/tyndtarm/tyktarm, klik på et organ
  bruger dets pH, og de organer, hvor de aktive enzymer hører til, fremhæves. Under
  «Madens vej» kan eleven ændre mavens pH og slå galden fra («Hvad nu hvis …?»).
- [x] **Opgaver.** Opgavekort med syv undersøgelsesopgaver og en knap, der stiller
  modellen op til hver (20/11). Mangler evt. journal-/databehandlingsspørgsmål.
- [ ] **Faglig kontrol og design.** Oplys forenklinger (tidsforløb, mængder
  og pH-værdier er idealiserede). Test på 1280×577, 1366×625 og mobil;
  figur og primære kontroller samtidig (`design_rules.md` §3). Hvis 3D
  fejler: 2D-fallback. Derefter: kort på `biologi.html` (som alfa), række i
  biologiskemaet, `sitemap.xml`.
  Gjort 20/11: test ved 1280×577, 1366×625 og 375 px, reservebillede uden WebGL,
  alfakort og `sitemap.xml`. Mangler: rækken i biologiskemaet og elevafprøvning.

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

### Brugsoplevelse

- [ ] **Barsel trækkes jævnt fra hele året.** Linjerne under Indstillinger →
  Andet i porteføljen trækkes fra årsnormen fordelt over alle årets
  arbejdsdage. Det passer til frikøb og overførte timer, men en barsel ligger
  i en bestemt periode, så «foran/bagud» bliver skæv før og efter den (fx
  800 t barsel fra marts: i efteråret ser man ud til at være langt foran).
  Mulig løsning: en valgfri periode (fra–til) på en linje, så dens timer
  kun trækkes fra arbejdsdagene i perioden — som ferien i `ferie.js`.

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

### Dokumentation og kode

- [ ] **Tjek ferieplanerne igen.** Skolens plan for 2026/27 (25 dage — planen
  skriver juli 2027, men mener 2026) er skrevet ind i `SKOLENS_FERIE` i
  `ferie.js` og bruges, til læreren selv gemmer ferie. Læg hvert år den nye
  plan ind dér (2027/28 når den kommer).

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
