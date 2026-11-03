// Plantecellen: en eukaryot celle med cellevæg, stor vakuole og kloroplaster.
import { glat, mitokondrie, kloroplast } from './tegn.js';

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
const V = { x: 500, y: 310, rx: 170, ry: 155 };
const vakuole = glat(Array.from({ length: 36 }, (_, i) => {
  const v = (i / 36) * Math.PI * 2;
  const f = 1 + 0.035 * Math.sin(3 * v + 0.6) + 0.02 * Math.sin(5 * v);
  return [V.x + V.rx * f * Math.cos(v), V.y + V.ry * f * Math.sin(v)];
}));

const kloro = [[430, 130, 0], [580, 130, 0], [725, 260, 90], [725, 410, 90], [590, 490, 0], [440, 490, 0], [275, 380, 90]];
const K = { x: 330, y: 190, rx: 50, ry: 42 };

export default {
  id: 'plante',
  navn: 'Plantecellen',
  intro: 'En celle fra et blad. Den er også eukaryot, men har tre ting, som dyrecellen ikke har. De bygges først.',
  vb: [1000, 640],
  lag: [
    { navn: 'Det, dyrecellen ikke har', ord: ['cellevaeg', 'kloroplast', 'vakuole'] },
    { navn: 'Det, alle eukaryote celler har', ord: ['cellemembran', 'cellekerne', 'mitokondrie', 'cytoplasma'] },
  ],
  dele: [
    { ord: 'cytoplasma', svg: `<path d="${MEMBRAN}" fill="#F1F6D8"/>` },
    { ord: 'vakuole', svg: `<path d="${vakuole}" fill="#D3EBF8" stroke="#4E9CCB" stroke-width="3.4"/>
        <path d="M430 230 q20 -12 40 0" stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>` },
    { ord: 'kloroplast', svg: kloro.map(([x, y, g]) => kloroplast(x, y, g)).join('') },
    { ord: 'mitokondrie', svg: mitokondrie(680, 172, 35, 62, 30) + mitokondrie(322, 462, -20, 60, 30) },
    { ord: 'cellekerne', svg: `<ellipse cx="${K.x}" cy="${K.y}" rx="${K.rx}" ry="${K.ry}" fill="#D4C2F5" stroke="#5B33B5" stroke-width="3.4"/>
        <ellipse cx="${K.x}" cy="${K.y}" rx="${K.rx - 7}" ry="${K.ry - 7}" fill="none" stroke="#5B33B5" stroke-width="2"/>
        <circle cx="${K.x + 6}" cy="${K.y - 2}" r="12" fill="#A98BE3"/>` },
    { ord: 'cellemembran', svg: `<path d="${MEMBRAN}" fill="none" stroke="#E8336D" stroke-width="6"/>` },
    { ord: 'cellevaeg', svg: `<path d="${VAEG_UD} ${VAEG_IND}" fill="#A9C46A" fill-rule="evenodd" stroke="#5E7F22" stroke-width="3"/>
        <path d="${firkant(221, 71, 779, 549, 37)}" fill="none" stroke="#7E9F3A" stroke-width="1.6" stroke-dasharray="10 8"/>` },
  ],
  pladser: [
    { ord: 'cellevaeg', x: 100, y: 70, maal: [221, 120],
      omr: `<path d="${VAEG_UD} ${VAEG_IND}" fill-rule="evenodd"/>`,
      fejl: { cellemembran: 'Cellemembranen er den tynde, lyserøde hinde lige inden for. Pladsen peger på det tykke, grønne lag yderst.' } },
    { ord: 'cellekerne', x: 100, y: 190, maal: [281, 200],
      omr: `<ellipse cx="${K.x}" cy="${K.y}" rx="${K.rx + 8}" ry="${K.ry + 8}"/>`,
      fejl: { vakuole: 'Vakuolen er den store, blå sæk midt i cellen. Pladsen peger på den lille, lilla organel ude ved siden.',
              kloroplast: 'Kloroplasterne er grønne. Den her organel er lilla og indeholder cellens DNA.' } },
    { ord: 'cellemembran', x: 100, y: 300, maal: [251, 300],
      omr: `<path d="${MEMBRAN}" fill="none" stroke-width="16"/>`,
      fejl: { cellevaeg: 'Cellevæggen er det tykke, grønne lag yderst. Pladsen peger på den tynde hinde lige inden for den.' } },
    { ord: 'cytoplasma', x: 505, y: 26, maal: [505, 124],
      omr: `<path d="${MEMBRAN}"/>`,
      fejl: { vakuole: 'Vakuolen er den store sæk med sin egen membran. Prikken sidder i den tynde bræmme uden for vakuolen, hvor organellerne ligger.' } },
    { ord: 'kloroplast', x: 900, y: 70, maal: [622, 130],
      omr: `<ellipse cx="580" cy="130" rx="50" ry="27"/>`,
      fejl: { mitokondrie: 'Mitokondrier har folder indeni. Den her er grøn af klorofyl og har stakke af thylakoider.' } },
    { ord: 'mitokondrie', x: 900, y: 190, maal: [712, 190],
      omr: `<ellipse cx="680" cy="172" rx="42" ry="26" transform="rotate(35 680 172)"/>`,
      fejl: { kloroplast: 'Kloroplasterne er grønne. Den her er orange og har folder indeni. Planter har begge slags organeller.' } },
    { ord: 'vakuole', x: 900, y: 330, maal: [648, 330],
      omr: `<path d="${vakuole}"/>`,
      fejl: { cytoplasma: 'Cytoplasmaet er den tynde bræmme yderst. Den store, blå sæk har sin egen membran om sig.',
              cellekerne: 'Kernen er den lille, lilla organel. Den store, blå sæk er fuld af vand.' } },
  ],
};
