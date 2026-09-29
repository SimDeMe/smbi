/* landskab.js — landskabet oven på transformforkastningen: veje, huse,
   træer og biler. Det er pynt, men det viser pointen: alt, der står på
   jorden, flytter sig med jorden. Mellem jordskælvene bøjes det blødt,
   ved et jordskælv springer det, og huse tæt på forkastningen får revner.

   Koordinater i km: x på tværs af forkastningen (vest < 0 < øst),
   y langs den mod nord. Hvor meget et punkt er flyttet mod nord, giver
   transform.js som funktionen ny(x) (km, allerede overdrevet). */

// Fast tilfældighed, så landskabet ser ens ud hver gang
function rng(frø){ return () => ((frø = (frø * 16807) % 2147483647) - 1) / 2147483646; }
const r = rng(1906);

export const VEJE = [20, 60, 88];           // km mod nord
export const BREDDE = 60;                   // km til hver side af forkastningen

const MUR = ['#FBF1DC', '#FFFFFF', '#F2C9B0', '#DCE8F2', '#F6DFA0'];
const TAG = ['#C2412D', '#8E3B2F', '#4F5B66', '#B5651D', '#A33A5B'];
const BIL = ['#E8336D', '#0E86C8', '#FFB300', '#5FB030', '#FFFFFF', '#7A4FD6', '#FF6A3D'];

// Huse langs vejene, flest tæt på forkastningen — der ligger byen
export const HUSE = [];
for (const v of VEJE){
  for (let i = 0; i < 14; i++){
    const side = i % 2 ? 1 : -1;
    const x = side * (2.5 + Math.pow(r(), 1.6) * 50);
    const y = v + (r() < 0.5 ? -1 : 1) * (2.6 + r() * 1.8);
    HUSE.push({ x, y, mur: MUR[Math.floor(r() * MUR.length)], tag: TAG[Math.floor(r() * TAG.length)],
                h: 9 + r() * 7, s: 1.3 + r() * 0.7, saarbar: r() });
  }
}
// Træer: ikke oven i veje og huse
export const TRAEER = [];
while (TRAEER.length < 110){
  const x = (r() * 2 - 1) * (BREDDE - 2), y = -30 + r() * 160;
  if (Math.abs(x) < 1.5) continue;
  if (VEJE.some(v => Math.abs(y - v) < 2.2)) continue;
  if (HUSE.some(h => Math.hypot(h.x - x, h.y - y) < 2.4)) continue;
  TRAEER.push({ x, y, str: 0.8 + r() * 0.6, tone: r() });
}
// Græstotter til kortet
export const TOTTER = Array.from({ length: 260 }, () => ({ x: (r() * 2 - 1) * BREDDE, y: -30 + r() * 160, tone: r() }));

// Biler: to vognbaner pr. vej
export const BILER = [];
for (let v = 0; v < VEJE.length; v++){
  for (let i = 0; i < 5; i++){
    BILER.push({ vej: v, x: (r() * 2 - 1) * BREDDE, ret: i % 2 ? 1 : -1, fart: 3.5 + r() * 3,
                 farve: BIL[Math.floor(r() * BIL.length)] });
  }
}
export const bane = b => VEJE[b.vej] + (b.ret > 0 ? -0.8 : 0.8);

/* Bilerne kører. Er vejen brudt ved forkastningen, vender de om, når
   de når bruddet; ellers kører de over. Ved kanten vender de også. */
export function koer(dt, brudt){
  const K = 1.4;                            // km fra forkastningen, hvor de vender
  for (const b of BILER){
    const ny = b.x + b.ret * b.fart * dt;
    if (brudt && b.ret > 0 && b.x <= -K && ny > -K){ b.x = -K; b.ret = -1; continue; }
    if (brudt && b.ret < 0 && b.x >= K && ny < K){ b.x = K; b.ret = 1; continue; }
    b.x = ny;
    if (Math.abs(b.x) > BREDDE - 1){ b.x = Math.sign(b.x) * (BREDDE - 1); b.ret = -b.ret; }
  }
}

// Hus tæt på forkastningen får revner, når der har været et jordskælv
export const skadet = (hus, antalSkaelv) => antalSkaelv > 0 && Math.abs(hus.x) < 4 + 6 * hus.saarbar * Math.min(1, antalSkaelv / 2);

// ── I blokdiagrammet ───────────────────────────────────
/* P(x, y, z) → [u, v] på skærmen. løft = px op ad skærmen. */
export function hus3D(c, P, hus, x, y, skade, ryst){
  const s = hus.s, h = hus.h;
  const op = ([u, v], d) => [u + ryst, v - d];
  const a = P(x - s, y - s, 0), b = P(x + s, y - s, 0), cc = P(x + s, y + s, 0), d = P(x - s, y + s, 0);
  const rv = P(x - s, y, 0), rh = P(x + s, y, 0);
  const tagH = h + 6 + (skade ? -2 : 0);
  const quad = (pkt, farve) => {
    c.beginPath(); pkt.forEach(([u, v], i) => i ? c.lineTo(u, v) : c.moveTo(u, v)); c.closePath();
    c.fillStyle = farve; c.fill(); c.stroke();
  };
  c.save(); c.strokeStyle = '#17211F'; c.lineWidth = 1; c.lineJoin = 'round';
  // skygge
  c.fillStyle = 'rgba(23,33,31,.18)';
  c.beginPath(); [b, cc, P(x + s + 1.6, y + s, 0), P(x + s + 1.6, y - s, 0)].forEach(([u, v], i) => i ? c.lineTo(u, v) : c.moveTo(u, v)); c.fill();
  // tagets bagside, vægge, gavl og forside
  quad([op(d, h), op(cc, h), op(rh, tagH), op(rv, tagH)], shade(hus.tag, -0.25));
  quad([a, b, op(b, h), op(a, h)], hus.mur);
  quad([b, cc, op(cc, h), op(b, h)], shade(hus.mur, -0.18));
  quad([op(b, h), op(cc, h), op(rh, tagH)], shade(hus.mur, -0.1));
  quad([op(a, h), op(b, h), op(rh, tagH), op(rv, tagH)], hus.tag);
  // vindue og dør
  const m = t => [a[0] + (b[0] - a[0]) * t + ryst, a[1] + (b[1] - a[1]) * t];
  c.fillStyle = '#5E7A8C';
  const [wu, wv] = m(0.25); c.fillRect(wu, wv - h * 0.7, 2.5, 2.5);
  const [du, dv] = m(0.62); c.fillStyle = '#6B4A33'; c.fillRect(du, dv - h * 0.55, 2.4, h * 0.55);
  // revne
  if (skade){
    c.strokeStyle = '#17211F'; c.lineWidth = 1.3;
    const [cu, cv] = m(0.45);
    c.beginPath(); c.moveTo(cu, cv - h); c.lineTo(cu + 1.5, cv - h * 0.6); c.lineTo(cu - 1, cv - h * 0.35); c.lineTo(cu + 1, cv); c.stroke();
  }
  c.restore();
}

export function trae3D(c, P, t, x, y, ryst){
  const [u, v] = P(x, y, 0), k = 5 * t.str;
  c.save();
  c.fillStyle = 'rgba(23,33,31,.16)';
  c.beginPath(); c.ellipse(u + 3, v, k, k * 0.45, 0, 0, 2 * Math.PI); c.fill();
  c.strokeStyle = '#5A3E2A'; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(u, v); c.lineTo(u + ryst * 0.5, v - k * 1.2); c.stroke();
  c.fillStyle = t.tone < 0.5 ? '#4E9A3A' : '#3E8A45'; c.strokeStyle = '#17211F'; c.lineWidth = 1;
  c.beginPath(); c.arc(u + ryst, v - k * 1.7, k, 0, 2 * Math.PI); c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.22)';
  c.beginPath(); c.arc(u + ryst - k * 0.3, v - k * 2, k * 0.45, 0, 2 * Math.PI); c.fill();
  c.restore();
}

export function bil3D(c, P, b, x, y){
  const l = 1.5, w = 0.6;
  const a = P(x - l, y - w, 0), bb = P(x + l, y - w, 0), cc = P(x + l, y + w, 0), d = P(x - l, y + w, 0);
  const op = ([u, v], h) => [u, v - h];
  c.save(); c.strokeStyle = '#17211F'; c.lineWidth = 0.9; c.lineJoin = 'round';
  const quad = (pkt, farve) => { c.beginPath(); pkt.forEach(([u, v], i) => i ? c.lineTo(u, v) : c.moveTo(u, v)); c.closePath(); c.fillStyle = farve; c.fill(); c.stroke(); };
  quad([a, bb, op(bb, 4), op(a, 4)], shade(b.farve, -0.2));
  quad([op(a, 4), op(bb, 4), op(cc, 4), op(d, 4)], b.farve);
  // forrude
  const f = b.ret > 0 ? [op(bb, 4), op(cc, 4)] : [op(a, 4), op(d, 4)];
  c.strokeStyle = '#BFE3F5'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(f[0][0] - b.ret * 1.5, f[0][1]); c.lineTo(f[1][0] - b.ret * 1.5, f[1][1]); c.stroke();
  c.restore();
}

// ── På kortet ──────────────────────────────────────────
export function hus2D(c, u, v, hus, skade, ryst){
  const s = hus.s * 2.4;
  c.save();
  c.fillStyle = 'rgba(23,33,31,.2)'; c.fillRect(u - s + 2 + ryst, v - s + 2, 2 * s, 2 * s);
  c.fillStyle = hus.tag; c.strokeStyle = '#17211F'; c.lineWidth = 1;
  c.fillRect(u - s + ryst, v - s, 2 * s, 2 * s); c.strokeRect(u - s + ryst, v - s, 2 * s, 2 * s);
  c.strokeStyle = shade(hus.tag, -0.35);
  c.beginPath(); c.moveTo(u - s + ryst, v); c.lineTo(u + s + ryst, v); c.stroke();
  if (skade){ c.strokeStyle = '#17211F'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(u - s * 0.4 + ryst, v - s); c.lineTo(u + s * 0.2 + ryst, v + s); c.stroke(); }
  c.restore();
}
export function trae2D(c, u, v, t){
  const k = 3.6 * t.str;
  c.save();
  c.fillStyle = 'rgba(23,33,31,.18)'; c.beginPath(); c.arc(u + 1.5, v + 1.5, k, 0, 2 * Math.PI); c.fill();
  c.fillStyle = t.tone < 0.5 ? '#4E9A3A' : '#3E8A45'; c.strokeStyle = '#17211F'; c.lineWidth = 0.8;
  c.beginPath(); c.arc(u, v, k, 0, 2 * Math.PI); c.fill(); c.stroke();
  c.restore();
}
export function bil2D(c, u, v, b){
  c.save();
  c.fillStyle = b.farve; c.strokeStyle = '#17211F'; c.lineWidth = 0.9;
  c.beginPath(); c.roundRect(u - 4, v - 2, 8, 4, 1.5); c.fill(); c.stroke();
  c.restore();
}

// Lysere eller mørkere udgave af en farve (a fra −1 til 1)
export function shade(hex, a){
  const n = parseInt(hex.slice(1), 16);
  const f = ch => Math.round(a < 0 ? ch * (1 + a) : ch + (255 - ch) * a);
  const [rr, g, b] = [n >> 16 & 255, n >> 8 & 255, n & 255].map(f);
  return `rgb(${rr},${g},${b})`;
}
