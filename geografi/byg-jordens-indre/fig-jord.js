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

// kontinenterne langs kuglens rand (grønne buer på det blå hav)
const LAND = [[-150, -112], [-84, -58], [-4, 38], [64, 96], [128, 168], [204, 236]].map(([a, b]) => {
  const [x1, y1] = paaKugle(a, R - 2.3), [x2, y2] = paaKugle(b, R - 2.3);
  return `<path d="M${x1} ${y1} A${R - 2.3} ${R - 2.3} 0 0 1 ${x2} ${y2}"/>`;
}).join('');

// gløden om kernen og en svag stenstruktur i kappen
const FILTRE = `<filter id="ji-gloed" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="ji-sten" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="3" seed="7"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.6 -.75"/><feComposite in2="SourceGraphic" operator="in"/></filter>`;

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
  graa: 'let',   // kernen skal gløde og havet være blåt, også før ordet sidder
  lag: [
    { navn: 'Hvad Jorden er lavet af', ord: ['skorpe', 'kappe', 'kerne'] },
    { navn: 'To slags skorpe', ord: ['oceanbundsskorpe', 'kontinentalskorpe'] },
    { navn: 'Stift, blødt og flydende', ord: ['litosfaere', 'astenosfaere', 'ydrekerne', 'indrekerne'], ekstra: ['magma'],
      ekstraFejl: { magma: 'Magma er smeltet sten og findes kun i små lommer. Kappen er fast sten, og det flydende i kernen er jern.' } },
  ],
  dele: [
    // baggrund: atmosfærens blå skær om kloden, himmel, hav og den stiplede forbindelse
    { ord: null, svg: `<defs>${KLIP}${FILTRE}<linearGradient id="ji-himmel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9FD0F2"/><stop offset="1" stop-color="#EAF6FD"/></linearGradient>
      <linearGradient id="ji-hav" x1="0" y1="${HAVNIVEAU}" x2="0" y2="224" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#3FA3DA"/><stop offset="1" stop-color="#1A5F96"/></linearGradient>
      <radialGradient id="ji-atmosfaere" cx="${CX}" cy="${CY}" r="${R + 26}" gradientUnits="userSpaceOnUse">
        <stop offset="${r1(R / (R + 26))}" stop-color="#7EC4F0" stop-opacity=".75"/><stop offset="1" stop-color="#BFE3FA" stop-opacity="0"/></radialGradient></defs>
      ${cirkel(R + 26, 'fill="url(#ji-atmosfaere)"')}
      ${iUdsnit(`<rect x="${UX0}" y="${UY0}" width="${UX1 - UX0}" height="${130}" fill="url(#ji-himmel)"/>
        <path d="${HAV}" fill="url(#ji-hav)"/>`)}
      <g fill="none" stroke="#6B5A4A" stroke-width="2" stroke-dasharray="7 6">
        <path d="M${CX + R + 4} ${CY - 16} L${UX0} ${UY0}"/><path d="M${CX + R + 4} ${CY + 16} L${UX0} ${UY1}"/>
      </g>` },

    // ── lag 1: kuglen og udsnittet ──
    { ord: 'skorpe', svg: `<defs><radialGradient id="ji-skorpe" cx="${CX}" cy="${CY}" r="${R}" gradientUnits="userSpaceOnUse">
        <stop offset="${r1(R_SKORPE / R)}" stop-color="#5A4434"/><stop offset="1" stop-color="#7A6150"/></radialGradient></defs>
      ${cirkel(R, 'fill="url(#ji-skorpe)" stroke="#2E2018" stroke-width="2.4"')}
      ${cirkel(R - 2.2, 'fill="none" stroke="#2470B3" stroke-width="4.4"')}
      <g fill="none" stroke="#5E9A3C" stroke-width="4.6">${LAND}</g>` },
    { ord: 'kappe', svg: `<defs><radialGradient id="ji-kappe" cx="${CX}" cy="${CY}" r="${R_SKORPE}" gradientUnits="userSpaceOnUse">
        <stop offset="${r1(R_KERNE / R_SKORPE)}" stop-color="#FF9A2E"/>
        <stop offset=".7" stop-color="#EE5A1F"/>
        <stop offset=".86" stop-color="#C2321A"/>
        <stop offset="1" stop-color="#8A2216"/></radialGradient></defs>
      ${cirkel(R_SKORPE, 'fill="url(#ji-kappe)" stroke="#3A1A10" stroke-width="1.6"')}
      ${cirkel(R_SKORPE - 1, 'fill="#2A0A04" filter="url(#ji-sten)" opacity=".28"')}` },
    { ord: 'kerne', svg: `<defs><radialGradient id="ji-kerne" cx="${CX}" cy="${CY}" r="${R_KERNE}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#FFFBE2"/><stop offset=".35" stop-color="#FFE27A"/>
        <stop offset=".7" stop-color="#FFB333"/><stop offset="1" stop-color="#F9801C"/></radialGradient></defs>
      ${cirkel(R_KERNE + 10, 'fill="#FFB347" opacity=".75" filter="url(#ji-gloed)"')}
      ${cirkel(R_KERNE, 'fill="url(#ji-kerne)" stroke="#9A4A0E" stroke-width="2"')}` },
    { ord: 'kappe', svg: `<defs><linearGradient id="ji-kappe-u" x1="0" y1="${km(0)}" x2="0" y2="${UY1}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#9A2A18"/><stop offset="1" stop-color="#C9401E"/></linearGradient></defs>
      ${iUdsnit(`<path d="${KAPPE_UDSNIT}" fill="url(#ji-kappe-u)"/>
        <path d="${KAPPE_UDSNIT}" fill="#2A0A04" filter="url(#ji-sten)" opacity=".25"/>`)}` },
    { ord: 'skorpe', svg: iUdsnit(`<path d="${SKORPE_UDSNIT}" fill="#7A6150" stroke="#2E2018" stroke-width="1.6"/>`) },

    // ── lag 2: de to slags skorpe ──
    { ord: 'oceanbundsskorpe', svg: `<defs><linearGradient id="ji-basalt" x1="0" y1="214" x2="0" y2="244" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#4C5866"/><stop offset="1" stop-color="#262D36"/></linearGradient></defs>
      ${iUdsnit(`<path d="${OCEANSKORPE}" fill="url(#ji-basalt)" stroke="#1C2128" stroke-width="1.6"/>`)}` },
    { ord: 'kontinentalskorpe', svg: `<defs><linearGradient id="ji-granit" x1="0" y1="176" x2="0" y2="280" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#E4B999"/><stop offset="1" stop-color="#B98564"/></linearGradient></defs>
      ${iUdsnit(`<path d="${KONTINENTSKORPE}" fill="url(#ji-granit)" stroke="#6E4A30" stroke-width="1.6"/>
      <g fill="#8E5E44">${[[1170, 222], [1205, 236], [1245, 216], [1262, 242], [1300, 226], [1318, 256], [1350, 214], [1372, 238], [1222, 208], [1290, 202]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`).join('')}</g>
      <g fill="#F4ECE6">${[[1192, 228], [1236, 238], [1280, 214], [1338, 232], [1362, 252]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2"/>`).join('')}</g>
      <path d="${sti(flade.slice(3))}" fill="none" stroke="#5E9A3C" stroke-width="4" stroke-linecap="round"/>
      <path d="M1300 180.3 L1315 176 L1331 179 L1322 182 L1314 180 L1306 183Z" fill="#FFFFFF" stroke="#C9D3DB" stroke-width="1"/>`)}` },

    // ── lag 3: stift, blødt og flydende ──
    { ord: 'astenosfaere', svg: `<defs><linearGradient id="ji-asteno" x1="0" y1="${km(80)}" x2="0" y2="${km(350)}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#FF8A2A" stop-opacity=".2"/><stop offset=".45" stop-color="#FF8A2A" stop-opacity=".62"/>
        <stop offset="1" stop-color="#FF8A2A" stop-opacity=".25"/></linearGradient></defs>
      ${iUdsnit(`<path d="${ASTENOSFAERE}" fill="url(#ji-asteno)"/>
      <g stroke="#FFF1E0" stroke-width="3.4" stroke-linecap="round" fill="#FFF1E0" opacity=".9">
        ${flydPil(960, 455, 120)}${flydPil(1150, 520, 130)}${flydPil(1000, 640, 110)}${flydPil(1230, 640, 110)}</g>`)}` },
    { ord: 'litosfaere', svg: `<defs><pattern id="ji-stiv" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <path d="M0 0V14" stroke="#1E0C06" stroke-width="2.4" opacity=".5"/></pattern></defs>
      ${iUdsnit(`<path d="${LITO_KAPPE}" fill="#3A140A" opacity=".25"/><path d="${LITO_KAPPE}" fill="url(#ji-stiv)"/>
        <path d="${sti(litoBund)}" fill="none" stroke="#1E0C06" stroke-width="3.4"/>`)}` },
    { ord: 'ydrekerne', svg: `<defs><radialGradient id="ji-ydre" cx="${CX}" cy="${CY}" r="${R_KERNE}" gradientUnits="userSpaceOnUse">
        <stop offset="${r1(R_INDRE / R_KERNE)}" stop-color="#FFC94A"/><stop offset=".7" stop-color="#FFA42E"/>
        <stop offset="1" stop-color="#F57518"/></radialGradient></defs>
      <path d="${ring(R_INDRE, R_KERNE)}" fill="url(#ji-ydre)" fill-rule="evenodd" stroke="#9A4A0E" stroke-width="2"/>
      <g fill="none" stroke="#FFF2C2" stroke-width="3" stroke-linecap="round" opacity=".8">${stroemme}</g>` },
    { ord: 'indrekerne', svg: `<defs><radialGradient id="ji-indre" cx="${CX}" cy="${CY}" r="${R_INDRE}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#FFFFF4"/><stop offset=".6" stop-color="#FFF4B8"/><stop offset="1" stop-color="#FFDF6E"/></radialGradient></defs>
      ${cirkel(R_INDRE + 8, 'fill="#FFF6C8" opacity=".9" filter="url(#ji-gloed)"')}
      ${cirkel(R_INDRE, 'fill="url(#ji-indre)" stroke="#C08A1A" stroke-width="2"')}` },

    // rammen og dybdeskalaen ovenpå det hele
    { ord: null, svg: `<rect x="${CX + R - 20}" y="${CY - 16}" width="24" height="32" fill="none" stroke="#2A1D14" stroke-width="2.4"/>
      <rect x="${UX0}" y="${UY0}" width="${UX1 - UX0}" height="${UY1 - UY0 - 1.5}" fill="none" stroke="#2A1D14" stroke-width="2.6"/>
      <g stroke="#FFF4E8" stroke-width="2" font-family="IBM Plex Mono, monospace" font-size="15" fill="#FFF4E8">${skala}</g>
      <text x="${(UX0 + UX1) / 2}" y="${UY1 - 22}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="15" fill="#FFF4E8">de øverste 400 km · dybden i målestok</text>` },
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
