/* ═══════════════════════════════════════════════════════════
   udstyr.js — bryggeudstyret: gryden, varmepladen, blusset,
   gærballonen med gærlås, glasset og hydrometeret.

   Tegningerne tager tilstanden som tal (niveau, farve, hvor meget
   der bobler) og ved intet om modellen bag.
   ═══════════════════════════════════════════════════════════ */
import {INK, SLATE, FARVE, PAPIR, BLØDT, blaek, boks, maerkat, skilt, komma} from './model.js';

/* ── Gryden (mæskekar og kogekar) ──────────────────────── */
export const GRYDE = {x:52, y:150, b:250, h:250};

/** Væskens overflade i gryden, når den rummer V liter (maks 34 L). */
export const GRYDE_L = 34;
export function grydeNiveau(V){
  const {y, h} = GRYDE;
  return y + h - (h - 22) * Math.min(1, V / GRYDE_L);
}

export function tegnGryde(g, {vaeske, niveau, uklar = 0, rt = 0, bobler = 0, korn = 0}){
  const {x, y, b, h} = GRYDE;
  /* hanke */
  for(const s of [-1, 1]){
    const hx = s < 0 ? x - 16 : x + b + 16;
    boks(g, Math.min(hx, hx - s * 22) - (s < 0 ? 0 : 0), y + 24, 22, 14, 7);
    blaek(g, '#C9D3D1', 2);
  }
  /* indhold */
  g.save();
  boks(g, x, y, b, h, 16); g.clip();
  g.fillStyle = '#F4F6F5'; g.fillRect(x, y, b, h);
  const top = niveau;
  g.beginPath();
  g.moveTo(x, top);
  for(let i = 0; i <= 20; i++){
    const xx = x + b * i / 20;
    g.lineTo(xx, top + Math.sin(rt * 3 + i * 0.9) * (1 + bobler * 2.5));
  }
  g.lineTo(x + b, y + h); g.lineTo(x, y + h); g.closePath();
  g.fillStyle = vaeske; g.fill();
  if(uklar > 0){
    g.fillStyle = `rgba(255,255,255,${0.35 * uklar})`; g.fill();
  }
  /* korn i mæsken */
  if(korn > 0){
    for(let i = 0; i < 70 * korn; i++){
      const u = (i * 0.6180339) % 1, v = (i * 0.414213 + 0.3) % 1;
      const kx = x + 14 + u * (b - 28) + Math.sin(rt * 0.7 + i) * 2;
      const ky = top + 18 + v * (y + h - top - 30);
      g.save(); g.translate(kx, ky); g.rotate(i);
      g.beginPath(); g.ellipse(0, 0, 5, 2.6, 0, 0, Math.PI * 2);
      g.fillStyle = '#C99A4B'; g.fill();
      g.lineWidth = 1; g.strokeStyle = 'rgba(23,33,31,.45)'; g.stroke();
      g.restore();
    }
  }
  /* bobler (kogning) */
  for(let i = 0; i < 26 * bobler; i++){
    const u = (i * 0.754877) % 1;
    const fase = ((BLØDT ? rt : 0) * (0.5 + u * 0.6) + i * 0.37) % 1;
    const bx = x + 18 + u * (b - 36) + Math.sin(fase * 9 + i) * 3;
    const by = y + h - 10 - fase * (y + h - 10 - top);
    g.beginPath(); g.arc(bx, by, 2.5 + 4 * fase * (0.5 + u), 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,.6)'; g.fill();
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(23,33,31,.35)'; g.stroke();
  }
  g.restore();
  /* kanten og en tynd kant ved overfladen */
  boks(g, x, y, b, h, 16);
  blaek(g, null, 3);
  g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + b + 6, y);
  g.lineWidth = 5; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke();
  g.lineCap = 'butt';
  /* literskala */
  for(const L of [10, 20, 30]){
    const ly = grydeNiveau(L);
    g.beginPath(); g.moveTo(x + b - 14, ly); g.lineTo(x + b - 4, ly);
    g.lineWidth = 1.6; g.strokeStyle = INK; g.stroke();
    maerkat(g, L + ' L', x + b - 18, ly, {størrelse:8.5, justering:'right', stort:false, spær:0.3, farve:SLATE});
  }
}

/** Varmeplade med glødende spiral, når der varmes. */
export function tegnVarmeplade(g, varmer, rt){
  const {x, y, b, h} = GRYDE;
  boks(g, x - 10, y + h + 6, b + 20, 22, 6);
  blaek(g, '#DCE3E1', 2.4);
  const glød = varmer ? 0.65 + 0.35 * Math.sin(rt * 5) : 0;
  g.beginPath();
  for(let i = 0; i <= 12; i++){
    const xx = x + 20 + (b - 40) * i / 12;
    g.lineTo(xx, y + h + 17 + (i % 2 ? -4 : 4));
  }
  g.lineWidth = 3;
  g.strokeStyle = varmer ? `rgba(255,${90 - 40 * glød},${40},${0.6 + 0.4 * glød})` : '#8A9794';
  g.stroke();
  skilt(g, varmer ? 'Varmer · 3 kW' : 'Varme slukket', x + b / 2, y + h + 48,
        {fyld:varmer ? '#FFD9C9' : PAPIR});
}

/** Gasblus med flammer under kogekarret. */
export function tegnBlus(g, rt){
  const {x, y, b, h} = GRYDE;
  boks(g, x + 20, y + h + 20, b - 40, 12, 5);
  blaek(g, '#8A9794', 2.2);
  for(let i = 0; i < 9; i++){
    const fx = x + 36 + (b - 72) * i / 8;
    const fl = 12 + 5 * Math.sin((BLØDT ? rt : 0) * 11 + i * 1.7);
    g.beginPath();
    g.moveTo(fx - 6, y + h + 20);
    g.quadraticCurveTo(fx - 5, y + h + 20 - fl * 0.6, fx, y + h + 20 - fl);
    g.quadraticCurveTo(fx + 5, y + h + 20 - fl * 0.6, fx + 6, y + h + 20);
    g.closePath();
    blaek(g, i % 2 ? '#FFB300' : FARVE.varme, 1.4);
  }
}

/** Damp, der stiger op fra gryden. */
export function tegnDamp(g, rt, mængde){
  const {x, y, b} = GRYDE;
  for(let i = 0; i < 7 * mængde; i++){
    const u = (i * 0.618) % 1;
    const f = (((BLØDT ? rt : 0) * 0.35 + u) % 1);
    const dx = x + 40 + u * (b - 80) + Math.sin(f * 6 + i) * 12;
    const dy = y - 8 - f * 110;
    g.beginPath(); g.arc(dx, dy, 9 + f * 16, 0, Math.PI * 2);
    g.fillStyle = `rgba(255,255,255,${0.75 * (1 - f)})`; g.fill();
    g.lineWidth = 1.4; g.strokeStyle = `rgba(86,107,104,${0.45 * (1 - f)})`; g.stroke();
  }
}

/* ── Humlekogle ────────────────────────────────────────── */
export function tegnHumle(g, x, y, s = 1, v = 0){
  g.save(); g.translate(x, y); g.rotate(v); g.scale(s, s);
  for(const [ry, rb] of [[-9, 5], [-3, 7], [3, 8], [9, 6]]){
    for(const sx of [-1, 1]){
      g.beginPath(); g.ellipse(sx * 3.2, ry, rb * 0.55, 4.4, sx * 0.4, 0, Math.PI * 2);
      blaek(g, FARVE.humleLys, 1.2);
    }
  }
  g.beginPath(); g.moveTo(0, -14); g.lineTo(0, -18);
  g.lineWidth = 1.6; g.strokeStyle = INK; g.stroke();
  g.restore();
}

/* ── Gærballonen med gærlås ───────────────────────────── */
export const BALLON = {x:150, y:140, b:210, h:290};

export function tegnBallon(g, {vaeske, uklar, skum, bundfald, rt, boblerIGaerlaas, T}){
  const {x, y, b, h} = BALLON;
  const venstre = x - b / 2, bund = y + h;
  const krop = () => {
    g.beginPath();
    g.moveTo(x - 20, y);
    g.lineTo(x - 20, y + 30);
    g.bezierCurveTo(venstre, y + 50, venstre, y + 70, venstre, y + 110);
    g.lineTo(venstre, bund - 24);
    g.quadraticCurveTo(venstre, bund, venstre + 24, bund);
    g.lineTo(venstre + b - 24, bund);
    g.quadraticCurveTo(venstre + b, bund, venstre + b, bund - 24);
    g.lineTo(venstre + b, y + 110);
    g.bezierCurveTo(venstre + b, y + 70, x + b / 2, y + 50, x + 20, y + 30);
    g.lineTo(x + 20, y);
    g.closePath();
  };
  const top = y + 92;
  g.save();
  krop(); g.clip();
  g.fillStyle = 'rgba(231,244,251,.7)'; g.fillRect(venstre, y, b, h);
  g.fillStyle = vaeske; g.fillRect(venstre, top, b, bund - top);
  if(uklar > 0){ g.fillStyle = `rgba(243,228,194,${0.55 * uklar})`; g.fillRect(venstre, top, b, bund - top); }
  /* skum (krausen) på toppen */
  if(skum > 0.02){
    g.beginPath();
    g.moveTo(venstre, top);
    for(let i = 0; i <= 16; i++){
      const xx = venstre + b * i / 16;
      g.lineTo(xx, top - 20 * skum - Math.abs(Math.sin(i * 1.7 + rt * 0.6)) * 8 * skum);
    }
    g.lineTo(venstre + b, top + 4); g.lineTo(venstre, top + 4); g.closePath();
    blaek(g, '#FFF6E0', 1.4);
  }
  /* bundfald af gær */
  if(bundfald > 0.01){
    const hb = 4 + 20 * bundfald;
    g.beginPath();
    g.moveTo(venstre, bund);
    for(let i = 0; i <= 16; i++){
      g.lineTo(venstre + b * i / 16, bund - hb - Math.sin(i * 2.3) * 2);
    }
    g.lineTo(venstre + b, bund); g.closePath();
    blaek(g, '#E6D2A2', 1.2);
  }
  g.restore();
  krop();
  blaek(g, null, 3);
  /* glans */
  g.beginPath(); g.moveTo(venstre + 16, y + 130); g.lineTo(venstre + 16, bund - 40);
  g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineCap = 'round'; g.stroke();
  g.lineCap = 'butt';

  /* prop og gærlås */
  boks(g, x - 24, y - 16, 48, 20, 5); blaek(g, '#B98A58', 2.4);
  boks(g, x - 4, y - 70, 8, 56, 3); blaek(g, '#fff', 2);
  g.beginPath(); g.ellipse(x, y - 78, 16, 20, 0, 0, Math.PI * 2); blaek(g, 'rgba(231,244,251,.9)', 2.2);
  g.save();
  g.beginPath(); g.ellipse(x, y - 78, 16, 20, 0, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#9BD7F3'; g.fillRect(x - 16, y - 76, 32, 22);
  g.restore();
  boks(g, x - 4, y - 108, 8, 14, 3); blaek(g, '#fff', 2);
  /* bobler, der slipper ud gennem gærlåsen */
  for(const bb of boblerIGaerlaas){
    g.beginPath(); g.arc(x + bb.dx, bb.y, bb.r, 0, Math.PI * 2);
    blaek(g, 'rgba(255,255,255,.9)', 1.3);
  }
  maerkat(g, 'Gærlås', x + 26, y - 88, {størrelse:9, justering:'left', farve:SLATE});

  /* termometerstrimmel på siden */
  const tx = venstre + b - 40, ty = y + 140;
  boks(g, tx, ty, 26, 96, 5); blaek(g, '#111', 1.6);
  for(let i = 0; i < 6; i++){
    const tt = 10 + i * 6;
    const aktiv = Math.abs(T - tt) < 3;
    boks(g, tx + 3, ty + 4 + i * 15, 20, 13, 3);
    blaek(g, aktiv ? '#5FB030' : '#2A3432', 0);
    maerkat(g, String(tt), tx + 13, ty + 11 + i * 15, {størrelse:8, farve:aktiv ? INK : '#8FA29E', stort:false, spær:0});
  }
}

/* ── Glasset ───────────────────────────────────────────── */
export function tegnGlas(g, x, y, {farve, skum, rt, uklar = 0}){
  const b0 = 110, b1 = 86, h = 230;
  const vej = () => {
    g.beginPath();
    g.moveTo(x - b0 / 2, y); g.lineTo(x + b0 / 2, y);
    g.lineTo(x + b1 / 2, y + h); g.quadraticCurveTo(x, y + h + 6, x - b1 / 2, y + h);
    g.closePath();
  };
  g.save(); vej(); g.clip();
  g.fillStyle = 'rgba(231,244,251,.6)'; g.fillRect(x - 60, y, 120, h + 10);
  const top = y + 26 + 20 * (1 - skum);
  g.fillStyle = farve; g.fillRect(x - 60, top, 120, h);
  if(uklar > 0){ g.fillStyle = `rgba(255,240,200,${0.4 * uklar})`; g.fillRect(x - 60, top, 120, h); }
  for(let i = 0; i < 16; i++){
    const u = (i * 0.618) % 1;
    const f = ((BLØDT ? rt : 0) * (0.25 + u * 0.3) + u) % 1;
    g.beginPath(); g.arc(x - 34 + u * 68, y + h - 6 - f * (h - 40), 1.6, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,.8)'; g.fill();
  }
  /* skum */
  g.beginPath();
  g.moveTo(x - 60, top + 6);
  for(let i = 0; i <= 10; i++){
    g.lineTo(x - 60 + 12 * i, top - 2 - 22 * skum - Math.abs(Math.sin(i * 1.9)) * 7 * skum);
  }
  g.lineTo(x + 60, top + 6); g.closePath();
  blaek(g, '#FFFBF0', 1.4);
  g.restore();
  vej(); blaek(g, null, 3);
  g.beginPath(); g.moveTo(x - b0 / 2 + 12, y + 20); g.lineTo(x - b1 / 2 + 10, y + h - 20);
  g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineCap = 'round'; g.stroke();
  g.lineCap = 'butt';
}

/* ── Hydrometeret ──────────────────────────────────────── *
 * Et hydrometer flyder højere i tung væske (Arkimedes' lov): jo mere
 * sukker, jo mindre af det skal under overfladen for at fortrænge sin
 * egen vægt. Skalaen aflæses ved overfladen.                        */
export function tegnHydrometer(g, x, y, sg, {vaeske, titel}){
  const b = 64, h = 200;
  const overflade = y + 40;
  boks(g, x - b / 2, y, b, h, 8);
  blaek(g, 'rgba(231,244,251,.6)', 2.4);
  g.save();
  boks(g, x - b / 2, y, b, h, 8); g.clip();
  g.fillStyle = vaeske; g.fillRect(x - b / 2, overflade, b, h);
  g.restore();
  /* Skalaen på stilken: 0,990 øverst, 1,070 nederst — de store tal
     sidder lavest, fordi hydrometeret flyder højere i tung væske.
     Hydrometeret lægges, så aflæsningen sidder ved overfladen. */
  const px = 1.3;
  const maerke = s => 6 + (s - 0.990) * 1000 * px;
  const stilkTop = overflade - maerke(sg);
  const kolbeY = stilkTop + 112;
  g.save();
  boks(g, x - 4, stilkTop, 8, 112, 3); blaek(g, '#fff', 1.8);
  g.beginPath(); g.ellipse(x, kolbeY + 22, 13, 26, 0, 0, Math.PI * 2); blaek(g, '#fff', 2);
  g.beginPath(); g.arc(x, kolbeY + 40, 7, 0, Math.PI * 2); blaek(g, SLATE, 1.6);
  for(let p = 0; p <= 80; p += 10){
    const sy = stilkTop + maerke(0.990 + p / 1000);
    g.beginPath(); g.moveTo(x - 4, sy); g.lineTo(x + (p % 20 ? 1 : 4), sy);
    g.lineWidth = 1.2; g.strokeStyle = INK; g.stroke();
  }
  /* den del, der er under overfladen, ses gennem væsken */
  boks(g, x - b / 2, y, b, h, 8); g.clip();
  g.globalAlpha = 0.55;
  g.fillStyle = vaeske; g.fillRect(x - b / 2, overflade, b, h);
  g.restore();
  /* overfladen */
  g.beginPath(); g.moveTo(x - b / 2 - 6, overflade); g.lineTo(x - 8, overflade);
  g.moveTo(x + 8, overflade); g.lineTo(x + b / 2 + 6, overflade);
  g.lineWidth = 1.6; g.strokeStyle = INK; g.stroke();
  maerkat(g, titel, x, y - 14, {størrelse:9.5, farve:SLATE});
  skilt(g, komma(sg, 3), x, y + h + 18, {størrelse:11, stort:false});
}

/* ── Maltsækken ────────────────────────────────────────── *
 * En sæk pr. maltsort i opskriften: mængden står på sækken, og en
 * lille bunke korn i maltens farve viser, hvor lys eller mørk den er. */
export function tegnSaek(g, x, y, {navn, kg, farve, fyld = 1, tom = false}){
  const b = 96, h = 84;
  const top = y + h * (1 - 0.75 * fyld);
  g.beginPath();
  g.moveTo(x - b / 2 + 8, top);
  g.quadraticCurveTo(x - b / 2 - 4, y + h * 0.6, x - b / 2 + 4, y + h);
  g.lineTo(x + b / 2 - 4, y + h);
  g.quadraticCurveTo(x + b / 2 + 4, y + h * 0.6, x + b / 2 - 8, top);
  g.quadraticCurveTo(x, top - 8, x - b / 2 + 8, top);
  blaek(g, tom ? '#F4F1E8' : '#E9DCC0', 2);
  /* kornbunke i toppen */
  if(!tom){
    g.beginPath(); g.ellipse(x, top + 2, b / 2 - 12, 7, 0, 0, Math.PI * 2);
    blaek(g, farve, 1.4);
  }
  maerkat(g, navn, x, y + h * 0.62, {størrelse:8.5, spær:0.6});
  maerkat(g, komma(kg, kg < 1 ? 2 : 1) + ' kg', x, y + h * 0.84, {størrelse:9.5, stort:false, spær:0.3, vægt:600});
}

/** En stråle, der falder fra (x, y0) ned til y1. */
export function tegnStraale(g, x, y0, y1, farve, rt, bredde = 5){
  g.save();
  g.beginPath();
  g.moveTo(x - bredde / 2, y0);
  for(let yy = y0; yy <= y1; yy += 6) g.lineTo(x - bredde / 2 + Math.sin(yy * 0.2 + rt * 12) * 0.8, yy);
  g.lineTo(x + bredde / 2, y1);
  g.lineTo(x + bredde / 2, y0);
  g.closePath();
  g.fillStyle = farve; g.fill();
  g.lineWidth = 1; g.strokeStyle = 'rgba(23,33,31,.5)'; g.stroke();
  g.restore();
}

/* ── Skylning: skyllevandsgryden, mæskekarret som sikar og kogekarret ── */
export const HLT = {x:24, y:44, b:140, h:96};
export const SIKAR = {x:84, y:196, b:228, h:162};
export const KAR2 = {x:318, y:372, b:262, h:108};

export function tegnSkyllevand(g, andel, T){
  const {x, y, b, h} = HLT;
  g.save();
  boks(g, x, y, b, h, 12); g.clip();
  g.fillStyle = '#F4F6F5'; g.fillRect(x, y, b, h);
  const top = y + h - (h - 12) * Math.max(0, Math.min(1, andel));
  g.fillStyle = '#CFEAF7'; g.fillRect(x, top, b, h);
  g.restore();
  boks(g, x, y, b, h, 12); blaek(g, null, 3);
  g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + b + 5, y);
  g.lineWidth = 5; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke(); g.lineCap = 'butt';
  maerkat(g, 'Skyllevand', x + 6, y - 16, {justering:'left', størrelse:10});
  skilt(g, komma(T, 0) + ' °C', x + b - 30, y + 22, {stort:false, størrelse:11, fyld:T > 80 ? '#FFD9C9' : PAPIR});
  /* røret til sprederen over sikarret */
  g.beginPath();
  g.moveTo(x + b, y + h - 14); g.lineTo(SIKAR.x + SIKAR.b / 2 + 40, y + h - 14);
  g.lineTo(SIKAR.x + SIKAR.b / 2 + 40, SIKAR.y - 22);
  g.lineTo(SIKAR.x + 26, SIKAR.y - 22);
  g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
  g.lineWidth = 3.5; g.strokeStyle = '#DCE3E1'; g.stroke();
}

/** Sprederen drypper, når der eftergydes. */
export function tegnSpreder(g, aktiv, rt){
  const y = SIKAR.y - 22;
  for(let i = 0; i < 9; i++){
    const x = SIKAR.x + 30 + i * 20;
    g.beginPath(); g.arc(x, y + 4, 2, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
    if(!aktiv) continue;
    const f = (((BLØDT ? rt : 0) * 1.6 + i * 0.37) % 1);
    g.beginPath(); g.ellipse(x, y + 8 + f * 26, 1.8, 3, 0, 0, Math.PI * 2);
    g.fillStyle = '#9BD7F3'; g.fill();
  }
}

/** Sikarret: kornlag på en falsk bund, fri væske over, hane i bunden. */
export function tegnSikar(g, {kg, vaeskeTop, vaeske, rt, loeber}){
  const {x, y, b, h} = SIKAR;
  const bund = y + h - 14;
  const lagTop = bund - Math.min(h - 40, 20 + kg * 17);
  g.save();
  boks(g, x, y, b, h, 14); g.clip();
  g.fillStyle = '#F4F6F5'; g.fillRect(x, y, b, h);
  /* væsken — over og mellem kornene */
  g.fillStyle = vaeske; g.fillRect(x, vaeskeTop, b, bund - vaeskeTop);
  /* kornlaget */
  const tilfaeldig = n => { const t = Math.sin(n * 12.9898) * 43758.5453; return t - Math.floor(t); };
  for(let i = 0; i < 170; i++){
    const u = tilfaeldig(i + 1), v = tilfaeldig(i + 500);
    const kx = x + 8 + u * (b - 16), ky = lagTop + 4 + v * (bund - lagTop - 8);
    g.save(); g.translate(kx, ky); g.rotate(tilfaeldig(i + 900) * Math.PI);
    g.beginPath(); g.ellipse(0, 0, 5, 2.4, 0, 0, Math.PI * 2);
    g.fillStyle = '#C99A4B'; g.fill();
    g.lineWidth = 0.9; g.strokeStyle = 'rgba(23,33,31,.45)'; g.stroke();
    g.restore();
  }
  /* falsk bund med huller */
  g.fillStyle = '#DCE3E1'; g.fillRect(x, bund, b, 14);
  g.restore();
  g.beginPath(); g.moveTo(x, bund); g.lineTo(x + b, bund);
  g.setLineDash([6, 4]); g.lineWidth = 2; g.strokeStyle = INK; g.stroke(); g.setLineDash([]);
  boks(g, x, y, b, h, 14); blaek(g, null, 3);
  g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + b + 5, y);
  g.lineWidth = 5; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke(); g.lineCap = 'butt';
  /* hanen */
  const hy = y + h - 7;
  boks(g, x + b - 2, hy - 5, 36, 10, 3); blaek(g, '#DCE3E1', 2);
  boks(g, x + b + 26, hy - 5, 8, 18, 2); blaek(g, '#DCE3E1', 2);
  g.beginPath(); g.arc(x + b + 16, hy - 10, 5, 0, Math.PI * 2);
  blaek(g, loeber ? '#5FB030' : '#FFFFFF', 2);
  maerkat(g, 'Kornlag', x + 10, lagTop + 12, {justering:'left', størrelse:8.5, farve:INK});
  return {lagTop, bund, hane:{x:x + b + 30, y:hy + 13}};
}

/** Det lille kogekar under hanen. */
export const KAR2_L = 36;
export function kar2Niveau(V){ return KAR2.y + KAR2.h - (KAR2.h - 12) * Math.min(1, V / KAR2_L); }
export function tegnKar2(g, V, vaeske, rt){
  const {x, y, b, h} = KAR2;
  g.save();
  boks(g, x, y, b, h, 12); g.clip();
  g.fillStyle = '#F4F6F5'; g.fillRect(x, y, b, h);
  const top = kar2Niveau(V);
  g.beginPath(); g.moveTo(x, top);
  for(let i = 0; i <= 16; i++) g.lineTo(x + b * i / 16, top + Math.sin(rt * 3 + i) * 1.2);
  g.lineTo(x + b, y + h); g.lineTo(x, y + h); g.closePath();
  g.fillStyle = vaeske; g.fill();
  g.restore();
  boks(g, x, y, b, h, 12); blaek(g, null, 3);
  g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + b + 5, y);
  g.lineWidth = 5; g.strokeStyle = INK; g.lineCap = 'round'; g.stroke(); g.lineCap = 'butt';
  for(const L of [10, 20, 30]){
    const ly = kar2Niveau(L);
    g.beginPath(); g.moveTo(x + b - 14, ly); g.lineTo(x + b - 4, ly);
    g.lineWidth = 1.6; g.strokeStyle = INK; g.stroke();
    maerkat(g, L + ' L', x + b - 18, ly, {størrelse:8.5, justering:'right', stort:false, spær:0.3, farve:SLATE});
  }
}
