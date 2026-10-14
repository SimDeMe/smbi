# Designprincipper for smbi.dk

Disse principper gælder nye sider og væsentlige ændringer. **Faglig kvalitet,
elevens arbejdsflow og skærmplads går forud for bestemte CSS-opskrifter.**
Eksisterende sider behøver ikke omlægges alene for at følge nye principper.
`index.html`, `forside.css`, `geografi/Stigningsregn.html`,
`geografi/drivhuseffektenSimpel.html` og `biologi/membran.html` er
**inspiration, ikke obligatoriske skabeloner**.

## 1. Faglig korrekthed og didaktik
- Naturvidenskabelige modeller, tal, enheder og årsagssammenhænge skal være
  fagligt korrekte. Oplys væsentlige antagelser, begrænsninger og
  forenklinger. Skeln mellem observation, rekonstruktion, idealiseret model
  og fremtidsscenarie; opfind ikke geografiske data.
- Prioritér sammenhængende procesforklaring, kort årsagskæde, rumlig/
  visuel forståelse og mulighed for at undersøge og anvende modellen.
- Vis det nødvendige først. Forklaring, datatabeller, ekstra parametre og
  opgaver kan åbnes efter behov, når det forbedrer læringen.
- Elever skal kunne forstå, hvad kontrollerne ændrer, og aflæse responsen.
  Undgå dublerede statusbokse, pynt uden læringsformål og overfyldte paneler.
- Enheder gengives fagligt korrekt med rigtig store/små bogstaver (pH,
  mmol/L, kJ/mol, °C); CSS må ikke gøre dem til versaler.

## 2. Samlet identitet, fleksibelt layout
- Bevar sitets genkendelige udtryk: papirfarvet baggrund, tydelige blækrammer,
  enkle skygger, regnbuestribe i site-header, Archivo, Source Serif 4 og
  IBM Plex Mono, samt blå accent for naturgeografi og pink for biologi.
- De eksisterende farver og typografitokens er udgangspunkt; konkrete mål,
  rammetykkelser, dekorative markeringer og placeringer er ikke tvungne.
- Brug ikke en fast `.rig`-struktur, bestemt panelbredde, fast sidespalte
  (fx 340 px), et bestemt breakpoint (fx 960 px) eller en bestemt figurhøjde
  som universelle krav. Vælg layout ud fra modellens funktion og plads.
- Tre nyttige **muligheder**, ikke skabeloner: (a) figur med sidepanel,
  (b) stor figur med kompakt betjeningslinje/indstillinger efter behov,
  (c) trinvis figur med kort forklaringsområde.
- Fælles stylesheets, CSS-komponenter og særskilt CSS pr. simulation må
  blandes. Genbrug visuel kode, hvor det reducerer vedligeholdelsen.
- Navigation og links skal være konsekvente, men undervisningsvisning,
  fuldskærm eller indlejring må skjule unødvendig site-krom.

## 3. Elevskærmen er primær
- På en almindelig skolelaptop skal **den centrale figur og de vigtigste
  kontroller** som udgangspunkt kunne bruges samtidigt uden at scrolle.
  Det er ikke et krav, at alle grafer, hjælpeforklaringer, sekundære
  indstillinger eller alt øvrigt indhold er synligt samtidigt.
- Bevar figurens faglige læsbarhed før du presser den ned i højden. Sekundært
  stof kan ligge i faner, fold-ud-paneler, modaler eller længere nede.
  Sørg for at skjulte værktøjer er synligt tilgængelige og tastaturbetjente.
- Responsive løsninger vælges efter det faktiske indhold og både vinduets
  bredde og højde; ingen universel fast minimumshøjde (heller ikke 230 px).
  Mobil må rulle lodret, men undgå unødvendig vandret rulning.
- Undgå utilsigtede layoutspring når trin skifter. Hold væsentlige knapper
  stabilt placeret, men lås **ikke** hele panelet til højden af det længste
  trin og reservér ikke store tomme felter blot for ens højde.
- Tilbyd en fokustilstand, hvor overskrift, site-header og andet sekundært
  kan skjules uden browser-fuldskærm; hvor muligt også fuldskærm/projektor.
- Test især vinduer på 1280×577, 1366×625 og 1536×730 samt mobil
  390×750. Test også smal visning ved siden af elevens opgave.
- Brug `node værktøj/pladstjek.mjs <side>` hvor relevant og kig på
  skærmbillederne. Værktøjets gamle panel-højdekrav er **diagnostik,
  ikke automatisk bestået/ikke bestået**. Vurder særskilt om figur og
  primære kontroller er synlige og brugbare. Opdatér gerne værktøjet til
  dette mål, frem for at forvride layoutet for at tilfredsstille målingen.

## 4. Tilgængelighed og betjening
- Brug `<html lang="da">`, semantisk HTML, forståelige knapnavne,
  synlig tastaturfokus, labels på kontroller, og relevante statusmeldinger
  for skærmlæsere. Betjening skal fungere uden mus.
- Farve må aldrig være eneste signal. SVG/canvas/3D skal ledsages af
  faglig tekst eller betjeningsalternativ ved behov.
- Understøt touch og skærmstørrelsesændringer. Respektér
  `prefers-reduced-motion`; giv pause ved vedvarende animation.
- Tilbyd et brugbart alternativ, hvis WebGL eller en ekstern ressource fejler.
- Sørg for at tekst, figurer og tal kan aflæses; små mono-etiketter er et
  æstetisk valg, ikke et krav, hvis læsbarheden lider.

## 5. Teknologi og vedligeholdelse
- Sitet er som udgangspunkt statisk HTML/CSS/JavaScript på GitHub Pages,
  lokalt testbart med `python3 -m http.server 8777`. Undgå en build-proces
  uden væsentlig gevinst, men den er ikke forbudt for et afgrænset modul.
- Små figurer kan være i én fil. Del større projekter i fagligt meningsfulde
  ES-moduler, model/data, visning og evt. fælles stil. Der er **ingen fast
  linjegrænse**, og al CSS behøver ikke ligge i HTML.
- Velvalgte tredjepartsbiblioteker (fx Three.js, CesiumJS eller D3) og
  CDN'er er tilladt, når nytten opvejer kompleksitet, ydelse, netafhængighed
  og vedligeholdelsesrisiko. Dokumentér valg, version og fallback. Undgå
  unødvendige afhængigheder, ikke nødvendige afhængigheder.
- Simulationer forbliver selvstændigt tilgængelige med stabile URL'er,
  også når de indgår i et fælles atlas.
- Følg eksisterende sitemap-, metadata- og delingspraksis på nye offentlige
  sider, når relevant; udsæt ikke en god brugeroplevelse for rent dekorative
  formaliteter.

## 6. Test og ændring af modeller
- Ved rent designmæssig omlægning skal beregningsmodellen bevares. Test
  karakteristiske input, yderpunkter og output mod den tidligere version.
- Når modellen bevidst ændres, dokumentér faglig begrundelse og kontroller
  den med uafhængige referenceberegninger eller faglige kilder.
- Test i browser på elevlaptop-størrelser og mobil: figurlæsbarhed,
  primære kontroller, scrollbehov, tastatur, touch, fejltilstande og
  ydeevne. Udvis omtanke med stor grafisk belastning og tung 3D.
- Lav små, forståelige commits på `main` efter test, så rollback er enkel.
  Ingen generel PR-/branchpligt. Git er ændringshistorik; synlige
  versionsnumre inde i simulationer er valgfrie.
- Bevar eksisterende URL'er og funktioner ved inkrementelle ændringer.

## 7. Undervisning, indlejring og atlas
- Simuleringer bør kunne åbnes selvstændigt fra fagbiblioteket og som
  indgang fra atlasset. Gør det muligt at få en rolig elevvisning uden
  dobbelte menuer eller unødvendig dekoration.
- Hvor det er fagligt relevant, må modellen have kontekstafhængige
  forklaringer, opgaver, målestokke, måleværktøjer og dataeksport. Disse
  er muligheder og ikke en tjekliste for hvert nyt modul.
- Geografisk placering skal være korrekt. Skeln mellem stedbundne
  processer, globale systemer og generelle modeller; sæt ikke generelle
  processer på vilkårlige kortpositioner.
- Delbare tilstande via URL, projektortilstand, PDF/print og iframe er
  gode funktioner, hvor de reelt bruges; ikke obligatoriske for alle sider.

## Ældre designmønstre
Ældre `.rig`-design, højdebudget, 340 px sidepanel, CSS-tokens, knapstile,
trinstabilisering og faste breakpoints kan stadig bruges som **eksempler**
fra eksisterende filer, men er ikke længere ufravigelige regler.
