# Lectio-skema — lokal prototype

Lokalt program til at hente et lærerskema med MitID-login og sende det til
Tids kalender. Linket er forudfyldt med skole 141. Perioden er
1. august til og med 31. december 2026 (23 skemauger).

## Start

Kræver Node.js 20 eller nyere. Fra denne mappe:

```sh
npm install
npx playwright install chromium
npm start
```

Åbn http://127.0.0.1:8787. Tryk **Åbn Lectio**, log ind i det separate
browser-vindue med MitID, og tryk **Opdater alt** første gang.
MitID godkendes af dig; programmet beder ikke om dine loginoplysninger.
Eventuelt kan installeret Chrome bruges med `LECTIO_BROWSER_CHANNEL=chrome npm start`.

Den valgte periode hentes uge for uge med et sekunds pause mellem ugerne.
Fremdriften vises i appen, og et månedsfilter begrænser visningen uden at
begrænse JSON-eksporten. Også tidligere og tomme uger hentes.
Der er ingen automatisk hentning fra Lectio:

- **Opdater** henter fra i dag (dansk dato) til periodens slutning. Tidligere
  aktiviteter bevares, mens fremtidige aktiviteter erstattes, så rettelser
  og slettede aktiviteter kommer med. Lectio leverer hele uger, men dagene
  før i dag i den første uge ændres ikke i de gemte data.
- **Opdater alt** henter hele perioden igen, inklusive tidligere uger.

Ved udløbet login skal du logge ind igen. Perioden skifter ikke automatisk.
"Uge til login" bestemmer kun, hvilken uge login-vinduet åbner på.
Sidste vellykkede resultat bevares ved fejl og vises efter genstart.
Appen læser kun den lokale status undervejs; statuspolling kontakter ikke Lectio.

## Forbind til Tid

1. Start programmet, og hent skemaet med Opdater alt første gang.
2. Tryk **Send til Tid**. Der åbnes et forbindelsesvindue på smbi.dk.
3. Log ind med samme Google-konto som i Tid, kontroller kontoen og tryk
   **Forbind og gem skema**. Skema, aflysninger og krediteringer gemmes i
   Firebase under din bruger.
4. Åbn **Historik → Kalender** i Tid. Lectio-aftaler vises som stiplede
   blokke i dag/uge og som markeringer i måned/år. Tryk på en aftale for
   detaljer, herunder lærerens og holdets kreditering.

Så længe både Lectio-siden og forbindelsesvinduet er åbne, sendes nye
resultater fra Opdater / Opdater alt også til Tid. Der hentes stadig aldrig
automatisk fra Lectio. Lukker du et vindue, skal forbindelsen åbnes igen.
Forbindelsen gemmer ingen Firebase-tokens på den lokale server og sender
ingen Lectio-cookies eller MitID-oplysninger til smbi.dk.

Hvis browseren blokerer forbindelsen, kan du bruge **Hent JSON** og åbne
**Indstillinger → Importér Lectio-skema** i Tid. Vælg filen og gem den på
din konto. Det er samme import og samme krediteringsdata.

Planlagte aftaler holdes adskilt fra registreret arbejdstid. De tælles ikke
med i timer, rapporter eller akkorder og kan ikke flyttes eller redigeres
fra Tid. Oprindelige tidsregistreringer og aktiviteter ændres ikke.

## API

`GET /api/skema` returnerer sidste hentning, uden at kontakte Lectio.
`GET /api/status` returnerer forbindelsesstatus og konfiguration.
Appens knapper bruger `POST /api/config`, `/api/login` og `/api/sync`.
Konfigurationen indeholder `from` og `to` som ISO-datoer, højst 370 døgn
mellem datoerne. `POST /api/sync` med `{ "mode": "future" }` eller
`{ "mode": "all" }` starter hentning og svarer HTTP 202; standarden er future.
Resultatets `lastUpdate` angiver tilstand, start/slut og faktisk hentede uger.
`GET /api/status` viser fremdrift med `syncing` og `status`. Først når alle
uger er læst, erstattes sidste resultat. Ved fejl bevares sidste resultat.
JSON-eksporten er det første integrationspunkt til Tid:

```json
{
  "schemaVersion": 1,
  "range": { "from": "2026-08-01", "to": "2026-12-31" },
  "weeks": ["312026", "322026", "332026", "342026", "352026", "362026", "372026", "382026", "392026", "402026", "412026", "422026", "432026", "442026", "452026", "462026", "472026", "482026", "492026", "502026", "512026", "522026", "532026"],
  "source": "https://www.lectio.dk/lectio/141/SkemaNy.aspx?week=432026",
  "fetchedAt": "2026-10-15T12:00:00.000Z",
  "events": [{
    "id": "123:2026-10-19T08:10:00",
    "activityId": "123",
    "title": "Biologi",
    "start": "2026-10-19T08:10:00",
    "end": "2026-10-19T09:45:00",
    "allDay": false,
    "timeZone": "Europe/Copenhagen",
    "group": "2x BI",
    "teacher": "SM",
    "room": "B12",
    "cancelled": false,
    "changed": false
  }],
  "warnings": []
}
```

Eksemplet er fiktivt. Start/slut er lokale klokkeslæt i den angivne tidszone,
ikke UTC. Aflyste aktiviteter bevares med `cancelled: true`.
Heldagsaktiviteter har `allDay: true`, start ved midnat og eksklusiv slut
ved næste midnat. De må ikke omsættes til 24 timers registreret arbejdstid.
Aktiviteter er planlagte tider, ikke automatisk registreret arbejdstid.

## Kreditering af aflyste moduler

Under Opdater / Opdater alt hentes også krediteringen for de aflyste
aktiviteter i de opdaterede uger. Læseren åbner aktivitetens eksisterende
redigeringsformular med GET, aflæser felterne og lukker siden. Der sendes
ingen formular og ingen ændringer til Lectio.

Hvert aflyst event får `credits` med `status: "ok"` eller `"unknown"`,
`teachers` og `groups`, kilde-URL og hentetid. Begge lister har `credited`
som true/false/null og det modulantal, Lectio viser i feltet. Modulfeltet
kan godt vise 1, selvom krediteringsfeltet er slået fra. Lærerens og holdets
kreditering læses hver for sig. Lærerrækker har desuden `extraHours`,
`role` og `cancellationReason`, når felterne findes. Der indsamles ingen
elevlister eller fraværsregistreringer.

Ukendte krediteringer gemmes som ukendte med en advarsel. Der udledes
aldrig kreditering fra aflysningsårsag eller skemastatus. Historiske felter
opdateres med Opdater alt; Opdater bevarer tidligere importerede værdier.
Visningen har et filter til kun at vise aflyste aktiviteter.

Verificeret 15. oktober 2026 med alle 23 uger i perioden: 8 aflyste moduler,
hvoraf 2 var krediteret til både lærer og hold, og 6 til ingen af dem.
Alle 8 krediteringer blev læst; ingen stod som ukendte. Blanke årsagsfelter
forbliver blanke. Det er et øjebliksbillede af Lectios data, ikke faste regler.

## Status og begrænsninger

Hentning bruger browserens session og læser Lectios HTML, ikke et officielt
Lectio-API. Den 15. oktober 2026 blev hentning verificeret med et rigtigt
lærerskema fra skole 141, uge 43: 21 aktiviteter, herunder heldagsaktiviteter,
undervisning, møder og aflysning. Den gemte MitID-session virkede efter
genstart af browseren. Parseren læser Lectios `data-tooltip` samt ældre
`title`-felter. Der er også automatiske test med syntetiske HTML-eksempler.
Samme dag blev hele perioden 1. august–31. december 2026 hentet: alle 23
uger og 300 aktiviteter. Månedsfilteret viste 69 i august, 72 i september,
76 i oktober, 60 i november og 23 i december. Fremtidige aktiviteter kan
ændres eller blive tilføjet senere i Lectio.
Hvis Lectio ændrer
formatet, eller en brik ikke kan læses, afvises hele hentningen frem for at
overskrive det sidste skema med ufuldstændige data. En genkendt tom skemauge
gemmes som tom. Parseren læser aktivitetens tidspunkt, synlige tekst,
hold, lærer, lokale og markeringer; den henter ikke lektier eller elevlister.

Session, konfiguration og skema ligger i `.local/`, som er ignoreret af Git.
Browserprofilen indeholder en aktiv login-session og skal holdes privat.
Serveren lytter kun på 127.0.0.1 og afviser fremmede Origins og Hosts.
Den accepterer kun Lectio-skemalinks og har ingen åben CORS-adgang.

Henteprogrammet kører på computeren; kalenderen og forbindelsesvinduet er
statiske sider på smbi.dk. Firebase gemmer aftaler under
`users/{uid}/lectioSchedules/{skoleår}`, fx `2026-27`, med én atomisk
transaktion pr. import. Historik uden for opdateringsperioden bevares, og
gamle importer kan ikke overskrive et nyere skema. Dokumenter begrænses
til 750 kB JSON pr. skoleår med plads til Firestores metadata.

De eksisterende Firebase-regler i `tid/firebase-config.js` giver kun
ejeren adgang til data under eget uid; ingen administratornøgle er nødvendig.
Forbindelsen validerer afsenderens origin, vindue og engangsnonce, og kontoen
skal godkendes i Tid-vinduet. Se også [Firestore-transaktioner](https://firebase.google.com/docs/firestore/manage-data/transactions).

Tids eksisterende backup indeholder egne aktiviteter, registreringer og
indstillinger. Lectio-skemaets reservekopi er JSON-filen fra dette program.
Loginets levetid over længere tid mangler stadig at blive afprøvet. Der er
ingen garanti for permanent ubemandet MitID-adgang.

## Kontrol

```sh
npm test
node test/browser.mjs
```

Browsertesten starter selv serveren på en separat port. Den bruger
syntetiske skemabrikker og falske API-svar; ingen Lectio-konto tilgås.
