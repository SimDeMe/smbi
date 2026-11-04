# Byg Jordens indre (naturgeografi)

`geografi/byg-jordens-indre.html`: eleven sætter fagord på Jorden skåret over,
lag for lag. Siden har kun denne ene figur og derfor ingen faner. Motoren er den
samme som i «Byg cellen» og ligger i `/byg-motor/`; hvordan den virker, og hvordan
en figur er skrevet, står i `biologi/byg-cellen/LÆS-MIG.md`.

Figuren lå tidligere som fane på `geografi/byg-figuren.html`; links til
`byg-figuren.html#jord` sendes videre hertil.

## Figuren `#jord`

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
- Farverne følger temperaturen: kappen går fra mørkerød under skorpen til
  orange ved kernen, kernen gløder gul-orange og den indre kerne næsten hvid.
  Kuglens rand har hav og kontinenter og et blåt skær af atmosfære.
  Litosfæren er mørkere (kold og stiv) end den glødende astenosfære.

## Forenklinger (står også på siden)

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
