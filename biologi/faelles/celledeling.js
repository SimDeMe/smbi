/* ═══════════════════════════════════════════════════════════════
   celledeling.js — fælles motor til mitose og meiose på smbi.dk

   Motoren kender ikke ordet «mitose». Den får en MODEL:

     {
       titel, bredde, hoejde,            // SVG-koordinatsystem
       skala,                            // længde (enheder) af et kromosom
                                         //   med laengde 1 i fuld kondensering
       kromosomer: [{ id, navn, par, ophav, laengde, centromer,
                      farve, moerk, baand }],
       spindelpar: [['cA','cB']],        // centrosomer, der danner én spindel
       faser: [{ id, navn, kort, tekst, tilstand, etiketter }]
     }

   og en TILSTAND pr. fase:

     {
       lapper:      { id: {x, y, r} },        // cellens «lapper» (se celleOmrids)
       kerner:      { id: {x, y, r, synlig} },
       centrosomer: { id: {x, y, synlig} },
       kromosomer:  { id: {x, y, vinkel, kond, samlet, splay,
                           kromatider: { a: {...}, b: {...} } } },
       spindel: 0–1, ekvator: 0–1
     }

   Et kromatid: { x, y, vinkel, boej, synlig, pol, fast }.
   Så længe søsterkromatiderne er samlet (samlet = 1), regnes deres
   placering ud fra kromosomet, så man kun skal angive kromosomets
   centromer. Efter adskillelsen (samlet = 0) bruges kromatidets egne tal.

   Mellem to faser blandes tilstandene tal for tal (interpolation).
   Ting, der kun findes i den ene fase, får synlig = 0 i den anden og
   toner dermed ind eller ud.

   Tælling: Et kromosom tælles ved sin centromer. To søsterkromatider
   med fælles centromer (samlet = 1) er ét kromosom; når de er skilt,
   er hvert kromatid et selvstændigt kromosom.
   ═══════════════════════════════════════════════════════════════ */

const lerp = (a, b, t) => a + (b - a) * t;
const klem = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const rad = g => g * Math.PI / 180;
const r1 = v => Math.round(v * 10) / 10;

/* ── Udseende ────────────────────────────────────────────────── */
export const FARVER = {
  blaek: '#17211F',
  papir: '#FFF9EE',
  cytoplasma: '#FDEFF3',
  kerne: '#F1ECFA',
  kernekant: '#4A3F6B',
  centrosom: '#FFD98A',
  spindel: '#6F8783',
  etiket: '#17211F',
  ekvator: '#7A4FD6'
};
const SKRIFT = "Archivo, 'Helvetica Neue', Arial, sans-serif";

/* Kondensering k: 0 = udfoldet kromatintråd, 1 = kompakt metafasekromosom. */
export const GEOMETRI = {
  bredde: k => lerp(1.6, 6.2, k),           // ét kromatids tykkelse
  spaend: k => lerp(1.55, 1, k),            // trådens udstrækning i forhold til kompakt
  boelge: k => 3.6 * Math.pow(1 - k, 1.4),  // trådens bugtning
  boelgelaengde: 7.5,
  mellemrum: k => lerp(3.4, 0.15, k)        // luft mellem søsterkromatider
};

/* ── Blanding af to tilstande ────────────────────────────────── */
function skjult(o){
  return (o && typeof o === 'object' && 'synlig' in o) ? {...o, synlig: 0} : o;
}
export function bland(a, b, t){
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, t);
  if (a && b && typeof a === 'object' && typeof b === 'object'){
    const ud = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])){
      if (!(k in a)) ud[k] = bland(skjult(b[k]), b[k], t);
      else if (!(k in b)) ud[k] = bland(a[k], skjult(a[k]), t);
      else ud[k] = bland(a[k], b[k], t);
    }
    return ud;
  }
  // tekst/null (fx hvilken pol et kromatid er fæstnet til)
  return t < .5 ? (a ?? b) : (b ?? a);
}

/* ── Koreografi: hver proces sin tid og sin kurve ────────────── */
/* Et faseskift (fra fase i−1 til fase i) består af flere processer, der
   ikke sker samtidig. Fasen kan angive dem i `koreografi`:

     koreografi: {
       kond:      {vindue: [0, .8], kurve: 'blød', forskydning: .3},
       kerne:     {vindue: [.3, 1]},
       ...
     }

   vindue      — hvornår i skiftet (0–1) processen foregår
   kurve       — bevægelsens forløb (se KURVER)
   forskydning — kromosomerne starter forskudt (0 = samtidig; .3 = det
                 sidste kromosom starter, når 30 % af skiftet er gået)

   Kanaler: celle, kerne, centrosom, spindel (også spindeltrådenes fæste),
   ekvator, kond, bevaegelse (kromosomers/kromatiders placering og form),
   adskil (søsterkromatidernes forbindelse), kopi (DNA-kopieringen).
   Kanaler, der ikke nævnes, bruger hele skiftet med kurven 'blød'. */
export const KURVER = {
  lineaer: u => u,
  'blød': u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
  ud: u => 1 - Math.pow(1 - u, 3),
  ind: u => u * u * u,
  // langsom start, fast fart, blød opbremsning — kromatider, der trækkes
  traek: u => u < .5 ? 8 * u ** 4 : 1 - 8 * (1 - u) ** 4,
  // lille overslag — kromosomer, der svinger ind på plads i ækvatorialplanet
  fjeder: u => { const c1 = 1.35, c3 = c1 + 1; return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2; }
};
const KANAL_STANDARD = {vindue: [0, 1], kurve: 'blød', forskydning: 0};

function lokalTid(kor, kanal, t, rang = 0){
  const k = {...KANAL_STANDARD, ...(kor?.[kanal] || {})};
  const sigma = klem(k.forskydning, 0, 0.9);
  const tt = klem((t - sigma * rang) / (1 - sigma));
  const [a, b] = k.vindue;
  return (KURVER[k.kurve] || KURVER['blød'])(klem((tt - a) / Math.max(1e-6, b - a)));
}

/* Bland to normaliserede tilstande efter koreografien (t er lineær 0–1). */
export function blandFase(model, A, B, t, kor = {}){
  const tid = (kanal, rang) => lokalTid(kor, kanal, t, rang);
  const ud = {
    lapper: bland(A.lapper, B.lapper, tid('celle')),
    kerner: bland(A.kerner, B.kerner, tid('kerne')),
    centrosomer: bland(A.centrosomer, B.centrosomer, tid('centrosom')),
    spindel: lerp(A.spindel, B.spindel, tid('spindel')),
    ekvator: lerp(A.ekvator, B.ekvator, tid('ekvator')),
    kromosomer: {}
  };
  const raekke = kor.raekkefoelge || model.kromosomer.map(k => k.id);
  const n = raekke.length;
  for (const kr of model.kromosomer){
    const rang = n > 1 ? raekke.indexOf(kr.id) / (n - 1) : 0;
    const KA = A.kromosomer[kr.id], KB = B.kromosomer[kr.id];
    const tb = tid('bevaegelse', rang), tk = tid('kond', rang), ta = tid('adskil', rang);
    const tc = tid('kopi', rang), ts = tid('spindel', rang);
    const K = {
      x: lerp(KA.x, KB.x, tb), y: lerp(KA.y, KB.y, tb), vinkel: lerp(KA.vinkel, KB.vinkel, tb),
      kond: lerp(KA.kond, KB.kond, tk), samlet: lerp(KA.samlet, KB.samlet, ta), kromatider: {}
    };
    for (const side of ['a', 'b']){
      const a = KA.kromatider[side], b = KB.kromatider[side];
      K.kromatider[side] = {
        x: lerp(a.x, b.x, tb), y: lerp(a.y, b.y, tb), vinkel: lerp(a.vinkel, b.vinkel, tb), boej: lerp(a.boej, b.boej, tb),
        synlig: lerp(a.synlig, b.synlig, tc), fast: lerp(a.fast, b.fast, ts),
        pol: ts < .5 ? (a.pol ?? b.pol) : (b.pol ?? a.pol)
      };
    }
    ud.kromosomer[kr.id] = K;
  }
  return ud;
}

/* ── Udfyld en forfattet tilstand ────────────────────────────── */
/* Sætter standardværdier og regner søsterkromatidernes placering ud fra
   kromosomet, når de er samlet. Køres én gang pr. fase ved opstart. */
export function normaliser(model, T){
  const ud = {
    lapper: {}, kerner: {}, centrosomer: {}, kromosomer: {},
    spindel: T.spindel ?? 0, ekvator: T.ekvator ?? 0
  };
  for (const [id, l] of Object.entries(T.lapper || {})) ud.lapper[id] = {synlig: 1, ...l};
  for (const [id, k] of Object.entries(T.kerner || {})) ud.kerner[id] = {synlig: 1, ...k};
  for (const [id, c] of Object.entries(T.centrosomer || {})) ud.centrosomer[id] = {synlig: 1, ...c};
  for (const kr of model.kromosomer){
    const K = T.kromosomer[kr.id];
    if (!K) throw new Error('Fase mangler kromosom ' + kr.id);
    const kond = K.kond ?? 0, samlet = K.samlet ?? 1, splay = K.splay ?? 0;
    const A = K.kromatider?.a || {}, B = K.kromatider?.b || {};
    const synA = A.synlig ?? 1, synB = B.synlig ?? 1;
    // søstrene ligger side om side, når der er to
    const off = (GEOMETRI.bredde(kond) / 2 + GEOMETRI.mellemrum(kond)) * (synB > 0 ? 1 : 0);
    const v = rad(K.vinkel ?? 90);
    const n = [Math.cos(v - Math.PI / 2), Math.sin(v - Math.PI / 2)];
    const ny = {x: K.x, y: K.y, vinkel: K.vinkel ?? 90, kond, samlet, kromatider: {}};
    const lav = (C, fortegn, syn) => {
      const samletPos = {
        x: K.x + n[0] * off * fortegn, y: K.y + n[1] * off * fortegn,
        vinkel: K.vinkel ?? 90, boej: splay * fortegn
      };
      const egen = samlet >= 1 ? samletPos : {
        x: C.x ?? samletPos.x, y: C.y ?? samletPos.y,
        vinkel: C.vinkel ?? samletPos.vinkel, boej: C.boej ?? samletPos.boej
      };
      return {...egen, synlig: syn, pol: C.pol ?? null, fast: C.fast ?? 0};
    };
    ny.kromatider.a = lav(A, -1, synA);
    ny.kromatider.b = lav(B, +1, synB);
    ud.kromosomer[kr.id] = ny;
  }
  return ud;
}

/* ── Cellens omrids ──────────────────────────────────────────── */
/* Cellen tegnes som et «felt» af en eller flere lapper (metaballs):
   f = Σ (r²/d²)². Grænsen går ved f = 1. Én lap giver en cirkel; to lapper
   oven i hinanden giver én cirkel (radius r·2^¼); trækkes de fra hinanden,
   bliver cellen aflang, snøres ind og deler sig til sidst i to runde
   celler — hver med halvdelen af arealet. Konturen findes med «marching
   squares». */
function felt(lapper, x, y){
  let f = 0;
  for (const l of lapper){
    const q = ((x - l.x) ** 2 + (y - l.y) ** 2) / (l.r * l.r);
    f += q < 1e-9 ? 1e9 : 1 / (q * q);
  }
  return f;
}
export function celleOmrids(lapperObj, trin = 2.5){
  const lapper = Object.values(lapperObj).filter(l => l.synlig > 0.01);
  if (!lapper.length) return '';
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const l of lapper){
    x0 = Math.min(x0, l.x - l.r * 1.5); x1 = Math.max(x1, l.x + l.r * 1.5);
    y0 = Math.min(y0, l.y - l.r * 1.5); y1 = Math.max(y1, l.y + l.r * 1.5);
  }
  const nx = Math.ceil((x1 - x0) / trin) + 1, ny = Math.ceil((y1 - y0) / trin) + 1;
  // h = f^(-1/4) er næsten lineær i afstanden — god til interpolation
  const h = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++){
    h[j * nx + i] = Math.pow(felt(lapper, x0 + i * trin, y0 + j * trin), -0.25);
  }
  const H = (i, j) => h[j * nx + i];
  const ind = (i, j) => H(i, j) < 1;
  const punkt = new Map();
  const kantPunkt = (key, i0, j0, i1, j1) => {
    if (!punkt.has(key)){
      const a = H(i0, j0), b = H(i1, j1), t = (1 - a) / (b - a);
      punkt.set(key, [x0 + lerp(i0, i1, t) * trin, y0 + lerp(j0, j1, t) * trin]);
    }
    return key;
  };
  const seg = [];
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++){
    const c = (ind(i, j) ? 8 : 0) | (ind(i + 1, j) ? 4 : 0) | (ind(i + 1, j + 1) ? 2 : 0) | (ind(i, j + 1) ? 1 : 0);
    if (c === 0 || c === 15) continue;
    const T = () => kantPunkt(`h${i},${j}`, i, j, i + 1, j);
    const R = () => kantPunkt(`v${i + 1},${j}`, i + 1, j, i + 1, j + 1);
    const B = () => kantPunkt(`h${i},${j + 1}`, i, j + 1, i + 1, j + 1);
    const L = () => kantPunkt(`v${i},${j}`, i, j, i, j + 1);
    const midt = (H(i, j) + H(i + 1, j) + H(i + 1, j + 1) + H(i, j + 1)) / 4 < 1;
    switch (c){
      case 1: case 14: seg.push([L(), B()]); break;
      case 2: case 13: seg.push([B(), R()]); break;
      case 3: case 12: seg.push([L(), R()]); break;
      case 4: case 11: seg.push([T(), R()]); break;
      case 6: case 9:  seg.push([T(), B()]); break;
      case 7: case 8:  seg.push([T(), L()]); break;
      case 5: if (midt){ seg.push([T(), L()], [B(), R()]); } else { seg.push([T(), R()], [L(), B()]); } break;
      case 10: if (midt){ seg.push([T(), R()], [L(), B()]); } else { seg.push([T(), L()], [B(), R()]); } break;
    }
  }
  // saml segmenterne til lukkede løkker
  const naboer = new Map();
  seg.forEach(([a, b], k) => {
    (naboer.get(a) || naboer.set(a, []).get(a)).push(k);
    (naboer.get(b) || naboer.set(b, []).get(b)).push(k);
  });
  const brugt = new Uint8Array(seg.length);
  let d = '';
  for (let s = 0; s < seg.length; s++){
    if (brugt[s]) continue;
    brugt[s] = 1;
    const start = seg[s][0];
    let nu = seg[s][1];
    const loekke = [start, nu];
    for (let vagt = 0; vagt < 20000 && nu !== start; vagt++){
      const k = naboer.get(nu).find(k => !brugt[k]);
      if (k === undefined) break;
      brugt[k] = 1;
      nu = seg[k][0] === nu ? seg[k][1] : seg[k][0];
      if (nu !== start) loekke.push(nu);
    }
    if (loekke.length < 4) continue;
    d += 'M' + loekke.map(k => punkt.get(k).map(r1).join(' ')).join('L') + 'Z';
  }
  return d;
}

/* ── Et kromatids form ───────────────────────────────────────── */
/* Kromatidet består af to arme, der udgår fra centromeren i hver sin
   retning langs vinklen. «boej» bøjer begge arme mod samme side (positiv:
   mod normalen n) — det giver V-formen i anafase, når centromeren trækkes
   forrest. Ved lav kondensering bugter armene som en kromatintråd. */
export function kromatidForm(model, data, kond, C, fase = 0){
  const L = model.skala * data.laengde * GEOMETRI.spaend(kond);
  const v = rad(C.vinkel);
  const u = [Math.cos(v), Math.sin(v)];
  const n = [Math.cos(v - Math.PI / 2), Math.sin(v - Math.PI / 2)];
  const amp = GEOMETRI.boelge(kond), lam = GEOMETRI.boelgelaengde;
  const vis = klem(C.synlig);
  const arme = [[-1, L * data.centromer], [1, L * (1 - data.centromer)]].map(([ret, len]) => {
    const pts = [[C.x, C.y]];
    const n0 = Math.max(4, Math.ceil(len / 1.6));
    const ds = len * vis / n0;
    let px = C.x, py = C.y;
    for (let i = 1; i <= n0; i++){
      const s = i * ds;
      const b = C.boej * (0.25 + 0.95 * s / len);
      const dx = ret * u[0] * Math.cos(b) + n[0] * Math.sin(b);
      const dy = ret * u[1] * Math.cos(b) + n[1] * Math.sin(b);
      px += dx * ds; py += dy * ds;
      const w = amp * Math.sin(2 * Math.PI * s / lam + fase) * Math.min(1, s / 5);
      pts.push([px - dy * w, py + dx * w]);
    }
    return pts;
  });
  return {arme, centromer: [C.x, C.y], bredde: GEOMETRI.bredde(kond)};
}

/* ── Tegning af en hel scene som SVG-tekst ───────────────────── */
const sti = pts => 'M' + pts.map(p => r1(p[0]) + ' ' + r1(p[1])).join('L');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function geometri(model, T){
  const former = {};
  model.kromosomer.forEach((kr, i) => {
    const K = T.kromosomer[kr.id];
    for (const s of ['a', 'b']){
      const C = K.kromatider[s];
      former[kr.id + '.' + s] = C.synlig > 0.001 ? kromatidForm(model, kr, K.kond, C, i * 1.7) : null;
    }
  });
  return former;
}

/* Find et punkt i scenen ud fra en reference i en etiket. */
export function findPunkt(model, T, former, mod){
  if (Array.isArray(mod)) return mod;
  if (mod.centrosom){ const c = T.centrosomer[mod.centrosom]; return [c.x, c.y]; }
  if (mod.kerne){
    const k = T.kerner[mod.kerne], v = rad(mod.vinkel ?? 0);
    return [k.x + k.r * Math.cos(v), k.y + k.r * Math.sin(v)];
  }
  if (mod.kromosom){
    const K = T.kromosomer[mod.kromosom];
    const a = K.kromatider.a, b = K.kromatider.b;
    return b.synlig > 0.01 ? [(a.x + b.x) / 2, (a.y + b.y) / 2] : [a.x, a.y];
  }
  if (mod.kromatid){
    const f = former[mod.kromatid];
    if (!f) return [0, 0];
    if (mod.arm == null) return f.centromer;
    const pts = f.arme[mod.arm];
    return pts[Math.round((pts.length - 1) * (mod.t ?? 0.7))];
  }
  if (mod.mellem){
    const [p, q] = mod.mellem.map(m => findPunkt(model, T, former, m));
    const t = mod.t ?? 0.5;
    return [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
  }
  return [0, 0];
}

function tegnCentrosom(c){
  if (c.synlig < 0.01) return '';
  const o = r1(klem(c.synlig));
  return `<g opacity="${o}" transform="translate(${r1(c.x)} ${r1(c.y)})">`
    + `<circle r="7.5" fill="${FARVER.centrosom}" stroke="${FARVER.blaek}" stroke-width="0.8" stroke-opacity="0.45"/>`
    + `<rect x="-3.6" y="-1.3" width="7.2" height="2.6" rx="0.8" fill="${FARVER.blaek}"/>`
    + `<rect x="-1.3" y="-3.6" width="2.6" height="7.2" rx="0.8" fill="${FARVER.blaek}" transform="translate(2.4 1.4)"/>`
    + `</g>`;
}

function tegnKerne(k){
  if (k.synlig < 0.01) return '';
  const s = klem(k.synlig);
  const omkreds = 2 * Math.PI * k.r, stykker = 18;
  const dash = s >= 0.999 ? '' :
    ` stroke-dasharray="${r1(omkreds / stykker * Math.pow(s, 0.8))} ${r1(omkreds / stykker * (1 - Math.pow(s, 0.8)))}"`;
  // dobbelt membran: bred mørk streg med lys streg ovenpå
  return `<g opacity="${r1(Math.min(1, s * 1.6))}">`
    + `<circle cx="${r1(k.x)}" cy="${r1(k.y)}" r="${r1(k.r)}" fill="${FARVER.kerne}" fill-opacity="${r1(s * 0.9)}" stroke="none"/>`
    + `<circle cx="${r1(k.x)}" cy="${r1(k.y)}" r="${r1(k.r)}" fill="none" stroke="${FARVER.kernekant}" stroke-width="3.4"${dash}/>`
    + `<circle cx="${r1(k.x)}" cy="${r1(k.y)}" r="${r1(k.r)}" fill="none" stroke="${FARVER.kerne}" stroke-width="1.1"${dash}/>`
    + `</g>`;
}

function tegnSpindel(model, T, former){
  let ud = '';
  const s = klem(T.spindel);
  const linje = (p, q, o, w = 0.9) =>
    `<line x1="${r1(p[0])}" y1="${r1(p[1])}" x2="${r1(q[0])}" y2="${r1(q[1])}" stroke="${FARVER.spindel}" stroke-width="${w}" stroke-opacity="${r1(o)}" stroke-linecap="round"/>`;
  // polære mikrotubuli og asterstråler
  if (s > 0.01){
    for (const [ia, ib] of model.spindelpar){
      const A = T.centrosomer[ia], B = T.centrosomer[ib];
      if (!A || !B || A.synlig < .5 || B.synlig < .5) continue;
      const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L, px = -uy, py = ux;
      for (const [P, fortegn] of [[A, 1], [B, -1]]){
        for (const sp of [-26, -9, 9, 26]){
          const mx = P.x + ux * fortegn * L * 0.58 * s + px * sp * s;
          const my = P.y + uy * fortegn * L * 0.58 * s + py * sp * s;
          ud += linje([P.x, P.y], [mx, my], 0.75 * s);
        }
        for (let k = 0; k < 9; k++){
          const v = 2 * Math.PI * k / 9 + 0.3;
          const rx = Math.cos(v), ry = Math.sin(v);
          if ((rx * ux + ry * uy) * fortegn > 0.55) continue;   // ikke ind i spindlen
          ud += linje([P.x + rx * 8, P.y + ry * 8], [P.x + rx * (8 + 13 * s), P.y + ry * (8 + 13 * s)], 0.6 * s);
        }
      }
    }
  }
  // kinetokor-mikrotubuli: fra pol til kromatidets centromer
  for (const kr of model.kromosomer){
    for (const side of ['a', 'b']){
      const C = T.kromosomer[kr.id].kromatider[side];
      if (!C.pol || C.fast < 0.01 || C.synlig < 0.5) continue;
      const P = T.centrosomer[C.pol];
      if (!P || P.synlig < 0.3) continue;
      const f = former[kr.id + '.' + side];
      const mal = f.centromer;
      const dx = mal[0] - P.x, dy = mal[1] - P.y, L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L;
      const fast = klem(C.fast);
      for (const sp of [-1.6, 1.6]){
        const ende = [P.x + dx * fast + nx * sp, P.y + dy * fast + ny * sp];
        ud += linje([P.x, P.y], ende, 0.95 * Math.min(1, fast * 1.5), 1.05);
      }
    }
  }
  return ud;
}

function tegnKromosomer(model, T, former){
  let ud = '';
  for (const kr of model.kromosomer){
    const K = T.kromosomer[kr.id];
    const k = klem(K.kond);
    const w = GEOMETRI.bredde(k);
    const kant = lerp(1.1, 2.2, k);
    for (const side of ['a', 'b']){
      const f = former[kr.id + '.' + side];
      if (!f) continue;
      const d = sti([...f.arme[0]].reverse().concat(f.arme[1].slice(1)));
      ud += `<path d="${d}" fill="none" stroke="${FARVER.blaek}" stroke-width="${r1(w + kant)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      ud += `<path d="${d}" fill="none" stroke="${kr.farve}" stroke-width="${r1(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (kr.baand){
        // tværbånd — gør mors kromosomer genkendelige uden farve
        ud += `<path d="${d}" fill="none" stroke="${kr.moerk}" stroke-width="${r1(w)}" stroke-dasharray="${r1(lerp(1.4, 1.9, k))} ${r1(lerp(2.6, 3.3, k))}"/>`;
      }
    }
    // centromer: én prik for samlede søstre, ellers én pr. kromatid
    const rC = lerp(1.5, 2.5, k);
    const prik = (x, y, rx) =>
      `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(rC)}" transform="rotate(${r1(K.vinkel - 90)} ${r1(x)} ${r1(y)})" fill="${FARVER.blaek}" stroke="${FARVER.papir}" stroke-width="0.8"/>`;
    const A = K.kromatider.a, B = K.kromatider.b;
    if (K.samlet >= 0.999 && B.synlig > 0.001){
      ud += prik((A.x + B.x) / 2, (A.y + B.y) / 2, Math.hypot(A.x - B.x, A.y - B.y) / 2 + rC * 0.6);
    } else {
      if (A.synlig > 0.001) ud += prik(A.x, A.y, rC);
      if (B.synlig > 0.001) ud += prik(B.x, B.y, rC);
    }
  }
  return ud;
}

function tegnEkvator(model, T){
  const e = klem(T.ekvator);
  if (e < 0.01) return '';
  let ud = '';
  for (const [ia, ib] of model.spindelpar){
    const A = T.centrosomer[ia], B = T.centrosomer[ib];
    if (!A || !B) continue;
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
    const px = -dy / L, py = dx / L, h = model.ekvatorLaengde ?? 100;
    ud += `<line x1="${r1(mx - px * h)}" y1="${r1(my - py * h)}" x2="${r1(mx + px * h)}" y2="${r1(my + py * h)}" stroke="${FARVER.ekvator}" stroke-width="1.6" stroke-dasharray="5 4" stroke-opacity="${r1(e * 0.85)}"/>`;
  }
  return ud;
}

function tegnEtiketter(model, T, former, etiketter, synlighed, stoerrelse = 13.5){
  if (synlighed < 0.01 || !etiketter?.length) return '';
  let streger = '', tekster = '';
  for (const e of etiketter){
    const mal = findPunkt(model, T, former, e.mod);
    const linjer = e.tekst.split('\n');
    const anker = e.anker || 'middle';
    const fs = stoerrelse, lh = fs * 1.12;
    // hold tekstblokken inden for figuren
    const bred = Math.max(...linjer.map(l => l.length)) * fs * 0.64;
    let x0 = (anker === 'start' ? e.x : anker === 'end' ? e.x - bred : e.x - bred / 2);
    x0 = klem(x0, 3, model.bredde - 3 - bred);
    const tx = anker === 'start' ? x0 : anker === 'end' ? x0 + bred : x0 + bred / 2;
    const yTop = e.y - fs * 0.85, yBund = e.y + (linjer.length - 1) * lh + fs * 0.3;
    const sx = klem(mal[0], x0, x0 + bred), sy = klem(mal[1], yTop, yBund);
    const startx = mal[0] < x0 ? x0 - 3 : mal[0] > x0 + bred ? x0 + bred + 3 : sx;
    const starty = mal[1] < yTop ? yTop - 2 : mal[1] > yBund ? yBund + 2 : sy;
    streger += `<line x1="${r1(startx)}" y1="${r1(starty)}" x2="${r1(mal[0])}" y2="${r1(mal[1])}" stroke="${FARVER.etiket}" stroke-width="1"/>`
      + `<circle cx="${r1(mal[0])}" cy="${r1(mal[1])}" r="2" fill="${FARVER.etiket}" stroke="${FARVER.papir}" stroke-width="0.8"/>`;
    tekster += `<text x="${r1(tx)}" y="${r1(e.y)}" text-anchor="${anker}" font-family="${SKRIFT}" font-size="${fs}" font-weight="700" fill="${FARVER.etiket}" stroke="${FARVER.papir}" stroke-width="4" stroke-linejoin="round" paint-order="stroke">`
      + linjer.map((l, i) => `<tspan x="${r1(tx)}" dy="${i ? r1(lh) : 0}">${esc(l)}</tspan>`).join('')
      + `</text>`;
  }
  return `<g opacity="${r1(synlighed)}">${streger}${tekster}</g>`;
}

/* Hele scenen som SVG-elementer (uden ydre <svg>). */
export function tegnScene(model, T, {etiketter = [], etiketSynlighed = 1, etiketStr = 13.5} = {}){
  const former = geometri(model, T);
  const omrids = celleOmrids(T.lapper);
  return `<path d="${omrids}" fill="${FARVER.cytoplasma}" stroke="${FARVER.blaek}" stroke-width="2.4" stroke-linejoin="round" fill-rule="nonzero"/>`
    + tegnEkvator(model, T)
    + Object.values(T.kerner).map(tegnKerne).join('')
    + tegnSpindel(model, T, former)
    + tegnKromosomer(model, T, former)
    + Object.values(T.centrosomer).map(tegnCentrosom).join('')
    + tegnEtiketter(model, T, former, etiketter, etiketSynlighed, etiketStr);
}

/* ── Tælling ─────────────────────────────────────────────────── */
/* Lapper hører til samme celle, hvis feltet midt mellem dem er ≥ 1
   (cellen hænger stadig sammen). Hver centromer tilordnes nærmeste lap
   og nærmeste synlige kerne. DNA-mængden måles i c: c = DNA'et i ét
   enkelt (haploidt) kromosomsæt med ét kromatid pr. kromosom. */
export function taelling(model, T){
  const lapper = Object.entries(T.lapper).filter(([, l]) => l.synlig > .5);
  const forael = lapper.map((_, i) => i);
  const rod = i => forael[i] === i ? i : (forael[i] = rod(forael[i]));
  const alle = Object.fromEntries(lapper);
  for (let i = 0; i < lapper.length; i++) for (let j = i + 1; j < lapper.length; j++){
    const a = lapper[i][1], b = lapper[j][1];
    if (felt(Object.values(alle), (a.x + b.x) / 2, (a.y + b.y) / 2) >= 1) forael[rod(i)] = rod(j);
  }
  const cellenr = lapper.map((_, i) => rod(i));
  const celleIds = [...new Set(cellenr)];
  const celler = celleIds.map(() => ({kromosomer: 0, kromatider: 0, dna: 0}));
  const kerneliste = Object.entries(T.kerner).filter(([, k]) => k.synlig >= 0.9);
  const kerner = kerneliste.map(() => ({kromosomer: 0}));
  const haploid = model.haploidLaengde;
  const naermesteCelle = (x, y) => {
    let bedst = 0, bd = Infinity;
    lapper.forEach(([, l], i) => { const d = Math.hypot(x - l.x, y - l.y) / l.r; if (d < bd){ bd = d; bedst = i; } });
    return celleIds.indexOf(cellenr[bedst]);
  };
  const naermesteKerne = (x, y) => {
    let bedst = -1, bd = Infinity;
    kerneliste.forEach(([, k], i) => { const d = Math.hypot(x - k.x, y - k.y) / k.r; if (d < bd && d < 1.4){ bd = d; bedst = i; } });
    return bedst;
  };
  const centromerer = [];
  for (const kr of model.kromosomer){
    const K = T.kromosomer[kr.id];
    const A = K.kromatider.a, B = K.kromatider.b;
    for (const C of [A, B]){
      if (C.synlig <= 0.001) continue;
      const c = naermesteCelle(C.x, C.y);
      celler[c].kromatider += Math.min(1, C.synlig);
      celler[c].dna += Math.min(1, C.synlig) * kr.laengde / haploid;
    }
    if (K.samlet >= 0.999 || B.synlig <= 0.001) centromerer.push([(A.x + (B.synlig > .001 ? B.x : A.x)) / 2, (A.y + (B.synlig > .001 ? B.y : A.y)) / 2]);
    else { if (A.synlig > .001) centromerer.push([A.x, A.y]); centromerer.push([B.x, B.y]); }
  }
  for (const [x, y] of centromerer){
    celler[naermesteCelle(x, y)].kromosomer++;
    const k = naermesteKerne(x, y);
    if (k >= 0) kerner[k].kromosomer++;
  }
  return {celler, kerner};
}

/* ── Eksport ─────────────────────────────────────────────────── */
export function svgDokument(model, indhold, {bredde = model.bredde, hoejde = model.hoejde, titel = ''} = {}){
  return `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${bredde} ${hoejde}" width="${bredde * 2}" height="${hoejde * 2}">`
    + (titel ? `<title>${esc(titel)}</title>` : '')
    + `<rect width="${bredde}" height="${hoejde}" fill="#FFFFFF"/>`
    + indhold + `</svg>`;
}

export function hentFil(navn, tekst, type = 'image/svg+xml'){
  const url = URL.createObjectURL(new Blob([tekst], {type}));
  const a = document.createElement('a');
  a.href = url; a.download = navn;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ── Motoren samlet ──────────────────────────────────────────── */
/* opretMotor(model) forbereder faserne og giver:
     tilstand(p)  — tilstand ved position p (0 … antal−1, gerne med decimaler)
     scene(p, visEtiketter) — SVG-indhold
     taelling(p)
     eksporterFase(i, visEtiketter) / eksporterAlle(visEtiketter) */
export function opretMotor(model){
  model.haploidLaengde ??= (() => {
    const pr = {};
    for (const k of model.kromosomer) pr[k.par] = Math.max(pr[k.par] || 0, k.laengde);
    return Object.values(pr).reduce((a, b) => a + b, 0);
  })();
  const tilstande = model.faser.map(f => normaliser(model, f.tilstand));
  const N = tilstande.length;

  const tilstand = p => {
    p = klem(p, 0, N - 1);
    const i = Math.min(N - 2, Math.floor(p));
    const t = p - i;
    if (N === 1 || t < 1e-4) return tilstande[Math.round(p)];
    if (t > 1 - 1e-4) return tilstande[i + 1];
    return blandFase(model, tilstande[i], tilstande[i + 1], t, model.faser[i + 1].koreografi);
  };
  const etiketterVed = p => {
    const i = Math.round(p);
    return {liste: model.faser[i].etiketter || [], synlighed: klem(1 - Math.abs(p - i) * 4)};
  };
  const scene = (p, visEtiketter = true, etiketStr = 13.5) => {
    const e = etiketterVed(p);
    return tegnScene(model, tilstand(p), {
      etiketter: visEtiketter ? e.liste : [],
      etiketSynlighed: e.synlighed, etiketStr
    });
  };
  const eksporterFase = (i, visEtiketter = true) =>
    svgDokument(model, scene(i, visEtiketter), {titel: `${model.titel} — ${model.faser[i].navn}`});

  const eksporterAlle = (visEtiketter = true, tekstFn = () => '') => {
    const kol = 2, W = model.bredde, Hf = model.hoejde, top = 34, bund = 22, luft = 16;
    const raekker = Math.ceil(N / kol);
    const B = kol * W + (kol + 1) * luft, Hh = 50 + raekker * (top + Hf + bund + luft);
    let ind = `<text x="${luft}" y="34" font-family="${SKRIFT}" font-size="22" font-weight="800" fill="${FARVER.blaek}">${esc(model.titel)}</text>`;
    model.faser.forEach((f, i) => {
      const x = luft + (i % kol) * (W + luft), y = 50 + Math.floor(i / kol) * (top + Hf + bund + luft);
      ind += `<g transform="translate(${x} ${y})">`
        + `<rect x="0" y="0" width="${W}" height="${top + Hf + bund}" rx="10" fill="#FFFFFF" stroke="${FARVER.blaek}" stroke-width="1.5"/>`
        + `<text x="12" y="23" font-family="${SKRIFT}" font-size="16" font-weight="800" fill="${FARVER.blaek}">${i + 1}. ${esc(f.navn)}</text>`
        + `<g transform="translate(0 ${top - 6})">${scene(i, visEtiketter)}</g>`
        + `<text x="12" y="${top + Hf + bund - 8}" font-family="${SKRIFT}" font-size="12" fill="#3E4E4C">${esc(tekstFn(i))}</text>`
        + `</g>`;
    });
    return svgDokument(model, ind, {bredde: B, hoejde: Hh, titel: model.titel + ' — alle faser'});
  };

  // et skifts længde i forhold til standard (fase i angiver skiftet ind i sig selv)
  const varighed = i => model.faser[klem(i, 0, N - 1)].varighed ?? 1;
  return {model, N, tilstande, tilstand, scene, varighed, taelling: p => taelling(model, tilstand(p)), eksporterFase, eksporterAlle};
}

/* ── Afspiller ───────────────────────────────────────────────── */
/* Flytter en position p mod et mål. Spring over flere faser animeres
   fase for fase. Ved «afspil» venter den ved hver fase og går videre. */
export function opretAfspiller({antal, tegn, faerdig, varighed = 1500, ophold = 2600, faktor = () => 1}){
  let p = 0, maal = 0, hastighed = 1, spiller = false, sidst = null, venter = 0, rafId = null;
  const reduceret = matchMedia('(prefers-reduced-motion: reduce)');
  const trin = nu => {
    const dt = sidst == null ? 0 : Math.min(100, nu - sidst);
    sidst = nu;
    if (p !== maal){
      if (reduceret.matches) p = maal;
      else {
        // skiftet, vi er i: fra fase s til s+1
        const sk = maal > p ? Math.floor(p) : Math.ceil(p) - 1;
        const v = hastighed / (varighed * faktor(sk + 1));
        p = maal > p ? Math.min(maal, p + v * dt) : Math.max(maal, p - v * dt);
      }
      tegn(p);
      if (p === maal){ venter = 0; faerdig?.(Math.round(p)); }
    } else if (spiller){
      venter += dt * hastighed;
      if (venter >= ophold){
        if (maal < antal - 1){ maal++; venter = 0; }
        else { spiller = false; faerdig?.(Math.round(p), true); }
      }
    }
    rafId = (p !== maal || spiller) ? requestAnimationFrame(trin) : null;
    if (!rafId) sidst = null;
  };
  const koer = () => { if (!rafId){ sidst = null; rafId = requestAnimationFrame(trin); } };
  return {
    get position(){ return p; },
    get maal(){ return maal; },
    get spiller(){ return spiller; },
    gaaTil(i){ maal = klem(Math.round(i), 0, antal - 1); venter = 0; koer(); },
    afspil(){ if (maal >= antal - 1 && p >= antal - 1){ p = 0; maal = 0; tegn(0); } spiller = true; venter = ophold * 0.6; koer(); },
    pause(){ spiller = false; },
    saet(i){ p = maal = klem(Math.round(i), 0, antal - 1); venter = 0; tegn(p); },
    saetHastighed(h){ hastighed = h; },
    tegnNu(){ tegn(p); }
  };
}
