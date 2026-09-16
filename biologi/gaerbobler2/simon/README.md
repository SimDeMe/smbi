# SM-Simon

Læreren i gærbobleforsøget. Figuren er bygget efter samme mønster som Kemichael
i kemiformler.dk's superanimationer, men står her i mappen, så forsøget virker
for sig selv. Forsøgets egne scener står i `../js/laerer.js`.

## Personen

**Navn.** Simon. En elev har skrevet "SM-" foran navnet på hans navneskilt med
kuglepen. Han har ikke fået det vasket af.

**Udseende.** Lav og bred, kort mørkt hår og fuldskæg. Kittel over en grøn
t-shirt med "smbi". I brystlommen en blyant og en lup. Krusset siger "SMBI.dk".

**Tone.** Hjælpsom i det, han gør: han tørrer op, fejer glasskår op og stiller
en ny kolbe frem. Tør i det, han siger. Bemærkningen rammer handlingen, aldrig
eleven. Han forklarer ikke teori. Ros er kort, gerne et ordspil på forsøget:
"Det hæver."

**Vaner.**

* Han laver simuleringer, når han burde drikke sin kaffe.
* Han fører regnskab over uheld i et regneark.
* Han peger på plakaten med sikkerhedsreglerne.
* Han kigger op under brynene, når noget er tvivlsomt.

## Glimt af baggrunden

Hvert glimt vises én gang pr. browser og højst ét pr. sidevisning. Det huskes i
`localStorage` under `smbi-sm-simon`. `NK.Simon.glimtNulstil()` i konsollen
glemmer dem igen.

| Glimt | Hvornår | Replik |
|-------|---------|--------|
| `navn` | første klik på ham | Simon. SM-delen har en elev skrevet på skiltet. |
| `kaffeKold` | krusset på hylden | Kold. Jeg var ved at kode en simulering. |
| `boller` | nul bobler talt | Jeg bagte boller i går. De hævede heller ikke. |
| `flodboelge` | overløb i en kolbe | I geografi kalder vi det her en flodbølge. |
| `simulering` | kolben på gulvet | Jeg har lavet en simulering af det her. Den gik også galt. |
| `skaeg` | "Det hæver." | Skægget er til for at se klog ud. Det virker. |
| `regnskab3`, `6`, `10` | uheld i alt | Tredje uheld på den her computer. Det står i regnearket. |

## Bevægelser

Scenerne er lister af trin (formatet står øverst i `simon.js`): `gaa`, `sig`,
`arm`, `udtryk` (`vrede`, `humoer`, `roed`, `skeptisk`, `kig`, `laen`), `tid`
med `hver` og `kald`. `NK.Simon.suk()` lukker øjnene og lader hovedet synke.
Armen: 0 peger lige op, og `NK.Simon.HAENGER` (2,9) hænger ned.

## Sprites

| Fil | Indhold | Anker |
|-----|---------|-------|
| `simon_krop.svg` | krop i kittel med navneskilt, 240 x 250 | halsen (120, 18); skulderen (198, 62) |
| `simon_hoved.svg` | hoved med skæg, uden øjne, bryn og mund, 120 x 130 | halsen (60, 126); øjnene (42, 56) og (78, 56); munden (60, 95) |
| `simon_arm.svg` | arm med løftet pegefinger, 60 x 140 | skulderen (30, 132); hånden (30, 36) |
| `simon_kop.svg` | krusset | bunden (18, 40) |

Øjne, bryn, mund, rødme, damp af ørerne og taleboblen tegnes i koden.
