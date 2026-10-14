// Island-tværsnittet (#49, milepæl B): statisk figur, skifteknap og trinvis tekst.
import { tegnTvaersnit } from './tvaersnit.js';
import { overblik, trin, beskrivelse, maerker } from './tekst.js';

const svg = document.querySelector('#tvaersnit');
const figur = document.querySelector('.figur');
const hotspotValg = document.querySelector('#hotspot');
const status = document.querySelector('#status');
const alleTrin = [overblik, ...trin];
const tilstand = { visning: 'ryg', trin: 0, hotspot: true };

// Start i Island-tilstand via adressen (#island), fx fra atlassets markør.
if (location.hash === '#island') tilstand.visning = 'island';

function tegn() {
  const { width, height } = svg.getBoundingClientRect();
  if (!width || !height) return;
  const W = Math.round(width), H = Math.round(height);
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = tegnTvaersnit({ bredde: W, hoejde: H, tilstand: tilstand.visning, hotspot: tilstand.hotspot });
  fremhaev();
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
  svg.classList.toggle('fremhaevet', fundet > 0);
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
  if (tilstand.trin === 6 && tilstand.visning !== 'island') {
    se.append(Object.assign(document.createElement('span'), { className: 'hint', textContent: ' Laget vises kun i tværsnittet af Island.' }));
  }
  for (const k of document.querySelectorAll('[data-trin]')) k.setAttribute('aria-pressed', String(+k.dataset.trin === tilstand.trin));
  document.querySelector('#forrige').disabled = tilstand.trin === 0;
  document.querySelector('#naeste').disabled = tilstand.trin === trin.length;
  fremhaev();
}

function visTilstand() {
  for (const k of document.querySelectorAll('[data-tilstand]')) k.setAttribute('aria-pressed', String(k.dataset.tilstand === tilstand.visning));
  const island = tilstand.visning === 'island';
  document.querySelector('#figurtitel').textContent = island ? 'Tværsnit gennem Island.' : 'Tværsnit af Den Midtatlantiske Ryg.';
  const hotspottekst = island && !tilstand.hotspot ? ' Laget Hotspot (fortolkning) er slået fra.' : '';
  document.querySelector('#figurbeskrivelse').textContent = beskrivelse[tilstand.visning] + hotspottekst;
  hotspotValg.disabled = !island;
  hotspotValg.closest('label').classList.toggle('slukket', !island);
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
  visTrin();
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
hotspotValg.addEventListener('change', () => { tilstand.hotspot = hotspotValg.checked; visTilstand(); });

const fokus = document.querySelector('#fokus');
function saetFokus(til) {
  document.body.classList.toggle('fokus', til);
  fokus.setAttribute('aria-pressed', String(til));
}
fokus.addEventListener('click', () => saetFokus(!document.body.classList.contains('fokus')));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('fokus')) saetFokus(false); });

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
