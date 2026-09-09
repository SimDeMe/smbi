# Øvelsesvejledninger (Quarto) — sådan virker skabelonen

Dette er en **Quarto-skabelon** til øvelsesvejledninger i biologi og naturgeografi. Du skriver indholdet i almindelig markdown i en `.qmd`-fil, og Quarto bygger automatisk en pænt opsat PDF, Word-fil (.docx) og webside (.html) ud fra samme kilde — alle tre i samme stil (skovgrøn, "3g Ng"-sidehoved, sidetal, samme figur-/tabelopsætning).

## Sådan hænger det sammen

Den fælles opsætning ligger som **6 filer direkte i toppen af `Øvelser/`**:

- `_quarto.yml` — fælles indstillinger (papirstørrelse, marginer, sidehoved/-fod, farver). Ret her, hvis noget skal ændres for *alle* vejledninger på én gang.
- `styles.scss` — udseendet for HTML-versionen.
- `page.typ` / `typst-template.typ` — udseendet for PDF-versionen (Typst).
- `reference.docx` — udseendet for Word-versionen. Bruges kun som "stilskabelon" — dens eget indhold vises aldrig.
- `fix-docx-tables.py` — kører automatisk efter hver rendering og sørger for, at tabeller i Word-filen aldrig bliver delt af et sideskift.

Fordi `_quarto.yml` ligger i toppen af `Øvelser/`, gælder opsætningen automatisk for **enhver** `.qmd`-fil, uanset hvor dybt nede den ligger under `Biologi/` eller `Geografi/` — Quarto leder selv opad efter `_quarto.yml`, uanset hvor mange undermapper der er imellem.

**Der er ingen særlig skabelonmappe, man skal ligge inde i.** En ny øvelse er bare en almindelig undermappe under `Biologi/` eller `Geografi/` (eller et evt. nyt fag), med sin egen `index.qmd` og en `figurer/`-mappe, hvis den har billeder.

## Eksempel på struktur

```
Øvelser/
├── _quarto.yml, styles.scss, reference.docx, page.typ, typst-template.typ, banner.html, fix-docx-tables.py   (fælles, rør kun hvis alle vejledninger skal ændres)
├── Biologi/
│   ├── mikroskopi-af-celler/
│   │   └── index.qmd (+ evt. figurer/)
│   └── osmose-i-kartofler/
│       └── index.qmd (+ evt. figurer/)
└── Geografi/
    └── opmaaling-af-terraenprofil/
        ├── index.qmd
        └── figurer/
```

## Sådan laver du en ny vejledning

1. Kopiér en eksisterende øvelsesmappe (fx `Geografi/opmaaling-af-terraenprofil/`) til en ny mappe med et sigende navn, under det rigtige fag (fx `Geografi/kysterosion/` eller `Biologi/enzymforsog/`).
2. Slet de gamle figurer i `figurer/`, og ret `index.qmd`: titel, tekst, fremgangsmåde, materialer og skema. Husk et afsnit om sikkerhed, hvis der bruges kemikalier.
3. Bed Claude om at rendere den nye `.qmd`-fil til PDF/Word/HTML (kræver Quarto — se nedenfor), eller installér selv Quarto og kør, stående inde i øvelsens egen mappe:
   ```
   quarto render index.qmd --to typst   # PDF
   quarto render index.qmd --to docx    # Word
   quarto render index.qmd --to html    # webside
   ```

## Genbrugelige byggeklodser i en `.qmd`

- `## Overskrift` → grøn sektionsoverskrift med streg i venstre side.
- `![Billedtekst](figurer/billede.png)` → nummereret figur med billedtekst.
- `::: {.callout-tip} ## Tip ... :::` → grøn tip-boks.
- `::: {.callout-note} ## Materialer (pr. gruppe) ... :::` → blå boks (fx til materialeliste).
- Almindelig markdown-tabel med `: Billedtekst` under → nummereret tabel/skema med grønt overskriftsfelt.

## Hvis du vil rendere selv (uden Claude)

Quarto er gratis: installér fra quarto.org, og kør kommandoerne ovenfor i Terminal, stående i vejledningens egen undermappe (fx `Geografi/opmaaling-af-terraenprofil/`).
