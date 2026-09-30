# Stensamlingen — sådan tilføjes og rettes sten

Siden er `geografi/stensamling.html`. Alt indhold ligger i én datafil pr.
hovedgruppe:

| Fil | Gruppe | Kodebogstaver |
| --- | --- | --- |
| `mineraler.js` | Mineraler | `MI` |
| `magmatiske.js` | Magmatiske bjergarter | `MA` |
| `sedimentaere.js` | Sedimentære bjergarter | `SE` |
| `metamorfe.js` | Metamorfe bjergarter | `ME` |

`samling.js` samler grupperne, `noegle.js` er bestemmelsesnøglen,
`tegning.js` tegner en sten, der ikke er fotograferet endnu, og `side.js`
binder det hele sammen. En ny sten kræver kun en ny post i den rigtige datafil.

## Kode og nummer — to forskellige ting

* **`kode`** (fx `MA-09`) er samlingens referencekode. Alle poster har én.
  Den er gruppens to bogstaver plus næste ledige nummer i gruppen. Et nummer
  **genbruges aldrig**, heller ikke når en post slettes. Så holder gamle
  links og etiketter.
* **`nr`** er de numre, der står skrevet på de fysiske sten, fx
  `nr:['17']` eller `nr:['17','42']`, hvis der er flere eksemplarer.
  Står der intet nummer på stenen, er listen tom: `nr:[]`.

Man kan slå op på begge dele i søgefeltet (skriv og tryk Enter) og i
adressen:

```
stensamling.html#sten=MA-09     samlingens kode
stensamling.html?nr=17          nummeret på stenen — god til en QR-kode på etiketten
stensamling.html?gruppe=metamorf&noegle=1
```

Står det samme nummer på to poster, eller passer en kode ikke til sin
gruppe, skriver siden en advarsel i browserens konsol.

## En ny post

Kopiér en post fra samme gruppe, og ret felterne. Felter, der er tomme
eller mangler, bliver bare ikke vist.

```js
{
  id:'basalt',              // små bogstaver uden æøå — bruges i links mellem poster
  kode:'MA-09',             // se ovenfor
  nr:[],                    // numre skrevet på stenen
  navn:'Basalt',
  andreNavne:['diabas'],
  type:'Dagbjergart · basisk',
  kort:'Én sætning, der står under navnet.',
  kendetegn:'Sådan kendes den — det eleven kan se og mærke.',

  // Mineraler: formel, haardhed (Mohs), densitet, streg, glans, spaltning
  // Bjergarter: kornstoerrelse, densitet (g/cm³ — enheden sættes på af siden)
  kornstoerrelse:'< 1 mm', densitet:'2,9–3,0',

  // Bjergarter: mineralindhold. `id` giver et link til mineralet,
  // `navn` bruges til mineraler, der ikke er i samlingen.
  mineraler:[{id:'plagioklas', andel:'45–55 %'}, {navn:'lermineraler'}],

  dannelse:'…', findested:'…', anvendelse:'…', forveksles:'…',

  // Nøglen — se svarmulighederne i noegle.js
  kend:{korn:['fine'], syre:false, opbygning:['massiv','huller'],
        haard:['glas'], farve:['moerk']},

  // Tegning, indtil der er et foto: grundfarve først
  farver:['#2B2C2E','#3F4144','#1A1B1C'], tegning:'finkornet',

  se:[{tekst:'Simulering: vulkanudbrud', href:'/geografi/vulkanudbrud.html'}],
  placering:'Geo-lab, skab 2, skuffe 3',
  billeder:[{fil:'MA-09-basalt-1.jpg', tekst:'Basalt fra Island', foto:'SM'}]
}
```

**Nøglen (`kend`):** skriv alle svar, der kan passe, som en liste. En
bjergart, der både kan være lys og rød, får `farve:['lys','roed']`. Mangler et
spørgsmål helt, bliver posten ikke sorteret fra på det spørgsmål.

**Tegninger:** `grovkornet`, `kaempekorn`, `finkornet`, `sand`, `porfyr`, `glas`,
`blaerer`, `klaster`, `lag`, `baand`, `migmatit`, `aarer`, `fossiler`, `flint`,
`eklogit`, `korn`, `massiv`, `blade`, `staengler` og `krystal`.

## Billeder

Læg fotos i `billeder/`, og navngiv dem efter koden og navnet:
`MA-09-basalt-1.jpg`, `MA-09-basalt-2.jpg` osv. Skriv hvert nyt billede ind i
`billeder/indeks.md`. Det første billede i listen er hovedbilledet. Tegningen
forsvinder, når der er et foto, og kommer igen, hvis filen ikke kan hentes.

* Formatforhold 4:3, ca. 1200 × 900 px, JPEG under 300 kB.
* Neutral, lys baggrund og gerne en lineal eller mønt i billedet til at vise
  størrelsen.
* Fotografér en frisk brudflade, hvis stenen har en — forvitret overflade
  skjuler farve og korn.
