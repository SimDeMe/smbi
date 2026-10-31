# Lydfeedback på simulationerne

Deltageren tænker højt, mens simulationen bruges, aflytter og sender aktivt.
Designretningen står i `simulationsdesign.md`, afsnit 4. Første simulation er
`geografi/luftmasser/`. Den skrevne feedback (`feedback.js` og Google-arket) er
uafhængig af dette.

Optageknappen vises kun, når begge dele er opfyldt:

1. `supabaseUrl` er sat i `feedback/lyd-config.js`.
2. Siden er åbnet med et afprøvningslink: `…/geografi/luftmasser/?afproevning=KODE`.

Almindelig brug af simulationen mærker intet og spørger aldrig om mikrofonen.

## Delene

| Fil | Hvad den gør |
| --- | --- |
| `feedback/lydfeedback.js` | information, optagelse, aflytning, afsendelse og kvittering. Kan genbruges |
| `geografi/luftmasser/afproevning.js` | hvilke handlinger og hvilken tilstand loggen følger på denne side |
| `feedback/lyd-config.js` | offentlig adresse og anon-nøgle |
| `feedback/lyd-oversigt.html` | ejerens login: lyt, læs log, hop i lyden, slet |
| `supabase/migrations/` | tabeller, adgangsregler og privat bucket |
| `supabase/functions/modtag-lydfeedback/` | modtager; reglerne står i `logik.js` |
| `supabase/functions/ryd-lydfeedback/` | sletter efter 90 dage og fjerner halve uploads |

Biblioteket `@supabase/supabase-js` 2.118.0 bruges kun i oversigten og på serveren,
fordi login og fornyelse af sessioner ellers skulle skrives i hånden. Deltagerens
side henter det ikke. Fejler CDN'et, virker oversigten ikke, men optagelsen gør.

## Opsætning

Skridt 1, 2 og 3 kræver din egen konto og kan ikke gøres for dig.

1. Opret et projekt på [supabase.com](https://supabase.com) i en EU-region (Stockholm
   eller Frankfurt). Tjek pris og kvoter; projekter på gratisplanen kan blive sat
   på pause ved inaktivitet, og så kan der ikke afleveres, før det er vækket.
2. Installér værktøjet og log ind:

   ```bash
   brew install supabase/tap/supabase
   ```

   ```bash
   supabase login
   ```

3. Koble repoet på projektet (`REF` står i projektets adresse) og send det hele op:

   ```bash
   supabase link --project-ref REF
   ```

   ```bash
   supabase db push
   ```

   ```bash
   supabase functions deploy modtag-lydfeedback && supabase functions deploy ryd-lydfeedback
   ```

   ```bash
   supabase secrets set RYD_NOEGLE=$(openssl rand -hex 32)
   ```

   Skriv nøglen ned til oprydningen i skridt 6. Tjenestenøglen sættes af Supabase selv
   og må aldrig ligge i repoet.
4. **Authentication → Providers → Email:** slå tilmelding fra. Opret din egen bruger
   under **Authentication → Users**, og gør den til ejer i **SQL Editor**:

   ```sql
   insert into public.ejere select id from auth.users where email = 'DIN@MAIL';
   ```

5. Sæt `supabaseUrl` og `anonNoegle` ind i `feedback/lyd-config.js`. Anon-nøglen er
   offentlig; reglerne i databasen er det, der beskytter data.
6. Slå oprydningen til under **Database → Extensions** (`pg_cron` og `pg_net`) og kør:

   ```sql
   select cron.schedule('ryd-lydfeedback', '30 3 * * *', $$
     select net.http_post(
       url := 'https://REF.supabase.co/functions/v1/ryd-lydfeedback',
       headers := jsonb_build_object('x-ryd-noegle', 'RYD_NOEGLE')
     ) $$);
   ```

   Teksten til deltagerne lover sletning senest efter 90 dage, så det her skal køre,
   før rigtige optagelser kommer ind.
7. Lav et afprøvningslink. Koden gælder én simulation og har udløb og loft:

   ```sql
   insert into public.afproevningskoder (kode, simulation, udloeber, maks_afleveringer, note)
   values (replace(gen_random_uuid()::text, '-', ''), 'geografi/luftmasser',
           now() + interval '30 days', 30, 'Første prøve')
   returning kode;
   ```

   Linket bliver `https://smbi.dk/geografi/luftmasser/?afproevning=KODE`. Luk en kode
   med `update public.afproevningskoder set aktiv = false where kode = '…';`.

## Grænser

Højst 15 minutter og 12 MB pr. optagelse, 20 afleveringer i timen pr. kode, 50 i døgnet
i alt og `maks_afleveringer` pr. kode. Tallene håndhæves på serveren (`GRAENSER` i
`logik.js`, bucketten i migrationen). Tjekket er ikke låst ved samtidige afleveringer,
så loftet kan overskrides med nogle få; det er forbrugskontrol, ikke adgangskontrol.

## Test

```bash
node supabase/functions/modtag-lydfeedback/logik.test.mjs
```

```bash
node værktøj/lydfeedback-test.mjs
```

Browsertesten bruger syntetisk lyd og falsk Supabase, fordi headless Chromium hænger
ved `getUserMedia`. Den kontrollerer hele forløbet, men ikke tilladelsesdialogen.

## Før funktionen tages i brug

Kan først kontrolleres mod det rigtige projekt:

- [ ] Rigtig mikrofon i Chrome, Edge, Firefox og Safari, også iPhone: tilladelse, afvisning, aflytning, mikrofonen slukker efter stop.
- [ ] Aflevering fra `smbi.dk` i et privat vindue uden login giver kvittering, og optagelsen kan høres i oversigten sammen med en log, der passer med lyden.
- [ ] I et privat vindue kan anon-nøglen ikke læse, liste, overskrive eller slette noget i `lydfeedback`, koder eller bucketten.
- [ ] Sletning fra oversigten fjerner både lyd og række. Oprydningen kører og sletter en række med `slet_efter` i fortiden.
- [ ] Udløbet kode, kvote og afbrudt forbindelse giver forståelig besked uden kvittering.

Skal være afklaret, før andre end du selv optager:

- [ ] Dataansvar, behandlingsgrundlag og databehandleraftale med Supabase. Stemmer er personoplysninger, og deltagerne kan være elever.
- [ ] Skolernes rolle ved deltagelse, og hvordan frivilligheden sikres, når en lærer beder klassen om det.
- [ ] Teksten i dialogen i `feedback/lydfeedback.js` er gennemgået, og den rummer det, der besluttes. Det gælder også, hvordan man får slettet en optagelse.
