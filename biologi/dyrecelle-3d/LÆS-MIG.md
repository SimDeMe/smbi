# Dyrecellen i 3D · alfa

Selvstændig, drejelig 3D-model af en dyrecelle i lærebogsstil. Siden er
delbar, men har `noindex` og står endnu ikke i elevbiblioteket. Den
afløser ikke `biologi/celle-3d/` (den fælles model i Byg cellen og
membrantransport) – det er en ny model fra bunden.

## Idéen

- Cellen er et solidt, let uregelmæssigt legeme. En kile foran er skåret
  væk med tre klipplaner (to lodrette vægge fra en spids bag kernen og et
  gulv), så organellerne ses liggende i et halvgennemsigtigt cytoplasma.
  Snitkanten i membranen er tegnet som en streg.
- Alle membraner er rigtige flader med glatte normaler (`geometri.js`):
  - **Mitokondrier**: ydre membran som kapsel, indre membran som én
    sammenhængende flade, der folder sig ind i cristae (gaussiske folder
    med varierende dybde og vinkeludbredelse). Snitprofilen viser folderne.
  - **Cellekerne**: to membraner med spalte, kerneporer som ringe,
    kromatin som tråde og et kernelegeme.
  - **Ru ER**: fire stablede, bølgede cisterner (`pude`-flader med
    afrundede rande) med ribosomer på begge sider, forbundet med
    kernehylsteret og indbyrdes.
  - **Glat ER**: organisk rørnetværk, sammenhængende og forbundet til ru ER.
  - **Golgiapparat**: seks buede, flade sække med fortykkede rande og
    vesikler ved cis- og trans-siden.
  - Lysosomer, vesikler, frie ribosomer, centrioler og mikrotubuli.
- Kerne og mitokondrier kan åbnes: et »låg« (en vinkelsektor af membranerne)
  løftes af og tones ud, og snitkanterne tegnes som membranstreger. Det er en
  visningsfunktion, ikke en biologisk proces.
- Hver organelgruppe kan vises/skjules, vælges (klik, liste eller etiket) og
  zoomes til. Etiketter med pegestreger følger 3D-ankrene.

## Filer

- `geometri.js`: parametriske gitre, `pude` (lukket tynd sæk om en
  midterflade), rør langs kurver, rammer, organiske kugler.
- `organeller.js`: alle organeller, deres farver, låg, snitkanter og ankre.
- `model.js`: renderer, lys, kamera, cellelegemet og betjenings-API.
- `side.js`: UI, etiketter, animationer, pegeredskaber og tastatur.
- `tekster.js`: navne, etiketretninger og faglige forklaringer.
- `forhaandsvisning.png`: reservebillede uden WebGL (laves af testen).
- `browser-test.mjs`: Playwright-test.

Three.js 0.169.0 (MIT) genbruges fra `../celle-3d/vendor/`. Modellen tegner
kun ved ændringer, ikke i en konstant løkke. Ca. 0,9 mio. trekanter og
200 tegnekald; prøv på en skolelaptop før optagelse i biblioteket.

## Kontrol

Med `python3 -m http.server 8777` fra repoets rod:

```sh
node biologi/dyrecelle-3d/browser-test.mjs
```

Testen tjekker start, udstrækning, uafhængig åbning/lukning, synlighed,
valg via liste/klik/etiket, zoom, tastatur, fokusvisning, mobil uden vandret
rulning og fallback uden WebGL. Den gendanner reservebilledet.

## Forenklinger

Størrelser, antal og farver er illustrative. Cytoplasmaets snitflader er en
illustrativ hjælp. Peroxisomer, mikrofilamenter og intermediære filamenter er
udeladt. Elevafprøvning mangler.
