/* ═══════════════════════════════════════════════════════════
   side.js — indgangen.

   Binder FinalSim.html sammen med modellen (model.js), figuren
   til venstre (aksen.js) og kurverne til højre (kurver.js):
   løkken, knapperne, instrumenterne, hændelsesteksterne,
   CSV-udtrækket og projektortilstanden.
   ═══════════════════════════════════════════════════════════ */
import * as M from './model.js';
import {byggAksen, tegnAksen} from './aksen.js';
import {byggKurver, tegnKurver} from './kurver.js';

const el = id => document.getElementById(id);
const svg = el('scene');
const aksen = byggAksen(svg);
const kurver = byggKurver(svg);
const bevaegelse = !matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Tilstand og spor ───────────────────────────────────── */
const PROEVE = 0.1;                 /* døgn mellem to punkter i sporet */
let s, spor, naesteProeve, sidstHaendelse, testPositiv;

function optag(s){
  return {
    t: s.t, cyk: s.cyklus, dag: s.dag,
    fsh: s.fsh, lh: s.lh, oe: s.oe, prog: s.prog, hcg: s.hcg,
    fol: s.follikel, gul: s.gulFunktion, slim: s.slim,
    blod: s.blod > 0, pf: s.pille ? (s.pilleDag < 21 ? 1 : 2) : 0,
  };
}

function nulstil(){
  /* forhistorien — den forrige cyklus — vises til venstre for «nu» */
  const f = M.indsvunget(optag);
  s = f.s;
  spor = [];
  let sidst = -1e9;
  for (const p of f.spor) if (p.t - sidst >= PROEVE - 1e-9){ spor.push(p); sidst = p.t; }
  spor.push(optag(s));
  naesteProeve = PROEVE;
  sidstHaendelse = s.haendelser.length;
  testPositiv = false;
  el('btn-pille').setAttribute('aria-pressed', 'false');
  vis('Dag 1: menstruationen er begyndt — slimhinden fra sidste cyklus afstødes.');
  tegn(0);
}

/* ── Hændelser i ord ────────────────────────────────────── */
function tekstFor(h){
  switch (h.type){
    case 'lh-top':       return 'LH-top: østrogen har været højt i over et døgn — positiv feedback.';
    case 'aegloesning':  return 'Ægløsning: folliklen brister ca. 36 timer efter LH-toppens start.';
    case 'menstruation': return 'Menstruation: det gule legeme er gået til grunde, og progesteron falder.';
    case 'bortfaldsbloedning': return 'Bortfaldsblødning: pillepausen fjerner de syntetiske hormoner.';
    case 'befrugtning':  return 'Befrugtning: en sædcelle har nået ægget i æggelederen.';
    case 'indlejring':   return 'Indlejring: fostret sætter sig i slimhinden og begynder at danne hCG.';
    case 'samleje':      return 'Samleje: sædcellerne kan leve op til 5 døgn.';
    case 'pille-start':  return 'P-piller: 21 dage med pille, så 7 dages pause.';
    case 'pille-stop':   return 'P-pillerne er stoppet — cyklussen kommer i gang igen.';
    case 'fortryd':
      if (s.gravid || s.befrugtet >= 0) return 'Fortrydelsespille: for sent — ægget er allerede befrugtet.';
      if (s.gul >= 0) return 'Fortrydelsespille: for sent — ægløsningen er sket.';
      if (s.topp >= 0) return 'Fortrydelsespille: for sent — LH-toppen er allerede i gang.';
      return 'Fortrydelsespille: gestagenet spærrer LH-toppen, så ægløsningen udskydes.';
  }
  return '';
}

function vis(str){
  const h = el('haendelse');
  h.textContent = str;
  h.classList.remove('ny'); void h.offsetWidth; h.classList.add('ny');
  el('sr-status').textContent = str;
}

function nyeHaendelser(){
  while (sidstHaendelse < s.haendelser.length){
    const h = s.haendelser[sidstHaendelse++];
    const str = tekstFor(h);
    if (str) vis(str);
  }
  if (!testPositiv && s.hcg > 25){
    testPositiv = true;
    vis('Graviditetstesten er positiv: hCG er over 25 IU/L — og menstruationen udebliver.');
  }
}

/* ── Løkken ─────────────────────────────────────────────── */
let korer = false, tempo = 1.5, rest = 0, sidstTid = 0;

function frem(dage){
  rest += dage;
  const n = Math.floor(rest / M.DT);
  rest -= n * M.DT;
  for (let i = 0; i < n; i++){
    M.skridt(s);
    if (s.t >= naesteProeve){
      spor.push(optag(s));
      naesteProeve += PROEVE;
    }
  }
  if (spor.length > 30000) spor.splice(0, spor.length - 30000);
  nyeHaendelser();
  return n * M.DT;
}

function loop(nu){
  const dt = Math.min(0.1, (nu - (sidstTid || nu)) / 1000);
  sidstTid = nu;
  const gaaet = korer ? frem(dt * tempo) : 0;
  tegn(gaaet);
  requestAnimationFrame(loop);
}

/* ── Tegning og instrumenter ────────────────────────────── */
const fmt = (v, d = 0) => v.toLocaleString('da-DK', {minimumFractionDigits: d, maximumFractionDigits: d});
let sidstTegnetT = -1;

function tegn(gaaet){
  tegnAksen(aksen, s, gaaet, bevaegelse);
  if (s.t !== sidstTegnetT){ tegnKurver(kurver, spor, s); sidstTegnetT = s.t; }

  el('who-dag').textContent = s.pille
    ? 'P-pille · pakkens dag ' + Math.floor(s.pilleDag + 1)
    : s.gravid ? 'Gravid · uge ' + Math.floor((s.t - s.aeg) / 7 + 2)
    : 'Cyklus ' + s.cyklus + ' · dag ' + Math.floor(s.dag);
  el('who-fase').textContent = M.fase(s);

  maaler('fsh',  s.fsh,  fmt(s.fsh, 1), s.fsh / 16);
  maaler('lh',   s.lh,   fmt(s.lh, 1),  s.lh / 70);
  maaler('oe',   s.oe,   fmt(s.oe),     s.oe / 1600);
  maaler('prog', s.prog, fmt(s.prog, 1), s.prog / 64);
  maaler('hcg',  s.hcg,  fmt(s.hcg),    Math.log10(1 + s.hcg) / 5);
  const test = el('hcg-test');
  const pos = s.hcg > 25;
  test.textContent = pos ? 'positiv' : 'negativ';
  test.dataset.pos = pos;
}

function maaler(id, v, str, andel){
  el('val-' + id).textContent = str;
  el('bar-' + id).style.width = (Math.max(0, Math.min(1, andel)) * 100).toFixed(1) + '%';
}

/* ── Knapper ────────────────────────────────────────────── */
const btnStart = el('btn-start');
function saetKorer(til){
  korer = til;
  btnStart.textContent = til ? 'Pause' : 'Start';
  btnStart.setAttribute('aria-pressed', til ? 'true' : 'false');
}
btnStart.addEventListener('click', () => saetKorer(!korer));
el('btn-dag').addEventListener('click', () => { frem(1); tegn(1); });
el('btn-nulstil').addEventListener('click', () => { saetKorer(false); nulstil(); });

el('btn-samleje').addEventListener('click', () => { M.samleje(s); nyeHaendelser(); sidstTegnetT = -1; tegn(0); });
el('btn-fortryd').addEventListener('click', () => { M.fortrydelsespille(s); nyeHaendelser(); sidstTegnetT = -1; tegn(0); });
const btnPille = el('btn-pille');
btnPille.addEventListener('click', () => {
  const til = !s.pille;
  M.saetPille(s, til);
  btnPille.setAttribute('aria-pressed', til ? 'true' : 'false');
  nyeHaendelser(); sidstTegnetT = -1; tegn(0);
});

/* tempo: logaritmisk skyder fra ¼ til 8 døgn pr. sekund */
const skyder = el('slider-tempo');
function saetTempo(){
  tempo = Math.pow(2, +skyder.value);
  el('val-tempo').textContent = fmt(tempo, tempo < 1 ? 2 : 1);
  skyder.setAttribute('aria-valuetext', fmt(tempo, 2) + ' døgn pr. sekund');
}
skyder.addEventListener('input', saetTempo);

/* ── CSV til databehandling ─────────────────────────────── */
el('btn-csv').addEventListener('click', () => {
  const linjer = ['Døgn;Cyklus;Cyklusdag;FSH (IU/L);LH (IU/L);Østradiol (pmol/L);Progesteron (nmol/L);hCG (IU/L);Follikel (mm);Slimhinde (mm);Blødning'];
  for (const p of spor){
    if (p.t < 0) continue;
    linjer.push([
      fmt(p.t, 1), p.cyk, fmt(p.dag, 1), fmt(p.fsh, 2), fmt(p.lh, 2), fmt(p.oe, 0),
      fmt(p.prog, 2), fmt(p.hcg, 0), fmt(p.fol, 1), fmt(p.slim, 1), p.blod ? 'ja' : 'nej',
    ].map(v => String(v).replace(/ |\./g, '')).join(';'));
  }
  const blob = new Blob(['﻿' + linjer.join('\r\n')], {type: 'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hormoncyklus.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

/* ── Projektor ──────────────────────────────────────────── */
const btnProjektor = el('btn-projektor');
function saetProjektor(til){
  document.body.setAttribute('data-projektor', til ? '1' : '0');
  btnProjektor.setAttribute('aria-pressed', til ? 'true' : 'false');
  dispatchEvent(new Event('resize'));
}
btnProjektor.addEventListener('click', () => saetProjektor(document.body.getAttribute('data-projektor') !== '1'));
if (/mode=teach|projektor=1/.test(location.search)) saetProjektor(true);

/* ── Start ──────────────────────────────────────────────── */
saetTempo();
nulstil();
requestAnimationFrame(loop);
