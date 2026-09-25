/* ═══════════════════════════════════════════════════════════
   side.js — indgangen: binder lærred, knapper, skydere og
   opgaver sammen og kører tegneløkken.
   ═══════════════════════════════════════════════════════════ */
import {W, H, CX, CY, tegnLandskab, tegnLandemaerker, maerkeVed, forskel} from './landskab.js';
import {tegnKompas, tegnSigtelinje, opdaterNaal, nyNaal, afvigelse, ramt, TOL_I_HUS} from './kompas.js';
import {OPGAVER} from './opgaver.js';

const $ = id => document.getElementById(id);
const canvas = $('kompasCanvas');
const ctx = canvas.getContext('2d');
const stage = $('stage');
const inpHus = $('inp-hus'), inpRetning = $('inp-retning');
const reduceMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ── Tilstand ─────────────────────────────────────────── */
const t = {B:0, H:0};             // se kompas.js
const naal = nyNaal();
let tilstand = 'fri';             // 'fri' | 'opgaver'
let navne = false;
let rørt = false;                 // indtil da pulserer ringen for at vise, at den kan drejes

const norm = v => ((Math.round(v) % 360) + 360) % 360;
const grad = v => norm(v) + '°';

const HJOERNER = ['nord', 'nordøst', 'øst', 'sydøst', 'syd', 'sydvest', 'vest', 'nordvest'];
function hjoerne(v){
  const i = Math.round(norm(v) / 45) % 8;
  const d = Math.abs(forskel(v, i * 45));
  return d < 0.5 ? HJOERNER[i].replace(/^./, c => c.toUpperCase())
                 : 'Mellem ' + HJOERNER[Math.floor(norm(v) / 45) % 8] + ' og ' + HJOERNER[(Math.floor(norm(v) / 45) + 1) % 8];
}

/* skarp optegning på skærme med høj pixeltæthed */
function fitCanvas(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fitCanvas();
addEventListener('resize', fitCanvas);

/* ── Træk med mus/finger ──────────────────────────────── */
let træk = null;                  // {del:'hus'|'dig', sidst, raa}

function kortPunkt(e){
  const r = canvas.getBoundingClientRect();
  return {x:(e.clientX - r.left) * W / r.width, y:(e.clientY - r.top) * H / r.height};
}
const pejling = p => Math.atan2(p.x - CX, CY - p.y) * 180 / Math.PI;

canvas.addEventListener('pointerdown', e => {
  const p = kortPunkt(e);
  const del = ramt(p.x, p.y, CX, CY, t) === 'hus' ? 'hus' : 'dig';
  træk = {del, sidst:pejling(p), raa: del === 'hus' ? t.H : t.B};
  rørt = true;
  canvas.classList.add('dragging');
  canvas.setPointerCapture?.(e.pointerId);
  e.preventDefault();
});
canvas.addEventListener('pointermove', e => {
  const p = kortPunkt(e);
  if (!træk){
    canvas.classList.toggle('hus', ramt(p.x, p.y, CX, CY, t) === 'hus');
    return;
  }
  if (Math.hypot(p.x - CX, p.y - CY) < 14) return;     // lige over midten er vinklen ustabil
  const a = pejling(p);
  const d = forskel(a, træk.sidst);
  træk.sidst = a;
  if (træk.del === 'hus'){ træk.raa -= d; t.H = norm(træk.raa); }
  else { træk.raa += d; t.B = ((træk.raa % 360) + 360) % 360; }
  e.preventDefault();
});
function slip(){ træk = null; canvas.classList.remove('dragging'); }
canvas.addEventListener('pointerup', slip);
canvas.addEventListener('pointercancel', slip);
addEventListener('blur', slip);

/* ── Tastatur og skydere ──────────────────────────────── */
stage.addEventListener('keydown', e => {
  const s = e.shiftKey ? 10 : 1;
  if (e.key === 'ArrowLeft') t.B = norm(t.B - s);
  else if (e.key === 'ArrowRight') t.B = norm(t.B + s);
  else if (e.key === 'ArrowUp') t.H = norm(t.H + s);
  else if (e.key === 'ArrowDown') t.H = norm(t.H - s);
  else return;
  rørt = true;
  e.preventDefault();
});
inpHus.addEventListener('input', () => { t.H = +inpHus.value; rørt = true; });
inpRetning.addEventListener('input', () => { t.B = +inpRetning.value; rørt = true; });

/* ── Knapper i panelets hoved ─────────────────────────── */
const btnNavne = $('btn-navne');
btnNavne.addEventListener('click', () => {
  navne = !navne;
  btnNavne.setAttribute('aria-pressed', String(navne));
});

const btnProjektor = $('btn-projektor');
function saetProjektor(til){
  document.body.setAttribute('data-projektor', til ? '1' : '0');
  btnProjektor.setAttribute('aria-pressed', String(til));
  laasOpgaveHoejde();
}
btnProjektor.addEventListener('click', () => saetProjektor(document.body.getAttribute('data-projektor') !== '1'));

$('btn-fri').addEventListener('click', () => saetTilstand('fri'));
$('btn-opgaver').addEventListener('click', () => saetTilstand('opgaver'));

/* ── Opgaver ──────────────────────────────────────────── */
const opg = $('opg'), opgTxt = $('opg-txt'), opgSvar = $('opg-svar'), opgFb = $('opg-fb');
const opgNr = $('opg-nr'), opgDots = $('opg-dots');
let nr = 0, valgt = null;
const loest = new Set();

OPGAVER.forEach((_, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = i + 1;
  b.addEventListener('click', () => visOpgave(i));
  opgDots.appendChild(b);
});

const NAVN = {kirke:'Kirken', moelle:'Møllen', hytte:'Skovhytten', mast:'Radiomasten', fyr:'Fyrtårnet', bro:'Broen'};

function svarHTML(o){
  if (o.svar === 'tal')
    return '<label for="opg-tal">Kurs</label><input id="opg-tal" type="text" inputmode="numeric" autocomplete="off" placeholder="0–359"><span class="hvordan">grader</span>';
  if (o.svar === 'valg')
    return o.valg.map(id => `<button type="button" class="valg" data-id="${id}" aria-pressed="false">${NAVN[id]}</button>`).join('');
  return '<span class="hvordan">Svar med kompasset — tryk så Tjek</span>';
}

function byggOpgave(i){
  const o = OPGAVER[i];
  opgNr.textContent = `Opgave ${i + 1} af ${OPGAVER.length}`;
  opgTxt.innerHTML = o.tekst;
  opgSvar.innerHTML = svarHTML(o);
  valgt = null;
  if (o.svar === 'tal')
    $('opg-tal').addEventListener('keydown', e => { if (e.key === 'Enter') tjek(); });
  opgSvar.querySelectorAll('.valg').forEach(b => b.addEventListener('click', () => {
    valgt = b.dataset.id;
    opgSvar.querySelectorAll('.valg').forEach(v => v.setAttribute('aria-pressed', String(v === b)));
  }));
}

function visOpgave(i){
  nr = Math.max(0, Math.min(OPGAVER.length - 1, i));
  const o = OPGAVER[nr];
  t.H = o.start.H; t.B = o.start.B;
  naal.phi = 0; naal.v = 0; naal.husVinkel = null;
  byggOpgave(nr);
  opgFb.innerHTML = ''; opgFb.className = 'opg-fb';
  opgDots.querySelectorAll('button').forEach((b, j) => {
    b.toggleAttribute('aria-current', false);
    if (j === nr) b.setAttribute('aria-current', 'step');
    b.classList.toggle('loest', loest.has(j));
    b.setAttribute('aria-label', `Opgave ${j + 1}${loest.has(j) ? ', løst' : ''}`);
  });
  $('opg-forrige').disabled = nr === 0;
  $('opg-naeste').disabled = nr === OPGAVER.length - 1;
  gemTilstand();
}

function tjek(){
  const o = OPGAVER[nr];
  let svar = null;
  if (o.svar === 'tal'){
    const v = parseFloat(($('opg-tal').value || '').replace(',', '.').replace(/[^\d.\-]/g, ''));
    svar = isFinite(v) ? v : null;
  } else if (o.svar === 'valg') svar = valgt;
  const r = o.tjek({B:t.B, H:t.H}, svar);
  opgFb.className = 'opg-fb ' + (r.ok ? 'ok' : 'nej');
  opgFb.innerHTML = `<span class="maerke">${r.ok ? 'Rigtigt' : 'Ikke endnu'}</span>${r.besked}`;
  if (r.ok){
    loest.add(nr);
    const b = opgDots.children[nr];
    b.classList.add('loest');
    b.setAttribute('aria-label', `Opgave ${nr + 1}, løst`);
  }
}
$('opg-tjek').addEventListener('click', tjek);
$('opg-forrige').addEventListener('click', () => visOpgave(nr - 1));
$('opg-naeste').addEventListener('click', () => visOpgave(nr + 1));

/* Rammen skal stå stille: opgavefeltet låses til den højeste opgave,
   så gradskive, instrumenter og skydere ikke hopper fra opgave til opgave. */
function laasOpgaveHoejde(){
  if (opg.hidden) return;
  /* Der måles på en usynlig kopi, så elevens svar i det rigtige felt får lov at stå. */
  const kopi = opg.cloneNode(true);
  kopi.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
  kopi.removeAttribute('id');
  kopi.style.cssText = `position:absolute;visibility:hidden;left:0;top:0;min-height:0;width:${opg.getBoundingClientRect().width}px`;
  kopi.setAttribute('aria-hidden', 'true');
  opg.parentNode.appendChild(kopi);
  const txt = kopi.querySelector('.opg-txt'), svar = kopi.querySelector('.opg-svar');
  let maks = 0;
  for (const o of OPGAVER){
    txt.innerHTML = o.tekst;
    svar.innerHTML = svarHTML(o);
    maks = Math.max(maks, kopi.getBoundingClientRect().height);
  }
  kopi.remove();
  opg.style.minHeight = Math.ceil(maks) + 'px';
}
addEventListener('resize', () => requestAnimationFrame(laasOpgaveHoejde));
if (document.fonts) document.fonts.ready.then(laasOpgaveHoejde);

function saetTilstand(ny, i = nr){
  tilstand = ny;
  $('btn-fri').setAttribute('aria-pressed', String(ny === 'fri'));
  $('btn-opgaver').setAttribute('aria-pressed', String(ny === 'opgaver'));
  opg.hidden = ny !== 'opgaver';
  document.body.dataset.tilstand = ny;
  if (ny === 'opgaver'){ visOpgave(i); laasOpgaveHoejde(); }
  else gemTilstand();
}

/* ── Instrumenter ─────────────────────────────────────── */
const el = {
  hus:$('val-hus'), husHj:$('val-hus-hj'),
  naal:$('val-naal'), naalHj:$('val-naal-hj'), gNaal:$('g-naal'),
  sigt:$('val-sigt'), sigtHj:$('val-sigt-hj'),
  lblHus:$('lbl-hus'), lblRetning:$('lbl-retning'),
};
let sidstUI = '';

function opdaterUI(){
  const dev = afvigelse(t);
  const skjult = tilstand === 'opgaver';
  const noegle = [norm(t.H), Math.round(t.B), Math.round(dev), skjult].join('|');
  if (noegle === sidstUI) return;
  sidstUI = noegle;

  el.hus.textContent = grad(t.H);
  el.husHj.textContent = hjoerne(t.H);

  const iHus = Math.abs(dev) <= TOL_I_HUS;
  el.gNaal.classList.toggle('ihus', iHus);
  if (iHus){
    el.naal.textContent = 'I hus ✓';
    el.naalHj.textContent = `Du går i kurs ${grad(t.H)}`;
  } else if (Math.abs(dev) >= 180 - TOL_I_HUS){
    el.naal.textContent = 'Omvendt!';
    el.naalHj.textContent = 'Den hvide ende ligger i pilen';
  } else {
    el.naal.innerHTML = Math.round(Math.abs(dev)) + '<small>° ved siden af</small>';
    el.naalHj.textContent = `Drej dig til ${dev > 0 ? 'venstre' : 'højre'}`;
  }

  if (skjult){
    el.sigt.textContent = '?';
    el.sigtHj.textContent = 'Skjult i opgaverne — brug kompasset';
    el.lblRetning.textContent = '—';
    inpRetning.setAttribute('aria-valuetext', 'skjult i opgaverne');
  } else {
    const m = maerkeVed(t.B, 3);
    el.sigt.textContent = grad(t.B);
    el.sigtHj.textContent = m ? m.navn : hjoerne(t.B);
    el.lblRetning.textContent = grad(t.B);
    inpRetning.setAttribute('aria-valuetext', grad(t.B));
  }
  el.lblHus.textContent = grad(t.H);
  inpHus.setAttribute('aria-valuetext', grad(t.H));
  if (+inpHus.value !== norm(t.H)) inpHus.value = norm(t.H);
  if (+inpRetning.value !== norm(t.B)) inpRetning.value = norm(t.B);

  planlaegStatus(dev, skjult);
  if (tilstand === 'fri') gemTilstand();
}

/* ── Skærmlæser-status ─────────────────────────────────
   Læses først op, når kompasset har stået stille i 700 ms. */
const elSr = $('sr-status');
let srTimer = 0;
function planlaegStatus(dev, skjult){
  clearTimeout(srTimer);
  srTimer = setTimeout(() => {
    let s = `Gradskiven viser ${norm(t.H)} grader. `;
    if (Math.abs(dev) <= TOL_I_HUS) s += 'Nålen ligger i orienteringspilen. ';
    else if (Math.abs(dev) >= 180 - TOL_I_HUS) s += 'Den hvide ende af nålen ligger i orienteringspilen. ';
    else s += `Nålen ligger ${Math.round(Math.abs(dev))} grader ved siden af orienteringspilen. Drej dig til ${dev > 0 ? 'venstre' : 'højre'}. `;
    if (!skjult){
      const m = maerkeVed(t.B, 3);
      s += `Kursepilen peger i kurs ${norm(t.B)} grader${m ? ', mod ' + m.navn.toLowerCase() : ''}.`;
    }
    elSr.textContent = s;
  }, 700);
}

/* ── Deling: tilstanden ligger i adressen ──────────────
   Frit: #hus=60&retning=0 — opgaver: #opgave=3.
   De samme nøgler virker som query (?opgave=3, ?mode=opgaver). */
let hashTimer = 0;
function gemTilstand(){
  const h = tilstand === 'opgaver' ? '#opgave=' + (nr + 1) : `#hus=${norm(t.H)}&retning=${norm(t.B)}`;
  clearTimeout(hashTimer);
  hashTimer = setTimeout(() => { if (location.hash !== h) history.replaceState(null, '', h); }, 400);
}

function laesTilstand(){
  const p = new URLSearchParams(location.search);
  new URLSearchParams(location.hash.replace(/^#/, '')).forEach((v, k) => p.set(k, v));
  if (/projektor=1|mode=teach/.test(location.search)) saetProjektor(true);
  const o = parseInt(p.get('opgave'), 10);
  if (isFinite(o) || p.get('mode') === 'opgaver'){
    saetTilstand('opgaver', isFinite(o) ? o - 1 : 0);
    rørt = true;
    return;
  }
  const hus = parseFloat(p.get('hus')), ret = parseFloat(p.get('retning'));
  if (isFinite(hus)){ t.H = norm(hus); rørt = true; }
  if (isFinite(ret)){ t.B = norm(ret); rørt = true; }
}

/* ── Løkke ─────────────────────────────────────────────── */
let sidst = performance.now();
function billede(nu){
  const dt = Math.max(0, Math.min(0.05, (nu - sidst) / 1000));
  sidst = nu;
  opdaterNaal(naal, t, dt, reduceMotion);

  ctx.clearRect(0, 0, W, H);
  tegnLandskab(ctx);
  tegnSigtelinje(ctx, CX, CY, t, W, H);
  tegnLandemaerker(ctx, maerkeVed(t.B, 3));
  const hint = rørt ? 0 : (reduceMotion ? 0.5 : 0.5 + 0.5 * Math.sin(nu / 260));
  tegnKompas(ctx, CX, CY, t, naal, {navne, hint});

  opdaterUI();
  requestAnimationFrame(billede);
}

laesTilstand();
requestAnimationFrame(billede);
