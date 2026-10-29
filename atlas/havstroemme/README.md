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
- «Slip en flaskepost»: driver med strømmen og strander på land.
- Fem trin; hvert trin drejer globussen, slår lag til og fremhæver strømme.
- Aflæsning ved musen, ved klik og midt på globussen med piletaster: strøm,
  varm/kold, retning (strømme angives *mod*, vind *fra*) og havtemperatur.

## Filer

| Fil | Ansvar |
| --- | --- |
| `model.js` | Strømmene som linjer, hvirvler, transportbånd og strømfeltet på 1°-gitter |
| `havtemperatur.js` | Afkodning og farver for havtemperaturen |
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

## Afprøvning

```sh
node atlas/havstroemme/model.test.mjs
python3 -m http.server 8777
NODE_PATH=værktøj/node_modules ATLAS_URL=http://localhost:8777 node atlas/test/havstroemme.cjs
```
