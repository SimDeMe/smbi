# Byg hjertet og kredsløbet

`biologi/byg-hjertet.html`: eleven sætter fagord på hjertet i snit, på det
dobbelte kredsløb og på alveolen med en lup ind på væggen mellem luft og blod.
Siden bruger den fælles motor i `/byg-motor/` (se `byg-cellen/LÆS-MIG.md`).

## Bestillingen

1. **Pointen i én sætning.** Hjertet er to pumper side om side, og blodet
   kommer gennem det to gange på én tur: én gang til lungerne for at få ilt og
   én gang ud i kroppen for at aflevere den.
2. **Hvad den afløser.** Hjertet og alveolen i «Byg figurer i biologi»
   (`byg-biologi.html`, som nu kun sender gamle links videre).
3. **Naboerne.** `byg-organsystemerne.html` har kredsløbet og åndedrættet som
   oversigt på hele kroppen. Her går vi i dybden.
4. **Figurerne.** Tre faner, 2–3 lag hver, 26 pladser i alt.

| Fane | Lag | Fagord | Ord i overskud |
|:--|:--|:--|:--|
| Hjertet `#hjerte` | Fire hulrum og en væg | højre/venstre forkammer, højre/venstre hjertekammer, skillevæg | |
| | Karrene ind og ud | hulvener, lungearterie, lungevener, aorta | kranspulsåre |
| | Klapperne holder retningen | sejlklapper, lommeklapper, senetråde | |
| Kredsløbet `#kredsloeb` | To kredsløb | lungekredsløbet, det store kredsløb | |
| | Tre slags kar | arterie, kapillærnet, vene | lymfekar |
| | Hvor er ilten? | iltfattigt blod (på lungearterien), iltrigt blod (på lungevenerne) | |
| Alveolen `#alveole` | Luften møder blodet | bronkiole, alveole, kapillær | |
| | Gasudvekslingen | O₂ til blodet, CO₂ til luften, rødt blodlegeme, tynd væg | hvidt blodlegeme |

De typiske elevfejl, som fejlteksterne tager fat i:

- **Højre og venstre byttet om.** Hjertet ses forfra, så højre side står til
  venstre. Fejlteksten siger det, og tykkelsen af kammervæggen er et ekstra spor.
- **«Arterier fører iltrigt blod.»** Lag 3 i kredsløbet sætter *iltfattigt
  blod* på lungearterien og *iltrigt blod* på lungevenerne. Arterie/vene handler
  om retningen i forhold til hjertet.
- **Sejlklap og lommeklap.** Placeringen (mellem forkammer og kammer / ved
  udgangen til en arterie) er selve pointen.

## Filerne

| Fil | Indhold |
|:--|:--|
| `../byg-hjertet.html` | siden |
| `figurer.js` | `FIGURER`, `ORD` og nøglen `byg-hjertet.v1` |
| `ordliste.js` | fagordene og forklaringerne (højst 200 tegn) |
| `tegning.js` | farver, gradienter, blodkar som rør (`vene`, `arterie`), strømpile, røde blodlegemer |
| `fig-hjertet.js` | hjertet i snit forfra |
| `fig-kredsloeb.js` | skemaet med lunger, hjerte og kroppens væv |
| `fig-alveolen.js` | klasen af alveoler og luppen |

Selvtest: `node byg-motor/selvtest.mjs biologi/byg-hjertet.html`.

## Tegningen

- Farverne er faste: blå for iltfattigt og rød for iltrigt blod, en varm
  muskelfarve til hjertevæggen og cremefarvede klapper.
- Karrene er rør med mørk kant og butte ender, så de kan munde ud i et hulrum
  uden en streg på tværs. Hulrummene har ingen kant af samme grund.
- I lag 2 og 3 af kredsløbet tegner dele oven i det, der allerede står (fx
  aortas lodrette stykke), så netop det stykke står gråt, til ordet sidder.
- Hvert kar har små pile i strømretningen. De står på karrets egen del, så de
  først kommer frem, når karret gør.

## Forenklinger (står også på siden)

- Hjertet: lungevenerne fra højre lunge og kranspulsårerne er ikke tegnet;
  lungearteriens grene og aortabuen er trukket lidt fra hinanden. To af
  lommeklappernes tre lommer ses.
- Kredsløbet: kroppens organer er samlet i ét kapillærnet.
- Alveolen: luppen er ikke i målestok. Barrieren er under 1 µm, et rødt
  blodlegeme ca. 7 µm.

## Idéer, der ikke er lavet

- Hjertets cyklus som trinfigur: systole/diastole, hvilke klapper der er
  åbne, og hvor blodet er.
- Lungerne som organ (luftrør, bronkier, lungehinder, mellemgulv) mellem
  kredsløbet og alveolen.
