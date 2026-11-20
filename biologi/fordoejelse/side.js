// Fordøjelsessystemet: binder 3D-visningen, organlisten og rundturen sammen.
import {DELE, LISTE, TRIN, FARVER, fraGlobal, tilGlobal, ENZYMER, aktivitet, PH_STEDER,
  forhold, NORMALE, sætForhold, erNormale, trinPh, trinTekst, forholdNote} from './indhold.js';
import {skabMolekyler} from './molekyler.js';
import {OPGAVER} from './opgaver.js';

const $ = (id) => document.getElementById(id);
const komma = (x, d = 1) => x.toFixed(d).replace('.', ',');
const rolig = matchMedia('(prefers-reduced-motion: reduce)').matches;
const KANAL = new Set(['svaelg', 'spiseroer', 'mavesaek', 'tolvfingertarm', 'tyndtarm', 'tyktarm', 'endetarm']);
const KLUMP_R = {mund: 0.9, svaelg: 0.9, spiseroer: 0.8, mavesaek: 2.3, tolvfingertarm: 1.0, tyndtarm: 0.8,
  tyktarm: 1.5, endetarm: 1.4};
const FARVE_PRIK = {
  tunge: '#c3525a', taender: '#f3ecd9', gane: '#d9848a', spytkirtel: '#e3b48a', svaelg: '#c7766c',
  spiseroer: '#c46e63', mavesaek: '#d8857a', tolvfingertarm: '#dd9a7c', tyndtarm: '#e3907f', tyktarm: '#cf9f7e',
  vedhaeng: '#c99579', endetarm: '#b9776a', lever: '#7c2b24', galdeblaere: '#5d8f3c', galdegang: '#76a03c',
  bugspytkirtel: '#e8c27c',
};

let vis = null;            // 3D-visningen (null, hvis WebGL fejler)
let tilstand = 'opbygning';
let valgt = null;
let u = 0, spiller = false, sidst = 0;
const VARIGHED = 75;       // sekunder for hele turen ved afspilning

// ---------------------------------------------------------------- opbygning
const liste = $('liste');
for (const [titel, dele] of LISTE) {
  const h = document.createElement('h3');
  h.textContent = titel;
  const div = document.createElement('div');
  div.className = 'chips';
  for (const d of dele) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.del = d;
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<i style="background:${FARVE_PRIK[d]}"></i>${DELE[d].navn}`;
    b.addEventListener('click', () => vælg(valgt === d ? null : d, true));
    div.appendChild(b);
  }
  liste.append(h, div);
}
const STANDARD = {gruppe: $('info-gruppe').textContent, navn: $('info-navn').textContent, tekst: $('info-tekst').textContent};

function vælg(del, fraListe = false) {
  if (del && !DELE[del]) del = null;
  valgt = del;
  const d = del ? DELE[del] : null;
  $('info-gruppe').textContent = d ? d.gruppe : STANDARD.gruppe;
  $('info-navn').textContent = d ? d.navn : STANDARD.navn;
  $('info-tekst').textContent = d ? d.tekst : STANDARD.tekst;
  const dl = $('info-fakta');
  dl.textContent = '';
  for (const [k, v] of d?.fakta || []) {
    const dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = k; dd.textContent = v;
    dl.append(dt, dd);
  }
  for (const b of liste.querySelectorAll('.chip')) b.setAttribute('aria-pressed', String(b.dataset.del === del));
  vis?.vælg(del, {fokus: fraListe});
}

// ---------------------------------------------------------------- madens vej
const trinliste = $('trinliste');
TRIN.forEach((t) => {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = t.navn.replace(' og anus', '');
  b.addEventListener('click', () => { stop(); sætU(tilGlobal(t.id, 0.02)); });
  li.appendChild(b);
  trinliste.appendChild(li);
});
const molekyler = skabMolekyler($('molekyler'));
let forrigeTrin = -1;

function tidTekst(min) {
  if (min < 1) return 'under 1 minut efter måltidet';
  if (min < 1.5) return 'ca. 1 minut efter måltidet';
  if (min < 60) return `ca. ${Math.round(min)} minutter efter måltidet`;
  const t = Math.round((min / 60) * 2) / 2;
  return `ca. ${String(t).replace('.', ',')} ${t === 1 ? 'time' : 'timer'} efter måltidet`;
}

function sætU(ny) {
  u = Math.min(Math.max(ny, 0), 1);
  $('tidslinje').value = Math.round(u * 1000);
  const {i, trin, f} = fraGlobal(u);
  if (i !== forrigeTrin) {
    forrigeTrin = i;
    const tt = trinTekst(trin);
    $('trin-navn').textContent = trin.navn;
    $('trin-mek').textContent = tt.mekanisk;
    const kem = $('trin-kem');
    kem.textContent = '';
    if (!tt.kemisk.length) kem.textContent = '—';
    tt.kemisk.forEach(([enzym, hvad], k) => {
      if (k) kem.appendChild(document.createElement('br'));
      const b = document.createElement('b');
      b.textContent = enzym;
      kem.append(b, ': ' + hvad);
    });
    $('trin-optag').textContent = tt.optag || 'Næsten intet';
    $('trin-note').textContent = tt.note;
    $('trin-ændret').textContent = forholdNote(trin);
    [...trinliste.querySelectorAll('button')].forEach((b, k) => {
      if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.classList.toggle('forbi', k < i);
    });
    vis?.aktiv(trin.dele);
    vis?.glas(trin.dele.filter((d) => KANAL.has(d)));
  }
  const [p0, p1] = trinPh(trin);
  const ph = p0 + (p1 - p0) * Math.min(1, f / 0.4);
  $('ph-tal').textContent = ph.toFixed(1).replace('.', ',');
  $('ph-mærke').style.left = `${(ph / 14) * 100}%`;
  $('trin-tid').textContent = tidTekst(trin.tid[0] + (trin.tid[1] - trin.tid[0]) * f);
  molekyler.opdater(u);
  const tid = performance.now() / 1000;
  const puls = rolig ? 0 : trin.id === 'mund' ? 0.08 * Math.sin(tid * 9) : trin.id === 'mavesaek' ? 0.06 * Math.sin(tid * 4) : 0;
  vis?.klump(trin.id, f, {farve: FARVER[trin.id], radius: KLUMP_R[trin.id], følgMed: $('følg').checked, puls});
}

function afspil() {
  if (u >= 1) sætU(0);
  spiller = true;
  sidst = performance.now();
  $('btn-play').classList.add('spiller');
  $('btn-play').setAttribute('aria-label', 'Pause');
  vis?.animer(true);
  requestAnimationFrame(tik);
}
function stop() {
  spiller = false;
  $('btn-play').classList.remove('spiller');
  $('btn-play').setAttribute('aria-label', 'Afspil');
  vis?.animer(false);
}
function tik(nu) {
  if (!spiller) return;
  const dt = Math.min(0.1, (nu - sidst) / 1000);
  sidst = nu;
  sætU(u + dt / VARIGHED);
  if (u >= 1) { stop(); return; }
  requestAnimationFrame(tik);
}
$('btn-play').addEventListener('click', () => (spiller ? stop() : afspil()));
$('tidslinje').addEventListener('input', (e) => { stop(); sætU(e.target.value / 1000); });
$('følg').addEventListener('change', () => sætU(u));

// ---------------------------------------------------------------- hvad nu hvis …
function sætForholdUI(nye) {
  sætForhold(nye);
  $('ph-mave').value = forhold.phMave;
  $('ph-mave-ud').textContent = komma(forhold.phMave);
  $('galde-mangler').checked = !forhold.galde;
  $('hvis-mærke').hidden = erNormale();
  forrigeTrin = -1;
  if (tilstand === 'forloeb') sætU(u);
}
$('ph-mave').addEventListener('input', (e) => sætForholdUI({phMave: Number(e.target.value)}));
$('galde-mangler').addEventListener('change', (e) => sætForholdUI({galde: !e.target.checked}));
$('btn-normale').addEventListener('click', () => sætForholdUI(NORMALE));

// ---------------------------------------------------------------- enzymer og pH
const SVGNS = 'http://www.w3.org/2000/svg';
const svgEl = (navn, attr, forælder) => {
  const e = document.createElementNS(SVGNS, navn);
  for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v);
  forælder.appendChild(e);
  return e;
};
const STREG = {amylase: '', pepsin: '', trypsin: '7 3', lipase: '2 2.5', maltase: '9 3 2 3'};
// etiketter ved kurvernes flanker, så de to par med næsten samme optimum kan skelnes
const ETIKET = {pepsin: [2, 1.06, 'middle'], amylase: [6.9, 1.06, 'middle'], maltase: [5.35, 0.9, 'end'],
  trypsin: [9.25, 0.9, 'start'], lipase: [9.6, 0.5, 'start']};
const GX = (ph) => 34 + (ph / 14) * 276, GY = (a) => 146 - a * 118;
const graf = $('ph-graf');
for (const a of [0, 0.5, 1]) {
  svgEl('line', {x1: GX(0), x2: GX(14), y1: GY(a), y2: GY(a), class: a ? 'g-gitter' : 'g-akse'}, graf);
  svgEl('text', {x: GX(0) - 5, y: GY(a) + 3, class: 'g-tal', 'text-anchor': 'end'}, graf).textContent = `${a * 100} %`;
}
for (let ph = 0; ph <= 14; ph += 2) {
  svgEl('line', {x1: GX(ph), x2: GX(ph), y1: GY(0), y2: GY(0) + 4, class: 'g-akse'}, graf);
  svgEl('text', {x: GX(ph), y: GY(0) + 14, class: 'g-tal', 'text-anchor': 'middle'}, graf).textContent = ph;
}
svgEl('text', {x: GX(14), y: GY(0) + 27, class: 'g-titel', 'text-anchor': 'end'}, graf).textContent = 'pH';
svgEl('text', {x: GX(0) - 30, y: 8, class: 'g-titel'}, graf).textContent = 'Relativ aktivitet';
const markør = svgEl('line', {y1: GY(1.1), y2: GY(0), class: 'g-markør'}, graf);
const prikker = {};
for (const e of ENZYMER) {
  const d = Array.from({length: 141}, (_, i) => `${i ? 'L' : 'M'}${GX(i / 10).toFixed(1)},${GY(aktivitet(e.id, i / 10)).toFixed(1)}`).join('');
  svgEl('path', {d, class: 'g-kurve', stroke: e.farve, 'stroke-dasharray': STREG[e.id]}, graf);
  const [ph, a, anker] = ETIKET[e.id];
  svgEl('text', {x: GX(ph), y: GY(a), class: 'g-navn', 'text-anchor': anker}, graf).textContent = e.navn.toLowerCase();
}
for (const e of ENZYMER) prikker[e.id] = svgEl('circle', {r: 4, class: 'g-prik', fill: e.farve}, graf);

const enzListe = $('enz-liste');
const enzRæk = {};
for (const e of ENZYMER) {
  const li = document.createElement('li');
  li.innerHTML = `<svg class="enz-streg" viewBox="0 0 24 8" aria-hidden="true"><line x1="1" y1="4" x2="23" y2="4" stroke="${e.farve}" stroke-dasharray="${STREG[e.id]}"/></svg>`
    + `<b>${e.navn}</b><span class="enz-bar"><i style="background:${e.farve}"></i></span><span class="enz-pct mono"></span>`
    + `<span class="enz-hvad">${e.hvad} · ${e.hvor} · optimum ≈ ${komma(e.opt, e.opt % 1 ? 1 : 0)}</span>`;
  enzListe.appendChild(li);
  enzRæk[e.id] = li;
}
const genveje = $('ph-genveje');
for (const st of PH_STEDER) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.dataset.ph = st.ph;
  b.setAttribute('aria-pressed', 'false');
  b.innerHTML = `${st.navn} <span class="mono">pH ${komma(st.ph, st.ph % 1 ? 1 : 0)}</span>`;
  b.addEventListener('click', () => sætPh(st.ph, true));
  genveje.appendChild(b);
}

let ph = 7;
function oplist(navne) {
  return navne.length < 2 ? navne.join('') : `${navne.slice(0, -1).join(', ')} og ${navne.at(-1)}`;
}
function sætPh(ny, meld = false) {
  ph = Math.min(14, Math.max(0, Number(ny)));
  $('ph-skyder').value = ph;
  $('ph-ud').textContent = komma(ph);
  markør.setAttribute('x1', GX(ph)); markør.setAttribute('x2', GX(ph));
  const godt = [], lidt = [], stille = [];
  for (const e of ENZYMER) {
    const a = aktivitet(e.id, ph);
    prikker[e.id].setAttribute('cx', GX(ph)); prikker[e.id].setAttribute('cy', GY(a));
    const li = enzRæk[e.id];
    li.querySelector('.enz-bar i').style.width = `${a * 100}%`;
    li.querySelector('.enz-pct').textContent = `${Math.round(a * 100)} %`;
    li.classList.toggle('stille', a < 0.1);
    (a >= 0.5 ? godt : a >= 0.1 ? lidt : stille).push(e.navn.toLowerCase());
  }
  const dele = ENZYMER.filter((e) => aktivitet(e.id, ph) >= 0.5).flatMap((e) => e.dele);
  if (tilstand === 'enzymer') vis?.aktiv(dele);
  for (const b of genveje.children) b.setAttribute('aria-pressed', String(Number(b.dataset.ph) === ph));
  const dele1 = [];
  if (godt.length) dele1.push(`${oplist(godt)} virker godt`);
  if (lidt.length) dele1.push(`${oplist(lidt)} virker lidt`);
  if (stille.length) dele1.push(`${oplist(stille)} står næsten stille`);
  const tekst = `Ved pH ${komma(ph)}: ${dele1.join('; ')}.`;
  $('ph-resume').textContent = tekst;
  if (meld) $('ph-sr').textContent = tekst;
}
$('ph-skyder').addEventListener('input', (e) => sætPh(e.target.value));
$('ph-skyder').addEventListener('change', (e) => sætPh(e.target.value, true));
sætPh(7);

// ---------------------------------------------------------------- faner og knapper
const FANER = ['opbygning', 'forloeb', 'enzymer'];
function skiftTil(ny) {
  tilstand = ny;
  for (const f of FANER) {
    $('fane-' + f).setAttribute('aria-selected', String(f === ny));
    $('fane-' + f).tabIndex = f === ny ? 0 : -1;
    $('panel-' + f).hidden = f !== ny;
  }
  $('afspil').hidden = ny !== 'forloeb';
  $('btn-dæmp').hidden = ny !== 'opbygning';
  if (ny === 'forloeb') {
    vis?.vælg(null);
    forrigeTrin = -1;
    sætU(u);
    return;
  }
  stop();
  vis?.klump(null);
  vis?.glas([]);
  if (ny === 'opbygning') {
    vis?.aktiv([]);
    vis?.vælg(valgt);
  } else {
    vis?.vælg(null);
    sætPh(ph);
  }
}
for (const f of FANER) $('fane-' + f).addEventListener('click', () => skiftTil(f));
document.querySelector('.seg').addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const i = FANER.indexOf(tilstand) + (e.key === 'ArrowRight' ? 1 : -1);
  const ny = FANER[(i + FANER.length) % FANER.length];
  skiftTil(ny);
  $('fane-' + ny).focus();
});

// ---------------------------------------------------------------- opgaver
let opgNr = 0;
function visOpgave(n) {
  opgNr = (n + OPGAVER.length) % OPGAVER.length;
  const o = OPGAVER[opgNr];
  $('opg-nr').textContent = `Opgave ${opgNr + 1} af ${OPGAVER.length}`;
  $('opg-spm').textContent = o.spm;
  $('opg-gør').textContent = o.gør;
  $('opg-forklaring').textContent = o.forklaring;
  visForklaring(false);
}
function visOpgaver(v) {
  $('opgave').hidden = !v;
  $('btn-opgaver').setAttribute('aria-pressed', String(v));
  if (v) {
    document.querySelector('.side').scrollTop = 0;
    if (matchMedia('(max-width: 760px)').matches) $('opgave').scrollIntoView({block: 'nearest', behavior: rolig ? 'auto' : 'smooth'});
  }
}
function udfør(v) {
  if (v.normale) sætForholdUI(NORMALE);
  if (v.phMave !== undefined) {
    sætForholdUI({phMave: v.phMave, galde: v.galde});
    $('hvis').open = !erNormale();
  }
  skiftTil(v.fane);
  if (v.del) vælg(v.del, true);
  if (v.ph !== undefined) sætPh(v.ph, true);
  if (v.trin) { stop(); sætU(tilGlobal(...v.trin)); }
}
$('btn-opgaver').addEventListener('click', () => visOpgaver($('opgave').hidden));
$('opg-luk').addEventListener('click', () => { visOpgaver(false); $('btn-opgaver').focus(); });
$('opg-forrige').addEventListener('click', () => visOpgave(opgNr - 1));
$('opg-næste').addEventListener('click', () => visOpgave(opgNr + 1));
$('opg-prøv').addEventListener('click', () => udfør(OPGAVER[opgNr].vis));
function visForklaring(v) {
  $('opg-forklaring').hidden = !v;
  $('opg-svar').setAttribute('aria-expanded', String(v));
}
$('opg-svar').addEventListener('click', () => visForklaring($('opg-forklaring').hidden));
visOpgave(0);

function trykknap(id, start, gør) {
  const b = $(id);
  b.setAttribute('aria-pressed', String(start));
  b.addEventListener('click', () => {
    const v = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', String(v));
    gør(v);
  });
}
trykknap('btn-krop', true, (v) => vis?.visKrop(v));
trykknap('btn-dæmp', true, (v) => vis?.dæmpAndre(v));
trykknap('btn-fokus', false, (v) => document.body.classList.toggle('fokus', v));
$('btn-nulstil').addEventListener('click', () => vis?.nulstil());

// ---------------------------------------------------------------- 3D
const tip = $('tip');
try {
  const {skabVisning} = await import('./visning.js');
  vis = await skabVisning($('scene'), {
    vedHover(del, x, y) {
      if (!del || !DELE[del]) { tip.hidden = true; return; }
      tip.hidden = false;
      tip.textContent = DELE[del].navn;
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
    },
    vedKlik(del) {
      $('hint').classList.add('væk');
      if (tilstand === 'opbygning') vælg(del && del === valgt ? null : del);
      else if (del && DELE[del]) {
        // i rundturen: spring til trinnet med den del, man klikker på; under pH: brug stedets pH
        const t = TRIN.find((t) => t.dele.includes(del));
        if (t && tilstand === 'forloeb') { stop(); sætU(tilGlobal(t.id, 0.02)); }
        if (t && tilstand === 'enzymer') sætPh(trinPh(t)[1], true);
      }
    },
  });
  vis.dæmpAndre(true);
  $('status').hidden = true;
  $('scene').addEventListener('pointerdown', () => $('hint').classList.add('væk'), {once: true});
} catch (fejl) {
  console.warn('3D-visningen kunne ikke startes:', fejl);
  $('status').hidden = true;
  $('scene').hidden = true;
  $('reserve').hidden = false;
  $('hint').hidden = true;
  $('følg').closest('label').hidden = true;
}
if (location.hash === '#forloeb') skiftTil('forloeb');
if (location.hash === '#enzymer') skiftTil('enzymer');
if (location.hash === '#opgaver') visOpgaver(true);
for (const f of FANER) $('fane-' + f).tabIndex = f === tilstand ? 0 : -1;
