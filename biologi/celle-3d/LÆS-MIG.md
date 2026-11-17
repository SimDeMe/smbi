# Fælles dyrecelle i 3D

Bruges af `biologi/byg-cellen.html` og `biologi/celletransport/`.
Modellen er bygget i Blender og ligger i `dyrecelle.glb` (meshopt-komprimeret glTF).
Samme fil bruges af den selvstændige side `biologi/byg-cellen-3d/`, så der kun er
én kopi af cellen. Hver mesh har `struktur` og `del` som egenskaber fra Blender;
ved en ny eksport skal **Include → Custom Properties** være slået til.

Cellen er skåret over, så man ser ned i cytoplasmaet. Størrelser og antal er
forenklede: ribosomer og kerneporer er gjort store, og en rigtig celle har langt
flere mitokondrier og meget mere ER. Blender-modellen har ingen lysosomer; de to
små, violette sække lægges ind af `model.js`.

`model.js` indlæser modellen, sorterer delene i Byg cellens 11 fagord og ejer lys
og kamera. Det tegner kun ved ændringer. Rotation er begrænset til ±0,5 radian.
Fagordenes mål flyttes ved indlæsning til nærmeste punkt på organellens overflade,
og `fagordspladser` placerer felterne i 3D-visningen, så pegepindene ikke krydser.
`projektér()` og `fagordsankre()` holder pegepindene knyttet til 3D-positionerne.
`skabDyrecelle()` er asynkron, fordi modellen hentes.

`byg-visning.js` observerer den fælles Byg-motors figur. En PNG-rendering af den
aktuelle 3D-tilstand står under de eksisterende SVG-fagord, uden at ændre motoren.
Lag, farver og fremhævelse følger opgavens tilstand. Vinkelknapperne kan bruges med
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
