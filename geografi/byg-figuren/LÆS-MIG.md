# Byg figuren (naturgeografi)

`geografi/byg-figuren.html`: eleven sætter fagord på en figur, der bygges lag
for lag. Figurerne er vandets kredsløb og Jordens indre. Motoren er den samme som i «Byg
cellen» og ligger i `/byg-motor/`; hvordan den virker, og hvordan en figur er
skrevet, står i `biologi/byg-cellen/LÆS-MIG.md`.

Nye geografifigurer bliver flere faner på denne side: en ny `fig-*.js`, ordene
i `ordliste.js` og figuren i `FIGURER` i `figurer.js`. Idéerne står i
idélisten i `biologi/byg-cellen/LÆS-MIG.md`.

## Vandets kredsløb `#vand`

1. **Pointen i én sætning.** Vandet ligger i magasiner og flyttes mellem dem af
   transportmekanismer, og de to slags fagord sidder forskellige steder:
   magasinerne på et område, transportmekanismerne på en pil.
2. **Ordene** er dem fra arbejdsarket «Vandets kredsløb» i ng C (Vand og jord,
   modul 3) og Naturgeografi C s. 119–124. Forlæg for snittet: figur 14.1 i
   Vores Verden.
3. **Naboerne.** `geografi/Dugpunkt.html` ejer kondensationen og skydannelsen,
   `geografi/Stigningsregn.html` den orografiske nedbør, og porøsitet og
   permeabilitet har `geografi/poroesitetPermeabilitet.html`. Her står kun en sætning om hver.

| Lag | Fagord |
|:--|:--|
| Magasinerne | hav, atmosfære, is og sne, overfladevand, grundvand |
| Vandet op og ned | fordampning, transpiration, kondensation, nedbør (+ vanddamp i overskud) |
| Vandet på og i jorden | infiltration, overfladeafstrømning, grundvandsstrømning |

- **Fælden:** skyer er dråber, ikke vanddamp. Vanddamp er et ord i overskud, og
  sættes den eller fordampning på skyen, forklarer pladsens `fejl` det.
- Stiplede pile er vanddamp, fuldt optrukne pile er flydende vand.
- Himlen, jorden og træerne er baggrund (`ord: null`) og har farve fra start,
  så luft og jord kan skelnes. Atmosfæren er tegnet som slør af damp.
- Figuren er 1400 × 800 med pladser på 256 × 42, fordi
  »overfladeafstrømning« er langt. På mobil er den 940 px bred og ruller vandret.

## Jordens indre `#jord`

1. **Pointen i én sætning.** Jordens lag kan deles på to måder, efter hvad de er
   lavet af og efter hvor stive de er, og de to inddelinger falder ikke sammen:
   litosfæren er skorpen plus den øverste del af kappen.
2. **Ordene** er dem fra Naturgeografi C om Jordens opbygning og pladetektonik.
3. **Naboerne.** `geografi/pladegraenser.html` ejer pladegrænserne og
   bevægelsen, `geografi/stensamling` bjergarterne. Her står kun en sætning om
   basalt og granit.

| Lag | Fagord |
|:--|:--|
| Hvad Jorden er lavet af | skorpe, kappe, kerne |
| To slags skorpe | oceanbundsskorpe, kontinental skorpe |
| Stift, blødt og flydende | litosfære, astenosfære, ydre kerne, indre kerne (+ magma i overskud) |

- **Fælden:** kappen er ikke et hav af magma, og pladerne glider ikke på
  smeltet sten. Magma er ordet i overskud, og forklaringen siger, at det
  flydende i kernen er jern.
- Kuglen er i målestok (radius 6371 km = 300 px), undtagen skorpen. Udsnittet
  til højre er de øverste 400 km i målestok i dybden (1,5 px pr. km), men ikke i
  bredden. Litosfæren er ca. 80 km under havet og 150 km under kontinentet,
  astenosfæren går ned til ca. 350 km.
- Skorpen og kappen er tegnet både på kuglen og i udsnittet, og pladsens gule
  felt dækker begge steder.
- Pladserne er 232 × 42 for »kontinental skorpe«.

## Forenklinger (står også på siden)

Vandets kredsløb:


- Ikke i målestok: højderne er stærkt overdrevne.
- Pilene er lige tykke, men mængderne er meget forskellige.
- Ikke tegnet: vindens transport af vanddamp ind over land, smeltevand,
  fordampning fra søen og jorden, og grundvand, der strømmer ud i søen og vandløbet.

Jordens indre:

- Skorpen er tegnet alt for tyk på kuglen. I udsnittet er bredden ikke i
  målestok, og land og hav er tegnet for høje og dybe.
- Også astenosfæren er fast sten. Magma findes kun i små lommer.
- Litosfæren er 50–100 km under havene og 100–200 km under kontinenterne.
  Kappen under astenosfæren er stiv igen og har ingen plads.
- Grænsen mellem de to slags skorpe er en lodret streg.

## Test

```bash
node byg-motor/selvtest.mjs geografi/byg-figuren.html
node byg-motor/selvtest.mjs biologi/byg-cellen.html
```
