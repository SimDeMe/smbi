/* ================================================================
   Termiske tryksystemer — tegningen
   2D vertikalt snit i sidens blæk-formsprog. Aflæsningerne står i
   selve tegningen: temperatur og tryk ved jorden i jordstriben,
   trykket i 1,5 km over hvert felt, vinden ved pilen og ΔT ved kysten.
   ================================================================ */
import {
  state, gates, SURFACES, P_LEVELS, parcels,
  clamp, lerp, insolation, dispAt, crossoverZ, surfMean, aflaesning,
} from './model.js';

const canvas = document.getElementById('stage-canvas');
const stageEl = document.getElementById('stage');
const ctx = canvas.getContext('2d');
let W = 900, H = 480, DPR = 1;

// t giver luft over den øverste trykflade, så H/L i højden ikke klemmes op mod kanten
const PAD = { l: 52, r: 62, t: 40 };
let GROUND_H = 56;
let plotW, plotH, groundY;
let S = 1;                          // skriftskala — større i projektortilstand

const F_DISP = "'Archivo', system-ui, sans-serif";
const F_MONO = "'IBM Plex Mono', ui-monospace, monospace";
const INK = '#17211F';

export const reduceMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
export const fmt1 = v => v.toFixed(1).replace('.', ',');

export function saetSkala(s) { S = s; resizeCanvas(); }

export function resizeCanvas() {
  const cs = getComputedStyle(stageEl);
  const inner = stageEl.getBoundingClientRect().width
              - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const cssW = Math.max(300, Math.round(inner));
  /* Højdebudget: figuren følger vinduets højde, når den er den
     knappe — ellers af bredden. Lærredet har intet fast
     formatforhold, så det er kun højden, der bindes. */
  const budget = parseFloat(cs.getPropertyValue('--fig')) || 560;
  const cssH = Math.min(clamp(Math.round(cssW * 0.55), 330, 560), budget);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.clientWidth;          // indvendigt mål — rammen tælles ikke med
  H = canvas.clientHeight;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  GROUND_H = Math.round(56 * S);
  plotW = W - PAD.l - PAD.r;
  groundY = H - GROUND_H;
  plotH = groundY - PAD.t;
}

// Normaliserede koordinater: xn 0..1 (venstre..højre), zn 0..1 (jord..3 km)
const X = xn => PAD.l + xn * plotW;
const Z = zn => groundY - zn * plotH;

function parcelColor(t, alpha) {
  // −25 °C (blå blæk) → +35 °C (koral)
  const k = clamp((t + 25) / 60, 0, 1);
  const r = Math.round(lerp(14, 255, k));
  const g = Math.round(lerp(134, 106, k));
  const b = Math.round(lerp(200, 61, k));
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ── Tegnehjælpere ── */
function inkArrow(x1, y1, x2, y2, curve, alpha, width) {
  if (alpha <= 0.02) return;
  const mx = (x1 + x2) / 2 + curve * (y2 - y1) * 0.5;
  const my = (y1 + y2) / 2 - curve * (x2 - x1) * 0.5;
  ctx.strokeStyle = `rgba(23,33,31,${alpha})`;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.stroke();
  // pilespids langs kurvens sluttangent
  const ang = Math.atan2(y2 - my, x2 - mx);
  const hl = 8 + width * 2;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hl * Math.cos(ang - 0.42), y2 - hl * Math.sin(ang - 0.42));
  ctx.lineTo(x2 - hl * Math.cos(ang + 0.42), y2 - hl * Math.sin(ang + 0.42));
  ctx.closePath();
  ctx.fill();
  ctx.lineCap = 'butt';
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* Et aflæsningsmærkat: pilleform med blækkant. Teksten er en række
   stykker, hver med sin egen skrift og farve, så tal og enhed kan
   stå forskelligt — og enheden står altid, som den staves. */
function maal(stykker) {
  let w = 0;
  stykker.forEach(st => { ctx.font = st.f; st.w = ctx.measureText(st.t).width; w += st.w; });
  return w;
}
function pille(stykker, cx, cy, bg, minX, maxX) {
  const tw = maal(stykker);
  const h = Math.round(19 * S), pad = Math.round(8 * S);
  const w = tw + pad * 2;
  let x = cx - w / 2;
  if (minX != null) x = Math.max(minX, Math.min(x, maxX - w));
  const y = Math.round(cy - h / 2);
  ctx.fillStyle = bg;
  roundRect(x, y, w, h, h / 2); ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = INK;
  roundRect(x, y, w, h, h / 2); ctx.stroke();
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  let tx = x + pad;
  stykker.forEach(st => {
    ctx.font = st.f; ctx.fillStyle = st.c || INK;
    ctx.fillText(st.t, tx, y + h / 2 + 0.5);
    tx += st.w;
  });
  ctx.textBaseline = 'alphabetic';
  return { x, y, w, h };
}
const fTal  = () => `800 ${Math.round(12 * S)}px ${F_DISP}`;
const fEnh  = () => `600 ${Math.round(10 * S)}px ${F_MONO}`;
const fEtik = () => `600 ${Math.round(9 * S)}px ${F_MONO}`;

/* H og L får både bogstav, ord og egen form — farven står aldrig alene */
function drawHL(letter, xn, zn, alpha, big) {
  if (alpha <= 0.02) return;
  const low = letter === 'L';               // L ligger over det varme felt
  const col = low ? '255,106,61' : '14,134,200';
  const r = big ? 22 : 17;
  const cx = X(xn);
  let cy = Z(zn);
  /* Ved jorden skal mærkatet under symbolet kunne stå over jordstriben.
     Symbolet løftes lidt, hvis figuren er lav; er der stadig ikke plads,
     står bogstavet alene — formen og bogstavet bærer det uden farven. */
  let medOrd = true;
  if (big) {
    cy = Math.min(cy, Math.max(groundY - r - 22, Z(0.2)));
    medOrd = cy + r + 21 <= groundY;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 7);
  ctx.fillStyle = `rgb(${col})`;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.fillStyle = '#FFF9EE';
  ctx.font = `800 ${big ? 26 : 21}px ${F_DISP}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(letter, cx, cy + 1);
  if (!medOrd) { ctx.restore(); ctx.textBaseline = 'alphabetic'; return; }
  // mærkat under symbolet
  const txt = low ? 'LAVTRYK' : 'HØJTRYK';
  ctx.font = `600 ${big ? 10 : 9}px ${F_MONO}`;
  const w = ctx.measureText(txt).width + 12;
  const by = cy + r + 4;
  ctx.fillStyle = '#FFF9EE';
  roundRect(cx - w / 2, by, w, 15, 7); ctx.fill();
  ctx.lineWidth = 1.5; ctx.strokeStyle = INK;
  roundRect(cx - w / 2, by, w, 15, 7); ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, cx, by + 8);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

/* ── Jorden: felternes navn, temperatur og tryk ved jorden ── */
function drawGround(d, a) {
  const midX = X(0.5);
  let tekstW = 0;                 // det bredeste af felternes tekst — ΔT skal kunne stå imellem
  const fields = [
    { style: SURFACES[state.surfL].style, x0: PAD.l, x1: midX, label: state.labelL, temp: state.tL, p: a.p0L },
    { style: SURFACES[state.surfR].style, x0: midX, x1: W - PAD.r, label: state.labelR, temp: state.tR, p: a.p0R },
  ];
  fields.forEach(f => {
    const w = f.x1 - f.x0;
    ctx.fillStyle = f.style === 'hav' ? '#C7E6F6' : f.style === 'sne' ? '#F6F8F7' : '#E8D9A8';
    ctx.fillRect(f.x0, groundY, w, GROUND_H);
    ctx.save();
    ctx.beginPath(); ctx.rect(f.x0, groundY, w, GROUND_H); ctx.clip();
    ctx.lineWidth = 1;
    if (f.style === 'land') {
      ctx.strokeStyle = 'rgba(23,33,31,0.20)';
      for (let x = f.x0 - GROUND_H; x < f.x1; x += 8) {
        ctx.beginPath(); ctx.moveTo(x, groundY + GROUND_H); ctx.lineTo(x + GROUND_H, groundY); ctx.stroke();
      }
    } else if (f.style === 'hav') {
      ctx.strokeStyle = 'rgba(14,134,200,0.55)';
      ctx.lineWidth = 1.4;
      for (let y = groundY + 10; y < groundY + GROUND_H; y += 10) {
        ctx.beginPath();
        for (let x = f.x0; x <= f.x1; x += 6) {
          const yy = y + Math.sin((x + y * 3) * 0.09) * 2;
          x === f.x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    } else { // sne
      ctx.fillStyle = 'rgba(23,33,31,0.30)';
      for (let x = f.x0 + 5; x < f.x1; x += 11) {
        for (let y = groundY + 8; y < groundY + GROUND_H - 4; y += 12) {
          ctx.beginPath(); ctx.arc(x + (y % 24 < 12 ? 3 : 0), y, 1.2, 0, 7); ctx.fill();
        }
      }
    }
    ctx.restore();
    const cx = f.x0 + w / 2;
    // temperatur · tryk ved jorden — på én linje, hvis feltet er bredt nok
    const varm = f.temp >= surfMean();
    const stykker = [
      { t: fmt1(f.temp), f: `800 ${Math.round(14 * S)}px ${F_DISP}`, c: varm ? '#C63C12' : '#0B6EA6' },
      { t: ' °C', f: `600 ${Math.round(11 * S)}px ${F_MONO}`, c: varm ? '#C63C12' : '#0B6EA6' },
      { t: '   ', f: `600 ${Math.round(11 * S)}px ${F_MONO}` },
      { t: f.p.toFixed(0), f: `800 ${Math.round(14 * S)}px ${F_DISP}`, c: INK },
      { t: ' hPa', f: `600 ${Math.round(11 * S)}px ${F_MONO}`, c: INK },
    ];
    const tw = maal(stykker);
    const smal = tw > w - 10;
    const linjer = smal
      ? [[stykker.slice(0, 2), 35], [stykker.slice(3), 50]]   // smal figur: hver sin linje
      : [[stykker, 41]];
    // navn
    ctx.font = `700 ${Math.round(13 * S)}px ${F_DISP}`;
    ctx.textAlign = 'center'; ctx.fillStyle = INK;
    ctx.fillText(f.label, cx, groundY + Math.round((smal ? 17 : 20) * S));
    tekstW = Math.max(tekstW, smal ? w : Math.max(tw, ctx.measureText(f.label).width));
    ctx.textAlign = 'left';
    linjer.forEach(([linje, dy]) => {
      let tx = cx - maal(linje) / 2;
      linje.forEach(st => {
        ctx.font = st.f; ctx.fillStyle = st.c || INK;
        ctx.fillText(st.t, tx, groundY + Math.round(dy * S)); tx += st.w;
      });
    });
  });
  // kystlinje
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(midX, groundY); ctx.lineTo(midX, groundY + GROUND_H); ctx.stroke();
  // jordoverflade-streg
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(PAD.l, groundY); ctx.lineTo(W - PAD.r, groundY); ctx.stroke();
  ctx.textAlign = 'left';

  // ΔT ved kysten — kun når der er plads mellem de to felters tekst
  const dtTekst = [
    { t: 'ΔT ', f: fEnh(), c: '#4B2F9A' },
    { t: (d.dT >= 0 ? '+' : '−') + fmt1(Math.abs(d.dT)), f: fTal() },
    { t: ' °C', f: fEnh() },
  ];
  const dtW = maal(dtTekst) + 16 * S;
  const feltW = (W - PAD.r - PAD.l) / 2;
  if (feltW - tekstW > dtW + 12) pille(dtTekst, midX, groundY + GROUND_H / 2, '#F1ECFC');
}

/* ── Himmel: sol, måne og nattetone ── */
function drawSky() {
  const I = insolation(state.timeOfDay) * state.insol;
  // himlen fylder hele figuren ned til jordoverfladen — ingen lys ramme om snittet
  const g = ctx.createLinearGradient(0, 0, 0, groundY);
  g.addColorStop(0, '#BFE4F7');
  g.addColorStop(1, '#F1FAFE');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, groundY);
  // natte-wash
  const nightA = (1 - clamp(I * 1.8, 0, 1)) * 0.28;
  if (nightA > 0.01) {
    ctx.fillStyle = `rgba(20,44,80,${nightA})`;
    ctx.fillRect(0, 0, W, groundY);
  }
  const t = state.timeOfDay;
  if (t > 5.5 && t < 18.5) {
    // sol vandrer hen over himlen
    const sx = X(clamp((t - 6) / 12, 0.02, 0.98));
    const sy = 24;               // solen står i luftrummet over snittet
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * 15, sy + Math.sin(a) * 15);
      ctx.lineTo(sx + Math.cos(a) * (19 + I * 5), sy + Math.sin(a) * (19 + I * 5));
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(sx, sy, 12, 0, 7);
    ctx.fillStyle = `rgba(255,179,0,${0.45 + I * 0.55})`;
    ctx.fill(); ctx.stroke();
  } else {
    // måne
    const mt = (t < 6 ? t + 24 : t); // 18.5..30
    const mx = X(clamp((mt - 19) / 10, 0.02, 0.98));
    const my = 24;
    ctx.save();
    ctx.beginPath(); ctx.arc(mx, my, 11, 0, 7);
    ctx.fillStyle = '#FFF6E0'; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ctx.clip();
    ctx.beginPath(); ctx.arc(mx + 5, my - 3, 9.5, 0, 7);
    ctx.fillStyle = 'rgba(28,46,68,0.28)'; ctx.fill();
    ctx.restore();
  }
}

/* ── Opvarmnings-/afkølingsglød ved jorden ── */
function drawHeatGlow(s) {
  if (Math.abs(s) < 0.03) return;
  const warmLeft = s > 0;
  // rund glød, så den toner ud til alle sider og ikke efterlader synlige kanter
  [[0.25, warmLeft], [0.75, !warmLeft]].forEach(([cx, isWarm]) => {
    const r = Math.max(plotW * 0.24, plotH * 0.34);
    const g = ctx.createRadialGradient(X(cx), groundY, 0, X(cx), groundY, r);
    const col = isWarm ? '255,106,61' : '14,134,200';
    g.addColorStop(0, `rgba(${col},${0.26 * Math.abs(s)})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(X(cx) - r, groundY - r, r * 2, r);
  });
}

/* ── Trykflader ── */
function drawIsobars(s) {
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  P_LEVELS.forEach(lv => {
    // uforstyrret reference — stiplet, så stregtypen bærer forskellen
    if (state.layers.ref && gates.g2 > 0.05 && Math.abs(s) > 0.04) {
      ctx.strokeStyle = 'rgba(86,107,104,0.55)';
      ctx.lineWidth = 1.2; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(X(0), Z(lv.z)); ctx.lineTo(X(1), Z(lv.z)); ctx.stroke();
      ctx.setLineDash([]);
    }
    // forstyrret flade — fuldt optrukket i blæk
    ctx.strokeStyle = 'rgba(23,33,31,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const STEPS = 48;
    for (let i = 0; i <= STEPS; i++) {
      const xn = i / STEPS;
      const zn = lv.z + dispAt(xn, lv.z, s);
      i === 0 ? ctx.moveTo(X(xn), Z(zn)) : ctx.lineTo(X(xn), Z(zn));
    }
    ctx.stroke();
    // hPa-etiket i højre side
    const zEnd = lv.z + dispAt(1, lv.z, s);
    ctx.font = `600 10px ${F_MONO}`;
    ctx.fillStyle = INK;   // står på himlen — skal kunne læses også om natten
    ctx.fillText(lv.p + ' hPa', X(1) + 7, Z(zEnd));
  });
  // vendeniveau
  if (gates.g4 > 0.5 && Math.abs(s) > 0.06) {
    const zc = crossoverZ();
    if (zc != null) {
      ctx.strokeStyle = 'rgba(122,79,214,0.85)';
      ctx.lineWidth = 1.6; ctx.setLineDash([2, 6]);
      ctx.beginPath(); ctx.moveTo(X(0), Z(zc)); ctx.lineTo(X(1), Z(zc)); ctx.stroke();
      ctx.setLineDash([]);
      const txt = 'VENDENIVEAU';
      ctx.font = `600 10px ${F_MONO}`;
      const w = ctx.measureText(txt).width + 14;
      const bx = X(0.5) - w / 2, by = Z(zc) - 19;   // midt i — ude ved kanterne står trykket i 1,5 km
      ctx.fillStyle = '#7A4FD6';
      roundRect(bx, by, w, 16, 8); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
      roundRect(bx, by, w, 16, 8); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillText(txt, bx + 7, by + 8.5);
    }
  }
  ctx.textBaseline = 'alphabetic';
}

/* ── Højdeakse ── */
function drawAxis() {
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, groundY); ctx.stroke();
  ctx.font = `600 10px ${F_MONO}`;
  ctx.fillStyle = INK;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let km = 0; km <= 3; km++) {
    const y = Z(km / 3);
    ctx.beginPath(); ctx.moveTo(PAD.l - 5, y); ctx.lineTo(PAD.l, y); ctx.stroke();
    ctx.fillText(km + ' km', PAD.l - 8, y);
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

/* ── Trykket i 1,5 km over hvert felt ──
   Står helt ude ved kanterne, væk fra de lodrette pile over felternes
   midte. Højden står på aksen, så mærkatet kun behøver tallet. */
function drawTrykOppe(a) {
  const y = Z(0.5);
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD.l - 4, y); ctx.lineTo(PAD.l, y); ctx.stroke();
  ctx.font = `600 9px ${F_MONO}`; ctx.fillStyle = '#566B68';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('1,5 km', PAD.l - 8, y);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const tal = p => [{ t: p.toFixed(0), f: fTal() }, { t: ' hPa', f: fEnh() }];
  pille(tal(a.p1L), X(0), y, 'rgba(255,249,238,0.94)', X(0) + 6, X(1) - 6);
  pille(tal(a.p1R), X(1), y, 'rgba(255,249,238,0.94)', X(0) + 6, X(1) - 6);
}

/* ── Vinden ved jorden: hastighed (og brisens navn) ved pilen ── */
function drawVind(d, a) {
  const y = Z(0.06) - 26 * S;
  const stykker = a.stille
    ? [{ t: 'Vindstille', f: fTal() }]
    : [
        ...(a.navn && plotW > 380 ? [{ t: a.navn + '  ', f: fTal() }] : []),
        { t: a.modVenstre ? '← ' : '', f: fTal() },
        { t: fmt1(d.wind), f: fTal() },
        { t: ' m/s', f: fEnh() },
        { t: a.modVenstre ? '' : ' →', f: fTal() },
      ];
  pille(stykker, X(0.5), y, '#EDF8E4', X(0) + 4, X(1) - 4);
}

/* ── H/L-markeringer ── */
function drawPressureMarks(s) {
  if (Math.abs(s) < 0.06) return;
  const warmX = s > 0 ? 0.25 : 0.75;
  const coldX = 1 - warmX;
  const a = clamp(Math.abs(s) * 2.2, 0, 1);
  drawHL('L', warmX, 0.115, a * gates.g4, true);   // overflade, varm
  drawHL('H', coldX, 0.115, a * gates.g4, true);   // overflade, kold
  drawHL('H', warmX, 0.90, a * gates.g3, false);   // i højden, varm
  drawHL('L', coldX, 0.90, a * gates.g3, false);   // i højden, kold
}

/* ── Cirkulationspile — længde ∝ ΔT (trykgradient) ── */
function drawArrows(s) {
  if (Math.abs(s) < 0.05) return;
  const dir = s > 0 ? 1 : -1;    // 1: varm venstre
  const a = clamp(Math.abs(s) * 1.7, 0, 1);
  const warmX = dir > 0 ? 0.25 : 0.75;
  const coldX = 1 - warmX;
  const span = 0.30 + 0.32 * Math.abs(s);         // vandret pillængde
  const rise = 0.42 * (0.45 + 0.55 * Math.abs(s)); // lodret pillængde
  const lw   = 1.8 + Math.abs(s) * 1.8;
  // overflade: fra kold mod varm
  inkArrow(X(0.5 + (coldX - 0.5) * span), Z(0.06), X(0.5 + (warmX - 0.5) * span), Z(0.06), 0.12 * dir, a * gates.g5, lw);
  // op over varm
  inkArrow(X(warmX), Z(0.17), X(warmX), Z(0.17 + rise), 0.14 * dir, a * gates.g6, lw);
  // i højden: fra varm mod kold
  inkArrow(X(0.5 + (warmX - 0.5) * span), Z(0.86), X(0.5 + (coldX - 0.5) * span), Z(0.86), 0.12 * dir, a * gates.g3, lw);
  // ned over kold
  inkArrow(X(coldX), Z(0.17 + rise), X(coldX), Z(0.17), 0.14 * dir, a * gates.g6, lw);
}

/* ── Partikler ── */
function drawParcels(showAll) {
  if (showAll) parcels.forEach((p, i) => {
    if (state.layers.tracer && i === 0) return; // tegnes til sidst
    ctx.beginPath();
    ctx.arc(X(p.x), Z(p.z), 2.4, 0, 7);
    ctx.fillStyle = parcelColor(p.t, 0.62);
    ctx.fill();
  });
  if (state.layers.tracer && parcels.length) {
    const p = parcels[0];
    if (p.trail.length > 1) {
      ctx.strokeStyle = 'rgba(23,33,31,0.45)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      p.trail.forEach(([tx, tz], j) => j === 0 ? ctx.moveTo(X(tx), Z(tz)) : ctx.lineTo(X(tx), Z(tz)));
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.beginPath(); ctx.arc(X(p.x), Z(p.z), 6, 0, 7);
    ctx.fillStyle = parcelColor(p.t, 1); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath(); ctx.arc(X(p.x), Z(p.z), 10, 0, 7);
    ctx.strokeStyle = 'rgba(23,33,31,0.55)'; ctx.lineWidth = 1.4;
    ctx.stroke();
  }
}

/* ── Spotlight: fremhæv det trin, forklaringen står på ── */
function drawSpotlight(s, st) {
  if (!st || Math.abs(s) < 0.04 && st > 1) return;
  const warmX = (s >= 0) ? 0.25 : 0.75;
  const coldX = 1 - warmX;
  const pulse = reduceMotion ? 0.8 : 0.6 + 0.25 * Math.sin(performance.now() / 300);
  ctx.strokeStyle = `rgba(255,179,0,${pulse})`;
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 6]);
  const ell = (xn, zn, rx, ry) => {
    ctx.beginPath();
    ctx.ellipse(X(xn), Z(zn), rx * plotW, ry * plotH, 0, 0, 7);
    ctx.stroke();
  };
  switch (st) {
    case 1: ell(warmX, 0.035, 0.17, 0.06); break;
    case 2: ell(warmX, 0.55, 0.16, 0.38); break;
    case 3: ell(0.5, 0.88, 0.30, 0.10); break;
    case 4: ell(warmX, 0.10, 0.09, 0.09); ell(coldX, 0.10, 0.09, 0.09); break;
    case 5: ell(0.5, 0.06, 0.28, 0.055); break;
    case 6: ell(0.5, 0.5, 0.36, 0.44); break;
  }
  ctx.setLineDash([]);
}

/* ── Hele billedet ── */
export function tegn(d, spot) {
  const a = aflaesning(d);
  ctx.clearRect(0, 0, W, H);
  drawSky();
  drawHeatGlow(d.s * (0.4 + 0.6 * gates.g2));
  if (state.layers.isobar) drawIsobars(d.s);
  drawAxis();
  if (state.layers.parcels || state.layers.tracer) drawParcels(state.layers.parcels);
  if (state.layers.arrows) drawArrows(d.s);
  if (state.layers.hl) drawPressureMarks(d.s);
  drawTrykOppe(a);
  drawVind(d, a);
  drawGround(d, a);
  drawSpotlight(d.s, spot);
  return a;
}
