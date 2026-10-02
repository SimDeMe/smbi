// kalender-oversigt.js — måneds- og årsvisning
//
// En måned eller et helt skoleår kan ikke vises på en tidsakse — der ville
// blokkene blive tyndere end en streg. I stedet vises tidsforbruget som
// mængde: hver dag er et felt, hvis farve bliver kraftigere, jo mere tid der
// er registreret, og under gitteret står fordelingen på aktiviteter. Så kan
// man se travle uger, ferier og skæve fordelinger på ét blik.

import { esc, fmtMins } from './format.js';
import {
  addDays, dageIMaaned, erIDag, kortTimer,
  MAANEDER, MAANEDER_KORT, UGEDAGE_KORT, mandag, ugeNr, langDato
} from './periode.js';

// ─── Månedsvisning ────────────────────────────────────────
export function tegnMaaned(rod, ctx) {
  const foerste = new Date(ctx.start.getFullYear(), ctx.start.getMonth(), 1);
  const antal   = dageIMaaned(foerste);
  const dage    = Array.from({ length: antal }, (_, i) => addDays(foerste, i));
  const maxDag  = Math.max(1, ...dage.map(d => ctx.dag(d).total));

  // Gitteret begynder på ugens mandag, så ugerne står som rækker
  const gitterStart = mandag(foerste);
  const uger = [];
  for (let u = gitterStart; u <= dage[antal - 1]; u = addDays(u, 7)) uger.push(u);

  const hoved = `<div class="kal-md-hoved">
      <div class="kal-md-ugekol mono">Uge</div>
      ${UGEDAGE_KORT.map(n => `<div class="kal-md-dagnavn mono">${n}</div>`).join('')}
    </div>`;

  const raekker = uger.map(u => {
    const ugeDage  = Array.from({ length: 7 }, (_, i) => addDays(u, i));
    const ugeTotal = ugeDage.reduce((s, d) => s + ctx.dag(d).total, 0);
    const celler   = ugeDage.map(d => dagCelle(d, ctx, maxDag, foerste.getMonth())).join('');
    return `<div class="kal-md-raekke">
      <button type="button" class="kal-md-uge" data-dato="${u.getTime()}"
          aria-label="Vis uge ${ugeNr(u)} som ugevisning, ${ugeTotal ? fmtMins(ugeTotal) : 'ingen tid'}">
        <span class="kal-md-ugenr">${ugeNr(u)}</span>
        <span class="kal-md-ugetid">${ugeTotal ? kortTimer(ugeTotal) : '–'}</span>
      </button>
      ${celler}
    </div>`;
  }).join('');

  rod.innerHTML = `<div class="kal-md">${hoved}${raekker}</div>
    ${fordeling(ctx, `Ingen registreringer i ${MAANEDER[foerste.getMonth()]}`)}`;

  bindSpring(rod, ctx);
}

function dagCelle(d, ctx, maxDag, maaned) {
  if (d.getMonth() !== maaned)
    return `<div class="kal-md-dag kal-md-dag-uden" aria-hidden="true"></div>`;

  const data  = ctx.dag(d);
  const fyld  = Math.round(data.total / maxDag * 68);   // loft, så dagtallet stadig kan læses
  const cls   = [
    'kal-md-dag',
    erIDag(d) ? 'er-i-dag' : '',
    data.total ? '' : 'er-tom'
  ].filter(Boolean).join(' ');

  return `<button type="button" class="${cls}" data-dato="${d.getTime()}"
      style="--fyld:${fyld}%"
      aria-label="${langDato(d)}: ${data.total ? fmtMins(data.total) : 'ingen registreringer'}">
    <span class="kal-md-nr">${d.getDate()}</span>
    <span class="kal-md-tid">${data.total ? kortTimer(data.total) : ''}</span>
    ${stribe(data, ctx)}
  </button>`;
}

// Tynd stribe i aktiviteternes farver — farve er aldrig eneste signal, men
// den viser hvilke opgaver dagen gik med, når tallet kun siger hvor meget
function stribe(data, ctx) {
  if (!data.total) return '<span class="kal-md-stribe"></span>';
  const dele = [...data.akt.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, min]) =>
      `<i style="flex:${min};background:${ctx.aktivitetFarve(id)}"></i>`).join('');
  return `<span class="kal-md-stribe">${dele}</span>`;
}

// ─── Årsvisning ───────────────────────────────────────────
export function tegnAar(rod, ctx) {
  const maaneder = [];
  const sidsteDag = addDays(ctx.slut, -1);
  for (let m = new Date(ctx.start.getFullYear(), ctx.start.getMonth(), 1);
       m <= sidsteDag;
       m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) maaneder.push(m);

  // Dagsfelterne skaleres efter årets travleste dag, søjlerne efter dets
  // travleste måned — ellers ville en enkelt lang dag gøre alt andet blegt
  let maxDag = 1, maxMaaned = 1;
  const totaler = maaneder.map(m => {
    let sum = 0;
    for (let i = 0; i < dageIMaaned(m); i++) {
      const t = ctx.dag(addDays(m, i)).total;
      sum += t;
      if (t > maxDag) maxDag = t;
    }
    if (sum > maxMaaned) maxMaaned = sum;
    return sum;
  });

  const raekker = maaneder.map((m, i) => {
    const antal = dageIMaaned(m);
    const felter = Array.from({ length: 31 }, (_, k) => {
      if (k >= antal) return `<i class="kal-aar-dag kal-aar-dag-uden"></i>`;
      const d = addDays(m, k);
      const t = ctx.dag(d).total;
      return `<i class="kal-aar-dag${erIDag(d) ? ' er-i-dag' : ''}"
        style="--fyld:${Math.round(t / maxDag * 100)}%"></i>`;
    }).join('');

    const navn = MAANEDER_KORT[m.getMonth()]
               + (i === 0 || m.getMonth() === 0 ? ` ${String(m.getFullYear()).slice(2)}` : '');

    return `<button type="button" class="kal-aar-md" data-dato="${m.getTime()}"
        aria-label="Vis ${MAANEDER[m.getMonth()]} ${m.getFullYear()} som månedsvisning, ${
          totaler[i] ? fmtMins(totaler[i]) : 'ingen tid'}">
      <span class="kal-aar-navn mono">${navn}</span>
      <span class="kal-aar-heat">${felter}</span>
      <span class="kal-aar-total">
        <b>${totaler[i] ? kortTimer(totaler[i]) : '–'}</b>
        <span class="kal-aar-total-bar" style="width:${Math.round(totaler[i] / maxMaaned * 100)}%"></span>
      </span>
    </button>`;
  }).join('');

  rod.innerHTML = `<div class="kal-aar">${raekker}
      <div class="kal-aar-skala mono">
        <span>Mindre</span>
        <i style="--fyld:8%"></i><i style="--fyld:33%"></i>
        <i style="--fyld:66%"></i><i style="--fyld:100%"></i>
        <span>Mere</span>
        <span class="kal-aar-skala-max enhed">1 felt = 1 dag · mørkest ≈ ${kortTimer(maxDag)}</span>
      </div>
    </div>
    ${fordeling(ctx, 'Ingen registreringer i dette skoleår')}`;

  bindSpring(rod, ctx);
}

// ─── Fordeling på aktiviteter ─────────────────────────────
// Den samme figur under både måned og år: én stribe med hele periodens tid,
// delt op efter aktivitet, og en signaturforklaring med tal.
function fordeling(ctx, tomTekst) {
  const sum = new Map();
  let total = 0;
  for (let d = new Date(ctx.start); d < ctx.slut; d = addDays(d, 1)) {
    const data = ctx.dag(d);
    total += data.total;
    data.akt.forEach((min, id) => sum.set(id, (sum.get(id) || 0) + min));
  }
  if (!total) return `<div class="kal-tom">${tomTekst}</div>`;

  const dele = [...sum.entries()].sort((a, b) => b[1] - a[1]);
  const vis  = dele.slice(0, 6);
  const rest = dele.slice(6).reduce((s, r) => s + r[1], 0);
  if (rest > 0) vis.push(['__rest', rest]);

  const navn  = id => id === '__rest' ? 'Andre' : ctx.aktivitetNavn(id);
  const farve = id => id === '__rest' ? 'var(--border)' : ctx.aktivitetFarve(id);

  const bar = vis.map(([id, min]) =>
    `<i style="flex:${min};background:${farve(id)}" title="${esc(navn(id))}"></i>`).join('');

  const liste = vis.map(([id, min]) => `<div class="legend-item">
      <div class="legend-dot" style="background:${farve(id)}"></div>
      <div class="legend-name">${esc(navn(id))}</div>
      <div class="legend-pct">${fmtMins(min)} · ${Math.round(min / total * 100)}%</div>
    </div>`).join('');

  return `<div class="kal-fordeling">
    <div class="kal-fordeling-head mono">Pr. aktivitet</div>
    <div class="kal-fordeling-bar">${bar}</div>
    <div class="rapport-legend">${liste}</div>
  </div>`;
}

// ─── Spring til en kortere periode ────────────────────────
function bindSpring(rod, ctx) {
  rod.querySelectorAll('.kal-md-dag[data-dato]').forEach(b =>
    b.addEventListener('click', () => ctx.vaelgDag(new Date(Number(b.dataset.dato)))));
  rod.querySelectorAll('.kal-md-uge').forEach(b =>
    b.addEventListener('click', () => ctx.vaelgUge(new Date(Number(b.dataset.dato)))));
  rod.querySelectorAll('.kal-aar-md').forEach(b =>
    b.addEventListener('click', () => ctx.vaelgMaaned(new Date(Number(b.dataset.dato)))));
}
