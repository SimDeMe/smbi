// historik.js — Trin 6: Historik med redigering og manuel oprettelse

import { db, showToast, getCurrentSchoolYear } from './app.js';
import { getLoadedActivities } from './activities.js';
import { SKEMA, VARIGHEDER, minutterFraTid, skemaFraTider, skemaNu, skemaInterval } from './skema.js';
import { opretPost, erPause, PAUSE_NAVN } from './pauser.js';
import { esc, capitalize, fmtMins, fmtTime } from './format.js';
import { openSheet, closeSheet, somKnap } from './ark.js';
import { datoInput } from './periode.js';
import {
  collection, doc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, limit, where, getDocs, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// ─── State ────────────────────────────────────────────────
let userId       = null;
let entries      = [];
let unsubEntries = null;
let listenersOk  = false;
let editingId    = null;
let redigeret    = null;       // posten i arket — også når den er ældre end listen
let periodFilter = 'uge';
let actFilter    = '';

// Listen henter de seneste LISTE_TRIN poster og kan udvides i samme spring,
// så «Alle» ikke stille holder op ved en grænse
const LISTE_TRIN = 500;
let listeGraense = LISTE_TRIN;

// Formularens nabolag: posterne omkring den valgte dato, til overlap-tjekket
let naboPoster   = [];
let naboDato     = '';

// ─── Init ─────────────────────────────────────────────────
export function initHistorikView(uid) {
  if (userId === uid) return;
  userId = uid;
  bindListeners();
}

export function refreshHistorik() {
  if (!userId) return;
  if (!unsubEntries) setupEntriesListener();
  renderActivityFilter();
  renderList();
}

// ─── Entries listener ─────────────────────────────────────
function setupEntriesListener() {
  if (unsubEntries) unsubEntries();
  unsubEntries = onSnapshot(
    query(
      collection(db, `users/${userId}/entries`),
      orderBy('startTime', 'desc'),
      limit(listeGraense)
    ),
    snap => {
      entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderList();
    },
    err => console.error('Entries listener:', err)
  );
}

function visFlere() {
  listeGraense += LISTE_TRIN;
  setupEntriesListener();
}

// Er listen skåret af, før perioden er slut bagud? Så mangler der poster,
// og det skal stå under listen
function listenErAfskaaret() {
  if (entries.length < listeGraense) return false;
  const start  = getPeriodStart(periodFilter);
  const aeldst = entries[entries.length - 1]?.startTime?.toDate();
  return !start || (aeldst && aeldst > start);
}

// ─── Overlap ──────────────────────────────────────────────
// To registreringer, der dækker samme minutter, tælles begge med i
// rapporterne. Det kan være rigtigt (to ting på én gang), men oftest er det
// en fejl — så det skal kunne ses. Pauser er med: de tæller som fælles tid.
const slutMs = e => e.endTime ? e.endTime.toDate().getTime() : Date.now();

function overlappendeIds(liste) {
  const poster = liste
    .filter(e => e.startTime)
    .sort((a, b) => a.startTime.toDate() - b.startTime.toDate());
  const ids = new Set();
  for (let i = 0; i < poster.length; i++) {
    const slut = slutMs(poster[i]);
    for (let j = i + 1; j < poster.length; j++) {
      if (poster[j].startTime.toDate().getTime() >= slut) break;
      ids.add(poster[i].id); ids.add(poster[j].id);
    }
  }
  return ids;
}

// ─── Filtering ────────────────────────────────────────────
function filterEntries() {
  const start = getPeriodStart(periodFilter);
  const end   = getPeriodEnd(periodFilter);
  return entries.filter(e => {
    if (start && e.startTime?.toDate() < start) return false;
    // Perioden har også en ende — ellers ville planlagt tid i næste uge
    // dukke op under "I dag"
    if (end && e.startTime?.toDate() >= end) return false;
    if (actFilter && e.activityId !== actFilter) return false;
    return true;
  });
}

function getPeriodStart(period) {
  const now = new Date();
  if (period === 'dag')   return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'uge') {
    const d   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dow = d.getDay() === 0 ? 7 : d.getDay();
    d.setDate(d.getDate() - (dow - 1));
    return d;
  }
  if (period === 'maaned') return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

function getPeriodEnd(period) {
  const start = getPeriodStart(period);
  if (!start) return null;
  const end = new Date(start);
  if (period === 'dag')    end.setDate(end.getDate() + 1);
  if (period === 'uge')    end.setDate(end.getDate() + 7);
  if (period === 'maaned') end.setMonth(end.getMonth() + 1);
  return end;
}

// ─── Render list ──────────────────────────────────────────
function renderList() {
  const el = document.getElementById('hist-list');
  if (!el) return;

  const acts     = getLoadedActivities();
  const filtered = filterEntries();

  const flere = listenErAfskaaret()
    ? `<div class="hist-more">
        <span class="hist-more-txt">Viser de seneste ${entries.length} registreringer</span>
        <button type="button" id="hist-more-btn" class="btn btn-secondary">Vis ${LISTE_TRIN} mere</button>
      </div>`
    : '';

  if (!filtered.length) {
    el.innerHTML = `<div class="hist-empty">Ingen registreringer i denne periode</div>` + flere;
    document.getElementById('hist-more-btn')?.addEventListener('click', visFlere);
    return;
  }

  const overlap = overlappendeIds(filtered);

  // Group by date key YYYY-MM-DD
  const groups = new Map();
  filtered.forEach(e => {
    if (!e.startTime) return;
    const d   = e.startTime.toDate();
    const key = datoInput(d);
    if (!groups.has(key)) groups.set(key, { date: d, list: [] });
    groups.get(key).list.push(e);
  });

  let html = '';
  let totalMinsToday = 0;

  for (const [, g] of groups) {
    // Pauser er ikke arbejdstid og tælles ikke med i dagens total
    const dayMins = g.list.reduce((s, e) => s + (erPause(e) ? 0 : e.durationMinutes || 0), 0);
    const dayLabel = dayMins ? `<span class="hist-day-total">${fmtMins(dayMins)}</span>` : '';
    html += `<div class="hist-date-head">${fmtDateHead(g.date)}${dayLabel}</div>`;

    g.list.forEach(e => {
      // En kort pause er en tynd mellemlinje — den skal ikke fylde som et
      // stykke arbejde, men kan stadig trykkes på og rettes
      if (erPause(e)) {
        const tid = e.startTime && e.endTime
          ? `${fmtTime(e.startTime.toDate())}–${fmtTime(e.endTime.toDate())}` : '';
        html += `<div class="entry-pause-line" data-id="${e.id}" aria-label="${PAUSE_NAVN} ${tid}">
          <span class="entry-pause-txt">Pause${e.durationMinutes != null ? ` <span class="enhed">${fmtMins(e.durationMinutes)}</span>` : ''}</span>
          <span class="entry-pause-tid">${tid}</span>${overlap.has(e.id) ? '<span class="entry-overlap">Overlap</span>' : ''}
        </div>`;
        return;
      }

      const act      = acts.find(a => a.id === e.activityId);
      const color    = act?.color || 'var(--border)';
      const name     = act?.name || (e.activityId ? 'Slettet aktivitet' : 'Ubundet tid');
      const isActive = !e.endTime;

      const startT = e.startTime ? fmtTime(e.startTime.toDate()) : '??:??';
      const endT   = e.endTime   ? fmtTime(e.endTime.toDate())   : null;
      const dur    = e.durationMinutes != null
        ? fmtMins(e.durationMinutes)
        : (isActive ? 'I gang' : '—');
      const wt     = e.workType ? ` · ${capitalize(e.workType)}` : '';
      const note   = e.note ? `<div class="entry-note">${esc(e.note)}</div>` : '';
      const timeStr = endT ? `${startT} – ${endT}` : `${startT} –`;
      const dot    = isActive
        ? `<span class="entry-running-dot"></span>`
        : '';
      const overlapMaerke = overlap.has(e.id)
        ? `<span class="entry-overlap" title="Dækker samme tid som en anden registrering">Overlap</span>`
        : '';

      html += `<div class="entry-row${isActive ? ' entry-row-active' : ''}" data-id="${e.id}" style="--act-color:${color}">
        <div class="entry-body">
          <div class="entry-act">${esc(name)}<span class="entry-wt">${esc(wt)}</span></div>
          <div class="entry-meta">${dot}${timeStr}${overlapMaerke}</div>
          ${note}
        </div>
        <div class="entry-duration">${dur}</div>
        <svg class="act-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>`;
    });
  }

  el.innerHTML = html + flere;
  el.querySelectorAll('.entry-row, .entry-pause-line').forEach(row =>
    somKnap(row, () => openEntrySheet(row.dataset.id))
  );
  document.getElementById('hist-more-btn')?.addEventListener('click', visFlere);
}

// ─── Activity filter dropdown ─────────────────────────────
function renderActivityFilter() {
  const sel = document.getElementById('hist-act-filter');
  if (!sel) return;
  const acts = getLoadedActivities();
  const year = getCurrentSchoolYear();
  const relevant = acts.filter(a => a.schoolYear === year && !a.isArchived);
  sel.innerHTML = `<option value="">Alle aktiviteter</option>` +
    relevant.map(a =>
      `<option value="${a.id}"${a.id === actFilter ? ' selected' : ''}>${esc(a.name)}</option>`
    ).join('');
  sel.value = actFilter;
}

// ─── Open entry sheet ─────────────────────────────────────
// prefill: {start: Date, end: Date|null} — bruges når kalenderen åbner arket
// på et bestemt tidsrum (fx et tryk på tidsaksen).
// Kalenderen sender selve posten med, for den kan være ældre end de poster,
// listen har hentet — og så skal den stadig åbnes til redigering, ikke som ny.
export function openEntrySheet(entryId, prefill = null, post = null) {
  const e   = post || (entryId ? entries.find(x => x.id === entryId) : null) || null;
  editingId = e?.id || null;
  redigeret = e;

  document.getElementById('hist-sheet-title').textContent =
    !e ? 'Ny registrering' : erPause(e) ? 'Redigér kort pause' : 'Redigér registrering';

  fyldAktivitetsliste(e);

  if (e) {
    const sd = e.startTime.toDate();
    document.getElementById('hist-date').value  = datoInput(sd);
    document.getElementById('hist-start').value = fmtTime(sd);
    document.getElementById('hist-end').value   = e.endTime ? fmtTime(e.endTime.toDate()) : '';
    document.getElementById('hist-note').value  = e.note || '';

    document.querySelectorAll('input[name="hist-wt"]').forEach(r => {
      r.checked = r.value === e.workType;
    });
  } else {
    const start = prefill?.start || new Date();
    document.getElementById('hist-date').value  = datoInput(start);
    document.getElementById('hist-start').value = fmtTime(start);
    document.getElementById('hist-end').value   = prefill?.end ? fmtTime(prefill.end) : '';
    document.getElementById('hist-note').value  = '';
    document.querySelectorAll('input[name="hist-wt"]').forEach(r => r.checked = false);
  }

  renderSkemaChips();
  renderVarighedChips();
  syncSkemaChips();
  syncVarighedChips();
  syncFremtidNotice();
  naboDato = '';
  syncOverlapNotice();
  updateWtVisibility();
  document.getElementById('hist-delete-btn').classList.toggle('hidden', !e);
  openSheet('hist-sheet', 'hist-backdrop');
}

// ─── Aktivitetsliste i formularen ─────────────────────────
// De aktiviteter, der senest er registreret tid på, lægges øverst, så man
// slipper for at rulle efter dem, man bruger i denne uge.
function fyldAktivitetsliste(e) {
  const actSel = document.getElementById('hist-act-sel');
  if (!actSel) return;
  const year    = getCurrentSchoolYear();
  const valgbare = getLoadedActivities().filter(a => a.schoolYear === year && !a.isArchived);

  const senesteIds = senesteAktiviteter(new Set(valgbare.map(a => a.id)));
  const seneste    = senesteIds.map(id => valgbare.find(a => a.id === id));
  const oevrige    = valgbare.filter(a => !senesteIds.includes(a.id));

  const opt   = a => `<option value="${a.id}">${esc(a.name)}</option>`;
  const gruppe = (navn, liste) =>
    liste.length ? `<optgroup label="${navn}">${liste.map(opt).join('')}</optgroup>` : '';

  // Hører posten til en aktivitet uden for listen (andet skoleår eller
  // arkiveret), skal den stadig kunne vælges — ellers ville den blive
  // koblet fra, næste gang posten gemmes
  const valgt   = e?.activityId ? getLoadedActivities().find(a => a.id === e.activityId) : null;
  const udenfor = valgt && !valgbare.some(a => a.id === valgt.id) ? valgt : null;

  actSel.innerHTML =
    `<option value="">— Ubundet tid —</option>` +
    (udenfor ? gruppe('Fra registreringen', [udenfor]) : '') +
    gruppe('Senest brugt', seneste) +
    gruppe(seneste.length ? 'Øvrige aktiviteter' : 'Aktiviteter', oevrige);

  actSel.value = e?.activityId || '';
}

// Aktivitets-id'er i den rækkefølge, de senest er brugt (entries er nyeste
// først); kun dem der stadig står i listen, tæller med
function senesteAktiviteter(gyldige, maks = 5) {
  const ids = [];
  for (const e of entries) {
    const id = e.activityId;
    if (!id || !gyldige.has(id) || ids.includes(id)) continue;
    ids.push(id);
    if (ids.length === maks) break;
  }
  return ids;
}

// ─── Skema-hurtigvalg ─────────────────────────────────────
// Modulerne og frokostpausen udfylder blot start- og sluttidspunkt;
// felterne kan stadig skrives i hånden.
function renderSkemaChips() {
  const row = document.getElementById('hist-skema-row');
  if (!row || row.dataset.built) return;
  row.innerHTML = SKEMA.map(sk => `
    <button type="button" class="skema-chip" data-skema="${sk.id}"
            aria-pressed="false" aria-label="${esc(sk.navn)} ${sk.start} til ${sk.slut}">
      <span class="skema-chip-navn">${esc(sk.kort)}</span>
      <span class="skema-chip-tid">${skemaInterval(sk)}</span>
    </button>`).join('');
  row.querySelectorAll('.skema-chip').forEach(btn =>
    btn.addEventListener('click', () => vaelgSkema(btn.dataset.skema))
  );
  row.dataset.built = '1';
}

function vaelgSkema(id) {
  const sk = SKEMA.find(x => x.id === id);
  if (!sk) return;
  const valgtIgen = document.querySelector(`.skema-chip[data-skema="${id}"]`)?.classList.contains('selected');
  document.getElementById('hist-start').value = valgtIgen ? '' : sk.start;
  document.getElementById('hist-end').value   = valgtIgen ? '' : sk.slut;
  if (!document.getElementById('hist-date').value)
    document.getElementById('hist-date').value = datoInput(new Date());
  syncSkemaChips();
  syncVarighedChips();
  syncFremtidNotice();
  syncOverlapNotice();
}

// Fremhæver det slot, tidsfelterne præcis svarer til — også når tiderne
// er skrevet i hånden eller kommer fra kalenderen
function syncSkemaChips() {
  const row = document.getElementById('hist-skema-row');
  if (!row) return;
  const startVal = document.getElementById('hist-start').value;
  const endVal   = document.getElementById('hist-end').value;
  const match    = skemaFraTider(startVal, endVal);
  const dateVal  = document.getElementById('hist-date').value;
  const iDag     = dateVal === datoInput(new Date());
  const nu       = iDag ? skemaNu() : null;

  row.querySelectorAll('.skema-chip').forEach(btn => {
    const valgt = !!match && btn.dataset.skema === match.id;
    btn.classList.toggle('selected', valgt);
    btn.classList.toggle('nu', !valgt && !!nu && btn.dataset.skema === nu.id);
    btn.setAttribute('aria-pressed', valgt ? 'true' : 'false');
  });
}

// ─── Varighed som hurtigvalg ──────────────────────────────
// Knapperne sætter kun sluttiden ud fra starten, så et stykke arbejde på
// 10, 20, 40 eller 60 minutter kan lægges ind uden at regne klokkeslæt ud.
function renderVarighedChips() {
  const row = document.getElementById('hist-varighed-row');
  if (!row || row.dataset.built) return;
  row.innerHTML = VARIGHEDER.map(m => `
    <button type="button" class="skema-chip skema-chip-enkel" data-min="${m}"
            aria-pressed="false" aria-label="Varighed ${m} minutter">
      <span class="skema-chip-navn">${m} min</span>
    </button>`).join('');
  row.querySelectorAll('.skema-chip').forEach(btn =>
    btn.addEventListener('click', () => vaelgVarighed(Number(btn.dataset.min)))
  );
  row.dataset.built = '1';
}

function vaelgVarighed(minutter) {
  const dateEl  = document.getElementById('hist-date');
  const startEl = document.getElementById('hist-start');
  // Åbner man arket uden tider (fx fra knappen "Ny"), regnes varigheden fra nu
  if (!dateEl.value)  dateEl.value  = datoInput(new Date());
  if (!startEl.value) startEl.value = fmtTime(new Date());

  const start = parseDateTime(dateEl.value, startEl.value);
  if (!start || isNaN(start)) { showToast('Angiv et gyldigt starttidspunkt'); return; }

  document.getElementById('hist-end').value =
    fmtTime(new Date(start.getTime() + minutter * 60000));

  syncSkemaChips();
  syncVarighedChips();
  syncFremtidNotice();
  syncOverlapNotice();
}

// Fremhæver den varighed, tidsfelterne svarer til — også når tiderne kommer
// fra et modul, fra kalenderen eller er skrevet i hånden
function syncVarighedChips() {
  const row = document.getElementById('hist-varighed-row');
  if (!row) return;
  const startVal = document.getElementById('hist-start').value;
  const endVal   = document.getElementById('hist-end').value;

  let minutter = null;
  if (startVal && endVal) {
    minutter = minutterFraTid(endVal) - minutterFraTid(startVal);
    if (minutter < 0) minutter += 1440;     // arbejde hen over midnat
  }

  row.querySelectorAll('.skema-chip').forEach(btn => {
    const valgt = minutter !== null && Number(btn.dataset.min) === minutter;
    btn.classList.toggle('selected', valgt);
    btn.setAttribute('aria-pressed', valgt ? 'true' : 'false');
  });
}

// ─── OBS ved registrering i fremtiden ─────────────────────
// Tid må gerne lægges ind, før den er brugt — fx et modul man ved man skal
// holde — men det skal fremgå tydeligt, at posten ligger frem i tiden.
// En post i fremtiden skal have en sluttid; uden en ville den blive oprettet
// som en igangværende timer, der startede senere end nu.
function starterIFremtiden() {
  const dateVal  = document.getElementById('hist-date')?.value;
  const startVal = document.getElementById('hist-start')?.value;
  if (!dateVal || !startVal) return false;
  const start = parseDateTime(dateVal, startVal);
  return !!start && start > new Date();
}

function syncFremtidNotice() {
  const el = document.getElementById('hist-fremtid');
  if (!el) return;
  const fremtid = starterIFremtiden();
  const manglerSlut = fremtid && !document.getElementById('hist-end').value;
  el.textContent = manglerSlut
    ? 'OBS · Du registrerer i fremtiden — angiv en sluttid'
    : 'OBS · Du registrerer i fremtiden';
  el.classList.toggle('hidden', !fremtid);
}

// ─── OBS ved overlap ──────────────────────────────────────
// Formularen kender ikke nødvendigvis dagens poster (listen kan stå på en
// anden periode), så de hentes for den valgte dato og et døgn til hver side
// — en post hen over midnat skal også fanges.
async function hentNaboPoster(dateVal) {
  const dag = parseDateTime(dateVal, '00:00');
  if (!dag || isNaN(dag)) { naboPoster = []; return; }
  const fra = new Date(dag); fra.setDate(fra.getDate() - 1);
  const til = new Date(dag); til.setDate(til.getDate() + 2);
  const snap = await getDocs(query(
    collection(db, `users/${userId}/entries`),
    where('startTime', '>=', Timestamp.fromDate(fra)),
    where('startTime', '<',  Timestamp.fromDate(til)),
    orderBy('startTime', 'asc'),
    limit(200)
  ));
  if (naboDato !== dateVal) return;        // datoen er skiftet imens
  naboPoster = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Formularens tidsrum, som det bliver gemt (sluttid før start = næste dag;
// ingen sluttid = en timer, der kører til nu)
function formularensTidsrum() {
  const dateVal  = document.getElementById('hist-date').value;
  const startVal = document.getElementById('hist-start').value;
  const endVal   = document.getElementById('hist-end').value;
  const start = dateVal && startVal ? parseDateTime(dateVal, startVal) : null;
  if (!start || isNaN(start)) return null;
  let slut = endVal ? parseDateTime(dateVal, endVal) : new Date();
  if (!slut || isNaN(slut)) return null;
  if (endVal && slut < start) slut = new Date(slut.getTime() + 24 * 60 * 60 * 1000);
  return slut > start ? { start, slut } : null;
}

async function syncOverlapNotice() {
  const el = document.getElementById('hist-overlap');
  if (!el) return;
  const dateVal = document.getElementById('hist-date').value;
  if (dateVal !== naboDato) {
    naboDato = dateVal;
    naboPoster = [];
    el.classList.add('hidden');
    try { await hentNaboPoster(dateVal); }
    catch (err) { console.error('Overlap-opslag fejl:', err); return; }
    if (naboDato !== dateVal) return;
  }

  const tr = formularensTidsrum();
  const acts = getLoadedActivities();
  const ramt = !tr ? [] : naboPoster.filter(p =>
    p.id !== editingId && p.startTime &&
    p.startTime.toDate() < tr.slut && slutMs(p) > tr.start.getTime()
  );
  if (!ramt.length) { el.classList.add('hidden'); return; }

  const beskriv = p => {
    const navn = erPause(p) ? PAUSE_NAVN : acts.find(a => a.id === p.activityId)?.name
      || (p.activityId ? 'Slettet aktivitet' : 'Ubundet tid');
    const til  = p.endTime ? fmtTime(p.endTime.toDate()) : 'nu';
    return `${navn} ${fmtTime(p.startTime.toDate())}–${til}`;
  };
  const dele = ramt.slice(0, 2).map(beskriv);
  if (ramt.length > 2) dele.push(`${ramt.length - 2} til`);
  const tekst = dele.length > 1 ? `${dele.slice(0, -1).join(', ')} og ${dele.at(-1)}` : dele[0];
  el.textContent = `OBS · Overlapper med ${tekst} — tiden tælles dobbelt i rapporterne`;
  el.classList.remove('hidden');
}

function updateWtVisibility() {
  const actSel = document.getElementById('hist-act-sel');
  const acts   = getLoadedActivities();
  const sel    = acts.find(a => a.id === actSel.value);
  document.getElementById('hist-wt-group').style.display =
    sel?.type === 'hold' ? '' : 'none';
}

// ─── Save ─────────────────────────────────────────────────
async function saveEntry(ev) {
  ev.preventDefault();

  const dateVal  = document.getElementById('hist-date').value;
  const startVal = document.getElementById('hist-start').value;
  const endVal   = document.getElementById('hist-end').value;

  if (!dateVal || !startVal) { showToast('Angiv dato og starttidspunkt'); return; }

  const startDate = parseDateTime(dateVal, startVal);
  if (!startDate) { showToast('Ugyldigt tidspunkt'); return; }
  const iFremtiden = startDate > new Date();
  if (iFremtiden && !endVal) {
    showToast('En registrering i fremtiden skal have en sluttid'); return;
  }

  let endDate = null, durationMinutes = null;
  if (endVal) {
    endDate = parseDateTime(dateVal, endVal);
    if (!endDate) { showToast('Ugyldig sluttid'); return; }
    // Sluttid før starttid tolkes som næste dag (arbejde hen over midnat)
    if (endDate < startDate) endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
    durationMinutes = Math.round((endDate - startDate) / 60000);
  }

  const actId  = document.getElementById('hist-act-sel').value || null;
  const acts   = getLoadedActivities();
  const selAct = acts.find(a => a.id === actId);

  if (selAct?.type === 'hold') {
    const wtChecked = document.querySelector('input[name="hist-wt"]:checked');
    if (!wtChecked) { showToast('Vælg arbejdstype for holdet'); return; }
  }

  const wt = selAct?.type === 'hold'
    ? (document.querySelector('input[name="hist-wt"]:checked')?.value || null)
    : null;

  const note = document.getElementById('hist-note').value.trim();

  const btn = document.getElementById('hist-save-btn');
  btn.disabled = true;
  try {
    const data = {
      activityId:      actId,
      workType:        wt,
      startTime:       Timestamp.fromDate(startDate),
      endTime:         endDate ? Timestamp.fromDate(endDate) : null,
      durationMinutes,
      note
    };
    if (editingId) {
      // Kun de redigérbare felter opdateres — isModule/autoStopped bevares.
      // Får en pause tildelt en aktivitet, er den ikke længere en pause.
      const felter = erPause(redigeret) && actId ? { ...data, isBreak: false } : data;
      await updateDoc(doc(db, `users/${userId}/entries/${editingId}`), felter);
      showToast(iFremtiden ? 'Registrering opdateret · i fremtiden' : 'Registrering opdateret');
    } else {
      await opretPost(userId, { ...data, isModule: false, autoStopped: false });
      showToast(iFremtiden ? 'Registrering oprettet · i fremtiden' : 'Registrering oprettet');
    }
    closeSheet('hist-sheet', 'hist-backdrop');
  } catch (err) {
    console.error('Gem entry fejl:', err);
    showToast('Kunne ikke gemme — prøv igen');
  } finally { btn.disabled = false; }
}

// ─── Delete ───────────────────────────────────────────────
async function deleteEntry() {
  if (!editingId) return;
  if (!confirm('Slet denne registrering?')) return;
  const btn = document.getElementById('hist-delete-btn');
  btn.disabled = true;
  try {
    await deleteDoc(doc(db, `users/${userId}/entries/${editingId}`));
    showToast('Registrering slettet');
    closeSheet('hist-sheet', 'hist-backdrop');
  } catch (err) {
    console.error('Slet entry fejl:', err);
    showToast('Kunne ikke slette');
  } finally { btn.disabled = false; }
}

// ─── Bind listeners ───────────────────────────────────────
function bindListeners() {
  if (listenersOk) return;
  listenersOk = true;

  document.getElementById('btn-new-entry')
    ?.addEventListener('click', () => openEntrySheet(null));

  document.getElementById('hist-period-select')
    ?.addEventListener('change', e => { periodFilter = e.target.value; renderList(); });

  document.getElementById('hist-act-filter')
    ?.addEventListener('change', e => { actFilter = e.target.value; renderList(); });

  document.getElementById('hist-backdrop')
    ?.addEventListener('click', () => closeSheet('hist-sheet', 'hist-backdrop'));
  document.getElementById('hist-sheet-close')
    ?.addEventListener('click', () => closeSheet('hist-sheet', 'hist-backdrop'));

  document.getElementById('hist-form')
    ?.addEventListener('submit', saveEntry);
  document.getElementById('hist-delete-btn')
    ?.addEventListener('click', deleteEntry);

  document.getElementById('hist-act-sel')
    ?.addEventListener('change', updateWtVisibility);

  ['hist-start', 'hist-end', 'hist-date'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', () => {
      syncSkemaChips();
      syncVarighedChips();
      syncFremtidNotice();
      syncOverlapNotice();
    })
  );
}

// ─── Formattering ─────────────────────────────────────────
function parseDateTime(dateStr, timeStr) {
  try {
    const [y, m, day] = dateStr.split('-').map(Number);
    const [hh, mm]    = timeStr.split(':').map(Number);
    return new Date(y, m - 1, day, hh, mm, 0, 0);
  } catch { return null; }
}

const DAYS = ['søndag','mandag','tirsdag','onsdag','torsdag','fredag','lørdag'];
const MONS = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];

function fmtDateHead(d) {
  const today     = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString())     return 'I dag';
  if (d.toDateString() === yesterday.toDateString()) return 'I går';
  if (d.toDateString() === tomorrow.toDateString())  return 'I morgen';
  // Dage frem i tiden får samme korte form som de nære dage bagud
  const diffDays = Math.floor((today - d) / 86400000);
  if (Math.abs(diffDays) < 7)
    return `${capitalize(DAYS[d.getDay()])} ${d.getDate()}. ${MONS[d.getMonth()]}`;
  return `${d.getDate()}. ${MONS[d.getMonth()]} ${d.getFullYear()}`;
}
