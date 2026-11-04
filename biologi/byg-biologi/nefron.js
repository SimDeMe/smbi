import { papir, felt, oval, pil, streg, tekst } from './tegning.js';

const proksimal = 'M378 142 Q396 111 408 133 T431 133 Q443 137 430 153 L411 172';
const slynge = 'M411 172 V302 Q411 340 435 340 Q459 340 459 302 V171';
const distal = 'M459 171 Q468 136 482 156 T509 157 Q519 143 539 158';
const samleroer = 'M539 124 V362';

export default {
  id: 'nefron', navn: 'Nefronet',
  intro: 'Følg filtratet fra nyrelegemet til samlerøret, og se, hvad der går mellem blodet og tubulus.',
  baggrund: felt(315, 180, 250, 194, '#f6f2f8')
    + tekst(446, 55, 'Bark') + tekst(345, 205, 'Marv')
    + streg('M316 94 H344 M360 94 H392 Q466 80 492 114 H512 Q524 114 524 129 V271 Q524 288 512 293 H496 V310 Q496 315 512 315 H565', '#a24457', 8)
    + streg(proksimal + ' ' + slynge + ' ' + distal + ' ' + samleroer, '#d3a55d', 11)
    + pil(539, 346, 539, 379) + tekst(520, 406, 'Mod nyrebækkenet'),
  lag: [
    {
      navn: 'Fra nyrelegeme til samlerør',
      dele: [
        ['Bowmans kapsel', 'Kapslen omslutter glomerulus og samler filtratet, der derefter løber ind i den proksimale tubulus.', [329, 126], [-1, 132],
          oval(355, 112, 30, 35, papir)],
        ['glomerulus', 'Glomerulus er det kapillærnøgle, hvor væske filtreres fra blodet.', [354, 99], [-1, 67],
          streg('M327 97 H345 Q342 83 355 86 Q370 87 362 101 Q352 116 348 104 Q346 94 358 95 H382', '#ba465d', 6)],
        ['proksimal tubulus', 'Den proksimale tubulus (første snoede del) modtager filtratet fra kapslen. Her sker størstedelen af reabsorptionen.', [415, 143], [1, 75],
          streg(proksimal, '#e6a236', 10)],
        ['Henles slynge', 'Slyngen medvirker til at opbygge en forskel i osmolaritet mellem nyrebark og nyremarv.', [433, 339], [-1, 341],
          streg(slynge, '#d09432', 12) + streg(slynge, '#ffe5ad', 4)],
        ['distal tubulus', 'Den distale tubulus (anden snoede del) finjusterer filtratets sammensætning og leder det videre mod samlerøret.', [497, 158], [1, 133],
          streg(distal, '#e6a236', 10)],
        ['samlerør', 'Samlerøret modtager væske fra flere nefroner. Vand kan optages her, før urinen føres mod nyrebækkenet.', [539, 352], [1, 384],
          streg(samleroer, '#bc8649', 15) + streg(samleroer, '#ffe2a7', 5)],
      ],
    },
    {
      navn: 'Stoffer bevæger sig mellem blod og filtrat',
      dele: [
        ['filtration', 'Blodtrykket presser vand og små opløste stoffer fra glomerulus ind i kapslen. Blodceller og de fleste plasmaproteiner bliver i blodet.', [355, 125], [-1, 194],
          pil(354, 107, 354, 136, '#3077aa')],
        ['reabsorption', 'Reabsorption fører stoffer fra filtratet tilbage til blodet. Det gælder fx glukose i den proksimale tubulus.', [451, 118], [1, 195],
          pil(434, 135, 468, 104, '#3b8658')],
        ['sekretion', 'Ved sekretion føres stoffer fra blodet til tubulusvæsken. Figuren viser et eksempel ved den distale tubulus.', [512, 123], [1, 251],
          pil(512, 109, 512, 147, '#ad4f66')],
        ['ADH', 'ADH gør samlerørets celler mere gennemtrængelige for vand, så mere vand kan optages, og urinen kan blive mere koncentreret.', [519, 295], [1, 321],
          pil(538, 293, 498, 293, '#3077aa') + tekst(521, 281, 'H₂O')],
      ],
    },
  ],
};
