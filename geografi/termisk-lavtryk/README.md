# Termisk lavtryk

Selvstændig, buildfri simulation på `/geografi/termisk-lavtryk/`, med links fra
geografibiblioteket og atlasset. Fire manuelt valgbare trin og afspilning:

1. To ens luftsøjler med samme masse og temperatur.
2. Opvarmning udvider højre søjle; højere tryk ved samme højde (3.000 m),
   uændret bundtryk, fordi massen endnu ikke er ændret.
3. Udstrømning i højden overfører masse fra den varme til den kolde søjle;
   den varme søjles bundtryk falder, den kolde søjles stiger.
4. Indstrømning ved bunden mod det termiske lavtryk; samtidig udstrømning
   i højden. Cirkulationen fremstilles som en ligevægt ved fortsat varme.

Det markerede luftlag udvider sig synligt ved afspilning. Prikker viser
udvalgte luftpakker, ikke alle molekyler eller en optælling af hele massen.
Den stiplede linje viser samme geometriske højde i begge søjler; tabellen
sammenligner beregnet tryk både i den højde og ved jorden. H/L er relative.

## Model

`model.js`: to tørre, isoterme, hydrostatiske søjler med samme tværsnit.
`p(z) = p₀ exp(−gz/RT)`, R = 287,05 J/(kg K), g = 9,81 m/s².
Begge starter med 1.000 hPa ved jorden og 288,15 K. Opvarmningen er 0–30 K.
Ved udvidelse flyttes luftlagets oprindelige 4.000 m-grænse proportionalt
med den absolutte temperatur. Det er en markering i søjlen, ikke atmosfærens top.

En foreskrevet masseoverførsel svarer til 0–10 hPa fra varm til kold søjle.
Summen af bundtrykkene er konstant 2.000 hPa; ved samme tværsnit bevares den
samlede masse. Trykgradienten i højden forbliver rettet fra varm mod kold
for alle positive input, mens bundgradienten vender mod den varme søjle.
I sluttilstanden tegnes ind- og udstrømning i balance, uden yderligere massetab.

Det er illustrative modeltal, ikke observationer eller en prognose.
Tid, vindhastigheder og overført masse følger en didaktisk sekvens, ikke
bevægelsesligningerne. I virkeligheden overlapper processerne. Temperatur
er konstant op gennem hver søjle; rotation, fugt, blanding og den kolde
søjles temperaturrespons er udeladt. Kilder er linket på siden.

## Betjening og afprøvning

Varmeskyder, fire trin, afspil/pause, næste trin, nulstil og fokus.
Manuelle trin er stillbilleder. Afspilning viser udvidelse og masseoverførsel
over hver 3 s med 2 s læsepause. Reduceret bevægelse viser hele trin uden
løbende udvidelse eller vindprikker. Ingen ekstern JavaScript-afhængighed.

`node geografi/termisk-lavtryk/model.test.mjs` kontrollerer massebevarelse,
uændret bundtryk før massetab, udvidelse, begge trykgradienter og kontroltal.

Chromium: 1280×577, 1366×625, 1536×730, 390×750 og 640×625. Alle fire trin,
udvidelse, trykvisninger, strømpile, nulstil, tastatur/Home/End, fokus og
vandret overflow er afprøvet. Figur og primære kontroller er samtidig synlige
på de tre elevlaptops. Afspilning, pause og reduceret bevægelse er kontrolleret.
Skærmbilleder er gennemgået på laptop og mobil. Ingen JavaScript-fejl.
Fysisk touch, Safari og skærmlæser er ikke særskilt afprøvet.
