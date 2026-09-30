/* ═══════════════════════════════════════════════════════════
   side.js — indgangen.

   Binder oelbrygning.html sammen med stationerne: fanerne, uret,
   skyderne, instrumenterne, bryggejournalen, adressefeltet og
   projektortilstanden. Fagligheden står i brygning.js, figurerne i
   station-*.js og udstyr.js — her står kun betjeningen.

   Batchen er det, der flyder fra station til station. Går man
   tilbage til en tidligere station, brygges der videre derfra med
   det, stationerne før den gav — det, der kom efter, er glemt.
   ═══════════════════════════════════════════════════════════ */
import {STATIONER} from './stationer.js';
import {byggLaerred, komma} from './model.js';
import {tegnGraf} from './graf.js';

const el = id => document.getElementById(id);
const lærred = byggLaerred(el('scene'));

/* Enheder og græske bogstaver må ikke komme med i mono-mærkaternes
   versaler: α-amylase må ikke blive til «Α-AMYLASE». */
const beskyt = t => t.replace(/([αβ]|\b(?:mL|g\/L|kW|°C|°P|IBU|EBC|OG|FG|mio\.\/mL)\b|[A-Z][a-z]?[₀-₉]+[A-Za-z₀-₉]*)/g,
                              '<span class="enhed">$1</span>');

/* ── Tilstand ──────────────────────────────────────────── */
const vaerdier = {};
for(const s of STATIONER) vaerdier[s.id] = Object.fromEntries(s.knapper.map(k => [k.id, k.vaerdi]));

let batch = {};
let nr = 0, st = null;
let koerer = false, hurtig = false, rt = 0, proeveUr = 0;
const journal = [];
const station = () => STATIONER[nr];

/* ── Rækkerne under figuren ────────────────────────────── */
function byggRaekker(s, b){
  el('ligninger').innerHTML = s.ligninger.map(l => `
    <div class="lign" data-lign="${l.id}" style="--tone:${l.tone}">
      <span class="lign-top"><span class="mono">${beskyt(l.titel)}</span><span class="lign-stand">Hviler</span></span>
      <span class="lign-formel">${typeof l.html === 'function' ? (b.oel ? l.html(b) : '') : l.html}</span>
    </div>`).join('');

  el('gauges').innerHTML = s.maalere.map(m => `
    <div class="gauge ${m.klasse}">
      <dt>${beskyt(m.navn)}</dt>
      <div class="g-viz"><div class="col"><i data-bar="${m.id}" style="--cc:${m.cc}"></i></div></div>
      <dd><span data-tal="${m.id}">–</span><small data-enhed="${m.id}"></small></dd>
    </div>`).join('');

  let knobs = s.knapper.map(k => `
    <label class="knob" for="k-${k.id}">
      <span class="knob-top"><span class="mono">${beskyt(k.navn)}</span>
        <span class="knob-val"><span id="kv-${k.id}">${komma(vaerdier[s.id][k.id], k.decimaler ?? 0)}</span> ${k.enhed}</span></span>
      <input type="range" id="k-${k.id}" min="${k.min}" max="${k.max}" step="${k.step}" value="${vaerdier[s.id][k.id]}"
             style="--track:${k.track};--kc:${k.kc}" data-knap="${k.id}">
    </label>`).join('');
  knobs += (s.handlinger || []).map(h => `
    <div class="knob knob-knap">
      <span class="knob-top"><span class="mono">${h.navn}</span></span>
      <button type="button" class="btn" data-handling="${h.id}" title="${h.titel}">${h.navn}</button>
    </div>`).join('');
  if(s.id === 'smag'){
    knobs = `
      <div class="knob knob-knap"><span class="knob-top"><span class="mono">Samme urt, ny gær</span></span>
        <button type="button" class="btn" data-igen="2">Gær igen</button></div>
      <div class="knob knob-knap"><span class="knob-top"><span class="mono">Samme mæsk, ny humle</span></span>
        <button type="button" class="btn" data-igen="1">Kog igen</button></div>
      <div class="knob knob-knap"><span class="knob-top"><span class="mono">Helt forfra</span></span>
        <button type="button" class="btn" data-igen="0">Nyt bryg</button></div>`;
  }
  el('knobs').innerHTML = knobs;
  el('knobs').style.setProperty('--n', Math.max(2, el('knobs').children.length));

  el('facts').innerHTML = s.id === 'smag' ? opskriftPiller(b) : s.signatur;
}

function opskriftPiller(b){
  if(!b.maesk) return '';
  const r = b.oel;
  const humle = b.kog.humle.length
    ? b.kog.humle.map(h => `${h.g} g ved ${Math.floor(h.tid)} min`).join(', ')
    : 'ingen';
  return `
    <span class="fact">Mæsk <b>${b.maesk.temperaturer.join(' → ')}</b> <span class="enhed">°C</span> · ${Math.round(b.maesk.tid)} <span class="enhed">min</span></span>
    <span class="fact">Humle <b>${humle}</b></span>
    <span class="fact">Gæring <b>${b.gaering.temperaturer.join(' → ')}</b> <span class="enhed">°C</span> · ${komma(b.gaering.tid / 24, 1)} døgn</span>
    <span class="fact">Forgæring <b>${komma(r.forgaering * 100)} %</b></span>`;
}

/* ── Instrumenter og ligninger ─────────────────────────── */
function aflaes(){
  const s = station();
  const a = s.aflaes(st);
  for(const [id, v] of Object.entries(a)){
    const tal = document.querySelector(`[data-tal="${id}"]`);
    if(!tal) continue;
    tal.textContent = v.tal;
    document.querySelector(`[data-enhed="${id}"]`).textContent = v.enhed;
    document.querySelector(`[data-bar="${id}"]`).style.width = (Math.max(0, Math.min(1, v.andel)) * 100).toFixed(1) + '%';
  }
  const aktiv = s.aktiv(st);
  for(const felt of document.querySelectorAll('[data-lign]')){
    const k = s.tid ? (koerer && aktiv[felt.dataset.lign]) : true;
    felt.dataset.aktiv = k ? 'true' : 'false';
    felt.querySelector('.lign-stand').textContent = s.tid ? (k ? 'Kører' : 'Hviler') : 'Resultat';
  }
  el('who').textContent = s.status(st);
}

/* ── Knapperne i panelets hoved ────────────────────────── */
const btnKoer = el('btn-koer'), btnHurtig = el('btn-hurtig'), btnVidere = el('btn-videre');

function opdaterKnapper(){
  const s = station();
  const nu = s.tid ? s.nu(st) : 0;
  const slut = s.tid && nu >= s.tid.maks - 1e-6;
  btnKoer.disabled = !s.tid || slut;
  btnKoer.textContent = koerer ? 'Pause' : nu > 0 && !slut ? 'Fortsæt' : 'Start';
  btnKoer.setAttribute('aria-pressed', koerer ? 'true' : 'false');
  btnKoer.classList.toggle('klar', !!s.tid && !koerer && nu === 0);
  btnHurtig.disabled = !s.tid;

  const næste = STATIONER[nr + 1];
  btnVidere.classList.toggle('skjult', !næste);
  btnVidere.textContent = næste ? 'Til ' + næste.navn.toLowerCase() + ' →' : '';
  btnVidere.disabled = !næste || nu <= 0;
  btnVidere.classList.toggle('klar', !!næste && s.tid && s.faerdig(st));

  document.querySelectorAll('.fane').forEach((f, i) => {
    f.disabled = i > nr;
    f.setAttribute('aria-current', i === nr ? 'step' : 'false');
    f.classList.toggle('gjort', i < nr);
  });
  for(const k of s.knapper){
    const input = el('k-' + k.id);
    if(input) input.disabled = !!(k.laasVedStart && nu > 0);
  }
  el('hint').classList.toggle('gone', !s.tid || nu > 0);
}

function saetKoer(til){
  koerer = til;
  opdaterKnapper();
  fortael();
}

btnKoer.addEventListener('click', () => saetKoer(!koerer));
btnHurtig.addEventListener('click', () => {
  hurtig = !hurtig;
  btnHurtig.setAttribute('aria-pressed', hurtig ? 'true' : 'false');
});
btnVidere.addEventListener('click', () => {
  station().afslut(st, batch);
  gaaTil(nr + 1);
});
el('btn-nulstil').addEventListener('click', () => { batch = {}; gaaTil(0); });
el('faner').addEventListener('click', ev => {
  const f = ev.target.closest('.fane');
  if(!f || f.disabled) return;
  const i = +f.dataset.nr;
  if(i !== nr) gaaTil(i);
});

/* ── Skydere og handlinger under figuren ───────────────── */
el('knobs').addEventListener('input', ev => {
  const input = ev.target.closest('[data-knap]');
  if(!input) return;
  const s = station(), k = s.knapper.find(k => k.id === input.dataset.knap);
  const v = parseFloat(input.value);
  vaerdier[s.id][k.id] = v;
  el('kv-' + k.id).textContent = komma(v, k.decimaler ?? 0);
  /* Før uret er startet, er temperatur og mængder startbetingelser:
     mæsken røres ud ved den valgte temperatur, gæren kommer i ved
     gæringstemperaturen. (Humleportionen er ikke — den bruges først,
     når man tilsætter.) */
  if(s.tid && s.nu(st) === 0 && (k.laasVedStart || k.id === 'temp')) st = s.start(batch, {...vaerdier[s.id]});
  gemTilstand();
});
el('knobs').addEventListener('click', ev => {
  const h = ev.target.closest('[data-handling]');
  if(h){
    const besked = station().handling(h.dataset.handling, st, vaerdier[station().id]);
    if(besked) sig(besked);
    gemTilstand();
    return;
  }
  const igen = ev.target.closest('[data-igen]');
  if(igen) gaaTil(+igen.dataset.igen);
});

/* ── Skift af station ──────────────────────────────────── */
const HINT = {
  maesk:'Vælg temperatur, og tryk Start — skift gerne temperatur undervejs',
  kog:'Tryk Start, og tilsæt humle, når du vil: tidligt giver bitterhed, sent giver aroma',
  gaer:'Vælg gæringstemperatur og mængde gær, og tryk Start',
};

function gaaTil(i, {stille = false} = {}){
  nr = i;
  koerer = false; proeveUr = 0;
  const s = station();
  st = s.start(batch, {...vaerdier[s.id]});
  byggRaekker(s, batch);
  el('hint').textContent = HINT[s.id] || '';
  if(s.id === 'smag' && !stille) skrivJournal();
  opdaterKnapper();
  aflaes();
  gemTilstand();
  if(!stille) fortael(true);
  laasRaekker();
}

/* ── Løkken ────────────────────────────────────────────── */
let aflaesUr = 0, srUr = 0;
lærred.naarSkridt(dt => {
  rt += dt;
  const s = station();
  if(koerer && s.tid){
    const T = s.tid;
    let rest = Math.min(dt * T.fart * (hurtig ? 4 : 1), T.maks - s.nu(st));
    while(rest > 1e-9){
      const d = Math.min(T.skridt, rest);
      s.skridt(st, d, vaerdier[s.id]);
      rest -= d;
      proeveUr += d;
      if(proeveUr >= T.proeve){ proeveUr = 0; s.maal(st); }
    }
    if(s.nu(st) >= T.maks - 1e-6){
      s.maal(st);
      koerer = false;
      fortael(true);
    }
    srUr += dt;
    if(srUr > 6){ srUr = 0; fortael(); }
  }
  s.animer?.(st, dt, rt);
  aflaesUr += dt;
  if(aflaesUr > 0.1){ aflaesUr = 0; aflaes(); opdaterKnapper(); }
});
lærred.naarTegn(g => {
  const s = station();
  s.tegn(g, st, rt);
  if(s.graf) tegnGraf(g, s.graf(st));
});

/* ── Skærmlæser ────────────────────────────────────────── */
let sidstSagt = '';
function sig(t){ el('sr-status').textContent = t; }
function fortael(tving){
  const t = station().fortael(st);
  if(tving || t !== sidstSagt){ sidstSagt = t; sig(t); }
}

/* ── Bryggejournalen ───────────────────────────────────── */
function skrivJournal(){
  const b = batch, r = b.oel;
  journal.push({
    nr:journal.length + 1,
    maesk:b.maesk.temperaturer.join('→') + ' °C · ' + Math.round(b.maesk.tid) + ' min',
    malt:komma(b.maesk.malt, 1) + ' kg',
    humle:b.kog.humle.length ? b.kog.humle.map(h => h.g + ' g/' + Math.floor(h.tid)).join(', ') : '—',
    gaering:b.gaering.temperaturer.join('→') + ' °C · ' + komma(b.gaering.tid / 24, 1) + ' d',
    og:komma(r.og, 3), fg:komma(r.fg, 3), abv:komma(r.abv, 1) + ' %',
    ibu:komma(r.ibu), forg:komma(r.forgaering * 100) + ' %',
  });
  const krop = el('journal-krop');
  krop.innerHTML = journal.slice().reverse().map(j => `
    <tr><th scope="row">${j.nr}</th><td>${j.maesk}</td><td>${j.malt}</td><td>${j.humle}</td>
    <td>${j.gaering}</td><td>${j.og}</td><td>${j.fg}</td><td><b>${j.abv}</b></td><td>${j.ibu}</td><td>${j.forg}</td></tr>`).join('');
  el('journal').hidden = false;
}
el('btn-ryd').addEventListener('click', () => {
  journal.length = 0;
  el('journal-krop').innerHTML = '';
  el('journal').hidden = true;
});

/* ── Rammen står stille ────────────────────────────────── *
 * Stationerne har forskellig mængde tekst i rækkerne. Alle måles én
 * gang, og hver række låses til den højeste, så figuren og knapperne
 * ikke hopper, når man går videre. Kun i det brede layout.       */
const RÆKKER = ['ligninger', 'gauges', 'knobs', 'facts'];
let eksempel = null;
function laasRaekker(){
  for(const id of RÆKKER) el(id).style.minHeight = '';
  if(!matchMedia('(min-width:961px)').matches) return;
  eksempel ??= autobryg(STATIONER.length - 1, {}, true);
  const maks = Object.fromEntries(RÆKKER.map(id => [id, 0]));
  for(const s of STATIONER){
    byggRaekker(s, s.id === 'smag' ? (batch.oel ? batch : eksempel) : batch);
    for(const id of RÆKKER) maks[id] = Math.max(maks[id], el(id).getBoundingClientRect().height);
  }
  byggRaekker(station(), batch);
  for(const id of RÆKKER) el(id).style.minHeight = Math.ceil(maks[id]) + 'px';
  aflaes(); opdaterKnapper();
}
let resizeUr = 0;
addEventListener('resize', () => { clearTimeout(resizeUr); resizeUr = setTimeout(laasRaekker, 150); });
if(document.fonts) document.fonts.ready.then(laasRaekker);

/* ── Automatisk brygning (til adresser, der peger på en senere station) ── */
const STANDARDTID = {maesk:60, kog:60, gaer:14 * 24};
const STANDARDHUMLE = [{g:20, tid:0}, {g:20, tid:55}];

function autobryg(til, {humle = STANDARDHUMLE} = {}, egen = false){
  const b = {};
  for(let i = 0; i < til; i++){
    const s = STATIONER[i];
    const v = {...vaerdier[s.id]};
    const x = s.start(b, v);
    const ventende = s.id === 'kog' ? humle.slice().sort((a, c) => a.tid - c.tid) : [];
    while(s.nu(x) < STANDARDTID[s.id] - 1e-9){
      while(ventende.length && ventende[0].tid <= s.nu(x) + 1e-9){
        s.handling('humle', x, {portion:ventende.shift().g});
      }
      s.skridt(x, Math.min(s.tid.skridt, STANDARDTID[s.id] - s.nu(x)), v);
    }
    s.afslut(x, b);
  }
  if(!egen) batch = b;
  return b;
}

/* ── Projektortilstand ─────────────────────────────────── */
const btnProjektor = el('btn-projektor');
function saetProjektor(til){
  document.body.setAttribute('data-projektor', til ? '1' : '0');
  btnProjektor.setAttribute('aria-pressed', til ? 'true' : 'false');
  requestAnimationFrame(laasRaekker);
}
btnProjektor.addEventListener('click', () => saetProjektor(document.body.getAttribute('data-projektor') !== '1'));

/* ── Deling: stationen og opskriften ligger i adressen ─── *
 * #station=gaer&maesk=65&malt=4,5&humle=20@0,20@55&gaering=20&gaer=11,5
 * Peger adressen på en senere station, brygges stationerne før den
 * automatisk med opskriftens tal (mæsk 60 min, kog 60 min, gæring
 * 14 døgn), så man lander med den rigtige urt i gryden.            */
const ADRESSE = {maesk:{temp:'maesk', malt:'malt'}, kog:{portion:'portion'}, gaer:{temp:'gaering', gaer:'gaer'}};

function humleNu(){
  const h = station().id === 'kog' ? st.k.humle : batch.kog?.humle;
  return h && h.length ? h.map(x => x.g + '@' + Math.floor(x.tid)).join(',') : null;
}

let hashUr = 0;
function gemTilstand(){
  const p = new URLSearchParams();
  p.set('station', station().id);
  for(const [sid, felter] of Object.entries(ADRESSE)){
    for(const [kid, navn] of Object.entries(felter)) p.set(navn, String(vaerdier[sid][kid]));
  }
  const h = humleNu();
  if(h) p.set('humle', h);
  const streng = '#' + p.toString().replace(/%40/g, '@').replace(/%2C/g, ',');
  clearTimeout(hashUr);
  hashUr = setTimeout(() => { if(location.hash !== streng) history.replaceState(null, '', streng); }, 400);
}

function laesTilstand(){
  const p = new URLSearchParams(location.search);
  new URLSearchParams(location.hash.replace(/^#/, '')).forEach((v, k) => p.set(k, v));
  for(const s of STATIONER){
    for(const k of s.knapper){
      const navn = ADRESSE[s.id]?.[k.id];
      const raa = navn && p.get(navn);
      if(raa == null) continue;
      const v = parseFloat(raa.replace(',', '.'));
      if(Number.isFinite(v)) vaerdier[s.id][k.id] = Math.max(k.min, Math.min(k.max, Math.round(v / k.step) * k.step));
    }
  }
  let humle;
  if(p.get('humle')){
    humle = p.get('humle').split(',').map(x => x.split('@').map(Number))
      .filter(([g, t]) => g > 0 && g <= 200 && t >= 0 && t <= 90)
      .map(([g, t]) => ({g, tid:t}));
  }
  const i = Math.max(0, STATIONER.findIndex(s => s.id === p.get('station')));
  if(i > 0) autobryg(i, {humle});
  if(/mode=teach|projektor=1/.test(location.search)) saetProjektor(true);
  return i;
}

/* ── Faner ─────────────────────────────────────────────── */
el('faner').innerHTML = STATIONER.map((s, i) => `
  <button type="button" class="btn-mini fane" data-nr="${i}" aria-current="false">
    <span class="fane-nr">${s.nr}</span>${s.navn}</button>`).join('');

/* ── Start ─────────────────────────────────────────────── */
gaaTil(laesTilstand(), {stille:true});
if(station().id === 'smag') skrivJournal();
fortael(true);
lærred.start();
window.tilpasFigur = () => lærred.tilpas();
