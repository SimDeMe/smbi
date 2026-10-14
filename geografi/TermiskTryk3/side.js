/* ================================================================
   Termiske tryksystemer — siden
   Binder modellen, tegningen og betjeningen sammen: tidsrækken under
   figuren og de tre faner i sidespalten (Forklaring, Case, Indstillinger).
   ================================================================ */
import {
  state, gates, CASES, SPEEDS, clamp,
  stepTemps, derive, stepParcels, applyCase, jumpToTime,
  saetOverflade, saetDtManuel,
} from './model.js';
import { tegn, resizeCanvas, saetSkala, reduceMotion, fmt1 } from './tegning.js';

const $ = id => document.getElementById(id);

function clockStr() {
  const h = Math.floor(state.timeOfDay) % 24;
  const m = Math.floor((state.timeOfDay % 1) * 60);
  return `kl. ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/* ── Faner ──────────────────────────────────────────────
   Pil venstre/højre flytter mellem fanerne, som en tablist skal. */
const faner = [...document.querySelectorAll('.tabs [role=tab]')];
let aktivFane = 'forklaring';

function visFane(id, fokus) {
  aktivFane = id;
  faner.forEach(f => {
    const til = f.dataset.fane === id;
    f.setAttribute('aria-selected', til ? 'true' : 'false');
    f.tabIndex = til ? 0 : -1;
    $(f.getAttribute('aria-controls')).hidden = !til;
    if (til && fokus) f.focus();
  });
}
faner.forEach((f, i) => {
  f.addEventListener('click', () => visFane(f.dataset.fane));
  f.addEventListener('keydown', e => {
    let j = null;
    if (e.key === 'ArrowRight') j = (i + 1) % faner.length;
    if (e.key === 'ArrowLeft') j = (i - 1 + faner.length) % faner.length;
    if (e.key === 'Home') j = 0;
    if (e.key === 'End') j = faner.length - 1;
    if (j == null) return;
    e.preventDefault();
    visFane(faner[j].dataset.fane, true);
  });
});

/* ── Forklaring: kausalkæden ét trin ad gangen ──────────
   Pilene og prikkerne står øverst, så de ikke flytter sig, når teksten
   skifter længde. Sidespaltens højde følger figuren, så panelet står stille. */
const trinTekster = [...document.querySelectorAll('.trin-tekst')];
const trinPrikker = [...document.querySelectorAll('.trin-prik')];

function updateChain() {
  const n = state.focusStep;
  trinTekster.forEach(t => t.classList.toggle('on', +t.dataset.step === n));
  trinPrikker.forEach(p => {
    const k = +p.dataset.step;
    p.setAttribute('aria-current', k === n ? 'step' : 'false');
    p.classList.toggle('naaet', state.mode === 'trin' ? k <= state.step : true);
  });
  $('trin-ind').textContent = `Trin ${n} af 6`;
  $('btn-prev').disabled = n <= 1;
  $('btn-next').disabled = n >= 6;
  $('chk-byg').checked = state.mode === 'trin';
}

function gaaTilTrin(n) {
  n = clamp(n, 1, 6);
  state.focusStep = n;
  if (state.mode === 'trin') state.step = n;
  updateChain(); gemTilstand();
}
$('btn-prev').addEventListener('click', () => gaaTilTrin(state.focusStep - 1));
$('btn-next').addEventListener('click', () => gaaTilTrin(state.focusStep + 1));
trinPrikker.forEach(p => p.addEventListener('click', () => gaaTilTrin(+p.dataset.step)));

// Byg figuren op: kun det, forklaringen er nået til, vises — og tiden står stille
function setMode(m) {
  state.mode = m;
  if (m === 'trin') {
    state.running = false;
    saetPlayKnap();
    state.step = state.focusStep;
  } else {
    state.step = 6;
  }
  updateChain();
}
$('chk-byg').addEventListener('change', e => { setMode(e.target.checked ? 'trin' : 'fri'); gemTilstand(); });

/* ── Case ── */
const caseKnapper = [...document.querySelectorAll('#case-btns .btn')];
function vaelgCase(id) {
  applyCase(id);
  $('sl-time').value = state.timeOfDay;
  $('case-desc').textContent = CASES[id].desc;
  caseKnapper.forEach(b => b.setAttribute('aria-pressed', b.dataset.case === id ? 'true' : 'false'));
  visOverflader();
}
caseKnapper.forEach(b => b.addEventListener('click', () => { vaelgCase(b.dataset.case); gemTilstand(); }));
$('btn-reset').addEventListener('click', () => { vaelgCase(state.caseId); gemTilstand(); });

/* ── Tid på døgnet ── */
$('sl-time').addEventListener('input', e => { jumpToTime(+e.target.value); gemTilstand(); });

function saetPlayKnap() {
  const b = $('btn-play');
  b.textContent = state.running ? '⏸ Pause' : '▶ Kør';
  b.setAttribute('aria-pressed', state.running ? 'true' : 'false');
}
$('btn-play').addEventListener('click', () => {
  state.running = !state.running;
  saetPlayKnap();
  gemTilstand();
});
$('btn-day').addEventListener('click', () => { jumpToTime(13); $('sl-time').value = 13; gemTilstand(); });
$('btn-night').addEventListener('click', () => { jumpToTime(1); $('sl-time').value = 1; gemTilstand(); });
$('btn-speed').addEventListener('click', () => {
  state.speedIx = (state.speedIx + 1) % SPEEDS.length;
  $('btn-speed').textContent = SPEEDS[state.speedIx].txt;
});

/* ── Indstillinger: overflader, ΔT og lag ── */
const overfladeKnapper = [...document.querySelectorAll('.seg [data-surf]')];
function visOverflader() {
  overfladeKnapper.forEach(b => {
    const nu = b.dataset.side === 'l' ? state.surfL : state.surfR;
    b.setAttribute('aria-pressed', b.dataset.surf === nu ? 'true' : 'false');
  });
}
overfladeKnapper.forEach(b => b.addEventListener('click', () => {
  saetOverflade(b.dataset.side, b.dataset.surf);
  visOverflader();
}));

$('chk-expert').addEventListener('change', e => {
  state.expert = e.target.checked;
  $('sl-dt').disabled = !state.expert;
  if (state.expert) saetDtManuel(+$('sl-dt').value);
});
$('sl-dt').addEventListener('input', e => {
  saetDtManuel(+e.target.value);
  visDt();
});
function visDt() {
  $('lbl-dt').textContent = (state.dtManual >= 0 ? '+' : '−') + fmt1(Math.abs(state.dtManual)) + ' °C';
}

[['lay-isobar','isobar'], ['lay-ref','ref'], ['lay-hl','hl'],
 ['lay-arrows','arrows'], ['lay-parcels','parcels'], ['lay-tracer','tracer']]
  .forEach(([id, key]) =>
    $(id).addEventListener('change', e => { state.layers[key] = e.target.checked; }));

/* ── Skærmlæser-status ──────────────────────────────────
   Aflæsningerne står i lærredet og ændrer sig for hver optegning. Feltet
   skrives først, når de har stået stille i 800 ms. */
const elSr = $('sr-status');
let srTimer = 0, srOplaest = '', srVentende = '';

function planlaegStatus(d, a) {
  const vind = a.stille ? 'Vindstille ved overfladen. '
    : 'Overfladevind ' + d.wind.toFixed(0) + ' meter i sekundet mod ' +
      (a.modVenstre ? state.labelL : state.labelR) + (a.navn ? ' (' + a.navn.toLowerCase() + ')' : '') + '. ';
  const tekst =
    CASES[state.caseId].navn + ', ' + clockStr() + '. ' +
    state.labelL + ' ' + Math.round(state.tL) + ' grader og ' + a.p0L.toFixed(0) + ' hektopascal, ' +
    state.labelR + ' ' + Math.round(state.tR) + ' grader og ' + a.p0R.toFixed(0) + ' hektopascal. ' +
    vind +
    (state.mode === 'trin' ? 'Figuren vist til og med trin ' + state.step + ' af 6.' : '');

  if (tekst === srVentende) return;      // uændret siden sidste optegning
  srVentende = tekst;
  clearTimeout(srTimer);
  if (tekst === srOplaest) return;       // tilbage til det, der allerede er læst op
  srTimer = setTimeout(function () {
    srOplaest = tekst;
    elSr.textContent = tekst;
  }, 800);
}

/* ── Rammen skal stå stille ─────────────────────────────
   Statuslinjen og case-teksten skifter længde. Alle varianter måles én
   gang, og felterne låses til den største, så panelet ikke hopper. */
function maalHoejeste(el, tekster) {
  const org = el.textContent;
  el.style.minHeight = '';
  let maks = 0;
  tekster.forEach(t => { el.textContent = t; maks = Math.max(maks, el.offsetHeight); });
  el.textContent = org;
  el.style.minHeight = maks + 'px';
}
function maalBredeste(el, tekster) {
  const org = el.textContent;
  el.style.minWidth = '';
  let maks = 0;
  tekster.forEach(t => { el.textContent = t; maks = Math.max(maks, el.offsetWidth); });
  el.textContent = org;
  el.style.minWidth = maks + 'px';
}
function laasHoejder() {
  maalBredeste($('live-txt'), Object.values(CASES).map(c => c.navn + ' · kl. 00:00'));
  // case-teksten står i en skjult fane, når siden åbner — mål den synligt
  const panel = $('fane-case'), skjult = panel.hidden;
  panel.hidden = false;
  maalHoejeste($('case-desc'), Object.values(CASES).map(c => c.desc));
  panel.hidden = skjult;
}

/* ================================================================
   HOVEDLØKKE
   ================================================================ */
let lastT = performance.now();

function frame(now) {
  const dtReal = Math.min(0.1, (now - lastT) / 1000);
  lastT = now;

  // Tid & temperaturer — står helt stille når der er pauset
  if (!state.expert && state.running) {
    const dtH = SPEEDS[state.speedIx].mul * dtReal;
    state.timeOfDay = (state.timeOfDay + dtH) % 24;
    stepTemps(dtH);
    $('sl-time').value = state.timeOfDay;
  }

  const d = derive();

  // Gates: i trin-tilstand åbnes effekterne kumulativt; ellers alt åbent
  const tgt = n => (state.mode === 'fri' || state.step >= n) ? 1 : 0;
  ['g2','g3','g4','g5','g6'].forEach((g, i) => {
    const t = tgt(i + 2);
    gates[g] += (t - gates[g]) * Math.min(1, 3.2 * dtReal);
  });

  // Partikler — står stille ved pause ligesom uret og temperaturerne
  if (state.running && (state.layers.parcels || state.layers.tracer)) stepParcels(dtReal, d.s);

  // Spotlyset følger forklaringen — men kun mens forklaringen er fremme
  const a = tegn(d, aktivFane === 'forklaring' ? state.focusStep : 0);

  const ur = clockStr();
  $('clock').textContent = ur;
  $('live-txt').textContent = CASES[state.caseId].navn + ' · ' + ur;
  planlaegStatus(d, a);
  requestAnimationFrame(frame);
}

/* ── Projektortilstand ──────────────────────────────────── */
const btnProjektor = $('btn-projektor');
function saetProjektor(til) {
  document.body.setAttribute('data-projektor', til ? '1' : '0');
  btnProjektor.setAttribute('aria-pressed', til ? 'true' : 'false');
  saetSkala(til ? 1.3 : 1);
  laasHoejder();
}
btnProjektor.addEventListener('click', function () {
  saetProjektor(document.body.getAttribute('data-projektor') !== '1');
});

/* ── Fuld skærm: browserens faner og adresselinje forsvinder, og
   figuren får 100–150 px mere. Vises kun, hvor det kan lade sig gøre. */
const btnFuld = $('btn-fuld');
if (document.fullscreenEnabled) {
  btnFuld.hidden = false;
  btnFuld.addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(function () {});
  });
  document.addEventListener('fullscreenchange', function () {
    const til = !!document.fullscreenElement;
    btnFuld.setAttribute('aria-pressed', til ? 'true' : 'false');
    btnFuld.textContent = til ? '⤡ Luk fuld skærm' : '⤢ Fuld skærm';
  });
}

/* ── Deling: tilstanden ligger i adressen ───────────────
   #case=lillebaelt&trin=3&t=13.00 — de samme nøgler accepteres som query,
   så et link til et bestemt trin kan deles direkte. */
let hashTimer = 0, hashSidste = '';

function tilstandStreng() {
  let s = '#case=' + state.caseId;
  if (state.mode === 'trin') s += '&trin=' + state.step;
  return s + '&t=' + state.timeOfDay.toFixed(2);
}

function gemTilstand() {
  const h = tilstandStreng();
  if (h === hashSidste) return;
  hashSidste = h;
  clearTimeout(hashTimer);
  hashTimer = setTimeout(function () {
    if (location.hash !== h) history.replaceState(null, '', h);
  }, 400);
}

function laesTilstand() {
  const p = new URLSearchParams(location.search);
  new URLSearchParams(location.hash.replace(/^#/, '')).forEach(function (v, k) { p.set(k, v); });

  const c = p.get('case');
  if (c && CASES[c]) vaelgCase(c);

  const trin = parseInt(p.get('trin'), 10);
  if (isFinite(trin) && trin >= 1 && trin <= 6) {
    state.focusStep = trin;
    setMode('trin');
    visFane('forklaring');
  }

  const t = parseFloat(p.get('t'));
  if (isFinite(t)) { jumpToTime(clamp(t, 0, 24)); $('sl-time').value = state.timeOfDay; }

  if (/mode=teach|projektor=1/.test(location.search)) saetProjektor(true);

  hashSidste = tilstandStreng();   // adressen skrives først, når noget faktisk ændres
}

/* ── Start ── */
window.addEventListener('resize', () => { resizeCanvas(); laasHoejder(); });
/* Kaldes af scriptet "Højdebudget" nederst, når --fig har ændret sig. */
window.tilpasFigur = resizeCanvas;

resizeCanvas();
vaelgCase('lillebaelt');
if (reduceMotion) state.running = false;   // ingen løbende bevægelse uden brugerens ønske
saetPlayKnap();
visDt();
visFane('forklaring');
laesTilstand();
updateChain();
laasHoejder();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { laasHoejder(); resizeCanvas(); });
requestAnimationFrame(t => { lastT = t; frame(t); });
