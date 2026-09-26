/* ═══════════════════════════════════════════════════════════
   side.js — indgangen.

   Binder FinalSim.html sammen med modellen (model.js), figuren
   til venstre (aksen.js) og kurverne til højre (kurver.js):
   løkken, knapperne, instrumenterne, forklaringslinjen,
   aflæsningen på kurverne, CSV-udtrækket og projektortilstanden.
   ═══════════════════════════════════════════════════════════ */
import * as M from './model.js';
import {byggAksen, tegnAksen} from './aksen.js';
import {byggKurver, tegnKurver, tegnLup, tidVed, dagNr, FORTID} from './kurver.js';

const el = id => document.getElementById(id);
const svg = el('scene');
const aksen = byggAksen(svg);
const kurver = byggKurver(svg);
const bevaegelse = !matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Tilstand og spor ───────────────────────────────────── */
const PROEVE = 0.1;                 /* døgn mellem to punkter i sporet */
let s, spor, naesteProeve, sidstHaendelse, testPositiv;

/* fasen til fasestriben under kurverne */
function faseKode(s){
  if (s.gravid) return 'grav';
  if (s.pille) return s.pilleDag < 21 ? 'pille' : 'pause';
  if (s.blod > 0) return 'mens';
  if (s.gul >= 0) return 'luteal';
  return 'follikel';
}

function optag(s){
  return {
    t: s.t, cyk: s.cyklus, dag: s.dag,
    fsh: s.fsh, lh: s.lh, oe: s.oe, prog: s.prog, hcg: s.hcg,
    fol: s.follikel, gul: s.gulFunktion, slim: s.slim,
    blod: s.blod > 0, pf: s.pille ? (s.pilleDag < 21 ? 1 : 2) : 0, pd: s.pilleDag,
    fase: faseKode(s),
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
  nyt = null; lup = null;
  el('btn-pille').setAttribute('aria-pressed', 'false');
  tegn(0);
}

/* ── Hvad sker der nu? ──────────────────────────────────────
   Forklaringslinjen under figuren fortæller med ord, hvad der
   foregår i den fase, cyklussen er i. En hændelse (ægløsning,
   samleje …) tager pladsen et øjeblik og viger så igen. */
const F = {
  mens:     ['Menstruation', 'Det gule legeme er gået til grunde, så progesteron er faldet. Uden progesteron afstødes slimhinden — og bremsen på hypofysen slipper, så FSH stiger igen.'],
  follikel: ['Follikelfase', 'FSH får en gruppe follikler i ovariet til at vokse. Folliklerne danner østrogen, som genopbygger slimhinden i livmoderen.'],
  dominant: ['Follikelfase', 'Én follikel er blevet dominant. Dens østrogen og inhibin bremser FSH (negativ feedback), så de andre follikler går til grunde.'],
  omslag:   ['Østrogen-top', 'Østrogen har været højt i et stykke tid. Nu slår virkningen på hypofysen om: fra bremse til speeder (positiv feedback).'],
  lhtop:    ['LH-top', 'Positiv feedback: LH skyder i vejret. Ca. 36 timer efter toppens start brister folliklen — ægløsning.'],
  aeg:      ['Ægløsning', 'Folliklen er bristet, og ægget er på vej ned gennem æggelederen. Det kan kun befrugtes det første døgn.'],
  luteal:   ['Lutealfase', 'Resten af folliklen er blevet til det gule legeme. Dets progesteron gør slimhinden klar til et befrugtet æg og bremser FSH og LH.'],
  sen:      ['Lutealfase', 'Uden et foster, der danner hCG, går det gule legeme til grunde efter ca. 14 dage. Progesteron falder — om lidt kommer menstruationen.'],
  befrugt:  ['Befrugtet æg', 'Ægget er befrugtet og deler sig på vej mod livmoderen. Ca. 8 dage efter ægløsningen sætter det sig fast i slimhinden.'],
  grav:     ['Graviditet', 'Fostret danner hCG, som holder det gule legeme i live. Progesteron forbliver højt, slimhinden afstødes ikke — menstruationen udebliver.'],
  fortryd:  ['Fortrydelsespille', 'Gestagenet fra fortrydelsespillen spærrer LH-toppen. Ægløsningen udskydes, til pillen er udskilt.'],
  pille:    ['P-pille', 'Pillens østrogen og gestagen bremser hypofysen (negativ feedback). FSH og LH holdes lave, ingen follikel modnes, og der sker ingen ægløsning.'],
  pause:    ['Pillepause', 'I pausen forsvinder de syntetiske hormoner fra blodet. Slimhinden mister sin støtte og afstødes som en bortfaldsblødning.'],
  bort:     ['Bortfaldsblødning', 'Blødningen i pillepausen er ikke en menstruation: der har ikke været nogen ægløsning og intet gult legeme.'],
};

function faseNu(s){
  if (s.gravid) return F.grav;
  if (s.pille) return s.blod > 0 ? F.bort : s.pilleDag < 21 ? F.pille : F.pause;
  if (s.blod > 0) return F.mens;
  if (s.befrugtet >= 0) return F.befrugt;
  if (s.gul >= 0 && s.t - s.aeg < 1.2) return F.aeg;
  if (s.topp >= 0) return F.lhtop;
  if (s.gul >= 0) return s.gul > 10 ? F.sen : F.luteal;
  if (s.fortryd > 5 && s.follikel >= M.K.dominantVed) return F.fortryd;
  if (s.prim > 0.05) return F.omslag;
  return s.follikel >= M.K.dominantVed ? F.dominant : F.follikel;
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
      if (s.gravid || s.befrugtet >= 0) return FORTRYD_TEKSTER[0];
      if (s.gul >= 0) return FORTRYD_TEKSTER[1];
      if (s.topp >= 0) return FORTRYD_TEKSTER[2];
      return FORTRYD_TEKSTER[3];
  }
  return '';
}
const FORTRYD_TEKSTER = [
  'Fortrydelsespille: for sent — ægget er allerede befrugtet.',
  'Fortrydelsespille: for sent — ægløsningen er sket.',
  'Fortrydelsespille: for sent — LH-toppen er allerede i gang.',
  'Fortrydelsespille: gestagenet spærrer LH-toppen, så ægløsningen udskydes.',
];
const TEST_TEKST = 'Graviditetstesten er positiv: hCG er over 25 IU/L — og menstruationen udebliver.';

/* en ny hændelse står, til der er gået mindst et døgn i modellen
   og fire sekunder på uret — under pause bliver den stående */
let nyt = null;
function vis(str){
  nyt = {tekst: str, t: s.t, ur: performance.now()};
  const f = el('forklaring');
  f.classList.remove('ny'); void f.offsetWidth; f.classList.add('ny');
  el('sr-status').textContent = str;
}

let sidstFase = null;
function forklar(){
  if (nyt && s.t - nyt.t > 1 && performance.now() - nyt.ur > 4000){
    nyt = null;
    el('forklaring').classList.remove('ny');
  }
  const [navn, tekst] = faseNu(s);
  el('fase-navn').textContent = navn;
  el('forklaring-tekst').textContent = nyt ? nyt.tekst : tekst;
  if (navn !== sidstFase && !nyt){
    if (sidstFase !== null) el('sr-status').textContent = navn + ': ' + tekst;
    sidstFase = navn;
  }
}

/* Rammen skal stå stille: linjen låses til den højeste af alle
   tekster, så instrumenter og knapper ikke hopper, når teksten skifter. */
const alleTekster = () => [
  ...Object.values(F).map(f => f[1]),
  ...['lh-top','aegloesning','menstruation','bortfaldsbloedning','befrugtning','indlejring','samleje','pille-start','pille-stop']
     .map(type => tekstFor({type})),
  ...FORTRYD_TEKSTER,
  TEST_TEKST,
];
function laasForklaring(){
  const f = el('forklaring'), p = el('forklaring-tekst');
  const nu = p.textContent;
  f.style.minHeight = '';
  let h = 0;
  for (const str of alleTekster()){ p.textContent = str; h = Math.max(h, f.offsetHeight); }
  p.textContent = nu;
  f.style.minHeight = h + 'px';
}

function nyeHaendelser(){
  while (sidstHaendelse < s.haendelser.length){
    const h = s.haendelser[sidstHaendelse++];
    const str = tekstFor(h);
    if (str) vis(str);
  }
  if (!testPositiv && s.hcg > 25){
    testPositiv = true;
    vis(TEST_TEKST);
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
  if (lup && lup.t < s.t - FORTID) lup = null;     /* rullet ud af figuren */
  tegnLup(kurver, s, lup);
  forklar();

  /* instrumenterne viser «nu» — eller den dag, man peger på */
  const v = lup || s;
  const hvem = el('who-dag');
  hvem.classList.toggle('aflaest', !!lup);
  hvem.textContent = lup
    ? 'Aflæst · ' + (lup.pf ? 'pakkens dag ' : 'cyklus ' + lup.cyk + ' · dag ') + dagNr(lup)
    : s.pille ? 'P-pille · pakkens dag ' + Math.floor(s.pilleDag + 1)
    : s.gravid ? 'Gravid · uge ' + Math.floor((s.t - s.aeg) / 7 + 2)
    : 'Cyklus ' + s.cyklus + ' · dag ' + Math.floor(s.dag);

  maaler('fsh',  v.fsh,  fmt(v.fsh, 1), v.fsh / 16);
  maaler('lh',   v.lh,   fmt(v.lh, 1),  v.lh / 70);
  maaler('oe',   v.oe,   fmt(v.oe),     v.oe / 1600);
  maaler('prog', v.prog, fmt(v.prog, 1), v.prog / 64);
  maaler('hcg',  v.hcg,  fmt(v.hcg),    Math.log10(1 + v.hcg) / 5);
  const test = el('hcg-test');
  const pos = v.hcg > 25;
  test.textContent = pos ? 'positiv' : 'negativ';
  test.dataset.pos = pos;
}

function maaler(id, v, str, andel){
  el('val-' + id).textContent = str;
  el('bar-' + id).style.width = (Math.max(0, Math.min(1, andel)) * 100).toFixed(1) + '%';
}

/* ── Aflæsning på kurverne ──────────────────────────────────
   Peg (eller tryk) på kurverne for at se tallene for den dag i
   instrumenterne. Med tastaturet: fokus på figuren og ← →. */
let lup = null;

function lupVed(t){
  if (t === null) return null;
  t = Math.min(t, s.t);
  const p = spor[naermestIndeks(t)];
  return p && p.t >= s.t - FORTID ? p : null;
}
function naermestIndeks(t){
  let lo = 0, hi = spor.length - 1;
  while (lo < hi){ const m = (lo + hi) >> 1; if (spor[m].t < t) lo = m + 1; else hi = m; }
  if (lo > 0 && Math.abs(spor[lo-1].t - t) < Math.abs(spor[lo].t - t)) return lo - 1;
  return lo;
}
function punktISvg(e){
  const m = svg.getScreenCTM();
  if (!m) return null;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  return tidVed(p.x, p.y, s);
}
svg.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' && e.buttons === 0) return;
  lup = lupVed(punktISvg(e));
});
svg.addEventListener('pointerdown', e => { lup = lupVed(punktISvg(e)); });
svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') lup = null; });
svg.addEventListener('keydown', e => {
  const trin = {ArrowLeft: -1, ArrowRight: 1}[e.key];
  if (e.key === 'Escape'){ lup = null; return; }
  if (!trin) return;
  e.preventDefault();
  const fra = lup ? lup.t : s.t;
  lup = lupVed(Math.max(s.t - FORTID, fra + trin));
  if (lup) el('sr-status').textContent =
    'Dag ' + dagNr(lup) + ': FSH ' + fmt(lup.fsh, 1) + ' IU/L, LH ' + fmt(lup.lh, 1) +
    ' IU/L, østradiol ' + fmt(lup.oe) + ' pmol/L, progesteron ' + fmt(lup.prog, 1) + ' nmol/L.';
});
svg.addEventListener('blur', () => { lup = null; });

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
  laasForklaring();
  dispatchEvent(new Event('resize'));
}
btnProjektor.addEventListener('click', () => saetProjektor(document.body.getAttribute('data-projektor') !== '1'));
if (/mode=teach|projektor=1/.test(location.search)) saetProjektor(true);

/* ── Start ──────────────────────────────────────────────── */
saetTempo();
nulstil();
laasForklaring();
addEventListener('resize', laasForklaring);
if (document.fonts) document.fonts.ready.then(laasForklaring);
requestAnimationFrame(loop);
