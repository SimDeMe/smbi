/* ═══════════════════════════════════════════════════════════
   side.js — indgangen.

   Binder oelbrygning.html sammen med stationerne: fanerne, uret,
   skyderne og valglisterne, opskrifterne, instrumenterne,
   bryggejournalen, adressefeltet og projektortilstanden.
   Fagligheden står i brygning.js, opskrifterne i opskrifter.js,
   figurerne i station-*.js og udstyr.js — her står kun betjeningen.

   Batchen er det, der flyder fra station til station. Går man
   tilbage til en tidligere station, brygges der videre derfra med
   det, stationerne før den gav — det, der kom efter, er glemt.
   ═══════════════════════════════════════════════════════════ */
import {STATIONER} from './stationer.js';
import {byggLaerred, komma} from './model.js';
import {tegnGraf} from './graf.js';
import * as B from './brygning.js';
import {opskrift} from './opskrifter.js';

const el = id => document.getElementById(id);
const lærred = byggLaerred(el('scene'));

/* Enheder og græske bogstaver må ikke komme med i mono-mærkaternes
   versaler: α-amylase må ikke blive til «Α-AMYLASE». */
const beskyt = t => t.replace(/([αβ]|\b(?:mL|g\/L|mg\/L|L\/kg|kW|°C|°P|IBU|EBC|OG|FG|mio\.\/mL)\b|[A-Z][a-z]?[₀-₉]+[A-Za-z₀-₉]*)/g,
                              '<span class="enhed">$1</span>');

/* ── Tilstand ──────────────────────────────────────────── */
const STANDARD = {};
for(const s of STATIONER) STANDARD[s.id] = Object.fromEntries(s.knapper.map(k => [k.id, k.vaerdi]));
const kopi = o => JSON.parse(JSON.stringify(o));

/** Alle stationers værdier, som en opskrift sætter dem. */
function fraOpskrift(id){
  const v = kopi(STANDARD);
  const o = opskrift(id);
  v.indmaesk.opskrift = o ? o.id : 'egen';
  v.kog.plan = o ? 'opskrift' : 'selv';
  if(!o) return v;
  for(const m of B.MALTE) v.indmaesk['m-' + m.id] = o.malt[m.id] || 0;
  Object.assign(v.indmaesk, {vand:o.vand, vandT:o.vandT});
  Object.assign(v.maesk, {program:o.program, rast:o.rast, tid:o.tid});
  Object.assign(v.skyl, {skylT:o.skylT, urtV:o.urtV});
  Object.assign(v.kog, {sort:o.humle[0].sort, portion:Math.max(5, Math.round(o.humle[0].g / 5) * 5)});
  Object.assign(v.gaer, {type:o.gaer, temp:o.gaeringT, gaer:o.gaerG});
  return v;
}

const vaerdier = fraOpskrift(STANDARD.indmaesk.opskrift);

/** Har man ændret i opskriften? (Humlesort og portion er kun betjening.) */
function afviger(){
  const id = vaerdier.indmaesk.opskrift;
  if(!opskrift(id)) return false;
  const ref = fraOpskrift(id);
  return STATIONER.some(s => s.knapper.some(k =>
    k.id !== 'sort' && k.id !== 'portion' && ref[s.id][k.id] !== vaerdier[s.id][k.id]));
}

let batch = {};
let nr = 0, st = null;
let koerer = false, hurtig = false, rt = 0, proeveUr = 0;
const journal = [];
const station = () => STATIONER[nr];
const indeks = id => STATIONER.findIndex(s => s.id === id);

/* ── Rækkerne under figuren ────────────────────────────── */
function knapHtml(s, k){
  const v = vaerdier[s.id];
  const sp = k.spaend ? ` style="--sp:${k.spaend}"` : '';
  const kl = k.klasse ? ' ' + k.klasse : '';
  if(k.type === 'valg'){
    return `
    <label class="knob knob-valg${kl}" for="k-${k.id}"${sp}>
      <span class="knob-top"><span class="mono">${beskyt(k.navn)}</span></span>
      <select id="k-${k.id}" data-knap="${k.id}">${k.valg.map(o =>
        `<option value="${o.id}"${o.id === v[k.id] ? ' selected' : ''}>${o.navn}</option>`).join('')}</select>
    </label>`;
  }
  const track = typeof k.track === 'function' ? k.track(v) : k.track;
  return `
    <label class="knob${kl}" for="k-${k.id}"${sp}>
      <span class="knob-top"><span class="mono">${beskyt(k.navn)}</span>
        <span class="knob-val"><span id="kv-${k.id}">${komma(v[k.id], k.decimaler ?? 0)}</span> ${k.enhed}</span></span>
      <input type="range" id="k-${k.id}" min="${k.min}" max="${k.max}" step="${k.step}" value="${v[k.id]}"
             style="--track:${track};--kc:${k.kc}" data-knap="${k.id}">
    </label>`;
}

function signatur(s, b){
  if(s.id === 'smag') return opskriftPiller(b);
  return typeof s.signatur === 'function' ? s.signatur(vaerdier[s.id], b) : s.signatur;
}

function byggRaekker(s, b){
  el('ligninger').hidden = !s.ligninger.length;
  el('ligninger').innerHTML = s.ligninger.map(l => `
    <div class="lign" data-lign="${l.id}" style="--tone:${l.tone}">
      <span class="lign-top"><span class="mono">${beskyt(l.titel)}</span><span class="lign-stand">Hviler</span></span>
      <span class="lign-formel">${typeof l.html === 'function' ? (b.oel ? l.html(b) : '') : l.html}</span>
    </div>`).join('');

  el('gauges').hidden = !s.maalere.length;
  el('gauges').innerHTML = s.maalere.map(m => `
    <div class="gauge ${m.klasse}">
      <dt>${beskyt(m.navn)}</dt>
      <div class="g-viz"><div class="col"><i data-bar="${m.id}" style="--cc:${m.cc}"></i></div></div>
      <dd><span data-tal="${m.id}">–</span><small data-enhed="${m.id}"></small></dd>
    </div>`).join('');

  let knobs = s.knapper.map(k => knapHtml(s, k)).join('');
  knobs += (s.handlinger || []).map(h => `
    <div class="knob knob-knap">
      <span class="knob-top"><span class="mono">${h.navn}</span></span>
      <button type="button" class="btn" data-handling="${h.id}" title="${h.titel}">${h.navn}</button>
    </div>`).join('');
  if(s.id === 'smag'){
    knobs = `
      <div class="knob knob-knap"><span class="knob-top"><span class="mono">Samme urt, ny gær</span></span>
        <button type="button" class="btn" data-igen="${indeks('gaer')}">Gær igen</button></div>
      <div class="knob knob-knap"><span class="knob-top"><span class="mono">Samme urt, ny humle</span></span>
        <button type="button" class="btn" data-igen="${indeks('kog')}">Kog igen</button></div>
      <div class="knob knob-knap"><span class="knob-top"><span class="mono">Helt forfra</span></span>
        <button type="button" class="btn" data-igen="0">Nyt bryg</button></div>`;
  }
  el('knobs').innerHTML = knobs;
  const spalter = s.knapper.reduce((n, k) => n + (k.spaend || 1), 0) + (s.handlinger || []).length;
  el('knobs').style.setProperty('--n', s.kolonner || Math.max(2, s.id === 'smag' ? 3 : spalter));

  el('facts').innerHTML = signatur(s, b) || '';
}

function opskriftPiller(b){
  if(!b.oel) return '';
  const r = b.oel, o = opskrift(b.opskrift);
  const maal = o ? `<span class="fact">${o.navn} sigter mod <b>OG ${komma(o.maal.og, 3)} · FG ${komma(o.maal.fg, 3)} · ${komma(o.maal.ibu)} IBU · ${komma(o.maal.abv, 1)} %</b></span>`
                 : '<span class="fact">Egen opskrift</span>';
  return `${maal}
    <span class="fact">Malt <b>${komma(B.maltKg(b.indmaesk.malt), 2)}</b> <span class="enhed">kg</span> · skyllet ud <b>${komma(b.skyl.udbytte * 100)} %</b></span>
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
  if(s.lignTekst){
    for(const [id, html] of Object.entries(s.lignTekst(st))){
      const f = document.querySelector(`[data-lign="${id}"] .lign-formel`);
      if(f && f.dataset.h !== html){ f.dataset.h = html; f.innerHTML = html; }
    }
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
  const slut = s.tid && (nu >= s.tid.maks - 1e-6 || !!s.stop?.(st));
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
  const v = vaerdier[s.id];
  for(const k of s.knapper){
    const input = el('k-' + k.id);
    if(!input) continue;
    const laas = typeof k.laas === 'function' ? k.laas(v) : !!k.laas;
    input.disabled = (laas && nu > 0) || !!k.deaktiv?.(v, vaerdier);
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

/* ── Skydere, valglister og handlinger under figuren ───── */
function genopbyg(){
  byggRaekker(station(), batch);
  aflaes(); opdaterKnapper(); fyldOp();
}

function anvendOpskrift(id){
  if(opskrift(id)){
    const ny = fraOpskrift(id);
    for(const sid of Object.keys(ny)) Object.assign(vaerdier[sid], ny[sid]);
  } else {
    vaerdier.indmaesk.opskrift = 'egen';
    vaerdier.kog.plan = 'selv';
  }
  st = station().start(batch, vaerdier[station().id]);
  genopbyg();
}

function nyVaerdi(input){
  const s = station(), k = s.knapper.find(k => k.id === input.dataset.knap);
  if(!k) return;
  const v = vaerdier[s.id];
  if(k.type === 'valg'){
    v[k.id] = input.value;
    if(k.id === 'opskrift'){ anvendOpskrift(input.value); gemTilstand(); return; }
  } else {
    v[k.id] = parseFloat(input.value);
    el('kv-' + k.id).textContent = komma(v[k.id], k.decimaler ?? 0);
  }
  s.vedValg?.(k.id, v);
  /* Før uret er startet, er værdierne startbetingelser: stationen
     begynder forfra med dem. */
  if(s.tid && s.nu(st) === 0 && k.genstart) st = s.start(batch, v);
  if(k.type === 'valg' || s.vedValg) genopbyg();
  else el('facts').innerHTML = signatur(s, batch) || '';
  gemTilstand();
}
el('knobs').addEventListener('input', ev => {
  const input = ev.target.closest('input[data-knap]');
  if(input) nyVaerdi(input);
});
el('knobs').addEventListener('change', ev => {
  const input = ev.target.closest('select[data-knap]');
  if(input) nyVaerdi(input);
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
  if(igen){
    if(+igen.dataset.igen === 0) batch = {};
    gaaTil(+igen.dataset.igen);
  }
});

/* ── Skift af station ──────────────────────────────────── */
const HINT = {
  indmaesk:'Vælg en opskrift — eller skru selv på malt og vand — og tryk Start',
  maesk:'Vælg et mæskeprogram, og tryk Start — eller styr temperaturen selv',
  skyl:'Tryk Start for at åbne hanen: forurten løber fra, og skyllevandet vasker efter',
  kog:'Tryk Start: humleplanen følges, eller tilsæt selv — tidligt giver bitterhed, sent aroma',
  gaer:'Vælg gærtype og temperatur, og tryk Start',
};

function gaaTil(i, {stille = false} = {}){
  nr = i;
  koerer = false; proeveUr = 0;
  const s = station();
  st = s.start(batch, vaerdier[s.id]);
  byggRaekker(s, batch);
  el('hint').textContent = HINT[s.id] || '';
  if(s.id === 'smag' && !stille) skrivJournal();
  opdaterKnapper();
  aflaes();
  gemTilstand();
  if(!stille) fortael(true);
  fyldOp();
}

/* ── Løkken ────────────────────────────────────────────── */
let aflaesUr = 0, srUr = 0;
lærred.naarSkridt(dt => {
  rt += dt;
  const s = station();
  if(koerer && s.tid){
    const T = s.tid;
    let rest = Math.min(dt * T.fart * (hurtig ? 4 : 1), T.maks - s.nu(st));
    while(rest > 1e-9 && !s.stop?.(st)){
      const d = Math.min(T.skridt, rest);
      s.skridt(st, d, vaerdier[s.id]);
      rest -= d;
      proeveUr += d;
      if(proeveUr >= T.proeve){ proeveUr = 0; s.maal(st); }
    }
    if(s.nu(st) >= T.maks - 1e-6 || s.stop?.(st)){
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
  const b = batch, r = b.oel, o = opskrift(b.opskrift);
  journal.push({
    nr:journal.length + 1,
    opskrift:(o ? o.navn : 'Egen') + (o && afviger() ? ' · ændret' : ''),
    malt:komma(B.maltKg(b.indmaesk.malt), 2) + ' kg',
    maesk:b.maesk.temperaturer.join('→') + ' °C · ' + Math.round(b.maesk.tid) + ' min',
    skyl:b.skyl.skylT + ' °C · ' + komma(b.skyl.udbytte * 100) + ' %',
    humle:b.kog.humle.length ? b.kog.humle.map(h => h.g + ' g ' + B.humlesort(h.sort).kort + '/' + Math.floor(h.tid)).join(', ') : '—',
    gaering:B.gaertype(b.gaering.type).navn.split(' ')[0] + ' · ' + b.gaering.temperaturer.join('→') + ' °C · ' + komma(b.gaering.tid / 24, 1) + ' d',
    og:komma(r.og, 3), fg:komma(r.fg, 3), abv:komma(r.abv, 1) + ' %',
    ibu:komma(r.ibu), ebc:komma(r.ebc),
  });
  el('journal-krop').innerHTML = journal.slice().reverse().map(j => `
    <tr><th scope="row">${j.nr}</th><td>${j.opskrift}</td><td>${j.malt}</td><td>${j.maesk}</td><td>${j.skyl}</td>
    <td>${j.humle}</td><td>${j.gaering}</td><td>${j.og}</td><td>${j.fg}</td><td><b>${j.abv}</b></td>
    <td>${j.ibu}</td><td>${j.ebc}</td></tr>`).join('');
  el('journal').hidden = false;
}
el('btn-ryd').addEventListener('click', () => {
  journal.length = 0;
  el('journal-krop').innerHTML = '';
  el('journal').hidden = true;
});

/* ── Rammen står stille ────────────────────────────────── *
 * Stationerne har forskellig mængde tekst og forskelligt antal
 * knapper i rækkerne under figuren. Alle måles én gang, og den
 * plads, en station har til overs i forhold til den højeste, samles
 * nederst i knaprækken — så figuren og knapperne ikke hopper, når
 * man går videre. Kun i det brede layout.                         */
const RÆKKER = ['ligninger', 'gauges', 'knobs', 'facts'];
const bred = () => matchMedia('(min-width:961px)').matches;
const raekkeHoejde = () => RÆKKER.reduce((h, id) => h + el(id).getBoundingClientRect().height, 0);
let eksempel = null, maksHoejde = 0;

function laasRaekker(){
  el('knobs').style.minHeight = '';
  maksHoejde = 0;
  if(!bred()) return;
  eksempel ??= autobryg(STATIONER.length - 1, {}, true);
  for(const s of STATIONER){
    byggRaekker(s, s.id === 'smag' ? (batch.oel ? batch : eksempel) : batch);
    maksHoejde = Math.max(maksHoejde, raekkeHoejde());
  }
  byggRaekker(station(), batch);
  aflaes(); opdaterKnapper(); fyldOp();
}
function fyldOp(){
  const k = el('knobs');
  k.style.minHeight = '';
  if(!maksHoejde || !bred()) return;
  const mangler = maksHoejde - raekkeHoejde();
  if(mangler > 0.5) k.style.minHeight = Math.ceil(k.getBoundingClientRect().height + mangler) + 'px';
}
let resizeUr = 0;
addEventListener('resize', () => { clearTimeout(resizeUr); resizeUr = setTimeout(laasRaekker, 150); });
if(document.fonts) document.fonts.ready.then(laasRaekker);

/* ── Automatisk brygning (til adresser, der peger på en senere station) ── *
 * Hver station køres med de valgte værdier, til dens program stopper
 * eller dens standardtid er gået (tid.auto). Har man ingen opskrift
 * og ingen humle i adressen, humles der med 20 g Cascade ved start
 * og 20 g 5 minutter før slut.                                    */
const STANDARDHUMLE = [{sort:'cascade', g:20, tid:0}, {sort:'cascade', g:20, tid:55}];

function autobryg(til, {humle} = {}, egen = false){
  const b = {};
  for(let i = 0; i < til; i++){
    const s = STATIONER[i];
    const v = {...vaerdier[s.id]};
    let ventende = [];
    if(s.id === 'kog'){
      if(humle){ v.plan = 'selv'; ventende = humle.slice(); }
      else if(!opskrift(b.opskrift) || v.plan === 'selv'){ v.plan = 'selv'; ventende = STANDARDHUMLE.slice(); }
      ventende.sort((a, c) => a.tid - c.tid);
    }
    const x = s.start(b, v);
    const slut = s.tid.auto;
    while(s.nu(x) < slut - 1e-9 && !s.stop?.(x)){
      while(ventende.length && ventende[0].tid <= s.nu(x) + 1e-9){
        const h = ventende.shift();
        s.handling('humle', x, {portion:h.g, sort:h.sort});
      }
      s.skridt(x, Math.min(s.tid.skridt, slut - s.nu(x)), v);
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
 * #station=kog&opskrift=apa&rast=68&humle=cascade:40@0,cascade:35@55
 * Kun det, der afviger fra opskriften, skrives i adressen. Peger
 * adressen på en senere station, brygges stationerne før den
 * automatisk, så man lander med den rigtige urt i gryden.         */
function humleNu(){
  const h = station().id === 'kog' ? st.k.humle : batch.kog?.humle;
  if(!h || !h.length) return null;
  return h.map(x => x.sort + ':' + x.g + '@' + Math.floor(x.tid)).join(',');
}

let hashUr = 0;
function gemTilstand(){
  const p = new URLSearchParams();
  p.set('station', station().id);
  const id = vaerdier.indmaesk.opskrift;
  p.set('opskrift', id);
  const ref = fraOpskrift(id);
  for(const s of STATIONER){
    for(const k of s.knapper){
      if(!k.adr || k.id === 'opskrift') continue;
      if(vaerdier[s.id][k.id] !== ref[s.id][k.id]) p.set(k.adr, String(vaerdier[s.id][k.id]));
    }
  }
  const h = humleNu();
  if(h && (vaerdier.kog.plan === 'selv' || !opskrift(id) || nr > indeks('kog'))) p.set('humle', h);
  const streng = '#' + p.toString().replace(/%40/g, '@').replace(/%2C/g, ',').replace(/%3A/g, ':');
  clearTimeout(hashUr);
  hashUr = setTimeout(() => { if(location.hash !== streng) history.replaceState(null, '', streng); }, 400);
}

function laesTilstand(){
  const p = new URLSearchParams(location.search);
  new URLSearchParams(location.hash.replace(/^#/, '')).forEach((v, k) => p.set(k, v));
  const id = p.get('opskrift');
  if(id && (opskrift(id) || id === 'egen')){
    const ny = fraOpskrift(id);
    for(const sid of Object.keys(ny)) Object.assign(vaerdier[sid], ny[sid]);
  }
  for(const s of STATIONER){
    for(const k of s.knapper){
      const raa = k.adr && k.id !== 'opskrift' ? p.get(k.adr) : null;
      if(raa == null) continue;
      if(k.type === 'valg'){
        if(k.valg.some(o => o.id === raa)) vaerdier[s.id][k.id] = raa;
        continue;
      }
      const v = parseFloat(raa.replace(',', '.'));
      if(Number.isFinite(v)){
        const trin = Math.round((Math.max(k.min, Math.min(k.max, v)) - k.min) / k.step);
        vaerdier[s.id][k.id] = +(k.min + trin * k.step).toFixed(4);
      }
    }
  }
  let humle;
  if(p.get('humle')){
    humle = p.get('humle').split(',').map(x => {
      const [sort, rest] = x.includes(':') ? x.split(':') : ['cascade', x];
      const [g, t] = rest.split('@').map(Number);
      return {sort:B.humlesort(sort).id, g, tid:t};
    }).filter(h => h.g > 0 && h.g <= 200 && h.tid >= 0 && h.tid <= 90);
  }
  const i = Math.max(0, indeks(p.get('station')));
  if(i > 0) autobryg(i, {humle});
  if(/mode=teach|projektor=1/.test(location.search)) saetProjektor(true);
  return i;
}

/* ── Faner ─────────────────────────────────────────────── */
el('faner').innerHTML = STATIONER.map((s, i) => `
  <button type="button" class="btn-mini fane" data-nr="${i}" aria-current="false" title="${s.navn}">
    <span class="fane-nr">${s.nr}</span><span class="fane-navn">${s.navn}</span></button>`).join('');

/* ── Start ─────────────────────────────────────────────── */
gaaTil(laesTilstand(), {stille:true});
if(station().id === 'smag') skrivJournal();
fortael(true);
lærred.start();
window.tilpasFigur = () => lærred.tilpas();
