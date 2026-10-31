# Lydfeedback på simulationerne

Deltageren tænker højt, mens simulationen bruges, aflytter og sender aktivt.
Designretningen står i `simulationsdesign.md`, afsnit 4. Første simulation er
`geografi/luftmasser/`. Den skrevne feedback (`feedback.js` og `apps-script.gs`) er
uafhængig af dette og har sit eget ark.

Optageknappen vises kun, når begge dele er opfyldt:

1. `modtager` er sat i `feedback/lyd-config.js`.
2. Siden er åbnet med et afprøvningslink: `…/geografi/luftmasser/?afproevning=KODE`.

Almindelig brug af simulationen mærker intet og spørger aldrig om mikrofonen.

## Delene

| Fil | Hvad den gør |
| --- | --- |
| `feedback/lydfeedback.js` | information, optagelse, aflytning, afsendelse og kvittering. Kan genbruges |
| `geografi/luftmasser/afproevning.js` | hvilke handlinger og hvilken tilstand loggen følger på denne side |
| `feedback/lyd-config.js` | modtagerens adresse |
| `feedback/lyd-apps-script.gs` | modtageren. Hører til i Apps Script, ikke på sitet |

## Opsætning

1. Lav et nyt Google-regneark, fx «smbi.dk lydfeedback». Brug ikke feedback-arket.
2. **Udvidelser → Apps Script.** Slet indholdet af `Kode.gs`, og sæt indholdet af
   `feedback/lyd-apps-script.gs` ind. Skriv evt. din mail i `MAIL_TIL`, og gem.
3. **Implementer → Ny implementering →** tandhjulet **→ Web-app.** Sæt *Kør som* til
   dig selv og *Hvem har adgang* til **Alle**. Godkend adgangen (**Avanceret → Gå til
   … → Tillad**), og kopiér adressen, der ender på `/exec`.
4. Genindlæs arket. Vælg **Lydfeedback → Sæt op** i menuen. Det laver fanerne, den
   private Drive-mappe og den daglige oprydning.
5. Sæt adressen ind som `modtager` i `feedback/lyd-config.js`.
6. Vælg **Lydfeedback → Nyt afprøvningslink** i arket. Linket vises i en boks. Det
   gælder 30 dage og 30 afleveringer. Luk det ved at sætte *Aktiv* til `FALSE` i
   fanen Koder.

Ændrer du senere i scriptet: **Implementer → Administrer implementeringer →** blyanten
**→ Ny version.** Så beholder adressen sit udseende.

## Sådan lytter du

Fanen Afleveringer har én række pr. optagelse med link til lydfilen og til loggen.
Loggen er en tekstfil med tidspunkter, så du kan følge med ved siden af lyden.

## Sletning

Oprydningen flytter filer til papirkurven efter 60 dage, og Google tømmer papirkurven
efter 30. Det giver de højst 90 dage, deltageren får at vide.

Beder nogen om at få slettet en optagelse: Find kvitteringen i fanen Afleveringer, slet
lydfil og log i Drive, tøm dem også fra papirkurven, og slet rækken.

## Grænser

Højst 15 minutter pr. optagelse (sat i browseren) og 20 MB pr. fil, 20 afleveringer i
timen pr. kode, 50 i døgnet i alt og *Maks afleveringer* pr. kode. Tallene håndhæves i
scriptet.

Afsendelsen tager tid: en krop på 6 MB tog cirka 26 sekunder i en prøve, og deltageren
får besked om at vente. Lyden fylder af din Drive-plads, ca. 15 MB pr. time optagelse.

## Test

```bash
node feedback/lyd-apps-script.test.mjs
```

```bash
node værktøj/lydfeedback-test.mjs
```

Scriptet testes mod en falsk Google, og browsertesten bruger syntetisk lyd og en falsk
modtager, fordi headless Chromium hænger ved `getUserMedia`. At svaret fra en rigtig
Apps Script-webapp kan læses i browseren, er prøvet mod den eksisterende feedback-webapp.

## Før funktionen tages i brug

Kan først kontrolleres mod det rigtige script:

- [ ] Rigtig mikrofon i Chrome, Edge, Firefox og Safari, også iPhone: tilladelse, afvisning, aflytning, mikrofonen slukker efter stop.
- [ ] Aflevering fra `smbi.dk` i et privat vindue uden Google-login giver kvittering, og optagelsen kan høres i Drive sammen med en log, der passer med lyden.
- [ ] Mappen og filerne er kun delt med dig, og linkene åbner ikke i et privat vindue.
- [ ] Udløbet kode, kvote og afbrudt forbindelse giver forståelig besked uden kvittering.
- [ ] Køres `ryd` med en gammel række og fil, ryger de i papirkurven.

Skal være afklaret, før andre end du selv optager:

- [ ] Dataansvar og behandlingsgrundlag. Stemmer er personoplysninger, og deltagerne kan være elever.
- [ ] Databehandleraftale og datas placering. En privat Google-konto giver efter alt at dømme hverken aftale eller valg af region. Undersøg, om en Workspace-konto gennem skolen kan bruges, og læg i så fald scriptet dér.
- [ ] Skolernes rolle ved deltagelse, og hvordan frivilligheden sikres, når en lærer beder klassen om det.
- [ ] Teksten i dialogen i `feedback/lydfeedback.js` er gennemgået, og den rummer det, der besluttes.
