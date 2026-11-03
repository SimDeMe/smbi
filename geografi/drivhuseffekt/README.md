# Drivhuseffekten — kvalitativ simulation

Ny, selvstændig udgave til NV og naturgeografi C. De ældre simulationer på
`../drivhuseffektenSimpel.html` og `../drivhuseffekten.html` er bevaret.

## Læringsmål og progression

Eleven skal kunne forklare solstrålingens absorption, jordens udsendelse af
varmestråling, drivhusgassernes absorption og atmosfærens egen udsendelse,
herunder modstråling og forstærket drivhuseffekt. Seks trin afslører processer
gradvist; de slår ikke kendt fysik fra. De første fire trin er uden tal. De sidste
to viser en enkel temperatursammenligning, ingen strømregnskaber eller balanceopgaver.

## Model og visning

`model.mjs` er en normaliseret tolagsmodel med varmekapaciteter, udsendelse
proportional med T⁴ og ens langbølget absorptivitet og emissivitet i atmosfæren.
Overfladen modtager solstråling og modstråling; atmosfæren modtager en del af
jordens udstråling og udsender lige meget opad og nedad. Intern energi er
proportional med 5 × jordtemperatur + 2,5 × lufttemperatur. Ændringen svarer
til solindstråling minus udstråling til rummet.

Temperaturskalaen er normaliseret, så 1 svarer til 255,15 K (−18 °C).
Absorptionen er indstillet ud fra den analytiske ligevægt:
`absorption = 2 × (1 − (255,15 / (sluttemperatur + 273,15))⁴)`.
Det giver tre valgte referencepunkter: −18 °C uden drivhuseffekt, +15 °C som
sædvanlig afrundet reference med drivhuseffekt og +18 °C som forstærket
undervisningseksempel. De to første følger NASAs gængse oversigtsforklaring;
+15 °C er ikke en aktuel måling af et bestemt år. +18 °C er hverken en prognose
eller en beregning ud fra en bestemt CO₂-koncentration. Modellen er kalibreret
til referencepunkterne og forudsiger dem ikke uafhængigt.

Den viste temperatur følger den løbende modeltilstand, mens knappernes tal er
sluttemperaturer. Forstærket absorption øger modstrålingen og giver gradvis
opvarmning ved uændret soltilførsel. Fem symbolske gasfigurer erstatter de tre;
antallet angiver ikke et bestemt koncentrationsforhold. En ekstra absorberet
jordbane og en tyndere direkte bane viser ændringen i strålingens vej.

`simulation.js` viser få faste, sammenhængende procesbaner. Solstrålingen
vises med tre parallelle baner; varmestrålingen vises som bølgede baner.
Motion design består af en rolig optegning af den nye proces, en løbende
bølgebevægelse og en glans, som glider langs de faste solbaner. Retningen
vises kun med endepile; der er ingen ekstra pilesymboler ved teksterne. De eksisterende
processer forbliver synlige ved næste trin. Der bruges ingen tilfældige
partikler eller retninger.

De få baner viser udvalgte retninger, ikke hele fordelingen af stråling.
Fra hvert drivhusgassymbol vises én bane mod jordoverfladen og én mod rummet.
De vises samtidig og uafhængigt af absorptionen, så atmosfæren udsender selv.
Disse to retninger repræsenterer udsendelse i alle retninger.
Banernes styrke følger kvalitativt modellens strømme; pilenes hastighed er
illustrativ og repræsenterer ikke lysets fart. Banerne er ikke individuelle
fotoner eller en beregning af temperatur. Molekylsymboler, geometri og tid er
illustrative. Landskabet har daghimmel og en stiliseret kyst, ikke en bestemt
geografisk placering.

Solafskærmningen ændrer kun soltilførsel. Sammenligningerne i de sidste to trin
ændrer kun drivhusgassernes langbølgede absorption og udsendelse og lader
soltilførslen være konstant. Temperaturerne udvikler sig løbende og springer
ikke ved skiftet. Trinskift og nulstilling starter derimod en ny demonstration.

Kilder og forenklinger findes også i sidens »Om modellen«.

## Afprøvning

Åbn via en lokal server fra repoets rod. `?projektor=1` starter i fokusvisning.
Ved reduceret bevægelse starter simulationen med pause og viser retningspile;
eleven kan selv starte animationen.

Kør `node geografi/drivhuseffekt/test.mjs` for modelkontrol og
`node værktøj/pladstjek.mjs geografi/drivhuseffekt/index.html` for skærmplads.
Med serveren kørende: `node geografi/drivhuseffekt/browser-test.mjs` tester
alle trin og forsøg, tastatur, pause, fokus, reduceret bevægelse og layout.
Testen bruger pladstjekkets Playwright-installation og gemmer skærmbilleder i
`værktøj/ud/`. Sæt `PORT` hvis serveren bruger en anden port end 8777.

### Elevafprøvning (mangler)

Vis først startskærmen kort. Spørg, hvad eleven lagde mærke til, og hvad eleven
ville gøre. Lad derefter eleven undersøge uden løbende hjælp. Bed eleven
forudsige, om jorden stråler uden sollys, og forklare forskellen mellem absorption
og udsendelse. Afslut med en sammenhængende forklaring i »Forklar selv«.
Kontrollér især, om atmosfæren opleves som et spejl eller fast låg, og om eleven
forstår både udsendelse mod rummet og mod jordoverfladen. Designet er ikke
valideret med elever endnu.
