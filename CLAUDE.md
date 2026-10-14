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

## Tid-appen (`tid/`)

PWA med Firebase. Har browsertest mod en falsk Firebase i `tid/test/` — kør
`node tid/test/alle.mjs` før hvert push, der rører `tid/` (se
`tid/test/README.md`), og læg en test til ved hver rettelse. Hver ændring
tæller cachenavnet `tid-vNN` i `tid/service-worker.js` op; nye filer skrives
ind i dens liste.

## Simuleringer: gerne flere filer

Byg nye simuleringer som vedligeholdelige, selvstændige moduler. Små sider kan
være én HTML-fil; større modeller kan opdeles i HTML, CSS og ES-moduler efter
ansvar og faglig funktion. Fælles CSS og genbrugelige komponenter er tilladt.
Der er ingen fast grænse for antal linjer eller krav om bestemt filstruktur.
Sitet fungerer fortsat uden build som udgangspunkt; velbegrundede biblioteker
og en build-proces for en afgrænset del er tilladt, hvis de gør løsningen
bedre og ikke bryder GitHub Pages. Se `design_rules.md` og eksisterende
simulationer som inspiration, ikke tvungne skabeloner.

## Versioner og ændringshistorik

Git er den primære ændringshistorik. Ved faglige eller større funktionelle
ændringer dokumenteres ændring og evt. modelversion i commit og/eller
modelmetadata. En lille synlig versionsmarkering er valgfri; den må ikke
optage væsentlig plads i elevens arbejdsområde. Ingen automatisk tvungen
versionsopskrivning ved enhver kosmetisk rettelse.

**Atlas viser et enkelt versionsnummer direkte i headeren i `atlas/index.html`.**
Når Atlas ændres, øges tallet med én i samme commit (fx `v406` → `v407`).
Ændringer andre steder på sitet ændrer ikke atlasversionen. Bevar den kompakte
markering og den almindelige GitHub Pages-udgivelse fra `main` / rod.

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

## Ny session — sig til

Sig til, når det er smart at starte en ny session, før vi går videre —
kort, med grunden og hvad der skal med over. Typisk når:

* næste opgave handler om noget helt andet end det, sessionen har arbejdet
  med (fx fra `tid/` til en simulering eller en øvelsesvejledning),
* samtalen er blevet så lang, at tidligere detaljer risikerer at blive
  glemt eller opsummeret væk,
* en større opgave er færdig, committet og pushet, og resten er løse ender.

Skriv i så fald 2–3 linjer, jeg kan sætte ind i den nye session (hvad der
er lavet, hvad der mangler, hvilke filer det drejer sig om). Gælder ikke
midt i en opgave — gør den færdig først.

## Commits

Danske, i bydeform, med en kort forklarende krop når ændringen er stor. Fx:
`Stigningsregn i sidens nye design: samme model, pænere ramme`.

**Arbejd som udgangspunkt direkte på `main`.** Projektet er personligt, og
ejeren ønsker at kunne se ændringer live fra mobilen. Opret ikke branches
eller pull requests, medmindre ejeren specifikt beder om det eller en konkret
teknisk begrænsning nødvendiggør det; forklar i så fald afvigelsen. GitHub
Pages udgiver `main` direkte: test relevante funktioner og skærmstørrelser
før push, bevar eksisterende links og simulationer, og lav små commits der
kan rulles tilbage. Stop ved ødelæggende ændringer eller uklar risiko.
