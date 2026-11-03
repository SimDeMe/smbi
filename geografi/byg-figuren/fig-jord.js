// Jordens indre: Jorden skåret over og et udsnit af de øverste 400 km.
//
// Lag 1 er den kemiske inddeling (skorpe, kappe, kerne), lag 2 de to slags skorpe
// og lag 3 den mekaniske inddeling (litosfære, astenosfære, ydre og indre kerne).
// Kuglen er i målestok, undtagen skorpen, der er tegnet alt for tyk.
// Udsnittet er i målestok i dybden (1,5 px pr. km), men ikke i bredden, og land
// og hav over havniveau er overdrevne.

const r1 = (v) => Math.round(v * 10) / 10;
const sti = (pkt) => pkt.map(([x, y], i) => (i ? 'L' : 'M') + r1(x) + ' ' + r1(y)).join(' ');

const W = 1400, H = 800;

// ── Kuglen: radius 6371 km = 300 px ──────────────────────
const CX = 470, CY = 420;
const R = 300;                          // overfladen
const R_SKORPE = 290;                   // skorpens bund (overdrevet)
const R_KERNE = r1(R * 3471 / 6371);    // kernen begynder i 2900 km dybde
const R_INDRE = r1(R * 1221 / 6371);    // den indre kerne begynder i 5150 km dybde

const cirkel = (r, attr) => `<circle cx="${CX}" cy="${CY}" r="${r}" ${attr}/>`;
/** En ring mellem to radier som én sti (fyldes med evenodd). */
const ring = (ri, ry) => [ry, ri].map((r) => `M${CX - r} ${CY} A${r} ${r} 0 1 0 ${CX + r} ${CY} A${r} ${r} 0 1 0 ${CX - r} ${CY}Z`).join(' ');
const paaKugle = (grader, r) => {
  const v = (grader * Math.PI) / 180;
  return [r1(CX + r * Math.cos(v)), r1(CY + r * Math.sin(v))];
};

// strømme i den flydende ydre kerne
const stroemme = [[-160, -95, 92], [-60, 10, 118], [30, 110, 140], [140, 205, 104], [215, 290, 128]]
  .map(([a, b, r]) => {
    const [x1, y1] = paaKugle(a, r), [x2, y2] = paaKugle(b, r);
    return `<path d="M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}"/>`;
  }).join('');

// ── Udsnittet: de øverste 400 km, havniveau i y = 200 ────
const UX0 = 920, UX1 = 1390, UY0 = 100, UY1 = H;
const HAVNIVEAU = 200;
const km = (d) => HAVNIVEAU + d * 1.5;
const OK_GRAENSE = 1140;   // her skifter oceanbundsskorpen til kontinental skorpe

// overfladen: havbunden, kontinentalskråningen og landet med et bjerg
const flade = [[UX0, 224], [1100, 224], [OK_GRAENSE, 214], [1175, 197], [1230, 194], [1280, 186], [1315, 176], [1345, 182], [UX1, 192]];
// skorpens bund (Moho): ca. 7 km under havet, 35 km under land og en rod under bjerget
const moho = [[UX0, 238], [1100, 238], [OK_GRAENSE, 244], [1175, 250], [1230, 254], [1280, 264], [1315, 280], [1345, 276], [UX1, 258]];
// litosfærens bund: ca. 80 km under havet, ca. 150 km under kontinentet
const litoBund = [[UX0, km(80)], [1080, km(81)], [OK_GRAENSE, km(97)], [1190, km(130)], [1250, km(147)], [1320, km(152)], [UX1, km(150)]];
// astenosfærens bund omkring 350 km
const asteBund = [[UX1, km(350)], [1240, km(345)], [1080, km(352)], [UX0, km(348)]];

const rev = (a) => a.slice().reverse();
const OCEANSKORPE = sti([...flade.slice(0, 3), ...rev(moho.slice(0, 3))]) + 'Z';
const KONTINENTSKORPE = sti([...flade.slice(2), ...rev(moho.slice(2))]) + 'Z';
const SKORPE_UDSNIT = sti([...flade, ...rev(moho)]) + 'Z';
const KAPPE_UDSNIT = sti([...moho, [UX1, UY1], [UX0, UY1]]) + 'Z';
const LITOSFAERE = sti([...flade, ...rev(litoBund)]) + 'Z';
const LITO_KAPPE = sti([...moho, ...rev(litoBund)]) + 'Z';
const ASTENOSFAERE = sti([...litoBund, ...asteBund]) + 'Z';
// havet: fra havniveau ned til havbunden, så langt ind som havbunden er under havniveau
const HAV = sti([[UX0, HAVNIVEAU], [1169, HAVNIVEAU], [OK_GRAENSE, 214], [1100, 224], [UX0, 224]]) + 'Z';

// langsom strømning i astenosfæren: lange, flade pile
function flydPil(x, y, l) {
  return `<path d="M${x} ${y} q${l / 2} -16 ${l} 0" fill="none"/>
    <polygon points="${x + l + 3},${y + 2} ${x + l - 12},${y - 7} ${x + l - 7},${y + 9}" stroke="none"/>`;
}

// dybdeskala i venstre side af udsnittet
const skala = [100, 200, 300].map((d) => `<path d="M${UX0} ${km(d)} h14"/>
  <text x="${UX0 + 20}" y="${km(d) + 5}" stroke="none">${d} km</text>`).join('');

const KLIP = `<clipPath id="ji-klip"><rect x="${UX0}" y="${UY0}" width="${UX1 - UX0}" height="${UY1 - UY0}"/></clipPath>`;
const iUdsnit = (svg) => `<g clip-path="url(#ji-klip)">${svg}</g>`;

export default {
  id: 'jord',
  navn: 'Jordens indre',
  intro: 'Jorden skåret over, og til højre et udsnit af de øverste 400 km. Lagene kan deles efter, hvad de er lavet af, og efter hvor stive de er.',
  vb: [W, H],
  boks: [232, 42],
  mobilBredde: 940,
  lag: [
    { navn: 'Hvad Jorden er lavet af', ord: ['skorpe', 'kappe', 'kerne'] },
    { navn: 'To slags skorpe', ord: ['oceanbundsskorpe', 'kontinentalskorpe'] },
    { navn: 'Stift, blødt og flydende', ord: ['litosfaere', 'astenosfaere', 'ydrekerne', 'indrekerne'], ekstra: ['magma'],
      ekstraFejl: { magma: 'Magma er smeltet sten og findes kun i små lommer. Kappen er fast sten, og det flydende i kernen er jern.' } },
  ],
  dele: [
    // baggrund: himmel, hav og den stiplede forbindelse fra kuglen til udsnittet
    { ord: null, svg: `<defs>${KLIP}<linearGradient id="ji-himmel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#BFE0F6"/><stop offset="1" stop-color="#EAF6FD"/></linearGradient></defs>
      ${iUdsnit(`<rect x="${UX0}" y="${UY0}" width="${UX1 - UX0}" height="${130}" fill="url(#ji-himmel)"/>
        <path d="${HAV}" fill="#2F8FCB"/>`)}
      <g fill="none" stroke="#6B5A4A" stroke-width="2" stroke-dasharray="7 6">
        <path d="M${CX + R + 4} ${CY - 16} L${UX0} ${UY0}"/><path d="M${CX + R + 4} ${CY + 16} L${UX0} ${UY1}"/>
      </g>` },

    // ── lag 1: kuglen og udsnittet ──
    { ord: 'skorpe', svg: cirkel(R, 'fill="#8C6A4A" stroke="#4A3524" stroke-width="2.6"') },
    { ord: 'kappe', svg: `<defs><radialGradient id="ji-kappe" cx="${CX}" cy="${CY}" r="${R_SKORPE}" gradientUnits="userSpaceOnUse">
        <stop offset="${r1(R_KERNE / R_SKORPE)}" stop-color="#C8452B"/><stop offset="1" stop-color="#EE9248"/></radialGradient></defs>
      ${cirkel(R_SKORPE, 'fill="url(#ji-kappe)" stroke="#4A3524" stroke-width="1.6"')}` },
    { ord: 'kerne', svg: cirkel(R_KERNE, 'fill="#F2B33D" stroke="#8A4A12" stroke-width="2.2"') },
    { ord: 'kappe', svg: `<defs><linearGradient id="ji-kappe-u" x1="0" y1="${km(0)}" x2="0" y2="${UY1}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#EE9248"/><stop offset="1" stop-color="#DC6A36"/></linearGradient></defs>
      ${iUdsnit(`<path d="${KAPPE_UDSNIT}" fill="url(#ji-kappe-u)"/>`)}` },
    { ord: 'skorpe', svg: iUdsnit(`<path d="${SKORPE_UDSNIT}" fill="#8C6A4A" stroke="#4A3524" stroke-width="1.6"/>`) },

    // ── lag 2: de to slags skorpe ──
    { ord: 'oceanbundsskorpe', svg: iUdsnit(`<path d="${OCEANSKORPE}" fill="#4E5A66" stroke="#2A3138" stroke-width="1.6"/>`) },
    { ord: 'kontinentalskorpe', svg: iUdsnit(`<path d="${KONTINENTSKORPE}" fill="#D3A585" stroke="#6E4A30" stroke-width="1.6"/>
      <g fill="#9C6F52">${[[1170, 222], [1205, 236], [1245, 216], [1262, 242], [1300, 226], [1318, 256], [1350, 214], [1372, 238], [1222, 208], [1290, 202]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`).join('')}</g>`) },

    // ── lag 3: stift, blødt og flydende ──
    { ord: 'astenosfaere', svg: iUdsnit(`<path d="${ASTENOSFAERE}" fill="#E5482A" opacity=".42"/>
      <g stroke="#FFF1E0" stroke-width="3.4" stroke-linecap="round" fill="#FFF1E0" opacity=".9">
        ${flydPil(960, 455, 120)}${flydPil(1150, 520, 130)}${flydPil(1000, 640, 110)}${flydPil(1230, 640, 110)}</g>`) },
    { ord: 'litosfaere', svg: `<defs><pattern id="ji-stiv" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <path d="M0 0V14" stroke="#4A2A18" stroke-width="2.4" opacity=".45"/></pattern></defs>
      ${iUdsnit(`<path d="${LITO_KAPPE}" fill="url(#ji-stiv)"/>
        <path d="${sti(litoBund)}" fill="none" stroke="#3A2214" stroke-width="3.4"/>`)}` },
    { ord: 'ydrekerne', svg: `<path d="${ring(R_INDRE, R_KERNE)}" fill="#F59A2A" fill-rule="evenodd" stroke="#8A4A12" stroke-width="2.2"/>
      <g fill="none" stroke="#FFE7A8" stroke-width="3" stroke-linecap="round" opacity=".85">${stroemme}</g>` },
    { ord: 'indrekerne', svg: cirkel(R_INDRE, 'fill="#FFF0B0" stroke="#B57A10" stroke-width="2.4"') },

    // rammen og dybdeskalaen ovenpå det hele
    { ord: null, svg: `<rect x="${CX + R - 20}" y="${CY - 16}" width="24" height="32" fill="none" stroke="#2A1D14" stroke-width="2.4"/>
      <rect x="${UX0}" y="${UY0}" width="${UX1 - UX0}" height="${UY1 - UY0 - 1.5}" fill="none" stroke="#2A1D14" stroke-width="2.6"/>
      <g stroke="#2A1D14" stroke-width="2" font-family="IBM Plex Mono, monospace" font-size="15" fill="#2A1D14">${skala}</g>
      <text x="${(UX0 + UX1) / 2}" y="${UY1 - 22}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="15" fill="#2A1D14">de øverste 400 km · dybden i målestok</text>` },
  ],
  pladser: [
    // lag 1
    { ord: 'skorpe', x: 190, y: 60, maal: paaKugle(-125, 295),
      omr: `<circle cx="${CX}" cy="${CY}" r="295" fill="none" stroke-width="16"/><path d="${SKORPE_UDSNIT}"/>`,
      fejl: { kappe: 'Pladsen peger på det tynde yderste lag. Det tykke lag af sten under det er en anden plads.',
              litosfaere: 'Pladsen peger kun på det tynde yderste lag af let sten, ikke på hele den stive plade.' } },
    { ord: 'kappe', x: 750, y: 60, maal: paaKugle(-50, 230),
      omr: `<path d="${ring(R_KERNE, R_SKORPE)}" fill-rule="evenodd"/><path d="${KAPPE_UDSNIT}"/>`,
      fejl: { skorpe: 'Pladsen peger på det tykke lag af sten under det tynde yderste lag. Det når næsten halvvejs ind mod midten.',
              kerne: 'Pladsen peger på et lag af sten, ikke på kuglen af jern og nikkel i midten.',
              astenosfaere: 'Pladsen peger på hele det tykke stenlag, ikke kun på den bløde zone lige under pladerne.' } },
    { ord: 'kerne', x: 150, y: 760, maal: [340, 480],
      omr: cirkel(R_KERNE, ''),
      fejl: { kappe: 'Pladsen peger på kuglen af jern og nikkel i midten, ikke på stenlaget uden om.',
              ydrekerne: 'Pladsen peger på hele kuglen i midten, både den flydende og den faste del.',
              indrekerne: 'Pladsen peger på hele kuglen i midten, både den flydende og den faste del.' } },
    // lag 2
    { ord: 'oceanbundsskorpe', x: 1030, y: 160, maal: [1030, 231],
      omr: `<path d="${OCEANSKORPE}"/>`,
      fejl: { kontinentalskorpe: 'Skorpen her ligger under havet og er tynd: 5–10 km tung, mørk basalt.' } },
    { ord: 'kontinentalskorpe', x: 1270, y: 122, maal: [1240, 226],
      omr: `<path d="${KONTINENTSKORPE}"/>`,
      fejl: { oceanbundsskorpe: 'Skorpen her ligger under landet og bjerget. Den er tyk og lavet af lettere sten som granit.' } },
    // lag 3
    { ord: 'litosfaere', x: 1155, y: 300, maal: [1340, 370],
      omr: `<path d="${LITOSFAERE}"/>`,
      fejl: { astenosfaere: 'Pladsen peger på det stive lag øverst, som er delt i plader. Det bløde lag ligger under.',
              skorpe: 'Pladen er mere end det yderste lag: den øverste, stive del af kappen hører med.' } },
    { ord: 'astenosfaere', x: 1155, y: 560, maal: [990, 620],
      omr: `<path d="${ASTENOSFAERE}"/>`,
      fejl: { litosfaere: 'Den stive plade ligger ovenpå. Her er stenen så varm, at den er blød og flyder få cm om året.',
              kappe: 'Laget er en del af det tykke stenlag, men pladsen spørger efter navnet på den bløde zone, pladerne glider på.' } },
    { ord: 'ydrekerne', x: 720, y: 765, maal: [590, 500],
      omr: `<path d="${ring(R_INDRE, R_KERNE)}" fill-rule="evenodd"/>`,
      fejl: { indrekerne: 'Den inderste kugle er fast. Pladsen peger på laget uden om, hvor jernet er flydende.',
              astenosfaere: 'Det bløde lag ligger lige under pladerne. Pladsen peger dybt nede, hvor jernet er smeltet.',
              kerne: 'Pladsen peger kun på den flydende del af kuglen i midten, ikke på det hele.' } },
    { ord: 'indrekerne', x: 470, y: 770, maal: [CX, CY],
      omr: cirkel(R_INDRE, ''),
      fejl: { ydrekerne: 'Pladsen peger på kuglen helt inde i midten. Den er fast, fordi trykket er enormt.',
              kerne: 'Pladsen peger kun på den faste kugle helt inde i midten, ikke på det hele.' } },
  ],
};
