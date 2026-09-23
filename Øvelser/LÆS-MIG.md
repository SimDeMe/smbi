# Øvelsesvejledninger (Quarto) — sådan virker skabelonen

Dette er en **Quarto-skabelon** til øvelsesvejledninger i biologi og naturgeografi. Du skriver indholdet i almindelig markdown i en `.qmd`-fil, og Quarto bygger automatisk en pænt opsat PDF, Word-fil (.docx) og webside (.html) ud fra samme kilde — alle tre i samme stil (skovgrøn, sidehoved med fag og hold, sidetal, samme figur-/tabelopsætning).

## Sådan hænger det sammen

Den fælles opsætning ligger som **6 filer direkte i toppen af `Øvelser/`**:

- `_quarto.yml` — fælles indstillinger (papirstørrelse, marginer, sidehoved/-fod, farver). Ret her, hvis noget skal ændres for *alle* vejledninger på én gang.
- `styles.scss` — udseendet for HTML-versionen.
- `page.typ` / `typst-template.typ` — udseendet for PDF-versionen (Typst).
- `reference.docx` — udseendet for Word-versionen. Bruges kun som "stilskabelon" — dens eget indhold vises aldrig.
- `fix-docx-tables.py` — kører automatisk efter hver rendering og sørger for, at tabeller i Word-filen aldrig bliver delt af et sideskift.

Fordi `_quarto.yml` ligger i toppen af `Øvelser/`, gælder opsætningen automatisk for **enhver** `.qmd`-fil, uanset hvor dybt nede den ligger under `Biologi/` eller `Geografi/` — Quarto leder selv opad efter `_quarto.yml`, uanset hvor mange undermapper der er imellem.

**Der er ingen særlig skabelonmappe, man skal ligge inde i.** En ny øvelse er bare en almindelig undermappe under `Biologi/` eller `Geografi/` (eller et evt. nyt fag), med sin egen `.qmd`-fil (samme navn som mappen) og en `figurer/`-mappe, hvis den har billeder.

## Eksempel på struktur

```
Øvelser/
├── _quarto.yml, styles.scss, reference.docx, page.typ, typst-template.typ, banner.html, fix-docx-tables.py   (fælles, rør kun hvis alle vejledninger skal ændres)
├── Biologi/
│   ├── mikroskopi-af-celler/
│   │   └── mikroskopi-af-celler.qmd (+ evt. figurer/)
│   └── osmose-i-kartofler/
│       └── osmose-i-kartofler.qmd (+ evt. figurer/)
└── Geografi/
    └── opmaaling-af-terraenprofil/
        ├── opmaaling-af-terraenprofil.qmd
        └── figurer/
```

## Sådan laver du en ny vejledning

1. Kopiér en eksisterende øvelsesmappe (fx `Geografi/opmaaling-af-terraenprofil/`) til en ny mappe med et sigende navn, under det rigtige fag (fx `Geografi/kysterosion/` eller `Biologi/enzymforsog/`).
2. Slet de gamle figurer i `figurer/`, og ret `.qmd`-filen: titel, tekst, fremgangsmåde, materialer og skema. Husk et afsnit om sikkerhed, hvis der bruges kemikalier.
3. Tag de to faste afsnit med (se nedenfor): **Databehandling** og **Journalspørgsmål**.
4. Skriv øvelsen ind i `oversigt.html` — også når du kun retter i en, der findes i forvejen.
5. Giv øvelsen et kort på `biologi.html` eller `geografi.html` under «Forsøgsvejledninger», så den kan findes fra sitet. Alle øvelser skal have ét.
6. Claude renderer selv vejledningen til PDF/Word/HTML, hver gang `.qmd`-filen er rettet — du skal ikke bede om det. Vil du gøre det i hånden, står Quarto klar på maskinen; kør inde i øvelsens egen mappe:
   ```
   quarto render <øvelse>.qmd --to typst   # PDF
   quarto render <øvelse>.qmd --to docx    # Word
   quarto render <øvelse>.qmd --to html    # webside
   ```
   Filen hedder det samme som mappen (fx `oliens-migration.qmd`), så den downloadede vejledning er til at kende igen på skrivebordet.

   Skal **alle** vejledninger igennem på én gang, så kør scriptet i toppen af `Øvelser/`:
   ```
   ./render-alle.sh              # alle 26, i alle tre formater
   ./render-alle.sh osmose       # kun dem, hvis sti indeholder «osmose»
   ./render-alle.sh Geografi     # kun geografi-øvelserne
   ```
   En vejledning, der fejler, stopper ikke de andre — fejlene samles til sidst med
   Quartos egen fejlbesked. Kør det efter ændringer i `_quarto.yml`, `styles.scss`
   eller Typst-skabelonen, hvor alle vejledninger skal følge med.

   **Kør ikke bare `quarto render` inde i `Øvelser/`.** Den ville også tage
   `LÆS-MIG.md`, `Mappestruktur.md`, `Forsogsvejledninger.md`,
   `Bio-C-forsog-oversigt.md` og `forsøgsliste2109.md` med og lave `.pdf`- og
   `.docx`-udgaver af arbejdsdokumenter, der kun skal findes som websider.

## De to faste afsnit

Hver vejledning slutter med to afsnit, der gør den til mere end en opskrift:

**`## Databehandling`** — hvad eleverne selv skal regne, tegne og vurdere ud fra
deres rådata: gennemsnit, procentberegninger, en graf, en sammenligning på tværs
af grupper. Skriv formlerne som rigtig matematik (`$$…$$`), og lav et lille skema
til de udregnede tal, hvis der er mere end et par stykker. Afsnittet springes kun
over, hvis øvelsen er rent kvalitativ — er der tal, skal der regnes på dem.

**`## Journalspørgsmål`** — nummererede forslag til faglige refleksionsspørgsmål,
der binder resultaterne sammen med teorien: forklar begrebet, vurdér metodens
fejlkilder, sammenlign med en anden situation, diskutér hvor repræsentativt
resultatet er. Det er forslag, du kan skære i eller bytte ud, ikke en facitliste.

`Biologi/biodiversitet-i-graesplaenen/` viser begge afsnit, som de skal se ud.

## Genbrugelige byggeklodser i en `.qmd`

- `## Overskrift` → grøn sektionsoverskrift med streg i venstre side.
- `![Billedtekst](figurer/billede.png)` → nummereret figur med billedtekst.
- `::: {.callout-tip} ## Tip ... :::` → grøn tip-boks.
- `::: {.callout-note} ## Materialer (pr. gruppe) ... :::` → blå boks (fx til materialeliste).
- Almindelig markdown-tabel med `: Billedtekst {#tbl-1}` under → nummereret tabel/skema med grønt overskriftsfelt, som der kan henvises til med `@tbl-1`.
- `$$\\frac{a}{b}$$` → formel på egen linje, til databehandlingsafsnittet.

## Hvis du vil rendere selv (uden Claude)

Quarto er allerede installeret (1.10.18). Kør kommandoerne ovenfor i Terminal, stående i vejledningens egen undermappe (fx `Geografi/opmaaling-af-terraenprofil/`).
