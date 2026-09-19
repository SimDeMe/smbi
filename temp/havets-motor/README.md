# Havets motor — Quarto-projekt

Brobygningslektion i naturgeografi: ti reveal.js-slides + to elevark som PDF.

```
havets-motor/
├── _quarto.yml           projektfil — bestemmer hvad der renderes
├── havets-motor.qmd      slides (reveal.js) + talernoter
├── ark-a.qmd             elevark A → PDF
├── ark-b.qmd             elevark B → PDF
├── theme.scss            farver, skrifter og layout til slides
├── fig/                  figurer (SVG + de to kort som PNG)
└── _output/              det færdige resultat (oprettes af Quarto)
```

---

## 1. Installér Quarto (én gang)

Hent installeren fra <https://quarto.org/docs/get-started/> — eller på Mac:

```bash
brew install --cask quarto
```

Tjek at det virker:

```bash
quarto --version
```

Du skal **ikke** installere LaTeX. Elevarkene bruger Typst, som følger med
Quarto. Du skal heller ikke installere R eller Python — der er ingen kode i
dokumenterne.

---

## 2. Render det hele

Stå i mappen `havets-motor/` og kør:

```bash
quarto render
```

Så ligger der i `_output/`:

| Fil | Hvad |
|---|---|
| `havets-motor.html` | slides — én selvstændig fil, virker offline |
| `ark-a.pdf` | elevark A, én A4-side |
| `ark-b.pdf` | elevark B, én A4-side |

Vil du kun have én ting: `quarto render ark-a.qmd`.

---

## 3. Arbejd på slidesene

```bash
quarto preview havets-motor.qmd
```

Åbner dem i browseren og genindlæser automatisk, hver gang du gemmer .qmd-filen.
Stop med Ctrl+C.

---

## 4. Præsentér

Åbn `_output/havets-motor.html` i en browser.

| Tast | Gør |
|---|---|
| `→` / mellemrum | næste slide |
| `←` | forrige |
| `F` | fuld skærm |
| `S` | talervisning i et nyt vindue — noter, ur og næste slide |
| `O` eller `Esc` | oversigt over alle slides |
| `B` eller `.` | sort skærm (når de skal kigge på dig i stedet) |
| `?` | hjælp |

Talernoterne under hver slide i `.qmd`-filen (`::: {.notes}`) er dem, der dukker
op i talervisningen.

---

## 5. Læg slidesene på smbi.dk

`havets-motor.html` er sat til `embed-resources: true`, så **alt** — reveal.js,
CSS, kort og figurer — ligger inde i den ene fil. Upload den, og den virker.

```
_output/havets-motor.html   →   smbi.dk/geografi/havets-motor.html
```

Ingen mapper, ingen eksterne filer, ingen brudte stier. Samme princip som resten
af sitet.

To ting at vide:

- Filen er ca. 4 MB, fordi de to kort ligger inde i den.
- Skrifterne (Bricolage Grotesque, Spectral, IBM Plex Mono) hentes fra Google
  Fonts, når siden åbnes. Uden net falder den tilbage på Helvetica og Georgia —
  det ser stadig pænt ud. Vil du helt undgå Google Fonts, så slet
  `include-in-header`-blokken øverst i `havets-motor.qmd`.

Vil du hellere have en mappe med separate filer (mindre HTML, hurtigere
indlæsning), sæt `embed-resources: false`. Så skal både
`havets-motor.html` og mappen `havets-motor_files/` uploades.

---

## 6. Slides som PDF

Åbn slidesene i Chrome, sæt `?print-pdf` bagerst i adressen:

```
file:///.../\_output/havets-motor.html?print-pdf
```

og udskriv til PDF (liggende A4, baggrundsgrafik slået til).

---

## 7. Elevarkene

De renderes med **Typst** i stedet for LaTeX — hurtigere, og der er intet at
installere. Svarlinjerne laves af en lille hjælpefunktion øverst i hver fil:

```typst
#let linje(n) = { ... }
```

`#linje(1)` giver én svarlinje, `#linje(3)` giver tre. Sidemargenerne står i
YAML-hovedet (`margin: x/y`), og skriftstørrelsen i `fontsize`.

Vil du hellere have LaTeX-PDF (fx for at bruge skolens skabelon), så skift
`format: typst` til `format: pdf` og kør `quarto install tinytex` én gang. Så
skal Typst-blokkene laves om til LaTeX — sig til, hvis du vil den vej.

---

## 8. Ret i indholdet

| Vil du ændre … | Så åbn … |
|---|---|
| tekst på en slide | `havets-motor.qmd` |
| talernoter | samme fil, blokkene `::: {.notes}` |
| farver, skrifter, kortstørrelse | `theme.scss` |
| spørgsmål på elevarkene | `ark-a.qmd` / `ark-b.qmd` |
| figurerne | `fig/*.svg` — almindelig SVG, kan åbnes i en teksteditor eller Inkscape |

Farverne ligger samlet i toppen af `theme.scss` under `:root`. Ændrer du
`--cold` og `--red` dér, følger både kort-labels, tal og kanter med.

---

## Kilder

Temperaturer: klimanormaler 1991–2020.
København +1,4 °C (januar) / 9,2 °C (år) · Happy Valley-Goose Bay −17 °C / 0,4 °C.

Forsøget bag Ark A er Del 3 af øvelsesvejledningen *Grønlandspumpen* på
<https://smbi.dk/Øvelser/Geografi/groenlandspumpen/groenlandspumpen.html>.
