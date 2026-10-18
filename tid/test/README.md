# Test af Tid-appen

Browsertest med [Playwright](https://playwright.dev) mod en **falsk Firebase**:
`fake-app.js`, `fake-auth.js` og `fake-fs.js` sættes ind i stedet for
Firebase-modulerne fra gstatic, så appen kører helt lokalt — logget ind som
brugeren `u1`, med en Firestore i hukommelsen. Ingen rigtige data røres.

```bash
node tid/test/alle.mjs          # alle testene
node tid/test/alle.mjs ferie    # kun ferie.mjs
node tid/test/ferie.mjs         # én fil direkte (kræver at serveren kører)
```

`alle.mjs` starter selv `python3 -m http.server 8777` i repoets rod, hvis der
ikke kører en server i forvejen. Skærmbilleder lægges i `tid/test/ud/`, som
ikke er med i git.

## Playwright

Testene importerer `playwright`. Er den installeret globalt (som i Claude Code
på nettet), så lav et link, så ES-modulerne kan finde den:

```bash
ln -s "$(npm root -g)" tid/test/node_modules
```

Ellers `npm i -D playwright` et sted uden for repoet og link dertil.
`node_modules` er heller ikke med i git.

## Testdata

Hver test sætter sine egne dokumenter ind via `window.__fsCfg`:

```js
{ seed: [['users/u1/activities/a1', { name: 'SRP', … }], …],
  delay: [['activities', 800]] }   // forsink en samling, fx for at teste indlæsning
```

Tidspunkter skrives som `{ __ts: millisekunder }` og bliver til Timestamps.
Under kørsel kan testen nå lageret via `window.__fs` (`store`, `put`,
`entries`, `Timestamp`).

## Filerne

| Fil | Tester |
| --- | --- |
| `lectio-registrering.mjs` | godkendelse fra Lectio med hold/tider/arbejdstype, dublet og manuel undervisning, ændret import, overlap og ny godkendelse, redigering/sletning, samtidige enheder, offline/fejl/logout, tastatur og 340/390/1280 px |
| `rapport-forklaring.mjs` | tre adskilte hovedtal med egne beregninger, uafhængige referenceværdier, fortegn, normperiode og effektive indstillinger, historiske/fremtidige perioder, fordeling uden ændret saldo, holdnormer/underopgaver/overført optjening mod grafer, tastatur og 340/390/1280 px |
| `gennemgang.mjs` | frivillig dagsgennemgang, ubundet tid, overlap og auto-stop, accept/fortryd af fælles tid uden ændret beregning, accept på ny browser og ugyldighed efter rettelse, neutrale huller med manuel formular, pauser, sekunder, midnat, 550 poster, to enheder, offline/serverkvittering, rollback, lytterfejl, kontoskift, tastatur og 340/390/1280 px |
| `lagringsstatus.mjs` | cache mod servermetadata, ventende ændringer og opstartskø, offline/online uden falsk kvittering, to enheder, sletning og batch uden for viste queries, afvisning og rollback, lytterfejl og ny kontrol, kontoskift, tastatur og 340/390/1280 px |
| `timer-og-hurtigstart.mjs` | hurtigstart følger aktiviteterne, poster under ét minut gemmes ikke |
| `timer-fortryd.mjs` | fortryd stop/skift med bevaret id og note, slettede korte poster, fælles skiftetidspunkt, manuel rettelse, overlap, offline/fejl, nyere timer fra anden enhed, midnat og formular ved 340/390/1280 px |
| `timer-sikkerhed.mjs` | hurtige tryk, atomiske skift, to browserenheder med fælles lager og compare-and-swap, forældede stop, offline/online, flere åbne timere og transaktionsfejl |
| `hjem.mjs` | dagens sum med aktiv timer og midnat, pauser og fremtid, seneste poster med redigering, glemt tid, Lectio som plan, favoritter med arbejdstype, fortsæt, arkivering, kontoændringer og mobil/desktop |
| `historik-overlap-pauser.mjs` | overlap, pauser som linjer, «Vis 500 mere», kalenderen retter gamle poster |
| `roegtest.mjs` | alle faner og ark åbner, navne med `&`, `<b>` og `"` vises som tekst |
| `ferie.mjs` | foran/bagud på arbejdsdage og ferieindtastningen (fast dato: 2. okt. 2026) |
| `tastatur.mjs` | arkene som dialoger: fokus, Tab, Escape, onboarding |
| `faktorlinje.mjs` | «Retning (skønnet)» kun med registreret retning |
| `opstart.mjs` | login uden popup-hjælperens iframe ved start, indstillinger fra cachen før serveren svarer |
| `version-og-cache.mjs` | versionen i Indstillinger, og at tid ikke sletter navneApps cache |
| `hurtigstart-navne.mjs` | lange navne i hurtigstart ved 390 og 340 px |
| `kalender-redigering.mjs` | korte blokke kan rammes, zoom, dagens liste og arket i siden på bred skærm, træk med musen, snap til naboen, advarsel ved overlap og Fortryd |
| `lectio.mjs` | Lectio-fanen: uger nyeste først, fra + registreret tid = til, huller og overlap med småt, sekunder giver ikke et falsk hul |
| `lectio-data.test.mjs` | importvalidering, periodevis erstatning, bevaret historik, afvisning af gamle importer, separate krediteringer og dansk sommertid |
| `lectio-import.mjs` | forbindelse med nonce, kontogodkendelse, automatisk overførsel efter manuel hentning, afbryd, JSON-reservevej og atomisk fejl uden delvise ændringer |
| `lectio-login.mjs` | fremdrift under Google-login, blokerede popups og synlig vej videre, når login-vinduet ikke vises |
| `lectio-kalender.mjs` | planlagte blokke i dag/uge, markeringer i måned/år, krediteringsdetaljer, filter og nul påvirkning af registreret tid |
| `kalender-og-import.mjs` | poster over midnat i ugevisningen, tryk-mål i måned/år, import med optjening |
| `aarsnorm.mjs` | årsnorm 1690 t, gammel standard 1650 læses som 1690, advarsel om porteføljens sum, portefølje mod merarbejdsgrænsen |
| `backup.mjs` | JSON-backuppen: indstillinger, aktiviteter og registreringer; gendan en rettet fil (nye uden id, tider med og uden tidszone, sletning), fejl i filen, gammel fil uden indstillinger |
| `udvikling.mjs` | graferne i skoleårs-rapporten: arbejdet mod normen (37 t × ansættelsesgrad lagt sammen, sammendragets linje, hover), foran/bagud skema og akkordsaldoen uge for uge, ender i sammendragets tal, afsluttet opgave optjener fra sin dato; ugegrafens opgaver ved hover og klik (summen er ugens belastning), piletaster, zoom ved træk og med knapperne |
| `periode.mjs` | skolens faste perioder: foran/bagud og kurven regner budgettet i perioden, løbende optjening kun i perioden, «ved afslutning» optjener brugt tid og resten ved afslutning og forventes, når tiden er brugt, «optjenes i næste normperiode» i begge år, under-opgave følger forælderen, studieretningens start, formular, indstillinger, import og kopi (fast dato: 2. okt. 2026) |
| `portefolje-andet.mjs` | frikøb, barsel og overførte timer: indtastning, gem, rapportens norm og portefølje |

Ret en fejl → lav en test, der fejler uden rettelsen, og læg den her.
