// Bakteriecellen: en prokaryot stavbakterie set i snit.
import { glat, boelge, ribosomer } from './tegn.js';

// Stav: rektangel med halvcirkler i enderne
function stav(x1, x2, cy, r) {
  return `M${x1 + r} ${cy - r} H${x2 - r} A${r} ${r} 0 0 1 ${x2 - r} ${cy + r} H${x1 + r} A${r} ${r} 0 0 1 ${x1 + r} ${cy - r}Z`;
}

const CY = 300;
const KAPSEL = stav(206, 784, CY, 144);
const VAEG = stav(230, 760, CY, 120);
const MEMBRAN = stav(252, 738, CY, 98);

// Kromosomet: én lang, sammenfiltret ring
const kromosom = glat(Array.from({ length: 30 }, (_, i) => {
  const v = (i / 30) * Math.PI * 2;
  const f = 1 + 0.22 * Math.sin(5 * v + 0.3) + 0.12 * Math.sin(9 * v + 1.1);
  return [450 + 100 * f * Math.cos(v), CY + 55 * f * Math.sin(v)];
}));
const kromosom2 = glat(Array.from({ length: 24 }, (_, i) => {
  const v = (i / 24) * Math.PI * 2;
  const f = 1 + 0.25 * Math.sin(4 * v + 2.2);
  return [455 + 62 * f * Math.cos(v), CY + 4 + 30 * f * Math.sin(v)];
}));

const piliOp = [330, 410, 480, 660, 710];
const piliNed = [340, 450, 520, 650, 700];
const pili = piliOp.map((x, i) => {
  const s = (i - 2) * 4;
  return `<path d="M${x} ${x < 350 || x > 640 ? 196 : 180} L${x + s} 128" />`;
}).join('') + piliNed.map((x, i) => {
  const s = (i - 2) * 4;
  return `<path d="M${x} ${x < 350 || x > 640 ? 404 : 420} L${x + s} 472" />`;
}).join('');

const klynge = [[560, 232], [578, 248], [596, 232], [566, 262], [588, 266]];
const spredte = [[380, 226], [330, 360], [690, 256], [520, 360], [560, 384], [690, 360], [400, 378], [620, 300]];

export default {
  id: 'bakterie',
  navn: 'Bakterien',
  intro: 'En stavbakterie skåret igennem. Den er prokaryot og meget mindre end en dyrecelle: typisk 1–5 µm lang.',
  vb: [1000, 640],
  lag: [
    { navn: 'Grundplanen', ord: ['cellevaeg', 'cellemembran', 'cytoplasma', 'kromosom'], ekstra: ['cellekerne'],
      ekstraFejl: { cellekerne: 'Bakterier har ingen cellekerne. DNA’et ligger frit i cytoplasmaet. Det er det, der gør dem prokaryote.' } },
    { navn: 'Ekstraudstyret', ord: ['plasmid', 'ribosom', 'flagel', 'pili', 'kapsel'] },
  ],
  dele: [
    { ord: 'kapsel', svg: `<path d="${KAPSEL}" fill="#FFF0C4" stroke="#D9A93A" stroke-width="2.6" stroke-dasharray="7 6"/>` },
    { ord: 'pili', svg: `<g stroke="#8A6A2A" stroke-width="4" stroke-linecap="round" fill="none">${pili}</g>` },
    { ord: 'flagel', svg: `<path d="${boelge(758, CY, 985, CY - 26, 18, 2.2, 60)}" stroke="#8A6A2A" stroke-width="5" fill="none" stroke-linecap="round"/>` },
    { ord: 'cellevaeg', svg: `<path d="${VAEG}" fill="#C79A5E" stroke="#7A5524" stroke-width="2.4"/>` },
    { ord: 'cytoplasma', svg: `<path d="${MEMBRAN}" fill="#EAF1FF"/>` },
    { ord: 'cellemembran', svg: `<path d="${stav(244, 746, CY, 106)}" fill="none" stroke="#E8336D" stroke-width="5"/>` },
    { ord: 'ribosom', svg: ribosomer(klynge.concat(spredte), 4.6) },
    { ord: 'kromosom', svg: `<path d="${kromosom}" fill="none" stroke="#7A4FD6" stroke-width="4"/>
        <path d="${kromosom2}" fill="none" stroke="#7A4FD6" stroke-width="4"/>` },
    { ord: 'plasmid', svg: `<circle cx="300" cy="290" r="15" fill="none" stroke="#0FA593" stroke-width="4.4"/>
        <circle cx="640" cy="335" r="13" fill="none" stroke="#0FA593" stroke-width="4.4"/>` },
  ],
  pladser: [
    { ord: 'kapsel', x: 100, y: 150, maal: [249, 215],
      omr: `<path d="${KAPSEL} ${VAEG}" fill-rule="evenodd"/>`,
      fejl: { cellevaeg: 'Cellevæggen er det faste, brune lag. Pladsen peger på det stiplede, slimede lag uden på den.' } },
    { ord: 'plasmid', x: 100, y: 300, maal: [283, 290],
      omr: `<circle cx="300" cy="290" r="24"/><circle cx="640" cy="335" r="22"/>`,
      fejl: { kromosom: 'Kromosomet er den lange, lilla ring midt i cellen. De små, grønne ringe er ekstra DNA.',
              ribosom: 'Ribosomerne er de mørke prikker. Pladsen peger på en lille ring.' } },
    { ord: 'cellevaeg', x: 100, y: 450, maal: [292, 404],
      omr: `<path d="${VAEG} ${MEMBRAN}" fill-rule="evenodd"/>`,
      fejl: { cellemembran: 'Membranen er den tynde, lyserøde hinde inderst. Pladsen peger på det tykke, brune lag.',
              kapsel: 'Kapslen er det stiplede lag yderst. Pladsen peger på det faste, brune lag.' } },
    { ord: 'pili', x: 380, y: 50, maal: [409, 128],
      omr: `<g fill="none" stroke-width="20" stroke-linecap="round">${pili}</g>`,
      fejl: { flagel: 'Flagellen er den lange tråd i enden, som bakterien svømmer med. Her er det de korte hår.' } },
    { ord: 'ribosom', x: 610, y: 50, maal: [598, 214],
      omr: `<circle cx="578" cy="248" r="34"/>`,
      fejl: { plasmid: 'Plasmiderne er små ringe. De mørke prikker er noget andet.' } },
    { ord: 'flagel', x: 870, y: 160, maal: [905, 268],
      omr: `<path d="${boelge(758, CY, 985, CY - 26, 18, 2.2, 60)}" fill="none" stroke-width="30" stroke-linecap="round"/>`,
      fejl: { pili: 'Pili er de korte hår hele vejen rundt. Pladsen peger på den lange tråd i enden.' } },
    { ord: 'kromosom', x: 380, y: 600, maal: [418, 356],
      omr: `<ellipse cx="450" cy="${CY}" rx="122" ry="70"/>`,
      fejl: { plasmid: 'Plasmider er små ringe. Pladsen peger på den store, lilla ring, som indeholder de fleste gener.' } },
    { ord: 'cellemembran', x: 610, y: 600, maal: [604, 406],
      omr: `<path d="${stav(244, 746, CY, 106)}" fill="none" stroke-width="14"/>`,
      fejl: { cellevaeg: 'Cellevæggen er det tykke, brune lag. Pladsen peger på den tynde, lyserøde hinde inden for den.' } },
    { ord: 'cytoplasma', x: 860, y: 600, maal: [688, 300],
      omr: `<path d="${MEMBRAN}"/>`,
      fejl: { cellemembran: 'Membranen er hinden. Prikken sidder i væsken inde i cellen.' } },
  ],
};
