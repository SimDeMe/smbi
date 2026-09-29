/* side.js — binder knapper, skydere, instrumenter og de to figurer
   sammen og holder billedet i gang.

   Grænsetyperne står i graenser.js. Hver type bestemmer selv sine
   skydere (tid, fart og evt. hældning), sine instrumenter og sine to
   figurer; her bygges panelet ud fra det.

   Tiden løber, når man trykker Afspil, og står stille ved sidste
   tidspunkt. Jordskælvene kommer kun, mens tiden løber. */

import * as F from './figur.js';
import { GRAENSER } from './graenser.js';

const $ = id => document.getElementById(id);
const snit = $('snit'), cs = snit.getContext('2d');
const kort = $('kort'), ck = kort.getContext('2d');
const roligt = matchMedia('(prefers-reduced-motion:reduce)').matches;

let type = GRAENSER[0];
const tilst = { t: 0, v: 1, e: {}, X: 0, skaelv: [] };
let spiller = false, sidst = 0, tilSkaelv = 0;

// ── Skarpt billede på skærme med høj pixeltæthed ───────
function tilpasKanvas(){
  const dpr = Math.min(devicePixelRatio || 1, 2);
  for (const [k, c, w, h] of [[snit, cs, F.W, F.H], [kort, ck, F.KW, F.KH]]){
    k.width = Math.round(w * dpr); k.height = Math.round(h * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}
tilpasKanvas();
addEventListener('resize', tilpasKanvas);

const format = (v, n) => {
  if (v === null || v === undefined || !isFinite(v)) return '—';
  if (n < 0){ const f = 10 ** -n; return (Math.round(v / f) * f).toLocaleString('da-DK'); }
  return v.toLocaleString('da-DK', { minimumFractionDigits: n, maximumFractionDigits: n });
};
const tidTekst = t => format(t, type.tid.skridt < 1 ? 1 : 0);

// ── Skyderne ───────────────────────────────────────────
/* Hver skyder: { id, navn, min, maks, skridt, start, enhed, farve }.
   Tid og fart har alle typer; målepunktet og hældningen kun nogle. */
let skydere = [];
function bygSkydere(){
  const boks = $('knobs');
  boks.textContent = '';
  skydere = [
    { id: 'tid', navn: 'Tid siden start', ...type.tid, enhed: type.tid.enhed, min: 0,
      track: 'linear-gradient(90deg,#FFF3DC,#FFB300)', kc: 'var(--amber)' },
    { id: 'fart', navn: type.fart.navn, ...type.fart, enhed: 'cm/år',
      track: 'linear-gradient(90deg,#FFFFFF,#0E86C8)', kc: 'var(--blue)' },
    ...(type.ekstra || []).map(e => ({ ...e, track: 'linear-gradient(90deg,#FFFFFF,#8A988A)', kc: 'var(--teal)' })),
    ...(type.maal ? [{ id: 'maal', navn: 'Målepunkt · km fra grænsen', min: Math.ceil(F.kX(60)), maks: Math.floor(F.X_MAKS - 10),
      skridt: 5, start: type.maal.start, enhed: 'km', track: 'linear-gradient(90deg,#E2D6F8,#7A4FD6)', kc: 'var(--grape)' }] : [])
  ];
  for (const s of skydere){
    const lbl = document.createElement('label');
    lbl.className = 'knob'; lbl.htmlFor = 'inp-' + s.id;
    lbl.innerHTML = `<span class="knob-top"><span class="mono">${s.navn}</span><span class="knob-val" id="lbl-${s.id}"><span></span> <span class="enhed">${s.enhed}</span></span></span>
<input type="range" id="inp-${s.id}" min="${s.min}" max="${s.maks}" step="${s.skridt}" value="${s.start}">`;
    const inp = lbl.querySelector('input');
    inp.style.setProperty('--track', s.track); inp.style.setProperty('--kc', s.kc);
    inp.addEventListener('input', () => {
      laesSkydere();
      if (s.id === 'tid' && spiller) saetSpil(false);
      gemTilstand();
    });
    s.inp = inp;
    boks.appendChild(lbl);
  }
  boks.style.setProperty('--n', skydere.length);
}
function laesSkydere(){
  for (const s of skydere){
    const v = +s.inp.value;
    if (s.id === 'tid') tilst.t = v;
    else if (s.id === 'fart') tilst.v = v;
    else if (s.id === 'maal') tilst.X = v;
    else tilst.e[s.id] = v;
    $('lbl-' + s.id).firstChild.textContent = s.id === 'tid' ? tidTekst(v) : format(v, s.skridt < 1 ? 1 : 0);
  }
}
const skyder = id => skydere.find(s => s.id === id);

// ── Instrumenterne ─────────────────────────────────────
const LYS = ['#E7F4FB', '#F1ECFC', '#EDF8E4', '#FFF1EC'];
function bygInstrumenter(){
  const dl = $('gauges');
  dl.textContent = '';
  type.aflaes(tilst).forEach((g, i) => {
    const d = document.createElement('div');
    d.className = 'gauge'; d.style.background = LYS[i % 4];
    d.innerHTML = `<dt></dt><div class="g-viz"><div class="bar-h"><i></i><span class="mark" hidden></span><span class="mark-lbl mark-lbl-v" hidden></span></div></div>
<dd><span class="v"></span> <span class="enhed"></span><small></small></dd>`;
    dl.appendChild(d);
  });
}
function aflaes(){
  const liste = type.aflaes(tilst);
  [...$('gauges').children].forEach((d, i) => {
    const g = liste[i];
    d.querySelector('dt').textContent = g.navn;
    d.querySelector('.v').textContent = format(g.tal, g.n);
    const enh = d.querySelector('dd .enhed');
    enh.textContent = g.enhed; enh.hidden = g.tal === null || g.tal === undefined;
    d.querySelector('small').textContent = g.lille;
    const bar = d.querySelector('.bar-h i');
    bar.style.width = Math.max(0, Math.min(100, g.andel * 100)) + '%';
    bar.style.background = g.farve;
    const mk = d.querySelector('.mark'), ml = d.querySelector('.mark-lbl');
    mk.hidden = ml.hidden = !g.maerke;
    if (g.maerke){
      mk.style.left = ml.style.left = Math.min(100, g.maerke.andel * 100) + '%';
      ml.textContent = g.maerke.tekst;
      ml.classList.toggle('mark-lbl-v', g.maerke.andel > 0.5);
    }
  });
  return liste;
}

// ── Fakta-foden ────────────────────────────────────────
function fakta(){
  const boks = $('facts');
  const pille = ([tekst, link, linkTekst]) => `<span class="fact" style="--fc:var(--accent)">${tekst}${link ? ` · <a href="${link}">${linkTekst} →</a>` : ''}</span>`;
  const skaelv = F.SKAELV.map((k, i) => `<span class="fact skaelv s${i}" style="--fc:${k.farve}">${k.navn.replace(/(\d+(–\d+)?) km/, '$1 <span class="enhed">km</span>')}</span>`).join('');
  boks.innerHTML = type.fakta(tilst).map(pille).join('') + '<span class="facts-skaelv"><span class="mono">Jordskælv</span>' + skaelv + '</span>';
}

// ── Grænsetype ─────────────────────────────────────────
function vaelgType(id){
  type = GRAENSER.find(g => g.id === id) || GRAENSER[0];
  type.ryd();
  tilst.skaelv.length = 0;
  tilst.e = {};
  bygSkydere(); laesSkydere(); bygInstrumenter(); fakta();
  document.querySelectorAll('#typer button').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === type.id));
  $('type-navn').textContent = type.gruppe;
  snit.setAttribute('aria-label', type.beskrivelse);
  kort.setAttribute('aria-label', type.kortTekst);
  snit.style.cursor = type.maal ? 'ew-resize' : 'default';
}

(function bygTyper(){
  const boks = $('typer');
  for (const g of GRAENSER){
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn-mini'; b.dataset.id = g.id;
    b.textContent = g.navn; b.title = g.kort + ' — fx ' + g.eksempler;
    b.addEventListener('click', () => {
      if (g.id === type.id) return;
      vaelgType(g.id);
      saetSpil(!roligt);
      gemTilstand();
    });
    boks.appendChild(b);
  }
})();

// ── Afspil og pause ────────────────────────────────────
const btnSpil = $('btn-spil');
function saetSpil(til){
  // Står tiden for enden, starter Afspil forfra
  if (til && tilst.t >= type.tid.maks - 1e-9){ skyder('tid').inp.value = 0; laesSkydere(); type.ryd(); }
  spiller = til;
  btnSpil.setAttribute('aria-pressed', til ? 'true' : 'false');
  btnSpil.textContent = til ? 'Pause' : 'Afspil';
  $('fase').textContent = til ? 'Tiden løber' : 'Tiden står stille';
}
btnSpil.addEventListener('click', () => saetSpil(!spiller));

$('btn-nulstil').addEventListener('click', () => { vaelgType(type.id); saetSpil(!roligt); gemTilstand(); });

// ── Løkken ─────────────────────────────────────────────
let srTimer = 0, srBesked = '';
function billede(nu){
  const dt = Math.min(0.05, (nu - sidst) / 1000 || 0);
  sidst = nu;

  if (spiller){
    const tid = skyder('tid');
    let t = tilst.t + type.tid.tempo * dt;
    if (t >= type.tid.maks){ t = type.tid.maks; saetSpil(false); }
    tid.inp.value = t;
    tilst.t = t;
    $('lbl-tid').firstChild.textContent = tidTekst(t);
    type.opdater(dt, tilst);

    tilSkaelv -= dt * type.skaelvRate;
    while (tilSkaelv <= 0){
      tilSkaelv += -Math.log(1 - Math.random() * 0.999);   // tilfældige mellemrum
      const s = type.skaelv(tilst);
      if (s) tilst.skaelv.push({ ...s, alder: 0 });
    }
    for (const s of tilst.skaelv) s.alder += dt;
    for (let i = tilst.skaelv.length - 1; i >= 0; i--) if (tilst.skaelv[i].alder > F.SKAELV_LEVETID) tilst.skaelv.splice(i, 1);
    gemTilstand();
  }

  // Et stort jordskælv: mange skælv langs forkastningen på én gang
  const h = type.haendelse ? type.haendelse(tilst) : null;
  if (h && spiller){
    for (let i = 0; i < 16; i++){ const s = type.skaelv(tilst); tilst.skaelv.push({ ...s, alder: i * 0.02, stort: i === 0 }); }
    $('rig').classList.remove('ryst'); void $('rig').offsetWidth; $('rig').classList.add('ryst');
    srBesked = h.tekst; srTimer = 0;
  }

  cs.clearRect(0, 0, F.W, F.H);
  type.tegnSnit(cs, tilst);
  ck.clearRect(0, 0, F.KW, F.KH);
  type.tegnKort(ck, tilst);
  const liste = aflaes();

  if (performance.now() > srTimer){
    srTimer = performance.now() + 3000;
    const tal = liste.map(g => `${g.navn}: ${format(g.tal, g.n)} ${g.tal == null ? '' : g.enhed}`).join('. ');
    $('sr-status').textContent = (srBesked ? srBesked + ' ' : '') + `${type.navn}, ${tidTekst(tilst.t)} ${type.tid.enhed}. ${tal}.`;
    srBesked = '';
  }
  requestAnimationFrame(billede);
}

// ── Træk målepunktet i tværsnittet ─────────────────────
let traekker = false;
function flytMaal(e){
  const r = snit.getBoundingClientRect();
  const X = F.kX((e.clientX - r.left) * F.W / r.width);
  const s = skyder('maal');
  s.inp.value = Math.max(s.min, Math.min(s.maks, Math.round(X / 5) * 5));
  laesSkydere(); gemTilstand();
}
snit.addEventListener('pointerdown', e => {
  if (!type.maal) return;
  traekker = true; snit.setPointerCapture(e.pointerId); flytMaal(e);
});
snit.addEventListener('pointermove', e => { if (traekker) flytMaal(e); });
snit.addEventListener('pointerup', () => { traekker = false; });
snit.addEventListener('pointercancel', () => { traekker = false; });

// ── Projektortilstand ──────────────────────────────────
const btnProjektor = $('btn-projektor');
function saetProjektor(til){
  document.body.setAttribute('data-projektor', til ? '1' : '0');
  btnProjektor.setAttribute('aria-pressed', til ? 'true' : 'false');
}
btnProjektor.addEventListener('click', () => saetProjektor(document.body.getAttribute('data-projektor') !== '1'));

// ── Deling: tilstanden ligger i adressen ───────────────
let hashTimer = 0, hashSidste = '';
function tilstandStreng(){
  const p = ['type=' + type.id];
  for (const s of skydere) p.push(s.id + '=' + (+s.inp.value).toFixed(s.skridt < 1 ? 1 : 0));
  return '#' + p.join('&');
}
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
  vaelgType(p.get('type') || GRAENSER[0].id);
  for (const s of skydere){
    const v = parseFloat(p.get(s.id));
    if (isFinite(v)) s.inp.value = Math.max(s.min, Math.min(s.maks, v));
  }
  laesSkydere();
  hashSidste = tilstandStreng();
  // Kommer man med en bestemt tid i adressen, står billedet stille dér
  return p.has('tid');
}

// ── Start ──────────────────────────────────────────────
const fastTid = laesTilstand();
saetSpil(!roligt && !fastTid);
if (/mode=teach|projektor=1/.test(location.search)) saetProjektor(true);

const scene = document.querySelector('.fig-rul');
requestAnimationFrame(() => {
  if (scene && scene.scrollWidth > scene.clientWidth) scene.scrollLeft = (scene.scrollWidth - scene.clientWidth) * F.XC / F.W;
});
requestAnimationFrame(billede);
