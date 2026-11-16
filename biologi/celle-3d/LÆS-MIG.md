# Fælles dyrecelle i 3D

Bruges af `biologi/byg-cellen.html` og `biologi/celletransport/`.
Modellen er et åbent, skematisk 3D-snit; organellernes antal, størrelse og
membranernes tykkelse er overdrevet for at gøre dem læsbare. ER-områderne
bruger samme geometri og materialer. Ru ER har ribosomer på overfladen.
DNA er løst kromatin, og membranpumper, cytoskelet og flere organeller er udeladt.

`model.js` ejer geometri, materialer, lys og kamera. Det tegner kun ved ændringer,
ikke i en konstant animationssløjfe. Rotation er begrænset til ±0,5 radian, så
snitflader og organeller fortsat kan aflæses. Snitplanet i kernen følger rotationen.
`projektér()` og `fagordsankre()` holder pegepindene knyttet til 3D-positionerne.

`byg-visning.js` observerer den fælles Byg-motors figur. En PNG-rendering af den
aktuelle 3D-tilstand står under de eksisterende SVG-fagord, uden at ændre motoren.
Lag, farver og fremhævelse følger opgavens tilstand. Vinkelknapperne kan bruges med
tastatur. På transportsiden kan cellen også drejes ved at trække i figuren.
De efterfølgende membranprocesser er fortsat de eksisterende 2D-animationer.

Hvis oprettelsen af en WebGL-renderer fejler, bruges den eksisterende lagdelte SVG.
Der hentes ingen biblioteker fra et CDN. `vendor/three.module.min.js` er den
fastlåste Three.js 0.169.0 under MIT-licens; licensen står i `vendor/three.LICENSE`.

## Kontrol

Start en lokal server på port 8777. Kør:

- `node biologi/celle-3d/browser-test.mjs` – WebGL, drejning, pegepinde, lag og fallback.
- `node biologi/celletransport/browser-test.mjs` – transportforløb og skærmstørrelser.
- `node byg-motor/selvtest.mjs biologi/byg-cellen.html` – alle fagord og interaktioner.

Eksterne analytics-kald kan give CORS-fejl på localhost. Ved lokal test må de
blokeres i testbrowseren; bevar den offentlige sides analytics-snippet.
Elevafprøvning af den nye 3D-illustration mangler.
