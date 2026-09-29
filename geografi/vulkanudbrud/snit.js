/* snit.js — tværsnittet gennem vulkanen: skorpen, dæklaget, kammeret,
   tilførslen fra neden, kanalen op til krateret og magmaet i den.
   Kun dybdeaksen er målfast — kanalen er tegnet mange gange for bred
   (en rigtig kanal er 10–100 m bred), så man kan se, hvad der sker i den. */

import * as M from './model.js';

export const W = 640, H = 560;
export const XC = 318;                 // kanalens midte, px
export const Y_KRATER = 118;           // px
export const KM = 33;                  // px pr. km
export const Z_MAKS = 12;              // km — dybdeaksens bund
export const yZ = z => Y_KRATER + z * KM;
export const zY = y => (y - Y_KRATER) / KM;

const INK = '#17211F';
const SMELTE = '#EE6A25', SMELTE_DYB = '#D9441F', SKUM = '#F7B53B', ASKE = '#9C958D';
const PROP = '#3E3734';

// Geometri, som også vulkantypernes egne tegninger bruger
export function geometri(type, tilst){
  // Kammerets overtryk løfter jorden en smule over det (inflation)
  const loeftMaks = 4 * (tilst.overtryk / tilst.brud);
  const loeft = x => loeftMaks * Math.exp(-(((x - XC) / 150) ** 2));
  return { W, H, XC, Y_KRATER, KM, yZ, zY, loeft };
}

// ── Kanalens bredde: smal nede, udvider sig lidt mod krateret ──
const halvbredde = z => 7 + 4 * Math.exp(-z / 0.8);

// ── Farve i kanalen, efter hvor langt magmaet er nået ──
function farveVed(z, gr){
  if (gr.zFrag !== null && z <= gr.zFrag) return ASKE;
  if (z <= gr.zBobler){
    const t = Math.min(1, (gr.zBobler - z) / Math.max(0.2, gr.zBobler - (gr.zFrag ?? 0)));
    return blend(SMELTE, SKUM, t);
  }
  return SMELTE;
}
function blend(a, b, t){
  const p = h => h[0] === '#' ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) : h.match(/\d+/g).map(Number);
  const A = p(a), B = p(b);
  return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')';
}

// ── Partikler: bobler i kanalen, krystaller i kammeret ──
const kanalP = Array.from({ length: 90 }, () => ({ z: Math.random() * 6, u: Math.random() * 2 - 1, s: 0.6 + Math.random() * 0.8 }));
const kammerP = Array.from({ length: 46 }, () => ({ th: Math.random() * 2 * Math.PI, r: 0.2 + Math.random() * 0.72, rot: Math.random() * Math.PI, s: Math.random() }));

// Magmaets fart i snittet, km/s på skærmen (stærkt komprimeret i forhold til virkeligheden)
export const visFart = (p, magma) => Math.min(6, 0.5 * Math.pow(magma.rho / p.rho, 0.45));

export function opdater(dt, type, tilst){
  const magma = tilst.magma;
  const flyder = tilst.fase === 'aabner' || tilst.fase === 'udbrud';
  const bund = type.kammer.top + 0.15;
  const top = Math.max(0, tilst.front);
  for (const p of kanalP){
    if (flyder) p.z -= visFart(M.punkt(p.z, magma), magma) * dt;
    if (p.z < top - 0.02 || p.z > bund){
      p.z = bund - Math.random() * (flyder ? 0.2 : bund - top); p.u = Math.random() * 2 - 1;
    }
  }
  const omloeb = flyder ? 0.22 : 0.07;               // konvektion i kammeret
  for (const p of kammerP) p.th += omloeb * dt * (1.2 - p.r);
}

// ── Tegning ────────────────────────────────────────────
export function tegn(c, type, tilst, gr, lupeZ, foelger){
  const geo = geometri(type, tilst);
  const magma = tilst.magma;
  const yFod = yZ(type.bjerg.hoejde);

  // himmel
  const hg = c.createLinearGradient(0, 0, 0, yFod);
  hg.addColorStop(0, '#CFE9F7'); hg.addColorStop(1, '#F3FAFE');
  c.fillStyle = hg; c.fillRect(0, 0, W, yFod + 1);

  // skorpen i bånd, mørkere brun øverst og grålig nedad — som i grundbogen
  for (let z = type.bjerg.hoejde, i = 0; z < Z_MAKS + 2; z += 0.85, i++){
    const t = Math.min(1, (z - type.bjerg.hoejde) / 10);
    const base = blend('#76584A', '#8E8B88', t);
    c.fillStyle = i % 2 ? base : blend(base, '#FFFFFF', 0.07);
    c.fillRect(0, yZ(z), W, 0.85 * KM + 1);
  }

  // dæklaget: tæt lag, som magmaet har svært ved at trænge igennem
  if (type.daeklag){
    const y0 = yZ(type.daeklag.top), y1 = yZ(type.daeklag.bund);
    c.save();
    c.fillStyle = '#4C555A'; c.fillRect(0, y0, W, y1 - y0);
    c.beginPath(); c.rect(0, y0, W, y1 - y0); c.clip();
    c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 1.5;
    for (let x = -40; x < W + 40; x += 9){ c.beginPath(); c.moveTo(x, y1); c.lineTo(x + 20, y0); c.stroke(); }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(0, y0); c.lineTo(W, y0); c.moveTo(0, y1); c.lineTo(W, y1); c.stroke();
  }

  // bjerget
  type.tegnBjerg(c, geo);
  // jordoverfladen
  c.beginPath();
  for (let x = 0; x <= W; x += 2){
    const y = Math.abs(x - XC) < type.bjerg.radius + 4 ? type.overflade(x, geo) : yFod - geo.loeft(x);
    if (x === 0) c.moveTo(x, y); else c.lineTo(x, y);
  }
  c.strokeStyle = INK; c.lineWidth = 2; c.stroke();

  // ── tilførslen nedefra (fødegang) ──
  const k = type.kammer;
  const inflat = 1 + 0.06 * tilst.overtryk / tilst.brud;
  const zc = (k.top + k.bund) / 2;
  const ry = (k.bund - k.top) / 2 * KM * inflat, rx = k.halvbredde * inflat;
  const ycK = yZ(zc);
  c.beginPath();
  for (let y = ycK; y <= H + 4; y += 4){
    const x = XC + 5 * Math.sin(y / 23);
    if (y === ycK) c.moveTo(x - 6, y); else c.lineTo(x - 6, y);
  }
  for (let y = H + 4; y >= ycK; y -= 4) c.lineTo(XC + 5 * Math.sin(y / 23) + 6, y);
  c.closePath();
  c.fillStyle = SMELTE_DYB; c.fill();
  c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();

  // ── kanalen ──
  const zTop = Math.max(0, tilst.front);
  const zBund = k.top + 0.25;
  const yTopK = type.overflade(XC, geo);
  const kanalSti = () => {
    c.beginPath();
    for (let z = 0; z <= zBund; z += 0.05) c.lineTo(XC - halvbredde(z), z === 0 ? yTopK : yZ(z));
    for (let z = zBund; z >= 0; z -= 0.05) c.lineTo(XC + halvbredde(z), z <= 0.001 ? yTopK : yZ(z));
    c.closePath();
  };
  // prop af størknet magma, hvor der ikke er magma
  kanalSti(); c.fillStyle = PROP; c.fill();
  // magma fra fronten og ned — farvet efter bobler og aske
  if (zTop < zBund){
    c.save(); kanalSti(); c.clip();
    for (let z = zTop; z < zBund; z += 0.05){
      c.fillStyle = farveVed(z, gr);
      const y = z <= 0.001 ? yTopK - 2 : yZ(z);
      c.fillRect(XC - 14, y, 28, Math.max(0.05 * KM + 1, yZ(z + 0.05) - y + 1));
    }
    // bobler og aske, der stiger op
    for (const p of kanalP){
      if (p.z < zTop || p.z > zBund) continue;
      const pk = M.punkt(p.z, magma);
      const x = XC + p.u * (halvbredde(p.z) - 2.5), y = yZ(p.z);
      if (pk.fragmenteret){
        c.fillStyle = '#4A4540';
        c.fillRect(x - 1, y - 1, 2.2, 2.2);
      } else if (pk.gasandel > 0.002){
        c.beginPath(); c.arc(x, y, Math.min(4.5, 0.7 + 4 * pk.gasandel * p.s), 0, 2 * Math.PI);
        c.fillStyle = '#FFF6D6'; c.fill();
        c.strokeStyle = 'rgba(120,50,10,.6)'; c.lineWidth = 0.8; c.stroke();
      }
    }
    c.restore();
  }
  kanalSti(); c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke();

  // ── kammeret ──
  const kammerSti = () => {
    c.beginPath();
    for (let i = 0; i <= 60; i++){
      const u = -1 + 2 * i / 60;
      const f = Math.sqrt(Math.max(0, 1 - u * u));
      c.lineTo(XC + u * rx, ycK - ry * f * (1 + 0.14 * Math.sin(6 * u) * u));
    }
    for (let i = 60; i >= 0; i--){
      const u = -1 + 2 * i / 60;
      const f = Math.sqrt(Math.max(0, 1 - u * u));
      c.lineTo(XC + u * rx, ycK + ry * f * (1 + 0.1 * Math.sin(5 * u + 1) * u));
    }
    c.closePath();
  };
  // små sidegange (sills), hvor magmaet har presset sig ind mellem lagene
  c.fillStyle = SMELTE; c.strokeStyle = INK; c.lineWidth = 1.5;
  for (const [dx, dz, b] of [[-1, -0.35, 70], [1, 0.25, 58]]){
    c.beginPath();
    const x0 = XC + dx * rx * 0.8, y0 = yZ(zc + dz);
    c.moveTo(x0, y0 - 5);
    c.quadraticCurveTo(x0 + dx * b * 0.6, y0 - 6, x0 + dx * b, y0);
    c.quadraticCurveTo(x0 + dx * b * 0.6, y0 + 6, x0, y0 + 5);
    c.closePath(); c.fill(); c.stroke();
  }
  kammerSti();
  const kg = c.createRadialGradient(XC, ycK + ry * 0.5, 4, XC, ycK, rx);
  kg.addColorStop(0, SMELTE_DYB); kg.addColorStop(1, SMELTE);
  c.fillStyle = kg; c.fill();
  c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
  // åbningen op i kanalen og ned i fødegangen: ingen streg hen over
  c.fillStyle = zTop < zBund ? farveVed(k.top, gr) : PROP;
  c.fillRect(XC - halvbredde(k.top) + 0.9, ycK - ry - 3, 2 * halvbredde(k.top) - 1.8, 8);
  c.fillStyle = SMELTE_DYB;
  c.fillRect(XC - 5, ycK + ry - 6, 10, 10);

  // krystaller og evt. bobler i kammeret
  c.save(); kammerSti(); c.clip();
  for (const p of kammerP){
    const x = XC + Math.cos(p.th) * p.r * rx, y = ycK + Math.sin(p.th) * p.r * ry;
    const pk = M.punkt(zY(y), magma, tilst.overtryk);
    if (pk.gasandel > 0.002 && p.s > 0.5){
      c.beginPath(); c.arc(x, y, Math.min(4, 0.8 + 4 * pk.gasandel), 0, 2 * Math.PI);
      c.fillStyle = '#FFF6D6'; c.fill();
    } else {
      c.save(); c.translate(x, y); c.rotate(p.rot + p.th * 0.3);
      c.fillStyle = p.s < 0.6 ? 'rgba(255,255,255,.85)' : 'rgba(80,120,90,.9)';
      c.fillRect(-2.2, -0.9, 4.4, 1.8);
      c.restore();
    }
  }
  c.restore();

  // ── udbruddet over krateret ──
  type.udbrud.tegn(c, geo, tilst);

  // ── de to grænser i kanalen ──
  const linjer = [];
  if (gr.zBobler > 0.05 && gr.zBobler < Z_MAKS)
    linjer.push({ z: gr.zBobler, tekst: 'GASBOBLER DANNES', farve: '#0E86C8' });
  if (gr.zFrag !== null && gr.zFrag > 0.02)
    linjer.push({ z: gr.zFrag, tekst: 'SKUMMET SPRÆNGES', farve: '#E8336D' });
  c.save();
  for (const l of linjer){
    const y = yZ(l.z);
    c.setLineDash([5, 4]); c.lineWidth = 2; c.strokeStyle = l.farve;
    c.beginPath(); c.moveTo(XC - 46, y); c.lineTo(XC + 30, y); c.stroke();
  }
  c.restore();

  // ── dybdeaksen ──
  tegnAkse(c);

  // ── mærkater ──
  const maerk = [];
  for (const l of linjer)
    maerk.push({ tekst: l.tekst, enhed: tal(l.z) + ' km', x: XC - 150, y: yZ(l.z) + 5, kant: l.farve, mod: yZ(l.z), modX: XC - 46 });
  maerk.push({ tekst: 'MAGMAKAMMER', x: XC + rx - 8, y: yZ(k.bund) + 20 });
  if (type.daeklag) maerk.push({ tekst: 'TÆT DÆKLAG', x: W - 70, y: yZ((type.daeklag.top + type.daeklag.bund) / 2) + 5 });
  if (zTop > 0.2) maerk.push({ tekst: 'STØRKNET PROP', x: XC + 92, y: yZ(Math.min(zTop, 3) / 2 + 0.3), mod: yZ(Math.min(zTop, 3) / 2 + 0.3) - 5, modX: XC + 9 });
  maerk.push(...type.udbrud.maerkater(geo, tilst));
  tegnMaerkater(c, maerk);

  // tilførslen nedefra og en note om målestokken
  tegnFodnote(c, '↑ ' + type.kilde, W - 8, 'right');
  tegnFodnote(c, 'SKEMATISK · KUN DYBDEN ER MÅLFAST', 48, 'left', 18);

  // ── lupen ──
  tegnLupemaerke(c, lupeZ, foelger, type, geo);
}

const tal = (v, n = 1) => v.toLocaleString('da-DK', { minimumFractionDigits: n, maximumFractionDigits: n });

export function tegnFodnote(c, tekst, x, side, y = H - 9){
  c.save();
  c.font = "600 9.5px 'IBM Plex Mono', ui-monospace, monospace";
  const w = c.measureText(tekst).width + 12;
  const x0 = side === 'right' ? x - w : x;
  c.fillStyle = 'rgba(23,33,31,.62)';
  c.beginPath(); c.roundRect(x0, y - 11, w, 16, 8); c.fill();
  c.fillStyle = '#FFF6E0'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillText(tekst, x0 + 6, y + 0.5);
  c.restore();
}

function tegnAkse(c){
  const x = 30;
  c.save();
  c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x, yZ(0)); c.lineTo(x, yZ(Z_MAKS)); c.stroke();
  c.font = "600 10px 'IBM Plex Mono', ui-monospace, monospace";
  c.textAlign = 'left'; c.textBaseline = 'middle';
  for (let z = 0; z <= Z_MAKS; z += 2){
    c.beginPath(); c.moveTo(x - 5, yZ(z)); c.lineTo(x + 5, yZ(z)); c.stroke();
    c.fillStyle = 'rgba(255,249,238,.9)';
    c.fillRect(x + 7, yZ(z) - 7, z >= 10 ? 19 : 12, 14);
    c.fillStyle = INK; c.fillText(String(z), x + 9, yZ(z) + 0.5);
  }
  for (let z = 1; z < Z_MAKS; z += 2){ c.beginPath(); c.moveTo(x - 3, yZ(z)); c.lineTo(x + 3, yZ(z)); c.stroke(); }
  c.translate(14, yZ(Z_MAKS / 2));
  c.rotate(-Math.PI / 2);
  c.textAlign = 'center';
  c.fillStyle = '#FFF6E0';
  c.fillText('DYBDE UNDER KRATERET · km', 0, 0);
  c.restore();
}

function tegnLupemaerke(c, z, foelger, type, geo){
  const y = z <= 0.001 ? type.overflade(XC, geo) : yZ(z);
  tegnMarkoer(c, XC, y, foelger ? 'MAGMAPAKKEN' : 'LUPEN', foelger);
}

// Ringen om det sted, lupen kigger på, med en stiplet streg over mod lupen
export function tegnMarkoer(c, x, y, tekst, fremhaev){
  c.save();
  c.strokeStyle = INK; c.lineWidth = 1.6;
  c.setLineDash([2, 3]);
  c.beginPath(); c.moveTo(x + 13, y); c.lineTo(W - 6, y); c.stroke();
  c.setLineDash([]);
  c.beginPath(); c.moveTo(W - 12, y - 5); c.lineTo(W - 4, y); c.lineTo(W - 12, y + 5); c.stroke();
  c.beginPath(); c.arc(x, y, 12, 0, 2 * Math.PI);
  c.lineWidth = 4; c.strokeStyle = '#FFF9EE'; c.stroke();
  c.lineWidth = 2.2; c.strokeStyle = fremhaev ? '#7A4FD6' : INK; c.stroke();
  c.font = "700 9px 'IBM Plex Mono', ui-monospace, monospace";
  c.textAlign = 'right';
  c.fillStyle = 'rgba(255,249,238,.94)';
  const w = c.measureText(tekst).width + 10;
  c.beginPath(); c.roundRect(W - 12 - w, y - 17, w, 13, 6); c.fill();
  c.fillStyle = INK; c.fillText(tekst, W - 17, y - 7.5);
  c.restore();
}

// Mærkater i sidens stil: pille med blækkant, evt. med en streg ind til det, de peger på
export function tegnMaerkater(c, maerk){
  c.save();
  const brugt = [];
  for (const m of maerk){
    c.font = "600 10.5px 'IBM Plex Mono', ui-monospace, monospace";
    const wT = c.measureText(m.tekst).width;
    const wE = m.enhed ? c.measureText(' ' + m.enhed).width : 0;
    const w = wT + wE + 14;
    const x = Math.max(w / 2 + 44, Math.min(W - w / 2 - 3, m.x));
    let y = Math.max(19, Math.min(H - 24, m.y));
    while (brugt.some(b => Math.abs(b.y - y) < 20 && Math.abs(b.x - x) < (b.w + w) / 2 + 4)) y -= 21;
    brugt.push({ x, y, w });
    if (m.mod !== undefined){
      c.strokeStyle = m.kant || INK; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(m.modX ?? x, m.mod);
      c.lineTo(Math.max(x - w / 2, Math.min(x + w / 2, m.modX ?? x)), y - 5); c.stroke();
    }
    c.fillStyle = 'rgba(255,249,238,.95)';
    c.strokeStyle = m.kant || INK; c.lineWidth = m.kant ? 2 : 1.5;
    c.beginPath(); c.roundRect(x - w / 2, y - 14, w, 19, 9); c.fill(); c.stroke();
    c.fillStyle = INK; c.textAlign = 'left';
    c.fillText(m.tekst, x - w / 2 + 7, y - 1);
    if (m.enhed){ c.fillStyle = '#566B68'; c.fillText(' ' + m.enhed, x - w / 2 + 7 + wT, y - 1); }
  }
  c.restore();
}
