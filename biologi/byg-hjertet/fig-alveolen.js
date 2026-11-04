// Alveolerne og gasudvekslingen: en klase alveoler for enden af en bronkiole,
// og en lup ind på væggen mellem luften og blodet.
import { boelge } from '../../byg-motor/tegn.js';
import { F, defs, pil, blodlegeme, lille } from './tegning.js';

// ── Klasen af alveoler ──────────────────────────────────────
const blaerer = [[320, 200, 40], [392, 190, 40], [440, 250, 38], [412, 316, 42], [338, 318, 40], [282, 262, 38], [365, 256, 40]];
const bronkioleSti = 'M350 18 C350 80 356 120 362 196';
const bronkiole = `<path d="${bronkioleSti}" fill="none" stroke="#9E5A64" stroke-width="40" stroke-linecap="round"/>
  <path d="${bronkioleSti}" fill="none" stroke="#F2C2C0" stroke-width="33" stroke-linecap="round"/>
  <path d="${bronkioleSti}" fill="none" stroke="#FBE6E4" stroke-width="13" stroke-linecap="round"/>
  <path d="M336 50 h28 M338 92 h28 M342 134 h28" stroke="#D89A9C" stroke-width="3" stroke-linecap="round"/>`;
const alveoler = blaerer.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#alv-blaere)" stroke="#9E5A64" stroke-width="2.5"/>`).join('');
// kapillærnettet tæt om blærerne: blåt ind fra lungearterien, rødt ud mod lungevenen
const net = blaerer.map(([x, y, r], i) =>
  `<path d="${boelge(x - r * 0.9, y + (i % 2 ? 8 : -8), x + r * 0.9, y + (i % 2 ? -6 : 10), 5, 2)}" fill="none" stroke="url(#alv-net)" stroke-width="4" stroke-linecap="round"/>`).join('')
  + `<path d="M226 420 C260 404 268 370 282 300" fill="none" stroke="${F.iltfattigMoerk}" stroke-width="12" stroke-linecap="round"/>
     <path d="M226 420 C260 404 268 370 282 300" fill="none" stroke="${F.iltfattig}" stroke-width="7" stroke-linecap="round"/>
     <path d="M440 210 C470 170 500 150 540 140" fill="none" stroke="${F.iltrigMoerk}" stroke-width="12" stroke-linecap="round"/>
     <path d="M440 210 C470 170 500 150 540 140" fill="none" stroke="${F.iltrig}" stroke-width="7" stroke-linecap="round"/>`
  + lille(226, 444, 'fra hjertet', F.iltfattigMoerk, 'start') + lille(548, 136, 'til hjertet', F.iltrigMoerk, 'start');

// ── Luppen ──────────────────────────────────────────────────
const L = { x: 604, y: 486, r: 160 };
const VAEG = 448;                          // overkanten af væggen mellem luft og blod
const lupMarkering = `<circle cx="412" cy="316" r="50" fill="none" stroke="${F.blaek}" stroke-width="2.5" stroke-dasharray="7 6"/>
  <path d="M366 336 L452 548 M458 290 L700 358" stroke="${F.blaek}" stroke-width="1.6" stroke-dasharray="7 6" opacity=".7"/>`;
const ilt = (x, y) => `<g transform="translate(${x} ${y})"><circle cx="-5" r="6" fill="#E04848" stroke="#8E1F2A" stroke-width="1.4"/><circle cx="5" r="6" fill="#E04848" stroke="#8E1F2A" stroke-width="1.4"/></g>`;
const co2 = (x, y) => `<g transform="translate(${x} ${y})"><circle cx="-9" r="5.5" fill="#E04848" stroke="#8E1F2A" stroke-width="1.4"/><circle r="6.5" fill="#55606B" stroke="#22282E" stroke-width="1.4"/><circle cx="9" r="5.5" fill="#E04848" stroke="#8E1F2A" stroke-width="1.4"/></g>`;

const lupBaggrund = `<circle cx="${L.x}" cy="${L.y}" r="${L.r}" fill="#EEF6FC"/>
  <g clip-path="url(#alv-lup)">
    ${ilt(492, 410)}${ilt(560, 378)}${ilt(626, 412)}${ilt(506, 376)}${co2(718, 398)}${co2(650, 382)}
  </g>
  ${lille(L.x, L.y - 132, 'luft i alveolen', '#3C5C78')}`;
const vaeg = `<g clip-path="url(#alv-lup)">
  <rect x="${L.x - L.r}" y="${VAEG}" width="${2 * L.r}" height="11" fill="#F0B7B4" stroke="#9E5A64" stroke-width="1.5"/>
  <rect x="${L.x - L.r}" y="${VAEG + 11}" width="${2 * L.r}" height="9" fill="#E59A9B" stroke="#9E5A64" stroke-width="1.5"/>
  <rect x="${L.x - L.r}" y="${L.y + 128}" width="${2 * L.r}" height="20" fill="#E59A9B" stroke="#9E5A64" stroke-width="1.5"/>
</g>`;
const kapillaer = `<g clip-path="url(#alv-lup)">
  <rect x="${L.x - L.r}" y="${VAEG + 20}" width="${2 * L.r}" height="${L.y + 128 - VAEG - 20}" fill="url(#alv-plasma)"/>
  ${pil(470, 596, 740, 596, '#B27C80', 3)}
</g>`;
const blodlegemer = `<g clip-path="url(#alv-lup)">${blodlegeme(500, 520, -12, 1.6)}${blodlegeme(604, 548, 8, 1.6)}${blodlegeme(704, 516, -6, 1.6)}</g>`;
const iltPile = pil(536, 404, 548, 500, '#C62F3A', 4) + pil(580, 400, 600, 520, '#C62F3A', 4);
const co2Pile = pil(690, 520, 682, 404, '#4A5560', 4);
const lupRamme = `<circle cx="${L.x}" cy="${L.y}" r="${L.r}" fill="none" stroke="${F.blaek}" stroke-width="3.5"/>`;

const ekstraDefs = `<defs>
  <radialGradient id="alv-blaere" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFF4F2"/><stop offset="1" stop-color="#F3C4C2"/></radialGradient>
  <linearGradient id="alv-net" x1="0" x2="1"><stop offset="0" stop-color="${F.iltfattig}"/><stop offset="1" stop-color="${F.iltrig}"/></linearGradient>
  <linearGradient id="alv-plasma" x1="0" x2="1"><stop offset="0" stop-color="#E7D9F0"/><stop offset="1" stop-color="#FAD3CF"/></linearGradient>
  <clipPath id="alv-lup"><circle cx="${L.x}" cy="${L.y}" r="${L.r - 1.5}"/></clipPath>
</defs>`;

export default {
  id: 'alveole',
  navn: 'Alveolen',
  intro: 'Yderst i lungen ender luftvejene i små blærer med blod lige udenfor. I luppen er væggen mellem luften og blodet forstørret mange gange.',
  vb: [1000, 680],
  boks: [206, 42],
  mobilBredde: 720,
  lag: [
    { navn: 'Luften møder blodet', ord: ['bronkiole', 'alveole', 'kapillaer'] },
    { navn: 'Gasudvekslingen', ord: ['ilt', 'kuldioxid', 'roedtBlodlegeme', 'tyndVaeg'], ekstra: ['hvidtBlodlegeme'],
      ekstraFejl: { hvidtBlodlegeme: 'Der er ingen hvide blodlegemer på tegningen. De hører til immunforsvaret og bærer ikke ilt.' } },
  ],
  dele: [
    { ord: null, svg: defs + ekstraDefs + lupBaggrund + lupMarkering },
    { ord: 'bronkiole', svg: bronkiole },
    { ord: 'alveole', svg: alveoler },
    { ord: 'kapillaer', svg: net + kapillaer },
    { ord: 'tyndVaeg', svg: vaeg },
    { ord: 'roedtBlodlegeme', svg: blodlegemer },
    { ord: 'ilt', svg: iltPile },
    { ord: 'kuldioxid', svg: co2Pile },
    { ord: null, svg: lupRamme + lille(L.x, L.y + L.r + 22, 'forstørret udsnit, ikke i målestok', '#6B5A60') },
  ],
  pladser: [
    { ord: 'bronkiole', x: 125, y: 60, maal: [350, 60],
      omr: `<path d="${bronkioleSti}" fill="none" stroke-width="50"/>`,
      fejl: { alveole: 'Blærerne sidder for enden. Pladsen peger på det rør, luften kommer ned igennem.' } },
    { ord: 'alveole', x: 125, y: 204, maal: [296, 196],
      omr: blaerer.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 4}"/>`).join(''),
      fejl: { bronkiole: 'Bronkiolen er røret, luften kommer igennem. Pladsen peger på en af de runde blærer.',
              kapillaer: 'Kapillærerne er de tynde blodkar uden på blærerne. Pladsen peger på selve blæren.' } },
    { ord: 'ilt', x: 125, y: 384, maal: [540, 440],
      omr: `<rect x="520" y="392" width="96" height="134" rx="18"/>`,
      fejl: { kuldioxid: 'Se på pilenes retning: de går fra luften ned i blodet. Hvilken gas skal blodet have fra lungerne?' } },
    { ord: 'tyndVaeg', x: 125, y: 470, maal: [470, VAEG + 10],
      omr: `<rect x="${L.x - L.r}" y="${VAEG - 4}" width="${2 * L.r}" height="28"/>`,
      fejl: { kapillaer: 'Pladsen peger på det tynde, lyserøde bånd mellem luften og blodet, ikke på blodet.' } },
    { ord: 'kapillaer', x: 125, y: 590, maal: [500, 586],
      omr: `<rect x="${L.x - L.r + 20}" y="${VAEG + 20}" width="${2 * L.r - 40}" height="${L.y + 128 - VAEG - 20}" rx="14"/>`,
      fejl: { roedtBlodlegeme: 'Pladsen peger på hele det rør, blodet løber i, ikke på en enkelt celle.',
              alveole: 'Alveolen er luftblæren foroven. Her er det røret med blod forneden.' } },
    { ord: 'kuldioxid', x: 875, y: 360, maal: [686, 440],
      omr: `<rect x="660" y="392" width="56" height="134" rx="18"/>`,
      fejl: { ilt: 'Se på pilens retning: den går fra blodet op i luften. Hvilken gas skal vi af med?' } },
    { ord: 'roedtBlodlegeme', x: 875, y: 540, maal: [722, 520],
      omr: `<ellipse cx="500" cy="520" rx="30" ry="20"/><ellipse cx="604" cy="548" rx="30" ry="20"/><ellipse cx="704" cy="516" rx="30" ry="20"/>`,
      fejl: { kapillaer: 'Pladsen peger på en af de røde, bulede skiver i blodet, ikke på hele røret.' } },
  ],
};
