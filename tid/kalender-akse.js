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
const TRAEK_MIN  = 5;          // afrunding, når en blok trækkes med musen

// ─── Dagsvisning ──────────────────────────────────────────
export function tegnDag(rod, ctx) {
  const dag   = ctx.start;
  const items = kolonner(blokkeForDag(ctx, dag));
  const vin   = vindue([items], dag, FRA_H, TIL_H);
  const H     = HOUR_H_DAG * ctx.zoom;

  rod.innerHTML = `<div class="kal-dag-ramme">
    <div class="kal-grid" style="height:${hoejde(vin, H)}px">
      ${timeLinjer(vin, H)}
      <div class="kal-lane" data-dagnr="0">${
        blokke(items, vin, H, true)}${nuLinje(dag, vin, H)}${
        items.length ? '' : tomDag()}</div>
    </div>
    ${dagListe(items)}
  </div>`;

  bindLane(rod, ctx, [dag], vin, [items]);
  bindDagListe(rod, ctx);
}

// ─── Dagens registreringer som liste ──────────────────────
// På en bred skærm står dagens poster også som rækker ved siden af aksen.
// En pause på fem minutter er få pixel høj på aksen; som række er den lige
// så nem at ramme som et modul. Under 1000 px skjuler CSS listen — der er
// fanen «Liste» i stedet.
function dagListe(items) {
  if (!items.length) return '';
  const raekker = items.map(it => {
    const tid = it.isActive
      ? `${fmtTime(it.realStart)}–`
      : `${it.clipTop ? '…' : fmtTime(it.realStart)}–${it.clipBottom ? '…' : fmtTime(it.realEnd)}`;
    const dur = it.isActive ? 'i gang' : fmtMins(Math.max(0, Math.round(it.durMin)));
    const wt  = it.workType ? ` · ${capitalize(it.workType)}` : '';
    return `<button type="button" class="kal-dl-raekke${it.isPause ? ' kal-dl-pause' : ''}"
        data-id="${it.id}" style="--act-color:${it.color}">
      <span class="kal-dl-tid">${tid}</span>
      <span class="kal-dl-navn">${esc(it.name)}<span class="kal-block-wt">${esc(wt)}</span></span>
      <span class="kal-dl-dur">${dur}</span>
    </button>`;
  }).join('');
  return `<div class="kal-dagliste" aria-label="Dagens registreringer">
    <div class="section-label">Dagens registreringer</div>${raekker}</div>`;
}

function bindDagListe(rod, ctx) {
  rod.querySelectorAll('.kal-dl-raekke').forEach(r => {
    const blok = rod.querySelector(`.kal-block[data-id="${r.dataset.id}"]`);
    r.addEventListener('click', () => ctx.aabnPost(r.dataset.id));
    // Rækken peger sin blok ud på aksen, så man kan se, hvilken det er
    r.addEventListener('mouseenter', () => blok?.classList.add('kal-block-peg'));
    r.addEventListener('mouseleave', () => blok?.classList.remove('kal-block-peg'));
  });
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
  const H     = HOUR_H_UGE * ctx.zoom;

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
  // En kort blok får mindstehøjde og rager derfor ned over den næste. De
  // korte lægges øverst, så de kan rammes — den lange blok under er stadig
  // stor nok at trykke på.
  const lag = new Map([...items].sort((a, b) => b.durMin - a.durMin).map((it, i) => [it, 2 + i]));
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
    // Kun hele blokke inden for aksen kan trækkes — en igangværende har
    // ingen slutning, og en klippet viser ikke hele sin tid
    const kanTraekkes = !it.isActive && !it.clipTop && !it.clipBottom && !it.vinTop && !it.vinBund;
    const wt  = it.workType ? ` · ${capitalize(it.workType)}` : '';
    const cls = [
      h < 34 ? 'kal-block-sm' : '',
      bred ? '' : 'kal-block-smal',
      it.isPause ? 'kal-block-pause' : '',
      it.isActive ? 'kal-block-active' : '',
      it.clipTop || it.vinTop ? 'kal-block-clip-top' : '',
      it.clipBottom || it.vinBund ? 'kal-block-clip-bottom' : ''
    ].filter(Boolean).join(' ');

    return `<button type="button" class="kal-block ${cls}" data-id="${it.id}"${kanTraekkes ? ' data-flyt="1"' : ''}
        style="top:${yPos(it.startMin, vin, H)}px;height:${h}px;left:${it.col * w}%;width:${w}%;z-index:${lag.get(it)};--act-color:${it.color}"
        aria-label="${esc(it.name)}${esc(wt)}, ${tid}, ${dur}">
      <span class="kal-block-title">${esc(it.name)}<span class="kal-block-wt">${esc(wt)}</span></span>
      ${visTid ? `<span class="kal-block-time">${tid} · ${dur}</span>` : ''}
      ${kanTraekkes ? '<span class="kal-block-greb" aria-hidden="true"></span>' : ''}
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
  const H = (dage.length > 1 ? HOUR_H_UGE : HOUR_H_DAG) * ctx.zoom;
  const traek = { slap: false };

  rod.querySelectorAll('.kal-block').forEach(b => {
    b.addEventListener('click', ev => {
      ev.stopPropagation();
      if (traek.slap) return;            // klikket, der afslutter et træk
      ctx.aabnPost(b.dataset.id);
    });
    if (b.dataset.flyt) b.addEventListener('pointerdown', ev => {
      const nr = Number(b.closest('[data-dagnr]')?.dataset.dagnr) || 0;
      const it = grupper[nr].find(x => x.id === b.dataset.id);
      if (it) startTraek(ev, b, it, vin, H, ctx, traek);
    });
  });

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

// ─── Træk med musen ───────────────────────────────────────
// Med musen kan en blok flyttes op og ned, eller dens slutning trækkes i
// grebet forneden. Tiden springer i hele 5 minutter og står i blokken,
// mens man trækker. Først når man slipper, gemmes posten. På en
// berøringsskærm gør et træk det samme som før: siden ruller.
function startTraek(ev, b, it, vin, H, ctx, traek) {
  if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
  ev.preventDefault();                       // ingen markering af tekst
  const strak = !!ev.target.closest('.kal-block-greb');
  const y0    = ev.clientY;
  const pxMin = H / 60;
  let igang = false, dMin = 0;

  const tidEl = () => b.querySelector('.kal-block-time') ||
    b.insertBefore(Object.assign(document.createElement('span'), { className: 'kal-block-time' }),
                   b.querySelector('.kal-block-greb'));

  const flyt = e => {
    const dy = e.clientY - y0;
    if (!igang && Math.abs(dy) < 4) return;  // et klik må gerne ryste lidt
    if (!igang) { igang = true; b.classList.add('kal-block-traek'); }
    dMin = Math.round(dy / pxMin / TRAEK_MIN) * TRAEK_MIN;
    if (strak) dMin = Math.max(dMin, TRAEK_MIN - it.durMin);
    else       dMin = Math.min(Math.max(dMin, vin.fra * 60 - it.startMin), vin.til * 60 - it.endMin);

    const s = it.startMin + (strak ? 0 : dMin), sl = it.endMin + dMin;
    if (strak) b.style.height = `${Math.max(16, (sl - s) * pxMin)}px`;
    else       b.style.top    = `${yPos(s, vin, H)}px`;
    const fra = new Date(it.realStart.getTime() + (strak ? 0 : dMin) * 60000);
    const til = new Date(it.realEnd.getTime() + dMin * 60000);
    tidEl().textContent = `${fmtTime(fra)}–${fmtTime(til)} · ${fmtMins(sl - s)}`;
  };

  const slip = () => {
    window.removeEventListener('pointermove', flyt);
    window.removeEventListener('pointerup', slip);
    if (!igang) return;
    b.classList.remove('kal-block-traek');
    // Klikket, der følger efter et træk, må ikke åbne arket
    traek.slap = true;
    setTimeout(() => { traek.slap = false; }, 0);
    if (dMin) ctx.flytPost(it.id, strak ? 0 : dMin, dMin);
  };

  window.addEventListener('pointermove', flyt);
  window.addEventListener('pointerup', slip);
}
