/* boelger.js — bølgerne på vej ind mod stranden.
   Ind over den lave havbund mærker bølgen bunden: den bliver kortere og
   højere, og når den er blevet for høj i forhold til vanddybden, bryder
   den. Bagefter løber den som en brænding ind til kystlinjen, hvor
   opskyllet tager over (opskyl.js). */

import { G } from './model.js';
import { XS, HAV_Y, HC, px, py, dybde } from './strand.js';

// Airys spredningsrelation, løst ved gentagelse
function laengdePaaDybde(T, d){
  const L0 = G * T * T / (2 * Math.PI);
  if (d >= 0.5 * L0) return L0;
  let L = L0 * Math.sqrt(Math.tanh(2 * Math.PI * d / L0));
  for (let i = 0; i < 14; i++) L = L0 * Math.tanh(2 * Math.PI * d / L);
  return L;
}

// Brydningskriteriet: bliver bølgen højere end 78 % af vanddybden, bryder den.
const BRYD = 0.78;
const N = 400;

export function profil(H0, T, ud = { punkter: [] }){
  const L0 = G * T * T / (2 * Math.PI);
  const dx = XS / N;
  const p = ud.punkter; p.length = 0;
  let brudt = false, Hb = 0, KsB = 1, fase = 0, xBryd = null;

  for (let i = 0; i <= N; i++){
    const x = i * dx;
    const d = Math.max(0.04, dybde(x));
    const L = laengdePaaDybde(T, d);
    const kd = 2 * Math.PI * d / L;
    const n  = 0.5 * (1 + 2 * kd / Math.sinh(Math.min(2 * kd, 30)));
    const Ks = Math.sqrt(0.5 * L0 / (n * L));      // shoaling

    let H = brudt ? Hb * Ks / KsB : H0 * Ks;
    const bryder = H > BRYD * d;
    if (bryder){
      if (!brudt) xBryd = x;
      H = BRYD * d; brudt = true;
    }
    if (brudt){ Hb = H; KsB = Ks; }
    if (i > 0) fase += 2 * Math.PI * dx / L;
    p.push({ x, d, H, fase, bryder });
  }
  ud.xBryd = xBryd;
  ud.faseKyst = fase;
  return ud;
}

// Overfladen. Andenharmoniske led gør toppene spidse og bølgedalene
// flade, sådan som en bølge på lavt vand ser ud.
function eta(p, Th){
  const th = p.fase - Th;
  const a  = p.H / 2;
  const s  = Math.min(0.22, 0.35 * p.H / Math.max(p.d, 0.2));
  return a * Math.cos(th) + a * s * Math.cos(2 * th);
}

export function tegnVand(c, pr, Th){
  const p = pr.punkter;
  const flade = () => {
    c.moveTo(0, py(eta(p[0], Th)));
    for (let i = 1; i < p.length; i++) c.lineTo(px(p[i].x), py(eta(p[i], Th)));
  };
  c.beginPath(); flade();
  c.lineTo(px(XS) + 2, HAV_Y); c.lineTo(px(XS) + 2, HC); c.lineTo(0, HC); c.closePath();
  const g = c.createLinearGradient(0, HAV_Y - 40, 0, HC);
  g.addColorStop(0, '#7FCBEC');
  g.addColorStop(0.35, '#3EA5DA');
  g.addColorStop(1, '#12628F');
  c.fillStyle = g; c.fill();

  c.lineWidth = 2.2; c.strokeStyle = '#17211F';
  c.beginPath(); flade(); c.stroke();
}

// Skum ned ad forsiden af de bølger, der er brudt.
export function tegnBrydning(c, pr, Th){
  const p = pr.punkter;
  const stier = [];
  let sti = null;
  for (let i = 0; i < p.length; i++){
    const th = ((p[i].fase - Th) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    if (p[i].bryder && p[i].H > 0.08 && (th < 1.1 || th > 2 * Math.PI - 0.4)){
      if (!sti){ sti = []; stier.push(sti); }
      sti.push([px(p[i].x), py(eta(p[i], Th)) - 1]);
    } else sti = null;
  }
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const s of stier){
    if (s.length < 2) continue;
    c.beginPath();
    c.moveTo(s[0][0], s[0][1]);
    for (const q of s) c.lineTo(q[0], q[1]);
    c.lineWidth = 9; c.strokeStyle = 'rgba(23,33,31,.30)'; c.stroke();
    c.lineWidth = 6; c.strokeStyle = '#FFFFFF'; c.stroke();
  }
  c.restore();
}
