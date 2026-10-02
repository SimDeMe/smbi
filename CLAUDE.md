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

## Simuleringer: gerne flere filer

Alle nye simuleringer — og simuleringer, der lægges om — må deles op i flere
filer: siden selv (`<navn>.html` med CSS og markup) plus ES-moduler i en
undermappe med sidens navn (`<navn>/side.js`, `<navn>/model.js` osv.). Ingen
build og ingen npm-pakker; modulerne kræver en server, ligesom siderne i
forvejen gør. Se afsnit 0 i `design_rules.md` for, hvordan der deles, og
`geografi/boelger/` eller `biologi/membran/` som forlæg.

## Versionsnummer på simuleringer

Hver simulering har et versionsnummer, og **hver gang en simulering rettes,
får den et nyt** — i samme commit som rettelsen. Nummeret står med småt i
øverste venstre hjørne af simuleringens vindue: i nyt design som første
element i `.rig-head`:

```html
<span class="version" title="Simuleringens version">v1.0</span>
```

```css
.version{font-family:var(--mono);font-size:0.58rem;font-weight:500;
  letter-spacing:0.08em;color:var(--slate)}
```

(Ingen versaler — det skal stå `v1.0`, ikke `V1.0`.) I gammelt design
sættes det tilsvarende i øverste venstre hjørne af simuleringens ramme.

* Små rettelser (tekst, fejl, justeringer af layout eller farver) tæller
  andet tal op: `v1.0` → `v1.1`.
* Ny funktion, ændret model eller omlægning til nyt design tæller første
  tal op: `v1.4` → `v2.0`.
* En simulering, der endnu ikke har et nummer, får `v1.0`, første gang den
  rettes.

Nævn det nye nummer i commit-beskeden.

## Øvelsesvejledninger (`Øvelser/`)

Quarto-projekt med én mappe pr. øvelse under `Biologi/` og `Geografi/`. Filen
hedder det samme som mappen (`oliens-migration/oliens-migration.qmd`).
Nye vejledninger bygges på de gamle originaler, der ligger i SM-DRIVE-arkivet
(`~/Library/CloudStorage/OneDrive-FællesDigital/SM-DRIVE/forsøgsvejledninger_sm-drive/`)
og i `Øvelser/Bio-C-delt-mappe/` — find og læs originalen først; gamle `.doc`-filer
pakkes ud med `soffice --headless --convert-to "html:HTML (StarWriter)"`.

**Fast indhold i hver vejledning.** Ud over fremgangsmåde, materialer, evt.
sikkerhed og registreringsskema skal hver vejledning have to afsnit:

* `## Databehandling` — de beregninger og grafer, eleverne selv skal lave ud fra
  deres rådata (formler som rigtig matematik, `$$…$$`, og et skema til de
  udregnede tal, hvor det giver mening). Er øvelsen rent kvalitativ, så der
  ikke er tal at regne på, udelades afsnittet — og kun da.
* `## Journalspørgsmål` — nummererede forslag til faglige refleksionsspørgsmål,
  der binder forsøgets resultater sammen med teorien. De er forslag, læreren kan
  skære i, ikke en facitliste.

Se `Biologi/biodiversitet-i-graesplaenen/` som forlæg for begge.

**Hver øvelse skal have sit eget kort** i staken «Forsøgsvejledninger» på
`biologi.html` eller `geografi.html` — ét kort pr. mappe under
`Øvelser/Biologi/` og `Øvelser/Geografi/`, uden undtagelser. Kortet står
alfabetisk, linker til `.html` og har `PDF`/`Word`-sublinks (samt link til
simuleringen, hvis der findes en). Kortet får ét eller flere emnetags — i
`data-emne` adskilt af semikolon (`data-emne="Klima; Hav; Kyst"`) og som én
`<span class="fag">` pr. tag — så emneknapperne over staken kan filtrere på
dem. Emnerne fra `Øvelser/oversigt.html` er sammensatte («Krop og
fysiologi», «Hav og kyst»); på kortene er de delt op i enkeltord (fx `Krop`,
`Fysiologi`, `Hav`, `Kyst`), og kortet får de ord, der er relevante — også
fra et andet emne, hvis det passer. Niveauet står som mærker til
højre (`<span class="lvl lvl-C">C</span>`, NV-øvelser også `lvl-NV`). Tælleren i stak-hovedet (`<span class="n">`)
rettes med, og sidens adresse skrives ind i `sitemap.xml`.

`Øvelser/oversigt.html` opdateres **altid**, når en vejledning laves eller
rettes: rækken skal have emne, sti til originalen og de rigtige værdier i
`data`- og `spg`-felterne, og tællere og «Det der mangler»-listen skal passe
bagefter.

**Rendér altid efter en rettelse.** Når en `.qmd` (eller et `.md` med renderede
udgaver ved siden af) er rettet, køres alle tre formater igen, så `.pdf`, `.docx`
og `.html` følger kilden:

```bash
cd Øvelser/<Fag>/<øvelse>
quarto render <øvelse>.qmd --to typst   # PDF
quarto render <øvelse>.qmd --to docx    # Word
quarto render <øvelse>.qmd --to html    # webside
```

Skal alle vejledninger igennem på én gang — fx efter en ændring i `_quarto.yml`,
i `styles.scss` eller i Typst-skabelonen — så kør `Øvelser/render-alle.sh`. Den
tager kun `.qmd`-filerne under `Biologi/` og `Geografi/`; et bart
`quarto render` i `Øvelser/` ville også give arbejdsdokumenterne i mappen
`.pdf`- og `.docx`-udgaver, de ikke skal have.

Detaljerne står i `Øvelser/Mappestruktur.md` og `Øvelser/LÆS-MIG.md`.

---

@design_rules.md

## Commits

Danske, i bydeform, med en kort forklarende krop når ændringen er stor. Fx:
`Stigningsregn i sidens nye design: samme model, pænere ramme`.

**Arbejd direkte på `main`.** Commit og push direkte til `main` — ingen
feature-grene og ingen pull requests, medmindre jeg selv beder om det. Det
gælder også, når sessionen er sat op med en anden gren. GitHub Pages udgiver
`main` med det samme, så test i browseren (se «Sådan ser man en side») før
hvert push.
