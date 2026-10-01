// rapporter.js — Trin 7: Rapporter med budget-sammenligning og hierarki-aggregering
//
// Rapporten viser én periode ad gangen: en dag, en uge, en måned eller et
// skoleår. Man bladrer frem og tilbage med pilene, så man kan se, hvordan i
// går, ugen før eller sidste skoleår så ud — ikke kun den periode man står i.

import { db } from './app.js';
import { getLoadedActivities } from './activities.js';
import { getSettings, gemIndstilling } from './indstillinger.js';
import { erPause, PAUSE_NAVN } from './pauser.js';
import {
  beregnAkkord, samletEnhed, rettedeElevtimer, OPTJENING, MODUL_MIN
} from './akkord.js';
import { normerFor, budgetTimer, fmtTimer, faktorerFor } from './normer.js';
import {
  periodeStart, periodeSlut, periodeTitel, periodeUnder, periodeNoegle,
  forskydningFor, skoleaarForPeriode, datoInput
} from './periode.js';
import {
  collection, query, orderBy, where, limit, onSnapshot, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// ─── State ────────────────────────────────────────────────
let userId       = null;
let periodFilter = 'skolear';
let periodOffset = 0;          // 0 = perioden vi står i, -1 = den forrige
let listenersOk  = false;
let entries      = [];
let unsubEntries = null;

const normHours = () => getSettings().normHours ?? 1650;

// Periodens grænser — ét sted, så lytter, filter og mærkater følges ad
const start = () => periodeStart(periodFilter, periodOffset);
const slut  = () => periodeSlut(periodFilter, periodOffset);

// ─── Init ─────────────────────────────────────────────────
export function initRapporterView(uid) {
  if (userId === uid) return;
  userId = uid;
  bindListeners();
}

export function refreshRapporter() {
  if (!userId) return;
  // Lytteren genstartes, hvis periodens grænser har flyttet sig — enten fordi
  // man har bladret, eller fordi skoleårets start er ændret i indstillingerne
  setupEntriesListener();
}

// ─── Periodeskift ─────────────────────────────────────────
// Skifter man længde, følger datoen med: står man i uge 34 og trykker
// "Måned", lander man i den måned, uge 34 ligger i. Ser man på en periode,
// der rummer i dag, er det i dag der følger med — ellers ville et skift fra
// skoleåret til "Måned" lande i august, hvor skoleåret begyndte.
function anker() {
  const n = new Date();
  return n >= start() && n < slut() ? n : start();
}

function setPeriod(type) {
  if (type === periodFilter) return;
  periodOffset = forskydningFor(type, anker());
  periodFilter = type;
  markerFaner();
  setupEntriesListener();
}

function bladr(n) {
  periodOffset += n;
  setupEntriesListener();
}

function tilNu() {
  if (periodOffset === 0) return;
  periodOffset = 0;
  setupEntriesListener();
}

function markerFaner() {
  document.querySelectorAll('.rapport-tab').forEach(b =>
    b.classList.toggle('rapport-tab-active', b.dataset.period === periodFilter));
}

// ─── Firestore listener ───────────────────────────────────
// Kun periodens egne registreringer hentes. Bladrer man tilbage, hentes den
// periode i stedet — derfor er der ingen øvre grænse for, hvor langt tilbage
// man kan se.
let listenerKey = null;

function setupEntriesListener() {
  const fra = start(), til = slut();
  const key = `${fra.getTime()}-${til.getTime()}`;
  if (key === listenerKey && unsubEntries) { renderReport(); return; }

  if (unsubEntries) unsubEntries();
  listenerKey = key;
  entries     = [];
  renderReport();               // vis den nye periodes ramme med det samme

  unsubEntries = onSnapshot(
    query(
      collection(db, `users/${userId}/entries`),
      where('startTime', '>=', Timestamp.fromDate(fra)),
      where('startTime', '<',  Timestamp.fromDate(til)),
      orderBy('startTime', 'asc'),
      limit(5000)
    ),
    snap => {
      entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderReport();
    },
    err => console.error('Rapport listener:', err)
  );
}

// ─── Period filtering ─────────────────────────────────────
// Korte pauser tæller med: i akkordregnskabet er de fælles tid, ligesom
// ubundet tid, og de står derfor også i rapportens samlede tid og i
// CSV-eksporten — men for sig, så de ikke blandes sammen med det ubundne.
//
// Perioden har både en start og en ende: tid registreret frem i tiden hører
// til den dag, uge eller måned, den ligger i — ikke til den, man står i nu.
function getPeriodEntries() {
  const fra = start(), til = slut();
  return entries.filter(e =>
    e.durationMinutes != null && e.startTime &&
    e.startTime.toDate() >= fra && e.startTime.toDate() < til
  );
}

// ─── Aggregation ──────────────────────────────────────────
function aggregate(acts) {
  const filtered = getPeriodEntries();
  const year     = skoleaarForPeriode(periodFilter, periodOffset);
  const direct   = {};
  const wtMap    = {};
  let uboundMins = 0;
  let pauseMins  = 0;

  filtered.forEach(e => {
    const m = e.durationMinutes || 0;
    if (erPause(e))     { pauseMins  += m; return; }
    if (!e.activityId)  { uboundMins += m; return; }
    direct[e.activityId] = (direct[e.activityId] || 0) + m;
    if (e.workType) {
      if (!wtMap[e.activityId]) wtMap[e.activityId] = {};
      wtMap[e.activityId][e.workType] = (wtMap[e.activityId][e.workType] || 0) + m;
    }
  });

  const showAll = periodFilter === 'skolear';
  const topActs = acts.filter(a => a.schoolYear === year && !a.isArchived && !a.parentId);
  // Kun aktive under-opgaver medregnes hos forælderen. En afsluttet under-opgave
  // tæller som sin egen afsluttede opgave (se archivedRows) og trækkes dermed ud
  // af forælderens total, så ingen tid tælles to gange.
  const liveKids = id =>
    acts.filter(c => c.schoolYear === year && c.parentId === id && !c.isArchived);

  const rows = topActs
    .map(act => {
      const cs        = liveKids(act.id);
      const childMins = cs.reduce((s, c) => s + (direct[c.id] || 0), 0);
      const totalMins = (direct[act.id] || 0) + childMins;
      return {
        act,
        ownMins:  direct[act.id] || 0,
        totalMins,
        wt:       wtMap[act.id] || {},
        children: cs
          .map(c => ({ act: c, totalMins: direct[c.id] || 0 }))
          .filter(c => showAll || c.totalMins > 0)
          .sort((a, b) => b.totalMins - a.totalMins)
      };
    })
    .filter(r => showAll || r.totalMins > 0)
    .sort((a, b) => b.totalMins - a.totalMins);

  // Afsluttede opgaver — kun i skoleårs-rapporten. Inkluderer både afsluttede
  // topopgaver og afsluttede under-opgaver (hver som sin egen post).
  const archivedRows = (showAll
    ? acts.filter(a => a.schoolYear === year && a.isArchived)
    : []
  ).map(act => {
    // Topopgave: rul kun de aktive under-opgaver ind. Under-opgave: står alene.
    const cs         = act.parentId ? [] : liveKids(act.id);
    const childMins  = cs.reduce((s, c) => s + (direct[c.id] || 0), 0);
    const totalMins  = (direct[act.id] || 0) + childMins;
    const budgetH    = budgetTimer(act);
    const budgetMins = budgetH != null ? Math.round(budgetH * 60) : null;
    return {
      act, totalMins, budgetMins, isChild: !!act.parentId,
      diffMins: budgetMins != null ? budgetMins - totalMins : null
    };
  }).sort((a, b) => b.totalMins - a.totalMins);

  const archivedMins = archivedRows.reduce((s, r) => s + r.totalMins, 0);

  const totalMins = rows.reduce((s, r) => s + r.totalMins, 0) + uboundMins + pauseMins + archivedMins;
  return { rows, uboundMins, pauseMins, totalMins, archivedRows, archivedMins, filtered, year };
}

// ─── Main render ──────────────────────────────────────────
function renderReport() {
  renderPeriodeBar();
  const el = document.getElementById('rapport-content');
  if (!el) return;
  const acts = getLoadedActivities();
  const { rows, uboundMins, pauseMins, totalMins, archivedRows, archivedMins, filtered, year } = aggregate(acts);

  // Akkordregnskabet gælder hele skoleåret — budgetterne er årets
  const ak = periodFilter === 'skolear'
    ? beregnAkkord({ acts, entries: filtered, aar: year, andel: forloebAndel(), fordel: fordelFaelles() })
    : null;

  el.innerHTML =
    renderSummary(totalMins, ak) +
    renderDonut(rows, uboundMins + pauseMins, totalMins, archivedMins) +
    renderActList(rows, uboundMins, pauseMins, ak) +
    renderArchivedList(archivedRows, ak);
}

const fordelFaelles = () => getSettings().fordelFaellesTid !== false;

// ─── Periodenavigation ────────────────────────────────────
const NU_TEKST = { dag:'I dag', uge:'Denne uge', maaned:'Denne måned', skolear:'I år' };

function renderPeriodeBar() {
  const t = document.getElementById('rapport-periode');
  const u = document.getElementById('rapport-periode-sub');
  if (t) t.textContent = periodeTitel(periodFilter, periodOffset);
  if (u) u.textContent = periodeUnder(periodFilter, periodOffset);

  const nu = document.getElementById('rapport-nu');
  if (nu) {
    nu.textContent = NU_TEKST[periodFilter];
    nu.disabled    = periodOffset === 0;
  }
}

// ─── Forløbet del af skoleåret ────────────────────────────
// 0 før skoleåret, 1 når det er slut. Både den samlede indikator og holdenes
// normer måles mod den: er man 40 % inde i året, "burde" 40 % være brugt.
function forloebAndel() {
  const yStart = start(), yEnd = slut();
  const total  = Math.max(1, (yEnd - yStart) / 86400000);
  return Math.min(1, Math.max(0, (Date.now() - yStart.getTime()) / 86400000 / total));
}

const aaretAfsluttet = () => Date.now() >= slut().getTime();

// Foran/bagud-chippen. Et afsluttet skoleår sammenlignes med hele normen,
// ikke med "skema".
function forloebChip(brugtM, normM, elapsed, lille = false) {
  if (elapsed === 0) return '';
  const diff  = brugtM - Math.round(normM * elapsed);
  const diffH = Math.abs(Math.round(diff / 60));
  const slut  = aaretAfsluttet();
  const kl    = `forecast-chip${lille ? ' forecast-chip-sm' : ''}`;
  return diff >= 0
    ? `<span class="${kl} forecast-ahead">▲ ${diffH}t ${slut ? 'over norm' : 'foran skema'}</span>`
    : `<span class="${kl} forecast-behind">▼ ${diffH}t ${slut ? 'under norm' : 'bagud skema'}</span>`;
}

// ─── Summary card ─────────────────────────────────────────
function renderSummary(totalMins, ak) {
  const year = skoleaarForPeriode(periodFilter, periodOffset);
  let extra  = '';

  if (periodFilter === 'skolear') {
    const elapsed = forloebAndel();
    const NORM    = normHours();
    const normM   = NORM * 60;
    const pct     = normM > 0 ? Math.min(100, Math.round(totalMins / normM * 100)) : 0;
    const expPct  = Math.min(99, Math.round(elapsed * 100));
    const chip    = forloebChip(totalMins, normM, elapsed);

    extra = `
      <div class="norm-progress-outer">
        <div class="norm-progress-bg">
          <div class="norm-progress-fill" style="width:${Math.min(100,pct)}%"></div>
          <div class="norm-progress-marker" style="left:${expPct}%"></div>
        </div>
        <div class="norm-progress-labels">
          <span>${fmtMins(totalMins)} / ${NORM}t</span>
          <span>${pct}%</span>
        </div>
      </div>
      ${chip}
      ${ak ? renderAkkord(ak, elapsed) : ''}`;
  }

  return `<div class="rapport-summary">
    <div class="rapport-total">${totalMins > 0 ? fmtMins(totalMins) : '—'}</div>
    <div class="rapport-total-sub">Samlet tid${periodFilter === 'skolear' ? ` · ${year}` : ''}</div>
    ${extra}
  </div>`;
}

// ─── Akkordregnskabet ─────────────────────────────────────
// Saldoen er optjent − brugt for hele skoleåret. Bjælken viser, hvor stor en
// del af akkorderne der er leveret, og stregen, hvor langt året er nået.
// Fluebenet flytter kun den fælles tid; saldoen øverst er den samme.
function renderAkkord(ak, elapsed) {
  const pct = ak.akkord > 0 ? Math.min(100, Math.round(ak.optjent / ak.akkord * 100)) : 0;
  const kal = Math.min(99, Math.round(elapsed * 100));
  return `<div class="akkord">
    <div class="akkord-head">Akkord</div>
    <div class="akkord-saldo">
      <span class="akkord-saldo-tal ${ak.saldo >= 0 ? 'is-pos' : 'is-neg'}">${fmtSaldo(ak.saldo)}</span>
      <span class="akkord-saldo-sub">Saldo · optjent − brugt</span>
    </div>
    <dl class="akkord-tal">
      <div><dt>Optjent</dt><dd>${fmtMins(ak.optjent)}</dd></div>
      <div><dt>Brugt</dt><dd>${fmtMins(ak.brugt)}</dd></div>
      <div><dt>Akkord i alt</dt><dd>${fmtMins(ak.akkord)}</dd></div>
    </dl>
    <div class="norm-progress-bg" role="img"
         aria-label="Leveret ${pct} procent af akkorderne. ${kal} procent af skoleåret er gået.">
      <div class="norm-progress-fill akkord-fill" style="width:${pct}%"></div>
      <div class="norm-progress-marker" style="left:${kal}%"></div>
    </div>
    <div class="norm-progress-labels">
      <span>Leveret ${pct}%</span>
      <span>Året er ${kal}% gået</span>
    </div>
    <label class="akkord-fordel">
      <input type="checkbox" id="akkord-fordel" class="settings-check"${ak.fordelt || fordelFaelles() ? ' checked' : ''}>
      <span>Fordel fælles tid på aktiviteterne<small>Ubundet tid, pauser og opgaver uden budget, vægtet efter budget</small></span>
    </label>
  </div>`;
}

// Saldochip: plus = arbejdet har taget mindre tid, end det betales med
function saldoChip(m, lille = true) {
  const kl = `forecast-chip${lille ? ' forecast-chip-sm' : ''}`;
  if (Math.round(m) === 0) return `<span class="${kl} forecast-neutral">± 0m</span>`;
  return m > 0
    ? `<span class="${kl} forecast-ahead">${fmtSaldo(m)}</span>`
    : `<span class="${kl} forecast-behind">${fmtSaldo(m)}</span>`;
}

// ─── Donut chart ──────────────────────────────────────────
function renderDonut(rows, uboundMins, totalMins, archivedMins = 0) {
  if (totalMins === 0) return '';
  const R    = 72;
  const CIRC = 2 * Math.PI * R;

  const segs = [
    ...rows.filter(r => r.totalMins > 0).slice(0, 6)
      .map(r => ({ name: r.act.name, mins: r.totalMins, color: r.act.color || 'var(--accent)' })),
    ...(uboundMins > 0 ? [{ name: 'Ubundet og pauser', mins: uboundMins, color: 'var(--text-3)' }] : []),
    ...(archivedMins > 0 ? [{ name: 'Afsluttet', mins: archivedMins, color: 'var(--border)' }] : []),
  ];
  const restMins = rows.slice(6).reduce((s, r) => s + r.totalMins, 0);
  if (restMins > 0) segs.push({ name: 'Andre', mins: restMins, color: 'var(--border)' });

  let circles = '';
  let offset  = 0;
  segs.forEach(s => {
    const len = (s.mins / totalMins) * CIRC;
    circles += `<circle cx="100" cy="100" r="${R}" fill="none"
      stroke="${s.color}" stroke-width="28"
      stroke-dasharray="${len.toFixed(2)} ${CIRC.toFixed(2)}"
      stroke-dashoffset="${offset.toFixed(2)}"
      transform="rotate(-90 100 100)"/>`;
    offset -= len;
  });

  const legend = segs.slice(0, 5).map(s => {
    const pct = Math.round(s.mins / totalMins * 100);
    return `<div class="legend-item">
      <div class="legend-dot" style="background:${s.color}"></div>
      <div class="legend-name">${esc(s.name)}</div>
      <div class="legend-pct">${pct}%</div>
    </div>`;
  }).join('');

  const label = periodeTitel(periodFilter, periodOffset);

  return `<div class="rapport-chart-section">
    <div class="rapport-donut-wrap">
      <svg viewBox="0 0 200 200" width="130" height="130" aria-hidden="true">
        <circle cx="100" cy="100" r="${R}" fill="none" stroke="var(--border)" stroke-width="28"/>
        ${circles}
        <text x="100" y="92" text-anchor="middle" class="donut-big">${fmtMins(totalMins)}</text>
        <text x="100" y="116" text-anchor="middle" class="donut-sub">${label}</text>
      </svg>
    </div>
    <div class="rapport-legend">${legend}</div>
  </div>`;
}

// ─── Activity list ────────────────────────────────────────
function renderActList(rows, uboundMins, pauseMins, ak) {
  if (!rows.length && !uboundMins && !pauseMins) {
    return `<div class="hist-empty">Ingen registreringer i denne periode</div>`;
  }

  let html = `<div class="rapport-act-section"><div class="rapport-act-head">Pr. aktivitet</div>`;
  rows.forEach(r => {
    html += actRow(r.act, r.totalMins, r.ownMins, r.wt, false, ak, r.children.map(c => c.act.id));
    r.children.forEach(c => html += actRow(c.act, c.totalMins, c.totalMins, {}, true, ak));
  });

  html += faellesRow(uboundMins, pauseMins, ak);
  return html + '</div>';
}

// ─── Fælles tid ───────────────────────────────────────────
// Ubundet tid og pauser — i skoleåret også opgaver uden budget. Er den
// fordelt, står den her kun som oversigt; ellers bærer den sin egen saldo.
function faellesRow(uboundMins, pauseMins, ak) {
  const dele = ak
    ? [['Ubundet tid', ak.faelles.ubundet], ['Pauser', ak.faelles.pauser],
       ['Opgaver uden budget', ak.faelles.udenBudget]]
    : [['Ubundet tid', uboundMins], ['Pauser', pauseMins]];
  const total = dele.reduce((s, [, m]) => s + m, 0);
  if (total === 0) return '';

  const navn = ak ? 'Fælles tid' : dele[1][1] > 0 ? 'Ubundet tid og pauser' : 'Ubundet tid';
  const fod  = !ak ? ''
    : ak.fordelt
      ? `<div class="rapport-akkord"><span class="rapport-akkord-maade">Fordelt på aktiviteterne efter budget</span></div>`
      : `<div class="rapport-akkord">
           <span class="rapport-akkord-maade">Står for sig selv</span>
           <span>Optjent <b>0m</b></span>
           ${saldoChip(ak.faellesSaldo)}
         </div>`;

  return `<div class="rapport-act-row rapport-act-row-faelles">
    <div class="rapport-act-top">
      <div class="act-color-dot" style="background:var(--text-3)"></div>
      <div class="rapport-act-name">${navn}</div>
      <div class="rapport-act-time">${fmtMins(total)}</div>
    </div>
    <div class="rapport-wt-row">${dele.filter(([, m]) => m > 0).map(([n, m]) =>
      `<span class="rapport-wt-item"><span class="rapport-wt-label">${n}</span> ${fmtMins(m)}</span>`).join('')}
    </div>
    ${fod}
  </div>`;
}

function actRow(act, totalMins, ownMins, wt, isChild, ak = null, kids = []) {
  const color  = act.color || 'var(--accent)';
  const budgetH = budgetTimer(act);
  const budget  = budgetH != null ? Math.round(budgetH * 60) : null;
  const pct     = budget ? Math.min(100, Math.round(totalMins / budget * 100)) : null;

  const progressHtml = budget != null ? `
    <div class="rapport-progress-bg">
      <div class="rapport-progress-fill" style="width:${pct ?? 0}%;background:${color}"></div>
    </div>
    <div class="rapport-act-budget-row">
      <span>${totalMins > 0 ? fmtMins(totalMins) : '—'} / ${fmtTimer(budgetH)}t</span>
      <span>${pct ?? 0}%</span>
    </div>` : (totalMins > 0 ? `<div class="rapport-act-budget-row"><span>${fmtMins(totalMins)}</span></div>` : '');

  // I skoleåret står holdets arbejdstyper med akkorden: brugt, optjent og norm
  const enhed   = ak?.enheder[act.id];
  const wtKeys  = ['undervisning', 'forberedelse', 'retning'].filter(t => wt[t]);
  const wtHtml  = (enhed?.hold
    ? holdAkkord(enhed, act, color, ownMins)
    : !isChild && wtKeys.length > 0
    ? `<div class="rapport-wt-row">${wtKeys.map(t =>
        `<span class="rapport-wt-item"><span class="rapport-wt-label">${capitalize(t)}</span> ${fmtMins(wt[t])}</span>`
      ).join('')}</div>`
    : '') + (!isChild && act.type === 'hold' ? faktorLinje(act, normerFor(act), wt) : '');

  const akHtml = ak && !enhed?.hold ? akkordLinje(act, ak, kids) : '';

  return `<div class="rapport-act-row${isChild ? ' rapport-act-row-child' : ''}">
    <div class="rapport-act-top">
      <div class="act-color-dot" style="background:${color}"></div>
      <div class="rapport-act-name">${esc(act.name)}</div>
      <div class="rapport-act-time">${totalMins > 0 ? fmtMins(totalMins) : '—'}</div>
    </div>
    ${progressHtml}${wtHtml}${akHtml}
  </div>`;
}

// ─── Akkordlinjen under en opgave ─────────────────────────
// Optjeningsmåde, optjent, fælles tid og saldo. En opgave og dens aktive
// under-opgaver står i én række, så deres akkorder lægges sammen dér.
const MAADE_TEKST = { ...OPTJENING, afsluttet: 'Afsluttet', hold: 'Hold' };

function akkordLinje(act, ak, kids = []) {
  const egen = ak.enheder[act.id];
  if (!egen) return '';                        // under forælderens budget
  if (egen.budget == null) {
    return `<div class="rapport-akkord">
      <span class="rapport-akkord-maade">Uden budget · tælles som fælles tid</span>
    </div>`;
  }
  const u = samletEnhed([egen, ...kids.map(id => ak.enheder[id])]);
  const maade = egen.maade === 'manuel'
    ? `${MAADE_TEKST.manuel} ${Math.round(Number(act.fremdrift) || 0)}%`
    : act.type === 'hold' ? 'Løbende · uden normgrundlag' : MAADE_TEKST[egen.maade];
  return `<div class="rapport-akkord">
    <span class="rapport-akkord-maade">${maade}</span>
    <span>Optjent <b>${fmtMins(u.optjent)}</b></span>
    ${u.faelles > 0 ? `<span>Fælles <b>${fmtMins(u.faelles)}</b></span>` : ''}
    ${saldoChip(u.saldo)}
  </div>`;
}

// ─── Holdets akkord pr. arbejdstype ───────────────────────
// Kun i skoleårs-rapporten: normerne gælder hele året. Undervisningen tælles
// i moduler (95 min). Forberedelsen optjenes med hvert modul, retningen med
// hvert rettet sæt. Bjælken er brugt mod norm, og stregen i den er det
// optjente — står bjælken forbi stregen, har arbejdet taget længere tid,
// end det er betalt med. Tillægget tælles ikke: eksamen er en opgave for sig.
// Tid uden arbejdstype — fx registreret, mens holdet endnu var en opgave —
// tæller i holdets total og står for sig, så intet forsvinder.
function holdAkkord(u, act, color, ownMins) {
  const h = u.hold;
  const linjer = [];

  const over = h.overNorm > 0
    ? `<span class="forecast-chip forecast-chip-sm forecast-neutral">${komma(h.overNorm / MODUL_MIN, 1)} moduler over normen</span>`
    : '';
  linjer.push(akkordType('Undervisning',
    `<b>${komma(h.moduler, 1)}</b> af ${komma(h.modulerNorm, 1)} moduler`,
    h.undervisning.brugt, h.undervisning.norm, null, color, over));

  linjer.push(akkordType('Forberedelse',
    `brugt <b>${fmtMins(h.forberedelse.brugt)}</b> · optjent <b>${fmtMins(h.forberedelse.optjent)}</b> af ${fmtTimer(h.forberedelse.norm / 60)}<span class="enhed">t</span>`,
    h.forberedelse.brugt, h.forberedelse.norm, h.forberedelse.optjent, color,
    saldoChip(h.forberedelse.optjent - h.forberedelse.brugt)));

  if (h.retning.norm > 0) {
    linjer.push(akkordType('Retning',
      `rettet <b>${komma(h.rettet, 1)}</b> af ${komma(h.rettetNorm, 1)} elevtimer · brugt <b>${fmtMins(h.retning.brugt)}</b> · optjent <b>${fmtMins(h.retning.optjent)}</b>`,
      h.retning.brugt, h.retning.norm, h.retning.optjent, color,
      saldoChip(h.retning.optjent - h.retning.brugt)));
  } else if (h.retning.brugt > 0) {
    linjer.push(akkordType('Retning', `brugt <b>${fmtMins(h.retning.brugt)}</b> · ingen retteakkord`,
      0, 0, null, color, saldoChip(-h.retning.brugt)));
  }

  const udenType = ownMins - h.brugtTyper;
  const ekstra = [];
  if (udenType > 0)
    ekstra.push(`<span class="rapport-wt-item"><span class="rapport-wt-label">Uden arbejdstype</span> ${fmtMins(udenType)}</span>`);
  if (u.faelles > 0)
    ekstra.push(`<span class="rapport-wt-item"><span class="rapport-wt-label">Fælles tid</span> ${fmtMins(u.faelles)}</span>`);
  if (h.tillaeg > 0)
    ekstra.push(`<span class="rapport-wt-item rapport-akkord-note">Tillæg ${fmtTimer(h.tillaeg / 60)}<span class="enhed">t</span> tælles ikke — opret eksamen som opgave</span>`);

  return `<div class="rapport-norm">${linjer.join('')}</div>
    ${ekstra.length ? `<div class="rapport-wt-row">${ekstra.join('')}</div>` : ''}
    <div class="rapport-akkord">
      <span class="rapport-akkord-maade">Holdets akkord</span>
      <span>Optjent <b>${fmtMins(u.optjent)}</b> af ${fmtTimer(u.budget / 60)}<span class="enhed">t</span></span>
      ${saldoChip(u.saldo)}
    </div>`;
}

function akkordType(navn, tal, brugt, norm, optjent, color, chip) {
  const pct  = v => norm > 0 ? Math.min(100, v / norm * 100) : 0;
  const bar  = norm > 0 ? `<div class="rapport-norm-bar">
      <div class="rapport-progress-fill" style="width:${pct(brugt).toFixed(1)}%;background:${color}"></div>
      ${optjent != null ? `<div class="akkord-streg" style="left:${pct(optjent).toFixed(1)}%"></div>` : ''}
    </div>` : '';
  return `<div class="akkord-type">
    <span class="rapport-wt-label">${navn}</span>
    ${chip || '<span></span>'}
    <span class="akkord-type-tal">${tal}</span>
    ${bar}
  </div>`;
}

// ─── Realiseret faktor ────────────────────────────────────
// Holdets egne tal målt med skolens mål, så de kan holdes op mod budgettet:
//
//   forberedelsesfaktor = (undervisning + forberedelse) / undervisning
//                         — budgettet er skoleårets faktor, fx 2,35
//   retning             = minutter pr. elev pr. fordybelsestime
//                         — budgettet er faktor / 27 × 60, fx 5,2 min
//
// Retningen måles mod de rettede sæt, der er afsluttet i perioden: tiden
// brugt på retning ÷ (elevtimer × elever). Har holdet ingen sæt endnu,
// skønnes den rettede fordybelsestid ud fra, hvor stor en del af årets
// undervisning der er registreret, og tallet mærkes "skønnet". Har holdet
// sæt, men ingen i perioden, er der intet at måle mod.
// Forholdstal gælder for enhver periode, så linjen står også under dag, uge
// og måned.
//
// Forberedelsesfaktoren kræver kun skoleårets faktor og står derfor på alle
// hold med registreret undervisning. Retningen kræver elever og
// fordybelsestid og står kun, når holdet har et normgrundlag med dem.
function faktorLinje(act, n, wt) {
  const u = wt.undervisning || 0;
  if (u === 0) return '';
  const { faktor } = faktorerFor(act.schoolYear);
  const komma2 = (v, d = 2) => v.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d });
  const dele   = [];

  const realF = (u + (wt.forberedelse || 0)) / u;
  dele.push(`<span class="rapport-wt-item"><span class="rapport-wt-label">Forb.faktor</span>
    <b>${komma2(realF)}</b> · budget ${komma2(faktor)}</span>`);

  if (n && n.retning > 0 && n.undervisning > 0) {
    const elever  = Number(act.normGrundlag?.elever) || 0;
    const budgetR = faktor / 27 * 60;
    let realR = null, skoen = false;
    if ((act.rettedeSaet || []).length) {
      const et = rettedeElevtimer(act, datoInput(start()), datoInput(slut()));
      if (et > 0 && elever > 0) realR = (wt.retning || 0) / (et * elever);
    } else {
      const elevTimer = n.retning * 27 / faktor;          // elever × fordybelsestid × antal hold
      const andel     = u / (n.undervisning * 60);
      realR = (wt.retning || 0) / (elevTimer * andel);
      skoen = true;
    }
    if (realR != null) {
      dele.push(`<span class="rapport-wt-item"><span class="rapport-wt-label">Retning${skoen ? ' (skønnet)' : ''}</span>
        <b>${komma2(realR, 1)}</b> · budget ${komma2(budgetR, 1)} <span class="enhed">min</span> pr. elev pr. fordybelsestime</span>`);
    }
  }
  return `<div class="rapport-wt-row rapport-faktor">${dele.join('')}</div>`;
}

// ─── Afsluttede opgaver ───────────────────────────────────
function renderArchivedList(rows, ak) {
  if (!rows.length) return '';

  // Netto ubrugt budget på tværs af afsluttede opgaver — overforbrug på én
  // opgave trækkes fra det sparede på de øvrige.
  const budgeted = rows.filter(r => r.diffMins != null);
  const netDiff  = budgeted.reduce((s, r) => s + r.diffMins, 0);
  const netLine  = budgeted.length
    ? `<div class="rapport-archived-net">
         <span class="rapport-archived-net-label">Ubrugt tid i alt</span>
         <span class="rapport-archived-net-val ${netDiff >= 0 ? 'is-pos' : 'is-neg'}">
           ${netDiff >= 0 ? `${fmtMins(netDiff)} tilbage` : `${fmtMins(-netDiff)} over budget`}
         </span>
       </div>`
    : '';

  let html = `<div class="rapport-act-section rapport-archived-section">
    <div class="rapport-act-head">Afsluttede opgaver</div>
    ${netLine}`;
  rows.forEach(r => { html += archivedRow(r, ak); });
  return html + '</div>';
}

function archivedRow(r, ak) {
  const { act, totalMins, budgetMins, diffMins, isChild } = r;
  const color = act.color || 'var(--accent)';

  let bar = '';
  let chip = '';

  if (budgetMins != null) {
    const pct  = budgetMins > 0 ? Math.min(100, Math.round(totalMins / budgetMins * 100)) : 0;
    const over = diffMins < 0;
    bar = `
      <div class="rapport-progress-bg">
        <div class="rapport-progress-fill" style="width:${pct}%;background:${over ? 'var(--danger)' : color}"></div>
      </div>
      <div class="rapport-act-budget-row">
        <span>${fmtMins(totalMins)} / ${fmtTimer(budgetMins / 60)}t</span>
        <span>${pct}%</span>
      </div>`;
    chip = diffMins > 0
      ? `<span class="forecast-chip forecast-ahead">✓ Sparet ${fmtMins(diffMins)}</span>`
      : diffMins < 0
        ? `<span class="forecast-chip forecast-behind">▲ ${fmtMins(-diffMins)} for meget</span>`
        : `<span class="forecast-chip forecast-neutral">Præcis på budget</span>`;
  } else {
    chip = `<div class="rapport-archived-nobudget">Intet budget · ${fmtMins(totalMins)} brugt</div>`;
  }

  // Med fordelt fælles tid står opgavens andel her, så saldoen kan ses
  const u   = ak?.enheder[act.id];
  const fae = u && u.budget != null && u.faelles > 0
    ? `<div class="rapport-akkord">
         <span>Fælles <b>${fmtMins(u.faelles)}</b></span>
         <span class="rapport-akkord-maade">Saldo med fælles tid</span>
         ${saldoChip(u.saldo)}
       </div>`
    : '';

  return `<div class="rapport-act-row rapport-act-row-archived${isChild ? ' rapport-act-row-child' : ''}">
    <div class="rapport-act-top">
      <div class="act-color-dot" style="background:${color}"></div>
      <div class="rapport-act-name">${esc(act.name)}</div>
      <div class="rapport-act-time">${totalMins > 0 ? fmtMins(totalMins) : '—'}</div>
    </div>
    ${bar}${chip}${fae}
  </div>`;
}

// ─── CSV-eksport ──────────────────────────────────────────
export function exportCSV() {
  const acts     = getLoadedActivities();
  const filtered = getPeriodEntries()
    .slice()
    .sort((a, b) => a.startTime.toDate() - b.startTime.toDate());

  if (!filtered.length) { alert('Ingen registreringer i denne periode at eksportere.'); return; }

  const q  = s => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const header = 'dato;starttid;sluttid;varighed_minutter;aktivitet;arbejdstype;note';
  const rows   = filtered.map(e => {
    const act   = acts.find(a => a.id === e.activityId);
    const start = e.startTime?.toDate();
    const end   = e.endTime?.toDate();
    return [
      start ? fmtDate(start) : '',
      start ? fmtTime(start) : '',
      end   ? fmtTime(end)   : '',
      e.durationMinutes ?? '',
      q(erPause(e) ? PAUSE_NAVN : act?.name ?? ''),
      e.workType ?? '',
      q(e.note ?? '')
    ].join(';');
  });

  const csv  = '﻿' + [header, ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: `tidsregistrering-${periodeNoegle(periodFilter, periodOffset)}.csv`
  });
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Bind listeners ───────────────────────────────────────
function bindListeners() {
  if (listenersOk) return;
  listenersOk = true;

  document.getElementById('rapport-tabs')
    ?.addEventListener('click', e => {
      const btn = e.target.closest('.rapport-tab');
      if (btn) setPeriod(btn.dataset.period);
    });

  document.getElementById('rapport-prev')?.addEventListener('click', () => bladr(-1));
  document.getElementById('rapport-next')?.addEventListener('click', () => bladr(1));
  document.getElementById('rapport-nu')  ?.addEventListener('click', tilNu);

  document.getElementById('btn-export-csv')
    ?.addEventListener('click', exportCSV);

  // Fluebenet i akkordregnskabet tegnes med rapporten, så det fanges her
  document.getElementById('rapport-content')
    ?.addEventListener('change', e => {
      if (e.target.id !== 'akkord-fordel') return;
      gemIndstilling('fordelFaellesTid', e.target.checked);
      renderReport();
      document.getElementById('akkord-fordel')?.focus();
    });
}

// ─── Formattering ─────────────────────────────────────────
const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const esc = s => s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';

function fmtDate(d) {
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}

function fmtTime(d) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function fmtMins(m) {
  m = Math.round(m || 0);
  if (!m) return '0m';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60), r = m % 60;
  return r > 0 ? `${h}t ${r}m` : `${h}t`;
}

// Saldo med fortegn: "+3t 20m", "−1t 5m"
const fmtSaldo = m => Math.round(m) === 0 ? '± 0m' : `${m > 0 ? '+' : '−'}${fmtMins(Math.abs(m))}`;

// 23.4 → "23,4"
const komma = (v, d = 1) => (Math.round(v * 10 ** d) / 10 ** d)
  .toLocaleString('da-DK', { maximumFractionDigits: d });
