/* ─────────────────────────────────────────────────────────
   smbi.dk — forside: levende diagram i heroen
   Skifter mellem atlassets cirkulationsglobus og et udsnit af
   kapløbet fra jordskælvsbølgerne. Begge bruger simuleringernes
   egne moduler; kun betjeningen er skåret væk.
   ───────────────────────────────────────────────────────── */
import { tegnKaploeb, aflaes, TSLUT } from './forside-kaploeb.js';
import { maanedsnavn, solbredde, itkBredde } from './atlas/cirkulation/model.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rig = document.getElementById('rig');
const lag = { globus: document.getElementById('fig-globus'), kaploeb: document.getElementById('fig-kaploeb') };
const out = ['1', '2', '3'].map(i => ({ k: document.getElementById(`out${i}-k`), v: document.getElementById(`out${i}-v`) }));
const tabs = [...document.querySelectorAll('.rig-tab')];
const rigName = document.getElementById('rig-name'), rigLink = document.getElementById('rig-link');

const SIM = {
  globus: { navn: 'Global cirkulation', url: 'atlas/cirkulation/', accent: 'var(--geo)' },
  kaploeb: { navn: 'Jordskælvsbølger · kapløbet', url: 'atlas/jordskaelvsboelger-b/', accent: 'var(--coral)' },
};
const grad = b => `${Math.abs(b).toFixed(0)}° ${b >= 0 ? 'N' : 'S'}`;
function vis(raekker) {
  raekker.forEach(([k, v], i) => { out[i].k.textContent = k; out[i].v.textContent = v; });
}

/* ── Globussen: atlassets egen, med måneden der går rundt ── */
// Midt over Afrika og Det Indiske Ocean, så både ITK og monsunen kan ses.
const LAENGDE = 45;
const tilstand = {
  maaned: 4, rotation: 1, kontinenter: 1, etiketter: true, celler: true, luftringe: true, klimalag: null,
  pause: reduce, fremhaev: null, koreo: null, solMaaned: null, koreoTekst: '', afboejning: 1, koreoPile: 0,
};
let globus = null;
async function lavGlobus() {
  if (!window.d3?.geoOrthographic || !window.topojson?.feature) throw new Error('Kortbiblioteket mangler');
  const [{ lavGlobus }, svar] = await Promise.all([
    import('./atlas/cirkulation/globus.js'),
    fetch('atlas/data/countries-110m.json'),
  ]);
  if (!svar.ok) throw new Error('Kortdata mangler');
  const topo = await svar.json();
  const g = lavGlobus(lag.globus, window.topojson.feature(topo, topo.objects.countries), () => tilstand);
  g.flyvTil(LAENGDE, 8);
  g.trin(1, 0);
  // Vindbæltenavnene dækker kloden, når den er lille.
  const tilpas = () => { tilstand.etiketter = lag.globus.clientWidth > 440; g.tilpas(); g.rydSpor(); };
  new ResizeObserver(tilpas).observe(lag.globus);
  tilpas();
  return g;
}
function visGlobus() {
  const m = tilstand.maaned;
  vis([['Måned', maanedsnavn(Math.floor(m))], ['Sol i zenit', grad(solbredde(m))], ['ITK ved 45° Ø', grad(itkBredde(m, LAENGDE, 1))]]);
}

/* ── Kapløbet ── */
let tk = 0;
function visKaploeb() {
  const a = aflaes(tk);
  vis([['Efter skælvet', a.tid], ['Seismografen', a.ved], ['S − P', a.sp]]);
}

/* ── Skift ── */
let mode = 'globus', userPicked = false, hold = 0, tid = 0;
function apply(m) {
  if (m === 'globus' && !globus) return;
  mode = m;
  rig.style.setProperty('--accent', SIM[m].accent);
  for (const [navn, el] of Object.entries(lag)) el.classList.toggle('vist', navn === m);
  tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.mode === m)));
  rigName.textContent = SIM[m].navn;
  rigLink.setAttribute('href', SIM[m].url);
  hold = 0;
  if (m === 'kaploeb') { tk = reduce ? TSLUT : 0; tegnKaploeb(lag.kaploeb, tk); visKaploeb(); }
  else { globus.rydSpor(); globus.trin(0, tid); visGlobus(); }
}
tabs.forEach(t => t.addEventListener('click', () => { userPicked = true; apply(t.dataset.mode); }));
new ResizeObserver(() => { if (mode === 'kaploeb') tegnKaploeb(lag.kaploeb, tk); }).observe(lag.kaploeb);

try { globus = await lavGlobus(); }
catch (e) { tabs.find(t => t.dataset.mode === 'globus').hidden = true; }
apply(globus ? 'globus' : 'kaploeb');

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (document.hidden) return requestAnimationFrame(loop);
  if (mode === 'globus') {
    if (!reduce) { tid += dt; tilstand.maaned = (tilstand.maaned - 1 + dt * 0.7) % 12 + 1; }
    globus.trin(reduce ? 0 : dt, tid);
    visGlobus();
    hold += dt;
    if (!userPicked && hold > 16) apply('kaploeb');
  } else {
    // Samme tempo som i simuleringen: 11 s modeltid pr. sekund.
    if (tk < TSLUT) { tk = Math.min(TSLUT, tk + dt * 11); tegnKaploeb(lag.kaploeb, tk); visKaploeb(); }
    else if ((hold += dt) > 4) userPicked || !globus ? apply('kaploeb') : apply('globus');
  }
  requestAnimationFrame(loop);
}
if (!reduce) requestAnimationFrame(loop);
else if (globus) globus.trin(0, 0);
