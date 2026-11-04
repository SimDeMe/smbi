# Byg figuren (naturgeografi)

`geografi/byg-figuren.html` (overskrift «Byg vandets kredsløb»): eleven sætter
fagord på en figur, der bygges lag for lag. Siden har kun vandets kredsløb.
Jordens indre har sin egen side, `geografi/byg-jordens-indre.html` (se
`geografi/byg-jordens-indre/LÆS-MIG.md`); gamle links til `byg-figuren.html#jord`
sendes videre dertil. Motoren er den samme som i «Byg
cellen» og ligger i `/byg-motor/`; hvordan den virker, og hvordan en figur er
skrevet, står i `biologi/byg-cellen/LÆS-MIG.md`.

Hver figur hører til ét emne, og emner blandes ikke på samme side. En figur,
der naturligt bygger videre på vandets kredsløb, kan blive en fane her: en ny
`fig-*.js`, ordene i `ordliste.js` og figuren i `FIGURER` i `figurer.js`. Et nyt
emne får sin egen side og mappe som `byg-jordens-indre/`. Idéerne står i
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

## Forenklinger (står også på siden)


- Ikke i målestok: højderne er stærkt overdrevne.
- Pilene er lige tykke, men mængderne er meget forskellige.
- Ikke tegnet: vindens transport af vanddamp ind over land, smeltevand,
  fordampning fra søen og jorden, og grundvand, der strømmer ud i søen og vandløbet.
