/* opskyl.js — opskyl, tilbageskyl, nedsivning og sandkornene.
   Hver bølge, der når kystlinjen, bliver til én tunge vand, der skyller op
   ad stranden og løber tilbage igen. Varer det længere, end der er mellem
   to bølger, overlapper tungerne: den nye bølges opskyl løber ind i den
   forriges tilbageskyl og bremses. Er der tid til overs, siver en del af
   vandet ned i sandet, mens tilbageskyllet løber. */

import { OP_ANDEL } from './model.js';
import { XS, KLIT_X, px, py, bundZ, revleX } from './strand.js';

// Hvor langt ind ad stranden (vandret, m) når vandet op til en given højde?
export function raekkevidde(h){
  let x = XS;
  while (x < KLIT_X - 0.5 && bundZ(x) < h) x += 0.1;
  return Math.max(0.6, x - XS);
}

function frontAndel(tau){
  if (tau < OP_ANDEL) return Math.sin(tau / OP_ANDEL * Math.PI / 2);
  return Math.cos((tau - OP_ANDEL) / (1 - OP_ANDEL) * Math.PI / 2);
}

// ── Tungerne ───────────────────────────────────────────
const tunger = [];

export function nyBoelge(t, m){
  tunger.push({ t0: t, R: raekkevidde(m.opskylsHoejde), tS: m.tSkyl,
                p: m.nedsivning, h0: 0.10 + 0.04 * m.u0 });
  if (tunger.length > 6) tunger.shift();
}

export function nulstilTunger(){ tunger.length = 0; }

// Stillingen lige nu: hvor langt hver tunge er nået, og om den er på vej
// op eller ned. Tungerne står ældst først.
export function stilling(t){
  for (let i = tunger.length - 1; i >= 0; i--)
    if (t - tunger[i].t0 > tunger[i].tS) tunger.splice(i, 1);
  const st = tunger.map(tu => {
    const tau = (t - tu.t0) / tu.tS;
    return { tu, tau, f: tu.R * frontAndel(tau), op: tau < OP_ANDEL };
  });
  // Dér, hvor et nyt opskyl er nået op til vand, der stadig løber tilbage
  let moede = null;
  for (let i = 0; i < st.length; i++){
    if (!st[i].op) continue;
    for (let j = 0; j < i; j++){
      if (!st[j].op && st[j].f > st[i].f && st[i].f > 0.4) moede = st[i].f;
    }
  }
  return { st, moede };
}

// ── Tegning af vandet på stranden ──────────────────────
export function tegnTunger(c, sk){
  c.save();
  for (const s of sk.st){
    const { tu, tau, f } = s;
    if (f < 0.05) continue;
    const tynd = s.op ? 1 : 1 - tu.p * (tau - OP_ANDEL) / (1 - OP_ANDEL);
    const h0 = tu.h0 * Math.max(0.35, tynd);
    c.beginPath();
    c.moveTo(px(XS - 0.5), py(bundZ(XS - 0.5)));
    for (let x = XS; x <= XS + f; x += 0.25) c.lineTo(px(x), py(bundZ(x)));
    for (let x = XS + f; x >= XS - 0.5; x -= 0.25){
      const xi = Math.max(0, (x - XS) / f);
      c.lineTo(px(x), py(bundZ(x) + h0 * Math.pow(1 - Math.min(1, xi), 0.5)) - 1);
    }
    c.closePath();
    c.fillStyle = s.op ? 'rgba(127,203,236,.95)' : 'rgba(88,176,222,.92)';
    c.fill();
    c.lineWidth = 1.5; c.strokeStyle = '#17211F'; c.stroke();

    // skumkant forrest i opskyllet
    if (s.op){
      const yf = py(bundZ(XS + f)) - 2;
      c.fillStyle = '#fff'; c.strokeStyle = 'rgba(23,33,31,.55)'; c.lineWidth = 1;
      for (let i = 0; i < 3; i++){
        c.beginPath();
        c.arc(px(XS + f) - i * 3.4, yf - i * 1.4, 2.4 - i * 0.5, 0, 6.284);
        c.fill(); c.stroke();
      }
    }
  }
  c.restore();
}

// Nedsivningen: små streger ned i sandet, mens tilbageskyllet løber.
// Antallet følger den andel af vandet, der når at synke ned.
export function tegnNedsivning(c, sk){
  c.save();
  c.strokeStyle = '#12628F'; c.lineWidth = 2; c.lineCap = 'round';
  for (const s of sk.st){
    const { tu, tau } = s;
    if (s.op || tu.p < 0.02) continue;
    const q = (tau - OP_ANDEL) / (1 - OP_ANDEL);     // 0 → 1 gennem tilbageskyllet
    const n = Math.max(1, Math.round(tu.p * 18));
    c.globalAlpha = Math.max(0, 1 - q);
    for (let i = 0; i < n; i++){
      const x = XS + tu.R * (0.18 + 0.72 * (i + 0.5) / n);
      if (x > XS + s.f + tu.R * 0.05) {              // kun dér, hvor vandet lige har ligget
        const y = py(bundZ(x)) + 4 + q * 12;
        c.beginPath(); c.moveTo(px(x), y); c.lineTo(px(x), y + 6); c.stroke();
        c.beginPath(); c.moveTo(px(x) - 2.5, y + 3.5); c.lineTo(px(x), y + 6.5); c.lineTo(px(x) + 2.5, y + 3.5); c.stroke();
      }
    }
  }
  c.restore();
}

// Hvor nyt opskyl møder gammelt tilbageskyl: sprøjt og skum.
export function tegnMoede(c, sk){
  if (sk.moede === null) return;
  const x = XS + sk.moede, y = py(bundZ(x)) - 5;
  c.save();
  c.fillStyle = '#fff'; c.strokeStyle = 'rgba(23,33,31,.6)'; c.lineWidth = 1;
  for (let i = 0; i < 7; i++){
    const r = 2 + Math.random() * 3.5;
    c.beginPath();
    c.arc(px(x) + (Math.random() - 0.5) * 16, y - Math.random() * 12, r, 0, 6.284);
    c.fill(); c.stroke();
  }
  c.restore();
}

// ── Sandkornene ────────────────────────────────────────
// Kornene rider op og ned med vandet, og samtidig driver de langsomt den
// vej, modellen siger: op mod opskyllets øverste kant (bermen), eller ned
// forbi kystlinjen og ud til revlen — og tilbage igen.
const korn = [];

export function saaKorn(){
  korn.length = 0;
  for (let i = 0; i < 70; i++){
    const hav = i < 28;
    korn.push({
      x: hav ? revleX() + (Math.random() - 0.5) * 14 : XS + 0.5 + Math.random() * 11,
      hav, v: 0.7 + Math.random() * 0.6, j: Math.random() - 0.5, vis: 0,
      r: 2 + Math.random() * 1.4
    });
  }
}

export function flytKorn(dt, t, m, sk){
  const nyeste = sk.st.length ? sk.st[sk.st.length - 1] : null;
  const R = raekkevidde(m.opskylsHoejde);
  for (const k of korn){
    if (!k.hav){
      const s = k.x - XS;
      if (s < R){
        // netto drift: pr. bølge flyttes kornet en stump, der følger balancen
        k.x += dt * k.v * 0.35 * Math.max(R, 3) * m.balance / m.T;
        k.x = Math.min(k.x, XS + R);
      }
      // kornet rider med vandet, mens det er dækket
      const f = nyeste ? nyeste.f : 0;
      k.vis = (nyeste && f > s) ? Math.min(2.2, 0.12 * R) * frontAndel(nyeste.tau) * k.v : 0;
      if (k.x < XS - 1.2){ k.hav = true; k.vis = 0; }
    } else {
      const b = m.balance, fart = (0.3 + 2 * Math.abs(b)) * k.v;
      if (b > 0.04){
        k.x += dt * fart;
        if (k.x >= XS - 1.2){ k.hav = false; k.x = XS - 0.8; }
      } else if (b < -0.04){
        const maal = revleX() + k.j * 16;
        if (Math.abs(k.x - maal) > 0.3) k.x += Math.sign(maal - k.x) * dt * fart;
      }
    }
  }
}

export function tegnKorn(c){
  c.save(); c.fillStyle = '#5E4318';
  for (const k of korn){
    const x = k.x + k.vis;
    c.fillRect(px(x) - k.r / 2, py(bundZ(x)) - k.r - 0.5, k.r, k.r);
  }
  c.restore();
}

// Til mærkaterne: hvor er den nyeste tunge, og hvilken vej løber den?
export function forreste(sk){
  if (!sk.st.length) return null;
  const s = sk.st[sk.st.length - 1];
  return { x: XS + s.f, op: s.op };
}
