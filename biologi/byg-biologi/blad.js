import { blaa, groen, papir, roed, felt, oval, flade, pil, streg, tekst } from './tegning.js';

const overhud = felt(318, 88, 244, 27, '#d6e8ac', 4)
  + felt(318, 258, 150, 28, '#d6e8ac', 4) + felt(502, 258, 60, 28, '#d6e8ac', 4);
const palisade = [330, 363, 396, 429, 462, 495, 528]
  .map(x => felt(x, 118, 23, 58, groen, 10)
    + [[7, 13], [16, 23], [8, 37], [15, 47]].map(([dx, dy]) =>
      oval(x + dx, 118 + dy, 2.7, 4.2, '#62a754')).join('')).join('');
const svamp = [[337, 200], [374, 221], [414, 195], [446, 222], [530, 196], [535, 234], [344, 246], [408, 248]]
  .map(([x, y]) => oval(x, y, 17, 8, '#b8d8a7') + oval(x + 7, y - 1, 3, 2, '#77a86c')).join('');

export default {
  id: 'blad', navn: 'Bladets tværsnit',
  intro: 'Find bladets væv, og følg kuldioxid ind og vanddamp ud gennem spalteåbningen.',
  baggrund: felt(318, 88, 244, 198, papir, 4) + flade('M468 257 H502 V289 H468Z', papir)
    + streg('M322 85 Q440 80 558 85', '#92a367', 3)
    + tekst(440, 64, 'Overside') + tekst(440, 392, 'Underside'),
  lag: [
    {
      navn: 'Væv og transport',
      dele: [
        ['overhud', 'Overhuden (epidermis) dækker bladet. På oversiden ligger der typisk også et vandafvisende vokslag.', [343, 99], [-1, 94], overhud],
        ['palisadevæv', 'Palisadevævet består af tætstillede celler med mange kloroplaster. Her foregår en stor del af fotosyntesen.', [372, 145], [-1, 151], palisade],
        ['svampvæv', 'Mellem svampvævets celler er der luftfyldte rum, som letter udvekslingen af gasser inde i bladet.', [374, 221], [-1, 221], svamp],
        ['ledningsstreng', 'Ledningsstrengen fører vand og mineraler til bladet i vedkar og transporterer sukker fra bladet i sikar.', [488, 215], [1, 212],
          oval(488, 215, 26, 25, '#efe0c4') + oval(488, 204, 16, 7, blaa) + oval(488, 224, 16, 7, roed)],
      ],
    },
    {
      navn: 'Gasudveksling gennem bladet',
      dele: [
        ['læbeceller', 'To læbeceller regulerer åbningens størrelse ved at ændre deres saftspænding.', [457, 273], [-1, 284],
          oval(463, 273, 14, 13, groen) + oval(507, 273, 14, 13, groen)],
        ['spalteåbning', 'Spalteåbningen er poren mellem læbecellerne. Den forbinder bladets luftrum med omgivelserne.', [486, 272], [1, 271],
          felt(478, 261, 14, 24, '#fffdf7', 6)],
        ['CO₂ ind', 'Når bladet optager kuldioxid til fotosyntesen, diffunderer CO₂ ind gennem spalteåbningen.', [469, 329], [-1, 349],
          pil(455, 352, 481, 284, '#40804d') + tekst(446, 354, 'CO₂')],
        ['vanddamp ud', 'Vand fordamper fra fugtige overflader inde i bladet og diffunderer ud som vanddamp. Det kaldes transpiration.', [516, 333], [1, 340],
          pil(493, 286, 530, 351, '#3077aa') + tekst(553, 352, 'H₂O')],
      ],
    },
  ],
};
