/* side.js — binder skydere, kassen, graferne og instrumenterne sammen,
   og lader tiden løbe, når man trykker ▶ Kør tiden. */

import * as M from './model.js';
import * as K from './kasse.js';
import * as G from './graf.js';

const $ = id => document.getElementById(id);
const W = 800, H = 400;

const kanvas = $('sim');
const c = kanvas.getContext('2d');

const ind = {
  pris: $('inp-pris'), teknologi: $('inp-tek'), efterforskning: $('inp-efter'),
  vaekst: $('inp-vaekst'), genanv: $('inp-genanv'),
};
const btnKoer = $('btn-koer'), btnMarked = $('btn-marked');

const tal = (v, n = 0) => v.toLocaleString('da-DK', { minimumFractionDigits: n, maximumFractionDigits: n });

let s = M.nyTilstand();
let koerer = false, akk = 0, sidst = 0;
const AAR_PR_SEK = 4;

// ── Skarpt billede på skærme med høj pixeltæthed ───────
function tilpasKanvas(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  kanvas.width = Math.round(W * dpr);
  kanvas.height = Math.round(H * dpr);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  tegn();
}

function param(){
  return {
    pris: +ind.pris.value, teknologi: +ind.teknologi.value,
    efterforskning: +ind.efterforskning.value,
    vaekst: +ind.vaekst.value, genanv: +ind.genanv.value,
  };
}

// ── Tegning ────────────────────────────────────────────
function tegn(){
  const p = param(), a = M.aflaes(s, p);
  c.clearRect(0, 0, W, H);
  c.fillStyle = '#FFF9EE';
  c.fillRect(0, 0, W, H);
  K.tegn(c, a);
  G.tegn(c, s.historik, a);
  instrumenter(a, p);
  etiketter(p);
  skaermlaeser(a);
}

function etiketter(p){
  $('lbl-pris').textContent = tal(p.pris) + ' USD/t';
  $('lbl-tek').textContent = p.teknologi ? 'omk. −' + p.teknologi + ' %' : '0 %';
  $('lbl-efter').textContent = tal(p.efterforskning, 1) + ' %/år';
  $('lbl-vaekst').textContent = tal(p.vaekst, 1) + ' %/år';
  $('lbl-genanv').textContent = p.genanv + ' %';
}

function instrumenter(a, p){
  $('val-reserve').innerHTML = tal(a.reserve) + '<small>mio. t</small>';
  $('anim-reserve').style.width = Math.min(100, a.reserve / 2500 * 100) + '%';

  const rp = isFinite(a.rp) ? a.rp : 999;
  $('val-rp').innerHTML = (rp >= 999 ? '∞' : tal(rp)) + '<small>år</small>';
  $('anim-rp').style.strokeDashoffset = 91.1 * (1 - Math.min(1, rp / 100));

  $('val-prod').innerHTML = tal(a.produktion, 1) + '<small>mio. t/år</small>';
  const skala = Math.max(50, a.primaer * 1.1);
  $('anim-prod').style.width = (a.produktion / skala * 100) + '%';
  $('anim-mangel').style.left = (a.produktion / skala * 100) + '%';
  $('anim-mangel').style.width = (a.mangel / skala * 100) + '%';
  $('note-prod').textContent = a.mangel > 0.05 ? 'Udvinding · mangel!' : 'Udvinding';
  $('note-prod').classList.toggle('mangel', a.mangel > 0.05);

  $('val-aar').innerHTML = 'År ' + a.aar;
  $('anim-aar').style.width = (a.aar / M.AAR_MAKS * 100) + '%';
}

// ── Skærmlæser: et resumé, når tingene har stået stille et øjeblik ──
let srTimer = 0, srTekst = '';
function skaermlaeser(a){
  const t = 'År ' + a.aar + '. Reserve ' + tal(a.reserve) + ' millioner ton. '
    + 'R/P-forhold ' + (isFinite(a.rp) ? tal(a.rp) + ' år' : 'uendeligt') + '. '
    + (a.mangel > 0.05 ? 'Mangel på ' + tal(a.mangel, 1) + ' millioner ton om året.' : 'Behovet er dækket.');
  if (t === srTekst) return;
  srTekst = t;
  clearTimeout(srTimer);
  srTimer = setTimeout(() => { $('sr-status').textContent = t; }, koerer ? 2500 : 700);
}

// ── Tiden ──────────────────────────────────────────────
function etAar(){
  const p = param();
  if (btnMarked.getAttribute('aria-pressed') === 'true'){
    ind.pris.value = Math.round(M.markedspris(s, p, +ind.pris.min, +ind.pris.max) / +ind.pris.step) * +ind.pris.step;
  }
  M.etAar(s, param());
}

function start(){
  if (s.aar >= M.AAR_MAKS) nulstil();
  koerer = true; akk = 0; sidst = performance.now();
  btnKoer.textContent = '⏸ Pause';
  btnKoer.setAttribute('aria-pressed', 'true');
  requestAnimationFrame(loekke);
}
function stop(){
  koerer = false;
  btnKoer.textContent = s.aar >= M.AAR_MAKS ? '↺ Igen' : '▶ Kør tiden';
  btnKoer.setAttribute('aria-pressed', 'false');
}
function loekke(nu){
  if (!koerer) return;
  akk += Math.min(0.25, (nu - sidst) / 1000) * AAR_PR_SEK;
  sidst = nu;
  let skete = false;
  while (akk >= 1 && s.aar < M.AAR_MAKS){ etAar(); akk -= 1; skete = true; }
  if (skete) tegn();
  if (s.aar >= M.AAR_MAKS){ stop(); return; }
  requestAnimationFrame(loekke);
}
function nulstil(){
  s = M.nyTilstand();
  if (btnMarked.getAttribute('aria-pressed') === 'true') ind.pris.value = M.STANDARD.pris;
  stop();
  tegn();
}

btnKoer.addEventListener('click', () => koerer ? stop() : start());
$('btn-et-aar').addEventListener('click', () => {
  if (koerer) stop();
  if (s.aar < M.AAR_MAKS){ etAar(); tegn(); }
  stop();
});
$('btn-nulstil').addEventListener('click', nulstil);
btnMarked.addEventListener('click', () => {
  const til = btnMarked.getAttribute('aria-pressed') !== 'true';
  btnMarked.setAttribute('aria-pressed', til ? 'true' : 'false');
  gemTilstand();
});
for (const el of Object.values(ind)){
  el.addEventListener('input', () => { tegn(); gemTilstand(); });
}

// ── Deling: skydernes stilling ligger i adressen ───────
const NOEGLER = { p: 'pris', t: 'teknologi', e: 'efterforskning', v: 'vaekst', g: 'genanv' };
let hashTimer = 0;
function tilstandStreng(){
  return '#' + Object.entries(NOEGLER).map(([k, n]) => k + '=' + ind[n].value).join('&')
       + (btnMarked.getAttribute('aria-pressed') === 'true' ? '&m=1' : '');
}
function gemTilstand(){
  clearTimeout(hashTimer);
  hashTimer = setTimeout(() => {
    const h = tilstandStreng();
    if (location.hash !== h) history.replaceState(null, '', h);
  }, 400);
}
function laesTilstand(){
  const q = new URLSearchParams(location.search);
  new URLSearchParams(location.hash.replace(/^#/, '')).forEach((v, k) => q.set(k, v));
  for (const [k, n] of Object.entries(NOEGLER)){
    const v = parseFloat(q.get(k));
    if (isFinite(v)) ind[n].value = Math.max(+ind[n].min, Math.min(+ind[n].max, v));
  }
  if (q.get('m') === '1') btnMarked.setAttribute('aria-pressed', 'true');
}

// ── Projektor og fuld skærm ────────────────────────────
const btnProjektor = $('btn-projektor');
function saetProjektor(til){
  document.body.setAttribute('data-projektor', til ? '1' : '0');
  btnProjektor.setAttribute('aria-pressed', til ? 'true' : 'false');
}
btnProjektor.addEventListener('click', () => saetProjektor(document.body.getAttribute('data-projektor') !== '1'));
if (/mode=teach|projektor=1/.test(location.search)) saetProjektor(true);

const btnFuld = $('btn-fuld');
if (document.fullscreenEnabled){
  btnFuld.hidden = false;
  btnFuld.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  });
  document.addEventListener('fullscreenchange', () => {
    const til = !!document.fullscreenElement;
    btnFuld.setAttribute('aria-pressed', til ? 'true' : 'false');
    btnFuld.textContent = til ? '⤡ Luk fuld skærm' : '⤢ Fuld skærm';
  });
}

// ── Start ──────────────────────────────────────────────
laesTilstand();
tilpasKanvas();
window.addEventListener('resize', tilpasKanvas);
if (document.fonts) document.fonts.ready.then(tegn);
