// Klimaforandringer: havniveauets stigning ved kysterne målt med vandstandsmålere.
// PSMSL Revised Local Reference (Holgate m.fl. 2013): tendensen 1960–2024 i
// mm pr. år for stationer med mindst 40 års data. Dannes af data/havniveau.py;
// se data/havniveau.LICENSE.
//
// Tallene er relative til land: Hvor landet hæver sig efter istiden
// (Skandinavien, Alaska), falder havet; hvor landet synker, stiger det ekstra.

import { farver, klasser, klasseFor } from './temakort.js';

export const ORDEN = 3;
export const AFLAESNING = '#havniveauaflaesning';

// Lilla: havet falder i forhold til land; orange: havet stiger.
export const SKALA = { graenser: [-5, -2, 0, 2, 4, 6], nul: 3, decimaler: 1, id: 'havniveau' };
SKALA.farver = farver(SKALA);
export const klasseliste = () => klasser(SKALA);

let data = null, henter = null, tegnede = [];
export const hentede = () => data;

export function hent() {
  if (data) return Promise.resolve(data);
  henter ??= fetch(new URL('./data/havniveau.json', import.meta.url), { signal: AbortSignal.timeout(15000) })
    .then(svar => { if (!svar.ok) throw new Error('Havniveaudata kunne ikke indlæses'); return svar.json(); })
    .then(d => {
      const s = d?.stationer;
      if (!Array.isArray(s) || s.length < 100 || s.some(x => !Number.isFinite(x.mm) || !Array.isArray(x.punkt))) throw new Error('Havniveaudata er ugyldige');
      data = d;
      return d;
    })
    .catch(fejl => { henter = null; throw fejl; });
  return henter;
}

export const farve = mm => SKALA.farver[klasseFor(SKALA, mm)];
export function optaelling() {
  const antal = SKALA.farver.map(() => 0);
  for (const s of data.stationer) antal[klasseFor(SKALA, s.mm)]++;
  return antal;
}
export function median() {
  const v = data.stationer.map(s => s.mm).sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
}
export const mmTekst = mm => `${mm > 0 ? '+' : mm < 0 ? '−' : ''}${Math.abs(mm).toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mm/år`;
export const beskriv = s => `${s.navn}: ${mmTekst(s.mm)} ${s.fra}–${s.til} (${s.n} år med data)`;

// Kaldes med den aflæste station (eller null), fx til en lille graf.
let lytter = null;
export function lytTil(fn) { lytter = fn; }

export function tegn(ctx, { projektion, centrum, skala }) {
  if (!data) return;
  const d3 = window.d3;
  const r = Math.max(3.2, Math.min(6, skala / 55));
  tegnede = [];
  ctx.save();
  for (const s of data.stationer) {
    if (d3.geoDistance(centrum, s.punkt) >= Math.PI / 2 - .01) continue;
    const [x, y] = projektion(s.punkt);
    tegnede.push([s, x, y]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = farve(s.mm); ctx.fill();
    ctx.lineWidth = 1.1; ctx.strokeStyle = '#17211f'; ctx.stroke();
  }
  ctx.restore();
}

// Nærmeste tegnede station inden for få pixel af skærmpunktet.
export function aflaes([x, y]) {
  let bedst = null, afstand = 12;
  for (const [s, sx, sy] of tegnede) {
    const a = Math.hypot(sx - x, sy - y);
    if (a < afstand) { bedst = s; afstand = a; }
  }
  lytter?.(bedst);
  return bedst ? beskriv(bedst) : 'ingen målestation lige her';
}
