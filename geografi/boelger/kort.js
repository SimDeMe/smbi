/* kort.js — bølgekortet: bølgehøjde mod bølgelængde.
   Hver bølge er ét punkt. Linjen fra origo ud til punktet har bølgens
   stejlhed H/L som hældning, og grænsen mellem konstruktive og destruktive
   bølger er derfor en ret linje gennem origo: stejlheden 1:40. Punktet kan
   trækkes rundt; skyderne gør det samme fra tastaturet. */

import { G, GRAENSE, MAKS_STEJL, boelgelaengde } from './model.js';

const NS = 'http://www.w3.org/2000/svg';
const L_MAKS = 250, H_MAKS = 5;
const X0 = 50, X1 = 324, Y0 = 44, Y1 = 310;
const X = L => X0 + L / L_MAKS * (X1 - X0);
const Y = H => Y1 - H / H_MAKS * (Y1 - Y0);

function el(navn, attr = {}, forael){
  const e = document.createElementNS(NS, navn);
  for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v);
  if (forael) forael.appendChild(e);
  return e;
}
function tekst(forael, x, y, t, attr = {}){
  const e = el('text', { x, y, ...attr }, forael);
  e.textContent = t;
  return e;
}

export function byg(svg, { tMin, tMax, hMin, onVaelg }){
  svg.setAttribute('viewBox', '0 0 340 357');

  const defs = el('defs', {}, svg);
  const stribe = el('pattern', { id: 'k-stribe', width: 8, height: 8,
    patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  el('rect', { width: 8, height: 8, fill: '#FFD9C9' }, stribe);
  el('line', { x1: 0, y1: 0, x2: 0, y2: 8, stroke: '#FF6A3D', 'stroke-width': 2.2, 'stroke-opacity': .45 }, stribe);
  const kryds = el('pattern', { id: 'k-kryds', width: 6, height: 6, patternUnits: 'userSpaceOnUse' }, defs);
  el('rect', { width: 6, height: 6, fill: '#ECEAE2' }, kryds);
  el('path', { d: 'M0 6L6 0M-1 1L1 -1M5 7L7 5', stroke: '#9AA5A2', 'stroke-width': 1 }, kryds);
  const klip = el('clipPath', { id: 'k-klip' }, defs);
  el('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0 }, klip);

  // ── Områderne ────────────────────────────────────────
  const omr = el('g', { 'clip-path': 'url(#k-klip)' }, svg);
  const Lg = H_MAKS / GRAENSE, Lm = H_MAKS / MAKS_STEJL;
  el('polygon', { points: `${X(0)},${Y(0)} ${X(L_MAKS)},${Y(0)} ${X(L_MAKS)},${Y(H_MAKS)} ${X(Lg)},${Y(H_MAKS)}`,
                  fill: '#D6EFC4' }, omr);
  el('polygon', { points: `${X(0)},${Y(0)} ${X(Lg)},${Y(H_MAKS)} ${X(Lm)},${Y(H_MAKS)}`,
                  fill: 'url(#k-stribe)' }, omr);
  el('polygon', { points: `${X(0)},${Y(0)} ${X(Lm)},${Y(H_MAKS)} ${X(0)},${Y(H_MAKS)}`,
                  fill: 'url(#k-kryds)' }, omr);

  // gitter
  const git = el('g', { stroke: 'rgba(23,33,31,.12)', 'stroke-width': 1 }, omr);
  for (let L = 50; L < L_MAKS; L += 50) el('line', { x1: X(L), y1: Y0, x2: X(L), y2: Y1 }, git);
  for (let H = 1; H < H_MAKS; H++) el('line', { x1: X0, y1: Y(H), x2: X1, y2: Y(H) }, git);

  // grænselinjerne
  el('line', { x1: X(0), y1: Y(0), x2: X(Lm), y2: Y(H_MAKS), stroke: '#566B68', 'stroke-width': 1.5,
               'stroke-dasharray': '4 3' }, omr);
  el('line', { x1: X(0), y1: Y(0), x2: X(Lg), y2: Y(H_MAKS), stroke: '#17211F', 'stroke-width': 3 }, omr);

  // mærkater
  const vinkel = Math.atan2(Y(H_MAKS) - Y(0), X(Lg) - X(0)) * 180 / Math.PI;
  const gx = X(134), gy = Y(134 * GRAENSE) - 7;
  tekst(svg, gx, gy, 'GRÆNSEN 1:40', { class: 'k-graense', transform: `rotate(${vinkel} ${gx} ${gy})` });
  tekst(svg, X(96), Y(4.35), 'DESTRUKTIV', { class: 'k-omr' });
  tekst(svg, X(186), Y(0.62), 'KONSTRUKTIV', { class: 'k-omr' });
  const uv = Math.atan2(Y(H_MAKS) - Y(0), X(Lm) - X(0)) * 180 / Math.PI;
  const ux = X(10.5) - 3, uy = Y(1.9);
  tekst(svg, ux, uy, 'FOR STEJL', { class: 'k-lille', transform: `rotate(${uv} ${ux} ${uy})` });

  // ramme og akser
  el('rect', { x: X0, y: Y0, width: X1 - X0, height: Y1 - Y0, fill: 'none', stroke: '#17211F', 'stroke-width': 2 }, svg);
  for (let L = 0; L <= L_MAKS; L += 50){
    el('line', { x1: X(L), y1: Y1, x2: X(L), y2: Y1 + 5, stroke: '#17211F', 'stroke-width': 1.5 }, svg);
    tekst(svg, X(L), Y1 + 17, String(L), { class: 'k-tal', 'text-anchor': 'middle' });
  }
  for (let H = 0; H <= H_MAKS; H++){
    el('line', { x1: X0 - 5, y1: Y(H), x2: X0, y2: Y(H), stroke: '#17211F', 'stroke-width': 1.5 }, svg);
    tekst(svg, X0 - 9, Y(H) + 4, String(H), { class: 'k-tal', 'text-anchor': 'end' });
  }
  // periodeaksen foroven: L = g·T² / 2π
  for (const T of [4, 6, 8, 10, 12]){
    const x = X(boelgelaengde(T));
    el('line', { x1: x, y1: Y0 - 5, x2: x, y2: Y0, stroke: '#17211F', 'stroke-width': 1.5 }, svg);
    tekst(svg, x, Y0 - 9, T + ' s', { class: 'k-tal', 'text-anchor': 'middle' });
  }
  tekst(svg, X0, 16, 'PERIODE ', { class: 'k-akse' }).appendChild(enhed('T'));
  tekst(svg, X1, 16, 'TRÆK I PUNKTET', { class: 'k-lille', 'text-anchor': 'end' });
  tekst(svg, (X0 + X1) / 2, Y1 + 38, 'BØLGELÆNGDE ', { class: 'k-akse', 'text-anchor': 'middle' })
    .append(enhed('L'), ' (', enhed('m'), ')');
  const hy = (Y0 + Y1) / 2;
  tekst(svg, 14, hy, 'BØLGEHØJDE ', { class: 'k-akse', 'text-anchor': 'middle', transform: `rotate(-90 14 ${hy})` })
    .append(enhed('H'), ' (', enhed('m'), ')');

  // ── Bølgen selv ──────────────────────────────────────
  const linje = el('line', { x1: X(0), y1: Y(0), stroke: '#17211F', 'stroke-width': 2, 'stroke-dasharray': '6 4' }, svg);
  const maerke = el('g', {}, svg);
  const maerkeBund = el('rect', { height: 20, rx: 10, fill: '#FFF9EE', stroke: '#17211F', 'stroke-width': 1.5 }, maerke);
  const maerkeTekst = tekst(maerke, 0, 0, '', { class: 'k-punkt-tal' });
  const punkt = el('circle', { r: 8.5, stroke: '#17211F', 'stroke-width': 2.5, class: 'k-punkt' }, svg);

  // ── Træk i punktet ───────────────────────────────────
  function fraKlik(ev){
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    let L = (p.x - X0) / (X1 - X0) * L_MAKS;
    let H = (Y1 - p.y) / (Y1 - Y0) * H_MAKS;
    let T = Math.sqrt(2 * Math.PI * Math.max(1, L) / G);
    T = Math.min(tMax, Math.max(tMin, T));
    H = Math.min(MAKS_STEJL * boelgelaengde(T), H_MAKS, Math.max(hMin, H));
    onVaelg(H, T);
  }
  let traekker = false;
  svg.addEventListener('pointerdown', ev => {
    traekker = true; svg.setPointerCapture(ev.pointerId); fraKlik(ev); ev.preventDefault();
  });
  svg.addEventListener('pointermove', ev => { if (traekker) fraKlik(ev); });
  const slip = () => { traekker = false; };
  svg.addEventListener('pointerup', slip);
  svg.addEventListener('pointercancel', slip);

  return function opdater(m, type){
    const x = X(Math.min(L_MAKS, m.L)), y = Y(m.H);
    punkt.setAttribute('cx', x); punkt.setAttribute('cy', y);
    punkt.setAttribute('fill', type.farve);
    linje.setAttribute('x2', x); linje.setAttribute('y2', y);
    maerkeTekst.textContent = '1:' + Math.round(1 / m.stejlhed);
    const w = maerkeTekst.getComputedTextLength ? maerkeTekst.getComputedTextLength() + 14 : 44;
    // mærkatet sættes på den side af punktet, hvor der er plads
    let mx = x + 14, my = y - 24;
    if (mx + w > X1 - 2) mx = x - 14 - w;
    if (my < Y0 + 2) my = y + 12;
    maerkeBund.setAttribute('x', mx); maerkeBund.setAttribute('y', my);
    maerkeBund.setAttribute('width', w);
    maerkeTekst.setAttribute('x', mx + 7); maerkeTekst.setAttribute('y', my + 14);
  };
}

function enhed(t){
  const e = document.createElementNS(NS, 'tspan');
  e.setAttribute('class', 'enhed');
  e.textContent = t;
  return e;
}
