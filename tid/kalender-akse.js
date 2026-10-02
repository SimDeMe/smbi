// kalender-akse.js — dags- og ugevisning på en lodret tidsakse
//
// De to visninger er den samme figur: en akse med timer i venstre side og
// registreringerne som blokke ved siden af. Dagsvisningen har én kolonne,
// ugevisningen syv — én pr. dag — der deler den samme akse, så en fredag
// eftermiddag kan sammenlignes med resten af ugen på ét blik.

import { esc, capitalize, fmtMins, fmtTime } from './format.js';
import { erPause, PAUSE_NAVN } from './pauser.js';
import { addDays, erIDag, DAGE_KORT } from './periode.js';

// ─── Konstanter ───────────────────────────────────────────
const HOUR_H_DAG = 48;         // px pr. time i dagsvisning
const HOUR_H_UGE = 40;         // ... og i ugevisning, hvor pladsen er trangere
const FRA_H      = 6;          // aksen begynder tidligst her
const TIL_H      = 22;         // ... og slutter senest her, hvis intet andet
// Ugen skal have syv kolonner på samme skærm, så den starter fra et strammere
// vindue og udvider sig kun, hvis ugens registreringer ligger uden for det
const FRA_H_UGE  = 7;
const TIL_H_UGE  = 18;
const SNAP_MIN   = 15;         // afrunding ved tryk på tom plads

// ─── Dagsvisning ──────────────────────────────────────────
export function tegnDag(rod, ctx) {
  const dag   = ctx.start;
  const items = kolonner(blokkeForDag(ctx, dag));
  const vin   = vindue([items], dag, FRA_H, TIL_H);

  rod.innerHTML = `<div class="kal-grid" style="height:${hoejde(vin, HOUR_H_DAG)}px">
      ${timeLinjer(vin, HOUR_H_DAG)}
      <div class="kal-lane" data-dagnr="0">${
        blokke(items, vin, HOUR_H_DAG, true)}${nuLinje(dag, vin, HOUR_H_DAG)}${
        items.length ? '' : tomDag()}</div>
    </div>`;

  bindLane(rod, ctx, [dag], vin, [items]);
}

// ─── Ugevisning ───────────────────────────────────────────
export function tegnUge(rod, ctx) {
  const dage  = Array.from({ length: 7 }, (_, i) => addDays(ctx.start, i));
  const raa   = dage.map(d => blokkeForDag(ctx, d));
  // En registrering hen over midnat må ikke trække hele ugens akse ud til 00 —
  // dens klippede ender tæller ikke med i vinduet, og bagefter klippes den
  // til vinduet og står med '…' ved kanten
  const vin   = vindue(raa, ctx.start, FRA_H_UGE, TIL_H_UGE, true);
  const items = raa.map(dag => kolonner(klipTilVindue(dag, vin)));
  const H     = HOUR_H_UGE;

  const hoved = dage.map((d, i) => {
    const total = items[i].filter(it => !it.isPause)
                          .reduce((s, it) => s + it.durMin, 0);
    return `<button type="button" class="kal-dag-hoved${erIDag(d) ? ' er-i-dag' : ''}"
        data-dato="${d.getTime()}"
        aria-label="Vis ${DAGE_KORT[d.getDay()]}dag den ${d.getDate()}. som dagsvisning">
      <span class="kal-dag-navn">${DAGE_KORT[d.getDay()]}</span>
      <span class="kal-dag-nr">${d.getDate()}</span>
      <span class="kal-dag-total">${total ? fmtMins(Math.round(total)) : '–'}</span>
    </button>`;
  }).join('');

  const baner = dage.map((d, i) => `<div class="kal-bane" data-dagnr="${i}">${
      blokke(items[i], vin, H, false)}${nuLinje(d, vin, H)}</div>`).join('');

  rod.innerHTML = `<div class="kal-uge-rul">
    <div class="kal-uge-inder">
      <div class="kal-uge-hoved"><div class="kal-uge-hjoerne"></div>${hoved}</div>
      <div class="kal-grid kal-grid-uge" style="height:${hoejde(vin, H)}px">
        ${timeLinjer(vin, H)}
        <div class="kal-baner">${baner}</div>
      </div>
    </div>
  </div>`;

  rod.querySelectorAll('.kal-dag-hoved').forEach(b =>
    b.addEventListener('click', () => ctx.vaelgDag(new Date(Number(b.dataset.dato)))));

  bindLane(rod, ctx, dage, vin, items);
}

// ─── Blokke for én dag ────────────────────────────────────
function blokkeForDag(ctx, dagStart) {
  return ctx.poster
    .map(e => tilBlok(e, dagStart, ctx))
    .filter(Boolean)
    .sort((a, b) => a.startMin - b.startMin);
}

function tilBlok(e, dagStart, ctx) {
  if (!e.startTime) return null;
  const dagSlut = addDays(dagStart, 1);
  const dagMin  = Math.round((dagSlut - dagStart) / 60000);   // 1440, undtagen ved sommertidsskift
  const now     = new Date();

  const s        = e.startTime.toDate();
  const isActive = !e.endTime;
  const end      = isActive ? now : e.endTime.toDate();
  if (end <= dagStart || s >= dagSlut) return null;           // uden for dagen

  const isPause = erPause(e);
  const raa     = { start: (s - dagStart) / 60000, end: (end - dagStart) / 60000 };
  const startMin = Math.max(0, Math.round(raa.start));
  const endMin   = Math.min(dagMin, Math.round(raa.end));

  return {
    id:        e.id,
    name:      isPause ? PAUSE_NAVN : ctx.aktivitetNavn(e.activityId),
    color:     ctx.aktivitetFarve(e.activityId),
    isPause,
    workType:  e.workType || null,
    isActive,
    clipTop:    raa.start < 0,
    clipBottom: raa.end > dagMin,
    // Afrundes til hele minutter, så både placering og varigheder bliver pæne
    startMin,
    endMin,
    durMin:    endMin - startMin,   // dagens andel, også hvis blokken klippes til aksen
    // Klippet af aksens vindue (kun ugevisningen) — som clipTop/clipBottom,
    // men tiden ved kanten er stadig den rigtige
    vinTop: false, vinBund: false,
    realStart: s,
    realEnd:   isActive ? null : end,
    col: 0, cols: 1
  };
}

// ─── Overlap: pak blokke i kolonner ───────────────────────
// Blokke der overlapper hinanden samles i en klynge og fordeles på det
// mindst mulige antal kolonner, så alle er synlige ved siden af hinanden.
function kolonner(items) {
  let klynge = [];
  let klyngeSlut = -1;

  const luk = () => {
    if (!klynge.length) return;
    const kolSlut = [];
    klynge.forEach(it => {
      let c = kolSlut.findIndex(slutMin => slutMin <= it.startMin);
      if (c === -1) { kolSlut.push(it.endMin); c = kolSlut.length - 1; }
      else kolSlut[c] = it.endMin;
      it.col = c;
    });
    klynge.forEach(it => { it.cols = kolSlut.length; });
    klynge = [];
  };

  items.forEach(it => {
    // En blok med 0 minutters længde skal stadig kunne ses
    const synligSlut = Math.max(it.endMin, it.startMin + 1);
    if (klynge.length && it.startMin >= klyngeSlut) { luk(); klyngeSlut = -1; }
    klynge.push(it);
    klyngeSlut = Math.max(klyngeSlut, synligSlut);
  });
  luk();
  return items;
}

// ─── Tidsvindue for aksen ─────────────────────────────────
// Alle dage i visningen deler ét vindue, så kolonnerne kan sammenlignes
// Med `klip` udvider en ende, der er klippet ved midnat, ikke vinduet; en
// blok, der begynder om aftenen og fortsætter efter midnat, får dog sin
// første time med, så man kan se, hvornår den begyndte.
function vindue(grupper, foersteDag, fraH, tilH, klip = false) {
  let fra = fraH, til = tilH;
  grupper.forEach(items => items.forEach(it => {
    if (!(klip && it.clipTop))    fra = Math.min(fra, Math.floor(it.startMin / 60));
    if (!(klip && it.clipBottom)) til = Math.max(til, Math.ceil(it.endMin / 60));
    else if (!it.clipTop)         til = Math.max(til, Math.floor(it.startMin / 60) + 1);
  }));
  const idag = grupper.length === 1
    ? erIDag(foersteDag)
    : grupper.some((_, i) => erIDag(addDays(foersteDag, i)));
  if (idag) {
    const n = new Date();
    const m = n.getHours() * 60 + n.getMinutes();
    fra = Math.min(fra, Math.floor(m / 60));
    til = Math.max(til, Math.ceil((m + 30) / 60));
  }
  fra = Math.max(0, fra);
  til = Math.min(24, Math.max(til, fra + 4));
  return { fra, til };
}

// Blokke uden for vinduet trækkes ind til kanten. En blok, der helt ligger
// før vinduet (fx 00:00–00:40 efter en aften, der løb over midnat), bliver en
// stump øverst, så den stadig kan ses og trykkes på.
function klipTilVindue(items, vin) {
  const fra = vin.fra * 60, til = vin.til * 60;
  return items.map(it => {
    if (it.startMin >= fra && it.endMin <= til) return it;
    const startMin = Math.min(Math.max(it.startMin, fra), til);
    const endMin   = Math.max(Math.min(it.endMin, til), startMin);
    return { ...it, startMin, endMin,
             vinTop: it.startMin < fra, vinBund: it.endMin > til };
  });
}

const hoejde = (vin, H) => (vin.til - vin.fra) * H;
const yPos   = (min, vin, H) => (min - vin.fra * 60) * (H / 60);

function timeLinjer(vin, H) {
  let ud = '';
  for (let h = vin.fra; h <= vin.til; h++) {
    ud += `<div class="kal-hour" style="top:${yPos(h * 60, vin, H)}px">
      <span class="kal-hour-lab">${String(h).padStart(2, '0')}</span>
    </div>`;
    if (h < vin.til) ud += `<div class="kal-halfhour" style="top:${yPos(h * 60 + 30, vin, H)}px"></div>`;
  }
  return ud;
}

// ─── Blokke ───────────────────────────────────────────────
function blokke(items, vin, H, bred) {
  return items.map(it => {
    // En pause må gerne blive lavere end en rigtig blok — den skal kunne ses,
    // men ikke skubbe til dagens arbejde
    const h = Math.min(Math.max(it.isPause ? 11 : 16, (it.endMin - it.startMin) * (H / 60)),
                       Math.max(16, hoejde(vin, H) - yPos(it.startMin, vin, H)));
    const w = 100 / it.cols;
    // Varigheden er den del, der ligger inden for dagen — en registrering
    // hen over midnat vises derfor med '…' og kun dagens andel.
    const dur = it.isActive
      ? 'i gang'
      : fmtMins(Math.max(0, Math.round(it.durMin)));
    const tid = it.isActive
      ? fmtTime(it.realStart)
      : `${it.clipTop ? '…' : fmtTime(it.realStart)}–${it.clipBottom ? '…' : fmtTime(it.realEnd)}`;
    // I en smal eller lav blok er der kun plads til navnet
    const visTid = bred && !(h < 34 && it.cols > 1);
    const wt  = it.workType ? ` · ${capitalize(it.workType)}` : '';
    const cls = [
      h < 34 ? 'kal-block-sm' : '',
      bred ? '' : 'kal-block-smal',
      it.isPause ? 'kal-block-pause' : '',
      it.isActive ? 'kal-block-active' : '',
      it.clipTop || it.vinTop ? 'kal-block-clip-top' : '',
      it.clipBottom || it.vinBund ? 'kal-block-clip-bottom' : ''
    ].filter(Boolean).join(' ');

    return `<button type="button" class="kal-block ${cls}" data-id="${it.id}"
        style="top:${yPos(it.startMin, vin, H)}px;height:${h}px;left:${it.col * w}%;width:${w}%;--act-color:${it.color}"
        aria-label="${esc(it.name)}${esc(wt)}, ${tid}, ${dur}">
      <span class="kal-block-title">${esc(it.name)}<span class="kal-block-wt">${esc(wt)}</span></span>
      ${visTid ? `<span class="kal-block-time">${tid} · ${dur}</span>` : ''}
    </button>`;
  }).join('');
}

function nuLinje(dag, vin, H) {
  if (!erIDag(dag)) return '';
  const n = new Date();
  const m = n.getHours() * 60 + n.getMinutes();
  if (m < vin.fra * 60 || m > vin.til * 60) return '';
  return `<div class="kal-now" style="top:${yPos(m, vin, H)}px"><span class="kal-now-dot"></span></div>`;
}

const tomDag = () => `<div class="kal-empty">Ingen registreringer denne dag<br>
  <span>Tryk på tidsaksen for at oprette en</span></div>`;

// ─── Tryk på aksen ────────────────────────────────────────
function bindLane(rod, ctx, dage, vin, grupper) {
  const H = dage.length > 1 ? HOUR_H_UGE : HOUR_H_DAG;

  rod.querySelectorAll('.kal-block').forEach(b =>
    b.addEventListener('click', ev => { ev.stopPropagation(); ctx.aabnPost(b.dataset.id); }));

  rod.querySelectorAll('.kal-lane,.kal-bane').forEach(bane => {
    bane.addEventListener('click', ev => {
      if (ev.target.closest('.kal-block')) return;
      const nr    = Number(bane.dataset.dagnr) || 0;
      const rect  = bane.getBoundingClientRect();
      const min   = vin.fra * 60 + (ev.clientY - rect.top) / (H / 60);
      const start = startFraTryk(min, grupper[nr]);
      ctx.nyPost(dage[nr], start, start + 60);
    });
  });
}

// Trykker man lige under en registrering, skal den nye post begynde, hvor den
// forrige slap — ellers ville afrundingen til 15 min lande inde i blokken
// ovenover, fordi et modul sjældent slutter på et kvarter (fx 11:35).
// Længere nede på aksen afrundes som før.
function startFraTryk(min, items) {
  const snap = Math.max(0, Math.floor(min / SNAP_MIN) * SNAP_MIN);

  // Sidste registrering, der slutter over trykket — en igangværende post har
  // ingen slutning at knytte an til
  let forrigeSlut = -1;
  items.forEach(it => {
    if (it.isActive || it.endMin > min) return;
    forrigeSlut = Math.max(forrigeSlut, it.endMin);
  });
  if (forrigeSlut < 0) return snap;

  const ligeUnder = min - forrigeSlut <= SNAP_MIN;   // trykket lige under blokken
  return ligeUnder || snap < forrigeSlut ? forrigeSlut : snap;
}
