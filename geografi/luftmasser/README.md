# Atmosfærisk stabilitet – luftpakkeundersøgelse

Buildfri SVG-simulation på `/geografi/luftmasser/`. Den samme luftpakke, varmet
2 °C af jorden, slippes uden løft i fire atmosfærer, som tør eller fugtig pakke.
Højdefiguren står side om side med en temperatur–højde-graf på samme akse, så
forklaringen på udfaldet kan aflæses: er pakkens kurve til højre for
omgivelsernes, har den opdrift.
Skyderen tvinger pakken op (bjerg, front); derefter kan den slippes.
Pause, nulstil, fokus og Escape understøttes. Reduceret bevægelse giver
trin på 30 modelsekunder. Skift af atmosfære eller fugt nulstiller forsøget.

## Siden som ét arbejdsfelt

Designet følger `design_rules.md` og `simulationsdesign.md`: én aktuel forklaring
ved figuren, få primære handlinger og sekundære data efter behov. Der er ingen
introduktion, regelbokse, gentagne årsagskæder eller opgaver under startfiguren.
Modellen i `model.mjs` er bevaret.

## Fanen Adiabatisk afkøling

Tre visninger deler højde og forsøgstilstand:

- **Undersøg** (`stige.js`): to pakker med mindre/mere vanddamp løftes eller
  sænkes 100 m ad gangen fra enhver højde. Temperaturen, den seneste ændring og
  tilstanden umættet/mættet står ved pakken. Én tekst ovenover forklarer den
  aktuelle proces. RF og de seneste trin ses kun ved at åbne “Vis målinger”.
- **Forklaring** (`begreb.js`): tre elevstyrede illustrationer om trykfald,
  udvidelsens arbejde og fortætning. De bruger den aktuelle højde fra forsøget.
  Sammenligningen med/uden fortætning viser en opbygget forskel, ikke en
  pludselig opvarmning. Forklaring og aktuel sammenligning står samlet ovenover.
- **Temperaturkurve**: temperatur, dugpunkt og den tænkte temperatur uden
  fortætning. Fugtvalg og skyder er tilgængelige her. Automatisk løft standser
  ved skybasen og toppen. Beregninger er samlet under “Vis målinger”.

På laptop tilpasses figurens højde til pladsen efter tekst og betjening.
På mobil står betjeningen før figuren og kan følge med under rulning.

## Stabilitetsfanerne

Figur og temperaturgraf deler højdeakse. Sidepanelet har én forklaring på den
aktuelle opdrift, fugtvalg, slip/pause og tvunget løft. Definitioner og yderligere
forklaring af temperatur og graf åbnes efter behov i sidepanelet.

## Sidste fane: Opgaver

`opgaver.js` samler alt elevarbejde og viser én valgt opgave ad gangen:
forklar energien, tegn bevægelsen, tolk temperaturer, find vippepunktet,
ret en forklaring, lav en vejrmelding og regn selv. De to forståelsesspørgsmål og
fire regneopgaver er flyttet hertil. Forsøgsknapper vælger profil, fugt og højde
uden automatisk at starte bevægelsen. Højde–tid-sammenligningen bruger samme
bevægelsesmodel og modelminutter.

Valg, tekstsvar og kurvepunkter bevares ved skift af opgave og fane, men ikke ved
genindlæsning. Sparring åbnes af eleven; fritekst bedømmes ikke automatisk.

## Didaktisk afprøvning

Designet er teknisk afprøvet, ikke læringsevalueret med elever. Ved en kort
neutral tænke-højt-afprøvning undersøges, om eleven kan finde løft/sænk,
forbinde større pakke og lavere temperatur samt forklare, hvorfor fortætning
bremser afkølingen. Bed derefter eleven forudsige synkning i et nyt tilfælde.
Notér behov for hjælp særskilt fra selvstændige forklaringer.

## Faglig model

Bygger på NaturgeografiGrundbogen B, kapitel 10.5, afsnittet «Konvektion
afhænger af luftmassens vandindhold» og figur 10.5.19. `model.mjs` adskiller
fysik fra SVG og betjening.

Omgivelserne er 20 °C ved jorden, pakken 22 °C. Umættet afkøling er
1 °C/100 m, mættet 0,5 °C/100 m. Dugpunktet falder 0,2 °C/100 m og er 10 °C
(tør, skybase 1.500 m) eller 18,8 °C (fugtig, skybase 400 m).
Relativ luftfugtighed (46 % og 82 % ved jorden) følger af dugpunkt og temperatur
med Magnus-formlen og vises på pakken.

| Atmosfære (°C/100 m) | Tør pakke | Fugtig pakke |
| --- | --- | --- |
| Inversion (+0,4 til 1.000 m, derefter −0,6) | stopper ved 143 m | stopper ved 143 m |
| Stabil (−0,4) | stopper ved 333 m | stopper ved 333 m |
| Betinget stabil (−0,7) | stopper ved 667 m | sky fra 400 m, fortsætter op |
| Ustabil (−1,2 til 500 m, derefter −0,65) | stopper ved 1.357 m | sky fra 400 m, fortsætter op |

Ligevægtshøjden er 2 / (1,0 − gradient) · 100 m, så længe pakken er umættet.
Tvinges den tørre pakke over 2.750 m i betinget luft eller 1.833 m i ustabil luft,
får den opdrift igen.

Ustabil luft var tidligere −1,2 °C/100 m hele vejen til 3.000 m. Det gav omgivelser
på −16 °C og et overskud på 15,5–21 °C, langt over det, der ses i virkeligheden.
Så hurtig afkøling findes kun i et tyndt lag over solopvarmet jord; derover er
−0,65 °C/100 m nær troposfærens typiske gennemsnit. Overskuddet er nu højst 3,0 °C
(tør) og 7,3 °C ved 3.000 m (fugtig). Det sidste er stadig i overkanten, fordi
modellen har fast fugtadiabat og ingen opblanding. Pakken bremses først over
figuren, senest ved tropopausen.
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

## Lydfeedback

`afproevning.js` kobler siden på den fælles lydfeedback (`feedback/LYD.md`). Med et
afprøvningslink kan deltageren optage sig selv, mens simulationen bruges. Loggen følger
knapper, skydere og fold-ud med fane, fugt og højde, men aldrig det, der skrives i felter.
Uden link og modtager indlæses modulet uden at vise noget, og simulationen er uændret.

## Kontrol

- `node geografi/luftmasser/model.test.mjs`: temperatur, skybase, tryk, volumen,
  ligevægtshøjder regnet i hånden og fri bevægelse i alle kombinationer.
- `node værktøj/luftpakke-test.mjs`: alle otte udfald, tvunget løft, pause,
  tastatur, fokus, reduceret bevægelse og mobil i browser.
- `node værktøj/pladstjek.mjs geografi/luftmasser/index.html`: laptop og mobil.
- `node værktøj/lydfeedback-test.mjs`: optagelse, log, fejl og kvittering.
