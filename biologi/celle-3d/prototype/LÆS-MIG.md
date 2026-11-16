# Selvstændigt 3D-celleværksted · alfa

Dette er et udviklingsudkast til selve cellemodellen. Det indlæses **ikke** af
Byg cellen eller membrantransport. Integration venter på ejerens vurdering.
Siden er delbar, men har `noindex` og står ikke i elevbiblioteket.

## Designmålet

- Et reelt, afrundet cellelegeme med synlig volumen under snitfladen.
- Cellekerne og mitokondrier går igennem snitfladen med omtrent halvdelen på
  hver side. Det delvist gennemsigtige cytoplasma viser den indlejrede del.
- Uregelmæssige, blødt afrundede organeller; cisterners forløb og form varierer.
- Glat og ru ER deler membranform og materialer. Ru ER har ribosomer.
- Cellekernens og mitokondriernes øvre membransnit kan fjernes og genskabes
  uafhængigt. Det er en visningsfunktion, ikke en biologisk åbneproces.

## Filer

- `geometri.js`: organisk cellekontur, hele legemer, ER-cisterner og mitokondrier.
- `organeller.js`: placering, membraner, kromatin, kernelegeme og cristae.
- `model.js`: lys, kamera, gennemsigtigt cellelegeme og betjenings-API.
- `side.js`: udvælgelse, individuelle snit, fri drejning, zoom og fokus.
- `forhaandsvisning.png`: rendering af den aktuelle model til WebGL-fallback.
- `browser-test.mjs`: faktiske 3D-bounding boxes og interaktioner.

Three.js 0.169.0 genbruges fra `../vendor/` med den eksisterende MIT-licens.
Den tidligere `../model.js` ændres ikke. Geometrien er selvstændigt skrevet;
modellen fra Sketchfab er kun visuel inspiration og indgår ikke som asset.

## Kontrol

Med en server på port 8777:

```sh
node biologi/celle-3d/prototype/browser-test.mjs
```

Testen kontrollerer, at organellernes faktiske geometri krydser snittet og at
cellelegemet har dybde. Den afprøver uafhængig åbning/lukning, nulstilling,
drejning, zoom, tastatur, mobil/laptop og fallback. Den opdaterer reservebilledet.
Livekontrol kan køres med `CELLE_PROTOTYPE_URL` sat til prototypeadressen;
så ændres reservebilledet ikke.

## Kendte forenklinger og næste vurdering

Cytoplasmaet er gjort gennemsigtigt, og snittet er plant for at kunne se ind.
Det er ikke en væskeoverflade. Størrelser, farver, membrantykkelser og antal er
illustrative. Kromatin og cristae er skematiske rumlige gengivelser.
Vurder især organellernes former, deres indlejring og de åbne snit, før der
arbejdes med læringsopgaver og integration. Modellen er endnu ikke elevafprøvet.
