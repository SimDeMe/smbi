/* side.js — binder skydere, bølgekort, instrumenter og figur sammen,
   og holder billedet i gang. */

import * as M from './model.js';
import * as S from './strand.js';
import * as B from './boelger.js';
import * as O from './opskyl.js';
import { byg as bygKort } from './kort.js';

const $ = id => document.getElementById(id);

const kanvas = $('sim');
const c = kanvas.getContext('2d');
const inpH = $('inp-hoejde'), inpT = $('inp-periode'), inpTid = $('inp-tid');

const roligt = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

let tid = 0, Th = 0, sidsteBillede = 0, koerer = true;
let nSidst = null, tSidst = -99;
const pr = { punkter: [] };

// ── Skarpt billede på skærme med høj pixeltæthed ───────
function tilpasKanvas(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  kanvas.width  = Math.round(S.W  * dpr);
  kanvas.height = Math.round(S.HC * dpr);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
}
tilpasKanvas();
window.addEventListener('resize', tilpasKanvas);

// ── Talformat ──────────────────────────────────────────
const tal = (v, n = 1) => v.toLocaleString('da-DK', { minimumFractionDigits: n, maximumFractionDigits: n });

// ── Bølgen ─────────────────────────────────────────────
// En bølge kan ikke blive stejlere end ca. 1:7 — så bryder den af sig
// selv. Højden standser derfor, hvor den grænse er nået.
function boelgen(){
  const T = +inpT.value;
  const H = Math.min(+inpH.value, M.maksHoejde(T));
  if (+inpH.value > H + 1e-9) inpH.value = (Math.floor(H * 10) / 10).toFixed(1);
  return { H: +inpH.value, T };
}

function saetBoelge(H, T){
  inpT.value = T.toFixed(1);
  inpH.value = Math.min(H, M.maksHoejde(+inpT.value)).toFixed(1);
  merkater(); gemTilstand();
}

const FORLAEG = {
  brise:    { H: 0.4, T: 4.5 },   // svag pålandsvind en sommerdag
  doenning: { H: 1.2, T: 11  },   // dønning fra en storm langt ude
  kuling:   { H: 1.8, T: 6   },   // kuling tæt på kysten
  storm:    { H: 3.5, T: 7.5 }    // vinterstorm
};

// ── Bølgekortet ────────────────────────────────────────
const opdaterKort = bygKort($('kort'), {
  tMin: +inpT.min, tMax: +inpT.max, hMin: +inpH.min,
  onVaelg: (H, T) => saetBoelge(H, T)
});

// ── Mærkater på skyderne ───────────────────────────────
function merkater(){
  $('lbl-hoejde').textContent  = tal(+inpH.value, 1) + ' m';
  $('lbl-periode').textContent = tal(+inpT.value, 1) + ' s';
  const d = +inpTid.value;
  $('lbl-tid').textContent = d === 0 ? 'står stille' : tal(d, 1) + ' døgn/s';
}

// ── Instrumenter og nøgletal ───────────────────────────
const SKALA_TID = 13;   // s — tidslinjens fulde bredde
let srTimer = 0;

function aflaes(m, t){
  // stejlhed
  $('val-stejl').firstChild.nodeValue = '1:' + Math.round(1 / m.stejlhed);
  $('val-hl').textContent = tal(m.stejlhed, 3);
  $('anim-stejl').style.width = Math.min(100, m.stejlhed / 0.08 * 100) + '%';
  $('anim-stejl').style.background = t.farve;

  // frekvens
  $('val-frek').firstChild.nodeValue = tal(m.frekvens, 1);
  $('anim-frek').style.width = Math.min(100, m.frekvens / 20 * 100) + '%';

  // tidsregnskabet
  const pct = s => Math.min(100, s / SKALA_TID * 100) + '%';
  $('tl-periode').style.width = pct(m.T);
  $('tl-skyl').style.width = pct(m.tSkyl);
  $('tl-naeste').style.left = pct(m.T);
  const over = $('tl-over');
  if (m.luft < 0){ over.style.left = pct(m.T); over.style.width = `calc(${pct(m.tSkyl)} - ${pct(m.T)})`; }
  else over.style.width = '0';
  $('val-luft').firstChild.nodeValue = m.luft >= 0 ? 'Ja' : 'Nej';
  $('val-luft-s').textContent = tal(Math.abs(m.luft), 1) + ' s ' + (m.luft >= 0 ? 'til overs' : 'for lidt');

  // opskyl mod tilbageskyl
  $('bar-op').style.width  = m.op  * 100 + '%';
  $('bar-ned').style.width = m.ned * 100 + '%';
  $('val-type').firstChild.nodeValue = t.navn;
  $('val-netto').textContent = (m.netto >= 0 ? '+' : '−') + tal(Math.abs(m.netto), 1);
  $('g-type').style.background = t.lys;

  // fakta
  $('f-l').textContent = Math.round(m.L).toLocaleString('da-DK');
  $('f-nedsiv').textContent = Math.round(m.nedsivning * 100);
  $('f-brems').textContent = Math.round(m.bremsning * 100);
  $('f-dag').textContent = Math.floor(S.sand.dag).toLocaleString('da-DK');

  if (performance.now() > srTimer){
    srTimer = performance.now() + 2000;
    $('sr-status').textContent =
      'Bølgehøjde ' + tal(m.H, 1) + ' meter, periode ' + tal(m.T, 1) + ' sekunder, bølgelængde ' +
      Math.round(m.L) + ' meter. Stejlhed 1 til ' + Math.round(1 / m.stejlhed) + '. ' +
      tal(m.frekvens, 1) + ' bølger pr. minut. Opskyl og tilbageskyl tager ' + tal(m.tSkyl, 1) +
      ' sekunder, så der er ' + tal(Math.abs(m.luft), 1) + ' sekunder ' +
      (m.luft >= 0 ? 'til overs' : 'for lidt') + ' før næste bølge. ' + t.navn + ' bølge: ' + t.ord +
      ' på ' + tal(Math.abs(m.netto), 1) + ' kubikmeter sand pr. meter kyst pr. døgn.';
  }
}

// ── Billedet ───────────────────────────────────────────
function tegn(m, sk){
  c.clearRect(0, 0, S.W, S.HC);
  S.tegnHimmel(c);
  B.tegnVand(c, pr, Th);
  S.tegnBund(c);
  S.tegnStartprofil(c);
  O.tegnNedsivning(c, sk);
  O.tegnTunger(c, sk);
  O.tegnKorn(c);
  O.tegnMoede(c, sk);
  B.tegnBrydning(c, pr, Th);

  const maerk = [];
  const fr = O.forreste(sk);
  if (sk.moede !== null){
    const x = S.XS + sk.moede;
    maerk.push({ tekst: 'OPSKYL BREMSES', x: S.px(x), y: S.py(S.bundZ(x)) - 44,
                 mod: S.py(S.bundZ(x)) - 12, bund: '#FFD9C9' });
  } else if (fr && fr.x > S.XS + 1){
    maerk.push({ tekst: fr.op ? 'OPSKYL →' : '← TILBAGESKYL', x: S.px(fr.x), y: S.py(S.bundZ(fr.x)) - 44,
                 mod: S.py(S.bundZ(fr.x)) - 8 });
  }
  if (pr.xBryd !== null && pr.xBryd < S.XS - 4)
    maerk.push({ tekst: 'BØLGERNE BRYDER', x: S.px(pr.xBryd), y: S.HAV_Y - 72, mod: S.HAV_Y - 30 });
  if (S.revleHoejde() > 0.3)
    maerk.push({ tekst: 'REVLE', x: S.px(S.revleX()), y: S.py(S.bundZ(S.revleX())) + 38 });
  if (S.sand.s > 0.62)
    maerk.push({ tekst: 'BERM', x: S.px(S.bermX()), y: S.py(S.bundZ(S.bermX())) + 40 });
  if (m.nedsivning > 0.06 && sk.st.some(s => !s.op))
    maerk.push({ tekst: 'NEDSIVNING', x: S.px(S.XS + 7), y: S.py(S.bundZ(S.XS + 7)) + 70 });
  maerk.push({ tekst: 'KLIT', x: S.px(S.KLIT_X + 7), y: S.py(S.bundZ(S.KLIT_X + 7)) - 18 });
  S.tegnMaerkater(c, maerk);
}

// ── Løkken ─────────────────────────────────────────────
function billede(nu){
  const dt = Math.min(0.05, (nu - sidsteBillede) / 1000 || 0);
  sidsteBillede = nu;
  const b = boelgen();
  const m = M.beregn(b.H, b.T);
  const t = M.type(m);

  const gaar = koerer && !roligt;
  if (gaar){ tid += dt; Th += 2 * Math.PI / b.T * dt; }

  B.profil(b.H, b.T, pr);

  // Når en bølgetop når kystlinjen, begynder et nyt opskyl
  const n = Math.floor((Th - pr.faseKyst) / (2 * Math.PI));
  if (nSidst !== null && n > nSidst && tid - tSidst > 0.5 * b.T){ O.nyBoelge(tid, m); tSidst = tid; }
  nSidst = n;

  if (gaar) S.udvikl(m.netto, dt * (+inpTid.value));
  const sk = O.stilling(tid);
  if (gaar) O.flytKorn(dt, tid, m, sk);

  tegn(m, sk);
  aflaes(m, t);
  opdaterKort(m, t);
  requestAnimationFrame(billede);
}

// ── Betjening ──────────────────────────────────────────
[inpH, inpT, inpTid].forEach(el => el.addEventListener('input', () => { merkater(); gemTilstand(); }));

for (const navn of Object.keys(FORLAEG))
  $('btn-' + navn).addEventListener('click', () => saetBoelge(FORLAEG[navn].H, FORLAEG[navn].T));

const btnPause = $('btn-pause');
btnPause.addEventListener('click', () => {
  koerer = !koerer;
  btnPause.setAttribute('aria-pressed', koerer ? 'false' : 'true');
  btnPause.textContent = koerer ? 'Pause' : 'Fortsæt';
});

$('btn-reset').addEventListener('click', () => {
  S.nulstil(); O.nulstilTunger(); O.saaKorn();
});

// Projektortilstand: sidens krom ryger væk, aflæsningerne skaleres op
const btnProjektor = $('btn-projektor');
function saetProjektor(til){
  document.body.setAttribute('data-projektor', til ? '1' : '0');
  btnProjektor.setAttribute('aria-pressed', til ? 'true' : 'false');
}
btnProjektor.addEventListener('click', () =>
  saetProjektor(document.body.getAttribute('data-projektor') !== '1'));

// ── Deling: tilstanden ligger i adressen ───────────────
let hashTimer = 0, hashSidste = '';
const tilstandStreng = () => '#h=' + inpH.value + '&t=' + inpT.value + '&d=' + inpTid.value;
function gemTilstand(){
  const h = tilstandStreng();
  if (h === hashSidste) return;
  hashSidste = h;
  clearTimeout(hashTimer);
  hashTimer = setTimeout(() => { if (location.hash !== h) history.replaceState(null, '', h); }, 400);
}
function laesTilstand(){
  const p = new URLSearchParams(location.search);
  new URLSearchParams(location.hash.replace(/^#/, '')).forEach((v, k) => p.set(k, v));
  const saet = (el, noegle) => {
    const v = parseFloat(p.get(noegle));
    if (isFinite(v)) el.value = Math.max(+el.min, Math.min(+el.max, v));
  };
  saet(inpT, 't'); saet(inpH, 'h'); saet(inpTid, 'd');
  hashSidste = tilstandStreng();
}

// ── Start ──────────────────────────────────────────────
if (roligt) inpTid.value = 0;
laesTilstand();
O.saaKorn();
merkater();
if (/mode=teach|projektor=1/.test(location.search)) saetProjektor(true);

// På en smal skærm ruller figuren vandret. Start ved stranden — det er
// dér, det afgøres.
const scene = document.querySelector('.fig-rul');
requestAnimationFrame(() => {
  if (scene && scene.scrollWidth > scene.clientWidth)
    scene.scrollLeft = scene.scrollWidth - scene.clientWidth;
});

requestAnimationFrame(billede);
