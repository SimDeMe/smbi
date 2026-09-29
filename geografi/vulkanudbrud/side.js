/* side.js — binder skydere, knapper, instrumenter, figur og lup sammen,
   styrer udbruddets forløb og holder billedet i gang.

   Siden har to tilstande:
     frit          — man flytter selv lupen og skruer på vandindholdet,
                     mens vulkanen skifter mellem hvile og udbrud
     trin for trin — forløbet fra subduktionen til askesøjlen i trin (se
                     trin-strato.js); hvert trin sætter lupen og udbruddet

   Udbruddets forløb (samme rækkefølge som i grundbogen):
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
import { lavTrinvis } from './trinvis.js';

const $ = id => document.getElementById(id);
const snit = $('snit'), cs = snit.getContext('2d');
const lupe = $('lupe'), cl = lupe.getContext('2d');
const inpDybde = $('inp-dybde'), inpVand = $('inp-vand');
const roligt = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

let type = VULKANER[0];
const BRUD = 20;                           // MPa — overtrykket, hvor kammerets loft revner
const T_HVILE = 22, T_UDBRUD = 32;         // s på skærmen
const START_OVERTRYK = 13;
const tilst = { fase: 'hvile', overtryk: START_OVERTRYK, brud: BRUD, front: 0, intensitet: 0, magma: null };

let koerer = !roligt, foelger = false, sidst = 0;
let lupeZ = 7;                             // km — lupens dybde; skyderen viser den afrundet
let modus = 'frit', trinvis = null;

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
function nulstilUdbrud(){
  type.udbrud.nulstil();
  tilst.fase = 'hvile'; tilst.front = type.kammer.top; tilst.overtryk = START_OVERTRYK; tilst.intensitet = 0;
  if (roligt){ tilst.fase = 'udbrud'; tilst.front = 0; tilst.overtryk = 10; tilst.intensitet = 0.65; }
}

function vaelgType(id, vand){
  type = VULKANER.find(v => v.id === id) || VULKANER[0];
  tilst.magma = { ...type.magma };
  inpVand.min = type.magma.vandMin; inpVand.max = type.magma.vandMaks;
  inpVand.value = vand ?? type.magma.vand;
  tilst.magma.vand = +inpVand.value;
  nulstilUdbrud();
  document.querySelectorAll('#typer button').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === type.id));
  $('type-navn').textContent = type.navn;
  $('btn-trin').hidden = !type.trin;
  trinvis = type.trin ? lavTrinvis({ trin: type.trin, ctx: tekstCtx, onSkift: gaaTilTrin }) : null;
  if (!trinvis && modus === 'trin') saetModus('frit');
  merkater();
}

if (VULKANER.length > 1){
  const boks = $('typer');
  for (const v of VULKANER){
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn-mini'; b.dataset.id = v.id;
    b.textContent = v.navn; b.title = v.kort + ' — fx ' + v.eksempler;
    b.addEventListener('click', () => { vaelgType(v.id); if (modus === 'trin') gaaTilTrin(0, true); gemTilstand(); });
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

// I "trin for trin" holder trinnet overtrykket mellem loft og gulv, så
// figuren bliver stående i den tilstand, teksten handler om.
function forloeb(dt){
  const k = type.kammer, styr = aktivtTrin()?.styr || {};
  switch (tilst.fase){
    case 'hvile':
      tilst.overtryk = Math.min(styr.loft ?? Infinity, tilst.overtryk + BRUD / T_HVILE * dt);
      if (tilst.overtryk >= BRUD) startUdbrud();
      break;
    case 'aabner':
      tilst.front -= 2.2 * dt;
      tilst.overtryk -= BRUD / T_UDBRUD * dt * 0.5;
      if (tilst.front <= 0){ tilst.front = 0; tilst.fase = 'udbrud'; }
      break;
    case 'udbrud':
      // Mens man følger en magmapakke, ebber udbruddet langsommere ud
      tilst.overtryk = Math.max(styr.gulv ?? 0, tilst.overtryk - BRUD / T_UDBRUD * dt * (foelger ? 0.4 : 1));
      if (tilst.overtryk <= 0){ tilst.overtryk = 0; tilst.fase = 'lukker'; }
      break;
    case 'lukker':
      tilst.front += 1.4 * dt;
      if (tilst.front >= k.top){ tilst.front = k.top; tilst.fase = 'hvile'; }
      break;
  }
  tilst.front = Math.max(0, tilst.front);
  tilst.intensitet = tilst.fase === 'udbrud' ? 0.3 + 0.7 * tilst.overtryk / BRUD : 0;
}

const flyder = () => tilst.fase === 'aabner' || tilst.fase === 'udbrud';

// ── Trin for trin ──────────────────────────────────────
const aktivtTrin = () => modus === 'trin' && trinvis ? type.trin[trinvis.nu] : null;

// Tal, som trinnenes tekster henter fra modellen
function tekstCtx(){
  const magma = { ...type.magma };
  return {
    magma, stam: type.stammagma, kammer: type.kammer, rhoKappe: M.RHO_KAPPE,
    gr: M.graenser(magma),
    fart: z => M.fart(M.punkt(z, magma), magma, type.u0)
  };
}

function gaaTilTrin(i, stille){
  if (!trinvis) return;
  if (stille !== true) trinvis.vis(i, true);
  const t = type.trin[trinvis.nu];
  stopFoelg();
  const styr = t.styr;
  if (styr?.start === 'hvile' && (tilst.fase !== 'hvile' || styr.overtryk !== undefined)){
    if (tilst.fase !== 'hvile') type.udbrud.nulstil();
    tilst.fase = 'hvile'; tilst.front = type.kammer.top; tilst.overtryk = styr.overtryk ?? tilst.overtryk;
  }
  if (styr?.start === 'udbrud' && !flyder()){
    tilst.fase = 'udbrud'; tilst.front = 0; tilst.overtryk = Math.max(styr.gulv ?? 0, 16);
  }
  if (styr?.start === 'udbrud' && tilst.fase === 'udbrud') tilst.overtryk = Math.max(tilst.overtryk, styr.gulv ?? 0);
  if (t.visning === 'snit' && t.lupe.z !== undefined && Math.abs(lupeZ - t.lupe.z) > 3) lupeZ = t.lupe.z;
  gemTilstand();
}

function saetModus(m){
  modus = m;
  const trin = m === 'trin';
  $('btn-frit').setAttribute('aria-pressed', !trin);
  $('btn-trin').setAttribute('aria-pressed', trin);
  document.body.dataset.modus = m;
  $('trin').hidden = !trin;
  $('knobs').hidden = trin;
  stopFoelg();
  tilst.magma.vand = trin ? type.magma.vand : +inpVand.value;
  if (trin){ trinvis.laas(); gaaTilTrin(trinvis.nu); }
  else { nulstilUdbrud(); gemTilstand(); }
}

// ── Hvad ser lupen? ────────────────────────────────────
const OMG_KLIPPE = { rho: M.RHO_KLIPPE, navn: 'klippen' };

function iLupen(z){
  const k = type.kammer;
  const iKanal = z < k.top;
  if (iKanal && z < tilst.front - 1e-6) return { slags: 'klippe', z, iKanal, P: M.tryk(z), rho: M.RHO_KLIPPE, omg: OMG_KLIPPE };
  const p = M.punkt(z, tilst.magma, iKanal ? 0 : tilst.overtryk);
  return { slags: 'magma', z, iKanal, p, P: p.P, magma: tilst.magma, omg: OMG_KLIPPE };
}

// Lupen i oversigten: i den nedsynkende plade, i smeltezonen eller i magmaet
function iOversigt(lu){
  const P = M.trykDyb(lu.d), stam = type.stammagma;
  const omg = { rho: M.RHO_KAPPE, navn: lu.slags === 'plade' ? 'asthenosfæren' : 'kappen' };
  if (lu.slags === 'plade') return { slags: 'plade', d: lu.d, P, rho: 3400, omg, magma: stam };
  const p = M.vedTryk(P, stam);
  return { slags: lu.slags, d: lu.d, P, p, magma: stam, omg };
}

// ── Mærkater på skyderne ───────────────────────────────
function merkater(){
  $('lbl-dybde').textContent = tal(lupeZ) + ' km';
  $('lbl-vand').firstChild.nodeValue = tal(+inpVand.value) + ' ';
}

// ── Instrumenter ───────────────────────────────────────
const RHO_SKALA = 3500;       // kg/m³ — massefyldebjælkens fulde bredde
let srTimer = 0;

function aflaes(l){
  const P = l.P;
  $('val-tryk').firstChild.nodeValue = (P < 10 ? tal(P, 1) : Math.round(P).toLocaleString('da-DK')) + ' ';
  const gange = P / M.P0;
  $('val-tryk-s').textContent = gange < 1.5 ? 'som lufttrykket ved jorden'
    : '≈ ' + sig(gange).replace(/ /g, ' ') + ' × lufttrykket ved jorden';
  $('bar-tryk').style.width = Math.min(100, P / 340 * 100) + '%';
  $('f-overtryk').textContent = l.d !== undefined ? '—' : Math.round(tilst.overtryk);

  const magma = l.magma || tilst.magma;
  $('f-magma').textContent = magma.navn;
  $('f-sio2').textContent = magma.SiO2;
  $('f-temp').textContent = magma.T.toLocaleString('da-DK');

  // massefylde og den klippe, der omgiver lupen
  const rho = (l.p ? l.p.rho : l.rho) / 1000;
  $('val-rho').firstChild.nodeValue = (rho >= 0.1 ? tal(rho, 2) : sig(rho)) + ' ';
  $('bar-rho').style.width = Math.min(100, rho * 1000 / RHO_SKALA * 100) + '%';
  $('mk-rho').style.left = $('mk-rho-lbl').style.left = l.omg.rho / RHO_SKALA * 100 + '%';
  $('mk-rho-lbl').textContent = l.omg.navn;
  $('val-rho-s').textContent = l.slags === 'klippe' ? 'fast bjergart'
    : l.slags === 'plade' ? 'tungere end asthenosfæren'
    : (rho * 1000 < l.omg.rho ? 'lettere end ' : 'tungere end ') + l.omg.navn + ' omkring';
  $('bar-rho').style.background = l.p ? '' : '#8E8984';

  const vm = tilst.magma.vandMaks;
  if (!l.p){
    for (const id of ['val-vand', 'val-gas']){ $(id).firstChild.nodeValue = '— '; $(id).querySelector('.enhed').hidden = true; }
    $('val-vand-s').textContent = l.slags === 'plade' ? 'vandet er bundet i mineralerne' : 'ingen magma her';
    $('val-gas-s').textContent = 'ingen magma her';
    $('bar-oploest').style.width = $('bar-frigjort').style.width = $('bar-gas').style.width = '0';
    $('mk-maks').style.opacity = 0;
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

    if (l.d !== undefined) $('f-fart').textContent = '—';
    else if (l.iKanal && flyder()){
      const u = M.fart(p, magma, type.u0);
      $('f-fart').textContent = u < 10 ? tal(u) : Math.round(u).toLocaleString('da-DK');
    } else $('f-fart').textContent = '≈ 0';
  }

  if (performance.now() > srTimer){
    srTimer = performance.now() + 2500;
    const t = L.tekst(l, magma), trin = aktivtTrin();
    const hvor = l.d !== undefined ? `ca. ${l.d} km nede` : `${tal(l.z)} km under krateret`;
    let s = (trin ? `Trin ${trinvis.nu + 1}: ${trin.titel}. ` : FASENAVN[tilst.fase] + '. ')
          + `Lupen er ${hvor}, trykket er ${Math.round(P)} megapascal. ${t.titel}.`;
    if (l.p) s += ` ${tal(l.p.oploest)} vægtprocent vand er opløst, gasboblerne fylder ${Math.round(l.p.gasandel * 100)} procent af rumfanget.`;
    $('sr-status').textContent = s;
  }
}

// ── Løkken ─────────────────────────────────────────────
function billede(nu){
  const dt = Math.min(0.05, (nu - sidst) / 1000 || 0);
  sidst = nu;
  const trin = aktivtTrin();
  tilst.magma.vand = trin ? type.magma.vand : +inpVand.value;
  const gr = M.graenser(tilst.magma);

  if (trin && trin.visning === 'oversigt'){
    // Oversigten over subduktionszonen
    if (koerer) type.oversigt.opdater(dt, trin.fokus);
    const l = iOversigt(trin.lupe);
    if (koerer && l.slags === 'magma') L.stroem(0.04 * dt);
    cs.clearRect(0, 0, S.W, S.H);
    type.oversigt.tegn(cs, trin.fokus, trin.lupe);
    L.tegn(cl, l, l.magma || tilst.magma, 'ca. ' + trin.lupe.d + ' km nede');
    aflaes(l);
    $('fase').textContent = 'Subduktionszonen';
    requestAnimationFrame(billede);
    return;
  }

  if (koerer){
    forloeb(dt);
    S.opdater(dt, type, tilst);
    type.udbrud.opdater(dt, S.geometri(type, tilst), tilst);
  }

  // I "trin for trin" glider lupen hen, hvor trinnet vil have den
  if (trin) lupeZ += (trin.lupe.z - lupeZ) * Math.min(1, 4 * dt);

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
$('btn-frit').addEventListener('click', () => { if (modus !== 'frit') saetModus('frit'); });
$('btn-trin').addEventListener('click', () => { if (modus !== 'trin') saetModus('trin'); });

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

// Nulstil: alt tilbage, som da siden blev åbnet — i "trin for trin" til trin 1
$('btn-nulstil').addEventListener('click', () => {
  vaelgType(type.id);
  lupeZ = 7; inpDybde.value = lupeZ;
  if (!koerer && !roligt) skiftPause();
  merkater();
  if (modus === 'trin'){ trinvis.laas(); gaaTilTrin(0); } else gemTilstand();
});

// Træk i tværsnittet for at flytte lupen op og ned (ikke i "trin for trin")
let traekker = false;
function flytLupe(e){
  const r = snit.getBoundingClientRect();
  const z = S.zY((e.clientY - r.top) * S.H / r.height);
  lupeZ = Math.round(Math.max(0, Math.min(S.Z_MAKS, z)) * 10) / 10;
  inpDybde.value = lupeZ;
  stopFoelg(); merkater(); gemTilstand();
}
snit.addEventListener('pointerdown', e => {
  if (modus === 'trin') return;
  traekker = true; snit.setPointerCapture(e.pointerId); flytLupe(e);
});
snit.addEventListener('pointermove', e => { if (traekker) flytLupe(e); });
snit.addEventListener('pointerup', () => { traekker = false; });
snit.addEventListener('pointercancel', () => { traekker = false; });

// Tastatur i "trin for trin": piletaster, Home og End
document.addEventListener('keydown', e => {
  if (modus !== 'trin' || e.target.closest('input, textarea, select')) return;
  const n = trinvis.nu;
  if (e.key === 'ArrowRight' || e.key === 'PageDown') trinvis.vis(n + 1);
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') trinvis.vis(n - 1);
  else if (e.key === 'Home') trinvis.vis(0);
  else if (e.key === 'End') trinvis.vis(type.trin.length - 1);
  else return;
  e.preventDefault();
});

// Projektortilstand: sidens krom ryger væk, aflæsningerne skaleres op
const btnProjektor = $('btn-projektor');
function saetProjektor(til){
  document.body.setAttribute('data-projektor', til ? '1' : '0');
  btnProjektor.setAttribute('aria-pressed', til ? 'true' : 'false');
  if (modus === 'trin') requestAnimationFrame(() => trinvis.laas());
}
btnProjektor.addEventListener('click', () =>
  saetProjektor(document.body.getAttribute('data-projektor') !== '1'));

// Trinpanelet måles igen, når bredden eller skrifterne ændrer sig
let laasTimer = 0;
addEventListener('resize', () => {
  clearTimeout(laasTimer);
  laasTimer = setTimeout(() => { if (modus === 'trin') trinvis.laas(); }, 150);
});
if (document.fonts) document.fonts.ready.then(() => { if (modus === 'trin') trinvis.laas(); });

// ── Deling: tilstanden ligger i adressen ───────────────
let hashTimer = 0, hashSidste = '';
const tilstandStreng = () => modus === 'trin'
  ? '#type=' + type.id + '&trin=' + (trinvis.nu + 1)
  : '#type=' + type.id + '&vand=' + (+inpVand.value).toFixed(1) + '&dybde=' + lupeZ.toFixed(1);
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
  const vand = parseFloat(p.get('vand')), dybde = parseFloat(p.get('dybde')), trin = parseInt(p.get('trin'), 10);
  vaelgType(p.get('type') || VULKANER[0].id);
  if (isFinite(vand)) inpVand.value = Math.max(+inpVand.min, Math.min(+inpVand.max, vand));
  if (isFinite(dybde)) inpDybde.value = Math.max(0, Math.min(S.Z_MAKS, dybde));
  lupeZ = +inpDybde.value;
  if (trinvis && isFinite(trin)){
    trinvis.vis(trin - 1, true);
    saetModus('trin');
  }
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
