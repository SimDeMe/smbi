# Naturgeografisk atlas

Selvstændig indgang på `/atlas/` til seks eksisterende simulationer. Ingen build,
login eller ændringer af modellerne. Forsiden og `geografi.html` er uændrede.

## Arkitektur

- `index.html` og `atlas.css`: dansk, responsiv brugerflade. På brede skærme
  ligger kontrollerne i figurens hjørner. På smalle skærme ligger de under den.
  Fokus skjuler site-header og introduktion uden browserfuldskærm.
- `modeller.js`: redigerbart register over steder og simulationer.
- `atlas.js`: stedliste, procesfiltre, søgning og detailkort i en native dialog.
  Navigationen starter før globussen, så den også virker ved kortfejl.
- `globus.js`: D3's ortografiske projektion tegnet med Canvas 2D. Den håndterer
  horisontklipning, landegrænser, bredde-/længdegrader og projektion af markører.
  Canvas bruger højst dobbelt pixeltæthed; kun ændringer udløser tegning.
- `vendor/` og `data/`: lokale, versionsbundne biblioteker, licenser og kortdata.

Globusmodulet indlæses separat med fejlhåndtering. Manglende bibliotek, HTTP-fejl,
ugyldige kortdata, timeout (12 sekunder) eller manglende Canvas 2D giver en synlig
fejlbesked og bevarer lister, søgning og modelkort. **WebGL er slet ikke nødvendigt**:
samme globus og alternativer fungerer med WebGL deaktiveret. Uden JavaScript
henviser siden til geografibiblioteket.

## Tilføj en simulation

Tilføj et objekt til `modeller` i `modeller.js`:

```js
{
  id: 'unik-model',
  titel: 'Kort titel',
  emne: 'Procesnavn',
  niveau: 'Naturgeografi C / B', // redaktionel vejledning, ikke adgangskrav
  steder: ['island'],           // [] for globale modeller
  beskrivelse: 'Hvad eleven kan undersøge, og hvilken model der bruges.',
  sti: '/geografi/eksisterende-model.html',
  soegeord: 'supplerende ord synonymer'
}
```

Steder angives separat med `id`, `navn`, valgfrit `kortnavn`, `koordinater`,
`forklaring` og `forbehold`. Koordinater er **[længdegrad, breddegrad]** i grader,
med vestlige/sydlige værdier negative. Lister, procesfiltre og markører dannes
automatisk; globuskoden skal ikke ændres. Søgning bruger alle ord og normaliserer
store/små bogstaver, diakritiske tegn samt æ/ae, ø/oe og å/aa.

Stedmarkører er faglige adgangspunkter til generelle modeller. Island giver
adgang til pladegrænser og vulkanisme; Nordatlanten til havcirkulation; Alperne
til stigningsregn. Nordatlanten-markøren angiver en region syd for Grønland og
ikke et målt nedsynkningspunkt. Der vises ingen opdigtede plade-, terræn- eller
klimadata. Drivhuseffekten ligger under **Processer → Global atmosfære** og i
søgningen, uden en vilkårlig markør.

## Afhængigheder og kilder

Alle nødvendige kortressourcer serveres fra eget site. Ingen CDN-kald ved brug.

| Ressource | Version | Oprindelse og licens |
| --- | --- | --- |
| d3-array | 3.2.4 | [D3](https://github.com/d3/d3-array), ISC; `vendor/d3-array.LICENSE` |
| d3-geo | 3.1.1 | [D3](https://github.com/d3/d3-geo), ISC; `vendor/d3-geo.LICENSE` |
| topojson-client | 3.1.0 | [TopoJSON](https://github.com/topojson/topojson-client), ISC; `vendor/topojson-client.LICENSE` |
| countries-110m.json | world-atlas 2.0.2 | [world-atlas](https://github.com/topojson/world-atlas), ISC; `data/world-atlas.LICENSE` |

Filerne er hentet uændret fra `https://cdn.jsdelivr.net/npm/<pakke>@<version>/`
(`dist/<pakke>.min.js`, `LICENSE`, henholdsvis `countries-110m.json`). Kortet
stammer fra [Natural Earth](https://www.naturalearthdata.com/), public domain,
forenklet til 1:110 mio. Det er et oversigtskort; små øer og detaljer kan mangle.
Grænser er orientering, ikke stillingtagen til omstridte områder. Opdater data
og licenser sammen ved et versionsskift.

Archivo (Google Fonts v25, vægt 400–800), Source Serif 4 (v15, 400–600) og
IBM Plex Mono (v20, 500) ligger lokalt som latinske WOFF2-filer i `vendor/fonts/`.
De oprindelige Google Fonts-URL’er står i `fonts.css`; OFL-licenserne kommer fra
[google/fonts](https://github.com/google/fonts/tree/main/ofl). Ingen eksterne
fontkald er nødvendige. Systemskrifter, Georgia og monospace er fallback.

## Lokal afprøvning

Fra repositoryroden:

```sh
python3 -m http.server 8777
# Åbn http://localhost:8777/atlas/
```

Træk med mus/én finger for at dreje; zoom med to fingre eller +/−. Musehjulet
zoomer, når globussen har fokus (eller Ctrl holdes nede). Piletaster drejer
globussen på tværs af siden, også efter klik på topbaren eller med fokus på
et almindeligt link, en knap eller en markør. Fokus flyttes ikke automatisk.
Søgefelter, input, tekstfelter, select, redigerbar tekst og widgets med egen
piletastbetjening beholder tasterne; åbne dialoger stopper globusgenvejene.
Allerede håndterede events, tekstkomposition og pile med Alt/Ctrl/Meta/Shift
overlades til komponenten, browseren eller hjælpeteknologien. Med fokus på
globussen virker +/− og Home som før. Alle funktioner har også synlige knapper.
Escape lukker dialogen og afslutter fokus. Ingen automatisk rotation eller
vedvarende animation; reduced motion respekteres.

Den reproducerbare browsertest kræver Python-pakken `playwright` og Chromium.
Serveren skal allerede køre:

```sh
python3 atlas/test/afproev.py
# Valgfrit: CHROMIUM=/sti/til/chromium ATLAS_URL=http://localhost:8777
# ATLAS_TEST_UD=/tmp/smbi-atlas-test (standard for skærmbilleder)
```

Testen dækker markører, modelkort, alle seks links (HTTP 200), procesfiltre,
søgning og tomme søgeresultater, tastatur, fokusretur, rotation, zoomgrænser,
nulstilling, fokustilstand, touch-rotation og tofingerzoom, samt fejl ved
kortdata, bibliotek og Canvas 2D. Den køres med WebGL deaktiveret og reduced
motion. Den måler figur og primære kontroller direkte frem for det ældre
pladstjekværktøjs `.rig`-antagelse.

`test/piletaster.py` indgår i samme kørsel og dækker regressionen i #51:
rotation efter klik på topbar, links, knapper og markører; samme enkelttrin
med og uden canvasfokus; uændret Enter/Space; tekstcursor i søgning; dialoger,
native formularfelter, slider, redigerbar tekst og sammensatte ARIA-widgets.
Den kontrollerer også allerede håndterede events, modifiers og tekstkomposition.
Testen sammenligner canvas' faktiske pixels, så fokusrammer ikke kan give et
falsk positivt resultat.

## Teststatus — 14. oktober 2026

Bestået i headless Chromium på 1280×577, 1366×625, 1536×730, mobil 390×750
og smal sidevisning 640×625. Ingen JavaScript- eller konsolfejl ved normal
brug. Alle funktioner og de tre fejltilstande i browsertesten består, også
med WebGL deaktiveret. Skærmbilleder er visuelt gennemgået.

Regressionen for #51 blev først reproduceret med den gamle canvas-lytter.
Efter rettelsen består global piletastnavigation og undtagelserne på alle fem
visninger sammen med de eksisterende atlasprøver.

På de tre laptopstørrelser er både globus og primære kontroller synlige uden
scroll; figurfladerne er henholdsvis 1228×363, 1314×411 og 1484×516 px.
Mobil har en 366×410 px figur og betjening under den. Ingen vandret rulning
på nogen af de fem størrelser. Fokus giver mere plads uden browserfuldskærm.

Alle seks simulationssider er desuden åbnet med HTTP 200 og uden JavaScript-fejl.
Forside, geografibibliotek og de seks simulationsfiler er byte-identiske med
udgangspunktet. Sitemap indeholder nu `/atlas/`.

Ikke afprøvet på fysiske telefoner, Safari/Firefox eller med en egentlig
skærmlæser. Touch er testet gennem Chromiums inputprotokol. Ingen ændringer
af simulationsmodeller; deres faglige beregninger genvalideres ikke her.

## Mulig fase 2

Flere redaktionelt kvalitetssikrede steder og modeller; delbare atlasvalg via
URL; egentlige elevopgaver; stedbundet data med kilde og usikkerhed;
bedre markørgruppering ved et større katalog. Zoom ind i et rumligt tværsnit
kan tilføjes som et separat modul uden at ændre simulationernes URL'er.
