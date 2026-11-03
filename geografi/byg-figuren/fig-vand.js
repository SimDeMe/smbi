// Vandets kredsløb: et snit fra havet over kysten og en sø op til en bjergtop med is.
//
// Lag 1 er magasinerne, lag 2 og 3 er transportmekanismerne (pilene).
// Stiplede pile er vanddamp, fuldt optrukne pile er flydende vand.
// Snittet er ikke i målestok: højderne er stærkt overdrevne.
import { glat } from '../../byg-motor/tegn.js';

const r1 = (v) => Math.round(v * 10) / 10;
const sti = (pkt) => pkt.map(([x, y], i) => (i ? 'L' : 'M') + r1(x) + ' ' + r1(y)).join(' ');

const W = 1400, H = 800;
const HAVNIVEAU = 480;

// Overfladen fra kysten mod bjerget; søens bund er med, søens flade er HAVNIVEAU - 18.
const SOE_Y = 462;
const kyst = [[380, 480], [440, 476], [520, 471], [600, 466], [640, SOE_Y]];
const soebund = [[662, 480], [700, 497], [780, 501], [836, 482], [860, SOE_Y]];
const bjerg = [[900, 452], [960, 437], [1040, 418], [1120, 392], [1200, 352], [1260, 310], [1310, 268], [1350, 242], [1400, 236]];
const land = [...kyst, ...soebund, ...bjerg];
const havbund = [[0, 640], [200, 612], [330, 524], [380, 480]];

// Grundvandsspejlet: højest under bjerget, i niveau med søen, lavest ved kysten
const spejl = [[1400, 470], [1300, 478], [1200, 482], [1100, 478], [1000, 470], [900, SOE_Y], [640, SOE_Y], [560, 473], [450, 481], [380, 486]];
// grundvandet fylder også sedimentet under havbunden
const GRUNDVAND = sti([...spejl, ...havbund.slice().reverse().slice(1), [0, H], [W, H]]) + 'Z';

// ── Tegnehjælp ───────────────────────────────────────────
/** Pil som kvadratisk kurve fra a over c til b, med spids i b. */
function pil(a, c, b, farve, { b: bredde = 7, stiplet = false } = {}) {
  const [bx, by] = b;
  const dx = bx - c[0], dy = by - c[1], L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L, s = bredde * 2.6;
  const spids = [[bx + ux * s * 0.35, by + uy * s * 0.35], [bx - ux * s + uy * s * 0.7, by - uy * s - ux * s * 0.7], [bx - ux * s - uy * s * 0.7, by - uy * s + ux * s * 0.7]];
  return `<path d="M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${bx} ${by}" fill="none" stroke="${farve}" stroke-width="${bredde}" stroke-linecap="round"${stiplet ? ` stroke-dasharray="${bredde * 1.6} ${bredde * 1.5}"` : ''}/>
    <polygon points="${spids.map((p) => p.map(r1).join(',')).join(' ')}" fill="${farve}"/>`;
}
/** Det gule felt om en pil: pilen som tyk streg. */
const pilOmr = (a, c, b) => `<path d="M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}" fill="none" stroke-width="34" stroke-linecap="round"/>`;
/** Punkt på pilen (t fra 0 til 1). */
const paaPil = (a, c, b, t) => [0, 1].map((k) => r1((1 - t) ** 2 * a[k] + 2 * (1 - t) * t * c[k] + t * t * b[k]));

function trae(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-4" y="-24" width="8" height="26" fill="#7A5524"/>
    <ellipse cx="0" cy="-44" rx="22" ry="28" fill="#4E9A3A" stroke="#2E6B22" stroke-width="2.4"/>
  </g>`;
}

// Skyen: en lang bank fra kysten ind over bjerget
const sky = glat([
  [430, 140], [450, 96], [520, 70], [590, 84], [640, 52], [730, 40], [800, 62], [870, 48], [960, 58],
  [1030, 82], [1110, 74], [1190, 90], [1260, 80], [1320, 108], [1330, 140], [1290, 164], [1180, 160], [1080, 164], [960, 160], [840, 166],
  [700, 160], [580, 166], [480, 162],
]);

// ── Pilene ───────────────────────────────────────────────
const DAMP = '#7FB7DA', VAND = '#1E6FB0', JORD = '#2C5E8F';
const P = {
  fordampning: [[170, 466], [200, 330], [252, 200]],
  transpiration: [[485, 392], [476, 300], [492, 196]],
  nedboer: [[762, 182], [760, 310], [762, 432]],
  overflade: [[1150, 358], [1030, 386], [906, 440]],
  infiltration: [[1196, 364], [1196, 416], [1196, 470]],
  grundvand: [[1230, 570], [700, 720], [398, 512]],
};

// regn og sne
const regn = Array.from({ length: 16 }, (_, i) => {
  const x = 650 + i * 26 + (i % 3) * 5, y0 = 178 + (i % 4) * 9;
  return `<path d="M${x} ${y0} l-9 ${48 + (i % 2) * 14}"/>`;
}).join('');
const regn2 = Array.from({ length: 12 }, (_, i) => {
  const x = 670 + i * 32 + (i % 2) * 11, y0 = 270 + (i % 3) * 16;
  return `<path d="M${x} ${y0} l-9 ${44 + (i % 3) * 10}"/>`;
}).join('');
const fnug = (x, y) => `<g transform="translate(${x} ${y})" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round">
  <path d="M-7 0H7M-3.5 -6L3.5 6M-3.5 6L3.5 -6"/></g>`;
const sne = [[1250, 184], [1286, 198], [1322, 182], [1358, 200], [1300, 222], [1338, 214], [1270, 212], [1374, 224]]
  .map(([x, y]) => fnug(x, y)).join('');

// slør af vanddamp i luften (atmosfæren)
const damp = [[70, 230], [120, 400], [330, 120], [600, 250], [640, 400], [880, 200], [1060, 190], [1240, 250], [380, 410], [1110, 300]]
  .map(([x, y]) => `<path d="M${x} ${y} q12 -9 24 0 t24 0 t24 0"/>`).join('');

// isen ligger som en kappe på bjergtoppen
const isKappe = glat([[1252, 318], [1264, 294], [1310, 250], [1350, 224], [1400, 218], [1400, 244], [1350, 250], [1310, 276], [1268, 314]]);

// vandløbet fra søen ud i havet ligger langs overfladen
const vandloeb = 'M640 463 C600 466 560 470 520 472 S430 478 382 481';

export default {
  id: 'vand',
  navn: 'Vandets kredsløb',
  intro: 'Et snit fra havet over kysten og en sø op til en bjergtop med is. Vandet ligger i magasiner og flyttes mellem dem af transportmekanismer: pilene.',
  vb: [W, H],
  boks: [256, 42],
  mobilBredde: 940,
  lag: [
    { navn: 'Magasinerne', ord: ['hav', 'atmosfaere', 'is', 'overfladevand', 'grundvand'] },
    { navn: 'Vandet op og ned', ord: ['fordampning', 'transpiration', 'kondensation', 'nedboer'], ekstra: ['vanddamp'],
      ekstraFejl: { vanddamp: 'Vanddamp er vand på gasform, ikke en proces, og pladserne her er processer. Damp er usynlig, så skyen er heller ikke vanddamp.' } },
    { navn: 'Vandet på og i jorden', ord: ['infiltration', 'overfladeafstroemning', 'grundvandsstroemning'] },
  ],
  dele: [
    // himlen bag det hele har altid farve, så luft og jord kan skelnes fra start
    { ord: null, svg: `<defs><linearGradient id="vk-himmel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#BFE0F6"/><stop offset="1" stop-color="#EAF6FD"/></linearGradient></defs>
      <rect x="0" y="0" width="${W}" height="${HAVNIVEAU + 20}" fill="url(#vk-himmel)"/>` },
    // atmosfæren: den usynlige vanddamp er tegnet som slør i luften
    { ord: 'atmosfaere', svg: `<g fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".9">${damp}</g>` },
    // jorden: den umættede zone og havbundens sediment
    { ord: null, svg: `<path d="${sti([...havbund, ...land.slice(1), [W, H], [0, H]])}Z" fill="#E4CC9C" stroke="#8B6B3A" stroke-width="2.4"/>` },
    // grundvandet: jordens porer er fyldt med vand under spejlet
    { ord: 'grundvand', svg: `<defs><pattern id="vk-porer" width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="2" fill="#2C6FA6" opacity=".5"/><circle cx="12" cy="12" r="2" fill="#2C6FA6" opacity=".5"/></pattern></defs>
      <path d="${GRUNDVAND}" fill="#8FC3E6" opacity=".85"/>
      <path d="${GRUNDVAND}" fill="url(#vk-porer)"/>
      <path d="${sti(spejl)}" fill="none" stroke="#1E5F96" stroke-width="2.4" stroke-dasharray="10 7"/>` },
    // havet
    { ord: 'hav', svg: `<path d="${sti([[0, HAVNIVEAU], [380, HAVNIVEAU], ...havbund.slice().reverse().slice(1)])}Z" fill="#2F8FCB" stroke="#16609A" stroke-width="2.4"/>
      <path d="M0 ${HAVNIVEAU} H380" stroke="#B9E1F7" stroke-width="3"/>` },
    // søen og vandløbet
    { ord: 'overfladevand', svg: `<path d="${sti([[640, SOE_Y], ...soebund])}Z" fill="#4BA3D9" stroke="#16609A" stroke-width="2.4"/>
      <path d="${vandloeb}" fill="none" stroke="#4BA3D9" stroke-width="7" stroke-linecap="round"/>` },
    // isen på bjergtoppen
    { ord: 'is', svg: `<path d="${isKappe}" fill="#F6FBFF" stroke="#8DB7D3" stroke-width="2.4"/>` },
    // træerne ved kysten
    { ord: null, svg: trae(452, 478, 0.9) + trae(486, 474, 1.1) + trae(524, 472, 0.95) + trae(560, 469, 0.85) },
    // lag 2
    { ord: 'kondensation', svg: `<path d="${sky}" fill="#FFFFFF" stroke="#8FA3B1" stroke-width="2.6"/>` },
    { ord: 'nedboer', svg: `<g stroke="#5C9FD1" stroke-width="2.4" stroke-linecap="round" opacity=".8">${regn}${regn2}</g>${sne}
      ${pil(...P.nedboer, VAND)}` },
    { ord: 'fordampning', svg: pil(...P.fordampning, DAMP, { stiplet: true }) },
    { ord: 'transpiration', svg: pil(...P.transpiration, DAMP, { stiplet: true }) },
    // lag 3
    { ord: 'overfladeafstroemning', svg: pil(...P.overflade, VAND) },
    { ord: 'infiltration', svg: pil(...P.infiltration, JORD, { b: 6 }) },
    { ord: 'grundvandsstroemning', svg: pil(...P.grundvand, JORD) },
  ],
  pladser: [
    // magasinerne
    { ord: 'hav', x: 170, y: 712, maal: [150, 560],
      omr: `<path d="${sti([[0, HAVNIVEAU], [380, HAVNIVEAU], ...havbund.slice().reverse().slice(1)])}Z"/>`,
      fejl: { overfladevand: 'Overfladevand er ferskvand på land i søer og vandløb. Pladsen peger på det store, salte vand.' } },
    { ord: 'atmosfaere', x: 160, y: 46, maal: [110, 150],
      omr: `<path d="${sti([[0, 0], [W, 0], ...[...kyst, [860, SOE_Y], ...bjerg].reverse(), [0, HAVNIVEAU]])}Z"/>`,
      fejl: { is: 'Isen ligger på jorden. Pladsen peger op i luften.' } },
    { ord: 'is', x: 1270, y: 298, maal: [1360, 236],
      omr: `<path d="${isKappe}"/>`,
      fejl: { overfladevand: 'Vandet her er frosset fast og kan ligge på bjerget i mange år. Overfladevand er flydende.' } },
    { ord: 'overfladevand', x: 760, y: 548, maal: [750, 478],
      omr: `<path d="${sti([[640, SOE_Y], ...soebund])}Z"/><path d="${vandloeb}" fill="none" stroke-width="22" stroke-linecap="round"/>`,
      fejl: { grundvand: 'Grundvand er vandet nede i jordens porer. Pladsen peger på søen, der ligger frit på land.',
              hav: 'Havet er salt. Søen og vandløbet er ferskvand på land.' } },
    { ord: 'grundvand', x: 1225, y: 740, maal: [1330, 640],
      omr: `<path d="${GRUNDVAND}"/>`,
      fejl: { overfladevand: 'Overfladevand ligger frit i søer og vandløb. Pladsen peger på vandet i jordens porer under det stiplede spejl.' } },
    // op og ned
    { ord: 'fordampning', x: 205, y: 330, maal: null,
      omr: pilOmr(...P.fordampning),
      fejl: { transpiration: 'Pilen går op fra havet, og der er ingen planter. Vandet går direkte fra havoverfladen til damp.',
              kondensation: 'Pilen går op fra havet som usynlig damp. Det sted, hvor dampen bliver til dråber, er skyen.' } },
    { ord: 'transpiration', x: 484, y: 300, maal: null,
      omr: pilOmr(...P.transpiration),
      fejl: { fordampning: 'Pilen går op fra træerne. Der er et særligt fagord for den damp, planterne afgiver gennem spalteåbningerne.' } },
    { ord: 'kondensation', x: 560, y: 24, maal: [640, 76],
      omr: `<path d="${sky}"/>`,
      fejl: { fordampning: 'Skyen er ikke damp, men milliarder af små dråber. Pladsen peger på det sted, hvor dampen bliver til dråber.',
              vanddamp: 'Skyen er ikke vanddamp: damp er usynlig. Skyen er små dråber, og pladsen spørger efter processen, der danner dem.',
              nedboer: 'Det, der falder ned, er pilen under skyen. Her spørges efter, hvordan skyen bliver til.' } },
    { ord: 'nedboer', x: 760, y: 310, maal: null,
      omr: pilOmr(...P.nedboer),
      fejl: { kondensation: 'Pilen går ned fra skyen. Det er dråberne og snefnuggene, der falder.' } },
    // på og i jorden
    { ord: 'overfladeafstroemning', x: 1040, y: 250, maal: paaPil(...P.overflade, 0.42),
      omr: pilOmr(...P.overflade),
      fejl: { infiltration: 'Pilen følger skråningen hen over jorden ned mod søen. Det, der siver ned, er en anden pil.',
              grundvandsstroemning: 'Pilen ligger oven på jorden, ikke nede i grundvandet.' } },
    { ord: 'infiltration', x: 1196, y: 416, maal: null,
      omr: pilOmr(...P.infiltration),
      fejl: { grundvandsstroemning: 'Pilen går lodret ned gennem jorden over grundvandet. Strømmen i grundvandet er den lange pil længere nede.',
              overfladeafstroemning: 'Pilen går ned i jorden, ikke hen over den.' } },
    { ord: 'grundvandsstroemning', x: 762, y: 628, maal: null,
      omr: pilOmr(...P.grundvand),
      fejl: { infiltration: 'Pilen går vandret gennem grundvandet mod kysten. Det, der siver ned fra overfladen, er den korte pil.',
              overfladeafstroemning: 'Pilen ligger nede i grundvandet, ikke oven på jorden.' } },
  ],
};
