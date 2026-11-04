import { blaa, groen, lilla, roed, felt, pil, streg, tekst } from './tegning.js';

export default {
  id: 'hormon', navn: 'Hormonaksen',
  intro: 'Følg signalerne fra hjernen til binyrebarken og videre til kroppen. Hvad sker der med stimuleringen, når kortisolniveauet stiger?',
  baggrund: felt(320, 44, 275, 349, '#f8f3f9', 24)
    + tekst(435, 32, 'Regulering af kortisol')
    + pil(435, 100, 435, 139) + pil(435, 190, 435, 229) + pil(435, 282, 435, 331),
  lag: [
    {
      navn: 'Fra hjerne til målorgan',
      dele: [
        ['hypothalamus', 'Hypothalamus frigiver CRH. CRH stimulerer hypofysens forlap til at frigive ACTH.', [435, 76], [-1, 78],
          felt(350, 55, 170, 45, lilla) + tekst(466, 127, 'CRH')],
        ['hypofysens forlap', 'Hypofysens forlap frigiver ACTH til blodet. ACTH stimulerer binyrebarken til at frigive kortisol.', [435, 166], [-1, 166],
          felt(350, 145, 170, 45, blaa) + tekst(466, 216, 'ACTH')],
        ['binyrebarken', 'Binyrebarken danner og frigiver kortisol som svar på ACTH.', [435, 254], [-1, 255],
          felt(350, 235, 170, 47, roed) + tekst(477, 314, 'Kortisol')],
        ['målvæv', 'Kortisol virker i mange væv. I leveren stimulerer det blandt andet dannelsen af glukose.', [435, 360], [-1, 360],
          felt(350, 337, 170, 48, groen) + tekst(435, 367, 'Fx leveren')],
      ],
    },
    {
      navn: 'Bremsen i systemet',
      dele: [
        ['negativ feedback', 'Kortisol dæmper frigivelsen af CRH og ACTH. Derved dæmpes den stimulering, som ellers får binyrebarken til at frigive mere kortisol.', [563, 211], [1, 211],
          streg('M511 308 H563 V78 H528 M563 164 H528 M528 68 V88 M528 154 V174', '#9b5ca4', 4)
          + tekst(577, 73, '−') + tekst(577, 158, '−')],
      ],
    },
  ],
};
