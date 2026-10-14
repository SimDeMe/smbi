// Island-tværsnittet (#49): figur, skifteknap og trinvis tekst (milepæl B),
// lag, 2D/3D-blok med drejning og illustrativ animation (milepæl C).
import { tegnTvaersnit, bevaegelse } from './tvaersnit.js';
import { tegnOverside, tegnSide, transformation, kanTreD, begraens, GRAENSER, STANDARD } from './blok.js';
import { overblik, trin, beskrivelse, maerker } from './tekst.js';

const svg = document.querySelector('#tvaersnit');
const figur = document.querySelector('.figur');
const scene = document.querySelector('.scene');
const blok = document.querySelector('.blok');
const flader = { top: blok.querySelector('.overside'), oest: blok.querySelector('.oest'), vest: blok.querySelector('.vest') };
const hotspotValg = document.querySelector('#hotspot');
const lagValg = [...document.querySelectorAll('[data-vislag]')];
const status = document.querySelector('#status');
const afspilKnap = document.querySelector('#afspil');
const alleTrin = [overblik, ...trin];
const roligt = matchMedia('(prefers-reduced-motion: reduce)');
const tilstand = {
  visning: 'ryg', trin: 0, skjul: new Set(),
  treD: false, drej: STANDARD.drej, hæld: STANDARD.hæld,
  spiller: false, tid: 0, startet: false
};
const lagnavn = Object.fromEntries(lagValg.map(v => [v.dataset.vislag, v.closest('label').textContent.trim()]));
let maal = { W: 0, H: 0 };
const SMAL_FIGUR = 620; // samme grænse som @container i island.css

// Start i Island-tilstand via adressen (#island), fx fra atlassets markør.
if (location.hash === '#island') tilstand.visning = 'island';

const tegneinfo = () => ({ bredde: maal.W, hoejde: maal.H, tilstand: tilstand.visning, skjul: tilstand.skjul });

function tegn() {
  const { width, height } = figur.getBoundingClientRect();
  if (!width || !height) return;
  maal = { W: Math.round(width), H: Math.round(height) };
  const { W, H } = maal;
  for (const e of [blok, svg]) Object.assign(e.style, { width: W + 'px', height: H + 'px' });
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = tegnTvaersnit({ ...tegneinfo(), tid: tilstand.tid, spor: tilstand.startet });
  if (tilstand.treD) tegnBlok();
  fremhaev();
}

function tegnBlok() {
  const { W, H } = maal;
  const t = transformation({ bredde: W, hoejde: H, drej: tilstand.drej, hæld: tilstand.hæld });
  const D = t.dybde, hav = Math.round(H * .17);
  flader.top.setAttribute('viewBox', `0 0 ${W} ${D}`);
  Object.assign(flader.top.style, { width: W + 'px', height: D + 'px', top: (hav - D) + 'px' });
  flader.top.innerHTML = tegnOverside(tegneinfo());
  for (const side of ['oest', 'vest']) {
    flader[side].setAttribute('viewBox', `0 0 ${D} ${H}`);
    Object.assign(flader[side].style, { width: D + 'px', height: H + 'px', left: (side === 'oest' ? W : -D) + 'px' });
    flader[side].innerHTML = tegnSide({ ...tegneinfo(), side });
  }
  drej();
}

function drej() {
  if (!tilstand.treD) { blok.style.transform = ''; scene.style.perspective = ''; return; }
  // I en smal figur står drejeknapperne 2×2 forneden (se island.css). Er figuren
  // også høj (mobil på højkant), er blokken begrænset af bredden, og den kan
  // holde sig over knapperne uden at blive meget mindre.
  const bund = maal.W <= SMAL_FIGUR && maal.H > maal.W ? 104 : 0;
  const t = transformation({ bredde: maal.W, hoejde: maal.H, drej: tilstand.drej, hæld: tilstand.hæld, bund });
  scene.style.perspective = t.perspektiv + 'px';
  blok.style.transformOrigin = t.oprindelse;
  blok.style.transform = t.transform;
}

function fremhaev() {
  // Findes trinnets lag ikke i denne tilstand (hotspot ved ryggen), tones intet ned.
  const lag = alleTrin[tilstand.trin].lag;
  let fundet = 0;
  for (const g of svg.querySelectorAll('[data-lag]')) {
    const aktiv = lag.includes(g.dataset.lag);
    g.classList.toggle('aktiv', aktiv);
    fundet += aktiv;
  }
  for (const flade of [svg, ...Object.values(flader)]) {
    flade.classList.toggle('fremhaevet', fundet > 0);
    if (flade !== svg) for (const g of flade.querySelectorAll('[data-lag]')) g.classList.toggle('aktiv', lag.includes(g.dataset.lag));
  }
}

function visTrin() {
  const t = alleTrin[tilstand.trin];
  document.querySelector('#trintitel').textContent = tilstand.trin ? `Trin ${tilstand.trin} · ${t.titel}` : t.titel;
  const tekst = document.querySelector('#trintekst');
  tekst.replaceChildren(...t.tekst.map(s => Object.assign(document.createElement('p'), { textContent: s })));
  const se = document.querySelector('#seefter');
  se.replaceChildren();
  if (tilstand.trin) se.append(Object.assign(document.createElement('em'), { textContent: 'Se efter:' }), ' ' + t.seEfter);
  else se.textContent = t.seEfter;
  const hint = tekst => se.append(Object.assign(document.createElement('span'), { className: 'hint', textContent: tekst }));
  if (tilstand.trin === 6) hint(tilstand.visning === 'island' ? ' Du finder det under «Lag».' : ' Laget vises kun i tværsnittet af Island.');
  for (const k of document.querySelectorAll('[data-trin]')) k.setAttribute('aria-pressed', String(+k.dataset.trin === tilstand.trin));
  document.querySelector('#forrige').disabled = tilstand.trin === 0;
  document.querySelector('#naeste').disabled = tilstand.trin === trin.length;
  fremhaev();
}

function visTilstand() {
  for (const k of document.querySelectorAll('[data-tilstand]')) k.setAttribute('aria-pressed', String(k.dataset.tilstand === tilstand.visning));
  const island = tilstand.visning === 'island';
  document.querySelector('#figurtitel').textContent = island ? 'Tværsnit gennem Island.' : 'Tværsnit af Den Midtatlantiske Ryg.';
  const skjulte = [...tilstand.skjul].filter(l => island || l !== 'hotspot').map(l => lagnavn[l]);
  const lagtekst = skjulte.length === 1 ? ` Laget ${skjulte[0]} er slået fra.`
    : skjulte.length ? ` Disse lag er slået fra: ${skjulte.join(', ')}.` : '';
  document.querySelector('#figurbeskrivelse').textContent = beskrivelse[tilstand.visning] + lagtekst;
  hotspotValg.disabled = !island;
  hotspotValg.closest('label').classList.toggle('slukket', !island);
  for (const v of lagValg) v.checked = !tilstand.skjul.has(v.dataset.vislag);
  tegn();
  visTrin();
}

function skiftTilstand(ny) {
  if (ny === tilstand.visning) return;
  tilstand.visning = ny;
  history.replaceState(null, '', ny === 'island' ? '#island' : location.pathname + location.search);
  visTilstand();
  status.textContent = ny === 'island' ? 'Viser Island.' : 'Viser Den Midtatlantiske Ryg.';
}

function vaelgTrin(n) {
  tilstand.trin = Math.max(0, Math.min(trin.length, n));
  // Trinnets lag vises, så «Se efter» altid peger på noget synligt.
  const skjulte = alleTrin[tilstand.trin].lag.filter(l => tilstand.skjul.delete(l === 'graense' ? 'plader' : l));
  if (skjulte.length) visTilstand(); else visTrin();
}

// Trinknapper dannes fra teksten.
const nav = document.querySelector('.trinvalg');
trin.forEach((t, i) => {
  const k = document.createElement('button');
  k.dataset.trin = i + 1;
  k.textContent = i + 1;
  k.setAttribute('aria-label', `Trin ${i + 1}: ${t.titel}`);
  k.setAttribute('aria-pressed', 'false');
  nav.append(k);
});
nav.addEventListener('click', e => { const k = e.target.closest('[data-trin]'); if (k) vaelgTrin(+k.dataset.trin); });
document.querySelector('#forrige').addEventListener('click', () => vaelgTrin(tilstand.trin - 1));
document.querySelector('#naeste').addEventListener('click', () => vaelgTrin(tilstand.trin + 1));
document.querySelector('.skift').addEventListener('click', e => { const k = e.target.closest('[data-tilstand]'); if (k) skiftTilstand(k.dataset.tilstand); });

// Lag: vis/skjul. Panelet lukkes med Escape eller klik udenfor.
const lagknap = document.querySelector('#lagknap'), lagpanel = document.querySelector('#lagpanel');
function aabnLag(til) {
  lagpanel.hidden = !til;
  lagknap.setAttribute('aria-expanded', String(til));
}
lagknap.addEventListener('click', () => aabnLag(lagpanel.hidden));
lagpanel.addEventListener('change', e => {
  const v = e.target.closest('[data-vislag]');
  if (!v) return;
  tilstand.skjul[v.checked ? 'delete' : 'add'](v.dataset.vislag);
  visTilstand();
  status.textContent = `${lagnavn[v.dataset.vislag]} ${v.checked ? 'vises' : 'er skjult'}.`;
});
document.addEventListener('click', e => { if (!lagpanel.hidden && !e.target.closest('.lagvalg')) aabnLag(false); });

// 2D/3D og drejning. 2D er tværsnittet lige forfra; 3D er en blok, der kan drejes.
const visningsknapper = [...document.querySelectorAll('[data-visning]')];
const drejeknapper = document.querySelector('.drejeknapper');
function saetTreD(til, meddel = true) {
  if (til && !kanTreD()) return;
  tilstand.treD = til;
  figur.classList.toggle('tre-d', til);
  for (const k of visningsknapper) k.setAttribute('aria-pressed', String((k.dataset.visning === '3d') === til));
  drejeknapper.hidden = !til;
  document.querySelector('.skematisk span').textContent = til ? ' · blok, drejet' : ' · set fra syd';
  if (til) tegnBlok(); else drej();
  if (meddel) status.textContent = til ? 'Viser blokken i 3D. Drej med piletasterne eller knapperne.' : 'Viser tværsnittet i 2D.';
}
function drejMed(dDrej, dHæld) {
  if (!tilstand.treD) saetTreD(true);
  tilstand.drej = begraens(tilstand.drej + dDrej, GRAENSER.drej);
  tilstand.hæld = begraens(tilstand.hæld + dHæld, GRAENSER.hæld);
  drej();
}
if (!kanTreD()) {
  const k = visningsknapper.find(k => k.dataset.visning === '3d');
  k.disabled = true;
  k.title = 'Din browser kan ikke vise 3D. Tværsnittet i 2D viser det samme.';
}
document.querySelector('.visning').addEventListener('click', e => {
  const k = e.target.closest('[data-visning]');
  if (k) saetTreD(k.dataset.visning === '3d');
});
drejeknapper.addEventListener('click', e => {
  const k = e.target.closest('[data-drej]');
  if (!k) return;
  const [a, b] = k.dataset.drej.split(',').map(Number);
  drejMed(a * 15, b * 10);
});
scene.addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey || !kanTreD()) return;
  const trinvis = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] }[e.key];
  if (trinvis) { e.preventDefault(); drejMed(...trinvis); }
  else if (e.key === 'Home') {
    e.preventDefault();
    Object.assign(tilstand, STANDARD);
    if (tilstand.treD) drej(); else saetTreD(true);
  }
});
// Træk vandret i figuren for at dreje. Lodret træk ruller siden som normalt
// på touch; med mus ændrer det, hvor meget ovenfra blokken ses.
let træk = null;
scene.addEventListener('pointerdown', e => {
  if (!kanTreD() || e.button > 0) return;
  træk = { x: e.clientX, y: e.clientY, id: e.pointerId, mus: e.pointerType === 'mouse', i_gang: false };
});
scene.addEventListener('pointermove', e => {
  if (!træk || e.pointerId !== træk.id) return;
  if (træk.mus && !e.buttons) return slipTræk();
  const dx = e.clientX - træk.x, dy = e.clientY - træk.y;
  if (!træk.i_gang && Math.hypot(dx, dy) < 6) return;
  if (!træk.i_gang) { træk.i_gang = true; scene.setPointerCapture(e.pointerId); figur.classList.add('traekker'); }
  træk.x = e.clientX; træk.y = e.clientY;
  drejMed(dx * .35, træk.mus ? -dy * .25 : 0);
});
const slipTræk = () => { træk = null; figur.classList.remove('traekker'); };
scene.addEventListener('pointerup', slipTræk);
scene.addEventListener('pointercancel', slipTræk);

// Illustrativ animation. Kun de bevægelige dele opdateres billede for billede.
let sidst = 0, ramme = 0;
function opdaterBevaegelse() {
  const b = bevaegelse({ bredde: maal.W, hoejde: maal.H, tilstand: tilstand.visning, tid: tilstand.tid, spor: true });
  for (const g of svg.querySelectorAll('[data-anim]')) g.innerHTML = b[g.dataset.anim];
}
function billede(nu) {
  if (!tilstand.spiller) return;
  tilstand.tid += Math.min(.1, (nu - (sidst || nu)) / 1000);
  sidst = nu;
  opdaterBevaegelse();
  ramme = requestAnimationFrame(billede);
}
function afspil(til) {
  tilstand.spiller = til;
  afspilKnap.setAttribute('aria-pressed', String(til));
  afspilKnap.querySelector('.tekst').textContent = til ? 'Pause' : 'Afspil';
  afspilKnap.querySelector('.ikon').textContent = til ? '❚❚' : '▶';
  cancelAnimationFrame(ramme);
  if (til) {
    if (!tilstand.startet) { tilstand.startet = true; tegn(); }
    document.querySelector('.tidsmaerke').hidden = false;
    sidst = 0;
    ramme = requestAnimationFrame(billede);
  }
}
afspilKnap.addEventListener('click', () => {
  afspil(!tilstand.spiller);
  status.textContent = tilstand.spiller ? 'Animationen kører. Tiden er sat op.' : 'Animationen er sat på pause.';
});

const fokus = document.querySelector('#fokus');
function saetFokus(til) {
  document.body.classList.toggle('fokus', til);
  fokus.setAttribute('aria-pressed', String(til));
}
fokus.addEventListener('click', () => saetFokus(!document.body.classList.contains('fokus')));
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!lagpanel.hidden) { aabnLag(false); lagknap.focus(); }
  else if (document.body.classList.contains('fokus')) saetFokus(false);
});

document.querySelector('#maerker').append(...maerker.map(([p, m]) => {
  const r = document.createElement('tr');
  r.innerHTML = '<td></td><td></td>';
  r.cells[0].textContent = p;
  r.cells[1].textContent = m;
  return r;
}));

let ventende = 0;
new ResizeObserver(() => { cancelAnimationFrame(ventende); ventende = requestAnimationFrame(tegn); }).observe(figur);
visTilstand();
// Ved reduced motion starter animationen på pause; trinnene giver samme forståelse.
afspil(!roligt.matches);
