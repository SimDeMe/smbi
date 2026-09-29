/* hotspot.js — oversigten over en hotspot midt på en oceanisk plade, hvor
   hotspot-vulkanens magma dannes (Hawaii). Bruges i de første trin af
   "trin for trin":

     diapir      — en søjle af særlig varm, fast kappe (en kappediapir)
                   stiger langsomt op dybt nede fra
     smeltning   — under pladen falder trykket så meget, at en lille del
                   af den varme kappe smelter (trykaflastning)
     kaede       — magmaet stiger op gennem pladen, mens pladen glider hen
                   over hotspottet: de gamle vulkaner føres bort, går ud og
                   synker i havet, og en ny vokser op over hotspottet

   Samme lodrette målestok som subduktionszonen (overhøjde 3×).
   Vandret er vulkankæden trukket stærkt sammen: fra Hawaii til Kauai er
   der ca. 500 km, og til Midway ca. 2 400 km. */

import { W, H, tegnMaerkater, tegnMarkoer, tegnFodnote } from './snit.js';
import { Y0, yD, tegnDybdeakse, klamme } from './subduktion.js';

export const navn = 'Hotspottet';

const INK = '#17211F';
const KAPPE = '#8A988A';
const HAVBUND = 5, SKORPE = 7, PLADE = 90;    // km
export const X_HOT = 452;

// Vulkankæden: den yngste står over hotspottet, de ældre er ført bort og sunket.
// h: toppens højde over havniveau i km (negativ: under havet)
const KAEDE = [
  { x: X_HOT, h: 4.2, b: 44, navn: 'HAWAII', alder: '0–0,5 mio. år' },
  { x: X_HOT - 92, h: 3.0, b: 36, navn: 'MAUI', alder: 'ca. 1 mio. år' },
  { x: X_HOT - 186, h: 1.6, b: 32, navn: 'KAUAI', alder: 'ca. 5 mio. år' },
  { x: X_HOT - 280, h: -1.2, b: 30, navn: 'MIDWAY', alder: 'ca. 28 mio. år' }
];

// Havbunden med vulkanerne på
function bundY(x){
  let y = yD(HAVBUND);
  for (const v of KAEDE){
    const d = Math.abs(x - v.x) / v.b;
    if (d < 1) y = Math.min(y, yD(HAVBUND) - (HAVBUND + v.h) * 2.6 * (1 - d * d) ** 1.3);
  }
  return y;
}

// Kappediapiren: en smal stamme med et fladt hoved under pladen
function diapirBredde(y){
  const d = (y - Y0) / 2.6;
  if (d < PLADE) return 0;
  return 26 + 90 * Math.sqrt(Math.max(0, 1 - ((d - PLADE) / 40) ** 2));
}

// ── Animationen ────────────────────────────────────────
let t = 0;
const bobler = [], klumper = [];
let tBoble = 0, tKlump = 0;

let klar = false;
export function opdater(dt, fokus){
  // Første gang: lad diapiren stige et stykke tid, så figuren er i gang fra start
  if (!klar){ klar = true; for (let i = 0; i < 300; i++) opdater(0.1, null); }
  t += dt;
  tBoble -= dt;
  while (tBoble <= 0){
    tBoble += 0.22;
    bobler.push({ x: X_HOT + (Math.random() - 0.5) * 36, y: H + 4 });
  }
  for (const b of bobler){
    b.y -= 20 * dt;
    // i hovedet breder kappen sig ud til siderne
    if (b.y < yD(PLADE + 30)) b.x += Math.sign(b.x - X_HOT || 1) * 22 * dt;
  }
  for (let i = bobler.length - 1; i >= 0; i--) if (bobler[i].y < yD(PLADE + 3)) bobler.splice(i, 1);

  if (fokus === 'kaede'){
    tKlump -= dt;
    if (tKlump <= 0){ tKlump = 1.1; klumper.push({ y: yD(PLADE + 10), dx: (Math.random() - 0.5) * 10, r: 4 + Math.random() * 3 }); }
  }
  for (const k of klumper) k.y -= 30 * dt;
  for (let i = klumper.length - 1; i >= 0; i--) if (klumper[i].y < yD(6)) klumper.splice(i, 1);
  if (fokus !== 'kaede') klumper.length = 0;
}

// ── Tegning ────────────────────────────────────────────
export function tegn(c, fokus, lupe){
  const hg = c.createLinearGradient(0, 0, 0, Y0);
  hg.addColorStop(0, '#CFE9F7'); hg.addColorStop(1, '#F3FAFE');
  c.fillStyle = hg; c.fillRect(0, 0, W, Y0 + 1);

  // asthenosfæren
  const ag = c.createLinearGradient(0, Y0, 0, H);
  ag.addColorStop(0, '#F2B98A'); ag.addColorStop(1, '#E48E58');
  c.fillStyle = ag; c.fillRect(0, yD(PLADE), W, H - yD(PLADE));

  // kappediapiren: varmere end kappen omkring
  c.beginPath();
  for (let y = H + 2; y >= yD(PLADE); y -= 3) c.lineTo(X_HOT - diapirBredde(y) - 3 * Math.sin(y / 17 + t), y);
  for (let y = yD(PLADE); y <= H + 2; y += 3) c.lineTo(X_HOT + diapirBredde(y) + 3 * Math.sin(y / 19 - t), y);
  c.closePath();
  const dg = c.createLinearGradient(0, H, 0, yD(PLADE));
  dg.addColorStop(0, '#E0602E'); dg.addColorStop(1, '#EE8A4A');
  c.fillStyle = dg; c.fill();
  c.strokeStyle = 'rgba(23,33,31,.55)'; c.lineWidth = 1.3; c.setLineDash([3, 3]); c.stroke(); c.setLineDash([]);
  c.fillStyle = 'rgba(255,240,220,.75)';
  for (const b of bobler){ c.beginPath(); c.arc(b.x, b.y, 2, 0, 2 * Math.PI); c.fill(); }

  // smeltezonen i diapirens hoved, lige under pladen
  if (fokus === 'smeltning' || fokus === 'kaede'){
    const mz = c.createRadialGradient(X_HOT, yD(112), 4, X_HOT, yD(112), 60);
    mz.addColorStop(0, 'rgba(200,40,18,.9)'); mz.addColorStop(1, 'rgba(200,40,18,0)');
    c.fillStyle = mz; c.beginPath(); c.ellipse(X_HOT, yD(112), 64, 34, 0, 0, 2 * Math.PI); c.fill();
  }

  // havet og pladen
  c.fillStyle = '#86C9EC'; c.fillRect(0, Y0, W, yD(HAVBUND) - Y0 + 2);
  c.fillStyle = KAPPE; c.fillRect(0, yD(HAVBUND + SKORPE), W, yD(PLADE) - yD(HAVBUND + SKORPE));
  c.fillStyle = '#3F4B57'; c.fillRect(0, yD(HAVBUND), W, yD(HAVBUND + SKORPE) - yD(HAVBUND));

  // vulkanerne: den aktive gløder i toppen
  c.beginPath(); c.moveTo(0, yD(HAVBUND));
  for (let x = 0; x <= W; x += 2) c.lineTo(x, bundY(x));
  c.lineTo(W, yD(HAVBUND)); c.closePath();
  c.fillStyle = '#4A4543'; c.fill();
  c.strokeStyle = INK; c.lineWidth = 2;
  c.beginPath(); for (let x = 0; x <= W; x += 2) c.lineTo(x, bundY(x)); c.stroke();
  c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(0, yD(PLADE)); c.lineTo(W, yD(PLADE)); c.stroke();
  c.beginPath(); c.moveTo(0, Y0); c.lineTo(W, Y0); c.strokeStyle = '#0E5FA8'; c.lineWidth = 1; c.stroke();

  // pile i pladen: den glider mod venstre (nordvest) hen over hotspottet
  c.save();
  c.fillStyle = 'rgba(255,255,255,.8)';
  for (let s = (t * 14) % 70; s < W - 60; s += 70){
    const x = W - 20 - s, y = yD((HAVBUND + SKORPE + PLADE) / 2);
    c.save(); c.translate(x, y); c.scale(-1, 1);
    c.beginPath(); c.moveTo(7, 0); c.lineTo(-4, -6); c.lineTo(-1, 0); c.lineTo(-4, 6); c.closePath(); c.fill();
    c.restore();
  }
  c.restore();

  // magmaet stiger op gennem pladen og samles i den aktive vulkan
  if (fokus === 'kaede'){
    c.strokeStyle = INK; c.lineWidth = 1.2; c.fillStyle = '#E4532A';
    c.fillRect(X_HOT - 2, yD(PLADE + 6), 4, yD(4) - yD(PLADE + 6));
    for (const k of klumper){
      c.beginPath(); c.ellipse(X_HOT + k.dx * (k.y - yD(6)) / 240, k.y, k.r * 0.8, k.r, 0, 0, 2 * Math.PI);
      c.fill(); c.stroke();
    }
    c.beginPath(); c.ellipse(X_HOT, yD(3), 12, 4, 0, 0, 2 * Math.PI); c.fill(); c.stroke();
    c.save(); c.setLineDash([5, 4]); c.lineWidth = 1.8;
    c.strokeRect(X_HOT - 34, bundY(X_HOT) - 26, 68, yD(9) - bundY(X_HOT) + 26);
    c.restore();
  }
  // glød i toppen af den aktive vulkan
  const g = c.createRadialGradient(X_HOT, bundY(X_HOT), 1, X_HOT, bundY(X_HOT), 12);
  g.addColorStop(0, 'rgba(255,190,70,.95)'); g.addColorStop(1, 'rgba(255,120,40,0)');
  c.fillStyle = g; c.beginPath(); c.arc(X_HOT, bundY(X_HOT), 12, 0, 2 * Math.PI); c.fill();

  tegnDybdeakse(c);

  // vulkankæden: navn og alder over hver vulkan
  const m = KAEDE.map((v, i) => ({ tekst: v.navn, enhed: v.alder, x: v.x, y: 30 + (i % 2) * 22,
                                   mod: bundY(v.x) - 3, modX: v.x }));
  m.push({ tekst: 'OCEANISK SKORPE', x: 140, y: yD(HAVBUND + SKORPE / 2) + 5 });
  m.push({ tekst: 'LITHOSFÆRISK KAPPE', x: 150, y: yD(50) + 5 });
  m.push({ tekst: 'ASTHENOSFÆREN', x: 150, y: yD(130) });
  if (fokus === 'diapir')
    m.push({ tekst: 'KAPPEDIAPIR', x: X_HOT - 140, y: yD(152), mod: yD(150), modX: X_HOT - 26 });
  if (fokus === 'smeltning')
    m.push({ tekst: 'DELVIS SMELTNING', x: X_HOT + 100, y: yD(134), mod: yD(116), modX: X_HOT + 40, kant: '#E8336D' });
  if (fokus === 'kaede'){
    m.push({ tekst: 'MAGMAET STIGER OP', x: X_HOT - 120, y: yD(64), mod: yD(64), modX: X_HOT - 6 });
    m.push({ tekst: 'NÆSTE TRIN', x: X_HOT + 104, y: yD(24), mod: yD(16), modX: X_HOT + 34 });
  }
  m.push({ tekst: '← CA. 7 cm OM ÅRET', x: 330, y: yD(72) + 5 });
  // påskriften står højt, så lupens mærkat (50 km nede) kan ligge under den
  klamme(c, W - 12, yD(HAVBUND), yD(PLADE), 'STILLEHAVSPLADEN', -1, yD(24));

  tegnMaerkater(c, m);
  tegnFodnote(c, 'SKEMATISK · LODRET OVERHØJDE 3× · KÆDEN ER TRUKKET SAMMEN', 48, 'left', H - 9);

  if (lupe) tegnMarkoer(c, lupe.x, lupe.y, 'LUPEN', false);
}
