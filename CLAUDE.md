# smbi.dk

Undervisningssite med interaktive simuleringer til naturgeografi og biologi på
gymnasieniveau. Statiske HTML-sider, ingen build, ingen framework — hostet på
GitHub Pages (`CNAME` → smbi.dk). Alt indhold er på **dansk**, også kommentarer,
commit-beskeder og variabelnavne i nyere filer.

## Sådan ser man en side

```bash
python3 -m http.server 8777       # og åbn http://localhost:8777/...
```

Sider linker til `/geografi.html`, `/contact.html` osv. med rod-relative stier,
så de kun virker rigtigt over en server — ikke via `file://`.

## Øvelsesvejledninger (`Øvelser/`)

Quarto-projekt med én mappe pr. øvelse under `Biologi/` og `Geografi/`. Filen
hedder det samme som mappen (`oliens-migration/oliens-migration.qmd`).
Nye vejledninger bygges på de gamle originaler, der ligger i SM-DRIVE-arkivet
(`~/Library/CloudStorage/OneDrive-FællesDigital/SM-DRIVE/forsøgsvejledninger_sm-drive/`)
og i `Øvelser/Bio-C-delt-mappe/` — find og læs originalen først; gamle `.doc`-filer
pakkes ud med `soffice --headless --convert-to "html:HTML (StarWriter)"`.
`Øvelser/oversigt.html` er den interne oversigt: hver ny eller ændret øvelse skal
have sin række dér, med emne og sti til originalen.

**Rendér altid efter en rettelse.** Når en `.qmd` (eller et `.md` med renderede
udgaver ved siden af) er rettet, køres alle tre formater igen, så `.pdf`, `.docx`
og `.html` følger kilden:

```bash
cd Øvelser/<Fag>/<øvelse>
quarto render <øvelse>.qmd --to typst   # PDF
quarto render <øvelse>.qmd --to docx    # Word
quarto render <øvelse>.qmd --to html    # webside
```

Detaljerne står i `Øvelser/Mappestruktur.md` og `Øvelser/LÆS-MIG.md`.

---

@design_rules.md

## Commits

Danske, i bydeform, med en kort forklarende krop når ændringen er stor. Fx:
`Stigningsregn i sidens nye design: samme model, pænere ramme`.
