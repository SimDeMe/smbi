import { blaa, groen, gul, lilla, roed, flade, felt, oval, pil, streg, tekst } from './tegning.js';

const enzym = (x, y) => flade(`M${x - 46} ${y - 25} h32 l14 15 14 -15 h32 v49 q0 14 -16 14 h-60 q-16 0 -16 -14Z`, blaa)
  + streg(`M${x - 36} ${y - 5} v27 q0 12 10 14`, '#d7edf9', 4);
const substrat = (x, y, farve) => flade(`M${x - 14} ${y - 17} h28 v17 l-14 15 -14 -15Z`, farve);

export default {
  id: 'enzym', navn: 'Enzymet',
  intro: 'Find stedet, hvor substratet binder, og sammenlign to måder, en hæmmer kan sænke reaktionshastigheden på.',
  baggrund: enzym(370, 151) + enzym(370, 316)
    + tekst(440, 45, 'Reaktion uden hæmmer') + pil(431, 149, 473, 149)
    + tekst(440, 244, 'To måder at hæmme på'),
  lag: [
    {
      navn: 'Fra substrat til produkt',
      dele: [
        ['substrat', 'Substratet er det stof, enzymet omdanner. Det bindes midlertidigt til enzymet.', [370, 87], [-1, 80],
          substrat(370, 87, gul) + pil(370, 105, 370, 124)],
        ['aktivt center', 'Det aktive center, også kaldet det aktive sted, er den del af enzymet, hvor substratet bindes og reaktionen katalyseres.', [370, 139], [-1, 143],
          flade('M356 126 L370 141 L384 126 L380 146 H360Z', '#ece7f6')],
        ['produkter', 'Produkter er de stoffer, der dannes ved reaktionen. Her er ét substrat skematisk spaltet i to.', [507, 152], [1, 144],
          oval(502, 139, 12, 13, gul) + felt(520, 151, 22, 20, groen)],
      ],
    },
    {
      navn: 'To typer hæmning',
      dele: [
        ['konkurrerende hæmmer', 'En kompetitiv hæmmer konkurrerer med substratet om det aktive center. Mere substrat kan mindske virkningen.', [370, 291], [-1, 289],
          substrat(370, 291, roed)],
        ['ikke-konkurrerende hæmmer', 'Hæmmeren binder et andet sted end det aktive center. I figuren sidder substratet stadig i det aktive center, men enzymets aktivitet falder.', [550, 338], [1, 338],
          enzym(508, 316) + substrat(508, 291, gul) + oval(550, 338, 14, 13, lilla)],
      ],
    },
  ],
};
