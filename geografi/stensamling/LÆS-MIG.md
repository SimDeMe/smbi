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
* **`nr`** er de gamle numre, der står på stenene, på de orange prikker
  eller på sedlerne i kasserne. De kommer fra to nummereringer, der ikke
  har noget med hinanden at gøre, og som kun dækker en del af samlingen:

  | System | Skrives | Stammer fra |
  | --- | --- | --- |
  | Gymnasiesamling | `'gymnasiesamling-2'` | gamle dokumenter om en «standard gymnasiesamling» («Samling nr. …» på sedlerne) |
  | Klassesæt | `'klassesæt-13'` | ukendt baggrund («Klassesæt nr. …»; de orange prikker bruger samme numre) |

  Skriv altid systemet med, for det samme tal kan stå på to forskellige
  sten: 9 er stensalt i klassesættet, men kalifeldspat i
  gymnasiesamlingen. Flere numre på samme post: `nr:['klassesæt-12','klassesæt-43']`.
  Intet nummer: `nr:[]`. Numrene er kun en ekstra reference; det er
  `kode`, der er samlingens egen.

Man kan slå op på begge dele i søgefeltet (skriv og tryk Enter) og i
adressen. Et bart tal finder stenen i alle systemer; peger det på flere,
vises de i listen. Med systemet foran («klassesæt 13», «samling 2», «ks13»)
er svaret entydigt.

```
stensamling.html#sten=MA-09             samlingens kode
stensamling.html?nr=13                  alle sten med 13 på — god til en QR-kode
stensamling.html?nr=klassesæt-13        kun klassesættets nr. 13
stensamling.html?gruppe=metamorf&noegle=1
```

Står det samme nummer i samme system på to poster, kan et nummer ikke
læses, eller passer en kode ikke til sin gruppe, skriver siden en advarsel
i browserens konsol.

## En ny post

Kopiér en post fra samme gruppe, og ret felterne. Felter, der er tomme
eller mangler, bliver bare ikke vist.

```js
{
  id:'basalt',              // små bogstaver uden æøå — bruges i links mellem poster
  kode:'MA-09',             // se ovenfor
  nr:[],                    // gamle numre, fx ['klassesæt-13'] — se ovenfor
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

### Beskæring

Webfilerne skæres til med værktøjet `beskaer.py`. Kør det fra repoets rod:

```bash
python3 geografi/stensamling/beskaer.py
```

Det åbner i browseren. Træk 4:3-rammen hen over det, der skal vises, drej
evt. fotoet med ↺/↻, og tryk «Gem udsnit». Værktøjet skærer fra originalen i
`billeder/originaler/` og skriver webfilen i `billeder/` (højst 1200 × 900 px,
under 300 kB, uden EXIF). Udsnit og drejning gemmes i `billeder/udsnit.json`,
så man kan åbne billedet og flytte rammen igen senere.

`billeder/originaler/` er ikke i git (se `.gitignore`) — originalerne fylder
for meget til at blive udgivet. De første 19 kan hentes fra commit `5233f0a`.
Et nyt foto: læg originalen i `originaler/` med webfilens navn
(`MA-04-gabbro-1.jpeg`), beskær den, og commit webfilen og `udsnit.json`.
Kræver Pillow (`pip install pillow`).
