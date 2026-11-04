import { blaa, roed, papir, flade, felt, pil, streg, tekst } from './tegning.js';

const hoejreForkammer = 'M368 149 Q340 138 339 182 L348 211 H422 V157Z';
const hoejreKammer = 'M348 213 Q346 279 420 308 L422 213Z';
const venstreForkammer = 'M439 157 V211 H511 Q532 166 503 149Z';
const venstreKammer = 'M439 213 L440 310 Q509 288 511 213Z';

export default {
  id: 'hjerte', navn: 'Hjertet og kredsløbet',
  intro: 'Følg blodet gennem lungerne og kroppen. Tegningen ses forfra, så hjertets højre side ligger til venstre.',
  baggrund: felt(383, 20, 94, 38, papir) + tekst(430, 46, 'Lunger')
    + felt(383, 363, 94, 38, papir) + tekst(430, 388, 'Kroppen')
    + streg('M383 382 H313 V173 H340', '#608cb5', 8) + pil(313, 210, 313, 176)
    + streg('M394 249 Q399 225 399 215 V58', '#608cb5', 8)
    + streg('M465 58 V173 H487', '#bd6474', 8)
    + streg('M480 248 Q480 223 487 212 H550 V382 H477', '#bd6474', 8) + pil(550, 331, 550, 367),
  lag: [
    {
      navn: 'Kamre og blodets vej',
      dele: [
        ['højre forkammer', 'Højre forkammer modtager iltfattigt blod fra kroppen gennem hulvenerne.', [361, 179], [-1, 156],
          flade(hoejreForkammer, blaa) + pil(370, 171, 374, 206)],
        ['højre hjertekammer', 'Højre hjertekammer pumper blod gennem lungearterien til lungerne.', [382, 264], [-1, 269],
          flade(hoejreKammer, blaa) + streg('M355 235 Q363 272 403 293', '#b8d9eb', 4) + pil(374, 220, 382, 247) + streg('M394 249 Q399 225 399 215 V149', '#527ea5', 6)],
        ['venstre forkammer', 'Venstre forkammer modtager iltrigt blod fra lungerne gennem lungevenerne.', [489, 174], [1, 153],
          flade(venstreForkammer, roed) + streg('M465 149 V173 H487', '#bd6474', 6) + pil(492, 179, 492, 205)],
        ['venstre hjertekammer', 'Venstre hjertekammer pumper blod gennem aorta til kroppen. Det har den tykkeste muskelvæg.', [474, 268], [1, 276],
          flade(venstreKammer, '#b96478') + flade('M448 220 H499 Q495 274 449 293Z', roed)
          + streg('M501 238 Q497 272 467 291', '#e9a2ae', 4)
          + pil(492, 218, 482, 242) + streg('M480 248 Q480 223 487 212 H512', '#a54b5e', 6)],
      ],
    },
    {
      navn: 'Kar og ensrettet strøm',
      dele: [
        ['lungearterie', 'Lungearterien fører blod væk fra hjertet og til lungerne. Blodet i den er relativt iltfattigt.', [399, 103], [-1, 90],
          streg('M399 144 V58', '#416d9c', 8) + pil(399, 108, 399, 64)],
        ['lungevener', 'Lungevenerne fører iltrigt blod fra lungerne tilbage til hjertet. De er tegnet som ét samlet kar.', [465, 103], [1, 92],
          streg('M465 58 V145', '#b1495a', 8) + pil(465, 100, 465, 145)],
        ['sejlklapper', 'Sejlklapperne mellem forkamre og hjertekamre hindrer blodet i at løbe tilbage, når hjertekamrene trækker sig sammen.', [369, 212], [-1, 214],
          streg('M348 210 L367 218 L384 210 M476 210 L492 218 L509 210', '#765b9d', 5)],
        ['aorta', 'Aorta er kroppens hovedpulsåre. Den fører iltrigt blod fra venstre hjertekammer til kroppens arterier.', [550, 316], [1, 344],
          streg('M512 212 H550 V382 H477', '#b1495a', 8) + pil(550, 313, 550, 373)],
        ['hulvener', 'Hulvenerne fører iltfattigt blod fra kroppen til højre forkammer. De er tegnet som ét samlet kar.', [313, 319], [-1, 341],
          streg('M383 382 H313 V173 H340', '#416d9c', 8) + pil(313, 331, 313, 181)],
      ],
    },
  ],
};
