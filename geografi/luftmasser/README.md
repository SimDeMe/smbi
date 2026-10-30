# Luftmasser, stabilitet og inversion

Selvstændig, buildfri simulation på `/geografi/luftmasser/`. Linkes fra
geografibiblioteket. Dansk elevvisning med fire temperaturprofiler, fire
illustrative luftmasser, manuel løfteskyder, slip/pause og fokustilstand.

Eleven sammenligner luftpakkens temperatur med omgivelserne ved samme højde.
Figurens pil viser opdrift, ikke hastighed. En temperaturgraf viser også
skybasen og overgangen mellem tør- og fugtadiabatisk afkøling. Opgaver,
forklaringer om luftmasser, modelantagelser og kilder kan foldes ud.

## Model

`model.mjs` indeholder de rene beregninger og justerbare modeltal.
`simulation.js` tegner SVG og integrerer bevægelsen efter slip.

- Umættet: −9,8 °C/km; mættet: −6 °C/km; dugpunkt: −1,8 °C/km indtil mætning.
- Stabil profil: −4 °C/km; ustabil: −11 °C/km; betinget: −7 °C/km.
- Inversion: +6 °C/km op til 800 m, derefter −7 °C/km.
- Alle luftpakker starter ved samme temperatur som omgivelserne ved jorden.
  Skift af luftmasse ændrer begge temperaturer og pakkens startdugpunkt,
  men bevarer omgivelsernes valgte temperaturgradient.
- Skybase beregnes ved skæringen mellem pakkens temperatur og dugpunkt.
  For varm havluft er skybasen 500 m; i den betingede profil er pakken først
  varmere end omgivelserne over 1.900 m. Tør varm fastlandsluft får ikke
  positiv opdrift inden for modellens 4 km i den betingede profil.
- Opdrift: g·(T_pakke−T_ude)/(T_ude+273,15). Samme tryk, idealgas,
  uden korrektion for virtuel temperatur. Dæmpning: 0,02 s⁻¹.
  Integration med deltrin på højst 0,04 s; tid fremskyndet 24 gange.
- Ingen blanding, nedbør, is eller vind. Konstant fugtadiabatisk gradient er
  en tilnærmelse. Kondensat følger pakken og fordamper igen ved nedsynkning,
  så temperaturvejen er reversibel. Figuren stopper ved jorden og 4 km.
- Reduceret bevægelse beregner samme bevægelsesforløb og viser slutpunktet
  uden animation. Der er ingen eksterne JavaScript-afhængigheder eller lagring.

Fagligt grundlag: NWCG, *Atmospheric Stability*, og FAA, *Aviation Weather
Handbook*, kapitel 13. Links findes på siden.

## Kontrol

`node geografi/luftmasser/model.test.mjs` kontrollerer uafhængige
håndberegninger af skybase, temperaturer, fri opstigning, inversion og
opdriftens fortegn for samtlige luftmasser.

`node værktøj/pladstjek.mjs geografi/luftmasser/index.html` kontrollerer
skærmplads og gemmer skærmbilleder. Efterset ved 1280×577, 1366×625,
1536×730 og 390×750. Figur og primære kontroller kan ses samtidigt på de
nævnte laptopstørrelser. Ingen vandret rulning ved 380, 390 eller 640 px.

Chromium-funktionstest: stabil tilbagebevægelse; ustabil opstigning;
betinget profil med sky uden opdrift ved 800 m og med opdrift ved 2.500 m;
tør fastlandsluft; pause/fortsæt; profilskift under bevægelse; modeltop;
nulstilling; tastaturbetjent skyder; fokus og Escape; reduceret bevægelse.
Ingen JavaScript-fejl. Fysisk touch, Safari og skærmlæser er ikke særskilt testet.
