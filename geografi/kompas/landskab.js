/* ═══════════════════════════════════════════════════════════
   landskab.js — kortet, man står midt i.

   Set lige oppefra med nord opad. Landemærkerne ligger i faste
   kurser fra midten, hvor man selv står med kompasset. Kurserne
   er fagdata: opgaverne i opgaver.js regner med dem.
   Misvisningen er sat til 0°, så kortets nord og kompassets
   nord er det samme.
   ═══════════════════════════════════════════════════════════ */

export const W = 800, H = 560;
export const CX = 400, CY = 280;          // her står man — kompassets drejepunkt

/* kurs i grader fra nord med uret, r i px fra midten */
export const LANDEMAERKER = [
  {id:'kirke',  navn:'Kirken',      kurs:35,  r:235},
  {id:'fyr',    navn:'Fyrtårnet',   kurs:108, r:330},
  {id:'bro',    navn:'Broen',       kurs:150, r:240},
  {id:'moelle', navn:'Møllen',      kurs:225, r:240},
  {id:'hytte',  navn:'Skovhytten',  kurs:300, r:300},
  {id:'mast',   navn:'Radiomasten', kurs:340, r:240},
];

export function punkt(kurs, r){
  const a = kurs * Math.PI / 180;
  return {x: CX + r * Math.sin(a), y: CY - r * Math.cos(a)};
}
for (const m of LANDEMAERKER) Object.assign(m, punkt(m.kurs, m.r));

export function forskel(a, b){             // a − b lagt i (−180; 180]
  let d = ((a - b) % 360 + 360) % 360;
  return d > 180 ? d - 360 : d;
}

/* Landemærket, kursepilen sigter på — hvis den sigter på et. */
export function maerkeVed(kurs, tol = 4){
  let bedst = null, bd = tol;
  for (const m of LANDEMAERKER){
    const d = Math.abs(forskel(kurs, m.kurs));
    if (d <= bd){ bedst = m; bd = d; }
  }
  return bedst;
}

/* ── Tegning ─────────────────────────────────────────── */
const INK = '#17211F';

/* Åen løber gennem broen og ud i havet — punkterne er valgt,
   så broen sidder på den. */
const AA = [[-10,532],[110,508],[240,492],[380,512],[0,0],[640,470],[770,446]];
AA[4] = [LANDEMAERKER[2].x, LANDEMAERKER[2].y];

function kyst(y){ return 736 + 16 * Math.sin(y / 55) + 8 * Math.sin(y / 23); }

/* træerne ved skovhytten ligger fast, så skoven ikke blinker */
const TRAEER = [];
(function(){
  let s = 7;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const h = LANDEMAERKER[4];
  for (let i = 0; i < 46; i++){
    const x = 20 + rnd() * 250, y = 20 + rnd() * 210;
    if (Math.hypot(x - h.x, y - h.y) < 42) continue;
    TRAEER.push({x, y, r: 9 + rnd() * 7});
  }
  TRAEER.sort((a, b) => a.y - b.y);
})();

export function tegnLandskab(ctx){
  // land
  ctx.fillStyle = '#E6F2D8';
  ctx.fillRect(0, 0, W, H);

  // marker
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(23,33,31,.12)';
  const marker = [
    [300,330,150,110,'#F4EDCB'], [470,330,130,120,'#DCEFC8'],
    [560,180,120,110,'#F4EDCB'], [320,150,120,90,'#DCEFC8'],
    [420,420,130,60,'#EFE6BE'],
  ];
  for (const [x,y,w,h,c] of marker){
    ctx.fillStyle = c; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  }
  ctx.restore();

  // højdekurver om bakken med radiomasten
  ctx.save();
  ctx.strokeStyle = 'rgba(122,94,50,.35)';
  ctx.lineWidth = 1.2;
  const mast = LANDEMAERKER[5];
  for (let i = 1; i <= 3; i++){
    ctx.beginPath();
    ctx.ellipse(mast.x + 4, mast.y + 6, 26 * i + 8, 16 * i + 6, -0.15, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // hav mod øst
  ctx.beginPath();
  ctx.moveTo(W, 0);
  for (let y = 0; y <= H; y += 6) ctx.lineTo(kyst(y), y);
  ctx.lineTo(W, H); ctx.closePath();
  ctx.fillStyle = '#C7E6F6'; ctx.fill();
  ctx.beginPath();
  for (let y = 0; y <= H; y += 6) y === 0 ? ctx.moveTo(kyst(y), y) : ctx.lineTo(kyst(y), y);
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = 'rgba(14,134,200,.45)'; ctx.lineWidth = 1.4;
  for (let y = 30; y < H; y += 44){
    const x = kyst(y) + 22;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6, y - 4, x + 12, y);
    ctx.quadraticCurveTo(x + 18, y + 4, x + 24, y); ctx.stroke();
  }

  // åen
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  function aaSti(){
    ctx.beginPath();
    ctx.moveTo(AA[0][0], AA[0][1]);
    for (let i = 1; i < AA.length - 1; i++){
      const mx = (AA[i][0] + AA[i+1][0]) / 2, my = (AA[i][1] + AA[i+1][1]) / 2;
      ctx.quadraticCurveTo(AA[i][0], AA[i][1], mx, my);
    }
    const s = AA[AA.length - 1]; ctx.lineTo(s[0], s[1]);
  }
  aaSti(); ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.stroke();
  aaSti(); ctx.strokeStyle = '#8CCBEA'; ctx.lineWidth = 7; ctx.stroke();
  ctx.restore();

  // sti fra midten op til kirken
  ctx.save();
  ctx.setLineDash([7, 6]);
  ctx.strokeStyle = 'rgba(122,94,50,.55)'; ctx.lineWidth = 2.5;
  const k = LANDEMAERKER[0];
  ctx.beginPath(); ctx.moveTo(CX + 10, CY + 230);
  ctx.bezierCurveTo(CX + 60, CY + 60, k.x - 60, k.y + 120, k.x, k.y + 18);
  ctx.stroke();
  ctx.restore();

  // skoven
  for (const t of TRAEER){
    ctx.beginPath(); ctx.arc(t.x + 2, t.y + 2, t.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(23,33,31,.25)'; ctx.fill();
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fillStyle = '#7FBF5A'; ctx.fill();
    ctx.strokeStyle = 'rgba(23,33,31,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
  }

  tegnNordpil(ctx, 760, 520);
}

/* Kortets nordpil nederst til højre (ude i havet, hvor der er plads) */
function tegnNordpil(ctx, x, y){
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, -8, 24, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF9EE'; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(7, 2); ctx.lineTo(0, -4); ctx.lineTo(-7, 2); ctx.closePath();
  ctx.fillStyle = INK; ctx.fill();
  ctx.font = "800 11px 'Archivo', system-ui, sans-serif";
  ctx.textAlign = 'center';
  ctx.fillText('N', 0, 11);
  ctx.restore();
}

/* Landemærkerne tegnes efter sigtelinjen, så de ligger ovenpå */
export function tegnLandemaerker(ctx, sigtet){
  for (const m of LANDEMAERKER){
    ctx.save();
    ctx.translate(m.x, m.y);
    if (sigtet === m){
      ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,179,0,.45)'; ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke();
      ctx.setLineDash([]);
    }
    IKON[m.id](ctx);
    ctx.restore();
    maerkat(ctx, m.navn, m.x, m.y + (m.y > 470 ? -38 : 32), sigtet === m);
  }
}

function maerkat(ctx, txt, x, y, fremhaev){
  ctx.save();
  ctx.font = "600 10px 'IBM Plex Mono', monospace";
  const t = txt.toUpperCase();
  const w = ctx.measureText(t).width + 14;
  rundRect(ctx, x - w / 2 + 2, y - 8, w, 17, 8.5);
  ctx.fillStyle = INK; ctx.fill();
  rundRect(ctx, x - w / 2, y - 10, w, 17, 8.5);
  ctx.fillStyle = fremhaev ? '#FFB300' : '#FFF9EE'; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = INK; ctx.textAlign = 'center';
  ctx.fillText(t, x, y + 2);
  ctx.restore();
}

export function rundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function streg(ctx, fyld){
  if (fyld){ ctx.fillStyle = fyld; ctx.fill(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
}

const IKON = {
  kirke(ctx){
    ctx.beginPath(); ctx.rect(-14, -4, 22, 14); streg(ctx, '#FFFFFF');
    ctx.beginPath(); ctx.moveTo(-16, -4); ctx.lineTo(-3, -12); ctx.lineTo(10, -4); streg(ctx, '#E8336D');
    ctx.beginPath(); ctx.rect(8, -14, 10, 24); streg(ctx, '#FFFFFF');
    ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(13, -24); ctx.lineTo(20, -14); ctx.closePath(); streg(ctx, '#E8336D');
  },
  fyr(ctx){
    ctx.beginPath(); ctx.moveTo(-8, 12); ctx.lineTo(-5, -12); ctx.lineTo(5, -12); ctx.lineTo(8, 12); ctx.closePath();
    streg(ctx, '#FFFFFF');
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#E8336D'; ctx.fillRect(-10, -4, 20, 6); ctx.fillRect(-10, 8, 20, 6);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-8, 12); ctx.lineTo(-5, -12); ctx.lineTo(5, -12); ctx.lineTo(8, 12); ctx.closePath(); streg(ctx);
    ctx.beginPath(); ctx.rect(-6, -19, 12, 7); streg(ctx, '#FFB300');
    ctx.beginPath(); ctx.moveTo(-6, -19); ctx.lineTo(0, -24); ctx.lineTo(6, -19); streg(ctx, INK);
  },
  bro(ctx){
    ctx.beginPath(); ctx.rect(-18, -8, 36, 16); streg(ctx, '#C9B79A');
    ctx.beginPath(); ctx.moveTo(-18, -8); ctx.lineTo(18, -8); ctx.moveTo(-18, 8); ctx.lineTo(18, 8);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
    ctx.lineWidth = 1.2;
    for (let x = -12; x <= 12; x += 6){ ctx.beginPath(); ctx.moveTo(x, -7); ctx.lineTo(x, 7); ctx.stroke(); }
  },
  moelle(ctx){
    ctx.beginPath(); ctx.moveTo(-8, 13); ctx.lineTo(-5, -4); ctx.lineTo(5, -4); ctx.lineTo(8, 13); ctx.closePath(); streg(ctx, '#FFFFFF');
    ctx.save(); ctx.translate(0, -5); ctx.rotate(0.35);
    for (let i = 0; i < 4; i++){
      ctx.rotate(Math.PI / 2);
      ctx.beginPath(); ctx.rect(2, -3, 16, 6); streg(ctx, '#FFF3DC');
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, -5, 3, 0, Math.PI * 2); streg(ctx, INK);
  },
  hytte(ctx){
    ctx.beginPath(); ctx.rect(-12, -2, 24, 14); streg(ctx, '#E9C79A');
    ctx.beginPath(); ctx.moveTo(-16, -2); ctx.lineTo(0, -16); ctx.lineTo(16, -2); ctx.closePath(); streg(ctx, '#7A4FD6');
    ctx.beginPath(); ctx.rect(-3, 3, 6, 9); streg(ctx, INK);
  },
  mast(ctx){
    ctx.beginPath(); ctx.moveTo(-9, 13); ctx.lineTo(0, -20); ctx.lineTo(9, 13);
    ctx.moveTo(-6, 3); ctx.lineTo(6, 3); ctx.moveTo(-3, -7); ctx.lineTo(3, -7);
    ctx.moveTo(-6, 3); ctx.lineTo(3, -7); ctx.moveTo(6, 3); ctx.lineTo(-9, 13);
    streg(ctx);
    ctx.beginPath(); ctx.arc(0, -21, 3.5, 0, Math.PI * 2); streg(ctx, '#E8336D');
  },
};
