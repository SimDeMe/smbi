/* Fjordens vand, salt og ilt — tegning og betjening.
   Regnekernen ligger i model.js. */
import {
  stroemmeFraSalt, saltFraStroemme, naeringOgIlt, iltmaetning, iltTilstand,
  ETA, M_O2, ILTSVIND_MODERAT, ILTSVIND_KRAFTIGT,
} from './model.js';

/* ── Eksempler: medianer af månedsmidler 1988–2026, Horsens Fjord ── */
const EKSEMPLER = {
  aug:   { Qf: 1.6, So: 23.0, Sb: 26.6, Skat: 27.6, T: 17.7, Okat: 166, Pf: 3.2, Pkat: 0.73, gamma: 1.3 },
  feb:   { Qf: 7.4, So: 23.1, Sb: 24.5, Skat: 24.8, T: 3.1,  Okat: 328, Pf: 3.1, Pkat: 0.60, gamma: 1.3 },
  indre: { Qf: 1.6, So: 20.0, Sb: 26.6, Skat: 27.6, T: 17.7, Okat: 166, Pf: 3.2, Pkat: 0.73, gamma: 1.3 },
};

/* ── Skydere ─────────────────────────────────────────────
   log: skyderen er logaritmisk, så både små og store strømme kan
   indstilles præcist. */
const SKYDERE = {
  Qf:    { navn: 'Ferskvand fra åerne', sym: ['Q', 'f'], enhed: 'm³/s', min: 0.2, max: 30, log: true, kl: 'k-fersk' },
  So:    { navn: 'Salt i overfladen', sym: ['S', 'o'], enhed: 'g/kg', min: 0, max: 34, trin: 0.1, kl: 'k-salt' },
  Sb:    { navn: 'Salt i bundvandet', sym: ['S', 'b'], enhed: 'g/kg', min: 0, max: 35, trin: 0.1, kl: 'k-salt' },
  Skat:  { navn: 'Salt i havet udenfor', sym: ['S', 'kat'], enhed: 'g/kg', min: 5, max: 35, trin: 0.1, kl: 'k-salt' },
  Qind:  { navn: 'Havvand ind over tærsklen', sym: ['Q', 'ind'], enhed: 'm³/s', min: 0.2, max: 300, log: true, kl: 'k-flow' },
  Qned:  { navn: 'Nedblanding (vind, tidevand)', sym: ['Q', 'ned'], enhed: 'm³/s', min: 0.02, max: 100, log: true, kl: 'k-flow' },
  T:     { navn: 'Vandtemperatur', sym: ['T', ''], enhed: '°C', min: 0, max: 25, trin: 0.5, kl: 'k-temp' },
  Okat:  { navn: 'Ilt i havvandet udenfor', sym: ['O', 'kat'], enhed: 'mg/L', min: 1, max: 12, trin: 0.1, kl: 'k-ilt', vis: v => v * M_O2 / 1000, fra: v => v * 1000 / M_O2 },
  Pf:    { navn: 'Fosfor i åvandet', sym: ['P', 'f'], enhed: 'mmol/m³', min: 0, max: 8, trin: 0.1, kl: 'k-naer' },
  Pkat:  { navn: 'Fosfor i havvandet', sym: ['P', 'kat'], enhed: 'mmol/m³', min: 0, max: 2.5, trin: 0.05, kl: 'k-naer' },
  gamma: { navn: 'Algeeksport', sym: ['γ', ''], enhed: 'm³/s', min: 0, max: 4, trin: 0.1, kl: 'k-naer' },
};
const VAND_A = ['Qf', 'So', 'Sb', 'Skat'];
const VAND_B = ['Qf', 'Skat', 'Qind', 'Qned'];
const ILT = ['T', 'Okat', 'Pf', 'Pkat', 'gamma'];

const $ = id => document.getElementById(id);
const tal = (v, d) => v.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d });
const flowTal = q => tal(q, q < 1 ? 2 : q < 20 ? 1 : 0);
const decimaler = (k, v) => SKYDERE[k].log ? (v < 1 ? 2 : v < 20 ? 1 : 0)
  : (SKYDERE[k].trin < 0.1 ? 2 : SKYDERE[k].trin < 1 ? 1 : 0);

/* ── Tilstand ─────────────────────────────────────────── */
const s = { modus: 'a', ...EKSEMPLER.aug, Qind: 8, Qned: 2.2 };
let res = null;   // seneste beregning
synkB();

/* B-skydernes strømme følger A-beregningen, så skiftet er glidende. */
function synkB() {
  const q = stroemmeFraSalt(s);
  if (q.gyldig) { s.Qind = q.Qind; s.Qned = Math.max(q.Qned, SKYDERE.Qned.min); }
}
function synkA() {
  const q = saltFraStroemme(s);
  s.So = Math.round(q.So * 10) / 10;
  s.Sb = Math.round(q.Sb * 10) / 10;
}

function beregn() {
  const q = s.modus === 'a' ? stroemmeFraSalt(s) : saltFraStroemme(s);
  if (!q.gyldig) return { q, n: null };
  const Os = iltmaetning(s.T, q.So);
  const n = naeringOgIlt(q, { Pf: s.Pf, Pkat: s.Pkat, gamma: s.gamma, Os, Okat: s.Okat });
  return { q, n, Os };
}

/* ── Skydere bygges ───────────────────────────────────── */
function tilPos(k, v) {
  const d = SKYDERE[k];
  if (d.log) return Math.round(1000 * Math.log(Math.max(v, d.min) / d.min) / Math.log(d.max / d.min));
  return d.vis ? d.vis(v) : v;
}
function fraPos(k, p) {
  const d = SKYDERE[k];
  if (d.log) return d.min * Math.pow(d.max / d.min, p / 1000);
  return d.fra ? d.fra(+p) : +p;
}
function visVaerdi(k) {
  const d = SKYDERE[k];
  const v = d.vis ? d.vis(s[k]) : s[k];
  return `${tal(v, decimaler(k, v))} ${d.enhed}`;
}
function symHTML([b, i]) { return `<i>${b}</i>${i ? `<sub>${i}</sub>` : ''}`; }

function bygKnobs(el, noegler) {
  el.innerHTML = '';
  for (const k of noegler) {
    const d = SKYDERE[k];
    const lab = document.createElement('label');
    lab.className = 'knob';
    lab.htmlFor = 'inp-' + k;
    lab.innerHTML = `<span class="knob-top"><span class="navn">${d.navn} ${symHTML(d.sym)}</span>
      <span class="knob-val" id="lbl-${k}"></span></span>
      <input type="range" id="inp-${k}" class="${d.kl}">`;
    el.appendChild(lab);
    const inp = lab.querySelector('input');
    if (d.log) { inp.min = 0; inp.max = 1000; inp.step = 1; }
    else { inp.min = d.min; inp.max = d.max; inp.step = d.trin; }
    inp.value = tilPos(k, s[k]);
    inp.addEventListener('input', () => {
      s[k] = fraPos(k, inp.value);
      $('eksempel').value = '';
      opdater();
    });
  }
  if (noegler === ILT) {
    const p = document.createElement('p');
    p.className = 'fast';
    p.id = 'note-os';
    el.appendChild(p);
  }
}
function opdaterKnobs() {
  for (const k of Object.keys(SKYDERE)) {
    const lbl = $('lbl-' + k);
    if (!lbl) continue;
    lbl.textContent = visVaerdi(k);
    const inp = $('inp-' + k);
    const d = SKYDERE[k];
    inp.setAttribute('aria-valuetext', visVaerdi(k));
    if (document.activeElement !== inp) inp.value = tilPos(k, s[k]);
    void d;
  }
}

/* ── Tegning ──────────────────────────────────────────── */
const svg = $('fig');
const NS = 'http://www.w3.org/2000/svg';
const H = 420;
let W = 760;
const animer = [];   // stier med bevægelige streger: [element, fart]

function el(navn, attr = {}, forael = svg) {
  const e = document.createElementNS(NS, navn);
  for (const [a, v] of Object.entries(attr)) e.setAttribute(a, v);
  forael.appendChild(e);
  return e;
}
/* Saltfarve: ferskt vand lyst, salt vand mørkt blåt. */
function saltFarve(S) {
  const t = Math.max(0, Math.min(1, S / 35));
  const a = [232, 246, 251], b = [36, 112, 165];
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * Math.pow(t, 1.3)));
  return `rgb(${c.join(',')})`;
}
/* Catmull-Rom gennem punkterne → glat sti */
function glat(p) {
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
/* Tekst med tegnforklaring som "Q_ind = 8,0 m³/s" (sænket indeks) */
function etiket(x, y, dele, { anker = 'start', kl = 'lbl', farve = '#17211F', bund = 'rgba(255,255,255,.88)' } = {}) {
  const g = el('g');
  const t = el('text', { x, y, 'text-anchor': anker, class: kl, fill: farve }, g);
  for (const del of dele) {
    if (typeof del === 'string') { const sp = el('tspan', {}, t); sp.textContent = del; }
    else {
      const a = el('tspan', { 'font-style': 'italic' }, t); a.textContent = del[0];
      if (del[1]) {
        const b = el('tspan', { dy: 4, 'font-size': '0.72em' }, t); b.textContent = del[1];
        const c = el('tspan', { dy: -4 }, t); c.textContent = ' ';
      }
    }
  }
  const bb = t.getBBox();
  const r = el('rect', { x: bb.x - 6, y: bb.y - 2, width: bb.width + 12, height: bb.height + 4, rx: 7, fill: bund }, g);
  g.insertBefore(r, t);
  return g;
}
function bredde(Q) { return Math.max(3, Math.min(30, 3 + 3.2 * Math.sqrt(Math.max(Q, 0)))); }
function pil(d, Q, farve, id) {
  const w = bredde(Q);
  el('path', { d, fill: 'none', stroke: '#17211F', 'stroke-width': w + 3, 'stroke-linecap': 'round', 'marker-end': `url(#hoved-ink)` });
  el('path', { d, fill: 'none', stroke: farve, 'stroke-width': w, 'stroke-linecap': 'round', 'marker-end': `url(#hoved-${id})` });
  const str = el('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.7)', 'stroke-width': Math.max(1.5, w * 0.3),
    'stroke-linecap': 'round', 'stroke-dasharray': '2 16' });
  animer.push([str, 10 + 9 * Math.sqrt(Math.max(Q, 0))]);
}
function markoer(id, farve, skala = 1) {
  const m = el('marker', { id: 'hoved-' + id, viewBox: '0 0 10 10', refX: 3, refY: 5,
    markerWidth: 2.4 * skala, markerHeight: 2.4 * skala, orient: 'auto-start-reverse', markerUnits: 'strokeWidth' }, svg.querySelector('defs'));
  el('path', { d: 'M0,0 L10,5 L0,10 z', fill: farve, stroke: 'none' }, m);
}

const FARVE = { f: '#0FA593', ud: '#5DB6E6', ind: '#0B4F7C', ned: '#7A4FD6', op: '#B39AF0', alge: '#5FB030' };

function tegn() {
  /* Bredden følger rammen, så teksten bevarer sin størrelse. */
  const boks = svg.parentElement.getBoundingClientRect();
  const bred = matchMedia('(min-width:900px)').matches;
  const cw = Math.max(200, boks.width - 20), ch = Math.max(200, boks.height - 20);
  W = bred ? Math.round(Math.max(600, Math.min(1100, H * cw / ch)))
           : Math.round(Math.max(540, Math.min(900, cw * 1.25)));
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  for (const c of [...svg.children]) if (c.tagName !== 'title' && c.tagName !== 'desc') c.remove();
  animer.length = 0;
  const defs = el('defs');
  markoer('ink', '#17211F', 0.82);
  for (const [k, f] of Object.entries(FARVE)) markoer(k, f);

  const { q, n } = res;
  const ys = 78, yk = 182, yt = 244, yb = 398, yr = 372;
  const xs = 0.70 * W;   // tærsklen
  const xk = 0.085 * W;  // kysten

  // luft
  el('rect', { x: 0, y: 0, width: W, height: ys, fill: '#F4FAFD' });

  // vandlag
  const gO = el('linearGradient', { id: 'g-o', x1: 0, x2: W, y1: 0, y2: 0, gradientUnits: 'userSpaceOnUse' }, defs);
  el('stop', { offset: 0.72, 'stop-color': saltFarve(q.So) }, gO);
  el('stop', { offset: 1, 'stop-color': '#DCEAF0' }, gO);
  const gB = el('linearGradient', { id: 'g-b', x1: xs - 0.03 * W, x2: xs + 0.04 * W, y1: 0, y2: 0, gradientUnits: 'userSpaceOnUse' }, defs);
  el('stop', { offset: 0, 'stop-color': saltFarve(q.Sb) }, gB);
  el('stop', { offset: 1, 'stop-color': saltFarve(q.Skat) }, gB);
  el('rect', { x: 0, y: ys, width: W, height: yk - ys, fill: 'url(#g-o)' });
  el('rect', { x: 0, y: yk, width: W, height: H - yk, fill: 'url(#g-b)' });

  // iltsvind: rød skravering i fjordens bundvand
  if (n && n.Ob < ILTSVIND_MODERAT) {
    const st = Math.min(1, (ILTSVIND_MODERAT - n.Ob) / ILTSVIND_MODERAT);
    const pat = el('pattern', { id: 'skrav', width: 10, height: 10, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    el('rect', { width: 4, height: 10, fill: '#E8336D' }, pat);
    el('rect', { x: 0, y: yk, width: xs, height: H - yk, fill: 'url(#skrav)', opacity: (0.18 + 0.5 * st).toFixed(2) });
  }

  // bund og land
  const bund = [[0, ys - 40], [0.05 * W, ys - 34], [xk, ys], [0.13 * W, ys + 70], [0.22 * W, yb - 46], [0.40 * W, yb],
    [0.58 * W, yb - 26], [xs - 0.035 * W, yt + 14], [xs, yt], [xs + 0.04 * W, yt + 14], [0.84 * W, yr], [W + 5, yr]];
  el('path', { d: glat(bund) + ` L${W + 5},${H + 5} L-5,${H + 5} L-5,${ys - 40} Z`, fill: '#D8BC8A', stroke: '#17211F', 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
  // overfladen
  el('line', { x1: xk, y1: ys, x2: W, y2: ys, stroke: '#17211F', 'stroke-width': 2 });
  // springlaget
  el('line', { x1: 0.13 * W, y1: yk, x2: W, y2: yk, stroke: '#17211F', 'stroke-width': 1.6, 'stroke-dasharray': '7 6', opacity: 0.7 });
  etiket(0.62 * W, yk - 8, ['springlag'], { kl: 'mono-s', bund: 'rgba(255,255,255,.6)', farve: '#3E4E4C' });

  // å
  el('path', { d: `M0,${ys - 44} Q${0.04 * W},${ys - 40} ${xk},${ys}`, fill: 'none', stroke: '#7CC3EA', 'stroke-width': 6, 'stroke-linecap': 'round' });

  etiket(W - 10, ys - 14, ['Åbent hav'], { anker: 'end', kl: 'lbl-s' });

  if (!q.gyldig) {
    etiket(0.42 * W, (ys + yb) / 2, ['Ingen fysisk løsning — se advarslen'], { anker: 'middle', farve: '#B83A12', bund: '#FFE9E0' });
    return;
  }

  // alger, der synker og nedbrydes
  const xa = 0.31 * W;
  for (let i = 0; i < 5; i++) el('circle', { cx: xa - 18 + i * 9, cy: ys + 14 + (i % 2) * 6, r: 3.2, fill: FARVE.alge, stroke: '#17211F', 'stroke-width': 1 });
  const wa = Math.max(2, Math.min(10, 2 + 2.4 * Math.sqrt(n.EP)));
  const bolge = `M${xa},${ys + 28} q10,22 0,44 q-10,22 0,44 q10,22 0,44 q-10,22 0,44`;
  el('path', { d: bolge, fill: 'none', stroke: FARVE.alge, 'stroke-width': wa, 'stroke-linecap': 'round', 'stroke-dasharray': '1 9', 'marker-end': 'url(#hoved-alge)' });

  // strømme
  pil(`M${0.012 * W},${ys - 52} Q${0.06 * W},${ys - 46} ${0.115 * W},${ys + 20}`, q.Qf, FARVE.f, 'f');
  pil(`M${0.50 * W},${ys + 66} L${0.955 * W},${ys + 66}`, q.Qud, FARVE.ud, 'ud');
  pil(`M${0.985 * W},${yk + 70} C${0.86 * W},${yk + 64} ${0.78 * W},${yk + 26} ${xs},${yk + 30} S${0.60 * W},${yk + 50} ${0.555 * W},${yk + 92}`, q.Qind, FARVE.ind, 'ind');
  pil(`M${0.445 * W},${yk - 50} C${0.45 * W},${yk - 18} ${0.44 * W},${yk + 10} ${0.445 * W},${yk + 40}`, q.Qned, FARVE.ned, 'ned');
  pil(`M${0.215 * W},${yk + 54} C${0.205 * W},${yk + 20} ${0.225 * W},${yk - 14} ${0.215 * W},${yk - 50}`, q.Qop, FARVE.op, 'op');

  // strømmenes tal
  etiket(0.012 * W, ys - 62, [['Q', 'f'], ' = ' + flowTal(q.Qf) + ' m³/s']);
  etiket(0.955 * W, ys + 66 - bredde(q.Qud) / 2 - 10, [['Q', 'ud'], ' = ' + flowTal(q.Qud)], { anker: 'end' });
  etiket(0.985 * W, yk + 70 + bredde(q.Qind) / 2 + 22, [['Q', 'ind'], ' = ' + flowTal(q.Qind)], { anker: 'end' });
  etiket(0.445 * W + bredde(q.Qned) / 2 + 10, yk + 26, [['Q', 'ned'], ' = ' + flowTal(q.Qned)]);
  etiket(0.215 * W + bredde(q.Qop) / 2 + 10, yk + 40, [['Q', 'op'], ' = ' + flowTal(q.Qop)]);

  // lagenes saliniteter og ilt
  etiket(0.50 * W, ys + 24, ['Overflade  ', ['S', 'o'], ' = ' + tal(q.So, 1) + ' g/kg']);
  const mg = n.Ob * M_O2 / 1000;
  etiket(0.40 * W, yb - 66, ['Bundvand  ', ['S', 'b'], ' = ' + tal(q.Sb, 1) + ' g/kg'], { anker: 'middle' });
  etiket(0.40 * W, yb - 42, [['O', '2'], ' = ' + (mg <= 0 ? '0 (iltfrit)' : tal(mg, 1) + ' mg/L')], { anker: 'middle',
    farve: n.Ob < ILTSVIND_MODERAT ? '#B83A12' : '#17211F' });
  etiket(0.985 * W, yr - 16, [['S', 'kat'], ' = ' + tal(q.Skat, 1) + ' g/kg'], { anker: 'end', kl: 'lbl-s' });
  etiket(xa + 14, ys + 196, ['alger synker, O₂ bruges'], { kl: 'lbl-s', farve: '#3B6E1F', bund: 'rgba(255,255,255,.75)' });
}

/* bevægelige streger — fart følger strømmen */
let koer = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let t0 = performance.now();
function trin(t) {
  const sek = (t - t0) / 1000;
  for (const [p, fart] of animer) p.setAttribute('stroke-dashoffset', (-sek * fart).toFixed(1));
  if (koer) requestAnimationFrame(trin);
}

/* ── Opdatering ───────────────────────────────────────── */
let srTimer = 0;
function opdater() {
  res = beregn();
  opdaterKnobs();
  const { q, n, Os } = res;
  const adv = $('advarsel');
  if (!q.gyldig) {
    adv.hidden = false;
    adv.innerHTML = '<b>Ingen fysisk løsning.</b> ' + q.fejl.join(' ');
    for (const id of ['v-forst', 'v-ds', 'v-ilt', 'v-pb']) $(id).textContent = '–';
    for (const id of ['n-forst', 'n-ds', 'n-ilt', 'n-pb']) $(id).textContent = '';
    $('boks-ilt').className = '';
    tegn();
    return;
  }
  adv.hidden = true;

  $('v-forst').innerHTML = `${tal(q.Qud / q.Qf, 1)}<small>× åvandet</small>`;
  $('n-forst').innerHTML = `Q<sub>ud</sub> = ${flowTal(q.Qud)} m³/s`;
  $('v-ds').innerHTML = `${tal(q.Sb - q.So, 1)}<small>g/kg</small>`;
  $('n-ds').innerHTML = `S<sub>b</sub> − S<sub>o</sub> · ${q.Sb - q.So < 1 ? 'svagt' : q.Sb - q.So < 4 ? 'moderat' : 'kraftigt'}`;
  const mg = n.Ob * M_O2 / 1000;
  const til = iltTilstand(n.Ob);
  $('v-ilt').innerHTML = mg <= 0 ? '0<small>mg/L</small>' : `${tal(mg, 1)}<small>mg/L</small>`;
  $('n-ilt').textContent = `${tal(Math.max(n.Ob, 0), 0)} mmol/m³ · ${til.navn}`;
  $('boks-ilt').className = 'ilt-' + til.niveau;
  $('v-pb').innerHTML = `${tal(100 * n.andelFraAa, 0)}<small>%</small>`;
  $('n-pb').textContent = 'af P-tilførslen';

  const os = $('note-os');
  if (os) os.innerHTML = `Overflade (mættet): O<sub>s</sub> = ${tal(Os * M_O2 / 1000, 1)} mg/L · η = ${ETA} O₂/P`;

  tegn();

  $('fig-besk').textContent = `Ferskvand ${flowTal(q.Qf)} m³/s løber ud i overfladelaget med salinitet ${tal(q.So, 1)} g/kg. `
    + `Havvand ${flowTal(q.Qind)} m³/s med salinitet ${tal(q.Skat, 1)} strømmer ind over tærsklen. `
    + `${flowTal(q.Qud)} m³/s løber ud i overfladen. Bundvandet har salinitet ${tal(q.Sb, 1)} og ${mg <= 0 ? 'ingen ilt' : tal(mg, 1) + ' mg/L ilt'}.`;
  clearTimeout(srTimer);
  srTimer = setTimeout(() => {
    $('sr-status').textContent = `Udstrømning ${tal(q.Qud / q.Qf, 1)} gange åvandet. Ilt i bundvandet ${mg <= 0 ? '0' : tal(mg, 1)} mg/L, ${til.navn}.`;
  }, 600);
}

/* ── Knapper og faner ─────────────────────────────────── */
function saetModus(m) {
  if (m === s.modus) return;
  if (m === 'b') synkB(); else synkA();
  s.modus = m;
  $('modus-a').setAttribute('aria-pressed', m === 'a');
  $('modus-b').setAttribute('aria-pressed', m === 'b');
  bygKnobs($('knobs-vand'), m === 'a' ? VAND_A : VAND_B);
  opdater();
}
$('modus-a').addEventListener('click', () => saetModus('a'));
$('modus-b').addEventListener('click', () => saetModus('b'));

$('eksempel').addEventListener('change', e => {
  const ex = EKSEMPLER[e.target.value];
  if (!ex) return;
  Object.assign(s, ex);
  synkB();
  if (s.modus === 'b') synkA();
  opdater();
});

const faner = [$('fane-vand'), $('fane-ilt')];
function vaelgFane(i, fokus) {
  faner.forEach((f, j) => {
    f.setAttribute('aria-selected', i === j);
    f.tabIndex = i === j ? 0 : -1;
    $(f.getAttribute('aria-controls')).hidden = i !== j;
  });
  if (fokus) faner[i].focus();
}
faner.forEach((f, i) => {
  f.addEventListener('click', () => vaelgFane(i));
  f.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); vaelgFane((i + 1) % 2, true); }
  });
});

$('btn-anim').addEventListener('click', e => {
  koer = !koer;
  e.currentTarget.setAttribute('aria-pressed', koer);
  e.currentTarget.textContent = koer ? 'Strøm ▶' : 'Strøm ❚❚';
  if (koer) { t0 = performance.now(); requestAnimationFrame(trin); }
});
$('btn-anim').setAttribute('aria-pressed', koer);
if (!koer) $('btn-anim').textContent = 'Strøm ❚❚';

$('btn-fokus').addEventListener('click', e => {
  const paa = document.body.dataset.fokus !== '1';
  document.body.dataset.fokus = paa ? '1' : '0';
  e.currentTarget.setAttribute('aria-pressed', paa);
});
if (new URLSearchParams(location.search).get('fokus') === '1' || document.body.dataset.fokus === '1') {
  document.body.dataset.fokus = '1';
  $('btn-fokus').setAttribute('aria-pressed', 'true');
}

/* ── Start ────────────────────────────────────────────── */
bygKnobs($('knobs-vand'), VAND_A);
bygKnobs($('knobs-ilt'), ILT);
opdater();
if (koer) requestAnimationFrame(trin);
let rTimer = 0;
new ResizeObserver(() => { cancelAnimationFrame(rTimer); rTimer = requestAnimationFrame(tegn); }).observe(svg.parentElement);
if (document.fonts) document.fonts.ready.then(tegn);
