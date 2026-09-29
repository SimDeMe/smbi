/* spredning.js — oversigten over en spredningszone, hvor skjoldvulkanens
   magma dannes. Snittet går øst–vest gennem Island. Bruges i de første
   trin af "trin for trin":

     plader      — den Nordamerikanske og den Eurasiske Plade glider fra
                   hinanden, og den varme, faste kappe strømmer op nedefra
                   og fylder hullet
     smeltning   — på vej op falder trykket, og ca. 70 km nede begynder en
                   lille del af kappen at smelte (trykaflastning)
     opstigning  — smelten er lettere end kappen og stiger op gennem riften

   Samme målestok som subduktionszonen: lodret overhøjde 3×. Skorpen er
   25 km tyk (Islands skorpe er 20–40 km), og lithosfæren bliver tykkere,
   jo længere den er kommet væk fra riften, fordi den køler af. */

import { W, H, tegnMaerkater, tegnMarkoer, tegnFodnote } from './snit.js';
import { Y0, yD, tegnDybdeakse } from './subduktion.js';

export const navn = 'Spredningszonen';

const INK = '#17211F';
const KAPPE = '#8A988A';
const SKORPE = 25;                    // km
const SOLIDUS = 70;                   // km — her begynder kappen at smelte
export const X_RIFT = 340;

// Lithosfærens underside: tynd under riften, tykkere ud mod siderne
const lithoBund = x => SKORPE + 4 + 54 * Math.sqrt(Math.min(1, Math.hypot(x - X_RIFT, 12) / 300));

// Landoverfladen: lidt over havet, med en riftdal og en lav skjoldvulkan i den
function landY(x){
  const d = x - X_RIFT;
  let y = Y0 - 7 + 5 * Math.exp(-((d / 34) ** 2));         // riftdalen
  y -= 9 * Math.max(0, 1 - (Math.abs(d) / 22) ** 2);         // skjoldvulkanen
  return y;
}

// ── Animationen ────────────────────────────────────────
let t = 0;
const stroem = [], klumper = [];
let tStroem = 0, tKlump = 0;

let klar = false;
export function opdater(dt, fokus){
  // Første gang: lad kappen strømme et stykke tid, så figuren er i gang fra start
  if (!klar){ klar = true; for (let i = 0; i < 300; i++) opdater(0.1, null); }
  t += dt;
  // Kappen strømmer op under riften og drejer ud til siderne under pladerne
  tStroem -= dt;
  while (tStroem <= 0){
    tStroem += 0.14;
    stroem.push({ x: X_RIFT + (Math.random() - 0.5) * 150, y: H + 4 });
  }
  for (const p of stroem){
    const dx = p.x - X_RIFT;
    const naer = Math.max(0, Math.min(1, (yD(155) - p.y) / (yD(155) - yD(40))));
    p.y -= 22 * (1 - 0.85 * naer) * dt;
    p.x += Math.sign(dx || 1) * (4 + 26 * naer * naer) * dt;
  }
  for (let i = stroem.length - 1; i >= 0; i--){
    const p = stroem[i];
    if (p.y < yD(lithoBund(p.x)) + 2 || p.x < 0 || p.x > W) stroem.splice(i, 1);
  }

  if (fokus === 'opstigning'){
    tKlump -= dt;
    if (tKlump <= 0){ tKlump = 1.1; klumper.push({ y: yD(SOLIDUS - 18), dx: (Math.random() - 0.5) * 10, r: 4 + Math.random() * 3 }); }
  }
  for (const k of klumper) k.y -= 26 * dt;
  for (let i = klumper.length - 1; i >= 0; i--) if (klumper[i].y < yD(7)) klumper.splice(i, 1);
  if (fokus !== 'opstigning') klumper.length = 0;
}

// ── Tegning ────────────────────────────────────────────
export function tegn(c, fokus, lupe){
  // himmel
  const hg = c.createLinearGradient(0, 0, 0, Y0);
  hg.addColorStop(0, '#CFE9F7'); hg.addColorStop(1, '#F3FAFE');
  c.fillStyle = hg; c.fillRect(0, 0, W, Y0 + 1);

  // asthenosfæren
  const ag = c.createLinearGradient(0, Y0, 0, H);
  ag.addColorStop(0, '#F2B98A'); ag.addColorStop(1, '#E48E58');
  c.fillStyle = ag; c.fillRect(0, Y0, W, H - Y0);

  // smeltezonen: mellem dybden, hvor kappen begynder at smelte, og lithosfæren
  if (fokus === 'smeltning' || fokus === 'opstigning'){
    c.save();
    c.beginPath(); c.moveTo(0, yD(SOLIDUS));
    for (let x = 0; x <= W; x += 3) c.lineTo(x, Math.min(yD(SOLIDUS), yD(lithoBund(x))));
    c.lineTo(W, yD(SOLIDUS)); c.closePath(); c.clip();
    const mz = c.createRadialGradient(X_RIFT, yD(34), 6, X_RIFT, yD(40), 150);
    mz.addColorStop(0, 'rgba(214,52,24,.9)'); mz.addColorStop(1, 'rgba(214,52,24,.12)');
    c.fillStyle = mz; c.fillRect(0, 0, W, H);
    c.restore();
    c.save(); c.setLineDash([4, 4]); c.strokeStyle = '#B42A12'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(X_RIFT - 230, yD(SOLIDUS)); c.lineTo(X_RIFT + 230, yD(SOLIDUS)); c.stroke();
    c.restore();
  }

  // kappen, der strømmer op
  c.fillStyle = 'rgba(255,255,255,.7)';
  for (const p of stroem){ c.beginPath(); c.arc(p.x, p.y, 2, 0, 2 * Math.PI); c.fill(); }

  // lithosfæren: lithosfærisk kappe under skorpen
  const flade = (ovre, nedre, farve) => {
    c.beginPath();
    for (let x = 0; x <= W; x += 3) c.lineTo(x, ovre(x));
    for (let x = W; x >= 0; x -= 3) c.lineTo(x, nedre(x));
    c.closePath(); c.fillStyle = farve; c.fill();
  };
  flade(() => yD(SKORPE), x => yD(lithoBund(x)), KAPPE);
  flade(landY, () => yD(SKORPE), '#6E6560');

  // gange i skorpen under riften: magma, der er størknet i sprækker
  c.strokeStyle = '#4A413D'; c.lineWidth = 2;
  for (const dx of [-26, -14, 12, 24]){
    c.beginPath(); c.moveTo(X_RIFT + dx, yD(SKORPE) - 4); c.lineTo(X_RIFT + dx * 0.8, landY(X_RIFT + dx * 0.8) + 4); c.stroke();
  }

  // pile i pladerne: de bevæger sig væk fra riften
  c.save();
  c.fillStyle = 'rgba(255,255,255,.8)';
  for (const side of [-1, 1]){
    for (let s = (t * 10) % 70; s < 280; s += 70){
      const x = X_RIFT + side * (60 + s), y = yD((SKORPE + lithoBund(x)) / 2);
      c.save(); c.translate(x, y); c.scale(side, 1);
      c.beginPath(); c.moveTo(7, 0); c.lineTo(-4, -6); c.lineTo(-1, 0); c.lineTo(-4, 6); c.closePath(); c.fill();
      c.restore();
    }
  }
  c.restore();

  // grænser
  c.strokeStyle = INK; c.lineWidth = 1.5;
  c.beginPath();
  for (let x = 0; x <= W; x += 3) c.lineTo(x, yD(lithoBund(x)));
  c.stroke();
  c.save(); c.setLineDash([4, 4]); c.lineWidth = 1;
  c.beginPath(); c.moveTo(0, yD(SKORPE)); c.lineTo(W, yD(SKORPE)); c.stroke();
  c.restore();
  c.lineWidth = 2;
  c.beginPath();
  for (let x = 0; x <= W; x += 2) c.lineTo(x, landY(x));
  c.stroke();

  // magmaet stiger op og samles under skjoldvulkanen
  if (fokus === 'opstigning'){
    c.strokeStyle = INK; c.lineWidth = 1.2; c.fillStyle = '#E4532A';
    c.fillRect(X_RIFT - 2, yD(SKORPE + 8), 4, yD(6) - yD(SKORPE + 8));
    for (const k of klumper){
      c.beginPath(); c.ellipse(X_RIFT + k.dx * (k.y - yD(7)) / 140, k.y, k.r * 0.8, k.r, 0, 0, 2 * Math.PI);
      c.fill(); c.stroke();
    }
    c.beginPath(); c.ellipse(X_RIFT, yD(5), 14, 4, 0, 0, 2 * Math.PI); c.fill(); c.stroke();
    c.save(); c.setLineDash([5, 4]); c.lineWidth = 1.8;
    c.strokeRect(X_RIFT - 34, Y0 - 30, 68, yD(12) - Y0 + 30);
    c.restore();
  }

  tegnDybdeakse(c);

  const m = [
    { tekst: 'SKJOLDVULKAN I RIFTDALEN', x: X_RIFT + 20, y: 30, mod: Y0 - 18, modX: X_RIFT },
    { tekst: '← NORDAMERIKANSKE PLADE', x: 160, y: 72 },
    { tekst: 'EURASISKE PLADE →', x: 540, y: 72 },
    { tekst: 'SKORPE', x: 150, y: yD(SKORPE / 2) + 5 },
    { tekst: 'LITHOSFÆRISK KAPPE', x: 150, y: yD(52) + 5 },
    { tekst: 'ASTHENOSFÆREN', x: 548, y: yD(118) }
  ];
  if (fokus === 'plader')
    m.push({ tekst: 'KAPPEN STRØMMER OP', x: X_RIFT + 150, y: yD(128), mod: yD(112), modX: X_RIFT + 30 });
  if (fokus === 'smeltning' || fokus === 'opstigning')
    m.push({ tekst: 'KAPPEN BEGYNDER AT SMELTE', enhed: 'ca. 70 km', x: X_RIFT + 150, y: yD(SOLIDUS) + 26, mod: yD(SOLIDUS), modX: X_RIFT + 120, kant: '#E8336D' });
  if (fokus === 'smeltning')
    m.push({ tekst: 'DELVIS SMELTNING', x: X_RIFT - 150, y: yD(44), mod: yD(44), modX: X_RIFT - 40, kant: '#E8336D' });
  if (fokus === 'opstigning'){
    m.push({ tekst: 'MAGMAET STIGER OP', x: X_RIFT - 130, y: yD(22), mod: yD(22), modX: X_RIFT - 6 });
    m.push({ tekst: 'NÆSTE TRIN', x: X_RIFT + 100, y: 100, mod: Y0 - 20, modX: X_RIFT + 34 });
  }

  tegnMaerkater(c, m);
  tegnFodnote(c, 'SKEMATISK · LODRET OVERHØJDE 3×', 48, 'left', H - 9);
  tegnFodnote(c, '← CA. 1 cm OM ÅRET · CA. 1 cm OM ÅRET →', W - 8, 'right', H - 9);

  if (lupe) tegnMarkoer(c, lupe.x, lupe.y, 'LUPEN', false);
}
