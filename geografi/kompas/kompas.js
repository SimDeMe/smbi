/* ═══════════════════════════════════════════════════════════
   kompas.js — et pladekompas (Suunto-typen), set oppefra.

   Tre ting kan dreje, og de ligger i hver sin vinkel. Alle
   vinkler er grader fra nord med uret, målt i kortets retning:

     B    grundpladen = kursepilen, altså den vej man går
     H    kompashuset: det tal på gradskiven, der står ud for
          indekset. Gradskivens N (og orienteringspilen) peger
          derfor i retningen  B − H.
     φ    magnetnålen. Den søger mod magnetisk nord (0°, da
          misvisningen er sat til 0°) og svinger lidt, før den
          falder til ro — dæmpet af væsken i huset.

   Nålen ligger i orienteringspilen («rød i hus»), når B − H = 0,
   dvs. når man går i præcis den kurs, huset er stillet på.
   ═══════════════════════════════════════════════════════════ */
import {forskel, rundRect} from './landskab.js';

const INK = '#17211F', ROED = '#E8336D';
const RAD = Math.PI / 180;

/* mål i px, i grundpladens eget system (−y er fremad) */
export const R_SKIVE = 84;          // gradskivens yderkant
const R_INDRE = 62;                 // gradskivens inderkant
const R_KAPSEL = 60;
const PLADE = {x0:-86, x1:86, y0:-204, y1:92, r:16};

export const TOL_I_HUS = 3;         // så tæt skal nålen ligge for at tælle som «i hus»

/* Nålens afvigelse fra orienteringspilen, når den står stille.
   Positiv: man peger for langt med uret og skal dreje til venstre. */
export function afvigelse(t){ return forskel(t.B, t.H); }

export function nyNaal(){ return {phi:0, v:0, husVinkel:null}; }

/* Nålen som et dæmpet pendul. Væsken i kapslen slæber lidt i
   nålen, når huset drejer — derfor svinger den, når man drejer sig. */
const K = 70, C = 10;
export function opdaterNaal(n, t, dt, stille){
  const A = t.B - t.H;
  if (stille || n.husVinkel === null){ n.phi = 0; n.v = 0; n.husVinkel = A; return; }
  let omega = forskel(A, n.husVinkel) / Math.max(dt, 1e-3);
  omega = Math.max(-720, Math.min(720, omega));
  n.husVinkel = A;
  const skridt = 4, h = dt / skridt;
  for (let i = 0; i < skridt; i++){
    const acc = -K * forskel(n.phi, 0) - C * (n.v - omega * 0.35);
    n.v += acc * h;
    n.phi += n.v * h;
  }
  n.phi = forskel(n.phi, 0);
}

/* Hvor rammer et klik? 'hus' i gradskiven, ellers 'plade'/null. */
export function ramt(x, y, cx, cy, t){
  const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
  if (r <= R_SKIVE + 6) return 'hus';
  const a = -t.B * RAD;                         // tilbage til pladens system
  const lx = dx * Math.cos(a) - dy * Math.sin(a);
  const ly = dx * Math.sin(a) + dy * Math.cos(a);
  if (lx >= PLADE.x0 && lx <= PLADE.x1 && ly >= PLADE.y0 && ly <= PLADE.y1) return 'plade';
  return null;
}

/* ── Tegning ─────────────────────────────────────────── */

function pladeSti(ctx){ rundRect(ctx, PLADE.x0, PLADE.y0, PLADE.x1 - PLADE.x0, PLADE.y1 - PLADE.y0, PLADE.r); }

/* Sigtelinjen: kursepilens forlængelse ud over kortet */
export function tegnSigtelinje(ctx, cx, cy, t, W, H){
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t.B * RAD);
  ctx.setLineDash([10, 7]);
  ctx.strokeStyle = 'rgba(14,134,200,.9)';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, PLADE.y0); ctx.lineTo(0, -Math.hypot(W, H)); ctx.stroke();
  ctx.restore();
}

export function tegnKompas(ctx, cx, cy, t, naal, o = {}){
  const A = t.B - t.H;
  const iHus = Math.abs(afvigelse(t)) <= TOL_I_HUS;

  // hård skygge under pladen
  ctx.save();
  ctx.translate(cx + 6, cy + 6); ctx.rotate(t.B * RAD);
  pladeSti(ctx); ctx.fillStyle = 'rgba(23,33,31,.28)'; ctx.fill();
  ctx.restore();

  /* ── grundpladen ── */
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(t.B * RAD);
  pladeSti(ctx);
  ctx.fillStyle = 'rgba(231,244,251,.74)'; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.stroke();

  // linealer langs kanterne (1 mm = 2 px)
  ctx.strokeStyle = 'rgba(23,33,31,.7)'; ctx.lineWidth = 1;
  for (let i = 0, y = PLADE.y1 - 14; y > PLADE.y0 + 12; y -= 4, i++){
    const l = i % 5 === 0 ? 9 : 5;
    ctx.beginPath();
    ctx.moveTo(PLADE.x0, y); ctx.lineTo(PLADE.x0 + l, y);
    ctx.moveTo(PLADE.x1, y); ctx.lineTo(PLADE.x1 - l, y);
    ctx.stroke();
  }

  // kursepilen
  ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -R_SKIVE - 12); ctx.lineTo(0, -162); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -198); ctx.lineTo(17, -158); ctx.lineTo(0, -166); ctx.lineTo(-17, -158); ctx.closePath();
  ctx.fillStyle = INK; ctx.fill();
  // tværstreger langs sigtelinjen
  ctx.lineWidth = 1.2;
  for (let y = -R_SKIVE - 22; y > -150; y -= 12){
    ctx.beginPath(); ctx.moveTo(-5, y); ctx.lineTo(5, y); ctx.stroke();
  }
  // indeks, hvor kursen aflæses — og et bagindeks
  ctx.beginPath(); ctx.moveTo(0, -R_SKIVE - 1); ctx.lineTo(-7, -R_SKIVE - 12); ctx.lineTo(7, -R_SKIVE - 12); ctx.closePath();
  ctx.fillStyle = o.fremhaevIndeks ? '#FFB300' : '#FFFFFF'; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, R_SKIVE + 1); ctx.lineTo(-5, R_SKIVE + 8); ctx.lineTo(5, R_SKIVE + 8); ctx.closePath();
  ctx.fillStyle = INK; ctx.fill();
  ctx.restore();

  /* ── kompashuset: gradskive, kapsel, nordlinjer, orienteringspil ── */
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(A * RAD);

  // gradskiven — mørk ring med lyse streger som på et rigtigt kompas
  ctx.beginPath(); ctx.arc(0, 0, R_SKIVE, 0, Math.PI * 2); ctx.arc(0, 0, R_INDRE, 0, Math.PI * 2, true);
  ctx.fillStyle = INK; ctx.fill('evenodd');
  if (o.hint){
    ctx.beginPath(); ctx.arc(0, 0, R_SKIVE + 7 + 3 * o.hint, 0, Math.PI * 2);
    ctx.setLineDash([6, 5]); ctx.strokeStyle = `rgba(23,33,31,${0.35 + 0.5 * o.hint})`;
    ctx.lineWidth = 2.5; ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.strokeStyle = '#FFF6E0';
  for (let g = 0; g < 360; g += 2){
    const l = g % 10 === 0 ? 7 : 3.5;
    ctx.lineWidth = g % 10 === 0 ? 1.6 : 1;
    const s = Math.sin(g * RAD), c = -Math.cos(g * RAD);
    ctx.beginPath(); ctx.moveTo(s * (R_SKIVE - 1), c * (R_SKIVE - 1)); ctx.lineTo(s * (R_SKIVE - 1 - l), c * (R_SKIVE - 1 - l)); ctx.stroke();
  }
  ctx.fillStyle = '#FFF6E0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const BOGST = {0:'N', 90:'Ø', 180:'S', 270:'V'};
  // tal for hver 30°, bogstaver på verdenshjørnerne
  for (let g = 0; g < 360; g += 30){
    ctx.save();
    ctx.rotate(g * RAD);
    ctx.translate(0, -(R_INDRE + 9.5));
    if (BOGST[g] !== undefined){ ctx.font = "800 12px 'Archivo', system-ui, sans-serif"; ctx.fillStyle = g === 0 ? '#FF7FA3' : '#FFF6E0'; }
    else { ctx.font = "600 9px 'IBM Plex Mono', monospace"; ctx.fillStyle = '#FFF6E0'; }
    ctx.fillText(BOGST[g] || String(g), 0, 0);
    ctx.restore();
  }
  ctx.textBaseline = 'alphabetic';

  // kapslen med væske
  ctx.beginPath(); ctx.arc(0, 0, R_KAPSEL, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();

  // nordlinjer (meridianlinjer) parallelt med orienteringspilen
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, R_KAPSEL - 1, 0, Math.PI * 2); ctx.clip();
  ctx.strokeStyle = 'rgba(232,51,109,.55)'; ctx.lineWidth = 1.3;
  for (const x of [-45, -32, 32, 45]){
    ctx.beginPath(); ctx.moveTo(x, -R_KAPSEL); ctx.lineTo(x, R_KAPSEL); ctx.stroke();
  }
  ctx.restore();

  // orienteringspilen — «huset», nålen skal ind i
  ctx.beginPath();
  ctx.moveTo(0, -54); ctx.lineTo(17, -24); ctx.lineTo(8, -24); ctx.lineTo(8, 40);
  ctx.lineTo(-8, 40); ctx.lineTo(-8, -24); ctx.lineTo(-17, -24); ctx.closePath();
  ctx.fillStyle = iHus ? 'rgba(95,176,48,.35)' : 'rgba(232,51,109,.13)'; ctx.fill();
  ctx.strokeStyle = iHus ? '#2F6E1C' : ROED; ctx.lineWidth = 2.2;
  ctx.setLineDash(iHus ? [] : [5, 3]); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();

  /* ── magnetnålen — i kortets retning, ikke husets ── */
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(naal.phi * RAD);
  ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(6.5, 0); ctx.lineTo(-6.5, 0); ctx.closePath();
  ctx.fillStyle = ROED; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 48); ctx.lineTo(6.5, 0); ctx.lineTo(-6.5, 0); ctx.closePath();
  ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, Math.PI * 2); ctx.fillStyle = '#FFF6E0'; ctx.fill();
  ctx.restore();

  if (o.navne) tegnNavne(ctx, cx, cy, t, naal);
}

/* ── Navne på delene ─────────────────────────────────────
   Hvert navn har et ankerpunkt på delen (i delens eget system)
   og en plads ude ved siden af pladen. Teksten står altid lige. */
const NAVNE = [
  {txt:'Kursepil',          sys:'plade', a:[0,-176],  p:[128,-176]},
  {txt:'Indeks · aflæs her', sys:'plade', a:[5,-R_SKIVE - 7], p:[150,-112]},
  {txt:'Grundplade',        sys:'plade', a:[-80,-140], p:[-150,-150]},
  {txt:'Kompashus · gradskive', sys:'plade', a:[-66,-44], p:[-170,-70]},
  {txt:'Nordlinjer',        sys:'hus',   a:[-45,30],   p:[-150,40]},
  {txt:'Orienteringspil',   sys:'hus',   a:[8,24],     p:[160,50]},
  {txt:'Magnetnål',         sys:'naal',  a:[0,-34],    p:[150,-40]},
];

function rot(p, grader){
  const a = grader * RAD, c = Math.cos(a), s = Math.sin(a);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
}

function tegnNavne(ctx, cx, cy, t, naal){
  const vinkel = {plade:t.B, hus:t.B - t.H, naal:naal.phi};
  ctx.save();
  ctx.font = "600 10px 'IBM Plex Mono', monospace";
  ctx.textAlign = 'center';
  for (const n of NAVNE){
    const a = rot(n.a, vinkel[n.sys]);
    const p = rot(n.p, t.B);
    const ax = cx + a[0], ay = cy + a[1], px = cx + p[0], py = cy + p[1];
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(px, py); ctx.stroke();
    ctx.beginPath(); ctx.arc(ax, ay, 3, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
    const txt = n.txt.toUpperCase();
    const w = ctx.measureText(txt).width + 14;
    rundRect(ctx, px - w / 2 + 2, py - 7, w, 17, 8.5); ctx.fillStyle = INK; ctx.fill();
    rundRect(ctx, px - w / 2, py - 9, w, 17, 8.5); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = INK; ctx.fillText(txt, px, py + 3);
  }
  ctx.restore();
}
