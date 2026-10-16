# Bjergarternes kredsløb

Selvstændig side på `/atlas/bjergarternes-kredsloeb/` med modelkort i atlasset
(emne «Bjergarter», også under «Undersøg havbundens alder») og link fra
øvelseskortet på `geografi.html`. Ingen build og ingen eksterne biblioteker;
kun atlassets skrifter og skolens stensamling (`/geografi/stensamling/`), hvis
data, fotos og tegninger genbruges direkte (A7 i `atlas/INDHOLD.md`).

## De tre dele – og hvorfor de hænger sammen

1. **Stenens rejse** – eleven følger én sten gennem kredsløbet og vælger hvert
   trin: 26 bjergarter og sedimenter i seks grupper (kappe, magma, magmatiske,
   løst sediment, sedimentære, metamorfe) og 48 overgange med proces, typisk
   tid og sted ved pladegrænserne. Diagrammet viser grupperne, de mulige veje
   (fede pile) og den vej, stenen har taget (nummererede trin). Fem
   udfordringer: granit → kvartsit, kridt → marmor, kappen → eklogit,
   ler → migmatit og hele vejen rundt. Fortryd, start forfra, klarede
   udfordringer huskes i browseren.
2. **Hvor dannes stenene?** – et skematisk snit fra en hotspot over en
   spredningsryg, dybhavet og en subduktionszone med vulkanbue og pluton til
   et sokkelhav og en bjergkæde. Otte steder med forklaring, eksempler og de
   sten fra samlingen, der dannes der. Temperatur (skematiske isotermer
   200/600/1000 °C) og pladernes bevægelse kan slås til og fra. Quizzen
   «Hvor er stenen dannet?» viser 8 tilfældige af 29 sten fra samlingen;
   alle steder, hvor stenen typisk dannes, tæller som rigtigt svar, og
   feedbacken er stenens egen dannelsestekst fra samlingen.
3. **Afkøling og korn** – basaltisk eller granitisk magma i en lavastrøm, en
   gang eller en pluton med valgfri tykkelse. Afkølingstid, kornstørrelse og
   bjergart (basalt/diabas/gabbro, rhyolit/granit, basaltglas/obsidian), og
   en lup på 10 × 10 mm med målestok, hvor krystallerne vokser fra kim, til
   de støder sammen (Johnson–Mehl).

Del 1 viser, at kredsløbet ikke har en fast rækkefølge og tager titals
millioner af år; del 2 viser, at pladetektonikken driver det; del 3 viser,
hvordan man kan aflæse en magmatisk bjergarts historie i dens korn – den
kobling, øvelsen beder om (journalspørgsmål 4).

## Model og tal

| Del | Hvad | Kilde/kontrol |
| --- | --- | --- |
| 1 | Tider: lava timer–år; pluton 0,01–1 mio. år; forvitring af overfladesten 0,01–10; hævning og erosion af dybe sten 5–50; sammenkitning 1–50; omdannelse 1–30; opsmeltning 0,1–10 mio. år | Typiske størrelsesordener, ikke målinger fra et sted |
| 1 | Metamorfosegrad: tagskifer ca. 200–400 °C, glimmerskifer 400–600, gnejs > 600, migmatit 650–750 °C; eklogit fra basalt ved over ca. 50 km | Winter (2014) |
| 1 | Kvartsit og marmor (og deres sediment) kan ikke blive til magma: ren kvarts smelter først ved ca. 1700 °C, kalk afgiver CO₂ | Står i modellens forklaring; testen kræver det |
| 2 | Steder og sten; isotermer er skematiske (sat sammen af kendte forløb, ikke beregnet) | Winter (2014); stensamlingens dannelsestekster |
| 3 | Afkølingstid t ≈ (h/2)²/κ, κ = 1·10⁻⁶ m²/s: 1 m → 3 døgn, 20 m → 3 år, 3 km → ca. 70 000 år | Turcotte & Schubert (2014), kap. 4 |
| 3 | Kornstørrelse d = 0,3 mm · (t / 72 døgn)^0,21: 5 m lava 0,3 mm, 20 m gang 0,5 mm, 1 km pluton 2,8 mm, 10 km 7 mm; under 0,05 mm = glas | Tommelfingerregel tilpasset kendte bjergarter (Cashman 1990 om krystalstørrelse og afkøling) |

**Forenklinger, der står på siden:** kredsløbets tider er typiske værdier;
snittet er skematisk, ikke målfast, og samler steder, der ligger langt fra
hinanden; afkølingen ignorerer krystallisationsvarme, form og cirkulerende
vand (størrelsesordenen holder); porfyr, pegmatit og obsidian i tykke strømme
nævnes, men beregnes ikke.

## Filer

- `model.js` – bjergarter, processer, overgange, steder, quizsten,
  udfordringer, afkøling og kornstørrelse (ingen DOM).
- `rejse.js`, `snit.js`, `afkoeling.js` – de tre dele.
- `sten.js` – foto/tegning fra stensamlingen, gruppemærker og stenkort.
- `app.js` – faner (piletaster, `#del-2` i adressen), fokus, dialog, højde og
  skift mellem delene (`vis-del`).
- `tilfaeldig.js` – gentagelig tilfældighed til krystallerne.

Tilgængelighed: faner og radiogrupper med piletaster; alle handlinger i del 1
er knapper i panelet (diagrammet har en opdateret tekstbeskrivelse); stederne
i snittet er knapper med navn; tykkelsen er en skyder med `aria-valuetext`.
Reduceret bevægelse springer krystalanimationen over. Farve er aldrig eneste
signal: grupper, steder og svar har altid navn eller tal ved siden af.

## Test

```bash
node atlas/bjergarternes-kredsloeb/model.test.mjs
NODE_PATH=værktøj/node_modules node atlas/test/bjergarternes-kredsloeb.cjs
```

Modeltesten kontrollerer, at alle sten findes i stensamlingen, at
overgangene passer med processerne, at kredsløbet er lukket (og at kun
kvarts- og kalksporet ikke når magma), udfordringerne, tiderne,
afkølingstiderne og kornstørrelserne mod kendte bjergarter. Browsertesten
spiller alle tre dele igennem ved 1280×577, 1366×625, 1536×730, 390×750 og
640×625 med mus, touch og tastatur: rejsen fra granit til kvartsit med
udfordring og fortryd, skiftet fra et trin til stedet i snittet, alle
steder, temperatur, quiz med rigtigt og forkert svar, afkøling til glas og
granit, at luppen ender uden smelte, dialog, fokus og faner.
