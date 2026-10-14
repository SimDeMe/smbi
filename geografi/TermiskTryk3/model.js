/* ================================================================
   Termiske tryksystemer — modellen
   Al tilstand i ét objekt; afledte størrelser beregnes rent fra
   state hver frame. Fysikken er flyttet uændret over fra v1 af
   TermiskTryk3.html (kontrolleret over et gitter af kombinationer).
   ================================================================ */

export const SURFACES = {
  land: { label: 'Land',    amp: 13,  resp: 0.9,  style: 'land' },
  hav:  { label: 'Hav',     amp: 1.2, resp: 0.06, style: 'hav'  },
  sne:  { label: 'Sne/is',  amp: 4,   resp: 0.5,  style: 'sne'  },
};

export const CASES = {
  lillebaelt: {
    surfL: 'land', surfR: 'hav', baseL: 16, baseR: 16, insol: 1.0, time: 13,
    labelL: 'Fyn (land)', labelR: 'Lillebælt (hav)',
    navn: 'Lillebælt · land/hav-brise',
    desc: 'Sommerdøgn ved kysten: dag = havbrise (pålandsvind), nat = landbrise (fralandsvind). Lad tiden køre og se brisen vende.',
  },
  sibirien: {
    surfL: 'sne', surfR: 'hav', baseL: -24, baseR: 2, insol: 0.15, time: 12,
    labelL: 'Sibirien (snedækket land)', labelR: 'Stillehavet (hav)',
    navn: 'Sibirien · vinter',
    desc: 'Vinter: kontinentet udstråler varme og bliver ekstremt koldt → vedvarende termisk højtryk over land, døgnet rundt.',
  },
  monsun: {
    surfL: 'land', surfR: 'hav', baseL: 30, baseR: 26, insol: 1.0, time: 13,
    labelL: 'Indien (land)', labelR: 'Det Indiske Ocean',
    navn: 'Indien · sommermonsun',
    desc: 'Sommer: landmassen er varmest både dag og nat → vedvarende termisk lavtryk over land og fugtig pålandsvind. Det er sommermonsunens motor.',
  },
  monsunvinter: {
    surfL: 'land', surfR: 'hav', baseL: 13, baseR: 24, insol: 0.7, time: 13,
    labelL: 'Indien (land)', labelR: 'Det Indiske Ocean',
    navn: 'Indien · vintermonsun',
    desc: 'Vinter: landmassen er kølet af, mens havet stadig er varmt → termisk højtryk over land og tør fralandsvind (vintermonsun). Sommerens mønster er vendt om.',
  },
};

export const SPEEDS = [ {mul: 0.20, txt: '½×'}, {mul: 0.42, txt: '1×'}, {mul: 1.0, txt: '2×'} ]; // sim-timer pr. reel sekund

export const state = {
  caseId: 'lillebaelt',
  surfL: 'land', surfR: 'hav',
  baseL: 16, baseR: 16, insol: 1.0,
  labelL: 'Fyn (land)', labelR: 'Lillebælt (hav)',
  tL: 20, tR: 16,
  timeOfDay: 13, running: true, speedIx: 1,
  mode: 'fri',            // 'fri' | 'trin' (figuren bygges op trin for trin)
  step: 6,                // synligt til og med (trin-tilstand)
  focusStep: 1,           // det trin, forklaringen står på
  expert: false, dtManual: 6,
  layers: { isobar: true, ref: true, hl: true, arrows: true, parcels: true, tracer: false },
};

// Bløde overgange når lag/trin tændes (0..1 pr. trin 2-6)
export const gates = { g2: 1, g3: 1, g4: 1, g5: 1, g6: 1 };

/* ── Fysik-hjælpere ── */
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp  = (a, b, t) => a + (b - a) * t;

export function insolation(t) { // 0..1, solhøjde-agtig kurve
  return t > 6 && t < 18 ? Math.sin(Math.PI * (t - 6) / 12) : 0;
}

export function targetTemp(base, surf, I) {
  // Ligevægtstemperatur: dagopvarmning og natafkøling omkring basen
  return base + SURFACES[surf].amp * (I - 0.35);
}

export function stepTemps(dtH) {
  const I = insolation(state.timeOfDay) * state.insol;
  const rl = 1 - Math.exp(-SURFACES[state.surfL].resp * dtH);
  const rr = 1 - Math.exp(-SURFACES[state.surfR].resp * dtH);
  state.tL += (targetTemp(state.baseL, state.surfL, I) - state.tL) * rl;
  state.tR += (targetTemp(state.baseR, state.surfR, I) - state.tR) * rr;
}

// Afledte størrelser — beregnes rent fra state
export function derive() {
  const dT = state.expert ? state.dtManual : state.tL - state.tR;
  const s  = clamp(dT / 12, -1, 1);         // normeret cellestyrke, fortegn = varm side
  const p0L = 1013 - 1.4 * dT / 2,  p0R = 1013 + 1.4 * dT / 2;   // overflade-hPa
  const p1L = 846 + 0.9 * dT / 2,   p1R = 846 - 0.9 * dT / 2;    // ~1500 m
  const wind = Math.abs(dT) * 0.75;          // m/s, konceptuel skala
  return { dT, s, p0L, p0R, p1L, p1R, wind };
}

/* Det, figuren viser som aflæsning. I trin-tilstand følger trykket
   trinnene: ved jorden er det uændret, til trin 4 er nået, og i 1,5 km
   til trin 3 — ligesom H/L-mærkerne og forklaringen. I fri tilstand er
   alle gates åbne, og tallene er dem, derive() giver. */
export function aflaesning(d) {
  const nede = (p) => 1013 + (p - 1013) * gates.g4;
  const oppe = (p) => 846 + (p - 846) * gates.g3;
  const stille = Math.abs(d.dT) < 0.8 || gates.g5 < 0.5;
  const modVenstre = d.dT > 0;              // vinden blæser mod den varme side
  let navn = '';
  if (!stille && state.caseId === 'lillebaelt') navn = modVenstre ? 'Havbrise' : 'Landbrise';
  return {
    p0L: nede(d.p0L), p0R: nede(d.p0R),
    p1L: oppe(d.p1L), p1R: oppe(d.p1R),
    stille, modVenstre, navn,
  };
}

/* ── Trykflade-anomali ──
   disp > 0 = fladen hæves. Over den varme søjle: hævet i højden (g2),
   sænket ved jorden (g4). cos(πx) giver glat +1 → −1 hen over snittet. */
const K_UP = 0.085, K_DN = 0.048;

export function dispAt(xn, zn, s) {
  const prof = gates.g2 * K_UP * Math.pow(zn, 1.25)
             - gates.g4 * K_DN * Math.pow(1 - zn, 1.6);
  return s * Math.cos(Math.PI * xn) * prof;
}

// Vendeniveau: hvor anomalien skifter fortegn (kun meningsfuldt når g4 > 0)
export function crossoverZ() {
  let lo = 0.01, hi = 0.99;
  const f = z => gates.g2 * K_UP * Math.pow(z, 1.25) - gates.g4 * K_DN * Math.pow(1 - z, 1.6);
  if (f(lo) > 0 || f(hi) < 0) return null;
  for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; (f(m) < 0 ? lo = m : hi = m); }
  return (lo + hi) / 2;
}

export const P_LEVELS = [
  { z: 0.055, p: 1000 }, { z: 0.20, p: 950 }, { z: 0.345, p: 900 },
  { z: 0.49, p: 850 }, { z: 0.645, p: 800 }, { z: 0.80, p: 750 },
];

/* ── Strømfunktion for den lukkede celle ──
   ψ = S·sin(πx)·sin(πz);  u = ∂ψ/∂z, w = −∂ψ/∂x.
   S > 0 → opstigning over højre; varm venstre kræver S < 0. */
export function cellVel(xn, zn, s) {
  const S = -s * gates.g6;
  const u =  S * Math.PI * Math.sin(Math.PI * xn) * Math.cos(Math.PI * zn);
  const w = -S * Math.PI * Math.cos(Math.PI * xn) * Math.sin(Math.PI * zn);
  return { u, w };
}

/* ── Partikler (luftpakker) ── */
const N_PARCELS = 110;
export const parcels = [];
export function initParcels() {
  parcels.length = 0;
  for (let i = 0; i < N_PARCELS; i++) {
    parcels.push({
      x: Math.random(), z: Math.pow(Math.random(), 1.4),
      t: 10, trail: [],
    });
  }
}

function surfTempAt(xn) {
  const b = clamp((xn - 0.45) / 0.10, 0, 1); // glat kyst-overgang
  return lerp(state.tL, state.tR, b);
}

export function stepParcels(dtReal, s) {
  const SPEED = 0.11; // domæne-enheder/s ved fuld styrke
  parcels.forEach((p, i) => {
    const { u, w } = cellVel(p.x, p.z, s);
    p.x += u * SPEED * dtReal + (Math.random() - 0.5) * 0.0012;
    p.z += w * SPEED * dtReal + (Math.random() - 0.5) * 0.0012;
    p.x = clamp(p.x, 0.008, 0.992);
    p.z = clamp(p.z, 0.006, 0.985);
    // Pakketemperatur: relaksér mod omgivelserne (overflade − lapse)
    const ambient = surfTempAt(p.x) - 20 * p.z;
    p.t += (ambient - p.t) * Math.min(1, 1.4 * dtReal);
    if (state.layers.tracer && i === 0) {
      p.trail.push([p.x, p.z]);
      if (p.trail.length > 90) p.trail.shift();
    } else if (p.trail.length) p.trail = [];
  });
}

export function surfMean() { return (state.tL + state.tR) / 2; }

export function applyCase(id) {
  const c = CASES[id];
  state.caseId = id;
  state.surfL = c.surfL; state.surfR = c.surfR;
  state.baseL = c.baseL; state.baseR = c.baseR;
  state.insol = c.insol;
  state.labelL = c.labelL; state.labelR = c.labelR;
  state.timeOfDay = c.time;
  const I = insolation(c.time) * c.insol;
  state.tL = targetTemp(c.baseL, c.surfL, I);
  state.tR = targetTemp(c.baseR, c.surfR, I);
  initParcels();
}

// Tid — ved manuelle spring integreres temperaturerne hen over intervallet,
// så billedet følger uret selv når simulationen er pauset
export function jumpToTime(newT) {
  newT = (newT + 24) % 24;
  if (!state.expert) {
    let span = newT - state.timeOfDay;
    if (Math.abs(span) > 12) span -= Math.sign(span) * 24; // korteste vej rundt om døgnet
    const steps = Math.max(1, Math.ceil(Math.abs(span) / 0.25));
    for (let i = 1; i <= steps; i++) {
      state.timeOfDay = (state.timeOfDay + span / steps + 24) % 24;
      stepTemps(Math.abs(span) / steps);
    }
  }
  state.timeOfDay = newT;
}

// Overflade skiftes — snap til ny ligevægt, så skiftet også ses under pause
export function saetOverflade(side, surf) {
  const I = insolation(state.timeOfDay) * state.insol;
  if (side === 'l') {
    state.surfL = surf;
    state.labelL = SURFACES[surf].label + ' (venstre)';
    state.tL = targetTemp(state.baseL, surf, I);
  } else {
    state.surfR = surf;
    state.labelR = SURFACES[surf].label + ' (højre)';
    state.tR = targetTemp(state.baseR, surf, I);
  }
}

// Ekspert-ΔT: frys temperaturerne omkring middel, så visningen matcher skyderen
export function saetDtManuel(v) {
  state.dtManual = v;
  const m = surfMean();
  state.tL = m + v / 2;
  state.tR = m - v / 2;
}
