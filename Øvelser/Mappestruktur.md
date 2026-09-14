# Mappestruktur for Øvelser (Quarto)

*Opdateret 2026-09-14.*

## Arbejdsgang — vigtigt

**Ret i `.qmd`-kilderne — og rendér bagefter.** Rettelser laves i Quarto-kilderne
(`.qmd`, `_quarto.yml`, `styles.scss` osv.), og derefter renderes de berørte
vejledninger med det samme, så `.pdf`, `.docx` og `.html` i øvelsesmappen altid
svarer til kilden:

```bash
cd Øvelser/<Fag>/<øvelse>
quarto render <øvelse>.qmd --to typst   # PDF
quarto render <øvelse>.qmd --to docx    # Word
quarto render <øvelse>.qmd --to html    # webside
```

`fix-docx-tables.py` kører selv efter hver docx-rendering og retter sidehovedet
(fag/hold) og tabeller, der ellers ville blive delt af et sideskift. Rettes en
`.qmd` i en mappe, hvor der allerede ligger outputs, skal alle tre formater
renderes igen — ikke kun det ene. Det samme gælder de `.md`-dokumenter her i
`Øvelser/`, der har renderede udgaver ved siden af (`LÆS-MIG`, `Mappestruktur`,
`Bio-C-forsog-oversigt`, `Forsogsvejledninger`).

*Ændret 2026-09-13 efter ønske fra brugeren. Tidligere var reglen den modsatte —
at der aldrig måtte renderes uden eksplicit besked — og derfor står der flere
steder nedenfor, at noget "ikke er renderet endnu". Det er nu indhentet: alle
øvelsesmapper har både `.pdf`, `.docx` og `.html`, der svarer til deres `.qmd`.*

## Fast indhold i en vejledning (ændret 2026-09-14)

Hver vejledning skal ud over `## Fremgangsmåde`, materialeboksen, et evt.
sikkerhedsafsnit og registreringsskemaet indeholde **to faste afsnit**:

**`## Databehandling`** — de beregninger, grafer og den resultatbehandling,
eleverne selv skal lave ud fra deres rådata. Nummereret liste; formler skrives
som rigtig matematik (`$$…$$`), og skal de udregnede tal samles, får de deres
eget skema ved siden af rådataskemaet. Krydshenvis til tabellerne med `@tbl-1`
osv. Afsnittet udelades **kun**, hvis øvelsen er rent kvalitativ og der ikke er
tal at regne på (fx ren mikroskopi) — det svarer til `data:'ejnoedvendig'` i
`oversigt.html`.

**`## Journalspørgsmål`** — nummererede forslag til faglige
refleksionsspørgsmål, der binder resultaterne sammen med teorien: begreber, der
skal forklares, metodens repræsentativitet, fejlkilder, sammenligning med andre
grupper eller andre situationer. Det er forslag, den enkelte lærer kan skære i
eller bytte ud — ikke en facitliste, og ikke spørgsmål med ét rigtigt svar
hentet direkte fra teksten.

`Biologi/biodiversitet-i-graesplaenen/` er forlæg for begge afsnit.

**Dette ophæver «bare bones»-afgrænsningen** flere steder nedenfor, hvor
databehandling, diskussions- og konklusionsspørgsmål blev udeladt med den
begrundelse, at det var arbejdsspørgsmål, læreren selv tilføjede
(`bakterier-og-svampe`, `bromelin-i-ananas`, `dafnier-og-koffein`,
`vitalkapacitet` m.fl.). De afsnit står som historik over, hvad der dengang
blev besluttet — reglen er nu den modsatte. Rettes en af de gamle vejledninger,
skal den have begge afsnit med.

## Hver øvelse har et kort på fagforsiden

Enhver mappe under `Øvelser/Biologi/` og `Øvelser/Geografi/` skal have **ét
kort** i staken «Forsøgsvejledninger» på henholdsvis `biologi.html` og
`geografi.html`. En ny øvelse er ikke færdig, før kortet er der.

Kortet står alfabetisk blandt de andre og følger samme markup som naboerne: en
`.item` med `data-sog` (søgeord i små bogstaver, inkl. `pdf word`), `<h4>` med
link til `…/<øvelse>.html`, en enkelt sætning om hvad man gør, `<span
class="fag">Forsøg</span>` og en `.sub` med `PDF`- og `Word`-links. Har øvelsen
en simulering på sitet, kommer den med som et ekstra `.sub`-link.

Tre ting følger med hver gang: tælleren i stak-hovedet
(`<h3>Forsøgsvejledninger</h3><span class="n">…</span>`), rækken i
`oversigt.html` og url'en i `sitemap.xml`.

## `oversigt.html` opdateres altid

`oversigt.html` er den interne oversigt og skal opdateres, hver gang en
vejledning laves eller rettes — ikke kun når en ny mappe kommer til. Det
omfatter rækken selv (`quarto`, `data`, `spg`, `note`, emne og sti til
originalen), tællerne og listen «Det der mangler» længere nede på siden.
Værdierne er `'ja' | 'delvis' | 'nej' | 'ejnoedvendig' | 'ukendt'`, og
signaturforklaringen på siden siger, hvornår hver enkelt bruges.

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
│   │   ├── osmose-i-kartofler.qmd
│   │   └── osmose-i-kartofler.docx / .pdf / .html   (renderede outputs)
│   ├── mikroskopi-af-celler/
│   │   └── mikroskopi-af-celler.qmd + .docx / .pdf / .html
│   └── …                                (én mappe pr. øvelse, samme mønster)
└── Geografi/
    └── opmaaling-af-terraenprofil/
        ├── opmaaling-af-terraenprofil.qmd
        ├── opmaaling-af-terraenprofil.docx / .pdf / .html
        └── figurer/
```

**Filnavnet er mappens navn — ikke `index`.** Se afsnittet nederst
(2026-09-11); en downloadet vejledning skal hedde noget, eleven kan kende
igen på skrivebordet.

Fordi Quarto leder opad i mappetræet efter `_quarto.yml`, gælder den fælles styling automatisk for enhver `.qmd`, uanset hvor dybt den ligger under `Biologi/` eller `Geografi/`. Der er ikke længere nogen særlig skabelonmappe, en øvelse skal ligge inde i — bare en almindelig undermappe under det rigtige fag.

Fag-specifik metadata (`hold:`, `fag:`) sættes i den enkelte `.qmd`-fils egen YAML-header, som overskriver projekt-niveauets værdier — så det er ikke nødvendigt med separate `_quarto.yml`-filer pr. fag. Alle biologi-øvelser sætter `fag: "Biologi"` og `hold: ""` (fordi "3g Ng" i roden er Geografi-specifikt).

## Rettet fejl: fag/hold i Word-sidehoved var hardkodet

Da `Osmose i kartofler` blev lavet, viste det sig, at `reference.docx`'s sidehoved/-fod indeholder **statisk tekst** ("NATURGEOGRAFI B" / "3g Ng"), fordi Word (i modsætning til HTML og PDF/Typst) ikke selv kan slå Quarto-metadata som `{{< meta fag >}}` op i sidehovedet. Alle `.docx`-outputs ville derfor altid vise "Naturgeografi B / 3g Ng" i toppen, uanset fag — det var kun HTML (`banner.html`) og PDF (`page.typ`) der reelt var dynamiske.

`fix-docx-tables.py` er udvidet til også at rette dette: efter hver rendering finder scriptet nu den `.qmd`, der hører til hver genereret `.docx`, læser dens `fag`/`hold`/`doc-type` (med fald tilbage til `_quarto.yml`s standardværdier), og indsætter den rigtige tekst i sidehoved og -fod. Testet og verificeret på `osmose-i-kartofler`, `mikroskopi-af-celler` (begge viser "BIOLOGI") og `opmaaling-af-terraenprofil` (viser stadig korrekt "NATURGEOGRAFI B / 3g Ng") — ingen regression.

## Mikroskopi af celler — bevidst afgrænset

Den gamle vejledning havde fire præparater (løg, vandpest, kindskrab, gær) samt formål/teori/hypotese/fejlkilder/konklusion/spørgsmål til journalen og en "Registrering af målinger"-tabel. Efter ønske er den nye version afgrænset til kun **løghinde, vandpest og kindskrab** (gær droppet). Kun kindskrab farves (methylenblåt, det blå farvestof) — løghinde farves slet ikke (observeres direkte, ingen Lugols væske), vandpest farves heller ikke. "Registrering af målinger"-afsnittet (tabel til at notere iagttagelser) er fjernet efter ønske. Da øvelsen stadig bruger methylenblåt og ethanol 70 %, har den (modsat Osmose) et `callout-important`-afsnit om Sikkerhed, som krævet af projektinstruktionerne.

**2026-08-26 — forsøgt tilføjelse af rodspidser, siden rullet tilbage:** Der blev midlertidigt tilføjet et fjerde delforsøg "D. Rodspidser" (squash-præparat med saltsyre og methylenblåt, mitose i rodspidsceller). Ved eftersøgning i `Bio-C-delt-mappe` (alle .docx/.doc/.rtf-filer samt OCR af den store "Mikroskopi vejledning NV-bogen.pdf") viste det sig, at **ingen** af de gamle forsøgsvejledninger nævner rodspidser, saltsyre (i mikroskopi-sammenhæng) eller acetocarmin/orcein — protokollen var altså ikke baseret på brugerens egne, gamle materialer, men på generel biologifaglig praksis. Tilføjelsen blev derfor rullet tilbage fra `mikroskopi-af-celler`, men er efterfølgende genskabt som sin **egen, selvstændige øvelse** `Biologi/mikroskopi-af-rodceller` (squash-præparat af rodspids fra spiret løg, saltsyre 1 M + methylenblåt).

**Renderet:** `mikroskopi-af-celler` er siden renderet igen, så docx/pdf/html svarer til den afgrænsede udgave.

## Bakterier og svampe — sammenlagt af Kimfald + Påvisning af bakterier

Denne gruppe af gamle filer (`GAMMEL KIMFALD.doc`, `GAMMEL Påvisning af bakterier.doc`, `NY Øvelse Bakterier og svampe.docx`, samt identiske kopier i `MM_s 1.g-øvelser/`) er lavet til én standardvejledning, `Biologi/bakterier-og-svampe`.

- **Vigtig afklaring:** Brugeren omtalte oprindeligt "Kimfald" som "(frøspiring)" — men de gamle filer handler slet ikke om det. "Kimfald" er her et mikrobiologisk begreb: man sammenligner, hvor mange bakterie- og svampekim (kolonier) der falder ned fra luften pr. m² pr. time, på åbne petriskåle indendørs vs. udendørs. Der findes intet frøspiringsdokument i `Bio-C-delt-mappe` (søgt efter "spir*" — ingen match). Bekræftet med brugeren 2026-08-26, som gik videre med den mikrobiologiske betydning.
- **Sammenlægning:** "GAMMEL KIMFALD.doc" og "MM_s KIMFALD.doc" er indholdsmæssigt identiske; samme gælder de to "Påvisning af bakterier.doc"-filer. "NY Øvelse Bakterier og svampe.docx" havde allerede lagt begge øvelser sammen (5 petriskåle: 3 kødpepton-agar + 2 malt-agar — 2 til kimfald ude, 2 til kimfald inde, 1 til påvisning på genstande som fingeraftryk/mønter/hår). Efter ønske fra brugeren er det denne sammenlagte NY-version, den nye standardvejledning bygger på (samme princip som konsolideringen af `mikroskopi-af-celler`).
- **Indhold:** A) fremstilling af agar-plader (kan springes over, hvis pladerne er færdigstøbte), B) kimfald ude/inde, C) påvisning af bakterier på genstande, D) inkubation i varmeskab ved 37 °C og aflæsning. Et `callout-important`-afsnit om Sikkerhed er medtaget (varm agar, og at plader med mikroorganismer dyrket ved kropstemperatur ikke må åbnes), selvom øvelsen ikke bruger egentlige kemikalier — vurderet nødvendigt pga. de reelle farer ved varme og biologisk materiale.
- Bevidst udeladt (bare bones): "Klassens resultater"-tabellen (sammenligning på tværs af grupper) samt diskussions-/konklusionsspørgsmålene fra de gamle vejledninger — det er arbejdsspørgsmål, som den enkelte lærer selv tilføjer. En simpel registreringstabel til rå data (kolonietal + areal-beregning) er bevaret, ligesom i `osmose-i-kartofler`.

## Dafnier og koffein — de tre "Fagintro"-filer viste sig at være ét forsøg

Brugeren bad om at få lavet "fagintro-dafnieforsøget" (uden at det skulle hedde "fagintro" i den nye vejledning). `Forsogsvejledninger.md` listede gruppe 4 ("Dafnier (koffein/mikroskopi)") som om der potentielt var to forskellige forsøg — ét om koffein og ét om mikroskopi. Efter at have læst alle tre kildefiler (staget og læst 2026-08-27) viste det sig, at de er **samme forsøg**: dafniens hjerterytme observeres i mikroskop, før og efter tilsætning af kaffeopløsninger med stigende koffeinkoncentration. Forskellen mellem filerne er kun mængden af baggrundsstof:

- `Undervisning 2019-2020/Fag-intro/CS materialer/2 - Øvelsesvejledning dafnie koffein v2.docx` (identisk kopi i `Modul 2/`) — mest komplette protokol, med en fuld fortyndingsrække (stamopløsning 600 mg/L halveret trinvist ned til 18,75 mg/L) og eksplicitte formål/hypotese/resultater/fejlkilder/konklusions-prompts.
- `Undervisning 2019-2020/Fag-intro/CS materialer/1 - Dafnier mikroskopi CS.docx .docx` — samme forsøg, men kun med én koffeinkoncentration (ingen fortyndingsrække), efterfulgt af et langt tekststykke om dafniens anatomi, formering og økologiske betydning (baggrundslæsning, ikke en del af selve fremgangsmåden).
- `Undervisning 2021-2022/Fagintro/03 Øvelsesvejledning Dafnier mikroskopi 2021.docx` — samme protokol som v2 (men fremstiller kun stamopløsningen og siger "udvid selv, hvis I ikke ser effekt" i stedet for at foreskrive alle seks koncentrationer), rammet ind som et postermateriale, plus samme baggrundstekst om dafniens økologi.

Bekræftet med brugeren 2026-08-27, at der er tale om ét forsøg i flere udgaver. Den nye standardvejledning, `Biologi/dafnier-og-koffein`, bygger på **v2's fulde fortyndingsrække** (mest metodisk komplet), uden anatomi-/økologi-baggrundsteksten (bare bones — det er baggrundsstof, en lærer selv kan tilføje). Intet `callout-important`-afsnit om Sikkerhed: kaffeopløsningerne er food-grade og ufarlige i disse koncentrationer, samme vurdering som saltvandsopløsningerne i `osmose-i-kartofler`, der heller ikke har et sikkerhedsafsnit. Der er i stedet en `callout-tip` om at skåne dafnien for unødig lys/varme og evt. skifte til en frisk dafnie undervejs.


## Bromelin i ananas — enzymforsøg baseret på 2018-versionen

Kildematerialet (`Bio-C-delt-mappe/2 I tykt og tyndt - Kost og sundhed/7 Enzymer Bromelin 2018.docx` og `Bio-C-delt-mappe/MM_s 1.g-øvelser/Enzymer Bromelin.doc`) er to udgaver af samme forsøg: enzymet bromelin fra frisk ananas nedbryder proteinet gelatine (husblas), så det ikke stivner. 2018-versionen er den mest komplette (seks glas: frisk, kogt og syrebehandlet ananassaft, en vand-kontrol samt valgfri kiwi-/appelsinsaft for nogle grupper) og er derfor lagt til grund for den nye standardvejledning, `Biologi/bromelin-i-ananas`, efter samme princip som ved de øvrige konsolideringer.

Bare bones-versionen er afgrænset til det centrale forsøg med **fire glas** (frisk ananas, kogt ananas, ananas + syre, vand-kontrol) — de valgfri kiwi-/appelsin-varianter er i stedet nævnt i en `callout-tip` som en mulig udvidelse, en lærer selv kan vælge at bruge. Bevidst udeladt (bare bones): hypotese-/resultatskemaet med forklarende spørgsmål samt diskussions- og konklusionsspørgsmålene fra begge kildefiler — det er arbejdsspørgsmål, den enkelte lærer selv tilføjer. En simpel registreringstabel (stivnede gelatinen i hvert glas?) er bevaret.

Øvelsen bruger både kogende vand/åben ild og fortyndet saltsyre (til at denaturere enzymet i ét af glassene), så den har et `callout-important`-afsnit om Sikkerhed, som krævet af projektinstruktionerne når der anvendes kemikalier.


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

## GeoVejledninger lagt ind i Øvelser (2026-09-11)

Mappen `GeoVejledninger/` i roden af repoet findes ikke længere. Dens tre
selvstændige HTML-vejledninger er skrevet om til Quarto-øvelser under
`Geografi/` og renderet til html+pdf+docx som de øvrige:

| Gammel sti | Ny mappe |
| --- | --- |
| `GeoVejledninger/JordUndersøgelse_HF/` | `Geografi/poroesitet-og-permeabilitet-hf/` |
| `GeoVejledninger/JordUndersøgelse/` | `Geografi/poroesitet-og-permeabilitet-med-opgaver/` |
| `GeoVejledninger/konvektionskammer/` | `Geografi/konvektionskammer-med-opgaver/` |

De to sidste ligger nu **side om side** med de eksisterende
`Geografi/poroesitet-og-permeabilitet/` og `Geografi/konvektionskammer/`, som
dækker de samme forsøg. Forskellen er, at `-med-opgaver`-udgaverne også
indeholder journaldelen fra de gamle sider — resultatbehandling, beregning af
porøsitet og markkapacitet, diskussionsspørgsmål (jord) henholdsvis
journalfelter, analyse og spørgsmål (konvektionskammer). De korte udgaver er
uændrede.

**Alle syv geografi-øvelser har hvert sit kort** i `geografi.html`s stak
"Forsøgsvejledninger" (tælleren i stak-hovedet er rettet 4 → 7), hver med
`PDF`/`Word`-sublinks og — hvor der findes en — et link til simuleringen.
HF-kortet har desuden en `lvl-HF`-pille. Samme kontrol er kørt for
`biologi.html`: alle ti biologi-øvelser havde allerede kort. Kortene er ét
pr. mappe under `Øvelser/Geografi/` og `Øvelser/Biologi/`, så en ny øvelse
altid skal have et nyt kort.

`sitemap.xml`: de tre `GeoVejledninger`-url'er er erstattet af de tre nye
`Øvelser/Geografi/…/index.html`. `DESIGN-OMLÆGNING.md` er rettet, så
GeoVejledninger ikke længere står som gammelt design, der mangler omlægning.

**Quarto er nu installeret lokalt** (1.10.18, `/usr/local/bin/quarto`), og alle
tre nye øvelser er renderet på brugerens egen Mac med `quarto render index.qmd
--to typst|docx|html` — altså også PDF direkte via Typst, uden omvejen over
LibreOffice, der er beskrevet nedenfor.

## Kendte åbne punkter

- De gamle, nu overflødige filer (de to "Quartro Skabelon"-mapper, de gamle Osmose- og Mikroskopi-docx/pdf, leverings-zip'er) ligger i `Øvelser/_to_delete/` på brugerens Mac, fordi sletning kræver brugergodkendelse. Brugeren skal selv slette den mappe, når indholdet er tjekket.
- Quarto er installeret lokalt (1.10.18, `/usr/local/bin/quarto`), og PDF'en laves direkte via Typst. Omvejen over LibreOffice (`soffice --headless --convert-to pdf`), der blev brugt, dengang Quarto kun fandtes i et cloud-miljø uden netværk til Typst-pakkerne, er ikke længere nødvendig.
- Alle biologi-øvelser indtil videre bruger `callout-note` (blå) til Materialer og `callout-important` (rød) til Sikkerhed, når der er kemikalier eller andre reelle farer (fx varme, biologisk materiale) med — hold den konvention ved fremtidige øvelser. Rent food-grade opløsninger i lave koncentrationer (saltvand, kaffe) har hidtil ikke udløst et sikkerhedsafsnit.
- Bio-C-delt-mappe (den delte mappe med gamle lærermaterialer) er gennemgået og opsummeret i et separat projektdokument, `claude/Bio-C-forsog-oversigt.md`, som lister kandidater til fremtidige standardiserede vejledninger. Dafnie-koffein-forsøget lå ikke i denne mappe, men i de separate "Fag-intro"/"Fagintro"-mapper — se `Forsogsvejledninger.md`, gruppe 4.

## Øvelsesfilerne hedder øvelsen, ikke `index` (2026-09-11)

De 15 øvelser, der stadig hed `index.qmd` / `index.html` / `index.pdf` /
`index.docx`, er omdøbt, så filnavnet er mappens navn — samme konvention som
`blodsukkermaaling/` og `digital-kystopmaaling-rojle/` allerede fulgte:

```
Biologi/osmose-i-kartofler/index.qmd  →  Biologi/osmose-i-kartofler/osmose-i-kartofler.qmd
```

Grunden er de hentede filer. Når en elev klikker `PDF` eller `Word`, landede
der før en `index.pdf` i mappen Overførsler — og ti øvelser gav ti filer, der
alle hed det samme. Nu hedder de `osmose-i-kartofler.pdf`, `dna-i-kiwi.docx`
osv.

`.qmd`-kilderne er kun flyttet (`git mv`), ikke rettet, og alle tre formater er
renderet på ny. Resultatet er kontrolleret mod de gamle filer: HTML er linje
for linje identisk bortset fra filnavnene (biologi-siderne skiftede desuden til
den nyere kompilerede `bootstrap-…min.css`, som geografi-siderne allerede
brugte), PDF er identisk bortset fra tidsstempel og dokument-id, og `.docx`
er identisk bortset fra `docProps`.

**Konsekvens for adresserne:** `smbi.dk/Øvelser/Biologi/dna-i-kiwi/` uden
filnavn virker ikke længere — GitHub Pages har ingen `index.html` at falde
tilbage på. Ingen links på sitet brugte den korte form; `geografi.html`,
`biologi.html` og `sitemap.xml` peger alle på det fulde filnavn.

## Vitalkapacitet og Peak Flow-måling (2026-09-12)

To nye biologiøvelser fra forløbet "Den arbejdende krop" (Malene og Lotte,
forår 2017) er omsat til skabelonen:

| Kilde i `Bio-C-delt-mappe/` | Ny mappe |
| --- | --- |
| `Vitalkapacitet 2017.docx` | `Biologi/vitalkapacitet/` |
| `Peak Flow 2017.docx` | `Biologi/peak-flow-maaling/` |

De er holdt som **to selvstændige øvelser**, sådan som de også står i
`oversigt.html` og i kildematerialet — ikke slået sammen til én
lungefunktionsøvelse. De to måler forskellige ting (lungernes *størrelse*
mod luftens *strømningshastighed*), og Peak Flow-vejledningen indleder med
netop den forskel.

**Medtaget fra de gamle filer:** teorien i kort form, hele fremgangsmåden
(otte trin med lommespirometer, ni med peakflow-meter), klassens dataskema og
databehandlingen — gennemsnit pr. køn, (højde, vitalkapacitet)-plottet, og for
Peak Flow de to procentberegninger (afvigelse fra forventet værdi og forskel
mellem kønnene). Formlerne er skrevet som rigtig matematik (`$$…$$`) i stedet
for den forvanskede Word-ligning i originalen.

**Bevidst udeladt (bare bones):** de tre refleksionsspørgsmål under
«Spørgsmål» i `Vitalkapacitet 2017.docx` (kønsforskel, træning, alder) — samme
linje som ved de øvrige biologiøvelser, hvor `spg` er `nej`. Videolinket til
Astma-Allergi Danmark er også udeladt: den gamle adresse
(`astma.astma-allergi.dk/hvaderastma/undersoeglungerne/peakflow`) er død og
viderestiller nu til en generel astma-side.

**Figurer.** `figurer/lungevolumener.png` i `vitalkapacitet/` er **tegnet fra
bunden** med matplotlib (`figurer/lungevolumener.py` ligger ved siden af, som i
`Geografi/opmaaling-af-terraenprofil/`), fordi originalens tre figurer ikke
kunne genbruges: lungevolumen-diagrammet og brystkasse-figuren er
lærebogsmateriale (den ene mærket "© 2006 Encyclopædia Britannica"),
alders­kurven var et scannet, engelsk forskningsplot, og de fire småbilleder af
lommespirometret viser en identificerbar person. Den nye figur er på dansk og i
sidens farver (pink kurve, blå pile).

`figurer/peak-flow-diagram.png` i `peak-flow-maaling/` er derimod **taget
uændret** fra `Peak Flow 2017.docx` — øvelsen kan ikke gennemføres uden det,
da eleverne skal aflæse deres forventede værdi i det. Kurverne følger
Nunn & Gregg-referenceværdierne (kontrolleret: mand, 35 år, 183 cm giver
≈ 650 L/min i både diagram og formel). **Ophavsretten er ikke afklaret** —
diagrammet stammer fra lærebogsmateriale, og siden ligger offentligt på
smbi.dk. Skal det erstattes, kan det gentegnes ud fra Nunn & Gregg-ligningerne
på samme måde som spirogrammet.

Renderet til docx/pdf/html som alle de andre. De to
øvelser er derfor endnu ikke sat til `quarto:true` i `oversigt.html`, ikke
tilføjet som kort i `biologi.html` og ikke skrevet ind i `sitemap.xml`. Det
hører med, når der bliver renderet (se arbejdsgangs-reglen øverst).

## Grundversionen af poroesitet-og-permeabilitet fjernet (2026-09-14)

`Geografi/poroesitet-og-permeabilitet/` (qmd/html/pdf/docx) er slettet fra
repoet. Den var overflødig ved siden af de to udgaver, den selv blev forlæg
for: `-med-opgaver` (fuld databehandling og diskussion) og `-hf` (kortere,
to jordtyper) — se afsnittet ovenfor om `GeoVejledninger lagt ind i Øvelser`.

Henvisninger fjernet samme sted: kortet i `geografi.html`s
"Forsøgsvejledninger" (tælleren rettet 8 → 7), `.sub`-linket "Forsøgsvejledning"
på `poroesitetPermeabilitet`-simuleringskortet (peger nu på `-med-opgaver` i
stedet), rækken i `Øvelser/oversigt.html`, og url'en i `sitemap.xml`.
