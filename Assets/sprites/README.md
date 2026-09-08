# Sprites

Tegnede figurer til 2D-animationer i simuleringerne: én mappe pr. figur,
et billede pr. trin i bevægelsen, og en fælles indlæser, der tegner dem på
et lærred. Samme formsprog som resten af sitet — blækstreg, hårde former,
papirfarver — så en figur kan lægges ind i en side uden at bryde designet.

Ingen build, ingen npm, ingen sprite-ark i PNG. Billederne er SVG, og
browseren rasteriserer dem selv, første gang en størrelse bruges.

```
Assets/sprites/
  sprite.js              indlæseren — fælles for alle figurer
  README.md              denne fil
  aborre/
    aborre.json          hvad figuren består af
    aborre-01.svg … -08.svg
    aborre.js            én linje: peger på aborre.json
    byg.py               generatoren, der har tegnet billederne
    forhaandsvisning.html  se figuren svømme
```

## Sådan bruges en sprite

```html
<script type="module">
import {indlaesAborre} from '/Assets/sprites/aborre/aborre.js';

const ctx = document.querySelector('#laerred').getContext('2d');
const aborre = await indlaesAborre();

function billede(nu){
  ctx.clearRect(0, 0, bredde, hoejde);
  aborre.tegn(ctx, {x:240, y:120, laengde:180, tid:nu/1000, retning:-1});
  requestAnimationFrame(billede);
}
requestAnimationFrame(billede);
</script>
```

`indlaesAborre()` henter billederne og giver et `Sprite`-objekt tilbage:

| Kald | Gør |
| --- | --- |
| `tegn(ctx, o)` | tegner ét billede med figurens midte i `(o.x, o.y)` |
| `punkt(navn, o)` | hvor `'mund'`, `'oeje'`, `'ryg'` eller `'halerod'` ligger på lærredet — til bobler, pile og mærkater |
| `billedeAf(tid, tempo)` | hvilket billede hører til tidspunktet |
| `hoejdeAf(laengde)` | figurens højde i px, når den er så lang |
| `billeder`, `data` | antal billeder og hele JSON-filen |

Felterne i `tegn`:

| Felt | Betydning |
| --- | --- |
| `x`, `y` | midten af figuren, i lærredets koordinater |
| `laengde` | figurens længde i px — for en fisk: snude til halespids |
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

## Aborre — *Perca fluviatilis*

Otte billeder i ét svømmetag, 1120 × 640 pr. billede, vender mod højre,
1,8 svømmetag i sekundet. Bølgen løber fra hoved mod hale, og udsvinget
vokser bagud, så hovedet står næsten stille, mens halen fejer;
brystfinnen vifter med. Kendetegnene er med med vilje: den høje ryg, de
to rygfinner med den sorte plet bagerst i den pigstrålede, de mørke
tværbånd og de orangerøde bug-, gat- og halefinner.

Billederne er regnet frem af `aborre/byg.py`:

```bash
python3 Assets/sprites/aborre/byg.py     # skriver aborre-01.svg … og aborre.json
python3 -m http.server 8777              # og åbn forhaandsvisning.html
```

Skal fisken se anderledes ud, er det tallene øverst i `byg.py`, der
ændres — `RYG` og `BUG` er kropsranden, `FINNER` er de fire finner med
rod, højde og form, `BAAND` er tværbåndene, og `AMP`, `BOELGE` og
`BILLEDER` styrer selve svømmetaget. Kør scriptet igen bagefter:
`aborre.json` regner selv figurens plads i rammen ud.

## En ny sprite

Én ny mappe med samme fire dele — billederne, `<navn>.json`, en
`<navn>.js` på tre linjer, og generatoren, hvis figuren er regnet frem.
`sprite.js` skal ikke røres.

```json
{
  "navn": "aborre",
  "art": "Perca fluviatilis",
  "vender": "hoejre",
  "billeder": 8,
  "tempo": 1.8,
  "celle":  {"bredde": 1120, "hoejde": 640},
  "filer":  ["aborre-01.svg", "…"],
  "kasse":  {"x": 0.0964, "y": 0.0764, "bredde": 0.8679, "hoejde": 0.7916},
  "punkter": {"mund": {"x": 0.9571, "y": 0.5312}}
}
```

* **`celle`** er billedets `viewBox`. Alle billeder har samme ramme —
  ellers hopper figuren.
* **`kasse`** er figurens yderpunkter *over hele bevægelsen*, som andele
  af rammen. Den er grunden til, at `laengde` betyder figurens længde og
  ikke rammens, og til at figuren ikke rykker sig, når billedet skifter.
* **`punkter`** er valgfrie kendemærker, også som andele af rammen. De er
  målt på den hvilende figur og følger ikke bevægelsen.
* Figuren tegnes **vendt mod højre**; `retning:-1` spejler den.

Billederne skal kunne tegnes på et lærred, og derfor må en SVG-fil ikke
hente noget udefra: ingen skrifter, ingen billeder, ingen `<use>` på tværs
af filer. Id'er inde i filerne får et nummer efter sig, så flere billeder
kan stå i samme dokument uden at kollidere.
