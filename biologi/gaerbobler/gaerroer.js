/* ═══════════════════════════════════════════════════════════
   gaerroer.js — gærrøret.

   Det S-bøjede rør, der sidder i proppen. Vandet med
   bromthymolblåt står i den nederste bøjning, CO₂'en fra kolben
   presses op gennem det første ben, ned gennem det andet, ud
   gennem vandet og videre ud i luften. Det er de bobler, man
   tæller, og det er vandet her, der skifter farve.
   ═══════════════════════════════════════════════════════════ */
import {INK, blaek, BLØDT} from './model.js';
import {btbFarve, roerPH} from './gaering.js';

/* Rørets midterlinje, regnet fra ophænget (0, 0) = proppens top. */
const YDRE = 9.5, INDRE = 6.5;
export const VANDLINJE = -52;       /* vandets overflade i røret      */
export const ROER_TOP  = -93;       /* det øverste af røret           */

function sti(g){
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(0, -64);
  g.arc(20, -64, 20, Math.PI, 2 * Math.PI, false);   /* over toppen    */
  g.lineTo(40, -34);
  g.arc(56, -34, 16, Math.PI, 0, true);              /* under bunden   */
  g.lineTo(72, -84);
}

/* Midterlinjen som punkter, så boblerne kan følge den. */
const LINJE = (() => {
  const p = [];
  const buet = (cx, cy, r, a0, a1, n) => {
    for(let i = 0; i <= n; i++){
      const a = a0 + (a1 - a0) * i / n;
      p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  p.push([0, 0], [0, -64]);
  buet(20, -64, 20, Math.PI, 2 * Math.PI, 12);
  p.push([40, -34]);
  buet(56, -34, 16, Math.PI, 0, 12);
  p.push([72, -84]);
  /* Løbende længde, så en boble kan flyttes med fast fart */
  let l = 0;
  const s = [0];
  for(let i = 1; i < p.length; i++){
    l += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    s.push(l);
  }
  return {p, s, længde:l};
})();

/** Punktet på midterlinjen, når man er nået andelen t (0-1) frem. */
function punkt(t){
  const mål = t * LINJE.længde;
  let i = 1;
  while(i < LINJE.s.length - 1 && LINJE.s[i] < mål) i++;
  const f = (mål - LINJE.s[i - 1]) / Math.max(1e-6, LINJE.s[i] - LINJE.s[i - 1]);
  return [
    LINJE.p[i - 1][0] + (LINJE.p[i][0] - LINJE.p[i - 1][0]) * f,
    LINJE.p[i - 1][1] + (LINJE.p[i][1] - LINJE.p[i - 1][1]) * f,
  ];
}

/* Boblen forsvinder, når den bryder vandoverfladen i det sidste ben. */
const OVERFLADE = 0.90;

export function roerKasse(x, y, skala = 1){
  return {
    x0:x - (YDRE + 12) * skala, x1:x + (81 + YDRE) * skala,
    y0:y + (ROER_TOP - YDRE) * skala, y1:y + 10,
  };
}

/* ── Boblernes gang gennem røret ───────────────────────── *
 * Ved høj tidsfart kommer boblerne hurtigere, end øjet kan følge
 * dem: røret ville stå fyldt med en perlerække. Derfor vises der
 * højst et par stykker i sekundet, mens tælleren tæller dem alle.
 * `dt` er virkelig tid — boblerne skal bevæge sig i skærmens
 * tempo, ikke i forsøgets.                                       */
const VIST_PR_SEK = 4;

export function opdaterRoerBobler(r, nye, dt){
  r.kvote = Math.min(VIST_PR_SEK, (r.kvote || 0) + dt * VIST_PR_SEK);
  const vis = Math.min(nye, Math.floor(r.kvote));
  r.kvote -= vis;
  for(let i = 0; i < vis; i++) r.bobler.push({t:0, pop:0});
  const fart = BLØDT ? 0.62 : 4;
  for(const b of r.bobler){
    if(b.pop > 0){ b.pop += dt * 3.4; continue; }
    /* Gennem vandet går det langsommere — det er der, boblen ses */
    const bremse = b.t > 0.58 ? 0.55 : 1;
    b.t += fart * bremse * dt;
    if(b.t >= OVERFLADE){ b.t = OVERFLADE; b.pop = 0.01; }
  }
  r.bobler = r.bobler.filter(b => b.pop < 1).slice(-14);
}

/* ── Tegning ───────────────────────────────────────────── */

/** (x, y) er ophængspunktet: toppen af proppen, eller stativets hul. */
export function tegnRoer(g, r, x, y, {skala = 1, prop = false} = {}){
  g.save();
  g.translate(x, y);
  g.scale(skala, skala);

  if(prop) tegnProp(g);

  /* Glasvæggen */
  g.lineCap = 'round'; g.lineJoin = 'round';
  sti(g);
  g.lineWidth = YDRE * 2; g.strokeStyle = INK; g.stroke();
  sti(g);
  g.lineWidth = INDRE * 2; g.strokeStyle = '#EAF4F7'; g.stroke();

  /* Vandet med BTB. Kun i den nederste bøjning og de to ben omkring
     den — det første ben er gassens vej ind og skal stå tomt. */
  if(r.vand){
    g.save();
    g.beginPath();
    g.rect(31, VANDLINJE, 60, -VANDLINJE + 4);
    g.clip();
    sti(g);
    g.lineWidth = INDRE * 2;
    g.strokeStyle = r.btb ? btbFarve(roerPH(r)) : '#CFE6F2';
    g.stroke();
    g.restore();

    /* Overfladerne i de to ben */
    g.strokeStyle = 'rgba(23,33,31,.35)'; g.lineWidth = 1.4;
    for(const bx of [40, 72]){
      g.beginPath(); g.moveTo(bx - INDRE, VANDLINJE); g.lineTo(bx + INDRE, VANDLINJE); g.stroke();
    }
  }

  /* Boblerne */
  g.save();
  for(const b of r.bobler){
    const [bx, by] = punkt(b.t);
    if(b.pop > 0){
      g.globalAlpha = Math.max(0, 1 - b.pop);
      g.strokeStyle = '#2A3735'; g.lineWidth = 1.6;
      g.beginPath(); g.arc(bx, by, 4 + b.pop * 7, 0, Math.PI * 2); g.stroke();
    } else {
      g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,255,255,.92)';
      g.strokeStyle = 'rgba(23,33,31,.55)'; g.lineWidth = 1.3;
      g.beginPath(); g.arc(bx, by, 4.1, 0, Math.PI * 2); g.fill(); g.stroke();
    }
  }
  g.restore();

  /* Glansen på glasset */
  g.save();
  g.globalAlpha = .5; g.strokeStyle = '#FFFFFF'; g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(-3, -12); g.lineTo(-3, -52); g.stroke();
  g.restore();

  g.restore();
}

function tegnProp(g){
  g.beginPath();
  g.moveTo(-21, 2); g.lineTo(-18, -19); g.lineTo(18, -19); g.lineTo(21, 2);
  g.closePath();
  blaek(g, '#4C4038', 2.4);
  g.save();
  g.globalAlpha = .28; g.fillStyle = '#FFF9EE';
  g.fillRect(-15, -16, 5, 15);
  g.restore();
}

/** Et gærrør, som det står i stativet — mindre og uden prop. */
export const STATIV_SKALA = 0.66;
export function tegnStativRoer(g, r, x, y){
  tegnRoer(g, r, x, y, {skala:STATIV_SKALA});
}
