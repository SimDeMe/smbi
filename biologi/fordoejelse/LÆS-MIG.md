# Fordøjelsessystemet i 3D

Siden er `biologi/fordoejelse.html`. Modellen er bygget fra bunden i Blender af scriptet
`blender/fordoejelse.py` som en anatomimodel: hele kanalen fra mund til anus, lever,
galdeblære og galdegange, bugspytkirtel, tre par spytkirtler med udførselsgange, tunge,
tænder, gane og et gennemsigtigt omrids af kroppen.

## Byg modellen igen

```bash
B=/Applications/Blender.app/Contents/MacOS/Blender; D=~/Pictures/Blender/fordoejelse
$B -b --factory-startup --python biologi/fordoejelse/blender/fordoejelse.py -- $D render reserve
npx @gltf-transform/cli@4.5.1 optimize $D/Fordoejelse.glb biologi/fordoejelse/fordoejelse.glb \
  --compress meshopt --join false --flatten false --instance false --palette false \
  --texture-compress false --simplify-error 0.0005
cp $D/forloeb.json $D/reserve.jpg biologi/fordoejelse/
```

`render` laver preview-billeder fra fem kameraer i `$D/_preview` (uden kroppen, så organerne
kan ses). `reserve` laver `reserve.jpg`, som siden viser, hvis WebGL eller modellen fejler.
`--join false` er nødvendig, så hver del forbliver sit eget mesh.

## Sådan er modellen bygget

1 enhed = 1 cm; nul ved navlen; −x er personens højre side (leveren), −y er fortil.

* **Rør** (svælg, spiserør, mavesæk, tolvfingertarm, tyndtarm, tyktarm, endetarm,
  blindtarmsvedhæng, galdeblære, galdegange, bugspytkirtel, spytgange): en Catmull–Rom-kurve
  gennem anatomiske punkter med radius i hvert punkt, fejet med rotationsminimerende rammer.
  Mavesækken og bugspytkirtlen er trykket flade forfra-bagfra. Tyktarmen har haustrer
  (poser) mellem tre muskelbånd; mavesækken en indsnævring ved mavemunden.
* **Tyndtarmen** er en kæde, der slapper af i bughulen: en slangeformet startbane med bølger
  i, holdt inden for en ellipsoide, skubbet væk fra sig selv og fra tyktarmen, mavesækken og
  tolvfingertarmen, til ingen slynger går igennem hinanden (scriptet melder mindste afstand).
  De sidste ca. 5 cm (ileum) ligger fast og går vandret ind i blindtarmens inderside, så
  overgangen til tyktarmen er lukket.
* **Leveren**: et glattet sagittalt kiletværsnit (kuplet overside, skarp forreste nedre kant,
  underside der hælder op og bagud), fejet fra højre kant til venstre laps spids og skaleret efter
  et omrids forfra: rund højre lap, skrå nedre kant med hak ved leverbåndet. Leverbåndet er et
  rør på forsiden med samme `del`.
* **Klumper** (tunge, spytkirtler, kroppen): metaballs (ellipsoider), omsat til mesh og gjort
  knudret med Perlin-støj, hvor det passer.

Hvert objekt har egenskaben `del` (fx `mavesaek`, `spytkirtel`), som siden bruger til navn,
forklaring og fremhævning; spytkirtlerne har også `navn`. `forloeb.json` er madens vej
gennem kanalen i glTF-koordinater (cm), delt op i trin (`mund`, `svaelg` … `endetarm`).

## Siden

* `visning.js` — Three.js (genbruger `../celle-3d/vendor/`, r169), kamera, klik og hover,
  fremhævning, gennemsigtighed og madklumpen.
* `indhold.js` — organernes tekster, rundturens trin (pH, tider, enzymer), enzymernes
  pH-kurver og nøglepunkterne for nedbrydningen. Nøglepunkterne bygges af `bygForløb()` ud
  fra forholdene i «Hvad nu hvis …?» (pH i mavesækken, galde ja/nej).
* `opgaver.js` — undersøgelsesopgaverne i opgavekortet; «vis» stiller modellen op til opgaven.
* `molekyler.js` — stivelse, protein, fedt og kostfibre som små SVG-molekyler, der spaltes.
* `side.js` — faner, organliste, afspilning, fokus og reserve uden WebGL.

## Forenklinger

Tyndtarmen er ca. 2 m i modellen (5–6 m i virkeligheden). Tarmkrøset, karrene, bughinden og
milten er udeladt. Tider og pH er typiske, idealiserede værdier. Molekylerne er symboler.

Enzymernes aktivitet er klokkekurver exp(−((pH − optimum)/b)²) med optimum og bredde b:
amylase 6,9/1,4, pepsin 2/1,5, trypsin 8/1,6, lipase 8/1,5, maltase 6,5/1,5. Under 2 %
regnes som «virker ikke» i rundturen. Uden mavesyre spalter trypsin pepsins bindinger
(reservekurve i `molekyler.js`); uden galde når lipase kun ca. en tredjedel af fedtet, og kun
helt spaltede fedtmolekyler optages.

Elevafprøvning mangler.
