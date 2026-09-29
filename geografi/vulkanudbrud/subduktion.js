/* subduktion.js — oversigten over en subduktionszone, hvor stratovulkanens
   magma dannes. Bruges i de første trin af "trin for trin":

     plader      — den oceaniske plade dykker ned under den kontinentale
     smeltning   — ca. 100 km nede presses vand ud af pladen; det sænker
                   smeltepunktet i asthenosfæren over den, og en lille del
                   af kappen smelter til basaltisk magma
     opstigning  — magmaet er lettere end kappen omkring og stiger op

   Tegningen er skematisk: lodret er målestokken 3 gange større end
   vandret, så lagene kan ses. Pladen regnes i rigtige km — flad havbund,
   en bøjning ned i dybhavsgraven og en fast hældning derefter — og først
   bagefter trækkes figuren 3 gange i højden. Undersiden og skorpens
   underkant ligger vinkelret under oversiden, målt i km, så pladen er
   lige tyk hele vejen og vender rigtigt, også når den dykker. */

import { W, H, tegnMaerkater, tegnMarkoer, tegnFodnote } from './snit.js';

const INK = '#17211F';
const KAPPE = '#8A988A';              // lithosfærisk kappe — samme i begge plader
const Y0 = 112;                       // px — havniveau
const PKM = 2.6;                      // px pr. km lodret
export const yD = d => Y0 + d * PKM;
export const dY = y => (y - Y0) / PKM;
const PX = PKM / 3;                   // px pr. km vandret — lodret overhøjde 3×
const X_GRAV = 222;                   // dybhavsgraven
export const X_VULKAN = 432;
const MOHO = 35, LITO_KONT = 60;      // km — kontinentets skorpe og lithosfære

// ── Den oceaniske plade, i km ──────────────────────────
// X regnes fra graven, D er dybden under havniveau.
const HAVBUND = 5, GRAV = 10;         // km — dybhavsslette og grav (typisk 8–11)
const T_PLADE = 50, T_SKORPE = 7;     // km — pladens og skorpens tykkelse
const R_BOEJ = 200;                   // km — bøjningsradius; skal være > T_PLADE
const DYK = 22 * Math.PI / 180;       // hældningen efter bøjningen:
                                      // ca. 105 km under vulkanen (242 km inde)
const PHI0 = Math.acos(1 - (GRAV - HAVBUND) / R_BOEJ);  // vinklen ved graven
const X_BOEJ = -R_BOEJ * Math.sin(PHI0);                // bøjningen begynder

// Punkt på oversiden efter længden s langs pladen fra bøjningens start,
// med normalen ind i pladen
function oversiden(s){
  if (s <= 0) return { X: X_BOEJ + s, D: HAVBUND, nx: 0, nd: 1 };
  const sBue = R_BOEJ * DYK;
  const th = Math.min(s, sBue) / R_BOEJ;
  let X = X_BOEJ + R_BOEJ * Math.sin(th), D = HAVBUND + R_BOEJ * (1 - Math.cos(th));
  if (s > sBue){ X += (s - sBue) * Math.cos(DYK); D += (s - sBue) * Math.sin(DYK); }
  return { X, D, nx: -Math.sin(th), nd: Math.cos(th) };
}
const tilSkaerm = (X, D) => [X_GRAV + X * PX, yD(D)];
// Oversiden, skorpens underkant og undersiden som linjer på skærmen
const LINJER = (() => {
  const top = [], skorpe = [], bund = [];
  for (let s = -X_GRAV / PX + X_BOEJ - 20; ; s += 2){
    const p = oversiden(s);
    top.push(tilSkaerm(p.X, p.D));
    skorpe.push(tilSkaerm(p.X + T_SKORPE * p.nx, p.D + T_SKORPE * p.nd));
    bund.push(tilSkaerm(p.X + T_PLADE * p.nx, p.D + T_PLADE * p.nd));
    if (top[top.length - 1][1] > H + 30) break;
  }
  return { top, skorpe, bund };
})();

// Oversiden af den oceaniske plade: y på skærmen ved x
export function pladeTop(x){
  const L = LINJER.top;
  if (x <= L[0][0]) return L[0][1];
  for (let i = 1; i < L.length; i++){
    if (L[i][0] >= x){
      const [x0, y0] = L[i - 1], [x1, y1] = L[i];
      return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }
  }
  return L[L.length - 1][1];
}
// x på skærmen, hvor pladens overside når dybden d (km)
export function xVed(d){
  const L = LINJER.top, y = yD(d);
  const i = L.findIndex(p => p[1] >= y && p[0] > X_GRAV);
  return i < 1 ? X_GRAV : L[i][0];
}
// Et punkt midt i pladens skorpe, der hvor oversiden er d km nede
export function iSkorpen(d){
  const i = LINJER.top.findIndex(p => p[1] >= yD(d) && p[0] > X_GRAV);
  const [xt, yt] = LINJER.top[i], [xs, ys] = LINJER.skorpe[i];
  return { x: (xt + xs) / 2, y: (yt + ys) / 2 };
}

// Kontinentets overflade: stiger fra bunden af graven op over havniveau
function landY(x){
  if (x < X_GRAV) return null;
  // skråningen er svag i virkeligheden (få grader) — kysten ligger ca. 140 km inde
  const t = Math.min(1, (x - X_GRAV) / 120);
  let y = yD(GRAV) + (Y0 - 6 - yD(GRAV)) * (1 - (1 - t) ** 2);
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
      // vandet presses ud, hvor pladen er ca. 80–120 km nede
      const x = xVed(80) + Math.random() * (xVed(120) - xVed(80));
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
  c.fillRect(0, Y0, W, yD(GRAV) - Y0 + 2);

  // kontinentet (skorpe og lithosfærisk kappe) — kun over den nedsynkende plade
  c.save();
  c.beginPath(); c.moveTo(X_GRAV, 0);
  for (let x = X_GRAV; x <= W; x += 3) c.lineTo(x, pladeTop(x));
  c.lineTo(W, 0); c.closePath(); c.clip();
  c.fillStyle = KAPPE;
  c.fillRect(X_GRAV, yD(MOHO), W, yD(LITO_KONT) - yD(MOHO));
  c.beginPath(); c.moveTo(X_GRAV, yD(MOHO));
  for (let x = X_GRAV; x <= W; x += 3) c.lineTo(x, landY(x));
  c.lineTo(W, yD(MOHO)); c.closePath();
  c.fillStyle = '#B98F70'; c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(X_GRAV, yD(LITO_KONT)); c.lineTo(W, yD(LITO_KONT)); c.stroke();
  c.setLineDash([4, 4]); c.lineWidth = 1;
  c.beginPath(); c.moveTo(X_GRAV, yD(MOHO)); c.lineTo(W, yD(MOHO)); c.stroke();
  c.restore();

  // den oceaniske plade: skorpe og lithosfærisk kappe (se LINJER øverst)
  const { top, skorpe, bund } = LINJER;
  const flade = (a, b, farve) => {
    c.beginPath();
    a.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    for (let i = b.length - 1; i >= 0; i--) c.lineTo(b[i][0], b[i][1]);
    c.closePath(); c.fillStyle = farve; c.fill();
  };
  flade(top, bund, KAPPE);
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
  for (let x = X_GRAV; x <= W; x += 2){ const l = landY(x); if (x === X_GRAV) c.moveTo(x, l); else c.lineTo(x, l); }
  c.stroke();

  // vand, der presses ud af pladen, og smeltezonen over den
  if (fokus === 'smeltning' || fokus === 'opstigning'){
    // smeltezonen ligger i kilen af asthenosfære over pladen — ikke i den
    c.save();
    c.beginPath(); c.moveTo(0, 0);
    for (let x = 0; x <= W; x += 3) c.lineTo(x, pladeTop(x));
    c.lineTo(W, 0); c.closePath(); c.clip();
    const mz = c.createRadialGradient(X_VULKAN, yD(88), 4, X_VULKAN, yD(88), 50);
    mz.addColorStop(0, 'rgba(214,52,24,.85)'); mz.addColorStop(1, 'rgba(214,52,24,0)');
    c.fillStyle = mz; c.beginPath(); c.ellipse(X_VULKAN, yD(88), 52, 30, 0, 0, 2 * Math.PI); c.fill();
    c.restore();
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
    { tekst: 'DYBHAVSGRAV', enhed: 'ca. 10 km', x: X_GRAV - 20, y: 70, mod: yD(GRAV) - 3, modX: X_GRAV },
    { tekst: 'STRATOVULKAN', x: X_VULKAN + 20, y: 48, mod: Y0 - 18, modX: X_VULKAN },
    { tekst: 'OCEANISK SKORPE', x: 140, y: yD(HAVBUND + T_SKORPE / 2) + 5 },
    { tekst: 'LITHOSFÆRISK KAPPE', x: 170, y: yD(35) + 5 },
    { tekst: 'KONTINENTAL SKORPE', x: 548, y: yD(20) + 5 },
    { tekst: 'LITHOSFÆRISK KAPPE', x: 548, y: yD((MOHO + LITO_KONT) / 2) + 5 },
    { tekst: 'ASTHENOSFÆREN', x: 548, y: yD(LITO_KONT) + 40 }
  ];
  if (fokus === 'smeltning') {
    m.push({ tekst: 'VAND PRESSES UD', x: 300, y: yD(112), mod: yD(95) - 4, modX: xVed(95), kant: '#0E86C8' });
    m.push({ tekst: 'DELVIS SMELTNING', x: 560, y: yD(104), mod: yD(92), modX: X_VULKAN + 40, kant: '#E8336D' });
  }
  if (fokus === 'opstigning'){
    m.push({ tekst: 'MAGMAET STIGER OP', x: 330, y: yD(26), mod: yD(30), modX: X_VULKAN - 6 });
    m.push({ tekst: 'NÆSTE TRIN', x: X_VULKAN - 88, y: 44, mod: Y0 - 24, modX: X_VULKAN - 34 });
  }
  // Klammer: en plade er skorpen plus den faste kappe under den
  klamme(c, 76, yD(HAVBUND), yD(HAVBUND + T_PLADE), 'OCEANISK PLADE', 1);
  // påskriften står højt, så lupens mærkat (45 og 60 km nede) kan ligge under den
  klamme(c, W - 12, landY(W - 12), yD(LITO_KONT), 'KONTINENTAL PLADE', -1, yD(18.5));

  tegnMaerkater(c, m);
  tegnFodnote(c, 'SKEMATISK · LODRET OVERHØJDE 3×', 48, 'left', H - 9);

  if (lupe) tegnMarkoer(c, lupe.x, lupe.y, 'LUPEN', false);
}

// Lodret klamme med påskrift langs den — viser, hvad én plade består af
// (side = 1: klammen favner det, der ligger til højre for den; -1: til venstre)
function klamme(c, x, y0, y1, tekst, side, yTekst = (y0 + y1) / 2){
  c.save();
  c.strokeStyle = INK; c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x + 5 * side, y0 + 1); c.lineTo(x, y0 + 1); c.lineTo(x, y1 - 1); c.lineTo(x + 5 * side, y1 - 1);
  c.stroke();
  c.font = "600 9px 'IBM Plex Mono', ui-monospace, monospace";
  const w = c.measureText(tekst).width + 12;
  c.translate(x, yTekst); c.rotate(-Math.PI / 2);
  c.fillStyle = 'rgba(255,249,238,.95)'; c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(-w / 2, -7, w, 14, 7); c.fill(); c.stroke();
  c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(tekst, 0, 0.5);
  c.restore();
}
