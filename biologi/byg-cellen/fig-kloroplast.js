// Kloroplasten: én kloroplast skåret igennem og meget forstørret.
// Lag 1 er opbygningen, lag 2 er, hvor fotosyntesens to dele foregår.
import { kredsPil, ellipseSti, paaEllipse, boelge } from '../../byg-motor/tegn.js';

const r1 = (v) => Math.round(v * 10) / 10;

const C = { x: 500, y: 320 };
const YDRE = [290, 185];
const INDRE = [272, 167];
const ydre = ellipseSti(C.x, C.y, ...YDRE);
const indre = ellipseSti(C.x, C.y, ...INDRE);
const FARVE = { membran: '#2C7A30', stroma: '#E3F2CF', rum: '#C9E6AE', thyl: '#3E9A44', kant: '#1F5E24' };

// Grana: stakke af thylakoider. [x, y, antal]
const DISK = { b: 74, h: 11, trin: 13.5 };
const GRANA = [[350, 300, 5], [470, 215, 5], [480, 410, 6], [610, 320, 5]];
const diskY = ([, y, n], i) => y + (i - (n - 1) / 2) * DISK.trin;
const disk = (x, y) => `<rect x="${x - DISK.b / 2}" y="${r1(y - DISK.h / 2)}" width="${DISK.b}" height="${DISK.h}" rx="${DISK.h / 2}" fill="${FARVE.thyl}" stroke="${FARVE.kant}" stroke-width="1.6"/>`;
const stak = (g) => Array.from({ length: g[2] }, (_, i) => disk(g[0], diskY(g, i))).join('');
/** Rammen om en stak (til de gule felter). */
const stakRamme = ([x, y, n], luft = 8) => {
  const h = (n - 1) * DISK.trin + DISK.h + 2 * luft;
  return `<rect x="${x - DISK.b / 2 - luft}" y="${r1(y - h / 2)}" width="${DISK.b + 2 * luft}" height="${r1(h)}" rx="10"/>`;
};

// Enkelte lange thylakoider forbinder stakkene
const lameller = [[0, 1], [0, 2], [1, 3], [2, 3]].map(([a, b]) => {
  const [x1, y1] = GRANA[a], [x2, y2] = GRANA[b];
  const d = `M${x1 + DISK.b / 2 - 6} ${y1} C${(x1 + x2) / 2} ${y1} ${(x1 + x2) / 2} ${y2} ${x2 - DISK.b / 2 + 6} ${y2}`;
  return `<path d="${d}" fill="none" stroke="${FARVE.kant}" stroke-width="7" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="${FARVE.thyl}" stroke-width="3.6" stroke-linecap="round"/>`;
}).join('');

// Den thylakoid, pladsen peger på: den nederste i den tredje stak
const ENKELT = [GRANA[2][0], diskY(GRANA[2], GRANA[2][2] - 1)];

// Lyset: bølgede pile ude fra, der rammer stakkene
function lysPil(x1, y1, x2, y2) {
  const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, s = 16;
  const spids = [[x2, y2], [x2 - ux * s + uy * s * 0.6, y2 - uy * s - ux * s * 0.6], [x2 - ux * s - uy * s * 0.6, y2 - uy * s + ux * s * 0.6]];
  return `<path d="${boelge(x1, y1, x2 - ux * s * 0.8, y2 - uy * s * 0.8, 6, 4)}" fill="none" stroke="#E89B00" stroke-width="4.5" stroke-linecap="round"/>
    <polygon points="${spids.map((p) => p.map(r1).join(',')).join(' ')}" fill="#E89B00"/>`;
}
const lys = lysPil(820, 64, 606, 286) + lysPil(640, 40, 506, 186) + lysPil(236, 96, 318, 274);

const KREDS = { x: 720, y: 300, r: 40 };

export default {
  id: 'kloroplast',
  navn: 'Kloroplasten',
  intro: 'Én kloroplast skåret igennem og meget forstørret. Først dens opbygning, så hvor fotosyntesens to dele foregår.',
  vb: [1000, 640],
  lag: [
    { navn: 'Opbygningen', ord: ['ydreMembran', 'indreMembran', 'thylakoid', 'granum', 'stroma'], ekstra: ['cristae'],
      ekstraFejl: { cristae: 'Cristae er folderne i mitokondriens indre membran. Kloroplasten har i stedet flade sække af membran.' } },
    { navn: 'Hvor fotosyntesen sker', ord: ['lysreaktion', 'calvin'], ekstra: ['citronsyrecyklus'],
      ekstraFejl: { citronsyrecyklus: 'Citronsyrecyklussen hører til respirationen og kører i mitokondriens matrix. Kloroplasten har en anden cyklus, som bygger sukker op.' } },
  ],
  dele: [
    { ord: null, svg: `<path d="${ydre}" fill="${FARVE.rum}"/>` },
    { ord: 'stroma', svg: `<path d="${indre}" fill="${FARVE.stroma}"/>` },
    { ord: 'indreMembran', svg: `<path d="${indre}" fill="none" stroke="${FARVE.membran}" stroke-width="5"/>` },
    { ord: 'ydreMembran', svg: `<path d="${ydre}" fill="none" stroke="${FARVE.membran}" stroke-width="6"/>` },
    { ord: 'thylakoid', svg: lameller },
    { ord: 'granum', svg: GRANA.map(stak).join('') },
    { ord: 'thylakoid', svg: disk(...ENKELT) },          // den ene sæk oven på stakken, så den får farve for sig
    { ord: 'calvin', svg: kredsPil(KREDS.x, KREDS.y, KREDS.r, '#0E86C8', 7) },
    { ord: 'lysreaktion', svg: lys },
  ],
  pladser: [
    { ord: 'ydreMembran', x: 100, y: 200, maal: paaEllipse(C.x, C.y, ...YDRE, 205).map(r1),
      omr: `<path d="${ydre}" fill="none" stroke-width="16"/>`,
      fejl: { indreMembran: 'Den indre membran ligger lige inden for. Pladsen peger på den yderste hinde.' } },
    { ord: 'indreMembran', x: 100, y: 340, maal: paaEllipse(C.x, C.y, ...INDRE, 155).map(r1),
      omr: `<path d="${indre}" fill="none" stroke-width="16"/>`,
      fejl: { ydreMembran: 'Den yderste hinde ligger længere ude. Pladsen peger på hinden lige inden for den.' } },
    { ord: 'stroma', x: 100, y: 480, maal: [370, 425],
      omr: `<path d="${indre}"/>`,
      fejl: { thylakoid: 'De flade sække er membran. Prikken sidder i væsken uden om dem.',
              indreMembran: 'Pladsen peger på væsken inden for membranerne, ikke på en hinde.' } },
    { ord: 'granum', x: 470, y: 40, maal: [470, r1(diskY(GRANA[1], 0) - DISK.h / 2)],
      omr: stakRamme(GRANA[1]),
      fejl: { thylakoid: 'Pladsen spørger om hele stakken, ikke om én af de flade sække i den.' } },
    { ord: 'thylakoid', x: 480, y: 612, maal: [ENKELT[0], r1(ENKELT[1] + DISK.h / 2)],
      omr: `<rect x="${ENKELT[0] - DISK.b / 2 - 5}" y="${r1(ENKELT[1] - DISK.h / 2 - 5)}" width="${DISK.b + 10}" height="${DISK.h + 10}" rx="8"/>`,
      fejl: { granum: 'Pladsen peger på én enkelt flad sæk, ikke på hele stakken.',
              stroma: 'Væsken ligger uden om. Pladsen peger på en flad sæk af membran.' } },
    { ord: 'calvin', x: 900, y: 190, maal: [KREDS.x + KREDS.r, KREDS.y],
      omr: `<circle cx="${KREDS.x}" cy="${KREDS.y}" r="${KREDS.r + 16}"/>`,
      fejl: { lysreaktion: 'Lyset rammer stakkene af membran. Pladsen peger på kredsløbet ude i væsken, hvor CO₂ bliver bundet.' } },
    { ord: 'lysreaktion', x: 900, y: 470, maal: [648, 335],
      omr: GRANA.map((g) => stakRamme(g)).join(''),
      fejl: { calvin: 'Kredsløbet, der binder CO₂, kører ude i væsken. Pladsen peger på stakkene af membran, som lyset rammer.' } },
  ],
};
