# Atlas

Selvstændig indgang på `/atlas/` til seks eksisterende simulationer. Ingen build,
login eller ændringer af modellerne. Forsiden og `geografi.html` er uændrede.

## Første landekort: Danmark (v410)

Danmark er fremhævet på globussen. Tryk på selve landets geometri for at åbne
landekortet; zoom ind ved behov. Ingen landeknap ligger oven på globussen.
**Steder → Danmark** er det
tastaturtilgængelige alternativ, også når landet vender væk. Der er endnu ikke
landekort for andre lande. De tre faglige markører har deres hidtidige funktion.

Landekortet viser Jylland og øerne inklusive Bornholm, med nabolande nedtonet,
fem orienteringsbyer og en lokal, omtrentlig målestok. Grønland og Færøerne indgår
ikke i denne visning. Natural Earth 1:10 mio. giver mere detaljerede kyster end
globussen (1:110 mio.), men er stadig generaliseret: småøer kan mangle; terræn,
veje og lokale faglige temalag er ikke med. Kilde og forbehold åbnes med ⓘ.
Omgivelserne vises i 1:50 mio. fra et helt verdenskort, så der ikke mangler
land ved panorering eller i brede vinduer. De to lokale kortfiler på i alt ca.
841 kB hentes først ved valg af Danmark.
Kun synlige baggrundspolygoner projekteres ved træk og zoom; kyster og data
ændres ikke ved denne frasortering.

Træk/piletaster flytter landekortet; +/−, hjul med fokus og tofingerzoom ændrer
kortets forstørrelse (1–8×). Nulstil/Home viser hele Danmark igen. **← Globus**
eller Escape gendanner globussens tidligere vinkel, zoom og tilvalg. Pladelagene
er kun synlige på globussen. Steder, Processer, Søg og Island-modulet er bevaret.
Træk, knib og afbrudte berøringer udløser ikke landevalg.

`test/landekort.py` indgår i den samlede browsertest og kan køres særskilt.
Den kontrollerer fem elevskærme (1280×577, 1366×625, 1536×730, 390×750 og
640×625), tastatur/fokus, faktisk tryk på landgeometrien, zoom/panorering,
tilbage-navigation med alle pladetilvalg, skærmskift, touch/knib, datakilder,
Bornholm og kendte danske/udenlandske koordinater samt data-/modulfejl og nyt
forsøg. Prøverne bruger Chromium med WebGL deaktiveret. Safari, fysiske
telefoner og skærmlæser er ikke afprøvet i dette miljø.

## Faglig kortlægning og næste review

[#46](https://github.com/SimDeMe/smbi/issues/46) har nu en
[mapping af alle C-kernestofpunkter og faglige mål](KERNESTOF.md), et
[inventar over hele geografibiblioteket](SIMULATIONSOVERSIGT.md) og
[afprøvningsbelæg](gennemgang-46.json). Næste del er
[Claudes sammenligning med de lokale materialer](OVERDRAGELSE-CLAUDE.md)
og ejerens faglige review. Repositorygennemgangen udvider ikke automatisk
atlasregisteret og dokumenterer ikke fuld læreplansdækning.

## Versionsnummer

Headeren viser en kompakt version, fx **v406**, direkte fra `index.html`.
Når Atlas ændres, øges tallet med én i samme commit (fx `v406` → `v407`).
Ændringer andre steder på sitet ændrer ikke atlasversionen.

Sitet udgives som hidtil med GitHub Pages fra `main` / rod. Versionsnummeret
kræver ingen ekstra opsætning eller workflow. Git er ændringshistorikken.

## Arkitektur

- `index.html` og `atlas.css`: dansk, responsiv brugerflade. På brede skærme
  ligger kontrollerne i figurens hjørner. På smalle skærme ligger de under den.
  Fokus skjuler site-header og introduktion uden browserfuldskærm.
- `modeller.js`: redigerbart register over steder og simulationer.
- `atlas.js`: stedliste, procesfiltre, søgning og detailkort i en native dialog.
  Navigationen starter før globussen, så den også virker ved kortfejl.
- `information.js`: fælles, ikke-modal visning af supplerende forbehold og
  datakilder; samme betjening i stedkort og kortets oplysninger i Hjælp.
- `globus.js`: D3's ortografiske projektion tegnet med Canvas 2D. Den håndterer
  horisontklipning, landegrænser, bredde-/længdegrader og projektion af markører.
  Canvas bruger højst dobbelt pixeltæthed; kun ændringer udløser tegning.
- `landekort.js`: separat Mercatorvisning af Danmark i samme store kortområde.
  Hentes først ved landevalg; globussens vinkel, zoom og pladelag bevares.
- `pladelag.js`: valgfrit pladegrænselag (#48). Henter først data, når laget
  slås til, og tegner signaturen i samme Canvas som globussen.
- `pladebevaegelse.js`: valgfrie navne for PB2002's 52 plader. Eulerberegningen
  er bevaret til uafhængig kontrol af modellens relative hastigheder.
- `graensehastigheder.js`: valgfrie hastigheder og pile ved grænserne, fra
  PB2002's publicerede komponenter på tværs og langs; også brugt i teksttabellen.
- `island/`: selvstændigt tværsnit af Den Midtatlantiske Ryg og Island
  (#49, milepæl B–C): SVG-tværsnit i 2D, drejelig blok i CSS 3D, vis/skjul-lag
  og illustrativ animation. Intet WebGL. Se `ISLAND-DEMO.md`.
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
`forklaring`, `modelnote` og `forbehold`. `modelnote` er en kort, altid synlig
modelbegrænsning; `forbehold` bevarer den fulde supplerende tekst.
Koordinater er **[længdegrad, breddegrad]** i grader,
med vestlige/sydlige værdier negative. Lister, procesfiltre og markører dannes
automatisk; globuskoden skal ikke ændres. Søgning bruger alle ord og normaliserer
store/små bogstaver, diakritiske tegn samt æ/ae, ø/oe og å/aa.

Stedmarkører er faglige adgangspunkter til generelle modeller. Island giver
adgang til pladegrænser og vulkanisme; Nordatlanten til havcirkulation; Alperne
til stigningsregn. Nordatlanten-markøren angiver en region syd for Grønland og
ikke et målt nedsynkningspunkt. Der vises ingen opdigtede plade-, terræn- eller
klimadata. Drivhuseffekten ligger under **Processer → Global atmosfære** og i
søgningen, uden en vilkårlig markør.

## Pladegrænselaget (#48)

Knappen **Pladegrænser** i værktøjslinjen slår et valgfrit lag til og fra
(`aria-pressed`). Data kommer fra Peter Birds model PB2002 (2003) og ligger i
`data/pladegraenser.json` (150 kB, 46 kB gzip). Den dannes reproducerbart med
`data/pladegraenser.py` ud fra Birds originalfiler; kilde, kontrolsummer,
licens og bearbejdning står i `data/pladegraenser.LICENSE`.

Bird klassificerer hvert ca. 45 km lange trin af grænserne i syv klasser ud fra
den beregnede relative bevægelse. Atlasset samler dem i skolens tre typer:

| Signatur | Type | Birds klasser |
| --- | --- | --- |
| Rød dobbeltlinje | Konstruktiv | OSR (oceanisk spredningsryg), CRB (kontinental rift) |
| Mørkeblå linje, tænder ved subduktion | Destruktiv | SUB (subduktion), OCB, CCB (oceanisk/kontinental konvergens, fx Himalaya) |
| Grøn stiplet linje | Bevarende | OTF, CTF (oceanisk/kontinental transformforkastning) |
| Skraveret flade | Bred, diffus zone | Birds 13 orogener, hvor deformationen er spredt |

Linjeform og tænder gør typerne skelnelige uden farve. Tænderne sidder på den
overliggende plade efter Birds polaritet (`/` og `\` i grænsenavnet); det er
kontrolleret visuelt ved Kurilerne, Japan, Marianerne og Andesbjergene.
Stikprøver af klassifikationen: Island og Midtatlantiske Ryg = OSR (EU-NA),
Østafrikanske riftzone = CRB (SO-AF), San Andreas og Nordanatoliske forkastning
= CTF, Himalaya = CCB.

Faglige forbehold vises i signaturen («Model (Bird 2003), ikke målte linjer»)
og fuldt under **Undersøg og kilde → ⓘ Om data**: grænserne er en geologisk
model, ikke skarpe observerede linjer; typen kan skifte langs samme grænse;
bevægelserne bygger på en ældre pladebevægelsesmodel; mikroplader kræver plads
og zoom for at få navn; laget viser ikke jordskælv, vulkaner eller dybhavsgrave.

Samme dialog har en kort undersøgelsesopgave (seks spørgsmål om mønstre,
Island, transformforkastninger, subduktion, hotspot og modelkritik), en knap
der viser Island med laget, og links til `pladegraenser.html` og
`vulkanudbrud.html`. Den kan også åbnes fra **Processer → Undersøg
pladegrænserne**, uafhængigt af grafikken. **Modellen i tekst** er en foldbar
oversigt over typer og geografiske eksempler; ved fejl i selve globussen er
den åben fra start. DOI, versionsbundne originaler og licens er klikbare.
Brede skærme viser signaturen i figurens venstre hjørne
i stedet for globusnoten; smalle skærme viser den under betjeningen. Kan
data ikke hentes, vises en statusbesked med vej til tekstalternativet, knappen
forbliver slået fra, og globussen virker uændret. Et nyt forsøg kan hente
data; efter en fejlet ES-modulimport kan browseren kræve genindlæsning.

Selve `pladelag.js` importeres først ved tilvalg. Et manglende lagmodul må
derfor ikke forhindre den almindelige globus i at starte. Før tegning
kontrolleres klasser, koordinaters type/interval, linjernes længde,
subduktionssider og lukkede orogenringe. Ugyldige data afvises; fx må `null`
ikke blive fortolket som 0° og tegne en forkert linje. Tastaturfokus bevares
på tilvalgsknappen efter den asynkrone indlæsning.

Efterkontrollen mod de versionsbundne originaler bevarer alle **5.819 trin
i 1.719 linjer og 13 orogener**, inklusive klassifikation og subduktionsside.
Peru-ringen var ikke lukket i originalen; eksportøren gentager nu startpunktet,
så D3 beholder alle kildepunkterne i en gyldig GeoJSON-ring. Der tilføjes ingen
gættede koordinater. SHA-256 og præcise downloadadresser står i licensfilen.

Laget understøtter K1 og F2/F4/F7 i [kernestofkortet](KERNESTOF.md): geografiske
mønstre, valg af kortlag og modelkritik. Det dokumenterer ikke i sig selv
elevernes målopfyldelse. Jordskælvs- og vulkankataloger er fortsat senere
leverancer og indgår ikke i dette lag.

### Pladenavne og hastigheder ved grænserne

Åbn **Pladegrænser → Visning**. **Pladenavne** og **Pile og grænsehastighed**
er uafhængige tilvalg. De er slukket fra start og huskes ved fra-/tilvalg af
pladegrænselaget i samme besøg. Indstillingerne åbnes midlertidigt oven på
figuren og gør ikke globussen mindre. Escape og klik udenfor lukker dem;
i fokusvisning lukker første Escape indstillingerne, næste afslutter fokus.

Hastighederne står **ved grænserne**, med henvisningslinje og et kildepunkt.
Etiketterne viser kun tal og enhed, fx **1,8 cm/år** (samt ≈ ved usikre tal).
Pile og grænsetype viser bevægelsens karakter:

- Samlet åbning på tværs af en konstruktiv grænse.
- Samlet lukning på tværs af en destruktiv grænse.
- Forskydning langs en transformforkastning.

Alle tal er cm/år **mellem de to naboplader**. De er ikke halvspredning eller
hastigheden af én plade i forhold til en fast tredje plade. Den gamle
referencevælger og hastighederne ved pladernes navnepunkter er derfor fjernet.
Pile på hver side viser relativ retning uden hastighedsskala; de angiver ikke
lige store absolutte hastigheder for de to plader. Begge komponenter kan være
til stede ved skrå bevægelse. ≈ markerer mere usikre modeltal i diffuse zoner;
langs den hypotetiske Shetlandplade vises ingen tal/pile.

Den synlige signatur forklarer komponenterne, cm/år og ≈. Overlap med markører,
andre etiketter, betjening og figurens kant undgås. Zoom og rotation viser
flere lokale værdier. De tre bevægelsestyper får på skift plads ved udvælgelsen,
så mange transformstykker ikke skjuler en tilstødende spredningsryg.

**Undersøg og kilde → Hastigheder ved pladegrænserne** lader eleven vælge et
pladepar. Tabellen viser lokale koordinater og begge komponenter, også når
selve globussen ikke virker. **Alle pladenavne** giver fortsat alle 52 navne.

`data/graensehastigheder.json` (117 kB) dannes reproducerbart af
`data/graensehastigheder.py`. Der udtages 1.937 originaltrin blandt Birds 5.819,
ved midten af højst ca. 400 km lange intervaller med ens grænse, klasse og
orogenstatus. Hvert punkt beholder det valgte trins lokale komponenter uændret;
tallene gennemsnittes eller halveres ikke. Midtpunktet beregnes sfærisk.
Browseren omregner blot kildens mm/år til cm/år. Data og modul hentes først
ved tilvalg eller åbning af tabellen. Kilde, licens, kontrolsum og bearbejdning
står i `data/graensehastigheder.LICENSE`.

`data/plader.json` (ca. 7 kB) kommer fortsat fra Birds 52 pladepolygoner og poler.
Navnepunkterne er kartografiske ankre inde i polygonerne, ikke målestationer.
Kilde og ODC-By 1.0 står i `data/plader.LICENSE`. Hastighederne er den ældre
PB2002-model, ikke aktuelle GPS-målinger eller bevægelsen under et jordskælv.
Der er ingen nye biblioteker eller build til elevsiden.

## Supplerende faglig information

Brug `lavInformation({navn, introduktion, note, tekst, overskrift})` fra
`information.js`, når forbehold, kilder eller usikkerheder skal kunne åbnes
efter behov. Funktionen returnerer et DOM-element med en rigtig ⓘ-knap ved
beskrivelsen og et navngivet informationsområde. Standardoverskriften er
**Om modellen**; kortgrundlaget bruger **Om kortet**. Tekst indsættes med
`textContent`, og id'er til `aria-controls`/`aria-labelledby` dannes automatisk.

Klik, tap, Enter og Space åbner/lukker. Overskriften får fokus ved åbning;
Escape og områdets luk-knap lukker kun informationen og returnerer fokus til
ⓘ-knappen. Klik udenfor lukker også. Panelet følger indholdets flow, så det
ikke dækker andre kontroller eller kræver en ekstra modal. Det rulles til syne
uden animation. Ved skift af indhold og lukning af værtsdialogen kaldes
`lukInformation()`, så en gammel visning ikke overtager fokus eller Escape.

Gem kun **supplerende** tekst bag ikonet. Oplysninger, der er nødvendige for
at fortolke den aktive model, skal blive i `introduktion` eller den synlige
`note`; de globale modellers korte mærkning som idealiserede modeller bliver
også stående. Eksisterende forbehold må ikke slettes fra dataregistret.

## Afhængigheder og kilder

Alle nødvendige kortressourcer serveres fra eget site. Ingen CDN-kald ved brug.

| Ressource | Version | Oprindelse og licens |
| --- | --- | --- |
| d3-array | 3.2.4 | [D3](https://github.com/d3/d3-array), ISC; `vendor/d3-array.LICENSE` |
| d3-geo | 3.1.1 | [D3](https://github.com/d3/d3-geo), ISC; `vendor/d3-geo.LICENSE` |
| topojson-client | 3.1.0 | [TopoJSON](https://github.com/topojson/topojson-client), ISC; `vendor/topojson-client.LICENSE` |
| countries-110m.json | world-atlas 2.0.2 | [world-atlas](https://github.com/topojson/world-atlas), ISC; `data/world-atlas.LICENSE` |
| countries-50m.json | world-atlas 2.0.2, 1:50 mio. | Uændret baggrundskort, samme world-atlas/Natural Earth-licens; kontrolsum i `data/danmark-10m.LICENSE` |
| danmark-10m.json | Udtag af world-atlas 2.0.2, 1:10 mio. | Natural Earth, public domain; kildens SHA-256 og bearbejdning i `data/danmark-10m.LICENSE` |
| pladegraenser.json | PB2002 (Bird 2003) | [doi:10.1029/2001GC000252](https://doi.org/10.1029/2001GC000252), ODC-By 1.0 via [fraxen/tectonicplates](https://github.com/fraxen/tectonicplates); `data/pladegraenser.LICENSE` |
| plader.json | PB2002 (Bird 2003), tabel 1 | Samme kilde/licens; poler og pladepolygoner, bearbejdet som beskrevet i `data/plader.LICENSE` |
| graensehastigheder.json | PB2002 (Bird 2003), tabel 2 | Samme kilde/licens; lokale komponenter, kildeudtag og koordinater i `data/graensehastigheder.LICENSE` |

D3, TopoJSON og world-atlas er hentet uændret fra `https://cdn.jsdelivr.net/npm/<pakke>@<version>/`
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

Island-forløbet har desuden en røgtest i Firefox og WebKit (Playwrights egne
browsere): `cd atlas/test && python3 andre_browsere.py [firefox] [webkit]`.

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

`test/pladelag.py` indgår også og afprøver #48 på alle fem visninger: laget
slås til/fra med `aria-pressed`, canvas ændres og vender tilbage til
udgangspunktet, signaturen har alle fire typer og overlapper ingen kontroller,
opgavedialogen har seks spørgsmål, kildeinformation med DOI og licens samt de
to model-links, og «Vis Island med pladegrænser» lukker dialogen og centrerer.
Enter/Space kontrolleres med bevaret fokus. Særskilte prøver afbryder
lagmodul eller data og tilfører ugyldig JSON, `null`, ulige koordinatliste,
breddegrad over 90°, åben ring, forkert klassemapping og manglende grænsetype.
Globussen skal forblive uændret, knappen slået fra og tekst/opgave tilgængelig.
Prøverne kontrollerer også nyt forsøg efter datafejl, genindlæsning efter
modulfejl og skift mellem brede/smalle vinduer med laget aktivt. Touch-rotation
og tofingerzoom køres med laget slået til. Fejl i grundkort/bibliotek/Canvas
bevarer også adgang til opgaven gennem Processer.

Datakontrollen kan køres uden browser eller netadgang:

```sh
python3 atlas/test/pladedata.py
# Valgfrit: alle originaltrin kontrolleres mod de hentede, versionsbundne filer
python3 atlas/test/pladedata.py --originaler /mappe/med/PB2002-filer
node atlas/test/pladebevaegelse.mjs
node atlas/test/pladebevaegelse.mjs --originaler /mappe/med/PB2002-filer
node atlas/test/graensehastigheder.mjs --originaler /mappe/med/PB2002-filer
# Genskab hastighedspunkter fra den versionsbundne kilde:
python3 atlas/data/graensehastigheder.py /mappe/med/PB2002-filer/PB2002_steps.dat.txt
```

Den kontrollerer geografiske stikprøver ved Island, San Andreas, Himalaya,
Andes og Japan samt de syv klasser og ringlukning. Med originalerne
kontrolleres SHA-256, samtlige segmenter/kildepunkter og subduktionssider
uafhængigt af eksportørens funktioner, med højst 0,005° ændring pr. koordinat
fra den dokumenterede afrunding til 0,01°.

`test/pladebevaegelse.mjs` kontrollerer analytiske hastigheder, poler,
breddegradsafhængighed, nulhastighed og referenceskift. Med originalerne
kontrolleres alle 52 poler uændret, alle pilepunkter inde i kildepolygonerne
og alle 5.819 relative trinbevægelser mod Birds uafhængige tabel (mm/år og
heltalsgrader). Største forskel er 0,00730 cm/år og 0,506°.
Eksporten er reproduceret med byte-identisk `plader.json`.

`test/graensehastigheder.mjs` kontrollerer fortegn, omregning til cm/år,
samlet spredning, uafhængige stikprøver ved Island, Andes, San Andreas og Japan,
og alle 1.937 punkters tal/flag/placering mod originalen. Begge komponenter for
alle 5.819 trin sammenholdes også med Eulerberegninger under hensyn til
azimuttabellens afrunding til hele grader. Originalens publicerede komponenter
bruges direkte, så kortgeometriens afrunding ikke forringer tallene.

`test/pladevisning.py` indgår i browsertesten: uafhængige tilvalg, faktisk
ændring af canvas, bevaret figurstørrelse og gendannelse efter fravalg.
De faktisk tegnede ankre og etiketter matches mod de rigtige kildepunkter,
komponenter og enheder. Den kontrollerer alle 52 navne, pladeparvælger,
begge komponenter ved Island/Andes/San Andreas, Shetland, ≈-markering,
piletaster i indstillinger og Escape i fokusvisning. Netværks-/modulfejl,
ugyldig JSON, null, ugyldig breddegrad, dublet-ID og forkert enhed skal lade
grundkort og allerede valgte navne fungere med mulighed for nyt forsøg.
Touch kører med navne og grænsehastigheder aktive; vinduet ændres mellem alle
fem størrelser med åbne indstillinger. Tabellerne virker også uden
kortbibliotek, kortdata og Canvas 2D.

`test/information.py` indgår også og afprøver #50 på alle fem visninger:
samtlige stedtekster, synlige modelbegrænsninger, tap/klik/Enter/Space,
Escape uden at lukke værtsdialogen, luk-knap, klik udenfor, fokusretur,
ARIA-referencer, datakilder i Hjælp og oprydning ved indholdsskift. Den måler,
at det åbne informationsområde kan læses uden vandret rulning eller overlap
med dialogens navigation. Skærmbilleder gemmes sammen med de øvrige atlasprøver.

## Teststatus — 14. oktober 2026

Bestået i headless Chromium på 1280×577, 1366×625, 1536×730, mobil 390×750
og smal sidevisning 640×625. Ingen JavaScript- eller konsolfejl ved normal
brug. Alle funktioner og de tre fejltilstande i browsertesten består, også
med WebGL deaktiveret. Skærmbilleder er visuelt gennemgået.

Regressionen for #51 blev først reproduceret med den gamle canvas-lytter.
Efter rettelsen består global piletastnavigation og undtagelserne på alle fem
visninger sammen med de eksisterende atlasprøver.

Informationsvisningen i #50 består tilsvarende på alle fem visninger. De fulde
forbehold og datakildetekster er bevaret; globuskode, koordinater og model-links
er uændrede. De korte nødvendige modelbegrænsninger forbliver synlige.

På de tre laptopstørrelser er både globus og primære kontroller synlige uden
scroll; figurfladerne er henholdsvis 1228×391, 1314×439 og 1484×544 px.
I brede, lave vinduer (≥900 px bredt, ≤760 px højt) er introen kompakt og
uden undertekst, så kloden får cirka 28 px mere højde. «Steder» har ikke
længere en fast lyseblå baggrund, der fik den til at ligne en valgt fane.
Fra 900 px bredde ligger hjælpelinjen («Drej med træk …» og linket til
Processer) i værktøjslinjens tomme midte i stedet for under figuren, hvor den
blev skåret af. Siden fylder dermed præcis skærmhøjden uden rulning.
DOM-rækkefølgen er uændret; smallere vinduer har linjen under figuren.
Mobil har en 366×410 px figur og betjening under den. Ingen vandret rulning
på nogen af de fem størrelser. Fokus giver mere plads uden browserfuldskærm.

Alle seks simulationssider er desuden åbnet med HTTP 200 og uden JavaScript-fejl.
Forside, geografibibliotek og de seks simulationsfiler er byte-identiske med
udgangspunktet. Sitemap indeholder nu `/atlas/`.

Hele browsertesten består også i headless Chromium på macOS (Playwright,
Chrome for Testing). Piletastprøven er gjort platformsuafhængig: den venter på
dialogens asynkrone close-event, sætter tekstmarkøren direkte (End flytter den
ikke på macOS) og tjekker select uden at forvente Linux' værdiskift på ↓.

En kortere røgtest i Playwrights WebKit (Safari-motoren) og Firefox på
1366×625 og 390×750 med touch består: siden indlæses uden konsolfejl,
piletaster drejer globussen efter klik på topbaren, markørkort og søgning
virker, og der er ingen vandret rulning.

Ikke afprøvet på fysiske telefoner, i en egentlig Safari-app eller med en
skærmlæser. Touch er testet gennem Chromiums inputprotokol. Ingen ændringer
af simulationsmodeller; deres faglige beregninger genvalideres ikke her.

### Pladegrænselaget (#48)

Hele browsertesten med `test/pladelag.py` består i headless Chromium på macOS
på alle fem visninger, også med WebGL deaktiveret, og uden konsolfejl.
Figurfladerne er uændrede. På ≥900 px ligger signaturen i figurens venstre
hjørne (290 px bred), hvor den ikke dækker kloden ved zoom 1× på 1280×577;
ved større zoom kan den dække kanten af kloden. Under 900 px ligger den under
betjeningen, så den ved 640×625 og 390×750 kræver lodret rulning, mens globus
og betjening fortsat er synlige samtidig. På telefon (≤500 px) er ikonerne i
værktøjslinjen skjult og knappen hedder «Plader», så de fem knapper står på
én linje ned til 320 px. Med laget koster en omtegning ca. 10 ms mere i headless
Chromium ved 1536×730 og dobbelt pixeltæthed (40 rotationer: 45 mod 34 ms pr.
to billeder); fysisk telefon og Safari er ikke afprøvet.

**Supplerende review og færdiggørelse 14. oktober 2026:** hele Chromium-prøven
består også på Linux på alle fem visninger, uden WebGL og med reduced motion,
inklusive de nye fejltilstande, tekstalternativ, tastaturfokus og touch med
laget. Alle seks simulationslinks svarer HTTP 200; ingen JavaScript-/konsolfejl
ved normal brug. Skærmbilleder er gennemgået på alle fem visninger samt ved
Japan, Andes og datolinjen. Figurflader og centrale kontrollers placering er
uændrede. Dataprøven mod originalerne består for alle 5.819 trin og 13 orogener.
En lokal måling med 40 drejninger og to tegningsrammer pr. drejning på
1366×625 ved dobbelt pixeltæthed gav ca. 44 ms uden og 63 ms med laget;
det er en headless-måling på denne maskine, ikke en måling på elevhardware.

De nye rettelser er ikke efterprøvet i Firefox/WebKit her. Firefox 153 kunne
installeres, men startede ikke i dette cloudmiljø (sandbox-/softwaregrafikfejl
før nogen side blev åbnet). Den tidligere macOS-røgtest ovenfor gælder
udgangspunktet. Fysisk telefon, egentlig Safari og skærmlæser står fortsat
som opfølgning i #47; de er ikke markeret som gennemført.

### Første udgave med pladenavne og pladebevægelser — 14. oktober 2026

Den samlede udvidede Chromium-prøve består på alle fem skærmstørrelser,
med WebGL deaktiveret og reduced motion, inklusive navne, pile, referenceskift,
tabel, tastatur, fokus, touch og fejl-/gentagelsesforløb. Ingen JavaScript-
eller konsolfejl ved normal brug; alle seks simulationslinks svarer HTTP 200.
Skærmbilleder af globus, indstillinger og tabel er gennemgået. Figurfladerne
har præcis samme størrelse som før tilvalgene; ingen vandret rulning.

Der er ingen ændringer af de eksisterende simulationsfiler eller deres
beregninger. De nye tilvalg er her kun testet i Chromium; fysisk telefon,
Firefox, Safari/WebKit og skærmlæser er fortsat ikke efterprøvet for ændringen.

### Grænsehastigheder — efterfølgende rettelse 14. oktober 2026

Tilvalg og tabeller består på 1280×577, 1366×625, 1536×730, 390×750 og
640×625 i Chromium. Regressionen dækker alle fem visninger, touch, de tre
grundkortfejl, pladegrænsefejl og navnefejl uden JavaScriptfejl. Desuden består
grænsehastighedernes syv fejl-/gentagelsesforløb og skærmstørrelsesskift.
Alle faktisk tegnede tal og ankre er kontrolleret mod de lokale kildepunkter;
de står ikke ved pladernes navnepunkter.

Alle 1.937 udtagne punkter og begge hastighedskomponenter matcher originalen
uændret. De 5.819 Eulerbaserede komponentkontroller består, og dataeksporten er
byte-identisk ved gentagelse. Skærmbilleder er gennemgået på alle fem
visninger og ved Island, Andes, San Andreas og Japan. Figurflader og
primære kontroller er uændrede; ingen vandret rulning eller ændringer af
simulationer. De nye rettelser er ikke afprøvet på fysisk telefon,
Safari/Firefox eller med skærmlæser.

En lokal headless-måling ved 1366×625 og dobbelt pixeltæthed gav ca. 81 ms
uden lag og 88 ms med grænser, navne og hastigheder pr. drejning inklusive to
tegningsrammer (40 drejninger). Det er en relativ måling på denne maskine,
ikke en måling på elevhardware.

## Mulig fase 2

Flere redaktionelt kvalitetssikrede steder og modeller; delbare atlasvalg via
URL; egentlige elevopgaver; stedbundet data med kilde og usikkerhed;
bedre markørgruppering ved et større katalog. Zoom ind i et rumligt tværsnit
kan tilføjes som et separat modul uden at ændre simulationernes URL'er.
