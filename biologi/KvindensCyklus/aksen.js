/* ═══════════════════════════════════════════════════════════
   aksen.js — figuren til venstre: hormonaksen.

   Hypothalamus → hypofysen → ovariet → livmoderen, med FSH, LH,
   østrogen og progesteron som strømme ned gennem blodet og de
   to feedbacksløjfer op igen:
     − negativ feedback til højre (altid til stede, tykkere jo
       mere østrogen, progesteron og syntetisk hormon der er)
     + positiv feedback til venstre (kun når højt østrogen
       primer LH-toppen)
   Strømmenes bredde følger koncentrationen, og de står stille,
   når simuleringen holder pause.
   ═══════════════════════════════════════════════════════════ */
import {K} from './model.js';
import {FARVE} from './kurver.js';

const NS = 'http://www.w3.org/2000/svg';
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

/* ovariet og livmoderen */
const OV = {cx: 186, cy: 262, rx: 100, ry: 46};
const FOL = {x: 150, y: 262};
const GUL = {x: 232, y: 262};
const LIV = {cx: 186, cy: 410, rx: 94, ry: 50};

export function byggAksen(svg){
  const g = ny('g', {class: 'aksen'}, svg);

  /* feedbacksløjferne bagerst */
  const neg = ny('path', {d:'M284,262 H352 V36 H258 M352,106 H268', class:'feedback neg'}, g);
  const pos = ny('path', {d:'M88,262 H22 V36 H114', class:'feedback pos'}, g);
  const negSkilt = skilt(g, 352, 206, '−');
  const posSkilt = skilt(g, 22, 206, '+');
  tekst(g, 366, 120, 'negativ feedback', 'svg-mono fb-tekst', {transform:'rotate(90 366 120)', 'text-anchor':'middle'});
  const posTekst = tekst(g, 9, 120, 'positiv feedback', 'svg-mono fb-tekst', {transform:'rotate(-90 9 120)', 'text-anchor':'middle'});
  ny('path', {d:'M258,36 l9,-5 v10z', class:'fb-pil neg'}, g);
  ny('path', {d:'M268,106 l9,-5 v10z', class:'fb-pil neg'}, g);
  const posPil = ny('path', {d:'M114,36 l-9,-5 v10z', class:'fb-pil pos'}, g);

  /* kasserne */
  kasse(g, 114, 16, 144, 40, 'Hypothalamus');
  kasse(g, 106, 86, 162, 40, 'Hypofysen');
  const gnrh = strom(g, 'M186,56 V78', '#566B68', [186,86,0]);
  tekst(g, 194, 74, 'GnRH', 'svg-mono strom-navn', {fill:'#566B68'});

  /* hypofyse → ovarie */
  const fsh = strom(g, 'M156,126 V210', FARVE.fsh, [156,219,0]);
  const lh  = strom(g, 'M216,126 V210', FARVE.lh, [216,219,0]);
  const fshTal = tekst(g, 148, 174, 'FSH', 'svg-mono strom-navn', {'text-anchor':'end', fill:FARVE.fsh});
  const lhTal  = tekst(g, 224, 174, 'LH',  'svg-mono strom-navn', {fill:FARVE.lh});

  /* ovariet */
  ny('ellipse', {...OV, class:'ovarie'}, g);
  tekst(g, OV.cx - OV.rx - 6, OV.cy + 30, 'Ovarie', 'svg-navn', {'text-anchor':'end'});
  const follikel = ny('circle', {cx:FOL.x, cy:FOL.y, r:4, class:'follikel'}, g);
  const aegIFol  = ny('circle', {cx:FOL.x, cy:FOL.y, r:3, class:'aeg'}, g);
  const gul      = ny('circle', {cx:GUL.x, cy:GUL.y, r:0, class:'gul'}, g);
  const folTekst = tekst(g, FOL.x + 6, OV.cy + OV.ry - 17, '', 'svg-mono lille', {'text-anchor':'middle'});
  const gulTekst = tekst(g, GUL.x - 4, OV.cy + OV.ry - 17, '', 'svg-mono lille', {'text-anchor':'middle'});

  /* æggelederen fra ovariet til livmoderen */
  ny('path', {d:'M276,238 C300,214 318,236 312,272 C306,316 286,352 262,380', class:'aeggeleder'}, g);
  const aegeleder = ny('path', {d:'M276,238 C300,214 318,236 312,272 C306,316 286,352 262,380', fill:'none', stroke:'none'}, g);
  const vandrendeAeg = ny('circle', {r:4.5, class:'aeg vandrer'}, g);
  const saedGruppe = ny('g', {}, g);
  const saedPrikker = [];
  for (let i = 0; i < 9; i++) saedPrikker.push(ny('circle', {r:1.8, class:'saed'}, saedGruppe));

  /* ovarie → livmoder */
  const oe   = strom(g, 'M156,310 V358', FARVE.oe, [156,367,0]);
  const prog = strom(g, 'M216,310 V358', FARVE.prog, [216,367,0]);
  const oeTal   = tekst(g, 148, 340, 'Østrogen', 'svg-mono strom-navn', {'text-anchor':'end', fill:FARVE.oe});
  const progTal = tekst(g, 224, 340, 'Progesteron', 'svg-mono strom-navn', {fill:FARVE.prog});

  /* livmoderen: væg, slimhinde og hulrum */
  ny('path', {d:livmoder(LIV.rx, LIV.ry, 0), class:'livmoder'}, g);
  const slim = ny('path', {class:'slimhinde'}, g);
  const hulrum = ny('path', {class:'hulrum'}, g);
  tekst(g, LIV.cx - LIV.rx - 4, LIV.cy - LIV.ry + 18, 'Livmoder', 'svg-navn', {'text-anchor':'end'});
  const slimTekst = tekst(g, LIV.cx + 30, LIV.cy + LIV.ry + 22, '', 'svg-mono lille');
  const foster = ny('g', {class:'foster', opacity:0}, g);
  ny('circle', {cx:0, cy:0, r:7}, foster);
  ny('circle', {cx:-2, cy:-2, r:2.2, class:'kerne'}, foster);
  const blod = ny('g', {}, g);
  const draaber = [];
  for (let i = 0; i < 6; i++) draaber.push(ny('path', {d:'M0,-5 C3,0 4,3 0,5 C-4,3 -3,0 0,-5z', class:'draabe', opacity:0}, blod));

  /* hCG fra fostret op til det gule legeme */
  const hcg = strom(g, 'M262,396 C290,368 272,322 252,300', FARVE.hcg, [246,293,140]);
  const hcgTal = tekst(g, 292, 352, 'hCG', 'svg-mono strom-navn enhed', {fill:FARVE.hcg});

  /* syntetiske hormoner — mærkat med en pil ind i feedbacken */
  const pilleSkilt = ny('g', {class:'synt', opacity:0}, g);
  ny('rect', {x:274, y:136, width:70, height:30, rx:8}, pilleSkilt);
  const pilleNavn = tekst(pilleSkilt, 309, 148, 'P-PILLE', 'svg-mono', {'text-anchor':'middle'});
  tekst(pilleSkilt, 309, 160, 'syntetisk', 'svg-mono lille', {'text-anchor':'middle'});
  ny('path', {d:'M344,151 H350', class:'synt-pil'}, pilleSkilt);

  return {neg, pos, negSkilt, posSkilt, posTekst, posPil, gnrh, fsh, lh, fshTal, lhTal,
          follikel, aegIFol, gul, folTekst, gulTekst, aegeleder, vandrendeAeg, saedPrikker,
          oe, prog, oeTal, progTal, slim, hulrum, slimTekst, foster, draaber, hcg, hcgTal,
          pilleSkilt, pilleNavn, flyd: 0};
}

function kasse(far, x, y, w, h, navn){
  ny('rect', {x, y, width:w, height:h, rx:10, class:'kasse'}, far);
  tekst(far, x + w/2, y + h/2 + 5, navn, 'svg-navn', {'text-anchor':'middle'});
}

function skilt(far, x, y, tegn){
  const g = ny('g', {class:'fb-skilt', transform:`translate(${x},${y})`}, far);
  ny('circle', {r:11}, g);
  tekst(g, 0, 5.5, tegn, 'svg-navn', {'text-anchor':'middle'});
  return g;
}

/* en strøm af hormon: prikket bane + pilespids */
function strom(far, d, farve, spids){
  const g = ny('g', {class:'strom'}, far);
  const bane = ny('path', {d, stroke:farve, class:'strom-bane'}, g);
  const flyd = ny('path', {d, stroke:farve, class:'strom-flyd'}, g);
  if (spids){
    const [x, y, vinkel] = spids;
    ny('path', {d:'M0,0 l-6,-9 h12z', fill:farve, class:'strom-spids', transform:`translate(${x},${y}) rotate(${vinkel})`}, g);
  }
  g.bane = bane; g.flyd = flyd;
  return g;
}

/* livmoderens omrids: en pære med halsen nedad. `ix` og `iy` er
   afstanden ind fra ydervæggen til siderne og fra toppen. */
function livmoder(rx, ry, ix, iy = ix){
  const {cx, cy} = LIV;
  const a = rx - ix, b = ry - iy;
  const hals = Math.max(2, 16 - ix * 0.55);
  const bund = cy + ry + 26 - ix * 0.35;
  const top = cy - ry + iy;
  return `M${cx - a},${cy - b * 0.2}` +
    `C${cx - a},${top - b * 0.25} ${cx + a},${top - b * 0.25} ${cx + a},${cy - b * 0.2}` +
    `C${cx + a},${cy + b * 0.6} ${cx + hals + 8},${cy + ry * 0.6} ${cx + hals},${bund}` +
    `H${cx - hals}` +
    `C${cx - hals - 8},${cy + ry * 0.6} ${cx - a},${cy + b * 0.6} ${cx - a},${cy - b * 0.2}Z`;
}

/* ── Tegn ───────────────────────────────────────────────── */
const bredde = (v, maks) => 1.2 + 7 * Math.min(1, v / maks);

export function tegnAksen(f, s, dtVist, bevaegelse){
  if (bevaegelse) f.flyd = (f.flyd + dtVist * 26) % 1000;

  saetStrom(f.gnrh, 0.5 + 0.5 * Math.min(1, s.lh / 20), 1, f.flyd);
  saetStrom(f.fsh,  s.fsh,  14,  f.flyd);
  saetStrom(f.lh,   s.lh,   40,  f.flyd);
  saetStrom(f.oe,   s.oe,   1200, f.flyd);
  saetStrom(f.prog, s.prog, 50,  f.flyd);
  f.hcg.style.opacity = s.gravid ? 1 : 0;
  f.hcgTal.style.opacity = s.gravid ? 1 : 0;
  if (s.gravid) saetStrom(f.hcg, Math.log10(1 + s.hcg), 4, f.flyd);

  /* feedback */
  const gFeed = s.prog + s.pilleG + s.fortryd;
  const negStyrke = Math.min(1, ((s.oe + s.pilleOe) / K.eBremsF + gFeed / K.pBremsF) / 4);
  f.neg.style.strokeWidth = (1.5 + 5 * negStyrke).toFixed(2);
  f.neg.style.opacity = (0.35 + 0.65 * negStyrke).toFixed(2);
  const posAktiv = s.prim > 0.05 || s.topp >= 0;
  f.pos.classList.toggle('aktiv', posAktiv);
  f.posSkilt.classList.toggle('aktiv', posAktiv);
  f.posPil.classList.toggle('aktiv', posAktiv);
  f.posTekst.classList.toggle('aktiv', posAktiv);

  /* follikel og gult legeme */
  const rF = 2 + s.follikel * 1.05;
  f.follikel.setAttribute('r', rF.toFixed(1));
  f.aegIFol.setAttribute('cx', (FOL.x - rF * 0.4).toFixed(1));
  f.aegIFol.setAttribute('cy', (FOL.y - rF * 0.25).toFixed(1));
  f.aegIFol.style.opacity = s.follikel > 6 ? 1 : 0;
  f.folTekst.textContent = s.follikel > 4.5 && s.gulFunktion <= 0.15 ? 'follikel ' + Math.round(s.follikel) + ' mm' : '';
  f.gul.setAttribute('r', (s.gulFunktion * 20).toFixed(1));
  f.gulTekst.textContent = s.gulFunktion > 0.15 ? 'gult legeme' : '';

  /* ægget vandrer gennem æggelederen i fire døgn */
  const aegAlder = s.t - s.aeg;
  const aegSynligt = aegAlder >= 0 && (aegAlder <= K.aegLevetid + 0.6 || (s.befrugtet >= 0 && !s.gravid));
  f.vandrendeAeg.style.opacity = aegSynligt ? 1 : 0;
  if (aegSynligt){
    const L = f.aegeleder.getTotalLength();
    const u = Math.min(1, aegAlder / (s.befrugtet >= 0 ? K.indlejringEfter : 4));
    const p = f.aegeleder.getPointAtLength(u * L);
    f.vandrendeAeg.setAttribute('cx', p.x.toFixed(1));
    f.vandrendeAeg.setAttribute('cy', p.y.toFixed(1));
    f.vandrendeAeg.classList.toggle('befrugtet', s.befrugtet >= 0);
  }

  /* sædceller i livmoderen og æggelederen, så længe de lever */
  const saedAlder = s.t - s.saed;
  const saedLever = saedAlder >= 0 && saedAlder <= K.saedLevetid;
  const L = f.aegeleder.getTotalLength();
  f.saedPrikker.forEach((c, i) => {
    if (!saedLever){ c.style.opacity = 0; return; }
    const u = Math.max(0, 1 - Math.min(1, saedAlder * 0.6 + i * 0.03) * (0.4 + i * 0.07));
    const p = f.aegeleder.getPointAtLength(u * L);
    const svaj = Math.sin(s.t * 9 + i * 1.7) * 3;
    c.setAttribute('cx', (p.x + svaj).toFixed(1));
    c.setAttribute('cy', (p.y + Math.cos(s.t * 7 + i) * 2).toFixed(1));
    c.style.opacity = (1 - saedAlder / K.saedLevetid * 0.7).toFixed(2);
  });

  /* slimhinden: tykkelsen i mm vises som afstand fra væggen */
  /* muskelvæggen er 20 px; slimhinden lægger sig indenfor, og
     hulrummet bliver til en smal spalte, når den er tyk */
  const vaeg = 20, mm = Math.min(s.slim, 15);
  f.slim.setAttribute('d', livmoder(LIV.rx, LIV.ry, vaeg, vaeg * 0.8));
  f.hulrum.setAttribute('d', livmoder(LIV.rx, LIV.ry, vaeg + 1 + mm * 3.1, vaeg * 0.8 + 1 + mm * 1.45));
  f.slimTekst.textContent = 'slimhinde ' + s.slim.toFixed(1).replace('.', ',') + ' mm';

  f.foster.style.opacity = s.gravid ? 1 : 0;
  if (s.gravid){
    const r = Math.min(1.8, 1 + (s.t - s.aeg - K.indlejringEfter) / 30);
    f.foster.setAttribute('transform', `translate(${LIV.cx + 34},${LIV.cy - LIV.ry * 0.6 + 8}) scale(${r.toFixed(2)})`);
  }

  /* blødning: dråber ud gennem livmoderhalsen */
  f.draaber.forEach((d, i) => {
    if (s.blod <= 0){ d.setAttribute('opacity', 0); return; }
    const u = ((s.t * 1.6 + i / f.draaber.length) % 1);
    const y = LIV.cy + LIV.ry + 30 + u * 22;
    d.setAttribute('transform', `translate(${LIV.cx + (i % 3 - 1) * 5},${y.toFixed(1)})`);
    d.setAttribute('opacity', (1 - u).toFixed(2));
  });

  /* syntetiske hormoner */
  const synt = s.pilleG + s.fortryd;
  f.pilleSkilt.style.opacity = synt > 1.5 ? Math.min(1, synt / 10).toFixed(2) : 0;
  f.pilleNavn.textContent = s.fortryd > s.pilleG ? 'FORTRYD.' : 'P-PILLE';
}

function saetStrom(g, v, maks, flyd){
  const w = bredde(v, maks);
  g.bane.style.strokeWidth = (w + 3).toFixed(2);
  g.flyd.style.strokeWidth = w.toFixed(2);
  g.flyd.style.strokeDashoffset = (-flyd).toFixed(1);
}
