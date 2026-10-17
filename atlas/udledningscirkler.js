// Klimaforandringer: landenes samlede CO₂-udledning siden 1850 som cirkler.
// Cirklens areal er proportionalt med udledningen, så store udledere ikke
// »fylder« efter landets areal, som på et farvet kort. Cirklen står midt i
// landets største landområde (data/landepunkter.json).
// Data: Global Carbon Budget 2025 via Our World in Data, summeret fra 1850
// i data/udledning.py (udledning.json, »kumuleret«). Laget er et punktlag og
// kan vises sammen med de farvede kort, fx pr. indbygger.

export const ORDEN = 1;
export const AFLAESNING = '#cirkelaflaesning';

let data = null, punkter = null, henter = null, tegnede = [];
export const valg = { felt: 'k', aar: 2023 };
export const FELTER = {
  k: 'CO₂ fra fossile brændsler og industri',
  kl: 'CO₂ inkl. skovrydning og anden arealanvendelse'
};

const hentJson = navn => fetch(new URL(`./data/${navn}`, import.meta.url), { signal: AbortSignal.timeout(15000) })
  .then(svar => { if (!svar.ok) throw new Error(`${navn} kunne ikke hentes`); return svar.json(); });

export function hent() {
  if (data && punkter) return Promise.resolve(data);
  henter ??= Promise.all([hentJson('udledning.json'), hentJson('landepunkter.json')]).then(([d, p]) => {
    const k = d?.kumuleret;
    if (!k?.lande?.['840']?.k || !Array.isArray(k.aar) || !p?.['208']) throw new Error('Udledningsdata er ugyldige');
    data = { ...k, navne: Object.fromEntries(Object.entries(d.lande).map(([id, l]) => [id, l.navn])) };
    punkter = p;
    return data;
  }).catch(fejl => { henter = null; throw fejl; });
  return henter;
}

export const aarliste = () => data?.aar ?? [1900, 1950, 1990, 2023];
const indeks = () => data.aar.indexOf(valg.aar);
export const verden = () => data.verden[valg.felt][indeks()];

// Radius i pixel: areal ∝ udledning; 500 Gt giver en cirkel med 16 % af klodens radius.
export const radius = (mt, skala) => skala * .16 * Math.sqrt(Math.max(0, mt) / 500000);

// Alle lande med tal for det valgte felt og år, størst først.
export function rangering() {
  if (!data) return [];
  const i = indeks();
  return Object.entries(data.lande)
    .map(([id, l]) => ({ id, navn: data.navne[id], v: l[valg.felt][i] }))
    .filter(r => r.v > 0)
    .sort((a, b) => b.v - a.v);
}

// Signaturen bruger skalaen til sine referencecirkler; den ændres ved zoom.
let lytter = null, sidsteSkala = 0;
export function lytTilSkala(fn) { lytter = fn; sidsteSkala = 0; }

export function tegn(ctx, { projektion, centrum, skala }) {
  if (!data) return;
  const d3 = window.d3;
  if (skala !== sidsteSkala) { sidsteSkala = skala; lytter?.(skala); }
  tegnede = [];
  ctx.save();
  // De største først, så små lande ligger øverst og kan ses.
  for (const r of rangering()) {
    const p = punkter[r.id];
    if (!p || d3.geoDistance(centrum, p) >= Math.PI / 2 - .02) continue;
    const [x, y] = projektion(p);
    const rad = Math.max(1.6, radius(r.v, skala));
    tegnede.push([r, x, y, rad]);
    ctx.beginPath(); ctx.arc(x, y, rad, 0, 2 * Math.PI);
    ctx.fillStyle = '#9e1b32a6'; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#fff9ee'; ctx.stroke();
  }
  ctx.restore();
}

export const gt = mt => {
  const g = mt / 1000;
  const d = g >= 10 ? 0 : g >= 1 ? 1 : 2;
  return `${g.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d })} mia. t`;
};
export const andel = mt => {
  const p = 100 * mt / verden();
  return `${p.toLocaleString('da-DK', { maximumFractionDigits: p < 1 ? 1 : 0 })} %`;
};
export const beskriv = r => `${r.navn}: ${gt(r.v)} CO₂ ${data.fra}–${valg.aar} · ${andel(r.v)} af verdens`;

// Den mindste cirkel, der rammer skærmpunktet (små lande ligger oven på store).
export function aflaes([x, y]) {
  let bedst = null;
  for (const [r, cx, cy, rad] of tegnede) {
    if (Math.hypot(cx - x, cy - y) <= Math.max(rad, 6) && (!bedst || rad < bedst[1])) bedst = [r, rad];
  }
  return bedst ? beskriv(bedst[0]) : 'ingen cirkel lige her';
}
