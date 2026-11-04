import { blaa, roed, lilla, papir, roedBlodcelle, flade, pil, streg, tekst } from './tegning.js';

const alveole = 'M406 54 H471 V96 C537 110 562 177 528 224 C502 261 378 261 351 224 C314 172 349 112 406 96Z';

export default {
  id: 'alveole', navn: 'Alveolen og kapillæren',
  intro: 'Se, hvordan forskelle i partialtryk får ilt og kuldioxid til at bevæge sig hver sin vej.',
  baggrund: tekst(439, 34, 'Luftvej') + streg('M309 274 H568', '#ac8bbc', 43)
    + pil(320, 347, 560, 347) + tekst(440, 377, 'Blodets retning')
    + tekst(338, 326, 'Fra hjertet') + tekst(540, 326, 'Til hjertet'),
  lag: [
    {
      navn: 'Luft, blod og den tynde barriere',
      dele: [
        ['alveole', 'Alveolen er et lille luftfyldt rum i lungen, hvor gasser kan udveksles med blodet.', [396, 152], [-1, 139], flade(alveole, papir)
          + streg('M408 108 C366 128 351 165 358 193', '#fffdf4', 6)],
        ['lungekapillær', 'Lungekapillæren fører blodet tæt forbi alveolen. Det indstrømmende blod indeholder mindre ilt end det udstrømmende.', [538, 274], [1, 303],
          streg('M309 274 H412', blaa, 39) + streg('M414 274 H464', lilla, 39) + streg('M466 274 H568', roed, 39)
          + [335, 388, 492, 542].map(x => roedBlodcelle(x, 274)).join('')],
        ['diffusionsbarriere', 'Alveolens og kapillærens tynde vægge giver kort vej for diffusion mellem luft og blod.', [440, 250], [1, 231],
          streg('M382 243 Q440 259 498 243 M382 253 H498', '#9d76ad', 4)],
      ],
    },
    {
      navn: 'Hver gas følger sin egen trykforskel',
      dele: [
        ['ilt til blodet', 'Ilt diffunderer mod blodet, fordi iltens partialtryk er højere i alveoleluften end i blodet, der ankommer.', [397, 275], [-1, 279],
          pil(397, 203, 397, 281, '#38794c') + tekst(388, 191, 'O₂')],
        ['kuldioxid til luften', 'Kuldioxid diffunderer mod alveolen, fordi kuldioxidens partialtryk er højere i det indstrømmende blod end i alveoleluften.', [484, 216], [1, 167],
          pil(484, 278, 484, 191, '#86518e') + tekst(498, 181, 'CO₂')],
      ],
    },
  ],
};
