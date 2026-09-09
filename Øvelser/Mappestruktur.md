# Mappestruktur for Øvelser (Quarto)

*Opdateret 2026-08-27.*

## Arbejdsgang — vigtigt

**Ret kun i `.qmd`-kilderne. Render ikke automatisk.** Brugeren har bedt om, at ændringer altid nøjes med at rette i Quarto-kilfilerne (`.qmd`, `_quarto.yml` osv.) — ikke selv køre `quarto render` eller generere nye docx/pdf/html-outputs, medmindre der bliver bedt eksplicit om det. Rediger direkte på brugerens Mac via `device_bash` (fx en lille Python-læs-ret-skriv, ikke ved at gengive hele filens indhold fra hukommelsen). De renderede outputs (`index.docx`/`.pdf`/`.html`), der allerede ligger i hver øvelsesmappe, bliver dermed ikke opdateret automatisk efter en rettelse i `.qmd` — de kan blive ude af trit, indtil nogen (bruger eller en fremtidig session, hvis bedt om det) rendering dem igen.

## Beslutning

Vi er gået væk fra at have en separat "Quartro Skabelon"-mappe pr. fag, som hver øvelse skulle ligge inde i. Det var tungt (dobbelt konfiguration for Biologi og Geografi, der let kunne glide fra hinanden) og skabte forvirring om, hvor en øvelse "skulle bo" (jf. episoden hvor `opmaaling-af-terraenprofil` blev flyttet ud af sin skabelonmappe og dermed mistede den fælles styling).

**Model:** Den fælles Quarto-konfiguration ligger som 7 filer direkte i toppen af `Øvelser/`:

```
Øvelser/
├── _quarto.yml
├── styles.scss
├── reference.docx
├── page.typ
├── typst-template.typ
├── banner.html
├── fix-docx-tables.py
├── LÆS-MIG.md / LÆS-MIG.pdf   (forklarer opsætningen)
├── Biologi/
│   ├── osmose-i-kartofler/
│   │   ├── index.qmd
│   │   └── index.docx / .pdf / .html   (renderede outputs)
│   ├── mikroskopi-af-celler/
│   │   ├── index.qmd
│   │   └── index.docx / .pdf / .html   (⚠ pt. ude af trit med index.qmd, se nedenfor)
│   ├── mikroskopi-af-rodceller/
│   │   └── index.qmd   (⚠ endnu ikke renderet — kun .qmd-kilde findes)
│   ├── bakterier-og-svampe/
│   │   └── index.qmd   (⚠ endnu ikke renderet — kun .qmd-kilde findes)
│   ├── dafnier-og-koffein/
│   │   └── index.qmd   (⚠ endnu ikke renderet — kun .qmd-kilde findes)
│   ├── dna-i-kiwi/
│   │   └── index.qmd   (⚠ endnu ikke renderet — kun .qmd-kilde findes)
│   └── bromelin-i-ananas/
│       └── index.qmd   (⚠ endnu ikke renderet — kun .qmd-kilde findes)
└── Geografi/
    └── opmaaling-af-terraenprofil/
        ├── index.qmd
        └── figurer/
```

Fordi Quarto leder opad i mappetræet efter `_quarto.yml`, gælder den fælles styling automatisk for enhver `.qmd`, uanset hvor dybt den ligger under `Biologi/` eller `Geografi/`. Der er ikke længere nogen særlig skabelonmappe, en øvelse skal ligge inde i — bare en almindelig undermappe under det rigtige fag.

Fag-specifik metadata (`hold:`, `fag:`) sættes i den enkelte `.qmd`-fils egen YAML-header, som overskriver projekt-niveauets værdier — så det er ikke nødvendigt med separate `_quarto.yml`-filer pr. fag. Alle biologi-øvelser sætter `fag: "Biologi"` og `hold: ""` (fordi "3g Ng" i roden er Geografi-specifikt).

## Rettet fejl: fag/hold i Word-sidehoved var hardkodet

Da `Osmose i kartofler` blev lavet, viste det sig, at `reference.docx`'s sidehoved/-fod indeholder **statisk tekst** ("NATURGEOGRAFI B" / "3g Ng"), fordi Word (i modsætning til HTML og PDF/Typst) ikke selv kan slå Quarto-metadata som `{{< meta fag >}}` op i sidehovedet. Alle `.docx`-outputs ville derfor altid vise "Naturgeografi B / 3g Ng" i toppen, uanset fag — det var kun HTML (`banner.html`) og PDF (`page.typ`) der reelt var dynamiske.

`fix-docx-tables.py` er udvidet til også at rette dette: efter hver rendering finder scriptet nu den `.qmd`, der hører til hver genereret `.docx`, læser dens `fag`/`hold`/`doc-type` (med fald tilbage til `_quarto.yml`s standardværdier), og indsætter den rigtige tekst i sidehoved og -fod. Testet og verificeret på `osmose-i-kartofler`, `mikroskopi-af-celler` (begge viser "BIOLOGI") og `opmaaling-af-terraenprofil` (viser stadig korrekt "NATURGEOGRAFI B / 3g Ng") — ingen regression.

## Mikroskopi af celler — bevidst afgrænset

Den gamle vejledning havde fire præparater (løg, vandpest, kindskrab, gær) samt formål/teori/hypotese/fejlkilder/konklusion/spørgsmål til journalen og en "Registrering af målinger"-tabel. Efter ønske er den nye version afgrænset til kun **løghinde, vandpest og kindskrab** (gær droppet). Kun kindskrab farves (methylenblåt, det blå farvestof) — løghinde farves slet ikke (observeres direkte, ingen Lugols væske), vandpest farves heller ikke. "Registrering af målinger"-afsnittet (tabel til at notere iagttagelser) er fjernet efter ønske. Da øvelsen stadig bruger methylenblåt og ethanol 70 %, har den (modsat Osmose) et `callout-important`-afsnit om Sikkerhed, som krævet af projektinstruktionerne.

**2026-08-26 — forsøgt tilføjelse af rodspidser, siden rullet tilbage:** Der blev midlertidigt tilføjet et fjerde delforsøg "D. Rodspidser" (squash-præparat med saltsyre og methylenblåt, mitose i rodspidsceller). Ved eftersøgning i `Bio-C-delt-mappe` (alle .docx/.doc/.rtf-filer samt OCR af den store "Mikroskopi vejledning NV-bogen.pdf") viste det sig, at **ingen** af de gamle forsøgsvejledninger nævner rodspidser, saltsyre (i mikroskopi-sammenhæng) eller acetocarmin/orcein — protokollen var altså ikke baseret på brugerens egne, gamle materialer, men på generel biologifaglig praksis. Tilføjelsen blev derfor rullet tilbage fra `mikroskopi-af-celler`, men er efterfølgende genskabt som sin **egen, selvstændige øvelse** `Biologi/mikroskopi-af-rodceller` (squash-præparat af rodspids fra spiret løg, saltsyre 1 M + methylenblåt) — kun `index.qmd` findes endnu, ikke renderet.

**OBS:** `index.docx`/`.pdf`/`.html` for `mikroskopi-af-celler` er stadig **ikke** gen-renderet efter de oprindelige rettelser (Lugols fjernet, Registrering-afsnit fjernet) — jf. arbejdsgangs-reglen ovenfor. De viser stadig en ældre version, indtil der bliver renderet på ny.

## Bakterier og svampe — sammenlagt af Kimfald + Påvisning af bakterier

Denne gruppe af gamle filer (`GAMMEL KIMFALD.doc`, `GAMMEL Påvisning af bakterier.doc`, `NY Øvelse Bakterier og svampe.docx`, samt identiske kopier i `MM_s 1.g-øvelser/`) er lavet til én standardvejledning, `Biologi/bakterier-og-svampe`.

- **Vigtig afklaring:** Brugeren omtalte oprindeligt "Kimfald" som "(frøspiring)" — men de gamle filer handler slet ikke om det. "Kimfald" er her et mikrobiologisk begreb: man sammenligner, hvor mange bakterie- og svampekim (kolonier) der falder ned fra luften pr. m² pr. time, på åbne petriskåle indendørs vs. udendørs. Der findes intet frøspiringsdokument i `Bio-C-delt-mappe` (søgt efter "spir*" — ingen match). Bekræftet med brugeren 2026-08-26, som gik videre med den mikrobiologiske betydning.
- **Sammenlægning:** "GAMMEL KIMFALD.doc" og "MM_s KIMFALD.doc" er indholdsmæssigt identiske; samme gælder de to "Påvisning af bakterier.doc"-filer. "NY Øvelse Bakterier og svampe.docx" havde allerede lagt begge øvelser sammen (5 petriskåle: 3 kødpepton-agar + 2 malt-agar — 2 til kimfald ude, 2 til kimfald inde, 1 til påvisning på genstande som fingeraftryk/mønter/hår). Efter ønske fra brugeren er det denne sammenlagte NY-version, den nye standardvejledning bygger på (samme princip som konsolideringen af `mikroskopi-af-celler`).
- **Indhold:** A) fremstilling af agar-plader (kan springes over, hvis pladerne er færdigstøbte), B) kimfald ude/inde, C) påvisning af bakterier på genstande, D) inkubation i varmeskab ved 37 °C og aflæsning. Et `callout-important`-afsnit om Sikkerhed er medtaget (varm agar, og at plader med mikroorganismer dyrket ved kropstemperatur ikke må åbnes), selvom øvelsen ikke bruger egentlige kemikalier — vurderet nødvendigt pga. de reelle farer ved varme og biologisk materiale.
- Bevidst udeladt (bare bones): "Klassens resultater"-tabellen (sammenligning på tværs af grupper) samt diskussions-/konklusionsspørgsmålene fra de gamle vejledninger — det er arbejdsspørgsmål, som den enkelte lærer selv tilføjer. En simpel registreringstabel til rå data (kolonietal + areal-beregning) er bevaret, ligesom i `osmose-i-kartofler`.
- Kun `index.qmd` er lavet — **ikke renderet** til docx/pdf/html, jf. arbejdsgangs-reglen øverst i dette dokument.

## Dafnier og koffein — de tre "Fagintro"-filer viste sig at være ét forsøg

Brugeren bad om at få lavet "fagintro-dafnieforsøget" (uden at det skulle hedde "fagintro" i den nye vejledning). `Forsogsvejledninger.md` listede gruppe 4 ("Dafnier (koffein/mikroskopi)") som om der potentielt var to forskellige forsøg — ét om koffein og ét om mikroskopi. Efter at have læst alle tre kildefiler (staget og læst 2026-08-27) viste det sig, at de er **samme forsøg**: dafniens hjerterytme observeres i mikroskop, før og efter tilsætning af kaffeopløsninger med stigende koffeinkoncentration. Forskellen mellem filerne er kun mængden af baggrundsstof:

- `Undervisning 2019-2020/Fag-intro/CS materialer/2 - Øvelsesvejledning dafnie koffein v2.docx` (identisk kopi i `Modul 2/`) — mest komplette protokol, med en fuld fortyndingsrække (stamopløsning 600 mg/L halveret trinvist ned til 18,75 mg/L) og eksplicitte formål/hypotese/resultater/fejlkilder/konklusions-prompts.
- `Undervisning 2019-2020/Fag-intro/CS materialer/1 - Dafnier mikroskopi CS.docx .docx` — samme forsøg, men kun med én koffeinkoncentration (ingen fortyndingsrække), efterfulgt af et langt tekststykke om dafniens anatomi, formering og økologiske betydning (baggrundslæsning, ikke en del af selve fremgangsmåden).
- `Undervisning 2021-2022/Fagintro/03 Øvelsesvejledning Dafnier mikroskopi 2021.docx` — samme protokol som v2 (men fremstiller kun stamopløsningen og siger "udvid selv, hvis I ikke ser effekt" i stedet for at foreskrive alle seks koncentrationer), rammet ind som et postermateriale, plus samme baggrundstekst om dafniens økologi.

Bekræftet med brugeren 2026-08-27, at der er tale om ét forsøg i flere udgaver. Den nye standardvejledning, `Biologi/dafnier-og-koffein`, bygger på **v2's fulde fortyndingsrække** (mest metodisk komplet), uden anatomi-/økologi-baggrundsteksten (bare bones — det er baggrundsstof, en lærer selv kan tilføje). Intet `callout-important`-afsnit om Sikkerhed: kaffeopløsningerne er food-grade og ufarlige i disse koncentrationer, samme vurdering som saltvandsopløsningerne i `osmose-i-kartofler`, der heller ikke har et sikkerhedsafsnit. Der er i stedet en `callout-tip` om at skåne dafnien for unødig lys/varme og evt. skifte til en frisk dafnie undervejs.

Kun `index.qmd` er lavet — **ikke renderet** til docx/pdf/html, jf. arbejdsgangs-reglen øverst i dette dokument.

## Bromelin i ananas — enzymforsøg baseret på 2018-versionen

Kildematerialet (`Bio-C-delt-mappe/2 I tykt og tyndt - Kost og sundhed/7 Enzymer Bromelin 2018.docx` og `Bio-C-delt-mappe/MM_s 1.g-øvelser/Enzymer Bromelin.doc`) er to udgaver af samme forsøg: enzymet bromelin fra frisk ananas nedbryder proteinet gelatine (husblas), så det ikke stivner. 2018-versionen er den mest komplette (seks glas: frisk, kogt og syrebehandlet ananassaft, en vand-kontrol samt valgfri kiwi-/appelsinsaft for nogle grupper) og er derfor lagt til grund for den nye standardvejledning, `Biologi/bromelin-i-ananas`, efter samme princip som ved de øvrige konsolideringer.

Bare bones-versionen er afgrænset til det centrale forsøg med **fire glas** (frisk ananas, kogt ananas, ananas + syre, vand-kontrol) — de valgfri kiwi-/appelsin-varianter er i stedet nævnt i en `callout-tip` som en mulig udvidelse, en lærer selv kan vælge at bruge. Bevidst udeladt (bare bones): hypotese-/resultatskemaet med forklarende spørgsmål samt diskussions- og konklusionsspørgsmålene fra begge kildefiler — det er arbejdsspørgsmål, den enkelte lærer selv tilføjer. En simpel registreringstabel (stivnede gelatinen i hvert glas?) er bevaret.

Øvelsen bruger både kogende vand/åben ild og fortyndet saltsyre (til at denaturere enzymet i ét af glassene), så den har et `callout-important`-afsnit om Sikkerhed, som krævet af projektinstruktionerne når der anvendes kemikalier.

Kun `index.qmd` er lavet — **ikke renderet** til docx/pdf/html, jf. arbejdsgangs-reglen øverst i dette dokument.

## Integreret på sitet (2026-09-09)

Alle 15 færdigrenderede øvelser (5 i `Geografi/`, 10 i `Biologi/`) er nu linket
fra `geografi.html` (staken "Forsøgsvejledninger" + Røjle Klint-afleveringen i
"Opgavesæt") og `biologi.html` (ny stak "Forsøgsvejledninger" i sektionen
"Forsøg & øvrigt"). Hvert kort linker til `index.html` og har desuden direkte
`PDF`/`Word`-links til `index.pdf`/`index.docx` i samme mappe.

PDF/Word-download i selve vejledningen kræver ingen ekstra knap — Quarto
lægger allerede en "Andre formater"-boks i margenen på hver renderet
`index.html` (fordi `_quarto.yml` har flere `format:`-mål), med links til
`.pdf` og `.docx`. Den findes i alle 15 filer og er ikke rørt.

**Ikke rørt, men nu "duplikeret":** De to gamle vejledninger i
`GeoVejledninger/konvektionskammer/` og `GeoVejledninger/JordUndersøgelse/`
dækker samme forsøg som de nye `Geografi/konvektionskammer/` og
`Geografi/poroesitet-og-permeabilitet/`. `geografi.html`s "Forsøgsvejledninger"
peger nu på de nye Quarto-versioner i stedet (bedre styling, pdf+word) — de
gamle filer er bevaret på disk (uændrede, stadig tilgængelige på deres url),
men ikke længere linket derfra. `JordUndersøgelse_HF/` (HF-udgaven) har ingen
Quarto-erstatning endnu og er stadig linket som før.

**Samme dag, opfølgning:** `biologi.html`s "Forløb" (Nature vs. Nurture) og
"Spil & overblik" (Cellens Evolution) er fjernet fra siden — de tog en hel
grid-søjle for kun ét kort hver, uden at bidrage noget ved siden af de ti
øvelser. Sektionen er nu én bred "Forsøgsvejledninger"-stak, hvis kort ligger
i et internt gitter (`.stack-items` i `forside.css`) i stedet for én lang
søjle. De to sider er ikke slettet, kun afkoblet fra `biologi.html` — `index.html`
linker stadig til `BiologiC/NatureNurture/` og `CellSpil`.

**Samme dag, endnu en opfølgning:** to `.sub`-links i selve simulerings­kortene
(`TermiskTryk3` og `poroesitetPermeabilitet` i "Under opbygning") var overset
i første omgang og pegede stadig på de gamle `GeoVejledninger`-sider — rettet
til `Øvelser/Geografi/…`.

Alle links til `Geografi/afleveringsopgave-rojle-klint/` er fjernet igen (fra
`geografi.html`s "Opgavesæt" og fra `sitemap.xml`) — mappen skal ud af repoet
og er lagt i `.gitignore` (`Øvelser/Geografi/afleveringsopgave-rojle-klint/`).
Filerne ligger stadig i mappen og er stadig sporet af git indtil de rent
faktisk flyttes/slettes og den ændring committes — `.gitignore` forhindrer
kun *nye* ændringer i at blive foreslået til staging, den fjerner ikke i sig
selv allerede committede filer fra historikken.

`index.html`s egen "Forsøgsvejledninger"-stak (i "Resten af materialet") pegede
stadig på de gamle `GeoVejledninger/`-sider og manglede pdf/word — rettet til
samme konvention som `geografi.html`: link til `Øvelser/Geografi/…/index.html`
plus `PDF`/`Word`-sublinks.

**robots.txt / sitemap.xml:** `Bio-C-delt-mappe/` (rå lærermateriale, ikke
tiltænkt offentligheden) er tilføjet som `Disallow` i `robots.txt` og er
hverken linket fra sitet eller i `sitemap.xml`. De 15 øvelsessider er
tilføjet til `sitemap.xml`.

**Kendt efterslæb:** `Geografi/digital-kystopmaaling-rojle` og
`Geografi/opmaaling-af-terraenprofil` har en `.qmd`, der er nyere end den
renderede `.html` (rettelser efter sidste rendering) — den linkede side
viser stadig den lidt ældre udgave, indtil nogen renderer på ny.

## Kendte åbne punkter

- De gamle, nu overflødige filer (de to "Quartro Skabelon"-mapper, de gamle Osmose- og Mikroskopi-docx/pdf, leverings-zip'er) ligger i `Øvelser/_to_delete/` på brugerens Mac, fordi sletning kræver brugergodkendelse. Brugeren skal selv slette den mappe, når indholdet er tjekket.
- Quarto er ikke installeret på brugerens Mac (kun testet i et cloud-miljø, sidst brugt til at generere de outputs, der nu er lidt bagud ift. `.qmd`-kilderne — se OBS ovenfor). PDF-rendering via Typst kræver desuden netværksadgang for at hente `@preview`-pakker (fx fontawesome) — det fejlede i testmiljøet pga. proxy. Som workaround genereres PDF ved at konvertere den (korrekte) `.docx` med LibreOffice (`soffice --headless --convert-to pdf`), hvilket giver et visuelt identisk resultat, da al styling allerede ligger i `reference.docx`.
- Alle biologi-øvelser indtil videre bruger `callout-note` (blå) til Materialer og `callout-important` (rød) til Sikkerhed, når der er kemikalier eller andre reelle farer (fx varme, biologisk materiale) med — hold den konvention ved fremtidige øvelser. Rent food-grade opløsninger i lave koncentrationer (saltvand, kaffe) har hidtil ikke udløst et sikkerhedsafsnit.
- `mikroskopi-af-rodceller`, `bakterier-og-svampe`, `dafnier-og-koffein` og `bromelin-i-ananas` har kun `index.qmd` — ingen af dem er renderet til docx/pdf/html endnu. Skal renderes, når brugeren beder om det (se arbejdsgangs-reglen øverst).
- Bio-C-delt-mappe (den delte mappe med gamle lærermaterialer) er gennemgået og opsummeret i et separat projektdokument, `claude/Bio-C-forsog-oversigt.md`, som lister kandidater til fremtidige standardiserede vejledninger. Dafnie-koffein-forsøget lå ikke i denne mappe, men i de separate "Fag-intro"/"Fagintro"-mapper — se `Forsogsvejledninger.md`, gruppe 4.
