# Havstrømme

Adresse: `/atlas/havstroemme/` (modelkortet «Havstrømme» i atlasset, også under
Nordatlanten og i opgaven «Havstrømme og Grønlandspumpen»).

Samme globus som [cirkulationsmodellen](../cirkulation/) – mørk natkortstil,
D3's ortografiske projektion på Canvas 2D – men med havets overfladestrømme i
stedet for 3-cellemodellen. Globuskoden og CSS'en er kopieret og tilpasset, så
de to moduler kan ændres hver for sig; vinden importeres fra
`../cirkulation/model.js`.

## Hvad man kan

- Løbende spor langs ca. 35 hovedstrømme, farvet varm / kold / hverken-eller,
  med navne på kortet. På pause vises faste pile langs strømmene.
- Kontakter: «Vind» (cirkulationsmodellens vind ved jævndøgn som stiplede
  pile), «Hvirvler» (de fem subtropiske hvirvler, med/mod uret),
  «Transportbånd» (skematisk termohalin cirkulation med nedsynkning ved
  Grønland og i Weddellhavet), «Havtemperatur» (målt årsmiddel) og «Navne».
- «Normal · El Niño · La Niña»: passaten over Stillehavet (vindpilene) og
  Stillehavets ækvatorialstrømme, modstrøm og Humboldtstrøm svækkes eller
  styrkes; havtemperaturen får den målte afvigelse fra El Niño 1997/98 eller
  La Niña 2010/11 lagt til, og aflæsningen viser afvigelsen i parentes.
- «Slip en flaskepost»: driver med strømmen og strander på land.
- Seks trin; hvert trin drejer globussen, slår lag til, vælger fase og
  fremhæver strømme. Trin 6 er El Niño og La Niña.
- Aflæsning ved musen, ved klik og midt på globussen med piletaster: strøm,
  varm/kold, retning (strømme angives *mod*, vind *fra*) og havtemperatur.

## Filer

| Fil | Ansvar |
| --- | --- |
| `model.js` | Strømmene som linjer, hvirvler, transportbånd, El Niño/La Niña-faser og strømfeltet på 1°-gitter |
| `havtemperatur.js` | Afkodning og farver for havtemperaturen og El Niño/La Niña-afvigelsen |
| `globus.js` | Globus, spor, lag, etiketter og flaskepost |
| `tekst.js` | De fem trin |
| `app.js` | Landmaske, betjening, trin og animationsløkke |

## Modellen og data

Strømmene er generaliserede hovedlinjer fra lærebogskort (NOAA; Talley m.fl.
2011). Feltet regnes ved opstart: hver havcelle får strømmens retning med en
gaussisk vægt efter afstanden til linjen; land (fra `countries-110m.json`) er
nul. Farten er relativ, de vestlige randstrømme hurtigst. Udeladt: monsunens
skiftende strømme i det nordlige Indiske Ocean, Ishavet og mindre strømme.

Havtemperaturen er målt: NOAA OISST v2, årsmiddel af månedsnormalerne
1991–2020 på 1°-gitter, lavet med `../data/havtemperatur.py`
(kilde og format i `../data/havtemperatur.LICENSE`). Mangler filen, slås
kontakten fra, og resten virker.

El Niño og La Niña: strømmenes ændring er skematisk (faktorer i `FASER`,
`model.js`); feltet regnes én gang med bidragene delt op pr. gruppe, så et
faseskift blot vægter dem om. Temperaturafvigelsen er målt: NOAA ERSST v5,
november–januar under El Niño 1997/98 og La Niña 2010/11 minus samme måneder
1991–2020, lavet med `../data/enso.py` (kilde og format i
`../data/enso.LICENSE`). Termoklinen vises ikke her, men i
[ENSO-modellen](/geografi/enso.html). Mangler filen, vises normalen i alle faser.

## Afprøvning

```sh
node atlas/havstroemme/model.test.mjs
python3 -m http.server 8777
NODE_PATH=værktøj/node_modules ATLAS_URL=http://localhost:8777 node atlas/test/havstroemme.cjs
```
