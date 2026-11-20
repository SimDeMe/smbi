// Fordøjelsessystemet: binder 3D-visningen, organlisten og rundturen sammen.
import {DELE, LISTE, TRIN, FARVER, fraGlobal, tilGlobal} from './indhold.js';
import {skabMolekyler} from './molekyler.js';

const $ = (id) => document.getElementById(id);
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
    $('trin-navn').textContent = trin.navn;
    $('trin-mek').textContent = trin.mekanisk;
    const kem = $('trin-kem');
    kem.textContent = '';
    if (!trin.kemisk.length) kem.textContent = '—';
    trin.kemisk.forEach(([enzym, hvad], k) => {
      if (k) kem.appendChild(document.createElement('br'));
      const b = document.createElement('b');
      b.textContent = enzym;
      kem.append(b, ': ' + hvad);
    });
    $('trin-optag').textContent = trin.optag || 'Næsten intet';
    $('trin-note').textContent = trin.note || '';
    [...trinliste.querySelectorAll('button')].forEach((b, k) => {
      if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.classList.toggle('forbi', k < i);
    });
    vis?.aktiv(trin.dele);
    vis?.glas(trin.dele.filter((d) => KANAL.has(d)));
  }
  const [p0, p1] = trin.ph;
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

// ---------------------------------------------------------------- faner og knapper
function skiftTil(ny) {
  tilstand = ny;
  const forløb = ny === 'forloeb';
  $('fane-opbygning').setAttribute('aria-selected', String(!forløb));
  $('fane-forloeb').setAttribute('aria-selected', String(forløb));
  $('panel-opbygning').hidden = forløb;
  $('panel-forloeb').hidden = !forløb;
  $('afspil').hidden = !forløb;
  $('btn-dæmp').hidden = forløb;
  if (forløb) {
    vis?.vælg(null);
    forrigeTrin = -1;
    sætU(u);
  } else {
    stop();
    vis?.klump(null);
    vis?.aktiv([]);
    vis?.glas([]);
    vis?.vælg(valgt);
  }
}
$('fane-opbygning').addEventListener('click', () => skiftTil('opbygning'));
$('fane-forloeb').addEventListener('click', () => skiftTil('forloeb'));
document.querySelector('.seg').addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const ny = tilstand === 'opbygning' ? 'forloeb' : 'opbygning';
  skiftTil(ny);
  $(ny === 'forloeb' ? 'fane-forloeb' : 'fane-opbygning').focus();
});

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
        // i rundturen: spring til trinnet med den del, man klikker på
        const t = TRIN.find((t) => t.dele.includes(del));
        if (t) { stop(); sætU(tilGlobal(t.id, 0.02)); }
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
