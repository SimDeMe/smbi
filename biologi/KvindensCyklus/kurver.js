/* ═══════════════════════════════════════════════════════════
   kurver.js — de fire rækker til højre i figuren.

   Samme tidsakse fra top til bund, som i lærebogens figur:
     Hypofysen     FSH og LH (og hCG, når der er et foster)
     Ovariet       follikel og gult legeme som cirkler
     Ovariets      østradiol (venstre akse) og progesteron
     hormoner      (højre akse)
     Livmoderen    slimhindens tykkelse og blødningerne
   Under dem en fasestribe og tidsaksen i cyklusdage, så figuren
   læses som lærebogens (dag 1 = første blødningsdag).
   Kurverne ruller mod venstre; «nu» står fast.
   ═══════════════════════════════════════════════════════════ */

const NS = 'http://www.w3.org/2000/svg';
export const X0 = 452, X1 = 948;
export const VINDUE = 42;                /* døgn på tidsaksen */
const NU = 0.8;                          /* hvor på aksen «nu» står */
export const FORTID = NU * VINDUE;       /* døgn, der kan ses bagud */

const R = {
  hyp:  {y0: 40,  y1: 132, maks: 70},    /* IU/L */
  ov:   {y0: 152, y1: 222},
  horm: {y0: 244, y1: 368, oe: 1600, prog: 64},
  slim: {y0: 390, y1: 470, maks: 15},    /* mm */
};
const AKSE_Y = 470;
const FASE = {y0: 474, y1: 490};         /* fasestriben under kurverne */

/* faserne i striben: navn og lys flade (navnet er signalet, farven hjælper) */
export const FASER = {
  mens:    {navn:'menstruation', kort:'mens.',    fyld:'#FBD3E1'},
  follikel:{navn:'follikelfase', kort:'follikel', fyld:'#C7E6F6'},
  luteal:  {navn:'lutealfase',   kort:'luteal',   fyld:'#FFE7A6'},
  grav:    {navn:'graviditet',   kort:'grav.',    fyld:'#D6EFC4'},
  pille:   {navn:'p-pille',      kort:'pille',    fyld:'#E2D6F8'},
  pause:   {navn:'pillepause',   kort:'pause',    fyld:'#FFFFFF'},
};

export const FARVE = {
  fsh:'#0E86C8', lh:'#7A4FD6', oe:'#E8336D', prog:'#B07A00', hcg:'#0FA593',
  blod:'#B3261E', slim:'#F4A7B9',
};
export const STREG = {
  fsh:'', lh:'9 5', oe:'', prog:'11 4 2 4', hcg:'2 4',
};

function ny(tag, attr, far){
  const e = document.createElementNS(NS, tag);
  for (const k in attr) e.setAttribute(k, attr[k]);
  if (far) far.appendChild(e);
  return e;
}
function tekst(far, x, y, str, klasse, attr = {}){
  const e = ny('text', {x, y, class: klasse, ...attr}, far);
  e.textContent = str;
  return e;
}

export function byggKurver(svg){
  const g = ny('g', {class: 'kurver'}, svg);

  /* mønstre til blødning, sædceller og p-pille */
  const defs = ny('defs', {}, svg);
  const skr = ny('pattern', {id:'skraa-blod', width:6, height:6, patternUnits:'userSpaceOnUse', patternTransform:'rotate(45)'}, defs);
  ny('rect', {width:6, height:6, fill:'#FBD3E1'}, skr);
  ny('line', {x1:0, y1:0, x2:0, y2:6, stroke:FARVE.blod, 'stroke-width':2.2}, skr);
  const saed = ny('pattern', {id:'skraa-saed', width:5, height:5, patternUnits:'userSpaceOnUse', patternTransform:'rotate(-45)'}, defs);
  ny('rect', {width:5, height:5, fill:'#C7E6F6'}, saed);
  ny('line', {x1:0, y1:0, x2:0, y2:5, stroke:'#0E86C8', 'stroke-width':1.4}, saed);
  const klip = ny('clipPath', {id:'klip-kurver'}, defs);
  ny('rect', {x:X0, y:R.hyp.y0 - 30, width:X1 - X0, height:FASE.y1 - R.hyp.y0 + 30}, klip);

  /* rækkernes rammer, aksetal og titler */
  const ramme = ny('g', {class:'rammer'}, g);
  const raekker = [
    ['hyp',  'Hypofysen · FSH og LH'],
    ['ov',   'Ovariet · follikel og gult legeme'],
    ['horm', 'Ovariets hormoner'],
    ['slim', 'Livmoderens slimhinde'],
  ];
  for (const [k, navn] of raekker){
    const r = R[k];
    ny('rect', {x:X0, y:r.y0, width:X1 - X0, height:r.y1 - r.y0, class:'raekke'}, ramme);
    tekst(ramme, X0, r.y0 - 6, navn, 'svg-mono raekke-navn');
  }
  const tal = (x, y, s, anker, farve) =>
    tekst(ramme, x, y + 3, s, 'svg-tal', {'text-anchor': anker, fill: farve || '#566B68'});
  for (const v of [0, 35, 70]){
    const y = R.hyp.y1 - v / R.hyp.maks * (R.hyp.y1 - R.hyp.y0);
    tal(X0 - 6, y, v, 'end');
    if (v) ny('line', {x1:X0, x2:X1, y1:y, y2:y, class:'gitter'}, ramme);
  }
  enhed(ramme, X0 - 36, R.hyp, 'IU/L');
  for (const v of [0, 800, 1600]){
    const y = R.horm.y1 - v / R.horm.oe * (R.horm.y1 - R.horm.y0);
    tal(X0 - 6, y, v, 'end', FARVE.oe);
    if (v) ny('line', {x1:X0, x2:X1, y1:y, y2:y, class:'gitter'}, ramme);
  }
  for (const v of [0, 32, 64]){
    const y = R.horm.y1 - v / R.horm.prog * (R.horm.y1 - R.horm.y0);
    tal(X1 + 6, y, v, 'start', FARVE.prog);
  }
  enhed(ramme, X0 - 38, R.horm, 'østradiol · pmol/L', FARVE.oe);
  enhed(ramme, X1 + 32, R.horm, 'progesteron · nmol/L', FARVE.prog, 90);
  for (const v of [0, 5, 10, 15]){
    const y = R.slim.y1 - v / R.slim.maks * (R.slim.y1 - R.slim.y0);
    tal(X0 - 6, y, v, 'end');
  }
  enhed(ramme, X0 - 30, R.slim, 'mm');
  ny('rect', {x:X0, y:FASE.y0, width:X1 - X0, height:FASE.y1 - FASE.y0, class:'fase-ramme'}, ramme);
  tekst(ramme, X0 - 6, FASE.y1 - 4, 'fase', 'svg-enhed', {'text-anchor':'end'});
  tekst(ramme, X1, FASE.y1 + 26, 'cyklusdag →', 'svg-enhed', {'text-anchor':'end'});

  /* det, der tegnes om hvert billede */
  const levende = ny('g', {'clip-path':'url(#klip-kurver)'}, g);
  const lag = {
    faser:   ny('g', {}, levende),
    baand:   ny('g', {}, levende),
    slim:    ny('path', {class:'slim-flade'}, levende),
    blod:    ny('g', {}, levende),
    glyffer: ny('g', {}, levende),
    linjer:  ny('g', {}, levende),
    maerker: ny('g', {}, levende),
  };
  const linje = {};
  for (const k of ['hcg', 'fsh', 'lh', 'oe', 'prog']){
    linje[k] = ny('path', {class:'kurve', stroke:FARVE[k], 'stroke-dasharray':STREG[k]}, lag.linjer);
  }
  const akseTal = ny('g', {}, g);
  const nuX = X0 + NU * (X1 - X0);
  ny('line', {x1:nuX, x2:nuX, y1:R.hyp.y0 - 4, y2:FASE.y1, class:'nu-linje'}, g);
  const nuSkilt = ny('g', {transform:`translate(${nuX},${R.hyp.y0 - 4})`}, g);
  ny('rect', {x:-15, y:-16, width:30, height:15, rx:7, class:'nu-skilt'}, nuSkilt);
  tekst(nuSkilt, 0, -5.5, 'nu', 'svg-mono nu-tekst', {'text-anchor':'middle'});

  /* aflæsning: en lodret streg og dagens nummer, når man peger */
  const lup = ny('g', {class:'lup', visibility:'hidden'}, g);
  const lupLinje = ny('line', {y1:R.hyp.y0, y2:FASE.y1, class:'lup-linje'}, lup);
  const lupSkilt = ny('g', {}, lup);
  ny('rect', {x:-26, y:0, width:52, height:15, rx:7, class:'lup-skilt'}, lupSkilt);
  const lupTekst = tekst(lupSkilt, 0, 10.5, '', 'svg-mono lup-tekst', {'text-anchor':'middle'});

  return {lag, linje, akseTal, lup, lupLinje, lupSkilt, lupTekst};
}

/* ── Aflæsning ──────────────────────────────────────────── */
const vinduetsStart = s => s.t - NU * VINDUE;

/* tiden under et punkt i figuren — null uden for kurverne */
export function tidVed(x, y, s){
  if (x < X0 || x > X1 || y < R.hyp.y0 - 20 || y > FASE.y1 + 20) return null;
  return vinduetsStart(s) + (x - X0) / (X1 - X0) * VINDUE;
}

export function tegnLup(k, s, p){
  const t0 = vinduetsStart(s);
  const lx = p ? X0 + (p.t - t0) / VINDUE * (X1 - X0) : -1;
  if (!p || lx < X0 || lx > X1){ k.lup.setAttribute('visibility', 'hidden'); return; }
  k.lup.setAttribute('visibility', 'visible');
  k.lupLinje.setAttribute('x1', lx.toFixed(1));
  k.lupLinje.setAttribute('x2', lx.toFixed(1));
  const sx = Math.min(X1 - 26, Math.max(X0 + 26, lx));
  k.lupSkilt.setAttribute('transform', `translate(${sx.toFixed(1)},${R.hyp.y0 - 19})`);
  k.lupTekst.textContent = 'dag ' + dagNr(p);
}

/* dagens nummer: i cyklussen, eller i pakken under p-piller */
export const dagNr = p => p.pf ? Math.floor(p.pd + 1) : Math.floor(p.dag);

/* ── Tegn ───────────────────────────────────────────────── */
export function tegnKurver(k, spor, s){
  const t0 = s.t - NU * VINDUE, t1 = t0 + VINDUE;
  const x = t => X0 + (t - t0) / VINDUE * (X1 - X0);
  const yAf = (r, v, maks) => r.y1 - Math.min(v, maks * 1.08) / maks * (r.y1 - r.y0);

  /* spor inden for vinduet (+ en margen, så kurven når kanten) */
  let i0 = 0;
  { let lo = 0, hi = spor.length - 1;
    while (lo < hi){ const m = (lo + hi) >> 1; if (spor[m].t < t0 - 0.5) lo = m + 1; else hi = m; }
    i0 = lo; }
  const synlige = spor.slice(i0);

  const sti = (felt, r, maks) => {
    let d = '';
    for (const p of synlige) d += (d ? 'L' : 'M') + x(p.t).toFixed(1) + ',' + yAf(r, p[felt], maks).toFixed(1);
    return d;
  };
  k.linje.fsh.setAttribute('d', sti('fsh', R.hyp, R.hyp.maks));
  k.linje.lh.setAttribute('d', sti('lh', R.hyp, R.hyp.maks));
  k.linje.oe.setAttribute('d', sti('oe', R.horm, R.horm.oe));
  k.linje.prog.setAttribute('d', sti('prog', R.horm, R.horm.prog));
  k.linje.hcg.setAttribute('d', synlige.some(p => p.hcg > 0.5) ? sti('hcg', R.hyp, R.hyp.maks) : '');

  /* slimhinden som flade */
  if (synlige.length > 1){
    let d = `M${x(synlige[0].t).toFixed(1)},${R.slim.y1}`;
    for (const p of synlige) d += 'L' + x(p.t).toFixed(1) + ',' + yAf(R.slim, p.slim, R.slim.maks).toFixed(1);
    d += `L${x(synlige[synlige.length-1].t).toFixed(1)},${R.slim.y1}Z`;
    k.lag.slim.setAttribute('d', d);
  }

  /* fasestriben */
  const fl = k.lag.faser;
  fl.replaceChildren();
  for (const [a, b, v] of stykker(synlige, p => p.fase, true)){
    const f = FASER[v];
    const bx = x(a), bb = Math.max(0, x(b) - x(a));
    ny('rect', {x:bx, y:FASE.y0, width:bb, height:FASE.y1 - FASE.y0, fill:f.fyld, class:'fase-flade'}, fl);
    /* navnet midt i den synlige del af fasen — forkortet, hvis der
       ikke er plads til det hele */
    const va = Math.max(bx, X0), vb = Math.min(bx + bb, X1);
    const navn = [f.navn, f.kort].find(n => vb - va > n.length * 6 + 8);
    if (navn) tekst(fl, (va + vb) / 2, FASE.y1 - 4.5, navn, 'svg-mono fase-tekst', {'text-anchor':'middle'});
  }

  /* bånd: blødninger, p-pillens pakke, sædceller og æg */
  const baand = k.lag.baand, blod = k.lag.blod;
  baand.replaceChildren(); blod.replaceChildren();
  for (const [a, b] of stykker(synlige, p => p.blod)){
    ny('rect', {x:x(a), y:R.hyp.y0, width:x(b) - x(a), height:R.slim.y1 - R.hyp.y0, class:'blod-tone'}, baand);
    ny('rect', {x:x(a), y:R.slim.y1 - 12, width:x(b) - x(a), height:12, fill:'url(#skraa-blod)', class:'blod-baand'}, blod);
  }
  for (const [a, b, v] of stykker(synlige, p => p.pf, true)){
    const aktiv = v === 1;
    ny('rect', {x:x(a), y:R.ov.y0 + 2, width:Math.max(0, x(b) - x(a) - 1), height:9, rx:3,
                class: aktiv ? 'pille-aktiv' : 'pille-pause'}, baand);
    if (x(b) - x(a) > 40) tekst(baand, x(a) + 4, R.ov.y0 + 9.5, aktiv ? 'pille' : 'pause', 'svg-mono pille-tekst' + (aktiv ? ' lys' : ''));
  }
  for (const h of s.haendelser){
    if (h.t < t0 - 6 || h.t > t1) continue;
    if (h.type === 'samleje'){
      const b = Math.min(h.t + 5, s.t);
      ny('rect', {x:x(h.t), y:R.ov.y1 - 12, width:Math.max(0, x(b) - x(h.t)), height:10, fill:'url(#skraa-saed)', class:'saed-baand'}, baand);
      ny('path', {d:`M${x(h.t)},${R.ov.y1 - 2}l-5,8h10z`, class:'maerke'}, baand);
    }
    if (h.type === 'aegloesning'){
      const b = Math.min(h.t + 1, s.t);
      ny('rect', {x:x(h.t), y:R.ov.y1 - 24, width:Math.max(0, x(b) - x(h.t)), height:10, class:'aeg-baand'}, baand);
    }
  }

  /* follikel og gult legeme som cirkler hvert andet døgn */
  const gl = k.lag.glyffer;
  gl.replaceChildren();
  const cy = (R.ov.y0 + 12 + R.ov.y1 - 14) / 2 + 1;
  const start = Math.ceil(t0 / 2) * 2;
  for (let t = start; t <= s.t + 0.01; t += 2){
    const p = spor[naermest(spor, t)];
    if (!p || Math.abs(p.t - t) > 0.2) continue;
    const cx = x(t);
    if (p.gul > 0.05){
      ny('circle', {cx, cy, r: 3 + 13*p.gul, class:'gul-glyf'}, gl);
    } else {
      const r = Math.min(22, 1.2 + p.fol * 0.62);
      ny('circle', {cx, cy, r, class:'follikel-glyf'}, gl);
      if (p.fol > 7) ny('circle', {cx: cx - r*0.35, cy: cy - r*0.2, r: 2.2, class:'aeg-glyf'}, gl);
    }
  }

  /* hændelser, der fortjener en lodret streg */
  const mk = k.lag.maerker;
  mk.replaceChildren();
  for (const h of s.haendelser){
    if (h.t < t0 || h.t > t1) continue;
    const hx = x(h.t);
    if (h.type === 'aegloesning'){
      ny('line', {x1:hx, x2:hx, y1:R.hyp.y0, y2:FASE.y1, class:'maerke-linje'}, mk);
      maerkat(mk, hx + 4, R.hyp.y0 + 11, 'ægløsning', 'start');
    } else if (h.type === 'menstruation'){
      maerkat(mk, hx + 2, R.slim.y0 + 11, 'dag 1', 'start');
    } else if (h.type === 'fortryd'){
      ny('line', {x1:hx, x2:hx, y1:R.horm.y0, y2:R.horm.y1, class:'maerke-linje fortryd'}, mk);
      maerkat(mk, hx + 4, R.horm.y0 + 11, 'fortrydelsespille', 'start');
    } else if (h.type === 'indlejring'){
      maerkat(mk, hx, R.slim.y0 + 11, 'indlejring');
    }
  }

  /* tidsaksen i cyklusdage: dag 1 og hver 7. dag (i pakken under
     p-piller). En cyklus på over 28 dage — fx ved graviditet —
     fortsætter bare med 35, 42 … */
  const streger = [];
  let forrige = null;
  for (const p of synlige){
    const d = dagNr(p);
    if (forrige !== null && d !== forrige && (d === 1 || d % 7 === 0)){
      const tx = x(p.t);
      if (tx >= X0 - 1 && tx <= X1 + 1){
        const sidst = streger[streger.length - 1];
        if (sidst && tx - sidst.x < 22){ if (d === 1) streger.pop(); else { forrige = d; continue; } }
        streger.push({x: tx, d});
      }
    }
    forrige = d;
  }
  k.akseTal.replaceChildren();
  for (const {x: tx, d} of streger){
    ny('line', {x1:tx, x2:tx, y1:FASE.y1, y2:FASE.y1 + 5, class:'akse-streg'}, k.akseTal);
    tekst(k.akseTal, tx, FASE.y1 + 16, d, 'svg-tal', {'text-anchor':'middle', fill: d === 1 ? '#17211F' : '#566B68'});
  }
}

/* enhed langs aksen, drejet */
function enhed(far, x, r, str, farve, vinkel = -90){
  const y = (r.y0 + r.y1) / 2;
  tekst(far, x, y, str, 'svg-enhed', {'text-anchor':'middle', transform:`rotate(${vinkel} ${x} ${y})`, fill: farve || '#566B68'});
}

function maerkat(far, x, y, str, anker = 'middle'){
  const g = ny('g', {class:'maerkat'}, far);
  const t = tekst(g, x, y, str, 'svg-mono', {'text-anchor': anker});
  const b = str.length * 5.6 + 10;
  const bx = anker === 'middle' ? x - b/2 : x - 3;
  const r = ny('rect', {x:bx, y:y - 9, width:b, height:13, rx:6}, g);
  g.insertBefore(r, t);
}

/* sammenhængende stykker, hvor fn(p) er sand (eller har samme værdi) */
function stykker(spor, fn, medVaerdi){
  const ud = [];
  let a = null, v0 = 0;
  for (let i = 0; i < spor.length; i++){
    const v = fn(spor[i]);
    if (v && a === null){ a = spor[i].t; v0 = v; }
    else if (a !== null && (!v || (medVaerdi && v !== v0))){
      ud.push([a, spor[i].t, v0]);
      a = v ? spor[i].t : null; v0 = v;
    }
  }
  if (a !== null) ud.push([a, spor[spor.length-1].t, v0]);
  return ud;
}

function naermest(spor, t){
  let lo = 0, hi = spor.length - 1;
  while (lo < hi){ const m = (lo + hi) >> 1; if (spor[m].t < t) lo = m + 1; else hi = m; }
  if (lo > 0 && Math.abs(spor[lo-1].t - t) < Math.abs(spor[lo].t - t)) return lo - 1;
  return lo;
}
