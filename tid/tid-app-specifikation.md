# Specifikation: Tidsregistreringsapp til gymnasielærer (Fase 1)

## Formål
En privat webapp til at registrere arbejdstid på de aktiviteter, der står i ens opgavefordeling som gymnasielærer. Skal kunne sammenligne forbrugt tid med budget. Fungerer på iPhone (PWA via Safari hjemmeskærm) og desktop. Data synkroniseres mellem enheder via Firebase. Kun én bruger (udvikleren selv).

## Teknologivalg
- Vanilla JavaScript, HTML, CSS — ingen frameworks
- Firebase Firestore som database
- Firebase Authentication med Google sign-in
- Hostes som statiske filer på GitHub Pages
- Progressive Web App (PWA) til iPhone-hjemmeskærm
- Mobile-first design, responsivt

## Filstruktur
```
/tid/
  index.html
  app.js
  styles.css
  firebase-config.js   (Firebase credentials)
  normer.js            (holdnormernes formel)
  akkord.js            (akkordregnskabet: brugt, optjent og saldo)
  rettet.js            (rettede sæt pr. hold)
  manifest.json
  service-worker.js
  icons/
```

## Firebase
Brugeren leverer `firebaseConfig` i `firebase-config.js`. Brug Firebase v10+ modulær SDK via CDN. Aktivér Firestore offline-persistens.

## Centrale begreber

**Aktivitet** = en linje i opgavefordelingen. Enten et hold (med faste arbejdstyper undervisning/forberedelse/retning) eller en opgave (registreres direkte). Hver aktivitet har et timebudget for skoleåret. Opgave-aktiviteter kan have under-aktiviteter (fx SRP under "Eksamen og årsprøver").

**Arbejdstype** = kun relevant for hold. Tre faste: undervisning, forberedelse, retning.

**Tidsregistrering** = en post med start og slut. Knyttes til en aktivitet og — hvis aktiviteten er et hold — også til en arbejdstype.

## Datamodel i Firestore

Alt under `users/{userId}/`:

**`activities/{activityId}`** — Aktiviteter:
```
{
  name: "3g Ng",
  type: "hold" | "opgave",
  parentId: null | "activityId",   // kun for opgave-aktiviteter
  budgetHours: 288,
  color: "#3b82f6",
  schoolYear: "2026/27",
  order: 1,
  isArchived: false,
  note: "",                         // valgfri kommentar fra opgavefordelingen, fx "5 stk"
  normGrundlag: null | {            // kun hold, valgfrit — fra skolens holdoversigt
    aarsnorm: 65,                   // undervisningstimer (klokketimer), påkrævet hvis objektet findes
    elever: 30,
    fordybelsestid: 15,             // elevernes skriftlige tid inkl. terminsprøver
    puljetimer: 0,
    tillaeg: 0,                     // fx 15 til intern NF-eksamen
    antalHold: 1                    // flere ens hold samlet som én aktivitet, fx 3 NV-hold
  },
  rettedeSaet: [                    // kun hold — se *Akkordregnskab*
    { id: "…", dato: "2026-09-20", elevtimer: 2, navn: "Rapport 1" }
  ],
  optjening: "loebende" | "afslutning" | "manuel",   // kun opgaver; mangler = løbende
  fremdrift: null | 40              // kun ved manuel optjening, procent færdig
}
```

Regler:
- Hold må ikke have parentId (ingen hierarki for hold)
- En under-aktivitets `schoolYear` skal matche forælderens
- Har et hold `normGrundlag`, er budgettet og de tre delnormer regnet ud af det (se *Holdnormer*); `budgetHours` gemmes med som et øjebliksbillede, men det er normgrundlaget og skoleårets faktorer, der gælder. Hold uden `normGrundlag` (og alle ældre hold) bruger `budgetHours` som før

**`entries/{entryId}`** — Tidsregistreringer:
```
{
  activityId: "activityId" | null,  // null hvis "udefineret"
  workType: "undervisning" | "forberedelse" | "retning" | null,  // kun ved hold
  startTime: Timestamp,
  endTime: Timestamp | null,        // null = aktiv
  durationMinutes: 90,              // beregnet ved afslutning
  note: "",
  isModule: false,
  autoStopped: false,
  isBreak: false                    // true = kort pause; i rapporten fælles tid
}
```

**`settings/config`** — Indstillinger:
```
{
  schoolYearStartMonth: 8,
  schoolYearStartDay: 1,
  autoStopAfterMinutes: 240,
  autoShortBreaks: true,            // luk mellemrum under 30 min som "Kort pause"
  weekStartsOn: 1,
  currentSchoolYear: "2026/27",    // den aktive der vises som standard
  normFaktorer: {                   // pr. skoleår; mangler et år, bruges 2,35 og 0,9
    "2025/26": { faktor: 2.35, reduktion: 0.9 },
    "2021/22": { faktor: 2.55, reduktion: 0.93 }
  },
  fordelFaellesTid: true            // akkordregnskabet: fordel fælles tid på aktiviteterne
}
```

## Holdnormer
Middelfart Gymnasiums holdoversigt regner et holds vejledende arbejdstid ud som

    budget = (årsnorm × reduktion + elever × fordybelsestid / 27 + puljetimer) × faktor + tillæg

Skolen deler ikke budgettet op, men appen læser formlen som tre normer, én pr. arbejdstype:

- **Undervisning** = årsnorm × reduktion + puljetimer. Reduktionen er en reel nedskæring af timerne: holdet undervises kun i fx 90 % af årsnormen (grunden er ikke oplyst)
- **Forberedelse** = undervisning × (faktor − 1)
- **Retning** = elever × fordybelsestid / 27 × faktor
- **Tillæg** står for sig og har ingen arbejdstype

Er `antalHold` større end 1, ganges alle fire med det. Det bruges til ens hold, der registreres som én aktivitet — fx tre NV-hold (11,25 t, pulje 2,1375, fordybelsestid 0 → 3 × 28,82 = 86,45 t). Tid registreret uden arbejdstype på et hold med normer (fx fra før en opgave blev lavet om til hold) står i rapporten som "Uden arbejdstype" og tæller med i holdets total.

Tillægget tælles ikke med i akkordregnskabet: eksamen og årsprøve oprettes som opgaver for sig, i det skoleår de betales (se *Akkordregnskab*).

Formlen ligger ét sted, i `normer.js`. Kontrolleret mod holdoversigten 2025/26 (faktor 2,35, reduktion 0,9): 2x bi 176,64, 1p nf ge 200,36, nv4 ng 28,82 og 3g Ng1 325,30 — alle på decimalen.

## Forudefinerede aktiviteter
Ingen aktiviteter oprettes automatisk. Ved første login vises en "kom-i-gang"-side hvor brugeren bliver bedt om at oprette sine første aktiviteter (eller indstillinger), inden hovedskærmen vises. Vis evt. en eksempel-liste baseret på en typisk opgavefordeling.

## Arbejdstyper for hold
Faste tre, kan ikke ændres:
- Undervisning
- Forberedelse
- Retning

## Funktionalitet — Fase 1

### 1. Login + first-run
- Ved første besøg: "Log ind med Google"-knap
- Efter login, hvis brugeren ikke har nogen aktiviteter endnu: vis onboarding hvor de opretter første aktiviteter og indstillinger
- Log ud-knap i indstillinger

### 2. Hovedskærm

**Øverst — Aktiv timer (hvis nogen kører):**
- Aktivitet, evt. arbejdstype, forløbet tid (opdateres hvert sekund)
- "Stop"-knap

**Hurtig-start:**
- Knapper for de mest brugte aktiviteter (mest brugte øverst, baseret på de seneste 30 dage; fald tilbage til `order`-felt)
- Tryk på en hold-aktivitet → spørg hvilken arbejdstype (undervisning/forberedelse/retning) → start timer
- Tryk på en opgave-aktivitet → start timer direkte
- Tryk på en parent-aktivitet → vælg child eller "generelt" (registreret på parent)
- Hvis en timer kører: stoppes automatisk, ny starter (intet popup)

**Specialknapper:**
- **"Start arbejde"** — starter udefineret registrering (activityId: null). Brugeren kan senere redigere posten og knytte den til en aktivitet.
- **"1 modul"** — kun for hold-aktiviteter. Spørg hvilket hold + "Hvornår startede modulet?" (Nu / For 95 min siden / Andet tidspunkt). Hvis "Nu": opret aktiv timer med automatisk slut 95 min senere. Modulets længde hentes fra skemaet i `skema.js` (altid 95 min, 5 min pause medregnet) — der er ingen indstilling for den. Hvis bagudrettet: opret færdig post.
- **"Rettet sæt"** — registrerer, at et sæt er rettet færdigt: hold, elevtimer (fordybelsestid pr. elev, typisk 1–4, med hurtigvalg), dato (i dag som standard) og evt. navn. Arket viser, hvad sættet optjener. Se *Akkordregnskab*

### 3. Skift mellem aktiviteter
Tryk på en anden aktivitet mens en timer kører:
- Aktive post afsluttes med nuværende tidspunkt
- Ny post starter umiddelbart efter
- Subtil toast som bekræftelse

### 4. Auto-pause
- Timer der kører over 240 min (konfigurerbar): stop automatisk, marker `autoStopped: true`
- Vis advarsel næste gang appen åbnes

### 4a. Opstart
Appen venter kun på ét opslag, før skærmen er fri: indstillingerne, som de øvrige views har brug for til `getCurrentSchoolYear()`. Alt andet kommer ind gennem lyttere, der fylder skærmen ud, efterhånden som svarene lander. Onboarding hænger på aktivitetslytteren, der alligevel kører, i stedet for et ekstra opslag, og aktivitetssidens forbrugstal — hele brugerens historik — hentes først, når den side åbnes. `<head>` fortæller browseren med `preconnect` og `modulepreload`, hvad den skal bruge, så Firebase og appens moduler ikke først opdages, når `app.js` er hentet og læst.

### 5. Historik
Egen side med to visninger, der skiftes med en fane øverst:

**Liste** — alle registreringer, nyeste først. Filter på dato-interval og aktivitet. Hver post kan redigeres (start, slut, aktivitet, arbejdstype, note) eller slettes. Manuel oprettelse af post bagud eller frem i tiden. Formularen har to rækker hurtigvalg: skemaets moduler og frokostpausen, der sætter både start og slut, og faste varigheder (10, 20, 40 og 60 min), der lader starten stå og kun regner sluttiden ud. Begge fremhæver det valg, tidsfelterne svarer til — også når tiderne kommer fra kalenderen eller er skrevet i hånden.

**Kalender** — fire visninger (Dag, Uge, Måned, År), der alle bladrer frem og tilbage med de samme pile, så man kan se i går og forgårs, ugen før eller sidste september og ikke kun den periode, man står i. Skifter man visning, følger datoen med: står man i uge 34 og trykker "Måned", lander man i den måned, uge 34 ligger i — med mindre perioden rummer i dag, og så er det i dag, der følger med. Datofeltet springer til en dato i den visning, man står i, og chippen fører tilbage til nu.

**Dag** — én dag ad gangen på en lodret tidsakse (1 time = 48 px). Overlappende registreringer fordeles på kolonner ved siden af hinanden, så alle er synlige. Uregistreret tid er tom plads på aksen; tryk et vilkårligt sted opretter en post fra det tidspunkt (afrundet til 15 min). Trykker man lige under en registrering — inden for et kvarter fra dens slutning, eller hvor afrundingen ville lande inde i blokken ovenover — begynder den nye post præcis dér, hvor den forrige slap, så et modul der slutter 11:35 ikke efterlader et hul. Igangværende registrering løber til "nu" og vises skraveret, og en rød streg markerer det aktuelle tidspunkt. Registreringer hen over midnat klippes ved døgnskiftet og markeres med prikket kant. Korte pauser vises som dæmpede, stiplede blokke og holdes uden for dagens total, der i stedet får et lille "· 25m pause" ved siden af.

**Uge** — den samme tidsakse med syv kolonner, én pr. dag, der deler ét fælles tidsvindue, så dagene kan sammenlignes. Aksen er smallere (34 px) og timen lavere (40 px), så alle syv dage er på en telefonskærm; er skærmen for smal, ruller ugen vandret for sig selv. Hver dags hoved viser ugedag, dato og dagens total og fører til dagsvisningen. Tryk på tom plads opretter en post på den dag.

**Måned** — et månedsgitter med en række pr. uge. Hver dag er et felt, hvis farve bliver kraftigere med tiden i det (skaleret efter månedens travleste dag), med dagens tal og en tynd stribe i aktiviteternes farver. Ugenummeret i venstre kolonne viser ugens total og fører til ugevisningen; en dag fører til dagsvisningen.

**År** — hele skoleåret med én række pr. måned og ét felt pr. dag, farvet efter dagens tid, så travle perioder, ferier og eksamenstid træder frem som mønstre. Til højre står månedens total med en streg, der måler den mod årets travleste måned. En måned fører til månedsvisningen.

Under måneds- og årsvisningen står periodens fordeling på aktiviteter som én opdelt stribe med signaturforklaring og tal.

### 5a. Registrering frem i tiden
Tid må gerne lægges ind, før den er brugt — fx et modul, man ved man skal holde. Både formularen, kalenderen og "1 modul" tager imod tidspunkter frem i tiden, og arket viser en OBS-linje: *Du registrerer i fremtiden*. En post i fremtiden skal have en sluttid; uden en ville den blive oprettet som en igangværende timer, der først startede senere. Periodefiltrene i Historik og Rapporter har derfor både en start og en ende, så planlagt tid i næste uge ikke tælles med under "I dag".

### 5b. Korte pauser
Et mellemrum på under 30 minutter mellem to registreringer er sjældent glemt tid — det er pausen mellem to moduler eller frokosten. Når en ny post oprettes, lukkes et sådant mellemrum automatisk med en pause-post (`isBreak: true`, ingen aktivitet). Længere mellemrum lades i fred. Pauser er almindelige poster, der kan redigeres og slettes, og i rapporten tæller de som fælles tid, ligesom ubundet tid — i den samlede tid, i akkordregnskabet og i CSV-eksporten, men på deres egen linje. Kalenderen holder dem stadig uden for dagens total. Kan slås fra med `autoShortBreaks` under Indstillinger → Pauser.

### 6. Rapporter
Egen side. Vælg intervallets længde:
- Dag
- Uge
- Måned
- Skoleår

Intervallet bladres frem og tilbage med pile, så rapporten lige så gerne viser i går, uge 34 eller sidste skoleår som den periode, man står i. Chippen under pilene fører tilbage til nu, og skifter man længde, følger datoen med efter samme regel som i kalenderen. Kun den valgte periodes registreringer hentes, så der er ingen grænse for, hvor langt tilbage man kan se; aktiviteterne, der vises, er dem fra det skoleår, perioden ligger i.

Vis for valgte interval:
- **Samlet:** Total tid forbrugt, og hvis skoleår er valgt: forbrugt / norm (1650t for fuldtid — konfigurerbart i indstillinger). Procent og resterende.
- **Pr. aktivitet:** Liste sorteret efter forbrug. For hver aktivitet: navn, forbrugt tid, budget, procent (fx "142t / 288t — 49%"), visuel progress bar i aktivitetens farve. Under-aktiviteter vises indrykket under deres parent. Parent viser eget forbrug + summen af children.
- **For hold-aktiviteter:** Vis fordeling på undervisning / forberedelse / retning som en lille bar eller tal-række. Har holdet et normgrundlag, og er skoleår valgt, vises hver arbejdstype i stedet med akkorden: undervisningen i moduler (*10 af 36,9 moduler*), forberedelse og retning som brugt og optjent mod normen med en saldochip. Bjælken er brugt mod norm, og en blækstreg i den markerer det optjente. Retningen viser også *rettet 5 af 15 elevtimer*. Dag, uge og måned viser kun fordelingen, fordi normerne gælder hele året.
- **Realiseret faktor (alle hold, alle perioder):** holdets tid målt med skolens mål. *Forberedelsesfaktor* = (undervisning + forberedelse) / undervisning mod skoleårets faktor (fx 2,35). *Retning* i minutter pr. elev pr. fordybelsestime mod faktor / 27 × 60 (fx 5,2 min); måles mod de rettede sæt, der er afsluttet i perioden: tiden brugt på retning ÷ (elevtimer × elever). Har holdet ingen sæt, skønnes den rettede fordybelsestid ud fra den andel af årets undervisningsnorm, der er registreret, og tallet mærkes *skønnet*; har holdet sæt, men ingen i perioden, vises retningen ikke. Forberedelsesfaktoren kræver kun skoleårets faktor og vises på alle hold med registreret undervisning; retningen kræver et normgrundlag med elever og fordybelsestid.
- **Forventet vs faktisk:** Hvis vi er X% gennem skoleåret, vis om man er foran/bagud på samlet niveau (lille indikator). Et afsluttet skoleår sammenlignes med hele normen — der står "over/under norm" i stedet for "foran/bagud skema". Det er timeløns-tallet; akkordregnskabet står under det.
- **Akkordregnskab (kun skoleår):** se *Akkordregnskab* nedenfor.
- **Fælles tid:** ubundet tid og pauser står samlet nederst i listen, hver for sig. I skoleåret kommer opgaver uden budget med.
- Simpel cirkel- eller søjlediagram af aktivitets-fordeling (lav i SVG, intet bibliotek).

### 7. Administration af aktiviteter
Egen side "Aktiviteter":
- Listet grupperet efter type (Hold / Opgaver) og skoleår
- Skift mellem skoleår (dropdown)
- Knap "Ny aktivitet": navn, type, parent (hvis opgave), budget, farve, skoleår, note. Hold kan desuden få et normgrundlag (årsnorm, elever, fordybelsestid, puljetimer, tillæg); er årsnormen udfyldt, regnes budgettet ud og kan ikke skrives i hånden, og udregningen vises under felterne
- Opgaver har en optjeningsmåde: *Løbende*, *Ved afslutning* eller *Manuelt* (med et felt for procent færdig) — se *Akkordregnskab*
- Et gemt hold viser sine rettede sæt med dato, navn og elevtimer og summen mod normen (*Rettet 5 af 15 elevtimer*). Et sæt slettes med krydset og registreres igen, hvis det er tastet forkert
- Tryk på en aktivitet: redigér eller slet. En aktivitet uden forælder og uden under-aktiviteter kan skifte type (opgave ↔ hold); dens registreringer følger med
- Under-aktiviteter vises indrykket under deres parent
- **"Kopiér til næste skoleår"** — opretter samme struktur i et nyt skoleår (uden tidsdata, kun selve aktiviteterne; rettede sæt og fremdrift følger ikke med) — gør det nemt når et nyt skoleår begynder
- **"Importer fra tekst"** — simpel tekstindtaster: en linje pr. aktivitet i format `navn; type; budget; parent?` der parses og oprettes. Sparer tid ved opsætning.

### 8. CSV-eksport
Knap "Eksportér" i rapporter:
- Eksportér aktuelt interval
- Format: `dato;starttid;sluttid;varighed_minutter;aktivitet;arbejdstype;note`
- Korte pauser er med, med aktiviteten "Kort pause"
- Semikolon (dansk Excel)
- Filnavn: `tidsregistrering-{periode}.csv` — fx `tidsregistrering-uge-34-2026.csv` eller `tidsregistrering-2026-09-01.csv`

Knap "Eksportér alle data" i indstillinger — komplet JSON backup.

### 9. Indstillinger
Egen side:
- Skoleår: aktivt skoleår, startmåned, startdag, samlet norm-timetal (default 1650)
- Holdnormer for det aktive skoleår: forberedelsesfaktor (default 2,35) og reduktion af årsnormen (default 0,9)
- Auto-stop-grænse
- Ugestart
- Log ud
- Eksport af alle data (JSON)
- Feedback: knappen fra `/feedback.js` står her (via `data-feedback-vaert`) og ikke som svævende knap, der ville dække bundmenuen

### 10. Akkordregnskab
Læreren er både timelønnet (normen, 1650 t) og akkordlønnet (hver linje i opgavefordelingen er et budget, der betales, uanset hvor lang tid arbejdet tager). Skoleårs-rapporten viser derfor ud over den samlede tid mod normen også, hvor meget af akkorderne der er leveret.

**Tre tal og en saldo** — alle for hele skoleåret:

| Tal | Betyder |
|---|---|
| Brugt | den registrerede tid, fælles tid medregnet |
| Optjent | den del af budgetterne, der er leveret indtil nu |
| Akkord i alt | summen af budgetterne (holdenes uden tillæg) |

**Saldo = optjent − brugt.** Plus betyder, at arbejdet har taget mindre tid, end det betales med. Saldoen står stort i sammendraget med fortegn (og grøn/rød som gentagelse), under den en bjælke for leveret andel af akkorden med en streg for, hvor langt året er nået. Chippen "foran/bagud skema" over den er uændret.

**Hold med normgrundlag** optjener pr. arbejdstype:

- *Undervisning* = registreret undervisning, højst normen. Tælles i moduler à 95 min (normens klokketimer × 60 / 95). Mere undervisning end normen tæller som brugt og giver en neutral besked (*2 moduler over normen*); mindre er normalt (sygedage, omsorgsdage) og giver ingen besked
- *Forberedelse* = den undervist andel af undervisningsnormen × forberedelsesnormen, altså (faktor − 1) time pr. undervist time — 2 t 8 min pr. modul med faktor 2,35
- *Retning* = rettede elevtimer × elever / 27 × faktor, højst normen. Retteakkorden er fordybelsestid × antal hold elevtimer (fx 15)
- *Tillæg* tælles ikke; holdet viser en note om at oprette eksamen som opgave

Hold uden normgrundlag optjener deres budget løbende.

**Rettede sæt** registreres for sig selv med knappen "Rettet sæt" på Hjem — ikke sammen med retningstiden. Læreren skriver de elevtimer, opgaven dækker pr. elev; appen ganger med holdets elevtal. Det, der var rettet, før appen kom i brug, lægges ind på samme måde med en tidligere dato. Sættene gemmes på holdet (`rettedeSaet`).

**Opgaver** optjener efter `optjening`:

- *Løbende* (standard): budgettet jævnt over året — udvalg, teamledelse
- *Ved afslutning*: intet, til opgaven afsluttes med "Afslut opgave" — eksamen, SRP
- *Manuelt*: `fremdrift` procent af budgettet

En afsluttet opgave har altid optjent hele budgettet. Eksamen er en almindelig opgave i det skoleår, den betales — typisk året efter, holdet har kørt.

**Under-opgaver.** En under-opgave med eget budget er sin egen akkord; en uden budget hører under forælderens, og dens tid regnes med dér. Forælderens egen akkord er dens budget minus børnenes. I rapporten står en opgave og dens aktive under-opgaver lagt sammen på opgavens række.

**Fælles tid** er ubundet tid, korte pauser og tid på opgaver uden budget (de regnes med her, til de får et budget). Den tæller som brugt. Et flueben i sammendraget, *Fordel fælles tid på aktiviteterne* (`fordelFaellesTid`, standard til), bestemmer, hvor den står:

- **Til:** fordeles på alle aktiviteter med budget — hold og opgaver, afsluttede med — vægtet efter hele årets budget, så tallene ikke springer, når en opgave afsluttes. Hver aktivitet viser sin andel som *Fælles* og har den med i sin saldo. Fælles-rækken viser kun fordelingen
- **Fra:** fælles-rækken står for sig med optjent 0 og sin egen negative saldo; aktiviteternes saldi er kun deres egen tid

Den samlede saldo er den samme begge veje. Regningen ligger i `akkord.js`; tid på aktiviteter fra et andet skoleår tælles ikke med, ligesom i rapportens samlede tid.

## UI-design

**Navigation:** Bundnavigation med 5 ikoner:
1. Hjem (timer + hurtig-start)
2. Historik
3. Rapporter
4. Aktiviteter
5. Indstillinger

**Visuelt:**
- Sidens design (`design_rules.md`): papirfarvet baggrund, sorte blækrammer,
  hårde skygger, regnbuestribe og de tre skrifter. Appens accentfarve er
  `--teal`. Tokens ligger i `styles.css` selv, så appen virker offline.
- Appen har sin egen smalle topbjælke — regnbuestribe, brandmærke og aktivt
  skoleår — i stedet for sidens store topbjælke. Vejledningssiderne
  (`hjaelp.html`, `installer.html`) har til gengæld det almindelige krom.
- Mobile-first, store touch-targets (min 44x44 pt)
- Dansk overalt, og enheder skrevet som de staves (`t`, `min`) — også inde i
  versale mono-mærkater
- Tydelig markør når timer kører (pulsende prik / farvet header)
- Hver aktivitet har en farve; brug den konsekvent i lister, knapper, diagrammer

## PWA
- `manifest.json` med navn "Tid", short_name "Tid", display: standalone
- Service worker cacher hele app-shellen i **én cache med ét versionsnavn**, og alt — også selve siden — serveres derfra. Så stammer det, brugeren får, altid fra samme udgave, og en opstart med varm cache koster ingen netværkstur. (Blandingen af netværk til siden og cache til resten var netop dét, der gav ny markup med gammel kode; ren netværks-først løste det, men kostede en netværkstur pr. fil ved hver opstart.) Nye udgaver kommer ind ved, at browseren henter `service-worker.js` igen: den nye version fylder sin egen cache under `install` med `cache:'reload'`, så browserens HTTP-cache ikke kan smugle gamle filer med, overtager styringen, og appen henter sig selv igen én gang
- Apple touch icons
- `apple-mobile-web-app-capable` meta-tags

## Tekniske detaljer
- Tidszone: Europe/Copenhagen
- Datoformat: DD-MM-YYYY hvor relevant; ellers dansk format
- Tidsformat: 24-timers
- Varighed: "1t 23m" / "23m" / "2t"
- Skoleår: hvis startmåned er 6 (juni), så er "2026/27" = 1. juni 2026 til 31. maj 2027
- Når et hold-aktivitet ikke har specificeret en farve: auto-tildel fra en defineret palet

## Hierarki-håndtering — vigtige regler
- Når man registrerer tid på en under-aktivitet (fx SRP), bidrager tiden også til forælderens samlede forbrug
- Forælderens budget er det totale (inkluderer børnenes "underbudgetter"). Børnenes budgetter må gerne summere til mindre end forælderens — restbudgettet er "general parent time"
- Ved sletning af en parent: spørg om børnene skal slettes eller forfremmes til top-niveau

## Hvad vi IKKE laver i fase 1
- Klasse/hold-specifikke under-aktiviteter (kun opgaver kan have børn)
- Push-notifikationer
- Helligdage / skoleferier
- Skoleuge-nummerering
- Detaljerede prognoser ("med dit nuværende tempo når du X timer")
- Tags ud over selve aktiviteten

## Testkriterier
Appen virker når:
1. Bruger logger ind med Google
2. Bruger opretter første aktiviteter via onboarding
3. Bruger trykker hold "3g Ng" → vælger arbejdstype "Undervisning" → timer starter
4. Bruger trykker "Miljøudvalg" → forrige timer stopper, ny starter
5. Bruger trykker "1 modul" → vælger hold → 95 min registreres
6. Bruger stopper timer
7. Bruger ser dagens og ugens fordeling
8. Bruger ser skoleårets fordeling med forbrugt vs budget pr. aktivitet
9. Bruger ser at SRP-tid også tæller med på parent "Eksamen og årsprøver"
10. Bruger eksporterer CSV
11. Bruger redigerer en post og knytter den til en aktivitet
12. Bruger opretter ny aktivitet med budget
13. Bruger kopierer aktiviteter til næste skoleår
14. Appen installeres som PWA på iPhone
15. Data synkroniseres mellem to enheder

## Implementeringsrækkefølge
1. Projektstruktur, `firebase-config.js` med placeholder
2. Login-flow + first-run onboarding
3. Datamodel + CRUD for aktiviteter (Aktiviteter-skærm)
4. Hovedskærm med timer-funktionalitet (start, stop, skift)
5. "1 modul" og "Start arbejde" specialknapper
6. Historik med redigering og manuel oprettelse
7. Rapporter med budget-sammenligning og hierarki-aggregering
8. CSV-eksport
9. Indstillinger
10. PWA-opsætning + iOS-optimeringer
11. Auto-pause og advarsler

Spørg, hvis noget er uklart, før du begynder at kode.

---

## Sådan bruger du specifikationen i Claude Code

Når du åbner Claude Code i `/tid/`-mappen, kan du starte med noget i stil med:

> *"Læs hele specifikationen nedenfor. Stil opklarende spørgsmål før du begynder at kode. Lad os tage det i den implementeringsrækkefølge der står til sidst — vi tager ét trin ad gangen, og du må gerne vise mig hvad du har bygget løbende. Begynd med trin 1."*
