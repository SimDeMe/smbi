# Sprites

Tegnede figurer til 2D-animationer i simuleringerne: én mappe pr. figur,
et billede pr. trin i bevægelsen, og en fælles indlæser, der tegner dem på
et lærred. Samme formsprog som resten af sitet — blækstreg, hårde former,
papirfarver — så en figur kan lægges ind i en side uden at bryde designet.

Ingen build, ingen npm, ingen sprite-ark i PNG. Billederne er SVG, og
browseren rasteriserer dem selv, første gang en størrelse bruges.

Se dem alle sammen: **`Assets/sprites/forhaandsvisning.html`** — en sø i
tværsnit med alle ni figurer, og et galleri med hver figur for sig.

```
Assets/sprites/
  sprite.js        indlæseren — fælles for alle figurer
  tegn.py          kurver, SVG-rammen og skrivningen af filerne
  fisk.py          fiskeskabelonen: krop, finner, tegning på siden
  plante.py        planteskabelonen: stænglen, der svajer
  byg-alle.py      bygger alle figurer om
  aborre/          aborre.json · aborre-01.svg … -08.svg · aborre.js · byg.py
  …
```

## Figurerne

| Mappe | Figur | Art | Ramme | Måles på |
| --- | --- | --- | --- | --- |
| `planteplankton/` | Planteplankton | *Asterionella formosa* | 820 × 820 | længden |
| `dyreplankton/` | Dyreplankton (dafnie) | *Daphnia longispina* | 800 × 580 | længden |
| `skalle/` | Skalle | *Rutilus rutilus* | 1120 × 560 | længden |
| `aborre/` | Aborre | *Perca fluviatilis* | 1120 × 640 | længden |
| `gedde/` | Gedde | *Esox lucius* | 1120 × 440 | længden |
| `vandpest/` | Vandpest | *Elodea canadensis* | 460 × 1000 | højden |
| `hornblad/` | Hornblad | *Ceratophyllum demersum* | 560 × 1000 | højden |
| `aakande/` | Åkande | *Nymphaea alba* | 760 × 1000 | højden |
| `tagroer/` | Tagrør | *Phragmites australis* | 660 × 1120 | højden |

Otte billeder hver. Fiskene og dafnien vender **mod højre**; `retning:-1`
spejler dem. Planterne har deres anker ved **roden**, så de kan sættes ned
på søbunden; de andre har ankeret i midten af figuren.

## Sådan bruges en sprite

```html
<script type="module">
import {indlaesAborre} from '/Assets/sprites/aborre/aborre.js';
import {indlaesSprite} from '/Assets/sprites/sprite.js';

const ctx = document.querySelector('#laerred').getContext('2d');
const aborre   = await indlaesAborre();
const vandpest = await indlaesSprite('/Assets/sprites/vandpest/vandpest.json');

function billede(nu){
  const t = nu/1000;
  ctx.clearRect(0, 0, bredde, hoejde);
  vandpest.tegn(ctx, {x:140, y:bund, hoejde:220, tid:t});     // roden på bunden
  aborre.tegn(ctx,   {x:240, y:120, laengde:180, tid:t, retning:-1});
  requestAnimationFrame(billede);
}
requestAnimationFrame(billede);
</script>
```

`Sprite`-objektet kan:

| Kald | Gør |
| --- | --- |
| `tegn(ctx, o)` | tegner ét billede med figurens anker i `(o.x, o.y)` |
| `punkt(navn, o)` | hvor et navngivet sted på figuren ligger på lærredet — til bobler, pile og mærkater |
| `billedeAf(tid, tempo)` | hvilket billede hører til tidspunktet |
| `hoejdeAf(laengde)`, `laengdeAf(hoejde)` | figurens andet mål |
| `anker` | ankerets plads i cellen, som andele |
| `billeder`, `data` | antal billeder og hele JSON-filen |

Felterne i `tegn`:

| Felt | Betydning |
| --- | --- |
| `x`, `y` | figurens anker i lærredets koordinater |
| `laengde` | figurens længde i px — for en fisk snude til halespids |
| `hoejde` | figurens højde i px; brug den i stedet for `laengde` til planter |
| `tid` | sekunder; vælger billedet i bevægelsen |
| `tempo` | bevægelser pr. sekund (standard: figurens eget) |
| `billede` | vælg billedet selv i stedet for `tid` |
| `retning` | `1` mod højre, `-1` mod venstre |
| `haeld` | hældning i radianer; positiv drejer snuden nedad |
| `daekning` | 0–1, hvis figuren skal være halvgennemsigtig |

Størrelsen koster ikke noget at ændre løbende: indlæseren rasteriserer i
nærmeste toerpotens over den ønskede bredde og skalerer ned, så figuren
bliver skarp — også på en skærm med høj pixeltæthed, hvis lærredets
kontekst er skaleret med `devicePixelRatio`.

**Husk stadig `prefers-reduced-motion`.** Sprite'en animerer kun, fordi
siden tæller tiden op; står tiden stille, står figuren stille.

## Hvad der er tegnet ind i figurerne

Kendetegnene er ikke pynt — det er dem, eleverne skal kunne genkende:

* **Aborren** har den høje ryg, to rygfinner med den sorte plet bagerst i
  den pigstrålede, syv mørke tværbånd og orangerøde bug-, gat- og halefinner.
* **Skallen** er slank og sølvblank med tydelige skæl, ét lille hoved, én
  rygfinne over bugfinnerne — og det røde øje, som er dens sikreste kendetegn.
* **Gedden** har den lange flade snude med gabet helt tilbage under øjet, og
  ryg- og gatfinne skubbet helt om mod halen. Derfor kan den ligge stille i
  vandplanterne og skyde frem.
* **Dafnien** er gennemsigtig med ét stort facetøje, rugehule med æg, tarm
  tværs gennem kroppen og halepig. Bevægelsen er dens hop: følehornene slår
  hurtigt bagud (billede 1–3) og føres langsomt frem igen.
* **Planteplanktonet** er kiselalgen *Asterionella*, otte nåleceller i en
  stjerne. Den er gyldenbrun, ikke grøn — kiselalger har fucoxanthin.
* **Vandpest** har kranse af tre korte, butte blade; **hornblad** har kranse
  af stive, gaffeldelte blade og slet ingen rødder; **åkanden** har
  flydeblade med det dybe indskår og stilke helt ned til jordstænglen;
  **tagrør** har det stråfarvede rør, de lange smalle blade og den
  brunviolette dusk.

Planterne dækker tilmed søens tre zoner: tagrør står med fødderne i vandet
ved bredden, åkanden flyder på overfladen, og vandpest og hornblad står
neddykket på bunden.

## Sådan ændres en figur

Billederne er regnet frem af `byg.py` i hver mappe:

```bash
python3 Assets/sprites/aborre/byg.py     # én figur
python3 Assets/sprites/byg-alle.py       # alle ni
python3 -m http.server 8777              # og åbn forhaandsvisning.html
```

For en **fisk** er det tallene i `byg.py`: `ryg` og `bug` er kropsranden,
`finner` er finnerne med rod, højde og form, `baand`/`pletter` er tegningen
på siden, og `amp`, `boelge` og `tempo` styrer svømmetaget. For en **plante**
er det `linje` (stænglens midterlinje), knuderne og `amp`/`boelge` for
svajet. `aborre.json` og de andre JSON-filer regner selv figurens plads i
rammen ud, så de skal ikke rettes i hånden.

Ændrer du noget i `tegn.py`, `fisk.py` eller `plante.py`, så kør
`byg-alle.py` — ellers kommer figurerne ud af trit med hinanden.

## En ny sprite

Én ny mappe med `<navn>-01.svg …`, `<navn>.json`, `<navn>.js` og en
`byg.py`. `sprite.js` skal ikke røres. Er figuren en fisk eller en plante,
er `byg.py` bare et sæt tal og en linje, der kalder skabelonen.

```json
{
  "navn": "aborre",
  "dansk": "Aborre",
  "art": "Perca fluviatilis",
  "vender": "hoejre",
  "tempo": 1.8,
  "billeder": 8,
  "celle":  {"bredde": 1120, "hoejde": 640},
  "filer":  ["aborre-01.svg", "…"],
  "kasse":  {"x": 0.0964, "y": 0.0764, "bredde": 0.8679, "hoejde": 0.7916},
  "anker":  {"x": 0.5, "y": 0.96},
  "punkter": {"mund": {"x": 0.9571, "y": 0.5312}}
}
```

* **`celle`** er billedets `viewBox`. Alle billeder har samme ramme —
  ellers hopper figuren.
* **`kasse`** er figurens yderpunkter *over hele bevægelsen*, som andele
  af rammen. Den er grunden til, at `laengde` betyder figurens længde og
  ikke rammens, og til at figuren ikke rykker sig, når billedet skifter.
* **`anker`** er det sted, `tegn` sætter i `(x, y)`. Udelades det, bruges
  midten af kassen. Planter sætter det ved roden.
* **`punkter`** er valgfrie kendemærker, også som andele af rammen. De er
  målt på den hvilende figur og følger ikke bevægelsen.
* Figuren tegnes **vendt mod højre**; `retning:-1` spejler den.

Billederne skal kunne tegnes på et lærred, og derfor må en SVG-fil ikke
hente noget udefra: ingen skrifter, ingen billeder, ingen `<use>` på tværs
af filer. Id'er inde i filerne får et nummer efter sig, så flere billeder
kan stå i samme dokument uden at kollidere.
