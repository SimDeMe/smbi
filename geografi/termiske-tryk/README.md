# Termiske tryk

Selvstændig, buildfri simulation på `/geografi/termiske-tryk/`, med links fra
geografibiblioteket og atlasset. Den gamle adresse `/geografi/termisk-lavtryk/`
viderestiller hertil. En kontakt øverst i panelet skifter mellem **lavtryk**
(midtersøjlen opvarmes) og **højtryk** (midtersøjlen afkøles); `?tryk=hoejtryk`
i adressen åbner højtrykket direkte. Et skift nulstiller til trin 1 og stopper
afspilningen.

Tre luftsøjler side om side og fire trin, der kan vælges direkte eller
afspilles. Lavtryk:

1. Tre ens søjler: vandrette trykflader, ens tryk i alle højder.
2. Den midterste søjle opvarmes og udvider sig. Trykfladerne løftes, mest
   højt oppe; højere tryk i 5 km over den varme søjle, uændret bundtryk.
3. Udstrømning i højden mod begge kølige søjler; den varme søjles bundtryk
   falder, nabosøjlernes stiger.
4. Hele kredsløbet: indstrømning ved jorden, opstigning i midten, udstrømning
   i højden og nedsynkning over siderne — to cirkulationsceller.

Højtrykket er samme forløb med modsat fortegn: afkøling og sammentrækning,
indstrømning i højden og stigende bundtryk, og til sidst nedsynkning i midten,
udstrømning ved jorden og opstigning over siderne.

Figuren tegner fem trykflader (900–500 hPa) og en stiplet 5 km-linje. H/L ved
5 km og ved jorden er relative til nabosøjlerne i samme højde. Lavt nede
ender trykfladerne i lavtrykket med at ligge lavest i midten, højt oppe højest;
i højtrykket omvendt.

## Model

`model.js`: `beregn(opvarmning, overfoersel)` tager andele fra −1 til 1;
negative værdier er højtrykket. Tre tørre, isoterme, hydrostatiske søjler med samme tværsnit.
`p(z) = p₀ exp(−gz/RT)`, R = 287,05 J/(kg K), g = 9,81 m/s².
Alle starter med 1.000 hPa ved jorden og 288,15 K. Midtersøjlen opvarmes
fast med 20 K (15 → 35 °C) eller afkøles med 20 K (15 → −5 °C). En foreskrevet
masseoverførsel ændrer dens bundtryk med ∓10 hPa, og hver sidesøjle får ±5 hPa, så summen af bundtryk —
og dermed massen — er konstant. Den lodrette akse (0–6,9 km) er målfast;
trykfladernes løft er altså ikke overdrevet.

Det er illustrative modeltal, ikke observationer eller en prognose. Tid,
vind og overført masse følger en didaktisk sekvens, ikke bevægelsesligningerne;
i virkeligheden overlapper processerne. Rotation, fugt, blanding og de kølige
søjlers temperaturrespons er udeladt. Kilder er linket på siden.

## Betjening og afprøvning

Fire trinknapper (piletaster, Home/End), afspil/pause, næste trin og fokus.
Ingen skyder: opvarmningen er fast, så eleven kan koncentrere sig om
årsagskæden. Skift mellem trin glider over 1,8 s; afspilning holder hvert
trin i ca. 6,5 s. Strømningspilene bevæger sig i 9 s efter et trinskift og
står så stille. Reduceret bevægelse viser trinene uden overgange og bevægelse.
Figuren tegnes som SVG i containerens faktiske pixelstørrelse, så tekst har
samme størrelse på mobil og projektor. En skjult tekst giver skærmlæsere
trykket i hvert trin. Ingen ekstern JavaScript-afhængighed.

`node geografi/termiske-tryk/model.test.mjs` kontrollerer for begge retninger massebevarelse,
uændret bundtryk før massetab, løft af trykfladerne, begge trykgradienter og
uafhængige kontroltal.

Chromium: 1280×577, 1366×625, 1536×730 (også fokus), 640×625 og 375×812.
Figur og primære kontroller er samtidig synlige på de tre elevlaptops; ingen
vandret rulning. Afspilning, pause og piletaster er afprøvet. Fysisk touch,
Safari og skærmlæser er ikke særskilt afprøvet.
