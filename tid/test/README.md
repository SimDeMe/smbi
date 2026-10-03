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
| `timer-og-hurtigstart.mjs` | hurtigstart følger aktiviteterne, poster under ét minut gemmes ikke |
| `historik-overlap-pauser.mjs` | overlap, pauser som linjer, «Vis 500 mere», kalenderen retter gamle poster |
| `roegtest.mjs` | alle faner og ark åbner, navne med `&`, `<b>` og `"` vises som tekst |
| `ferie.mjs` | foran/bagud på arbejdsdage og ferieindtastningen (fast dato: 2. okt. 2026) |
| `tastatur.mjs` | arkene som dialoger: fokus, Tab, Escape, onboarding |
| `faktorlinje.mjs` | «Retning (skønnet)» kun med registreret retning |
| `version-og-cache.mjs` | versionen i Indstillinger, og at tid ikke sletter navneApps cache |
| `hurtigstart-navne.mjs` | lange navne i hurtigstart ved 390 og 340 px |
| `kalender-og-import.mjs` | poster over midnat i ugevisningen, tryk-mål i måned/år, import med optjening |
| `aarsnorm.mjs` | årsnorm 1690 t, gammel standard 1650 læses som 1690, advarsel om porteføljens sum, portefølje mod merarbejdsgrænsen |
| `backup.mjs` | JSON-backuppen: indstillinger, aktiviteter og registreringer; gendan en rettet fil (nye uden id, tider med og uden tidszone, sletning), fejl i filen, gammel fil uden indstillinger |
| `portefolje-andet.mjs` | frikøb, barsel og overførte timer: indtastning, gem, rapportens norm og portefølje |

Ret en fejl → lav en test, der fejler uden rettelsen, og læg den her.
