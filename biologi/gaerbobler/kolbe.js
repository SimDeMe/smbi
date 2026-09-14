/* ═══════════════════════════════════════════════════════════
   kolbe.js — den koniske kolbe: form, indhold og tegning.

   Kolben viser sit eget indhold: tørt sukker og tør gær ligger
   som bunker, den tørre blanding bliver flydende af sig selv,
   og når der er vand i, står der en grumset gærsuspension med
   bobler og skum — jo hurtigere gæringen går, jo mere skum.
   ═══════════════════════════════════════════════════════════ */
import {INK, blaek, boks, maerkat, tekst, BLØDT} from './model.js';
import {harBlanding} from './gaering.js';

/* Målene på en 250 mL konisk kolbe, regnet fra bunden af glasset. */
export const K = {bund:58, skulder:96, hals:17, halsTop:132, halsR:16};

/** Kolbens omrids. (x, y) er midten af bunden. */
export function kolbeSti(g, x, y, lukket = true){
  g.beginPath();
  g.moveTo(x - K.halsR, y - K.halsTop);
  g.lineTo(x - K.hals,  y - K.skulder);
  g.lineTo(x - K.bund,  y - 11);
  g.arcTo(x - K.bund, y, x - K.bund + 11, y, 11);
  g.lineTo(x + K.bund - 11, y);
  g.arcTo(x + K.bund, y, x + K.bund, y - 11, 11);
  g.lineTo(x + K.hals,  y - K.skulder);
  g.lineTo(x + K.halsR, y - K.halsTop);
  if(lukket) g.closePath();
}

/** Kolbens halve bredde i højden h over bunden. */
export function halvBredde(h){
  if(h >= K.skulder) return K.halsR;
  return K.bund - (K.bund - K.hals) * (h / K.skulder);
}

/** Væskens højde over bunden ved et givet rumfang i mL. */
export function vaeskeHoejde(mL){
  return mL <= 0 ? 0 : Math.min(K.skulder + 8, 58 * Math.pow(mL / 100, 0.8));
}

/** Det rumfang, kolbens indhold fylder — vand plus det opløste. */
export function rumfang(k){
  return k.vand + k.sukker * 0.63 + k.gaer * 0.9;
}

export function kolbeKasse(k){
  const {x, y} = kolbePos(k);
  return {x0:x - K.bund - 5, x1:x + K.bund + 5, y0:y - K.halsTop - 12, y1:y + 7};
}

/** Hvor kolben står lige nu — på sin plads, eller i hånden. */
export function kolbePos(k){
  if(k.hånd) return k.hånd;
  return {x:k.plads ? k.plads.x : 0, y:k.plads ? k.plads.top : 0};
}

/** Ophængspunktet for proppen med gærrøret. */
export function propPunkt(k){
  const {x, y} = kolbePos(k);
  return {x, y:y - K.halsTop + 8};
}

/* ── Boblerne inde i væsken ────────────────────────────── *
 * Der kommer først bobler at se, når væsken er mættet med CO₂ —
 * indtil da går den dannede gas i opløsning. Derfor følger
 * boblerne `slip` og ikke `hastighed`.                          */
export function opdaterIndreBobler(k, dt){
  const h = vaeskeHoejde(rumfang(k));
  if(harBlanding(k) && k.slip > 0.5 && BLØDT){
    k.bobleFase += dt * Math.min(26, k.slip * 0.5);
    while(k.bobleFase >= 1){
      k.bobleFase -= 1;
      const b = halvBredde(4) * 0.82;
      k.indreBobler.push({
        x:(Math.random() * 2 - 1) * b,
        h:Math.random() * 8,
        r:1.4 + Math.random() * 2.4,
        v:16 + Math.random() * 22,
      });
    }
  }
  for(const b of k.indreBobler){ b.h += b.v * dt; b.v += 10 * dt; }
  k.indreBobler = k.indreBobler.filter(b => b.h < h - 2).slice(-70);
}

/* ── Tegning ───────────────────────────────────────────── */

export function tegnKolbe(g, k, {valgt = false, ur = 0} = {}){
  if(!k.plads && !k.hånd) return;
  const {x, y} = kolbePos(k);

  g.save();

  /* Skygge på bordet */
  g.fillStyle = 'rgba(23,33,31,.22)';
  g.beginPath(); g.ellipse(x + 5, y + 2, K.bund + 3, 7, 0, 0, Math.PI * 2); g.fill();

  /* Indholdet klippes til glassets form */
  g.save();
  kolbeSti(g, x, y);
  g.clip();

  const mL = rumfang(k);
  const h  = vaeskeHoejde(mL);

  if(k.vand > 0){
    tegnVaeske(g, k, x, y, h, ur);
  } else {
    tegnToert(g, k, x, y);
  }
  g.restore();

  /* Selve glasset */
  kolbeSti(g, x, y);
  g.fillStyle = 'rgba(214,236,240,.20)';
  g.fill();
  g.lineWidth = 2.6; g.strokeStyle = INK; g.stroke();

  /* Glansen — én stribe, så det ligner glas uden at larme */
  g.save();
  g.globalAlpha = .55;
  g.strokeStyle = '#FFFFFF'; g.lineWidth = 5; g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x - K.bund + 21, y - 16);
  g.lineTo(x - K.hals - 3,  y - K.skulder + 8);
  g.stroke();
  g.restore();

  /* Måleinddeling: 100 og 200 mL */
  g.save();
  g.strokeStyle = 'rgba(23,33,31,.45)'; g.lineWidth = 1.8;
  for(const v of [100, 200]){
    const hy = y - vaeskeHoejde(v);
    const b  = halvBredde(vaeskeHoejde(v));
    g.beginPath(); g.moveTo(x + b - 16, hy); g.lineTo(x + b - 3, hy); g.stroke();
  }
  g.restore();
  maerkat(g, '250 mL', x, y - 24, {størrelse:9.5, farve:'rgba(23,33,31,.5)'});

  /* Damp, når det er rigtig varmt og kolben er åben */
  if(k.temp > 46 && !k.roer && BLØDT) tegnDamp(g, x, y - K.halsTop, k.temp, ur);

  g.restore();
  return {x, y};
}

function tegnVaeske(g, k, x, y, h, ur){
  const top = y - h;

  /* Grundfarven: rent sukkervand er næsten klart, gær gør det grumset */
  const gær = Math.min(1, k.gaer / 20);
  const r = Math.round(207 + (196 - 207) * gær);
  const gg = Math.round(232 + (166 - 232) * gær);
  const b = Math.round(245 + (106 - 245) * gær);
  const grad = g.createLinearGradient(0, top, 0, y);
  grad.addColorStop(0, `rgba(${r},${gg},${b},${0.72 + 0.2 * gær})`);
  grad.addColorStop(1, `rgba(${r - 16},${gg - 18},${b - 22},${0.82 + 0.16 * gær})`);
  g.fillStyle = grad;
  g.fillRect(x - K.bund - 4, top, K.bund * 2 + 8, h + 4);

  /* Uopløst sukker på bunden, indtil der er rørt rundt */
  if(k.sukker > 0 && !k.roert){
    g.save();
    g.fillStyle = 'rgba(255,255,255,.85)';
    g.beginPath();
    g.moveTo(x - K.bund, y);
    g.quadraticCurveTo(x, y - 10 - k.sukker * 0.24, x + K.bund, y);
    g.closePath(); g.fill();
    g.restore();
  }

  /* Boblerne på vej op */
  g.save();
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.2;
  g.fillStyle = 'rgba(255,255,255,.5)';
  for(const bl of k.indreBobler){
    g.beginPath(); g.arc(x + bl.x, y - bl.h, bl.r, 0, Math.PI * 2);
    g.fill(); g.stroke();
  }
  g.restore();

  /* Skummet: står i forhold til, hvor mange bobler der slipper ud */
  const skum = Math.min(26, k.slip * 0.30);
  if(skum > 1){
    g.save();
    g.fillStyle = 'rgba(255,250,238,.92)';
    g.beginPath();
    g.moveTo(x - K.bund - 4, top + 3);
    g.lineTo(x + K.bund + 4, top + 3);
    g.lineTo(x + K.bund + 4, top - skum);
    for(let i = 10; i >= 0; i--){
      const px = x - K.bund - 4 + (K.bund * 2 + 8) * i / 10;
      g.lineTo(px, top - skum + Math.sin(i * 1.7 + ur * 1.4) * 3);
    }
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(23,33,31,.22)'; g.lineWidth = 1.4; g.stroke();
    /* Et par bobler i skummet */
    g.fillStyle = 'rgba(23,33,31,.10)';
    for(let i = 0; i < 9; i++){
      const px = x - K.bund + ((i * 37 + Math.sin(ur + i) * 6) % (K.bund * 2));
      g.beginPath(); g.arc(px, top - skum * (0.3 + (i % 3) * 0.22), 2.6, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }

  /* Væskeoverfladen */
  g.strokeStyle = 'rgba(23,33,31,.30)'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(x - K.bund - 4, top); g.lineTo(x + K.bund + 4, top); g.stroke();
}

function tegnToert(g, k, x, y){
  const bunker = [];
  if(k.toerblandet){
    /* Sukkeret trækker vand ud af gærcellerne — blandingen bliver
       først fugtig og til sidst helt flydende. */
    const våd = Math.min(1, k.toerTid / 150);
    bunker.push({m:k.sukker + k.gaer, f:vaadFarve(våd), x:0, glans:våd});
  } else {
    if(k.sukker > 0) bunker.push({m:k.sukker, f:'#FFFFFF', x:-20, glans:0});
    if(k.gaer   > 0) bunker.push({m:k.gaer,   f:'#E2CB9B', x:22,  glans:0});
  }
  for(const bu of bunker){
    const b = Math.min(K.bund - 4, 24 + bu.m * 1.15);
    const h = 8 + bu.m * (bu.glans > .6 ? 0.42 : 0.70);
    g.save();
    g.beginPath();
    g.moveTo(x + bu.x - b, y + 2);
    g.quadraticCurveTo(x + bu.x, y - h * (bu.glans > .6 ? 1.1 : 2.0), x + bu.x + b, y + 2);
    g.closePath();
    blaek(g, bu.f, 1.6, 'rgba(23,33,31,.35)');
    if(bu.glans > 0.25){
      g.globalAlpha = bu.glans * 0.5;
      g.fillStyle = '#FFF9EE';
      g.beginPath();
      g.ellipse(x + bu.x - b * 0.3, y - h * 0.5, b * 0.3, 3.5, -0.2, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
    /* Korn, så det ligner pulver og ikke maling */
    if(bu.glans < 0.5){
      g.save();
      g.fillStyle = 'rgba(23,33,31,.18)';
      for(let i = 0; i < 22; i++){
        const px = x + bu.x - b + (i * 53 % (b * 2));
        const py = y - 2 - ((i * 29) % Math.max(4, h));
        g.fillRect(px, py, 1.6, 1.6);
      }
      g.restore();
    }
  }
}

function vaadFarve(t){
  const a = [226, 203, 155], b = [150, 111, 60];
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function tegnDamp(g, x, y, temp, ur){
  g.save();
  g.globalAlpha = Math.min(.55, (temp - 46) / 30);
  g.strokeStyle = '#FFFFFF'; g.lineWidth = 4; g.lineCap = 'round';
  for(let i = 0; i < 3; i++){
    const f = ur * 0.8 + i * 2.1;
    g.beginPath();
    g.moveTo(x - 10 + i * 10, y - 4);
    g.quadraticCurveTo(x - 18 + i * 10 + Math.sin(f) * 9, y - 26,
                       x - 10 + i * 10 + Math.sin(f + 1) * 7, y - 48);
    g.stroke();
  }
  g.restore();
}

/** Termometeret, når det står i kolben. */
export function tegnTermometer(g, k){
  const {x, y} = kolbePos(k);
  const top = y - K.halsTop - 26;
  g.save();
  boks(g, x + 20, top, 9, K.halsTop + 8, 4.5);
  blaek(g, '#FFFFFF', 2);
  const t = Math.max(0, Math.min(1, (k.temp - 10) / 80));
  boks(g, x + 22, y - 22 - t * (K.halsTop - 30), 5, 6 + t * (K.halsTop - 30), 2.5);
  blaek(g, '#E8336D', 0);
  g.beginPath(); g.arc(x + 24.5, y - 18, 7, 0, Math.PI * 2);
  blaek(g, '#E8336D', 2);
  g.restore();

  /* Aflæsningen står ved siden af — enheden skrives, som den staves */
  const nav = `${Math.round(k.temp)} °C`;
  g.save();
  g.font = '800 14px Archivo,system-ui,sans-serif';
  const b = g.measureText(nav).width + 20;
  boks(g, x + 34, top - 4, b, 22, 10);
  blaek(g, '#FFF9EE', 2);
  tekst(g, nav, x + 34 + b / 2, top + 7, {størrelse:14});
  g.restore();
}
