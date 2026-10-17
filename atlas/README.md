# Atlas

Selvstændig indgang på `/atlas/` til seks eksisterende simulationer. Ingen build,
login eller ændringer af modellerne. Forsiden og `geografi.html` er uændrede.

## Samlet lagmenu (v447)

Globussens syv lagknapper er samlet under én **Lag**-knap med tre
sammenfoldelige underpunkter:

- **Geologi:** pladegrænser, havbundens alder, jordskælv og vulkaner.
- **Klima:** klimazoner med valg af Vahl eller Köppen-Geiger og nedbør måned for måned.
- **Demografi og levevilkår:** landenes 17 nøgletal, samlet i Befolkning,
  Fødsel og død samt Udvikling.
- **Klimaforandringer** (v449–): nationale og forbrugsbaserede CO₂-udledninger og alle drivhusgasser.

Menuen viser samlet antal aktive lag, antal i hvert underpunkt og navnene på
de aktive lag. Nøgletal og klimasystem kan vælges direkte i menuen og følger
også ændringer foretaget i signaturerne. Eksisterende filtre, profiler,
pladenavne, pile, kildevisninger og genveje fra Processer bruger samme
lagtilstand som før. Klimazoner og temakort udelukker stadig hinanden.

`lagmenu.js` håndterer menu, placering, tilstandsspejling og tastatur. Menuen
er en native popover med almindelige details- og formularfelter, ikke en
ARIA-menu med specialroller. Den ændrer ikke figurens størrelse. Escape og
Luk giver fokus tilbage til Lag; piletaster i menuen drejer ikke globussen.
I quizzen og Danmarkskortet skjules menuindgangen. Indikatornavne hentes
først, når Demografi åbnes; selve demografidataene hentes ved valg af lag.

`test/lagmenu.py` afprøver menuen på de fem elevskærme med direkte valg,
synkronisering, fem samtidige lag, touch, tastatur og fokusvisning. De
øvrige lagtests åbner nu lagene gennem menuen med `lagmenu_hjaelp.py`.
Skærmbilleder i `/tmp/smbi-lagmenu-test/` er gennemgået i Chromium.
Menu- og lagforløbene består på alle fem størrelser; fejl og nyt forsøg
vises også i selve menuen. De tre laptopfigurer bevarer højderne 391, 439 og 544 px. Fysisk mobil,
Safari og skærmlæser er ikke særskilt afprøvet.

## Nedbør måned for måned (v445)

Knappen **Nedbør** farver hele kloden – hav og land – efter den gennemsnitlige
nedbør i hver måned. Månedsskyder og **Afspil** viser, hvordan regnbæltet ved
ækvator (ITK) og monsunen flytter sig gennem året (B4 i INDHOLD.md).

- **Data:** GPCP Monthly v2.3 (NOAA CDR; satellit og regnmålere, 2,5°),
  klimanormal 1991–2020 i mm pr. måned. NOAA's egne servere kunne ikke nås;
  filerne er hentet uændret fra NOAA's åbne AWS-spejl. `data/nedboer.py`
  danner `nedboer.bin` (12 × 144 × 72 uint16, gzippet 186 kB), som hentes
  først ved tilvalg. Vilkår og kontroltal i `data/nedboer.LICENSE`.
- **Tegning:** raster *over* landfladerne (`tegnFlade`, nyt i `globus.js`);
  kystlinjen tegnes igen ovenpå, og musen fremhæver kun landets kant. Hver
  pixels celle og vægte gemmes for den aktuelle projektion, så et
  månedsskift kun farver om. Groft under drejning, skarpt når kloden står stille.
- **Afspilning (v446):** tiden løber jævnt, 2,5 s pr. måned (et år på 30 s),
  uden pauser: farverne (blandet i gitteret) og zenitlinjen glider hele tiden
  fra én måneds middel mod den næstes, og navnet, skyderen og aflæsningen
  skifter halvvejs. Under afspilning farves der i 0,75 px pr. px, så hver
  frame når at blive tegnet; Pause lander på den viste måned. Med
  `prefers-reduced-motion` springes der fra måned til måned i samme tempo.
- **Klasser:** 10 klasser i mm pr. måned (0, 10, 25, 50, 75, 100, 150, 200,
  300, 400), sand → grøn → blå → violet. Klassegrænserne tegnes som svage
  linjer (isohyeter). Ækvator (hel) og vendekredsene (prikker) står ovenpå,
  og en orange linje viser **solens zenitbredde** midt i måneden (Spencer
  1971; kan slås fra), så ITK kan sammenlignes med solen.
- **Aflæsning:** mm i måneden og på et år ved musen eller sigtekornet og et
  lille søjlediagram over punktets 12 måneder (som nedbørssøjlerne i et
  klimadiagram), den viste måned fremhævet.
- **Udelukker** Havbund, Klimazoner og Temakort (de farver også fladerne);
  Pladegrænser, Jordskælv og Vulkaner kan ligge ovenpå.
- **Undersøg og kilde** (også under Processer): mønstret i tekst, ni
  spørgsmål (ITK og solen, land/hav, monsun, Sahel, Lagos' to regntider,
  ørkenbæltet, middelhavsklima mod Vahls maki, Bergen/København,
  modelkritik af 2,5°-celler og satellitmåling), genvej til juli over Afrika
  og Sydasien, og kilder.
- **Lagmenuen (v447):** Nedbør ligger under Klima sammen med klimazonerne.
- Test: `node atlas/test/nedboer.mjs` (fil, nøgletal, kendte steder, ITK,
  zenitbredde, projektion mod D3, overgang) og `test/nedboer.py` (fem skærme,
  skyder, afspilning, zenitlinje, aflæsning, lagudelukkelse, dialog, fejl og
  nyt forsøg) i `test/afproev.py`.

## Bjergarternes kredsløb (v442)

Ny model på `/atlas/bjergarternes-kredsloeb/` (A7) med modelkort under emnet
«Bjergarter», under «Undersøg havbundens alder» og som link fra øvelseskortet
på `geografi.html`. Tre dele: *Stenens rejse* (en sten gennem kredsløbet med
tider, steder og udfordringer), *Hvor dannes stenene?* (skematisk snit over
pladegrænserne med quiz på skolens stensamling) og *Afkøling og korn*
(afkølingstid t ≈ (h/2)²/κ og krystaller under en lup). Stensamlingens data,
fotos og tegninger genbruges direkte. Se `bjergarternes-kredsloeb/README.md`
for model, tal, kilder og test. Atlastestenes antal modelkort er rettet til 9.

## Havbundens alder (v441)

Knappen **Havbund** farver havbunden efter alder (A3 i INDHOLD.md). Data er
Seton m.fl. (2020), EarthBytes aldersgitter age.2020.1.GeeK2007 (6′), hentet
uændret via pyBacktrack 1.5.0 på PyPI, fordi earthbyte.org ikke kunne nås
herfra. Se `data/havbundsalder.LICENSE` – **licensteksten for 2020-gitrene er
ikke bekræftet** og bør læses i EarthBytes README.txt.

- **Data:** `data/havbundsalder.py` samler gitteret til 0,2° og 0,2 mio. år,
  gemmer rækkerne som forskelle og gzipper: 347 kB, hentes først ved tilvalg
  og pakkes ud med `DecompressionStream` (fejltekst i ældre browsere).
- **Tegning:** et raster *under* landfladerne (`tegnUnder` i et temalag; nyt i
  `globus.js`). Hver skærmpixel regnes baglæns gennem den ortografiske
  projektion og slås op med bilineær interpolation; testen kontrollerer, at
  formlerne rammer D3's `geoOrthographic().invert`. Under drejning tegnes groft
  (0,4 px pr. px) og skarpt, når kloden står stille; uændret projektion genbruges.
- **Klasser:** 11 × 20 mio. år, ColorBrewer Spectral (rød = ung). Klassegrænserne
  tegnes som tynde, mørke linjer (isokroner). Grå = ingen havbundsalder
  (kontinental skorpe, fx Nordsøen, eller ingen data). Farve er ikke eneste
  signal: aflæsningen giver alder og geologisk tid (GTS2012, som gitteret).
- **Profil:** fem faste profiler på tværs af ryggene (Sydatlanten, Nordatlanten,
  Reykjanesryggen, Østpacifiske Ryg, Australien–Antarktis) eller egen profil
  med to tryk på kloden (tastatur: Enter i sigtekornet). Grafen er en skyder
  (`role=slider`, piletaster, Shift ×10, Home/End): afstand fra ryggen, alder
  og gennemsnitlig halv spredningshastighed = afstand/alder (1 km/mio. år =
  0,1 cm/år). Ryggen er profilens yngste punkt under 5 mio. år. Kontrol i
  node: Atlanten 1,2–2,5, Reykjanes 1,0–1,6, Østpacifik 5–11 (tydeligt
  asymmetrisk) og Australien–Antarktis 2,8–4 cm/år.
- **Undersøg og kilde** (også under Processer): mønstret i tekst, sådan måles
  hastigheden, otte spørgsmål (symmetri, hastigheder, PB2002-sammenligning,
  subduktion og den manglende gamle havbund, Island, egen profil, modelkritik
  om magnetiske striber og kridttidens stille zone) og kilder.
- **Mobil:** seks lag – Fokus rykker op på første række under 500 px.
- Test: `node atlas/test/havbundsalder.mjs` (gitter, kendte steder, profiler,
  projektion) og `test/havbund.py` (fem skærme, mus/touch/tastatur, egen
  profil, dialog, fejl og nyt forsøg) i `test/afproev.py`.

## Klimaforandringer: havniveau ved kysten (v457)

Laget **Havniveau ved kysten** viser 362 vandstandsmålere fra PSMSL (Revised
Local Reference, årsmidler) som punkter farvet efter tendensen 1960–2024 i
mm/år (lineær regression). Kun stationer med mindst 40 års data, start senest
1975 og slut tidligst 2010 (`data/havniveau.py` → `havniveau.json`). Tallene
er relative til land: lilla, hvor landet hæver sig efter istiden (Botniske
Bugt, Nordjylland), orange, hvor havet stiger (Vadehavet, Mexicanske Golf).

- Signaturen har klasser med antal stationer, medianen (+2,0 mm/år) og en
  lille graf med den aflæste stations årsmidler og tendenslinje.
- Punktlag; kan ligge oven på fx Temperaturstigning.
- **Undersøg og kilde**: syv spørgsmål (Danmark og landhævning, Stockholm,
  synkende deltaer, stationer mod satellitter, årsager, stormfloder,
  datakritik). Test: `test/havniveau.py`.

## Klimaforandringer: havisens udbredelse (v456)

Laget **Havisens udbredelse** viser NSIDC Sea Ice Index v4: områder med mindst
15 % havis i marts og september for 1980, 1990, 2000, 2010, 2012, 2020 og 2025
i Arktis og Antarktis, med NSIDC's median 1981–2010 som orange stiplet linje
(kan slås fra). `data/havis.py` omregner NSIDC's shapefiler fra polær
stereografisk projektion, forenkler med 10 km og fjerner isflager under
2000 km² (`havis.json`, 180 kB gzip). `havis.js` vender ringe med forkert
omløb, så polygoner om polen tegnes rigtigt i D3.

- Signaturen viser udbredelsen i mio. km² og medianen for begge poler og en
  lille graf over hele serien 1979–2025 for den valgte måned (skjules under
  640 px højde). Knapperne Vis Arktis/Vis Antarktis drejer kloden.
- Punktlag: kan vises sammen med alle andre lag, fx Temperaturstigning.
- **Undersøg og kilde**: syv spørgsmål (udvikling, årstider, poler, albedo,
  havis mod indlandsis, datakritik). Test: `test/havis.py`.

## Klimaforandringer: temperaturstigning (v455)

Laget **Temperaturstigning** viser NASA GISTEMP v4: afvigelse fra 1951–1980 i
2° celler (land og hav, 1200 km udglatning), middel for hvert årti 1900–1909 …
2010–2019 og 2020–2025. Dannes af `data/temperatur.py` til
`data/temperatur.bin` (140 kB gzip), som nedbørslaget: raster over hav og land,
geometrien gemmes pr. projektion, periodeskift farver kun om.

- **Periodeskyder** med Afspil (et årti pr. 1,4 s, stopper i 2020–2025).
- Divergerende skala (ColorBrewer RdBu) fra under −1 til over +3 °C; celler
  med data i under halvdelen af månederne er grå (fx Arktis før 1950).
- Signaturen viser det arealvægtede globale middel (ca. −0,3 °C i 1900'erne,
  +1,1 °C i 2020–2025). Ækvator og polarcirklerne tegnes ovenpå.
- Dækker hav og land og udelukker derfor nedbør, havbund, klimazoner og de
  farvede landekort.
- **Undersøg og kilde**: syv spørgsmål (Arktis og albedo, land/hav, forløb,
  »the cold blob« og Grønlandspumpen, grundperiode, datakritik).
- Kode: `temperatur.js`; test: `test/temperatur.py` i `test/afproev.py`.

## Klimaforandringer: nationale og forbrugsbaserede udledninger (v449)

Ny lagkategori **Klimaforandringer** i lagmenuen med to lag, der farver
landene efter CO₂-udledning (koropletkort med temakortets farver og signatur):

- **Nationale udledninger** (territoriale): CO₂ udledt inden for landets
  grænser – den opgørelse, der rapporteres til FN's klimakonvention.
- **Forbrugsbaserede udledninger**: CO₂ fra produktionen af det, landets
  indbyggere forbruger, uanset hvor varerne er lavet (import lagt til,
  eksport trukket fra).

Data: Global Carbon Budget 2025 via Our World in Data (CC BY 4.0), dannet med
`data/udledning.py` til `data/udledning.json` (30 kB, hentes først ved
tilvalg). Kun CO₂ fra fossile brændsler og industri, fordi det er det eneste,
der findes forbrugsbaseret; arealanvendelse, metan og lattergas er ikke med.
Forbrugsbaserede tal findes for ca. 120 lande fra 1990 til 2023; årene er
1990, 2000, 2010 og 2023 for begge, så kortene kan sammenlignes.

- **Mål:** pr. indbygger (t CO₂) eller i alt (mio. t CO₂). Begge opgørelser
  har samme faste klassegrænser. Kun på forbrugslaget: **Forskel** =
  forbrugsbaseret minus national i % af national (divergerende skala; orange =
  landet importerer udledninger, lilla = eksporterer).
- **Alle drivhusgasser** (v452): national opgørelse af CO₂, metan og
  lattergas i CO₂-ækvivalenter (GWP100) inkl. arealanvendelse (Jones m.fl.
  2025). Eget mål **Arealanvendelse**: andel af alle drivhusgasser fra
  skovrydning m.m. (under 0 = nettooptag).
- **Samlet udledning siden 1850** (v453): cirkler med areal ∝ landets
  samlede CO₂ 1850–1900/1950/1990/2023, fossil eller inkl. skovrydning
  (summeret i `data/udledning.py`). Cirklen står midt i landets største
  landområde (`data/landepunkter.mjs` → `landepunkter.json`, en enkel
  polylabel på Natural Earth 1:50m). Punktlag (`udledningscirkler.js`), der kan
  ligge oven på de farvede kort; signaturens referencecirkler følger zoom.
  Dialogen har rangliste med andel af verdens udledning.
- **Aflæsning** viser også den anden opgørelse i parentes (for drivhusgasser:
  den fossile CO₂ alene).
- De tre lag, temakortet, klimazoner og nedbør udelukker hinanden.
- **Undersøg, rangliste og kilde** (også under Processer): syv spørgsmål,
  rangliste for det valgte mål og år samt ⓘ Om data.
- Kode: `udledning.js` (bruger `temakort.js`' klasser og farver); globussens
  `visTemakort(modul)` aflæser i modulets `AFLAESNING`-felt.
- Test: `test/udledning.py` (farver, aflæsning, mål og år, skift mellem lag,
  rangliste, fejl og nyt forsøg) indgår i `test/afproev.py`.

## Temakort: landene farvet efter nøgletal (v440)

Knappen **Temakort** farver hvert land efter et nøgletal (koropletkort). Tallene
er de samme som i landemenuens Demografi-fane (`data/demografi.json`), så der
er ingen nye data; filen hentes først ved tilvalg og deles med fanen.

- **17 nøgletal** i tre grupper i en rullemenu: *Befolkning* (tæthed, tilvækst,
  naturlig tilvækst, nettomigration, byandel, medianalder, andel 0–14 og 65+ år),
  *Fødsel og død* (fødsels- og dødsrate, samlet fertilitet, spædbørns- og
  børnedødelighed, middellevetid) og *Udvikling* (HDI, BNI pr. indbygger i PPP,
  skolegang). Befolkningstal (antal) er udeladt med vilje: et koropletkort over
  antal får store lande til at fylde; det er et af Undersøg-spørgsmålene.
- **Årvalg** for tal med tidsserie (fødsels- og dødsrate, naturlig tilvækst,
  andel 0–14/65+): 1950, 1980, 2000, 2023, 2050*, 2100* som pyramiderne;
  * = FN's mellemvariant, markeret som fremskrivning i signaturen.
  Andre tal er for 2023.
- **Faste, runde klassegrænser** frem for kvantiler, med faglige grænser hvor
  de findes: fertilitet 2,1 (erstatningsniveau), UNDP's fire HDI-grupper og 0
  ved tilvækst og migration (divergerende lilla/orange skala; migration har en
  neutral klasse −1 til 1 ‰). Ellers sekventiel YlOrRd. Farver: ColorBrewer.
  Lande uden data er grå; Antarktis tegnes ikke.
- **Signatur** med klassernes intervaller, en lille søjle og antal lande i hver
  klasse (summen er alle 237 områder med data). Enhed og år står altid; den
  længere forklaring skjules på skærme under 640 px i højden.
- **Aflæsning** som i de andre lag: landet ved musen eller midt på globussen
  (sigtekornet). Musen fremhæver kun landets kant, så farven kan ses.
  Nordcypern og Somaliland viser FN's tal for hele landet og siger det.
- **Klimazoner og temakort udelukker hinanden**, da begge farver landfladerne.
  Valg af nøgletal og år huskes, når laget slås til igen.
- **Mobil:** lagknapperne har smallere polstring under 500 px, så de fem lag
  og Fokus står på én række ved 390 px og ikke skubber globussen ned.
- **Undersøg, rangliste og kilde** (også under Processer): syv spørgsmål
  (mønstre, sammenhænge, transitionsmodellen, fremskrivning, HDI/BNI,
  migration og kortkritik), rangliste for det valgte nøgletal med højeste og
  laveste 10 og alle lande (et tryk på landet åbner Demografi) samt ⓘ Om data.
  Ranglisten er også tekstalternativet til kortet.
- Kode: `temakort.js` (nøgletal, klasser, farver, aflæsning); globussen har
  `visTemakort(modul)` og fylder landene med én sti pr. farve.
- Test: `test/temakort.py` (farver for kendte lande, aflæsning, skift af
  nøgletal og år, optælling, klimalag, rangliste, fejl og nyt forsøg) indgår i
  `test/afproev.py`.

## Forsøgsvejledninger i atlasset (v433)

22 af vejledningerne under `Øvelser/Geografi/` er skrevet ind i `oevelser` i
`modeller.js` med samme titel og tekst som kortet på `geografi.html`. De vises
som en sammenfoldet liste under modelkortene: under hvert sted (`steder`;
`danmark` vises under Steder ved landekortet), under de tre undersøgelser i
Processer (`opgaver`: `plade`, `seismik`, `klima`), samlet nederst i Processer
og i søgningen, hvor listen foldes ud ved et fund. Stien er altid
`/Øvelser/Geografi/<id>/<id>.html` med `.pdf` ved siden af. Niveau angives kun,
hvor kortet på `geografi.html` har et. `test/oevelser.py` kontrollerer, at alle
filer findes, og at listerne vises de rigtige steder.

## Jordskælv og vulkaner som lag (v430, #48)

To nye knapper, **Jordskælv** og **Vulkaner**, viser observerede kataloger
oven på globussen. Sammen med pladegrænserne giver de det klassiske mønster:
lavtliggende skælv ved spredningsrygge og bevarende grænser, skælv der bliver
dybere ind over den overliggende plade ved subduktion, og vulkanbuer.

- **Jordskælv** (`jordskaelv.js`): USGS ComCat, M ≥ 5, 1976–2025, 83 469
  skælv, public domain. Farve = dybde i tre klasser (0–70, 70–300, over 300 km)
  med monoton lyshed (orange → magenta → mørkeblå), størrelse = magnitude.
  Farve er ikke eneste signal: hver dybdeklasse kan slås fra i signaturen, og
  magnitudegrænsen kan sættes til 6 eller 7. Projektionen regnes direkte i
  modulet (samme formel som D3's ortografiske) for at holde de 83 000 punkter
  under ca. 11 ms pr. billede; testen kontrollerer, at den rammer D3's punkt.
- **Vulkaner** (`vulkaner.js`): Smithsonian GVP, holocæne vulkaner (1 214).
  Sorte trekanter, så de ikke forveksles med skælvfarverne: fyldt = udbrud
  siden 1900, åben = tidligere eller udateret. Aflæsningen giver navn, land,
  type, tektonisk placering (GVP) og sidste udbrud.
- **Aflæsning** som i klimalaget: skælvet/vulkanen ved musen eller midt på
  globussen (sigtekornet), så den virker med piletaster og touch.
- **Undersøg og kilde** (også under Processer) har mønstret i tekst, seks
  opgaver, tal fra datasættene, ⓘ Om data og en knap, der viser Island med
  alle tre lag.
- **Fælles lagbetjening** (`lagknap.js`): knap, `aria-pressed`, signatur,
  body-klasse, indlæsning, fejltekst (i signaturen, hvis den er åben, ellers i
  kortstatus) og fokusretur er nu én funktion, som alle fire lag bruger.
  Globussen har `visTemalag(navn, modul)` til punktlag: et modul eksporterer
  `hent`, `tegn`, `aflaes`, `ORDEN` og `AFLAESNING`.
- **Layout:** signaturerne står i to kolonner over figuren på brede skærme
  (pladegrænser til venstre; skælv, vulkaner og klima til højre). Kolonnerne
  ruller selv, hvis alle lag er åbne på en lav skærm. Med fire lagknapper er
  der ikke plads til betjeningsteksten i værktøjslinjen under 1700 px; den
  står derfor under atlasset.
- Data: `data/jordskaelv.json` (1,4 MB, 0,45 MB gzip) og `data/vulkaner.json`
  (93 kB), hentes først ved tilvalg. Dannes af `data/jordskaelv.py` og
  `data/vulkaner.py`; kilde, kontrolsummer og bearbejdning i de tilhørende
  `.LICENSE`-filer. GVP's version/DOI-side kunne ikke åbnes automatisk og bør
  efterses.
- Test: `test/seismik.py` (data, kendte skælv og vulkaner, signatur, filtre,
  aflæsning, overlap, dialog, HTTP- og datafejl, nyt forsøg) indgår i
  `test/afproev.py`.

## Klimazoner som globalt lag: Vahl og Köppen (v426)

Knappen **Klimazoner** ved siden af Pladegrænser slår et andet globalt lag til
(`klimalag.js`). I signaturen vælges **Vahl** (klimazoner og plantebælter) eller
**Köppen** (Köppen-Geiger). Begge bygger på Beck m.fl. (2023), klimanormaler
1991–2020, CC BY 4.0, og de to lag kan vises sammen med pladegrænserne.

- **Köppen** er Becks egne klasser (0,1°) – data, ikke vores beregning.
- **Vahl** er en *rekonstruktion*, beregnet i `data/klimazoner.py` ud fra samme
  kildes månedsnormaler (0,5°) med den gængse skoleversion: polar v < 10 °C,
  tropisk k > 15 °C, subtropisk v > 20 °C og k > 5 °C, ellers tempereret.
  Fugtig måned: N (mm) > 2·T (°C) som i hydrotermfiguren. Plantebælte efter
  antal fugtige måneder (10–12 skov, 3–9 savanne/steppe, 1–2 busksteppe,
  0 ørken), maki ved tør sommer i subtropisk zone, nåleskov/løvskov efter Vahls
  v = 16,2 − 0,3·k og is ved v < 0 °C. **Tempereret zone (v429):** kun
  vækstsæsonen (måneder over 5 °C) tæller, fordi frostmåneder altid er
  «fugtige» efter N > 2T. Skov kræver 10–12 fugtige måneder og ingen tør måned
  over 5 °C (undtagen ved årsnedbør ≥ 700 mm, fx Seattle); ellers 3+ fugtige
  måneder over 5 °C steppe, 1–2 busksteppe, 0 ørken. Vahl satte selv grænsen
  skov/græssteppe efter regnen i månederne over 5 °C (Reumert 1947). Vahls egne grænser brugte også
  regnsandsynlighed, som ikke findes i normalerne.
- Kendte svagheder, der står i dialogen: den nordamerikanske prærie bliver
  stadig skov (sommerregnen er over 2T; græsset skyldes også tørkeår, brand og
  græsning), det midterste Florida bliver tropisk, og 0,5°-cellerne ses som
  trapper ved stor zoom. Vækstsæsonkriteriet (v429) ændrede ca. 6 % af
  landarealet: skov → steppe fx ved Astana, Ulaanbaatar og Denver, steppe →
  busksteppe/ørken i Gobi, Kyzylkum og Great Basin (Köppens BWk er nu 92 %
  busksteppe/ørken mod 6 % før). Seattle, København, Moskva, Kyiv og Jakutsk er
  fortsat skov.
- Havceller har fået nærmeste landklasse, og laget klippes med atlassets egen
  kystlinje, så kyster ikke flytter sig. Aflæsningen tjekker landfladen først og
  viser «hav» over havet.
- **Aflæsning** under signaturen: klassen ved musen, ellers midt på globussen
  (sigtekorn), så den også virker med piletaster og touch. Den beregnes først,
  når kloden står stille (90 ms), fordi opslaget er for tungt til hver frame.
- **Undersøg og kilde** (også under Processer) har kriterierne for begge
  systemer, seks opgaver, ⓘ Om data og links til kilderne.
- Ydeevne (Chrome med grafikkort, 1366×625): Vahl koster intet målbart, og
  Köppen tager ca. 28 ms pr. billede mod 17 ms uden laget. Kystlinjen projiceres
  én gang som `Path2D` og genbruges til fyld, klipning og streg. Polygoner uden
  for synsfeltet eller under en pixel springes over.
- Data: `data/vahl.json` (113 kB, 19 kB gzip) og `data/koppen.json` (342 kB,
  100 kB gzip), TopoJSON med fælles kanter. Hentes først ved tilvalg. Kilde,
  kontrolsummer og bearbejdning står i `data/klimazoner.LICENSE`.
- Test: `test/klimalag.py` (data, signatur, aflæsning ved København, Sahara og
  Grønland, tastatur, dialog, fejl og nyt forsøg) indgår i `test/afproev.py`.

## Landemenu: demografi og klima (v422)

Tryk på et land på globussen. En lille menu ved trykket giver **Demografi** og
**Klima** (Danmark også **Landekort**). Valget åbner en bred dialog med faner,
så eleven kan skifte emne uden at vende tilbage til globussen. Landet markeres
blåt, mens menu eller dialog er åben; musen fremhæver landet under markøren og
viser navnet. Lande kan også findes i **Søg** – den tastaturtilgængelige vej og
for meget små lande det nemmeste. Tæt på (over 2,5×) rammer trykket landene i
globussens detaljerede 1:50 mio.-kort, så også mange små lande kan vælges.

- **Demografi:** befolkningspyramide i procent af hele befolkningen for 1950,
  1980, 2000, 2023, 2050* og 2100* (* = FN's mellemvariant, tydeligt markeret
  som fremskrivning) med fast skala pr. land, andel 0–14/15–64/65+ og tabel;
  15 nøgletal for 2023 (befolkning, tilvækst, fødsels- og dødsrate, fertilitet,
  spædbørns- og børnedødelighed, middellevetid, medianalder, migration, tæthed,
  byandel, HDI med rang, BNI pr. indbygger i PPP og skolegang); fødsels- og
  dødsrate 1950–2100 med naturlig tilvækst som flade mellem kurverne.
- **Klima:** hydrotermfigurer (10 °C ≙ 20 mm; tørre måneder markeret, når
  temperaturkurven ligger over søjlen) for 1–4 stationer pr. land med
  WMO-normaler 1991–2020. Hvor nyere normal mangler for hele landet, vises
  1961–1990 med tydelig advarsel. Tabel med tal til hver figur.
  **Klimazoner i landet** (v429) under figurerne: Vahl- og Köppen-klassernes
  andel af landets areal i klimazonelaget, med lagets farver (klasser under
  3 % udeladt; `data/klimaandele.json`, 13 kB, dannes af
  `data/klimazoner.py`). Også i sammenligningen. Fejler filen, vises fanen
  uden.
- Begge faner har korte **Undersøg**-spørgsmål og ⓘ med kilder og forbehold.
- **Sammenlign ⇄** (v424) i fanerækken åbner et søgefelt under fanerne (uden
  søgetekst foreslås Danmark). Det valgte land vises ved siden af i begge
  faner, til det fjernes med **× land**; **Andet land** skifter det ud.
  Demografi: fælles årsvalg, to pyramider og to ratefigurer med samme skala
  og nøgletallene i én tabel (forklaring ved navnet, når den er ens; ellers i
  cellen, fx HDI-rang). Klima: landenes stationer i hver sin kolonne, alle
  hydrotermfigurer med samme akser. Under 700 px står landene under hinanden.
  Escape i søgefeltet lukker kun feltet. Egne Undersøg-spørgsmål til
  sammenligning.

Data: `data/demografi.json` (FN WPP 2024, UNDP HDR 2025, Verdensbanken; ca.
590 kB, 220 kB gzip), `data/klima.json` (DWD/WMO; 72 kB) og
`data/landeindeks.json` (danske navne; 5 kB). Kun indekset hentes ved start;
de to datafiler først, når fanen vælges. Kilder, licenser og stationsvalg står i
`data/lande.LICENSE`; filerne dannes af `data/lande.mjs`. 237 lande/områder har
demografi, 188 har mindst én klimastation. Lande uden data får en forklaring.
Nordcypern og Somaliland vises med FN's tal for hele Cypern/Somalia, og det
står i menuen. Quizzen og landekortet er uændrede: i quizzen åbner tryk ingen menu.

`test/landemenu.py` indgår i den samlede browsertest og kan køres særskilt.
Den kontrollerer stikprøver i data mod kilderne, menu, tastatur, faner,
år/fremskrivning, figurtekstens størrelse, søgning, lande uden data, Escape,
alle fem elevvisninger og datafejl med nyt forsøg – og sammenligningen: valg,
Escape, fælles skala i pyramider, rater og hydrotermfigurer, tabel, side om
side på laptop, skift/fjern land og område uden data.

## Tættere zoom på globussen (v420)

Globussen kan zoomes fra 0,75× op til 10× (før 3×), både i almindelig visning
og i quizzen (før 8×). Over 2,5× skifter grundkortet fra Natural Earth
1:110 mio. til 1:50 mio. (`data/countries-50m.json`, samme world-atlas 2.0.2
som landekortet), så kyster, øer og landegrænser holder formen. Det hentes
først første gang, der zoomes så tæt på; indtil da eller ved fejl tegnes
1:110 mio. videre. Danmarks fremhævning og tryk følger det viste kort. Over
3× klippes tegningen til figuren, så den store klode ikke tegnes uden for
skærmen. `test/zoom.py` kontrollerer grænsen, skiftet, Danmark ved 10× og
at Nulstil vender tilbage.

## Find landet — fem verdensdele (v419)

**Quiz** åbner et valg mellem fem verdensdele: Europa (47), Afrika (55),
Nordamerika med Mellemamerika og Caribien (23), Sydamerika (12) samt Asien
og Oceanien slået sammen (63). Valget huskes, til siden genindlæses, og
**Prøv igen** starter samme verdensdel forfra. Spillet er det samme i alle:
**Start …-quiz** giver ét landenavn ad gangen i en blandet
rækkefølge uden gentagelser. Klik/tryk på landet på den eksisterende globus.
Rigtigt svar farver landet grønt og giver automatisk næste spørgsmål efter
ét sekund. Forkert quizland giver feedback og et nyt forsøg på samme land.
Tryk uden for quizlandene ændrer ikke scoren. Gentagne klik i feedbackpausen
tæller ikke som nye svar. Til sidst vises antal rigtige i første forsøg,
forkerte svar og lande, som blev vist med hjælp. Der er ingen tidspres eller
login. Nyt spil nulstiller forløbet.

**Vis landet** centrerer landet og tæller som hjælp; eleven vælger selv
**Næste land**. Meget store lande (Rusland, Canada, USA, Kina …) vises i et
bredere udsnit. Knappen med verdensdelens navn (eller Home) viser
startudsnittet igen uden at nulstille spørgsmål. Asien og Oceanien kan ikke
ses på én halvkugle; startudsnittet viser det meste, og Stillehavsøerne nås
ved at dreje.
Træk, tofingerzoom, +/− og de eksisterende piletaster bevares; quizzen kan
zoome op til 10× ligesom globussen. Med fokus på canvas finjusterer Shift+pil rotationen, og
Enter vælger landet under sigtekornet. Lande under ca. 7.000 km² (samt den
smalle Gambia) har diskrete ringe ved deres sigtepunkter: 7 i Europa, 6 i
Afrika, 8 i Nordamerika og 13 i Asien og Oceanien. Ringene er ikke landenes
areal; zoom ind for at skelne tætte placeringer (fx De Små Antiller). Der
vises ingen landenavne ved hover i quizzen.

**Afgrænsning.** Europa: FN M49's 44 europæiske stater samt Cypern, Tyrkiet
og Kosovo som selvstændigt quizområde. Øvrige verdensdele: FN M49's
medlemsstater, plus Vestsahara (omstridt område), Palæstina og Taiwan som
quizområder. Rusland og Tyrkiet er med i både Europa og Asien; Cypern kun i
Europa. Somaliland regnes til Somalia, Hongkong og Macao til Kina.
Selvstyrende og afhængige territorier (Grønland, Færøerne, Puerto Rico,
Fransk Guyana …) er ikke egne spørgsmål. Dette er en oplyst skoleinddeling;
verdensdelsbegreberne er ikke entydige. Danske navne, sigtepunkter og
afgrænsningsteksterne står i `quizmodel.js` (`verdensdele`). Sigtepunkterne
for de nye verdensdele er beregnet som et indre punkt langt fra kysten i
landets største polygon (små lande: centrum; Kiribati: Tarawa).

`landequiz.js` hentes først ved start; det samme gælder det valgte, lokale
kortudtræk og topojson-simplify (5,7 kB): `europa-10m.json` (824 kB),
`afrika-10m.json` (286 kB), `nordamerika-10m.json` (909 kB),
`sydamerika-10m.json` (299 kB) og `asien-oceanien-10m.json` (1,2 MB).
Udtrækkene laves med `node atlas/data/quizlande.mjs <countries-10m.json>`
fra world-atlas 2.0.2 (npm-pakken); scriptet gendanner Europa-udtrækket
uændret. Natural Earth 1:10 mio. har generaliserede kyster. Vatikanets polygon
kollapser ved kildens kvantisering og repræsenteres derfor af sin ring; tre
arealløse ø-polygoner på Maldiverne, som D3 ville tolke som hele kloden, er
fjernet. Kilde, kontrolsum, bearbejdning og licens står i
`data/europa-10m.LICENSE` og `data/verdensdele-10m.LICENSE`.
Tegningen bruger topologisk fælles forenklede buer efter zoomniveau; hit-test
bruger altid de oprindelige polygoner og de synlige smålandes ringe.

Quizzen bruger hele det eksisterende kortområde med en kompakt spørgelinje.
Markører og pladelag skjules under spillet, og **Afslut quiz/Escape**
gendanner globussens tidligere vinkel, zoom og tilvalg. Danmarkskort,
simulationer og Island-modul bevares. Start fra et åbent Danmarkskort fører
til globusquizzen og tilbage til globussen. Data-/biblioteksfejl bevarer
atlasnavigationen; en lukket startdialog må ikke starte spillet senere.
Åbnes quizmenuen før grundkortet er klart, aktiveres startknappen automatisk,
når globussen er indlæst.

`node atlas/test/quizmodel.mjs` kontrollerer rækkefølge, unikke spørgsmål,
fejl, hjælp, gentagne svar, afslutning og nyt spil for alle verdensdele.
`test/europa_quiz.py` og `test/verdensdele_quiz.py` indgår i den samlede
browsertest: hit-test i sigtepunktet for alle 200 lande ved største zoom,
fulde forløb med korrekte landetryk i alle fem verdensdele (lande, der ikke
kan rammes sikkert i startudsnittet, via Vis landet), fem elevskærme, touch,
tastatur, finjustering, hjælp, scorenulstilling, tilbage-navigation med
pladetilvalg, indlæsningsfejl og afbrudt start.
Afprøvet i Chromium uden WebGL; Safari og fysiske telefoner er ikke testet.

## Første landekort: Danmark (v410)

Tryk på selve landets geometri og vælg **Landekort** i landemenuen (fra v422;
før åbnede trykket kortet direkte); zoom ind ved behov. Ingen landeknap ligger oven på globussen.
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
- `landemenu.js`: menu ved tryk på et land og navneindeks.
- `demografi.js` / `klima.js`: befolkningspyramide, nøgletal og hydrotermfigurer
  (SVG), hentes først ved valg.
- `landekort.js`: separat Mercatorvisning af Danmark i samme store kortområde.
  Hentes først ved landevalg; globussens vinkel, zoom og pladelag bevares.
- `pladelag.js`: valgfrit pladegrænselag (#48). Henter først data, når laget
  slås til, og tegner signaturen i samme Canvas som globussen.
- `klimalag.js`: valgfrit klimalag (Vahl/Köppen). Henter data og
  `topojson-simplify` først ved tilvalg og klipper med kystlinjen.
- `temakort.js`: valgfrit temakort (koropletkort) over landenes nøgletal fra
  `demografi.json`: indikatorer, klassegrænser, farver, rangliste og aflæsning.
- `udledning.js`: lagene under Klimaforandringer (national og forbrugsbaseret
  CO₂ fra `udledning.json`), med temakortets klasser og farver.
- `pladebevaegelse.js`: valgfrie navne for PB2002's 52 plader. Eulerberegningen
  er bevaret til uafhængig kontrol af modellens relative hastigheder.
- `graensehastigheder.js`: valgfrie hastigheder og pile ved grænserne, fra
  PB2002's publicerede komponenter på tværs og langs; også brugt i teksttabellen.
- `island/`: selvstændigt tværsnit af Den Midtatlantiske Ryg og Island
  (#49, milepæl B–C): SVG-tværsnit i 2D, drejelig blok i CSS 3D, vis/skjul-lag
  og illustrativ animation. Intet WebGL. Se `ISLAND-DEMO.md`.
  `island/kort.html` er forløbets trin 2: kort over Island med terræn,
  havbund og vulkansystemer fra målte data (`island/data/`, dannet af
  `islandskort.py`; kilder og licenser i `islandskort.LICENSE`).
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
| topojson-simplify | 3.0.3 | [TopoJSON](https://github.com/topojson/topojson-simplify), ISC; `vendor/topojson-simplify.LICENSE`; hentes kun til quiz og klimalag |
| europa-10m.json | Udtag af world-atlas 2.0.2, 1:10 mio. | Natural Earth, public domain; bearbejdning og kontrolsum i `data/europa-10m.LICENSE` |
| afrika-, nordamerika-, sydamerika-, asien-oceanien-10m.json | Udtag af world-atlas 2.0.2, 1:10 mio. | Natural Earth, public domain; bearbejdning og kontrolsum i `data/verdensdele-10m.LICENSE` |
| countries-110m.json | world-atlas 2.0.2 | [world-atlas](https://github.com/topojson/world-atlas), ISC; `data/world-atlas.LICENSE` |
| countries-50m.json | world-atlas 2.0.2, 1:50 mio. | Uændret baggrundskort, samme world-atlas/Natural Earth-licens; kontrolsum i `data/danmark-10m.LICENSE` |
| danmark-10m.json | Udtag af world-atlas 2.0.2, 1:10 mio. | Natural Earth, public domain; kildens SHA-256 og bearbejdning i `data/danmark-10m.LICENSE` |
| pladegraenser.json | PB2002 (Bird 2003) | [doi:10.1029/2001GC000252](https://doi.org/10.1029/2001GC000252), ODC-By 1.0 via [fraxen/tectonicplates](https://github.com/fraxen/tectonicplates); `data/pladegraenser.LICENSE` |
| plader.json | PB2002 (Bird 2003), tabel 1 | Samme kilde/licens; poler og pladepolygoner, bearbejdet som beskrevet i `data/plader.LICENSE` |
| vahl.json, koppen.json | Beck m.fl. (2023), 1991–2020 | [doi:10.1038/s41597-023-02549-6](https://doi.org/10.1038/s41597-023-02549-6), CC BY 4.0; Vahl beregnet her; `data/klimazoner.LICENSE` |
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

## Geografiske tværsnit under Island (v418)

Fra Island-markøren og Island-kortet fører «Se under overfladen» nu til
3D-landskabets geografiske gennemskæring. Vatnajökull, Reykjanes og Hekla har
hver deres kildeankrede magmasystemer og samme ETOPO-overkant som landskabet.
Form, størrelse og gange er en tydeligt mærket kunstnerisk fortolkning.
Der kan drejes, skiftes snit og startes/pauses en illustrativ magmastrøm.
Lukning vender tilbage til landskabet. Den oprindelige generelle procesfigur
om plader og smeltning bevares og kan åbnes fra den nye side.

Faglige valg, kilder og datumer: [`island/SNIT-KILDER.md`](island/SNIT-KILDER.md).
Teknik, skalaer og afprøvning: [`ISLAND-DEMO.md`](ISLAND-DEMO.md).
`test/islandsnit.py` indgår i den samlede browsertest og dækker tre snit,
fem skærme, terrænsammenhæng, dybder, bagsidens skjulning, pause og kameraretur.
