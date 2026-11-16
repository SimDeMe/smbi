# Selvstændigt 3D-celleværksted · alfa

Dette er et udviklingsudkast til selve cellemodellen. Det indlæses **ikke** af
Byg cellen eller membrantransport. Integration venter på ejerens vurdering.
Siden er delbar, men har `noindex` og står ikke i elevbiblioteket.

## Designmålet

Udtrykket følger lærebogsanimationer af en dyrecelle (visuel reference:
Nucleus Medical Media, »Biology: Cell Structure«, YouTube URUJD5NEXC8). Videoen
er kun inspiration; ingen billeder eller modeller derfra indgår.

- En hel, bulet celle set udefra gennem en gennemsigtig, let iriserende,
  rosa cellemembran med lys randkontur, på turkis baggrund med lysprikker.
- Cellekernen (violet, med kerneporer) ligger i midten, omgivet af ru ER som
  en tromle af koncentriske, foldede cisterner med ribosomer.
- Røde, aflange mitokondrier, hvor cristae ses som striber gennem den
  ydre membran; orange golgistakke af skålformede sække; blå lysosomer,
  små vesikler og frie ribosomer spredt i cytoplasmaet.
- Glat ER er et forgrenet rørnetværk koblet til den yderste ru ER-cisterne.
- Cellekernen og mitokondrierne kan åbnes uafhængigt (den øvre halvdel løftes
  væk). Det er en visningsfunktion, ikke en biologisk proces.

## Filer

- `geometri.js`: støj, bulet cellemembran, ER-cisterner, mitokondrier, cristae og golgisække.
- `organeller.js`: farver, reproducerbar placering uden overlap, kerne, ER, golgi, mitokondrier m.m.
- `model.js`: lys, tåge, kamera, membranmaterialer (fresnel-rand) og betjenings-API.
- `side.js`: udvælgelse, åbning, fri drejning, zoom og fokus.
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

Testen kontrollerer, at cellen er hel, at kernen ligger i midten omgivet af ru ER,
og at organellerne ligger inde i membranen. Den afprøver uafhængig åbning/lukning, nulstilling,
drejning, zoom, tastatur, mobil/laptop og fallback. Den opdaterer reservebilledet.
Livekontrol kan køres med `CELLE_PROTOTYPE_URL` sat til prototypeadressen;
så ændres reservebilledet ikke.

## Kendte forenklinger og næste vurdering

Membranen er farvet og gjort gennemsigtig for at kunne se ind; en rigtig
cellemembran ses ikke sådan. Farverne følger lærebogskonventionen og er ikke
naturlige. Cytoplasmaet er langt mindre tætpakket end i en rigtig celle, og
cytoskelet og centrosom er udeladt. Størrelser og antal er illustrative.

Fagligt grundlag: [ER-struktur](https://pmc.ncbi.nlm.nih.gov/articles/PMC4700099/), [Golgiapparatet](https://www.ncbi.nlm.nih.gov/books/NBK6268/) og [OpenStax om eukaryote celler](https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells).
Modellen er endnu ikke elevafprøvet.
