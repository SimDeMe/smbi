# Fælles 3D-celler: dyrecellen og plantecellen

Dyrecellen bruges af `biologi/byg-cellen.html` og `biologi/celletransport/`,
plantecellen af `biologi/byg-cellen.html`.
Modellerne er bygget i Blender og ligger i `dyrecelle.glb` og `plantecelle.glb`
(meshopt-komprimeret glTF).
`dyrecelle.glb` bruges også af den selvstændige side `biologi/byg-cellen-3d/`, så der
kun er én kopi af cellen. Dyrecellens meshes har `struktur` og `del` som egenskaber fra Blender;
ved en ny eksport skal **Include → Custom Properties** være slået til.

Cellerne er skåret over, så man ser ned i cytoplasmaet. Størrelser og antal er
forenklede: ribosomer og kerneporer er gjort store, og en rigtig celle har langt
flere mitokondrier og meget mere ER. «Byg cellen» spørger kun om de strukturer,
der er i Blender-modellerne (dyrecellen 10 fagord, ingen lysosomer); 2D-reserverne følger samme lister.

## Plantecellen

`plantecelle.glb` er eksporteret fra `Plantecelle.blend` (samlingen `Plant_Cell`, uden
kameraer og lys, med **Apply Modifiers** og **Custom Properties**) og komprimeret med
`npx @gltf-transform/cli@4.5.1 optimize ind.glb ud.glb --compress meshopt --join false
--flatten false --instance false --palette false --texture-compress false
--simplify-error 0.0005`. `--join false` er nødvendig: delene sorteres efter objektnavnet
fra Blender (`Cell_Wall`, `Chloroplast_…`, `Tonoplast` …), så de må ikke flettes.
Byg cellen spørger om 13 fagord: dyrecellens 10 plus cellevæg, kloroplast og vakuole.
Plantecellen hentes først, når fanen åbnes. Cellevæggens og mitokondriematrixens
procedurale farver sættes i koden, fordi de ikke følger med i glTF. Vakuolen er gjort
mere dækkende og tegnes efter cytoplasmaet, så snittet kan ses lige forfra.
Grønkornene og mitokondrierne langs kanten er skaleret lidt ind mod vakuolen i Blender,
så der er cytoplasma mellem dem og cellemembranen.
Vakuolen er i Blender lavet om til en rund «vandballon» i cellens højre halvdel
(superellipsoide skåret over i snittets højde, tonoplasten som tynd skal uden om), med
cytoplasma hele vejen rundt, så grønkorn og mitokondrier ligger mellem vakuolen og
cellemembranen. Cytoplasmaet er bygget om som én fyldt form inden for membranen
(membranens indre flade, skåret over og lukket). Det tegnes før organellerne
(`cytoplasmaFørst`), så de ikke bliver blege af det.
Cytoplasmaet er mere dækkende og cellemembranen mørkere blå, så man ikke ser ned på
membranen i bunden og forveksler den med cytoplasmaet. Kameraet ser mere ovenfra end
på dyrecellen. Hele plantecellen ses fra første lag (`alleSynlige`); kun fagordene
kommer lag for lag. I funktionsopgaven tæller et klik lige ved cellemembranen som
membranen, ligesom ved ribosomer og vesikler.

Mens en model hentes, er 2D-tegningen skjult, og der står «Henter dyrecellen i 3D …».

`model.js` har en indstilling pr. celle i `CELLER` (fil, fagord, sortering af delene,
mål, fagordenes felter og kamera). `skabCelle(id)` indlæser modellen og ejer lys
og kamera; `skabDyrecelle()` er det gamle navn for `skabCelle('dyr')`. Det tegner kun ved ændringer. Rotation er begrænset til ±0,5 radian.
Fagordenes mål flyttes ved indlæsning til nærmeste punkt på organellens overflade,
og `pladser` i hver celle placerer felterne i 3D-visningen, så pegepindene ikke krydser.
`projektér()` og `fagordsankre()` holder pegepindene knyttet til 3D-positionerne.
`skabCelle()` er asynkron, fordi modellen hentes.

`byg-visning.js` observerer den fælles Byg-motors figur. En PNG-rendering af den
aktuelle 3D-tilstand står under de eksisterende SVG-fagord, uden at ændre motoren.
Lag og fremhævelse følger opgavens tilstand. I 3D har delene deres farver fra
starten (de er ikke grå, før ordet sidder, som i 2D). Vinkelknapperne kan bruges med
tastatur. På transportsiden kan cellen også drejes ved at trække i figuren.
De efterfølgende membranprocesser er fortsat de eksisterende 2D-animationer.

Hvis WebGL eller modellen fejler, bruges den eksisterende lagdelte SVG.
Der hentes ingen biblioteker fra et CDN. `vendor/three.module.min.js` er den
fastlåste Three.js 0.169.0 under MIT-licens; licensen står i `vendor/three.LICENSE`.
`vendor/addons/` er GLTFLoader, BufferGeometryUtils, meshopt-dekoderen og
RoomEnvironment fra samme version, med importen af `'three'` rettet til den lokale fil.

## Kontrol

Start en lokal server på port 8777. Kør:

- `node biologi/celle-3d/browser-test.mjs` – WebGL, drejning, pegepinde, lag og fallback.
- `node biologi/celletransport/browser-test.mjs` – transportforløb og skærmstørrelser.
- `node byg-motor/selvtest.mjs biologi/byg-cellen.html` – alle fagord og interaktioner.

Eksterne analytics-kald kan give CORS-fejl på localhost. Ved lokal test må de
blokeres i testbrowseren; bevar den offentlige sides analytics-snippet.
Elevafprøvning af den nye 3D-illustration mangler.
