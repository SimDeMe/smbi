// Dyrecellen: en eukaryot celle set i snit, som i lærebøgerne.
import { klat, bue, paaEllipse, mitokondrie, ribosomer, ribosomerPaaBue, boelge } from './tegn.js';

// Cellen og kernen
const C = { x: 500, y: 300, rx: 300, ry: 250 };
const K = { x: 440, y: 290, rx: 100, ry: 78 };
const cellen = klat(C.x, C.y, C.rx, C.ry);

// ru ER: tre buer om kernens højre side
const erBuer = [[128, 104], [150, 124], [172, 144]];
const ruER = erBuer.map(([rx, ry]) =>
  `<path d="${bue(K.x, K.y, rx, ry, -65, 65)}" stroke="#4FA6DC" stroke-width="11" stroke-linecap="round" fill="none"/>
   <path d="${bue(K.x, K.y, rx, ry, -65, 65)}" stroke="#BFE3F7" stroke-width="3" stroke-linecap="round" fill="none"/>
   ${ribosomerPaaBue(K.x, K.y, rx + 9, ry + 9, -62, 62, 9, 3.6)}`).join('');

// Golgi-apparatet: fire krumme sække, åbningen mod kernen
const G = { x: 655, y: 372 };
const golgi = [0, 1, 2, 3].map((i) => {
  const l = 46 - i * 4, dx = i * 15;
  return `<path d="M${G.x - 6 + dx} ${G.y - l} Q${G.x + 18 + dx} ${G.y} ${G.x - 6 + dx} ${G.y + l}"
     stroke="#F39A1E" stroke-width="10" stroke-linecap="round" fill="none"/>`;
}).join('');

// Vesikler: på vej fra Golgi ud til membranen, én smelter sammen med den
const vesikler = [[740, 300, 12], [722, 440, 13], [777, 372, 12]].map(([x, y, r]) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFD27A" stroke="#C97400" stroke-width="2.6"/>
   <circle cx="${x - 3}" cy="${y + 2}" r="2.4" fill="#C97400"/><circle cx="${x + 3}" cy="${y - 3}" r="2" fill="#C97400"/>`).join('');

// Glat ER: bølgede rør uden ribosomer
const glatER = [[226, 262, 300, 258], [222, 300, 304, 300], [226, 338, 300, 342]].map(([x1, y1, x2, y2]) =>
  `<path d="${boelge(x1, y1, x2, y2, 7, 2)}" stroke="#4FA6DC" stroke-width="10" stroke-linecap="round" fill="none"/>
   <path d="${boelge(x1, y1, x2, y2, 7, 2)}" stroke="#BFE3F7" stroke-width="3" stroke-linecap="round" fill="none"/>`).join('') +
  `<path d="M300 258 Q312 280 304 300 M304 300 Q314 322 300 342" stroke="#4FA6DC" stroke-width="10" stroke-linecap="round" fill="none"/>`;

// Lysosomer: lilla sække med prikker (enzymer)
const lysosomer = [[296, 408, 19], [332, 462, 15]].map(([x, y, r]) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#C39BE6" stroke="#6E3DAF" stroke-width="2.6"/>
   ${ribosomer([[x - r * 0.35, y - r * 0.2], [x + r * 0.3, y - r * 0.35], [x, y + r * 0.35], [x + r * 0.4, y + r * 0.25]], 2.3, '#6E3DAF')}`).join('');

// Frie ribosomer
const frie = ribosomer([[586, 98], [600, 110], [614, 96], [596, 126], [618, 120], [578, 116], [608, 138], [630, 106]]);

// Kernen og kernemembranen
const kerne = `<ellipse cx="${K.x}" cy="${K.y}" rx="${K.rx}" ry="${K.ry}" fill="#D4C2F5" stroke="#7A4FD6" stroke-width="3"/>
  <path d="${boelge(K.x - 60, K.y - 20, K.x + 50, K.y + 10, 9, 3)}" stroke="#A98BE3" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="${boelge(K.x - 45, K.y + 30, K.x + 40, K.y + 40, 7, 2.5)}" stroke="#A98BE3" stroke-width="3" fill="none" stroke-linecap="round"/>`;
const porer = [-150, -110, -40, 20, 100, 150, 200, 250].map((g) => {
  const [x, y] = paaEllipse(K.x, K.y, K.rx - 4, K.ry - 4, g);
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.6" fill="#D4C2F5"/>`;
}).join('');
const kernemembran = `<ellipse cx="${K.x}" cy="${K.y}" rx="${K.rx}" ry="${K.ry}" fill="none" stroke="#5B33B5" stroke-width="3.4"/>
  <ellipse cx="${K.x}" cy="${K.y}" rx="${K.rx - 8}" ry="${K.ry - 8}" fill="none" stroke="#5B33B5" stroke-width="3.4"/>${porer}`;

export default {
  id: 'dyr',
  navn: 'Dyrecellen',
  intro: 'En dyrecelle skåret igennem. Den er eukaryot: DNA’et ligger i en kerne, og cellen er fuld af organeller med membran om.',
  vb: [1000, 640],
  lag: [
    { navn: 'Grundplanen', ord: ['cellemembran', 'cytoplasma', 'cellekerne'], ekstra: ['cellevaeg'],
      ekstraFejl: { cellevaeg: 'Dyreceller har ingen cellevæg. Det har planter, svampe og bakterier. Cellevæggen kommer igen på plantecellen.' } },
    { navn: 'Fra gen til protein', ord: ['kernemembran', 'ribosom', 'ruER', 'golgi'] },
    { navn: 'Energi, lager og affald', ord: ['mitokondrie', 'glatER', 'lysosom', 'vesikel'] },
  ],
  dele: [
    { ord: 'cytoplasma', svg: `<path d="${cellen}" fill="#FFE6D2"/>` },
    { ord: 'glatER', svg: glatER },
    { ord: 'ruER', svg: ruER },
    { ord: 'golgi', svg: golgi },
    { ord: 'vesikel', svg: vesikler },
    { ord: 'lysosom', svg: lysosomer },
    { ord: 'ribosom', svg: frie },
    { ord: 'mitokondrie', svg: mitokondrie(300, 165, -35) + mitokondrie(722, 238, 50) + mitokondrie(585, 476, -15, 80, 38) },
    { ord: 'cellekerne', svg: kerne },
    { ord: 'kernemembran', svg: kernemembran },
    { ord: 'cellemembran', svg: `<path d="${cellen}" fill="none" stroke="#E8336D" stroke-width="10"/><path d="${cellen}" fill="none" stroke="#FFC3D6" stroke-width="3"/>` },
  ],
  // x, y: midten af ordets plads. maal: prikken ved det, ordet betegner.
  // omr: det gule felt om HELE det, pladsen handler om.
  pladser: [
    { ord: 'cellemembran', x: 100, y: 52, maal: [372, 72],
      omr: `<path d="${cellen}" fill="none" stroke-width="26"/>`,
      fejl: { cytoplasma: 'Cytoplasmaet er væsken inde i cellen. Pladsen peger på hinden, der går hele vejen rundt om cellen.',
              kernemembran: 'Kernemembranen sidder om kernen. Den her hinde går rundt om hele cellen.' } },
    { ord: 'mitokondrie', x: 100, y: 152, maal: [258, 188],
      omr: `<ellipse cx="300" cy="165" rx="56" ry="38" transform="rotate(-35 300 165)"/>`,
      fejl: { lysosom: 'Et lysosom er en lille, rund sæk. Se efter folderne indeni: dem har kun én organel.' } },
    { ord: 'cellekerne', x: 100, y: 236, maal: [352, 250],
      omr: `<ellipse cx="${K.x}" cy="${K.y}" rx="${K.rx + 8}" ry="${K.ry + 8}"/>`,
      fejl: { cytoplasma: 'Pladsen peger på den store, lilla organel midt i cellen, ikke på væsken omkring den.' } },
    { ord: 'glatER', x: 100, y: 330, maal: [222, 322],
      omr: `<rect x="208" y="240" width="112" height="120" rx="20"/>`,
      fejl: { ruER: 'Se efter de små prikker: ribosomerne sidder kun på den ene slags ER. Her er der ingen.',
              golgi: 'Golgi-apparatet er en stak krumme sække tæt ved ER. De her rør er et net.' } },
    { ord: 'lysosom', x: 100, y: 430, maal: [276, 420],
      omr: `<circle cx="296" cy="408" r="28"/><circle cx="332" cy="462" r="23"/>`,
      fejl: { vesikel: 'Vesikler fragter stoffer fra Golgi ud til membranen. De lilla sække ligger for sig selv og er fulde af enzymer.' } },
    { ord: 'kernemembran', x: 400, y: 612, maal: [420, 372],
      omr: `<ellipse cx="${K.x}" cy="${K.y}" rx="${K.rx + 6}" ry="${K.ry + 6}" fill="none" stroke-width="18"/>`,
      fejl: { cellemembran: 'Cellemembranen går rundt om hele cellen. Den her dobbelte hinde går kun rundt om kernen.',
              cellekerne: 'Cellekernen er hele organellen. Pladsen spørger om den dobbelte hinde med huller i, der omgiver den.' } },
    { ord: 'cytoplasma', x: 630, y: 612, maal: [500, 520],
      omr: `<path d="${cellen}"/>`,
      fejl: { cellemembran: 'Membranen er hinden yderst. Prikken sidder i væsken inde i cellen, hvor organellerne ligger.' } },
    { ord: 'ribosom', x: 900, y: 52, maal: [642, 100],
      omr: `<circle cx="604" cy="116" r="40"/>`,
      fejl: { ruER: 'Ru ER er de blå buer om kernen. Pladsen spørger om de små prikker, der ligger frit i cytoplasmaet.' } },
    { ord: 'ruER', x: 900, y: 152, maal: [588, 196],
      omr: `<path d="${bue(K.x, K.y, 150, 124, -68, 68)}" fill="none" stroke-width="72"/>`,
      fejl: { glatER: 'Se efter prikkerne: på de her buer sidder der ribosomer.',
              golgi: 'Golgi-apparatet er den orange stak længere ude. De blå buer ligger tæt om kernen.' } },
    { ord: 'vesikel', x: 900, y: 290, maal: [756, 296],
      omr: `<circle cx="740" cy="300" r="20"/><circle cx="722" cy="440" r="21"/><circle cx="777" cy="372" r="20"/>`,
      fejl: { lysosom: 'Lysosomerne er de lilla sække. De gule blærer er på vej fra Golgi-apparatet ud til membranen.' } },
    { ord: 'golgi', x: 900, y: 400, maal: [706, 398],
      omr: `<rect x="636" y="306" width="84" height="132" rx="22"/>`,
      fejl: { ruER: 'Ru ER er de blå buer med ribosomer tæt om kernen. Den her stak er orange og uden prikker.' } },
  ],
};
