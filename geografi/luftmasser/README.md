# Atmosfærisk stabilitet – luftpakkeundersøgelse

Buildfri SVG-simulation på `/geografi/luftmasser/`. Den samme luftpakke, varmet
2 °C af jorden, slippes uden løft i fire atmosfærer, som tør eller fugtig pakke.
Højdefiguren står side om side med en temperatur–højde-graf på samme akse, så
forklaringen på udfaldet kan aflæses: er pakkens kurve til højre for
omgivelsernes, har den opdrift.
Skyderen tvinger pakken op (bjerg, front); derefter kan den slippes.
Pause, nulstil, fokus og Escape understøttes. Reduceret bevægelse giver
trin på 30 modelsekunder. Skift af atmosfære eller fugt nulstiller forsøget.

## Faglig model

Bygger på NaturgeografiGrundbogen B, kapitel 10.5, afsnittet «Konvektion
afhænger af luftmassens vandindhold» og figur 10.5.19. `model.mjs` adskiller
fysik fra SVG og betjening.

Omgivelserne er 20 °C ved jorden, pakken 22 °C. Umættet afkøling er
1 °C/100 m, mættet 0,5 °C/100 m. Dugpunktet falder 0,2 °C/100 m og er 10 °C
(tør, skybase 1.500 m) eller 18,8 °C (fugtig, skybase 400 m).

| Atmosfære (°C/100 m) | Tør pakke | Fugtig pakke |
| --- | --- | --- |
| Inversion (+0,4 til 1.000 m, derefter −0,6) | stopper ved 143 m | stopper ved 143 m |
| Stabil (−0,4) | stopper ved 333 m | stopper ved 333 m |
| Betinget stabil (−0,7) | stopper ved 667 m | sky fra 400 m, fortsætter op |
| Ustabil (−1,2) | sky fra 1.500 m, fortsætter op | sky fra 400 m, fortsætter op |

Ligevægtshøjden er 2 / (1,0 − gradient) · 100 m, så længe pakken er umættet.
Tvinges den tørre pakke over 2.750 m i betinget luft, får den opdrift igen.
Bogen beskriver stabil luft som uden opdrift; de 2 °C ekstra er modellens
igangsætter, og derfor stiger pakken et kort stykke, før den stopper.

Bevægelsen integrerer g·ΔT/T_omgivelser − 0,015·v med højst 0,1 s deltrin og
vises 30 gange hurtigere end modeltiden. Inertien giver en lille svingning om
ligevægten. Vanddamps bidrag til densitet er udeladt.

Tryk integreres hydrostatisk i omgivelsesprofilen. Volumen følger idealgasloven
ved omtrent konstant masse; kugleradius skalerer med kubikroden af volumen.
Luftpakken er forstørret i forhold til højdeskalaen; den relative vækst er
korrekt. Ved synkning antages kondensvand bevaret, så fordampning fører pakken
tilbage langs samme idealiserede temperaturkurve. Ingen nedbør.
3.000 m er figurens øvre grænse, ikke et stabilt loft.

`forloeb.mjs` og `forloeb.test.mjs` beskriver det tidligere kvalitative
forløb og bruges ikke længere af siden.

## Kontrol

- `node geografi/luftmasser/model.test.mjs`: temperatur, skybase, tryk, volumen,
  ligevægtshøjder regnet i hånden og fri bevægelse i alle kombinationer.
- `node værktøj/luftpakke-test.mjs`: alle otte udfald, tvunget løft, pause,
  tastatur, fokus, reduceret bevægelse og mobil i browser.
- `node værktøj/pladstjek.mjs geografi/luftmasser/index.html`: laptop og mobil.
