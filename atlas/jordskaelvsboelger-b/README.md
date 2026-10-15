# Jordskælvsbølger model B

Selvstændig side på `/atlas/jordskaelvsboelger-b/` med modelkort i atlasset
(emne «Seismiske bølger», også under «Undersøg jordskælv og vulkaner»).
Ingen build og ingen eksterne biblioteker; kun atlassets egne skrifter.

## De tre dele – og hvorfor de hænger sammen

1. **Bølgerne** – et gitter af klippestykker, som P-, S- og Rayleigh-bølgen
   flytter hver på sin måde, plus «Kapløbet», hvor alle tre starter samtidig og
   når en seismograf 300 km væk i rækkefølgen P → S → overflade. Her etableres
   de to egenskaber, resten bygger på: P er hurtigst, S kan ikke gå gennem væske.
2. **Find skælvet** – et spil med et skjult epicenter i et opdigtet modelområde
   (500 × 360 km). Eleven aflæser P og S på 2–4 beregnede seismogrammer, får
   en cirkel pr. station (d = 8,0 km/s · Δt), sætter et bud og får facit med
   tabel, skælvets tidspunkt og en note, hvis to stationer eller stationer på
   linje giver to mulige punkter. Bonus: Richter-magnitude ud fra største udslag.
3. **Gennem Jorden** – stråler fra et skælv beregnet med ak135-farter og Snells
   lov. P- og S-skyggezonen opstår af beregningen; S stopper ved den flydende
   kerne. «Indre kerne» kan slås fra (Jorden før Inge Lehmann, 1936), så de
   svage P-bølger i skyggezonen forsvinder. Seismograf ved valgfri afstand og
   gangtidskurve, som viser, hvorfor 8 km/s kun gælder lokalt.

## Model og tal

| Del | Hvad | Kilde/kontrol |
| --- | --- | --- |
| 2 | vP = 6,0 km/s, vP/vS = 1,75 ⇒ vS = 3,43 km/s og d = 8,0 km/s · (tS − tP) | Typisk øvre skorpe (vP/vS 1,73–1,78) |
| 2 | Overfladebølger vR = 0,92 · vS | Rayleigh-bølge i Poisson-fast stof |
| 2 | ML = log10(A) + 1,11·log10(d) + 0,00189·d + 0,59 (A i mm, Wood-Anderson) | IASPEI-standarden (Hutton & Boore 1987), omregnet med Wood-Andersons forstørrelse 2080; gengiver Richters tabel (100 km → 3,0) |
| 2 | Største udslag i seismogrammet = A fra formlen; magnitude 2,8–5,0, højst 120 mm ved nærmeste station | Så elevens aflæsning giver den rigtige magnitude |
| 3 | Farter lagvis efter ak135 (afrundet), spring ved 20, 35, 410, 660, 2891 og 5153,5 km | Kennett, Engdahl & Buland (1995) |
| 3 | Gangtider: P 30°/60°/90° = 369/607/781 s, S = 667/1104/1432 s, PKIKP 180° = 1211 s | Inden for 2 % af iasp91/ak135-tabellerne |
| 3 | P-skygge ca. 99°–144°, S-skygge over ca. 103°, PKIKP/PKiKP i 117°–143° | Lærebøger: 103°–142°; forskellen er diffraktion, som ikke er med |

Den udbredte skoleformel ML = log10(A) + 3·log10(8·Δt) − 2,92 er bevidst
**ikke** brugt: Den afviger op til en halv magnitude fra Richters egen tabel
ved 200–300 km.

**Forenklinger, der står på siden:** ens skorpe, flad Jord i del 2, skælv tæt
ved overfladen (afstand langs jorden), skematisk bølgeform og styrke, overdrevet
bevægelse i del 1, ingen refleksioner (PP, PcP), SKS eller diffraktion i del 3.
Del 2 er et opdigtet område uden stednavne – metoden er generel og skal ikke
sættes på et vilkårligt sted på kortet. Rigtige seismogrammer findes i øvelsen
«Lokalisering af jordskælv».

## Filer

- `model.js` – S−P, ankomsttider, magnitude, syntetisk seismogram, cirkler.
- `jordmodel.js` – ak135-lag, strålegang (trinvis med krumning og Snells lov ved
  lagflader, totalrefleksion), vifter og ankomster ved en given afstand.
- `boelgetyper.js`, `lokalisering.js`, `gennemjorden.js` – de tre dele (canvas).
- `app.js` – faner (piletaster, `#del-2` i adressen), fokus, dialog, højde.
- `laerred.js` – skarp canvas, farver, danske tal, animationsløkke.

Tilgængelighed: faner og radiogrupper med piletaster; seismogrammerne er
fokuserbare (P/S vælger mærke, ← → flytter 0,1 s, Skift 1 s, Delete rydder);
kortet tager bud med Enter og piletaster. Reduceret bevægelse starter del 1 på
pause og springer afspilningerne over. Farve er aldrig eneste signal (P/S som
bogstaver, S stiplet).

## Test

```bash
node atlas/jordskaelvsboelger-b/model.test.mjs
NODE_PATH=værktøj/node_modules node atlas/test/jordskaelvsboelger-b.cjs
```

Modeltesten kontrollerer S−P-omregningen, Richters tabel og nomogram-eksempel,
seismogrammet (ingen NaN, stille før P, største udslag), cirklerne,
gangtiderne mod referencetabellerne og skyggezonerne. Browsertesten spiller
hele forløbet igennem ved 1280×577, 1366×625, 1536×730, 390×750 og 640×625 med
mus, touch og tastatur (`?test` i adressen giver testen adgang til facit).
