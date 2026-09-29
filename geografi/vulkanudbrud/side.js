/* side.js — binder skydere, knapper, instrumenter, tværsnit og lup
   sammen, styrer udbruddets forløb og holder billedet i gang.

   Forløbet (samme rækkefølge som i grundbogen):
     hvile   — magma strømmer ind i kammeret nedefra, overtrykket vokser,
               og jorden over kammeret hæver sig en smule.
     aabner  — overtrykket bliver større, end klippen kan holde til. Der
               revner en vej op, og magmaet presser sig op mod krateret.
     udbrud  — magmaet strømmer op, afgasser og sprænges. Trykket i
               kammeret falder, og udbruddet ebber ud.
     lukker  — magmaet i kanalen størkner, og kanalen lukkes igen. */

import * as M from './model.js';
import * as S from './snit.js';
import * as L from './lupe.js';
import { VULKANER } from './vulkaner.js';

const $ = id => document.getElementById(id);
const snit = $('snit'), cs = snit.getContext('2d');
const lupe = $('lupe'), cl = lupe.getContext('2d');
const inpDybde = $('inp-dybde'), inpVand = $('inp-vand');
const roligt = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

let type = VULKANER[0];
const BRUD = 20;                           // MPa — overtrykket, hvor kammerets loft revner
const T_HVILE = 22, T_UDBRUD = 32;         // s på skærmen
const tilst = { fase: 'hvile', overtryk: 13, brud: BRUD, front: 0, intensitet: 0, magma: null };

let koerer = !roligt, foelger = false, sidst = 0;
let lupeZ = 7;                             // km — lupens dybde; skyderen viser den afrundet

// ── Skarpt billede på skærme med høj pixeltæthed ───────
function tilpasKanvas(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  for (const [k, c, w, h] of [[snit, cs, S.W, S.H], [lupe, cl, L.W, L.H]]){
    k.width = Math.round(w * dpr); k.height = Math.round(h * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}
tilpasKanvas();
addEventListener('resize', tilpasKanvas);

const tal = (v, n = 1) => v.toLocaleString('da-DK', { minimumFractionDigits: n, maximumFractionDigits: n });
const sig = (v, n = 2) => v.toLocaleString('da-DK', { maximumSignificantDigits: n });

// ── Vulkantype ─────────────────────────────────────────
function vaelgType(id, vand){
  type = VULKANER.find(v => v.id === id) || VULKANER[0];
  tilst.magma = { ...type.magma };
  inpVand.min = type.magma.vandMin; inpVand.max = type.magma.vandMaks;
  inpVand.value = vand ?? type.magma.vand;
  tilst.magma.vand = +inpVand.value;
  type.udbrud.nulstil();
  tilst.fase = 'hvile'; tilst.front = type.kammer.top; tilst.overtryk = 13;
  if (roligt){ tilst.fase = 'udbrud'; tilst.front = 0; tilst.overtryk = 10; tilst.intensitet = 0.65; }
  document.querySelectorAll('#typer button').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === type.id));
  $('f-magma').textContent = type.magma.navn;
  $('f-sio2').textContent = type.magma.SiO2;
  $('f-temp').textContent = type.magma.T.toLocaleString('da-DK');
  $('type-navn').textContent = type.navn;
  merkater();
}

if (VULKANER.length > 1){
  const boks = $('typer');
  for (const v of VULKANER){
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn-mini'; b.dataset.id = v.id;
    b.textContent = v.navn; b.title = v.kort + ' — fx ' + v.eksempler;
    b.addEventListener('click', () => { vaelgType(v.id); gemTilstand(); });
    boks.appendChild(b);
  }
  boks.hidden = false;
}

// ── Udbruddets forløb ──────────────────────────────────
const FASENAVN = {
  hvile:  'Hvile · kammeret fyldes',
  aabner: 'Kanalen revner op',
  udbrud: 'Udbrud',
  lukker: 'Udbruddet er slut · kanalen størkner'
};

function startUdbrud(){
  if (tilst.fase !== 'hvile') return;
  tilst.overtryk = Math.max(tilst.overtryk, BRUD);
  tilst.fase = 'aabner';
}

function forloeb(dt){
  const k = type.kammer;
  switch (tilst.fase){
    case 'hvile':
      tilst.overtryk += BRUD / T_HVILE * dt;
      if (tilst.overtryk >= BRUD) startUdbrud();
      break;
    case 'aabner':
      tilst.front -= 2.2 * dt;
      tilst.overtryk -= BRUD / T_UDBRUD * dt * 0.5;
      if (tilst.front <= 0){ tilst.front = 0; tilst.fase = 'udbrud'; }
      break;
    case 'udbrud':
      // Mens man følger en magmapakke, ebber udbruddet langsommere ud
      tilst.overtryk -= BRUD / T_UDBRUD * dt * (foelger ? 0.4 : 1);
      if (tilst.overtryk <= 0){ tilst.overtryk = 0; tilst.fase = 'lukker'; }
      break;
    case 'lukker':
      tilst.front += 1.4 * dt;
      if (tilst.front >= k.top){ tilst.front = k.top; tilst.fase = 'hvile'; }
      break;
  }
  tilst.intensitet = tilst.fase === 'udbrud' ? 0.3 + 0.7 * tilst.overtryk / BRUD : 0;
}

// ── Hvad ser lupen? ────────────────────────────────────
function iLupen(z){
  const k = type.kammer;
  const iKanal = z < k.top;
  if (iKanal && z < tilst.front - 1e-6) return { slags: 'klippe', z, iKanal };
  return { slags: 'magma', z, iKanal, p: M.punkt(z, tilst.magma, iKanal ? 0 : tilst.overtryk) };
}

const flyder = () => tilst.fase === 'aabner' || tilst.fase === 'udbrud';

// ── Mærkater på skyderne ───────────────────────────────
function merkater(){
  $('lbl-dybde').textContent = tal(lupeZ) + ' km';
  $('lbl-vand').firstChild.nodeValue = tal(+inpVand.value) + ' ';
}

// ── Instrumenter ───────────────────────────────────────
let srTimer = 0;
function aflaes(l){
  const P = l.slags === 'magma' ? l.p.P : M.tryk(l.z);
  $('val-tryk').firstChild.nodeValue = (P < 10 ? tal(P, 1) : Math.round(P).toLocaleString('da-DK')) + ' ';
  const gange = P / M.P0;
  $('val-tryk-s').textContent = gange < 1.5 ? 'som lufttrykket ved jorden'
    : '≈ ' + sig(gange).replace(/ /g, ' ') + ' × lufttrykket ved jorden';
  $('bar-tryk').style.width = Math.min(100, P / 340 * 100) + '%';
  $('f-overtryk').textContent = Math.round(tilst.overtryk);

  const vm = tilst.magma.vandMaks;
  if (l.slags === 'klippe'){
    for (const id of ['val-vand', 'val-gas']){ $(id).firstChild.nodeValue = '— '; $(id).querySelector('.enhed').hidden = true; }
    $('val-vand-s').textContent = 'ingen magma her';
    $('val-gas-s').textContent = 'ingen magma her';
    $('bar-oploest').style.width = $('bar-frigjort').style.width = $('bar-gas').style.width = '0';
    $('mk-maks').style.opacity = 0;
    $('val-rho').firstChild.nodeValue = tal(M.RHO_KLIPPE / 1000, 2) + ' ';
    $('val-rho-s').textContent = 'fast bjergart';
    $('bar-rho').style.width = M.RHO_KLIPPE / 3000 * 100 + '%';
    $('bar-rho').style.background = '#8E8984';
    $('f-fart').textContent = '—';
    $('g-gas').classList.remove('sprunget');
  } else {
    const p = l.p;
    for (const id of ['val-vand', 'val-gas']) $(id).querySelector('.enhed').hidden = false;
    $('val-vand').firstChild.nodeValue = tal(p.oploest) + ' ';
    $('val-vand-s').textContent = p.gas > 0.005 ? tal(p.gas) + ' % er gået over på gasform' : 'alt vandet er opløst';
    $('bar-oploest').style.width = p.oploest / vm * 100 + '%';
    $('bar-frigjort').style.left = p.oploest / vm * 100 + '%';
    $('bar-frigjort').style.width = p.gas / vm * 100 + '%';
    $('mk-maks').style.opacity = 1;
    $('mk-maks').style.left = Math.min(100, p.maks / vm * 100) + '%';

    const pct = p.gasandel * 100;
    $('val-gas').firstChild.nodeValue = (pct > 0 && pct < 1 ? '< 1' : pct > 99 && pct < 100 ? tal(pct, 1) : Math.round(pct)) + ' ';
    $('val-gas-s').textContent = p.fragmenteret ? 'skummet er sprængt' : 'af magmaets rumfang';
    $('bar-gas').style.width = pct + '%';
    $('g-gas').classList.toggle('sprunget', p.fragmenteret);

    const rho = p.rho / 1000;
    $('val-rho').firstChild.nodeValue = (rho >= 0.1 ? tal(rho, 2) : sig(rho)) + ' ';
    $('val-rho-s').textContent = rho < M.RHO_KLIPPE / 1000 ? 'lettere end klippen omkring' : 'tungere end klippen omkring';
    $('bar-rho').style.width = Math.min(100, p.rho / 3000 * 100) + '%';
    $('bar-rho').style.background = '';

    if (l.iKanal && flyder()){
      const u = M.fart(p, tilst.magma, type.u0);
      $('f-fart').textContent = u < 10 ? tal(u) : Math.round(u).toLocaleString('da-DK');
    } else $('f-fart').textContent = '≈ 0';
  }

  if (performance.now() > srTimer){
    srTimer = performance.now() + 2500;
    const t = L.tekst(l, tilst.magma);
    let s = `${FASENAVN[tilst.fase]}. Lupen er ${tal(l.z)} km under krateret, trykket er ${Math.round(P)} megapascal. ${t.titel}.`;
    if (l.slags === 'magma')
      s += ` ${tal(l.p.oploest)} vægtprocent vand er opløst, gasboblerne fylder ${Math.round(l.p.gasandel * 100)} procent af rumfanget.`;
    $('sr-status').textContent = s;
  }
}

// ── Løkken ─────────────────────────────────────────────
function billede(nu){
  const dt = Math.min(0.05, (nu - sidst) / 1000 || 0);
  sidst = nu;
  tilst.magma.vand = +inpVand.value;
  const gr = M.graenser(tilst.magma);

  if (koerer){
    forloeb(dt);
    S.opdater(dt, type, tilst);
    type.udbrud.opdater(dt, S.geometri(type, tilst), tilst);
  }

  // Magmapakken: lupen følger magmaet op gennem kammer og kanal
  if (foelger && koerer){
    let z = lupeZ;
    const iKanal = z < type.kammer.top;
    if (iKanal && !flyder()) stopFoelg();
    else {
      const p = M.punkt(z, tilst.magma);
      const fart = iKanal ? S.visFart(p, tilst.magma) : 0.55;
      z = Math.max(z - fart * dt, iKanal || tilst.fase === 'aabner' ? Math.max(0, tilst.front) : 0);
      lupeZ = z;
      inpDybde.value = z.toFixed(1);
      merkater();
      if (z <= 0) stopFoelg();
    }
  }

  const z = lupeZ;
  const l = iLupen(z);

  // Indholdet i lupen strømmer forbi, med mindre man følger pakken
  if (koerer && !foelger && l.slags === 'magma'){
    const v = l.iKanal ? (flyder() ? Math.min(5, 0.25 * Math.pow(tilst.magma.rho / l.p.rho, 0.5)) : 0)
                       : (flyder() ? 0.05 : 0.015);
    L.stroem(v * dt);
  }

  cs.clearRect(0, 0, S.W, S.H);
  S.tegn(cs, type, tilst, gr, z, foelger);
  L.tegn(cl, l, tilst.magma, tal(z) + ' km under krateret');
  aflaes(l);

  $('fase').textContent = FASENAVN[tilst.fase];
  $('btn-udbrud').disabled = tilst.fase !== 'hvile';
  requestAnimationFrame(billede);
}

// ── Betjening ──────────────────────────────────────────
inpDybde.addEventListener('input', () => { lupeZ = +inpDybde.value; stopFoelg(); merkater(); gemTilstand(); });
inpVand.addEventListener('input', () => { merkater(); gemTilstand(); });

$('btn-udbrud').addEventListener('click', startUdbrud);

const btnFoelg = $('btn-foelg');
function stopFoelg(){
  foelger = false;
  btnFoelg.setAttribute('aria-pressed', 'false');
}
btnFoelg.addEventListener('click', () => {
  if (foelger){ stopFoelg(); return; }
  foelger = true;
  btnFoelg.setAttribute('aria-pressed', 'true');
  lupeZ = 11.5; inpDybde.value = lupeZ;
  startUdbrud();
  if (!koerer) skiftPause();
  merkater();
});

const btnPause = $('btn-pause');
function skiftPause(){
  koerer = !koerer;
  btnPause.setAttribute('aria-pressed', koerer ? 'false' : 'true');
  btnPause.textContent = koerer ? 'Pause' : 'Fortsæt';
}
btnPause.addEventListener('click', skiftPause);

// Træk i tværsnittet for at flytte lupen op og ned
let traekker = false;
function flytLupe(e){
  const r = snit.getBoundingClientRect();
  const z = S.zY((e.clientY - r.top) * S.H / r.height);
  lupeZ = Math.round(Math.max(0, Math.min(S.Z_MAKS, z)) * 10) / 10;
  inpDybde.value = lupeZ;
  stopFoelg(); merkater(); gemTilstand();
}
snit.addEventListener('pointerdown', e => { traekker = true; snit.setPointerCapture(e.pointerId); flytLupe(e); });
snit.addEventListener('pointermove', e => { if (traekker) flytLupe(e); });
snit.addEventListener('pointerup', () => { traekker = false; });
snit.addEventListener('pointercancel', () => { traekker = false; });

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
const tilstandStreng = () => '#type=' + type.id + '&vand=' + (+inpVand.value).toFixed(1) + '&dybde=' + lupeZ.toFixed(1);
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
  const vand = parseFloat(p.get('vand')), dybde = parseFloat(p.get('dybde'));
  vaelgType(p.get('type') || VULKANER[0].id);
  if (isFinite(vand)) inpVand.value = Math.max(+inpVand.min, Math.min(+inpVand.max, vand));
  if (isFinite(dybde)) inpDybde.value = Math.max(0, Math.min(S.Z_MAKS, dybde));
  lupeZ = +inpDybde.value;
  hashSidste = tilstandStreng();
}

// ── Start ──────────────────────────────────────────────
laesTilstand();
merkater();
if (roligt){ btnPause.setAttribute('aria-pressed', 'true'); btnPause.textContent = 'Fortsæt'; }
if (/mode=teach|projektor=1/.test(location.search)) saetProjektor(true);
// På en smal skærm ruller tværsnittet vandret. Start med kanalen i midten.
const scene = document.querySelector('.fig-rul');
requestAnimationFrame(() => {
  if (scene && scene.scrollWidth > scene.clientWidth)
    scene.scrollLeft = (scene.scrollWidth - scene.clientWidth) / 2;
});

requestAnimationFrame(billede);
