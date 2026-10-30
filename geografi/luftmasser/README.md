# Luftmasser, skyer og stabilitet

Selvstændig, buildfri SVG-animation på `/geografi/luftmasser/`. Forløb og
betjening følger `geografi/termiske-tryk/`: stor figur, fire trin, én kort
forklaring, afspil/pause, næste trin og fokus. Fire situationer kan vælges:
stabil, ustabil, betinget stabil og inversion. Der er ingen grafer,
temperaturaflæsninger, skyder eller manuel justering af luftpakker.

## Forløb og grafik

Landskabet tegnes responsivt som SVG med marker, vandløb, træer og huse.
Luftstrømme, opvarmning, små skyer, en voksende cumulonimbus med ambolt,
regn og lyn samt dis ved inversion vises efter scenariet.

`forloeb.mjs` indeholder fire faglige årsagskæder og deres synlige faser.
`simulation.js` styrer afspilning og tegning. Hvert trin varer syv sekunder;
forløbet starter automatisk ved valg af situation og stopper efter 28 sekunder.
Trinknapper viser stillbilleder, og afspilning kan fortsættes eller gentages.

Den første udgaves numeriske luftpakkeundersøgelse er erstattet af fire
kvalitative, fastlagte vejrforløb. Grafik og skyudvikling er illustrative,
ikke resultater fra en beregnet vejrmodel. Alle skyforløb antager fugtig luft;
opvarmning eller sammenstrømning leverer løftet. Det stabile eksempel viser
opvarmede termikbobler, der bremses i stabil luft højere oppe. Betinget
stabilitet viser først bremsning og derefter sammenstrømning ved jorden,
som giver ekstra løft nok til at udløse fri konvektion. Inversion viser
kold luft nær jorden under varmere luft og svag lodret blanding.

Der er ingen universel kobling mellem en stabilitetsklasse og én skytype.
Torden kræver fugt, løft og tilstrækkelig dyb ustabilitet. En kort note og
faglige kilder er samlet under «Om modellen» på siden.

Pause stopper alle bevægelser. Faneskift springer ikke frem i forløbet.
`prefers-reduced-motion` viser stillbilleder med trinvalg. Lyn tegnes i skyen,
udsendes højst én gang hvert 5,5 sekund og giver ingen blinkende baggrund.
SVG har tekstalternativ, og alle knapper virker med tastatur. Trinrækken
understøtter piletaster, Home og End. Escape forlader fokusvisning.

## Kontrol

`node geografi/luftmasser/forloeb.test.mjs` kontrollerer faser og rækkefølge:
fire trin, ingen byge i stabil luft eller inversion, ekstra løft før vækst
i det betingede forløb og regn først efter udvikling af en høj sky.

`node værktøj/pladstjek.mjs geografi/luftmasser/index.html` kontrollerer
skærmplads. Figur og primære kontroller er samtidigt synlige ved 1280×577,
1366×625 og 1536×730. Ingen vandret rulning ved 380, 390 og 640 px.

Chromium: alle fire forløb, automatisk start og afslutning, pause,
genafspilning, trinvalg, næste, tastatur, fokus, Escape og reduceret bevægelse.
Skærmbilleder af alle fire sluttilstande og mobil er visuelt efterset.
Ingen JavaScript-fejl. Fysisk touch, Safari og skærmlæser er ikke særskilt testet.
