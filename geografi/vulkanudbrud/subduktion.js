/* subduktion.js — oversigten over en subduktionszone, hvor stratovulkanens
   magma dannes. Bruges i de første trin af "trin for trin":

     plader      — den oceaniske plade dykker ned under den kontinentale
     smeltning   — ca. 100 km nede presses vand ud af pladen; det sænker
                   smeltepunktet i asthenosfæren over den, og en lille del
                   af kappen smelter til basaltisk magma
     opstigning  — magmaet er lettere end kappen omkring og stiger op

   Tegningen er skematisk: lodret er målestokken ca. 3 gange større end
   vandret, så lagene kan ses. */

import { W, H, tegnMaerkater, tegnMarkoer, tegnFodnote } from './snit.js';

const INK = '#17211F';
const Y0 = 112;                       // px — havniveau
const PKM = 2.6;                      // px pr. km lodret
export const yD = d => Y0 + d * PKM;
export const dY = y => (y - Y0) / PKM;
const X_GRAV = 222;                   // dybhavsgraven
const K = 0.0076;                     // pladens krumning
const T_OCEAN = 50 * PKM, T_SKORPE = 7 * PKM;
const MOHO = 35, LITO_KONT = 60;      // km — kontinentets skorpe og lithosfære
export const X_VULKAN = 432;

// Oversiden af den oceaniske plade
export const pladeTop = x => x <= X_GRAV ? yD(5) : yD(5) + K * (x - X_GRAV) ** 2;
const pladeBund = x => {
  const u = x - X_GRAV - 0.9 * T_OCEAN;
  return yD(5) + T_OCEAN + (u > 0 ? K * u * u : 0);
};
const haeldning = x => x <= X_GRAV ? 0 : 2 * K * (x - X_GRAV);

// Kontinentets overflade: stiger fra graven op over havniveau
function landY(x){
  if (x < X_GRAV + 8) return null;
  const t = Math.min(1, (x - X_GRAV - 8) / 90);
  let y = yD(5) + (Y0 - 6 - yD(5)) * (1 - (1 - t) ** 2);
  const d = Math.abs(x - X_VULKAN);
  if (d < 26) y -= 16 * (1 - d / 26) ** 1.4;               // vulkanen
  return y;
}

// ── Animationen ────────────────────────────────────────
let t = 0;
const draaber = [], klumper = [];
let tDraabe = 0, tKlump = 0;

export function opdater(dt, fokus){
  t += dt;
  if (fokus === 'smeltning' || fokus === 'opstigning'){
    tDraabe -= dt;
    while (tDraabe <= 0){
      tDraabe += 0.12;
      const x = 372 + Math.random() * 90;
      draaber.push({ x, y: pladeTop(x) - 3, alder: 0 });
    }
  }
  for (const d of draaber){ d.alder += dt; d.y -= 14 * dt; d.x -= 3 * dt; }
  for (let i = draaber.length - 1; i >= 0; i--) if (draaber[i].alder > 2.4) draaber.splice(i, 1);

  if (fokus === 'opstigning'){
    tKlump -= dt;
    if (tKlump <= 0){ tKlump = 1.1; klumper.push({ y: yD(90), dx: (Math.random() - 0.5) * 10, r: 5 + Math.random() * 3 }); }
  }
  for (const k of klumper) k.y -= (26 + 10 * (yD(90) - k.y) / 200) * dt;
  for (let i = klumper.length - 1; i >= 0; i--) if (klumper[i].y < yD(9)) klumper.splice(i, 1);
  if (fokus !== 'opstigning') klumper.length = 0;
}

// ── Tegning ────────────────────────────────────────────
export function tegn(c, fokus, lupe){
  // himmel
  const hg = c.createLinearGradient(0, 0, 0, Y0);
  hg.addColorStop(0, '#CFE9F7'); hg.addColorStop(1, '#F3FAFE');
  c.fillStyle = hg; c.fillRect(0, 0, W, Y0 + 1);

  // asthenosfæren: varm og plastisk — fylder alt under lithosfæren
  const ag = c.createLinearGradient(0, Y0, 0, H);
  ag.addColorStop(0, '#F2B98A'); ag.addColorStop(1, '#E48E58');
  c.fillStyle = ag; c.fillRect(0, Y0, W, H - Y0);

  // havet — kontinentet og pladen tegnes ovenpå
  c.fillStyle = '#86C9EC';
  c.fillRect(0, Y0, W, yD(5) - Y0 + 2);

  // kontinentet (skorpe og lithosfærisk kappe) — kun over den nedsynkende plade
  c.save();
  c.beginPath(); c.moveTo(X_GRAV, 0);
  for (let x = X_GRAV; x <= W; x += 3) c.lineTo(x, pladeTop(x));
  c.lineTo(W, 0); c.closePath(); c.clip();
  c.fillStyle = '#95A08A';
  c.fillRect(X_GRAV, Y0, W, yD(LITO_KONT) - Y0);
  c.beginPath(); c.moveTo(X_GRAV, yD(MOHO));
  for (let x = X_GRAV; x <= W; x += 3) c.lineTo(x, landY(x) ?? yD(5));
  c.lineTo(W, yD(MOHO)); c.closePath();
  c.fillStyle = '#B98F70'; c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(X_GRAV, yD(LITO_KONT)); c.lineTo(W, yD(LITO_KONT)); c.stroke();
  c.setLineDash([4, 4]); c.lineWidth = 1;
  c.beginPath(); c.moveTo(X_GRAV, yD(MOHO)); c.lineTo(W, yD(MOHO)); c.stroke();
  c.restore();

  // den oceaniske plade: skorpe og lithosfærisk kappe. Undersiden er den
  // samme parabel som oversiden, blot forskudt — så bliver pladen lige tyk
  // hele vejen og folder sig ikke i bøjningen.
  const top = [], bund = [], skorpe = [];
  for (let x = 0; ; x += 3){
    const y = pladeTop(x), s = haeldning(x), n = Math.hypot(1, s);
    top.push([x, y]);
    bund.push([x, pladeBund(x)]);
    skorpe.push([x - s / n * T_SKORPE, y + T_SKORPE / n]);
    if (y > H + 30) break;
  }
  const flade = (a, b, farve) => {
    c.beginPath();
    a.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    for (let i = b.length - 1; i >= 0; i--) c.lineTo(b[i][0], b[i][1]);
    c.closePath(); c.fillStyle = farve; c.fill();
  };
  flade(top, bund, '#7F8F86');
  flade(top, skorpe, '#3F4B57');
  c.strokeStyle = INK; c.lineWidth = 1.8;
  for (const linje of [top, bund]){
    c.beginPath(); linje.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
  }
  // pile i pladen: den bevæger sig ned under kontinentet
  c.save();
  c.fillStyle = 'rgba(255,255,255,.75)';
  const midt = top.map(([x, y], i) => [(x + bund[i][0]) / 2, (y + bund[i][1]) / 2]);
  const lang = [0]; for (let i = 1; i < midt.length; i++) lang.push(lang[i - 1] + Math.hypot(midt[i][0] - midt[i - 1][0], midt[i][1] - midt[i - 1][1]));
  for (let s = (t * 14) % 60; s < lang[lang.length - 1]; s += 60){
    const i = lang.findIndex(v => v >= s); if (i < 1) continue;
    const [x, y] = midt[i], a = Math.atan2(midt[i][1] - midt[i - 1][1], midt[i][0] - midt[i - 1][0]);
    c.save(); c.translate(x, y); c.rotate(a);
    c.beginPath(); c.moveTo(7, 0); c.lineTo(-4, -6); c.lineTo(-1, 0); c.lineTo(-4, 6); c.closePath(); c.fill();
    c.restore();
  }
  c.restore();

  // landoverfladen og havbunden
  c.strokeStyle = INK; c.lineWidth = 2;
  c.beginPath();
  for (let x = X_GRAV + 8; x <= W; x += 2){ const l = landY(x); if (x === X_GRAV + 8) c.moveTo(x, l); else c.lineTo(x, l); }
  c.stroke();

  // vand, der presses ud af pladen, og smeltezonen over den
  if (fokus === 'smeltning' || fokus === 'opstigning'){
    const mz = c.createRadialGradient(X_VULKAN, yD(88), 4, X_VULKAN, yD(88), 50);
    mz.addColorStop(0, 'rgba(214,52,24,.85)'); mz.addColorStop(1, 'rgba(214,52,24,0)');
    c.fillStyle = mz; c.beginPath(); c.ellipse(X_VULKAN, yD(88), 52, 30, 0, 0, 2 * Math.PI); c.fill();
    c.fillStyle = '#0E5FA8';
    for (const d of draaber){
      c.globalAlpha = Math.min(1, 2.4 - d.alder);
      c.beginPath(); c.arc(d.x, d.y, 2.2, 0, 2 * Math.PI); c.fill();
    }
    c.globalAlpha = 1;
  }

  // magmaet stiger op og samles i et kammer under vulkanen
  if (fokus === 'opstigning'){
    c.strokeStyle = INK; c.lineWidth = 1.2; c.fillStyle = '#E4532A';
    c.beginPath(); c.moveTo(X_VULKAN - 2, yD(34)); c.lineTo(X_VULKAN - 2, yD(8)); c.lineTo(X_VULKAN + 2, yD(8)); c.lineTo(X_VULKAN + 2, yD(34)); c.fill();
    for (const k of klumper){
      c.beginPath(); c.ellipse(X_VULKAN + k.dx * (k.y - yD(9)) / 200, k.y, k.r * 0.8, k.r, 0, 0, 2 * Math.PI);
      c.fill(); c.stroke();
    }
    c.beginPath(); c.ellipse(X_VULKAN, yD(7.5), 16, 5, 0, 0, 2 * Math.PI); c.fill(); c.stroke();
    // udsnittet i næste trin
    c.save(); c.setLineDash([5, 4]); c.lineWidth = 1.8;
    c.strokeRect(X_VULKAN - 34, Y0 - 24, 68, yD(12) - Y0 + 24);
    c.restore();
  }

  // dybdeakse
  c.save();
  c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = 2;
  c.beginPath(); c.moveTo(30, yD(0)); c.lineTo(30, yD(150)); c.stroke();
  c.font = "600 10px 'IBM Plex Mono', ui-monospace, monospace"; c.textBaseline = 'middle';
  for (let d = 0; d <= 150; d += 50){
    c.beginPath(); c.moveTo(25, yD(d)); c.lineTo(35, yD(d)); c.stroke();
    const w = d >= 100 ? 25 : d >= 10 ? 19 : 12;
    c.fillStyle = 'rgba(255,249,238,.9)'; c.fillRect(37, yD(d) - 7, w, 14);
    c.fillStyle = INK; c.fillText(String(d), 39, yD(d) + 0.5);
  }
  for (let d = 25; d < 150; d += 50){ c.beginPath(); c.moveTo(27, yD(d)); c.lineTo(33, yD(d)); c.stroke(); }
  c.translate(14, yD(75)); c.rotate(-Math.PI / 2); c.textAlign = 'center';
  c.fillText('DYBDE · km', 0, 0);
  c.restore();

  // mærkater
  const m = [
    { tekst: 'OCEANISK PLADE →', x: 120, y: yD(5) + 40 },
    { tekst: 'DYBHAVSGRAV', x: X_GRAV + 4, y: 70, mod: yD(5) - 4, modX: X_GRAV + 6 },
    { tekst: 'KONTINENTAL PLADE', x: 560, y: yD(MOHO) - 14 },
    { tekst: 'STRATOVULKAN', x: X_VULKAN + 20, y: 48, mod: Y0 - 18, modX: X_VULKAN },
    { tekst: 'LITHOSFÆRE', x: 575, y: yD(LITO_KONT) - 12 },
    { tekst: 'ASTHENOSFÆREN', x: 560, y: yD(LITO_KONT) + 40 }
  ];
  if (fokus === 'smeltning') {
    m.push({ tekst: 'VAND PRESSES UD', x: 300, y: yD(112), mod: pladeTop(380) - 4, modX: 380, kant: '#0E86C8' });
    m.push({ tekst: 'DELVIS SMELTNING', x: 560, y: yD(104), mod: yD(92), modX: X_VULKAN + 40, kant: '#E8336D' });
  }
  if (fokus === 'opstigning'){
    m.push({ tekst: 'MAGMAET STIGER OP', x: 330, y: yD(26), mod: yD(30), modX: X_VULKAN - 6 });
    m.push({ tekst: 'NÆSTE TRIN', x: X_VULKAN - 88, y: 44, mod: Y0 - 24, modX: X_VULKAN - 34 });
  }
  tegnMaerkater(c, m);
  tegnFodnote(c, 'SKEMATISK · LODRET OVERHØJDE CA. 3×', 48, 'left', H - 9);

  if (lupe) tegnMarkoer(c, lupe.x, lupe.y, 'LUPEN', false);
}
