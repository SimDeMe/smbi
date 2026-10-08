/* graf.js — udviklingen over tid: reserven og det udvundne øverst,
   R/P-forholdet nederst. År med mangel får en skraveret bjælke. */

import { AAR_MAKS } from './model.js';

const INK = '#17211F', SLATE = '#566B68';
const MONO = "'IBM Plex Mono', monospace";
const DISPLAY = "'Archivo', system-ui, sans-serif";

const X0 = 470, X1 = 780;
export const OEVERST = { y0: 44, y1: 164 };
export const NEDERST = { y0: 214, y1: 334 };

const xAf = aar => X0 + (X1 - X0) * aar / AAR_MAKS;

function paenMaks(v, min){
  const m = Math.max(v, min);
  const trin = [1, 2, 2.5, 5, 10];
  const p = Math.pow(10, Math.floor(Math.log10(m)));
  for (const t of trin) if (t * p >= m) return t * p;
  return 10 * p;
}

function akse(c, felt, maks, titel, enhed){
  const { y0, y1 } = felt;
  c.fillStyle = '#fff';
  c.fillRect(X0, y0, X1 - X0, y1 - y0);

  c.font = `600 9px ${MONO}`;
  c.fillStyle = SLATE;
  c.strokeStyle = 'rgba(23,33,31,.13)'; c.lineWidth = 1;
  c.textAlign = 'right';
  for (let k = 0; k <= 4; k++){
    const v = maks * k / 4, y = y1 - (y1 - y0) * k / 4;
    if (k > 0){ c.beginPath(); c.moveTo(X0, y); c.lineTo(X1, y); c.stroke(); }
    c.fillText(v.toLocaleString('da-DK'), X0 - 5, y + 3);
  }
  c.textAlign = 'center';
  for (let aar = 0; aar <= AAR_MAKS; aar += 20){
    c.fillText(String(aar), xAf(aar), y1 + 12);
  }
  c.strokeStyle = INK; c.lineWidth = 2;
  c.strokeRect(X0, y0, X1 - X0, y1 - y0);

  c.textAlign = 'left'; c.fillStyle = INK;
  c.font = `700 12px ${DISPLAY}`;
  c.fillText(titel, X0, y0 - 9);
  const w = c.measureText(titel).width;
  c.font = `600 9px ${MONO}`; c.fillStyle = SLATE;
  c.fillText(enhed, X0 + w + 7, y0 - 9);
}

function linje(c, felt, maks, punkter, hent, farve, stiplet){
  const { y0, y1 } = felt;
  c.save();
  c.beginPath(); c.rect(X0, y0, X1 - X0, y1 - y0); c.clip();
  c.strokeStyle = farve; c.lineWidth = 2.5; c.lineJoin = 'round';
  if (stiplet) c.setLineDash([6, 4]);
  c.beginPath();
  punkter.forEach((p, i) => {
    const v = Math.min(hent(p), maks * 1.05);
    const x = xAf(p.aar), y = y1 - (y1 - y0) * v / maks;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  });
  c.stroke();
  c.restore();
}

export function tegn(c, historik, nu){
  const punkter = historik.length ? historik : [{ aar: 0, reserve: nu.reserve, udvundet: 0, rp: nu.rp, mangel: nu.mangel }];

  // øverst: reserve (fuld) og udvundet i alt (stiplet)
  const maks1 = paenMaks(Math.max(...punkter.map(p => Math.max(p.reserve, p.udvundet))), 1500);
  akse(c, OEVERST, maks1, 'Reserve og udvundet', 'mio. t');
  linje(c, OEVERST, maks1, punkter, p => p.udvundet, '#8C9C99', true);
  linje(c, OEVERST, maks1, punkter, p => p.reserve, '#0E86C8', false);

  // nederst: R/P-forholdet
  const rp = p => isFinite(p.rp) ? p.rp : 0;
  const maks2 = paenMaks(Math.max(...punkter.map(rp)), 60);
  akse(c, NEDERST, maks2, 'R/P-forhold', 'år');

  // mangel: skraveret bjælke langs bunden
  const { y1 } = NEDERST;
  c.save();
  c.fillStyle = 'rgba(255,106,61,.85)';
  for (const p of punkter){
    if (p.mangel > 0.05 && p.aar > 0){
      c.fillRect(xAf(p.aar - 1), y1 - 9, Math.max(1.5, xAf(1) - X0), 8);
    }
  }
  c.restore();
  linje(c, NEDERST, maks2, punkter, rp, INK, false);

  // signatur, til højre på den øverste grafs titellinje
  c.font = `600 9px ${MONO}`; c.textAlign = 'left';
  const mangel = punkter.some(p => p.mangel > 0.05 && p.aar > 0);
  const ly = OEVERST.y0 - 12;
  let lx = X1 - 146;
  c.strokeStyle = '#0E86C8'; c.lineWidth = 2.5;
  c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + 14, ly); c.stroke();
  c.fillStyle = INK; c.fillText('RESERVE', lx + 18, ly + 3);
  lx += 64;
  c.strokeStyle = '#8C9C99'; c.setLineDash([5, 3]);
  c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + 14, ly); c.stroke();
  c.setLineDash([]);
  c.fillText('UDVUNDET', lx + 18, ly + 3);
  if (mangel){
    lx = X1 - 62;
    const my = NEDERST.y0 - 12;
    c.fillStyle = 'rgba(255,106,61,.85)';
    c.fillRect(lx, my - 4, 12, 8);
    c.fillStyle = INK; c.fillText('MANGEL', lx + 16, my + 3);
  }

  c.fillStyle = SLATE; c.textAlign = 'center';
  c.fillText('ÅR FRA NU', (X0 + X1) / 2, NEDERST.y1 + 26);

  // markør for nu
  const xn = xAf(nu.aar);
  c.strokeStyle = 'rgba(23,33,31,.5)'; c.lineWidth = 1.5; c.setLineDash([3, 3]);
  for (const f of [OEVERST, NEDERST]){
    c.beginPath(); c.moveTo(xn, f.y0); c.lineTo(xn, f.y1); c.stroke();
  }
  c.setLineDash([]);

  if (historik.length <= 1){
    c.fillStyle = SLATE; c.font = `600 10px ${MONO}`; c.textAlign = 'center';
    c.fillText('TRYK ▶ KØR TIDEN', (X0 + X1) / 2 + 20, (OEVERST.y0 + OEVERST.y1) / 2 + 4);
  }
}
