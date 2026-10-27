# PDF-værksted på smbi.dk

En statisk udgave af eScanners PDF-værktøjer: visuel beskæring, deling af
bogopslag til enkeltsider og OCR til en søgbar PDF. Der er ingen Python-backend,
login eller filupload. PDF'en og arbejdshistorikken ligger kun i browserens
hukommelse. Genindlæsning eller lukning mister arbejdskopien; hent PDF'en først.

## Udgivelse

Siden ligger på `/pdf-vaerksted/` og er linket under Værktøjer på forsiden.
GitHub Pages udgiver fra `main` / rod. Der kræves ingen buildkommando,
Python-backend eller API-nøgle.

## Brug

1. Åbn en PDF. Træk et udsnit og anvend eventuelt beskæringen.
2. Del eventuelle dobbeltsider. Vælg særskilt håndtering af forsider pr. scanning.
3. Vælg OCR-sprog og start. Du kan bruge andre faner og programmer imens.
4. Hent PDF'en, når behandlingen er færdig. Resultatet markeres også i fanetitlen.

OCR kører via Tesseract.js i en Web Worker, én side ad gangen. Der vises
fremdrift og en log, og behandlingen kan afbrydes uden at ændre den aktuelle
PDF. Første kørsel henter motor, WebAssembly-filer og sprogdata. Internetadgang
til jsDelivr og tessdata.projectnaptha.com er derfor nødvendig. Disse tjenester
leverer programfiler og sprogmodeller; PDF-indhold sendes ikke til dem.
PDF.js kan hente standardfonte fra jsDelivr ved visning af PDF'er med tekst.

Lad fanen være åben, og hold computeren vågen. Browserens sparefunktioner kan
forsinke eller suspendere en baggrundsfane; siden kan ikke garantere fortsat
arbejde, når fanen lukkes eller computeren sover. Det er ikke en serverkø.

## Afgrænsninger

- OCR er målrettet kortere tekster og vesteuropæiske sprog. Dansk og engelsk
  vises som hurtige valg. Tegn uden for tekstlagets tegnsæt erstattes med `?`
  og antallet rapporteres. OCR er fejlbehæftet og bør kontrolleres.
- Normal OCR bevarer PDF-indholdet og springer sider med tekst over. Genkendelse
  af alle sider igen laver en ny billed-PDF med et nyt tekstlag. Den tilstand
  gengiver siderne ved op til 300 dpi; meget store sider begrænses til 12 MP.
- Beskæring ændrer kun det synlige område og er ikke en permanent overstregning.
  Deling kan øge filstørrelsen. Formularer, signaturer og avancerede interaktive
  PDF-funktioner er ikke målgruppen. Adgangskodebeskyttede filer understøttes ikke.
- Kun almindelig desktop-browser er afprøvet. Store PDF'er og telefoner kan løbe
  tør for hukommelse. Der gemmes op til otte trin til fortryd i hukommelsen.

## Lokal kontrol

```sh
python3 -m http.server 8777
# Åbn http://localhost:8777/pdf-vaerksted/
node pdf-vaerksted/test-tools.mjs
```

Python i eksemplet bruges kun som simpel filserver under udvikling, ikke til
PDF-behandling. GitHub Pages erstatter filserveren i den publicerede udgave.

## Biblioteker

Fastlåste versioner af pdf-lib 1.17.1 (MIT), PDF.js 5.4.624 (Apache-2.0) og
Tesseract.js 6.0.1 (Apache-2.0) ligger i `vendor/` med deres licensfiler.
Tesseract.js henter egne worker-/motorfiler og sprogdata ved behov. Ingen
analyseværktøjer eller eksterne OCR-tjenester bruges.
