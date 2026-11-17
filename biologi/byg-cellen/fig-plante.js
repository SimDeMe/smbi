// Plantecellen: en eukaryot celle med cellevæg, stor vakuole og kloroplaster.
// Normalt tegnes den med 3D-modellen i ../celle-3d/ (plantecelle.glb); delene
// herunder er 2D-reserven, hvis WebGL eller modellen fejler. Lagene er de samme
// som på dyrecellen, med plantecellens egne dele først.
import { glat, mitokondrie, kloroplast, boelge, ellipseSti } from '../../byg-motor/tegn.js';

// En rundet firkant med lidt ujævne sider — plantecellernes typiske form
function firkant(x1, y1, x2, y2, r, uro = 4) {
  const p = [];
  const hj = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]];
  for (let i = 0; i < 4; i++) {
    const a = hj[i], b = hj[(i + 1) % 4];
    for (let t = 0; t < 4; t++) {
      const s = t / 4;
      const x = a[0] + (b[0] - a[0]) * s, y = a[1] + (b[1] - a[1]) * s;
      const u = t === 0 ? 0 : uro * Math.sin(i * 2.1 + t * 1.7);
      p.push([x + (a[1] === b[1] ? 0 : u), y + (a[0] === b[0] ? 0 : u)]);
    }
  }
  // rund hjørnerne ved at trække hjørnepunkterne ind
  return glat(p.map(([x, y], i) => {
    if (i % 4) return [x, y];
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
    return [x + Math.sign(cx - x) * r * 0.29, y + Math.sign(cy - y) * r * 0.29];
  }));
}

const VAEG_UD = firkant(210, 60, 790, 560, 40);
const VAEG_IND = firkant(232, 82, 768, 538, 34);
const MEMBRAN = firkant(250, 100, 750, 520, 30, 3);
const V = { x: 565, y: 310, rx: 138, ry: 148 };
const vakuole = glat(Array.from({ length: 36 }, (_, i) => {
  const v = (i / 36) * Math.PI * 2;
  const f = 1 + 0.035 * Math.sin(3 * v + 0.6) + 0.02 * Math.sin(5 * v);
  return [V.x + V.rx * f * Math.cos(v), V.y + V.ry * f * Math.sin(v)];
}));

const kloro = [[430, 130, 0], [580, 130, 0], [725, 260, 90], [725, 410, 90], [590, 490, 0], [440, 490, 0]];
const K = { x: 330, y: 190, rx: 50, ry: 42 };
const porer = [200, 235, 270, 305, 340, 20, 55].map((g) => {
  const v = (g * Math.PI) / 180;
  return [K.x + K.rx * Math.cos(v), K.y + K.ry * Math.sin(v)];
});
// ru ER: tre buede sække under kernen med ribosomer på; glat ER: rør uden ribosomer
const erSaek = (y) => `M282 ${y}C300 ${y - 12} 330 ${y + 10} 360 ${y - 2}S400 ${y - 8} 408 ${y}`;
const ruY = [252, 268, 284];
const ruPrikker = ruY.flatMap((y) => [290, 312, 336, 358, 382, 402].map((x, i) => [x, y + (i % 2 ? -7 : -8) + Math.sin(x / 15) * 3]));
const glatRoer = [boelge(280, 312, 410, 312, 5, 2.5), boelge(285, 330, 405, 330, 5, 2), boelge(295, 346, 395, 346, 4, 2)];
const golgiBuer = [0, 1, 2, 3].map((i) => `M${308 + i * 3} ${372 + i * 11}Q345 ${392 + i * 11} ${382 - i * 3} ${372 + i * 11}`);
const vesikler = [[396, 368, 6], [400, 392, 5.5], [392, 418, 6]];
const ribo = [[270, 128], [380, 112], [520, 118], [652, 116], [266, 362], [272, 488], [395, 510], [690, 505], [745, 335], [500, 510]];
const MITO = [[680, 172, 35], [322, 462, -20]];

export default {
  id: 'plante',
  navn: 'Plantecellen',
  intro: 'En celle fra et blad. Den er også eukaryot, men har tre ting, som dyrecellen ikke har. De bygges først.',
  vb: [1000, 640],
  lag: [
    { navn: 'Det, dyrecellen ikke har', ord: ['cellevaeg', 'kloroplast', 'vakuole'] },
    { navn: 'Det, alle eukaryote celler har', ord: ['cellemembran', 'cytoplasma', 'cellekerne'] },
    { navn: 'Fra gen til protein', ord: ['kernemembran', 'ribosom', 'ruER', 'golgi'] },
    { navn: 'Energi, lipider og transport', ord: ['mitokondrie', 'glatER', 'vesikel'] },
  ],
  dele: [
    { ord: 'cytoplasma', svg: `<path d="${MEMBRAN}" fill="#E4F2EE"/>` },
    { ord: 'vakuole', svg: `<path d="${vakuole}" fill="#C9DAF8" stroke="#6E7FD6" stroke-width="3.4"/>
        <path d="M500 225 q20 -12 40 0" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>` },
    { ord: 'kloroplast', svg: kloro.map(([x, y, g]) => kloroplast(x, y, g)).join('') },
    { ord: 'mitokondrie', svg: MITO.map(([x, y, g]) => mitokondrie(x, y, g, 62, 30)).join('') },
    { ord: 'ruER', svg: ruY.map((y) => `<path d="${erSaek(y)}" fill="none" stroke="#1E5BA8" stroke-width="7" stroke-linecap="round"/>`).join('')
        + ruPrikker.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#F4C21F" stroke="#9A7410" stroke-width="1"/>`).join('') },
    { ord: 'glatER', svg: glatRoer.map((d) => `<path d="${d}" fill="none" stroke="#38ADE0" stroke-width="6" stroke-linecap="round"/>`).join('') },
    { ord: 'golgi', svg: golgiBuer.map((d) => `<path d="${d}" fill="none" stroke="#C2185B" stroke-width="7" stroke-linecap="round"/>`).join('') },
    { ord: 'vesikel', svg: vesikler.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#EC6FA0" stroke="#A3214F" stroke-width="1.6"/>`).join('') },
    { ord: 'ribosom', svg: ribo.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#F4C21F" stroke="#9A7410" stroke-width="1"/>`).join('') },
    { ord: 'cellekerne', svg: `<ellipse cx="${K.x}" cy="${K.y}" rx="${K.rx}" ry="${K.ry}" fill="#D4C2F5"/>
        <circle cx="${K.x + 6}" cy="${K.y - 2}" r="12" fill="#8E5BA8"/>
        <path d="${boelge(K.x - 32, K.y + 14, K.x + 30, K.y + 18, 5, 3)}" fill="none" stroke="#D6455A" stroke-width="1.8"/>` },
    { ord: 'kernemembran', svg: `<ellipse cx="${K.x}" cy="${K.y}" rx="${K.rx}" ry="${K.ry}" fill="none" stroke="#7E72D6" stroke-width="3.4"/>
        <ellipse cx="${K.x}" cy="${K.y}" rx="${K.rx - 6}" ry="${K.ry - 6}" fill="none" stroke="#A89FE8" stroke-width="2"/>
        ${porer.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="#4A4299"/>`).join('')}` },
    { ord: 'cellemembran', svg: `<path d="${MEMBRAN}" fill="none" stroke="#4E8FE0" stroke-width="6"/>` },
    { ord: 'cellevaeg', svg: `<path d="${VAEG_UD} ${VAEG_IND}" fill="#CBE6BC" fill-rule="evenodd" stroke="#7FAF66" stroke-width="3"/>
        <path d="${firkant(221, 71, 779, 549, 37)}" fill="none" stroke="#9CC486" stroke-width="1.6" stroke-dasharray="10 8"/>` },
  ],
  // x, y: midten af ordets plads i 2D-reserven (3D-cellen har sine egne i ../celle-3d/model.js).
  // maal: prikken ved det, ordet betegner. omr: det gule felt om HELE det, pladsen handler om.
  // Fejlteksterne passer til 3D-modellens farver, som 2D-reserven efterligner.
  pladser: [
    { ord: 'cellevaeg', x: 100, y: 52, maal: [222, 110],
      omr: `<path d="${VAEG_UD} ${VAEG_IND}" fill-rule="evenodd"/>`,
      fejl: { cellemembran: 'Cellemembranen er den tynde, blå hinde lige inden for. Pladsen peger på det tykke, grønne lag yderst.' } },
    { ord: 'cellekerne', x: 100, y: 140, maal: [312, 176],
      omr: `<ellipse cx="${K.x}" cy="${K.y}" rx="${K.rx + 4}" ry="${K.ry + 4}"/>`,
      fejl: { vakuole: 'Vakuolen er den store, blå sæk i den ene halvdel af cellen. Pladsen peger på den runde, lilla organel med DNA indeni.',
              kernemembran: 'Kernemembranen er kun hinden yderst. Pladsen spørger om hele organellen med DNA’et indeni.' } },
    { ord: 'kernemembran', x: 100, y: 228, maal: [286, 211],
      omr: `<path d="${ellipseSti(K.x, K.y, K.rx + 5, K.ry + 5)} ${ellipseSti(K.x, K.y, K.rx - 9, K.ry - 9)}" fill-rule="evenodd"/>`,
      fejl: { cellemembran: 'Cellemembranen går rundt om hele cellen. Den her dobbelte hinde med porer går kun rundt om kernen.',
              cellekerne: 'Cellekernen er hele organellen. Pladsen spørger om den dobbelte hinde med huller i, der omgiver den.' } },
    { ord: 'ruER', x: 100, y: 316, maal: [284, 268],
      omr: `<rect x="276" y="236" width="140" height="58" rx="12"/>`,
      fejl: { glatER: 'Se efter de små gule prikker: ribosomerne sidder kun på den ene slags ER. Her er der mange.',
              golgi: 'Golgi-apparatet er den magenta stak af flade sække. Pladsen peger på de blå sække med prikker tæt ved kernen.' } },
    { ord: 'glatER', x: 100, y: 404, maal: [282, 330],
      omr: `<rect x="274" y="300" width="142" height="54" rx="12"/>`,
      fejl: { ruER: 'Se efter prikkerne: på de her rør sidder der ingen ribosomer.',
              golgi: 'Golgi-apparatet er den magenta stak af flade sække. Den her struktur er lyseblå rør uden prikker.' } },
    { ord: 'mitokondrie', x: 100, y: 492, maal: [296, 470],
      omr: MITO.map(([x, y, g]) => `<ellipse cx="${x}" cy="${y}" rx="36" ry="20" transform="rotate(${g} ${x} ${y})"/>`).join(''),
      fejl: { kloroplast: 'Kloroplasterne er grønne med stakke af membransække. Den her er aflang med folder indeni. Planter har begge slags organeller.',
              vesikel: 'Vesikler er små, runde blærer. Pladsen peger på en aflang organel med folder indeni.' } },
    { ord: 'golgi', x: 300, y: 612, maal: [345, 412],
      omr: `<rect x="300" y="362" width="88" height="56" rx="12"/>`,
      fejl: { ruER: 'Ru ER er de blå sække med ribosomer tæt ved kernen. Den her stak er magenta og uden prikker.',
              vesikel: 'Vesiklerne er de små blærer ved siden af. Pladsen peger på selve stakken af flade sække.' } },
    { ord: 'vesikel', x: 500, y: 612, maal: [392, 424],
      omr: vesikler.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 7}"/>`).join(''),
      fejl: { ribosom: 'Ribosomerne er de små gule prikker overalt i cytoplasmaet. Vesiklerne er de lidt større, lyserøde blærer ved Golgi-apparatet.',
              golgi: 'Golgi-apparatet er stakken af flade sække. Pladsen peger på de små runde blærer ved siden af.' } },
    { ord: 'ribosom', x: 700, y: 612, maal: [690, 509],
      omr: ribo.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10"/>`).join(''),
      fejl: { ruER: 'Ru ER er de blå sække med prikker på. Pladsen spørger om de små gule prikker, der ligger frit i cytoplasmaet.',
              vesikel: 'Vesiklerne er de lidt større, lyserøde blærer ved Golgi-apparatet. Pladsen peger på de bittesmå prikker overalt.' } },
    { ord: 'cytoplasma', x: 900, y: 52, maal: [716, 120],
      omr: `<path d="${MEMBRAN}"/>`,
      fejl: { vakuole: 'Vakuolen er den store sæk med sin egen membran. Prikken sidder i den tynde bræmme uden for vakuolen, hvor organellerne ligger.',
              cellemembran: 'Membranen er hinden yderst. Prikken sidder i væsken inde i cellen, hvor organellerne ligger.' } },
    { ord: 'cellemembran', x: 900, y: 140, maal: [749, 150],
      omr: `<path d="${MEMBRAN}" fill="none" stroke-width="16"/>`,
      fejl: { cellevaeg: 'Cellevæggen er det tykke, grønne lag yderst. Pladsen peger på den tynde hinde lige inden for den.' } },
    { ord: 'kloroplast', x: 900, y: 228, maal: [743, 250],
      omr: kloro.map(([x, y, g]) => `<ellipse cx="${x}" cy="${y}" rx="44" ry="23" transform="rotate(${g} ${x} ${y})"/>`).join(''),
      fejl: { mitokondrie: 'Mitokondrier har folder indeni. Den her er grøn af klorofyl og har stakke af thylakoider.' } },
    { ord: 'vakuole', x: 900, y: 316, maal: [698, 330],
      omr: `<path d="${vakuole}"/>`,
      fejl: { cytoplasma: 'Cytoplasmaet er den tynde bræmme yderst. Den store sæk har sin egen membran om sig.',
              cellekerne: 'Kernen er den runde, lilla organel. Den store sæk er fuld af vand.' } },
  ],
};
