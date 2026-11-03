# Drivhuseffekten — kvalitativ simulation

Ny, selvstændig udgave til NV og naturgeografi C. De ældre simulationer på
`../drivhuseffektenSimpel.html` og `../drivhuseffekten.html` er bevaret.

## Læringsmål og progression

Eleven skal kunne forklare solstrålingens absorption, jordens udsendelse af
varmestråling, drivhusgassernes absorption og atmosfærens egen udsendelse,
herunder modstråling. Ingen temperaturtal, strømregnskaber eller balanceopgaver.
Fem trin afslører processer gradvist; de slår ikke kendt fysik fra.

## Model og visning

`model.mjs` er en normaliseret tolagsmodel med varmekapaciteter, udsendelse
proportional med T⁴ og ens langbølget absorptivitet og emissivitet i atmosfæren.
Overfladen modtager solstråling og modstråling; atmosfæren modtager en del af
jordens udstråling og udsender lige meget opad og nedad. Intern energi er
proportional med 5 × jordtemperatur + 2,5 × lufttemperatur. Ændringen svarer
til solindstråling minus udstråling til rummet. Atmosfærens absorption er 0,78.

`simulation.js` omsætter strømmenes størrelse til hyppighed af symbolske
strålingsspor. Sporene er ikke individuelle fotoner eller en Monte Carlo-
beregning af temperatur. Atmosfærens udsendelse genereres uafhængigt af de
absorberede spor. Gasplaceringer og spor er symbolske; den fysiske model har ét
atmosfærelag. De synlige retninger dækker opad, nedad og til siderne.

Solafskærmningen ændrer kun soltilførsel. Sammenligningen i sidste trin
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
