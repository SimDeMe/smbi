// Mitokondrien: én mitokondrie skåret igennem og meget forstørret.
// Lag 1 er opbygningen, lag 2 er, hvor respirationens trin foregår.
import { kredsPil, ellipseSti, paaEllipse } from '../../byg-motor/tegn.js';

const r1 = (v) => Math.round(v * 10) / 10;

// Den ydre og den indre membran; rummet imellem er intermembranrummet
const M = { x: 550, y: 320 };
const YDRE = [292, 205];
const INDRE = [264, 177];
const MIDT = [278, 191];          // midt i intermembranrummet
const ydre = ellipseSti(M.x, M.y, ...YDRE);
const indre = ellipseSti(M.x, M.y, ...INDRE);

const FARVE = { membran: '#C93E22', rum: '#FFB59E', matrix: '#FFE4D8' };

/** y, hvor den indre membran går ved x (oppe eller nede). */
function kant(x, op) {
  const h = INDRE[1] * Math.sqrt(1 - ((x - M.x) / INDRE[0]) ** 2);
  return op ? M.y - h : M.y + h;
}

// Cristae: fire folder af den indre membran, skiftevis fra over- og underkanten.
// Folden er åben ud mod intermembranrummet, så rummet fortsætter ind i den.
const B = 14;                     // halv bredde af en fold
const FOLDER = [[440, true, 205], [520, false, 205], [600, true, 205], [680, false, 205]];
function fold([x, op, l]) {
  const s = op ? 1 : -1;
  const yv = kant(x - B, op) - 3 * s, yh = kant(x + B, op) - 3 * s;   // lidt ude i rummet
  const spids = kant(x, op) + l * s;
  return `M${x - B} ${r1(yv)} L${x - B} ${r1(spids)} A${B} ${B} 0 0 ${op ? 0 : 1} ${x + B} ${r1(spids)} L${x + B} ${r1(yh)}`;
}
const folder = FOLDER.map(fold);
const foldMidt = ([x, op, l]) => [x, r1(kant(x, op) + (l / 2) * (op ? 1 : -1))];

// Elektrontransportkæden: tre proteiner i rad i den første folds højre væg
const ETK = [205, 240, 275];
const etk = ETK.map((y) => `<ellipse cx="458" cy="${y}" rx="12" ry="16" fill="#5AA9DD" stroke="#1D5A85" stroke-width="2.6"/>`).join('')
  + `<path d="M466 196 C480 222 480 228 468 240 C480 255 480 262 468 284" fill="none" stroke="#1D5A85" stroke-width="2" stroke-dasharray="4 4"/>`;

// ATP-syntaser: et rør i den sidste folds venstre væg, en stilk og et rundt hoved ude i matrix
const ATP = [320, 400];
const atp = ATP.map((y) => `<rect x="660" y="${y - 13}" width="12" height="26" rx="3" fill="#9C7BE0" stroke="#4E2A9A" stroke-width="2.2"/>
  <path d="M660 ${y} H648" stroke="#4E2A9A" stroke-width="5" stroke-linecap="round"/>
  <circle cx="634" cy="${y}" r="14" fill="#B79BEF" stroke="#4E2A9A" stroke-width="2.6"/>`).join('');

const KREDS = { x: 752, y: 320, r: 38 };

export default {
  id: 'mitokondrie',
  navn: 'Mitokondrien',
  intro: 'Én mitokondrie skåret igennem og meget forstørret. Først dens opbygning, så hvor respirationens trin foregår.',
  vb: [1100, 640],
  boks: [250, 42],
  mobilBredde: 750,
  lag: [
    { navn: 'Opbygningen', ord: ['ydreMembran', 'intermembranrum', 'indreMembran', 'matrix', 'cristae'], ekstra: ['thylakoid'],
      ekstraFejl: { thylakoid: 'Thylakoider findes kun i kloroplasten. Mitokondriens indre membran danner folder i stedet.' } },
    { navn: 'Hvor respirationen sker', ord: ['citronsyrecyklus', 'elektrontransportkaede', 'atpSyntase'], ekstra: ['glykolyse'],
      ekstraFejl: { glykolyse: 'Glykolysen sker i cytoplasmaet, uden for mitokondrien. Først bagefter kommer pyruvat ind og bliver nedbrudt videre her.' } },
  ],
  dele: [
    { ord: 'intermembranrum', svg: `<path d="${ydre}" fill="${FARVE.rum}"/>` },
    { ord: 'matrix', svg: `<path d="${indre}" fill="${FARVE.matrix}"/>` },
    { ord: 'indreMembran', svg: `<path d="${indre}" fill="none" stroke="${FARVE.membran}" stroke-width="5"/>` },
    { ord: 'cristae', svg: folder.map((d) => `<path d="${d}" fill="${FARVE.rum}" stroke="${FARVE.membran}" stroke-width="5"/>`).join('') },
    { ord: 'elektrontransportkaede', svg: etk },
    { ord: 'atpSyntase', svg: atp },
    { ord: 'citronsyrecyklus', svg: kredsPil(KREDS.x, KREDS.y, KREDS.r, '#0FA593', 7) },
    { ord: 'ydreMembran', svg: `<path d="${ydre}" fill="none" stroke="${FARVE.membran}" stroke-width="6"/>` },
  ],
  pladser: [
    { ord: 'ydreMembran', x: 130, y: 200, maal: paaEllipse(M.x, M.y, ...YDRE, 205).map(r1),
      omr: `<path d="${ydre}" fill="none" stroke-width="16"/>`,
      fejl: { indreMembran: 'Den indre membran ligger længere inde og danner folder. Pladsen peger på den glatte hinde yderst.' } },
    { ord: 'matrix', x: 130, y: 300, maal: [350, 300],
      omr: `<path d="${indre}"/>`,
      fejl: { intermembranrum: 'Rummet mellem de to membraner er smalt. Prikken sidder i væsken inderst, inden for begge membraner.',
              cristae: 'Folderne er membran. Prikken sidder i væsken mellem folderne.' } },
    { ord: 'intermembranrum', x: 130, y: 400, maal: paaEllipse(M.x, M.y, ...MIDT, 160).map(r1),
      omr: `<path d="${ydre} ${indre}" fill-rule="evenodd"/>`,
      fejl: { matrix: 'Den store væske i midten har sit eget fagord. Prikken sidder i det smalle mellemrum mellem de to membraner.' } },
    { ord: 'indreMembran', x: 130, y: 540, maal: paaEllipse(M.x, M.y, ...INDRE, 135).map(r1),
      omr: `<path d="${indre}" fill="none" stroke-width="16"/>`,
      fejl: { ydreMembran: 'Den yderste hinde er glat. Pladsen peger på hinden lige inden for den, som danner folder ind i midten.',
              cristae: 'Folderne har deres eget fagord. Pladsen peger på hele hinden, der går rundt langs kanten.' } },
    { ord: 'cristae', x: 970, y: 130, maal: foldMidt(FOLDER[2]),
      omr: `<g fill="none" stroke-width="44" stroke-linecap="round">${FOLDER.map(([x, op, l]) =>
        `<path d="M${x} ${r1(kant(x, op))} V${r1(kant(x, op) + (l - 8) * (op ? 1 : -1))}"/>`).join('')}</g>`,
      fejl: { indreMembran: 'Folderne er en del af den inderste hinde, men de har deres eget fagord.' } },
    { ord: 'citronsyrecyklus', x: 970, y: 320, maal: [KREDS.x + KREDS.r, KREDS.y],
      omr: `<circle cx="${KREDS.x}" cy="${KREDS.y}" r="${KREDS.r + 16}"/>`,
      fejl: { elektrontransportkaede: 'Kæden af proteiner sidder i membranen. Pladsen peger på kredsløbet af reaktioner ude i væsken.' } },
    { ord: 'elektrontransportkaede', x: 400, y: 40, maal: [482, 222],
      omr: `<rect x="438" y="184" width="44" height="112" rx="16"/>`,
      fejl: { atpSyntase: 'Proteinet med hoved og stilk sidder i en anden fold. Pladsen peger på rækken af proteiner, der sender elektroner videre.',
              citronsyrecyklus: 'Kredsløbet kører ude i væsken. Pladsen peger på proteinerne i membranen.' } },
    { ord: 'atpSyntase', x: 640, y: 600, maal: [634, 414],
      omr: `<rect x="619" y="300" width="59" height="120" rx="18"/>`,
      fejl: { elektrontransportkaede: 'Rækken af proteiner sidder i en anden fold. Pladsen peger på proteinet med hoved og stilk, som H⁺ strømmer igennem.' } },
  ],
};
