// timer.js — Trin 4+5+11: Hjem-skærm med timer, modul, start arbejde og auto-stop

import { db, showToast, getCurrentSchoolYear } from './app.js';
import { getLoadedActivities, isActivitiesLoaded, aktiviteterHentet } from './activities.js';
import { getSettings } from './indstillinger.js';
import { MODULER, skemaDatoer, skemaLaengde, skemaInterval, skemaNu } from './skema.js';
import { opretPost } from './pauser.js';
import {
  collection, doc, updateDoc,
  onSnapshot, query, where, limit, getDocs, orderBy,
  serverTimestamp, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// ─── State ────────────────────────────────────────────────
let userId          = null;
let activeEntry     = null;
let pendingAct      = null;
let modulHoldId     = null;
let modulWhen       = 'nu';
let modulSkemaId    = null;
let tickIv          = null;
let unsubActive     = null;
let listenersOk     = false;
let autoStopTimerId = null;
let sessionAutoStopWarned = false;

// ─── Init ─────────────────────────────────────────────────
export function initTimerView(uid) {
  if (userId === uid) return;
  userId = uid;
  setupActiveListener();
  bindListeners();
  refreshQuickStart();
}

export function refreshQuickStart() {
  if (!userId) return;
  if (isActivitiesLoaded()) { loadQuickStart(); return; }
  // Vent på aktivitetslytteren frem for at spørge igen hvert 350. ms —
  // hurtigstarten kommer så på skærmen i samme øjeblik, aktiviteterne er der
  aktiviteterHentet().then(() => { if (userId) loadQuickStart(); });
}

// ─── Active entry listener ────────────────────────────────
function setupActiveListener() {
  if (unsubActive) unsubActive();
  unsubActive = onSnapshot(
    query(collection(db, `users/${userId}/entries`), where('endTime', '==', null), limit(2)),
    snap => {
      activeEntry = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };

      clearTimeout(autoStopTimerId);
      autoStopTimerId = null;

      if (activeEntry?.startTime) {
        // Et modul har en planlagt varighed; håndhæves her (og ikke med et løst
        // setTimeout), så stoppet også sker efter genindlæsning af appen
        const settingsMins = getSettings().autoStopAfterMinutes ?? 600;
        const planned      = activeEntry.plannedDurationMinutes ?? null;
        const isPlanned    = planned != null && planned <= settingsMins;
        const limitMins    = isPlanned ? planned : settingsMins;
        const limitMs      = limitMins * 60 * 1000;
        const elapsed = Date.now() - activeEntry.startTime.toDate().getTime();
        if (elapsed >= limitMs) {
          autoStopEntry(activeEntry, limitMins, isPlanned);
        } else {
          autoStopTimerId = setTimeout(() => {
            if (activeEntry) autoStopEntry(activeEntry, limitMins, isPlanned);
          }, limitMs - elapsed);
        }
      } else if (!sessionAutoStopWarned) {
        sessionAutoStopWarned = true;
        checkRecentAutoStop();
      }

      renderTimerState();
    },
    err => console.error('Active entry listener:', err)
  );
}

// ─── Auto-stop ────────────────────────────────────────────
// capMins begrænser varigheden (og sluttiden), så et modul der først opdages
// efter planlagt sluttid — fx fordi appen var lukket — ikke registrerer for meget.
async function autoStopEntry(entry, capMins, isPlanned = false) {
  try {
    const startMs = entry.startTime?.toDate()?.getTime() ?? Date.now();
    let duration  = Math.max(0, Math.round((Date.now() - startMs) / 60000));
    let endMs     = Date.now();
    if (capMins != null && duration >= capMins) {
      duration = capMins;
      endMs    = startMs + capMins * 60000;
    }
    await updateDoc(doc(db, `users/${userId}/entries/${entry.id}`), {
      endTime: Timestamp.fromMillis(endMs), durationMinutes: duration, autoStopped: !isPlanned
    });
    sessionAutoStopWarned = true;
    showToast(isPlanned
      ? `Modul afsluttet · ${fmtMins(duration)}`
      : `Timer stoppet automatisk · ${fmtMins(duration)}`, 5000);
  } catch (err) {
    console.error('Auto-stop fejl:', err);
  }
}

async function checkRecentAutoStop() {
  try {
    // Hent seneste entries og filtrér client-side — undgår composite index,
    // og orderBy sikrer at det faktisk er de nyeste der tjekkes
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const snap  = await getDocs(
      query(
        collection(db, `users/${userId}/entries`),
        orderBy('startTime', 'desc'),
        limit(50)
      )
    );
    const recent = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(e => e.autoStopped && e.endTime && e.endTime.toDate().getTime() >= since)
      .sort((a, b) => b.endTime.toDate() - a.endTime.toDate());

    if (!recent.length) return;
    const e    = recent[0];
    const acts = getLoadedActivities();
    const act  = acts.find(a => a.id === e.activityId);
    const name = act?.name || 'Timer';
    showToast(`"${name}" blev stoppet automatisk`, 5000);
  } catch { /* stille */ }
}

// ─── Render active timer ──────────────────────────────────
function renderTimerState() {
  const card   = document.getElementById('timer-card');
  const banner = document.getElementById('active-timer-banner');
  const qlabel = document.getElementById('qs-section-label');
  if (!card || !banner) return;

  if (activeEntry?.startTime) {
    const acts  = getLoadedActivities();
    const act   = acts.find(a => a.id === activeEntry.activityId);
    const color = act?.color || 'var(--accent)';
    const name  = act?.name  || 'Ubundet tid';
    const wt    = activeEntry.workType || '';

    card.classList.remove('hidden');
    card.style.setProperty('--act-color', color);
    document.getElementById('timer-act-name').textContent = name;
    const wtEl = document.getElementById('timer-worktype');
    wtEl.textContent   = wt ? capitalize(wt) : '';
    wtEl.style.display = wt ? '' : 'none';

    banner.classList.remove('hidden');
    banner.style.setProperty('--act-color', color);
    document.getElementById('banner-act-name').textContent =
      wt ? `${name} · ${capitalize(wt)}` : name;

    if (qlabel) qlabel.textContent = 'Skift til...';
    startTick();
  } else {
    card.classList.add('hidden');
    banner.classList.add('hidden');
    if (qlabel) qlabel.textContent = 'Hurtigstart';
    stopTick();
  }
}

// ─── Elapsed tick ─────────────────────────────────────────
function startTick() {
  clearInterval(tickIv); tick();
  tickIv = setInterval(tick, 1000);
}
function stopTick() { clearInterval(tickIv); tickIv = null; }

function tick() {
  if (!activeEntry?.startTime) return;
  const secs = Math.floor((Date.now() - activeEntry.startTime.toDate()) / 1000);
  const str  = fmtSecs(secs);
  const e1 = document.getElementById('timer-elapsed');
  const e2 = document.getElementById('banner-elapsed');
  if (e1) e1.textContent = str;
  if (e2) e2.textContent = str;
}

// ─── Quick-start ──────────────────────────────────────────
async function loadQuickStart() {
  const acts    = getLoadedActivities();
  const year    = getCurrentSchoolYear();
  const topActs = acts.filter(a => a.schoolYear === year && !a.isArchived && !a.parentId);
  const grid    = document.getElementById('quickstart-grid');
  const empty   = document.getElementById('home-empty');
  if (!grid) return;

  if (!topActs.length) {
    grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  const usage    = await getUsageCounts();
  const children = acts.filter(a => a.parentId && a.schoolYear === year && !a.isArchived);
  const hasKids  = id => children.some(c => c.parentId === id);

  const sorted = [...topActs].sort((a, b) => {
    const d = (usage[b.id] || 0) - (usage[a.id] || 0);
    return d !== 0 ? d : (a.order || 0) - (b.order || 0);
  });

  grid.innerHTML = sorted.map(a => {
    const color = a.color || 'var(--accent)';
    const arrow = a.type === 'hold' || hasKids(a.id);
    return `<button class="qs-btn" data-id="${a.id}" style="--act-color:${color}">
      <div class="qs-dot"></div>
      <div class="qs-name">${esc(a.name)}</div>
      ${arrow ? `<svg class="qs-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>` : ''}
    </button>`;
  }).join('');

  grid.querySelectorAll('.qs-btn').forEach(btn =>
    btn.addEventListener('click', () => handleActivityTap(btn.dataset.id))
  );
}

async function getUsageCounts() {
  const counts = {};
  try {
    const snap = await getDocs(
      query(collection(db, `users/${userId}/entries`), orderBy('startTime', 'desc'), limit(200))
    );
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    snap.docs.forEach(d => {
      const e = d.data();
      if (e.startTime?.toDate().getTime() >= cutoff && e.activityId)
        counts[e.activityId] = (counts[e.activityId] || 0) + 1;
    });
  } catch { /* fald tilbage til order */ }
  return counts;
}

// ─── Activity tap ─────────────────────────────────────────
function handleActivityTap(actId) {
  const acts     = getLoadedActivities();
  const act      = acts.find(a => a.id === actId);
  if (!act) return;
  const children = acts.filter(a =>
    a.parentId === actId && a.schoolYear === act.schoolYear && !a.isArchived
  );
  if (act.type === 'hold')   return openWorktypeSheet(act);
  if (children.length)       return openChildSheet(act, children);
  startTimer(actId, null);
}

// ─── Worktype sheet ───────────────────────────────────────
function openWorktypeSheet(act) {
  pendingAct = act;
  document.getElementById('wt-sheet-title').textContent = act.name;
  openSheet('wt-sheet', 'wt-backdrop');
}

// ─── Child sheet ──────────────────────────────────────────
function openChildSheet(act, children) {
  pendingAct = act;
  document.getElementById('child-sheet-title').textContent = act.name;
  const list = document.getElementById('child-list');
  list.innerHTML =
    `<button class="child-btn" data-id="${act.id}">
      <div class="child-btn-name">Generelt</div>
      <div class="child-btn-sub">Tid registreret direkte på ${esc(act.name)}</div>
    </button>` +
    children.map(c => `
    <button class="child-btn" data-id="${c.id}">
      <div class="child-btn-name">${esc(c.name)}</div>
      ${c.budgetHours ? `<div class="child-btn-sub">${c.budgetHours}t budget</div>` : ''}
    </button>`).join('');
  list.querySelectorAll('.child-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      closeSheet('child-sheet', 'child-backdrop');
      startTimer(btn.dataset.id, null);
    })
  );
  openSheet('child-sheet', 'child-backdrop');
}

// ─── 1 Modul ──────────────────────────────────────────────
// Et modul er altid 95 min (5 min pause medregnet) — længden står ét sted,
// i skemaet, så "Nu" og "For … min siden" giver det samme som et modul
// valgt fra skemaet
function getModuleMins() {
  return skemaLaengde(MODULER[0]);
}

function openModulSheet() {
  const acts  = getLoadedActivities();
  const year  = getCurrentSchoolYear();
  const holds = acts.filter(a => a.type === 'hold' && a.schoolYear === year && !a.isArchived);

  if (!holds.length) { showToast('Ingen hold i ' + year); return; }

  const mins = getModuleMins();
  const nuEl    = document.getElementById('modul-len-nu');
  const bagudEl = document.getElementById('modul-len-bagud');
  if (nuEl)    nuEl.textContent    = mins;
  if (bagudEl) bagudEl.textContent = mins;

  // Reset state
  modulHoldId  = null;
  modulWhen    = 'nu';
  modulSkemaId = null;
  const stepHold = document.getElementById('modul-step-hold');
  const stepWhen = document.getElementById('modul-step-when');
  stepHold.classList.remove('hidden');
  stepWhen.classList.add('hidden');
  document.getElementById('modul-tid-row').classList.add('hidden');
  document.querySelectorAll('.modul-when-btn').forEach(b => b.classList.remove('selected'));

  if (holds.length === 1) {
    goToModulWhen(holds[0]);
  } else {
    const list = document.getElementById('modul-hold-list');
    list.innerHTML = holds.map(h => `
      <button class="modul-hold-btn" data-id="${h.id}" style="--act-color:${h.color || 'var(--accent)'}">
        <div class="qs-dot"></div>
        <div class="qs-name">${esc(h.name)}</div>
      </button>`).join('');
    list.querySelectorAll('.modul-hold-btn').forEach(btn =>
      btn.addEventListener('click', () =>
        goToModulWhen(holds.find(h => h.id === btn.dataset.id))
      )
    );
  }
  openSheet('modul-sheet', 'modul-backdrop');
}

function goToModulWhen(hold) {
  modulHoldId = hold.id;
  document.getElementById('modul-step-hold').classList.add('hidden');
  document.getElementById('modul-step-when').classList.remove('hidden');
  document.getElementById('modul-hold-name-label').textContent = `${hold.name} · Undervisning`;

  renderModulSkema();

  // Kører vi midt i et modul, er det næsten altid det, man vil registrere;
  // ellers falder vi tilbage til "Nu"
  const nu       = skemaNu();
  const nuKnap   = nu && MODULER.some(m => m.id === nu.id)
    ? document.querySelector(`.modul-when-btn[data-slot="${nu.id}"]`)
    : null;
  selectWhenBtn(nuKnap || document.querySelector('.modul-when-btn[data-when="nu"]'));

  const now = new Date();
  document.getElementById('modul-tid-input').value =
    `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  syncModulFremtid();
}

// Skemaets moduler som hurtigvalg — frokosten hører ikke til her, den
// registreres i historikkens formular
function renderModulSkema() {
  const list = document.getElementById('modul-skema-list');
  if (!list) return;
  const nu = skemaNu();
  list.innerHTML = MODULER.map(m => {
    const igang = nu?.id === m.id;
    return `<button class="modul-when-btn" data-when="slot" data-slot="${m.id}" aria-pressed="false">
      <div class="modul-when-icon">${m.nr}</div>
      <div class="modul-when-body">
        <div class="modul-when-title">${esc(m.navn)}</div>
        <div class="modul-when-sub">${skemaInterval(m)} · ${skemaLaengde(m)} min${igang ? ' · i gang nu' : ''}</div>
      </div>
    </button>`;
  }).join('');
  list.querySelectorAll('.modul-when-btn').forEach(btn =>
    btn.addEventListener('click', () => selectWhenBtn(btn))
  );
}

function selectWhenBtn(btn) {
  if (!btn) return;
  document.querySelectorAll('.modul-when-btn').forEach(b => {
    b.classList.remove('selected');
    b.setAttribute('aria-pressed', 'false');
  });
  btn.classList.add('selected');
  btn.setAttribute('aria-pressed', 'true');
  modulWhen    = btn.dataset.when;
  modulSkemaId = btn.dataset.slot || null;
  document.getElementById('modul-tid-row').classList.toggle('hidden', modulWhen !== 'andet');
  syncModulFremtid();
}

// Et modul må gerne registreres, før det er holdt — men det skal fremgå
function syncModulFremtid() {
  const el = document.getElementById('modul-fremtid');
  if (!el) return;
  el.classList.toggle('hidden', !modulStarterIFremtiden());
}

function modulStarterIFremtiden() {
  if (modulWhen === 'slot') {
    const sk = MODULER.find(m => m.id === modulSkemaId);
    return !!sk && skemaDatoer(sk).start > new Date();
  }
  if (modulWhen === 'andet') {
    const timeVal = document.getElementById('modul-tid-input')?.value;
    if (!timeVal) return false;
    const [hh, mm] = timeVal.split(':').map(Number);
    const start = new Date(); start.setHours(hh, mm, 0, 0);
    return start > new Date();
  }
  return false;
}

async function confirmModul() {
  if (!modulHoldId) { showToast('Vælg et hold'); return; }
  const btn  = document.getElementById('btn-do-modul');
  const mins = getModuleMins();
  btn.disabled = true;

  try {
    if (modulWhen === 'slot') {
      const sk = MODULER.find(m => m.id === modulSkemaId);
      if (!sk) { showToast('Vælg et modul'); return; }
      const { start, slut } = skemaDatoer(sk);
      const laengde = skemaLaengde(sk);
      const nu      = Date.now();

      if (start.getTime() > nu) {
        // Modulet ligger frem i tiden: det registreres som planlagt tid i hele
        // sin længde — ikke som en timer, der skulle være startet før nu
        await opretPost(userId, {
          activityId: modulHoldId, workType: 'undervisning',
          startTime: Timestamp.fromDate(start), endTime: Timestamp.fromDate(slut),
          durationMinutes: laengde, note: '', isModule: true, autoStopped: false
        });
        showToast(`${sk.navn} registreret i fremtiden · ${skemaInterval(sk)}`);

      } else if (slut.getTime() <= nu) {
        await opretPost(userId, {
          activityId: modulHoldId, workType: 'undervisning',
          startTime: Timestamp.fromDate(start), endTime: Timestamp.fromDate(slut),
          durationMinutes: laengde, note: '', isModule: true, autoStopped: false
        });
        showToast(`${sk.navn} registreret · ${skemaInterval(sk)}`);
      } else {
        // Modulet kører stadig: timeren løber fra modulets start og stoppes
        // automatisk ved modulets sluttid
        if (activeEntry) await stopEntry(activeEntry, false);
        await opretPost(userId, {
          activityId: modulHoldId, workType: 'undervisning',
          startTime: Timestamp.fromDate(start), endTime: null,
          durationMinutes: null, note: '', isModule: true, autoStopped: false,
          plannedDurationMinutes: laengde
        });
        showToast(`${sk.navn} i gang · stopper kl. ${sk.slut}`);
      }

    } else if (modulWhen === 'nu') {
      if (activeEntry) await stopEntry(activeEntry, false);
      // plannedDurationMinutes håndhæves af active-entry-lytteren, så modulet
      // også stoppes til tiden efter en genindlæsning af appen
      await opretPost(userId, {
        activityId: modulHoldId, workType: 'undervisning',
        startTime: serverTimestamp(), endTime: null,
        durationMinutes: null, note: '', isModule: true, autoStopped: false,
        plannedDurationMinutes: mins
      });
      showToast(`Modul startet · stopper om ${mins}m`);

    } else if (modulWhen === 'bagud') {
      const endMs   = Date.now();
      const startMs = endMs - mins * 60 * 1000;
      await opretPost(userId, {
        activityId: modulHoldId, workType: 'undervisning',
        startTime: Timestamp.fromMillis(startMs), endTime: Timestamp.fromMillis(endMs),
        durationMinutes: mins, note: '', isModule: true, autoStopped: false
      });
      showToast(`Modul registreret · ${fmtMins(mins)}`);

    } else {
      // Andet tidspunkt
      const timeVal = document.getElementById('modul-tid-input').value;
      if (!timeVal) { showToast('Vælg et starttidspunkt'); btn.disabled = false; return; }

      const [hh, mm] = timeVal.split(':').map(Number);
      const start = new Date(); start.setHours(hh, mm, 0, 0);
      const iFremtiden = start > new Date();

      const end = new Date(start.getTime() + mins * 60 * 1000);
      await opretPost(userId, {
        activityId: modulHoldId, workType: 'undervisning',
        startTime: Timestamp.fromDate(start), endTime: Timestamp.fromDate(end),
        durationMinutes: mins, note: '', isModule: true, autoStopped: false
      });
      showToast(iFremtiden
        ? `Modul registreret i fremtiden · kl. ${timeVal}`
        : `Modul registreret · kl. ${timeVal}`);
    }

    closeSheet('modul-sheet', 'modul-backdrop');
  } catch (err) {
    console.error('Modul fejl:', err);
    showToast('Kunne ikke registrere modul');
  } finally { btn.disabled = false; }
}

// ─── Start / stop timer ───────────────────────────────────
export async function startTimer(activityId, workType) {
  if (activeEntry?.activityId === activityId && activeEntry?.workType === workType) {
    showToast('Allerede i gang'); return;
  }
  try {
    if (activeEntry) await stopEntry(activeEntry, false);
    await opretPost(userId, {
      activityId: activityId || null, workType: workType || null,
      startTime: serverTimestamp(), endTime: null,
      durationMinutes: null, note: '', isModule: false, autoStopped: false
    });
    const act  = getLoadedActivities().find(a => a.id === activityId);
    const name = activityId ? (act?.name || 'Timer') : 'Ubundet tid';
    const wt   = workType ? ` · ${capitalize(workType)}` : '';
    showToast(`${name}${wt}`);
  } catch (err) {
    console.error('Start timer fejl:', err);
    showToast('Kunne ikke starte timer');
  }
}

export async function stopActiveTimer() {
  if (!activeEntry) return;
  try { await stopEntry(activeEntry, true); }
  catch (err) { console.error('Stop timer fejl:', err); showToast('Kunne ikke stoppe timer'); }
}

async function stopEntry(entry, showMsg) {
  const now      = Timestamp.fromDate(new Date());
  const startMs  = entry.startTime?.toDate()?.getTime() ?? Date.now();
  const duration = Math.max(0, Math.round((Date.now() - startMs) / 60000));
  await updateDoc(doc(db, `users/${userId}/entries/${entry.id}`), {
    endTime: now, durationMinutes: duration
  });
  if (showMsg) showToast(`Stoppet · ${fmtMins(duration)}`);
  return duration;
}

// ─── Sheet open/close ─────────────────────────────────────
function openSheet(id, bdId) {
  document.getElementById(id).classList.remove('hidden');
  document.getElementById(bdId).classList.remove('hidden');
  requestAnimationFrame(() => {
    document.getElementById(id).classList.add('open');
    document.getElementById(bdId).classList.add('open');
  });
}
function closeSheet(id, bdId) {
  document.getElementById(id).classList.remove('open');
  document.getElementById(bdId).classList.remove('open');
  setTimeout(() => {
    document.getElementById(id).classList.add('hidden');
    document.getElementById(bdId).classList.add('hidden');
  }, 280);
}

// ─── Event listeners ─────────────────────────────────────
function bindListeners() {
  if (listenersOk) return;
  listenersOk = true;

  document.getElementById('btn-stop-timer')?.addEventListener('click', stopActiveTimer);
  document.getElementById('banner-stop')?.addEventListener('click', stopActiveTimer);

  // "Start arbejde"
  document.getElementById('btn-start-arbejde')?.addEventListener('click', () =>
    startTimer(null, null)
  );

  // "1 modul"
  document.getElementById('btn-1-modul')?.addEventListener('click', openModulSheet);

  // Worktype sheet
  document.getElementById('wt-backdrop')?.addEventListener('click', () => closeSheet('wt-sheet', 'wt-backdrop'));
  document.getElementById('wt-close')?.addEventListener('click', () => closeSheet('wt-sheet', 'wt-backdrop'));
  document.querySelectorAll('.wt-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      closeSheet('wt-sheet', 'wt-backdrop');
      if (pendingAct) startTimer(pendingAct.id, btn.dataset.type);
    })
  );

  // Child sheet
  document.getElementById('child-backdrop')?.addEventListener('click', () => closeSheet('child-sheet', 'child-backdrop'));
  document.getElementById('child-close')?.addEventListener('click', () => closeSheet('child-sheet', 'child-backdrop'));

  // Modul sheet
  document.getElementById('modul-backdrop')?.addEventListener('click', () => closeSheet('modul-sheet', 'modul-backdrop'));
  document.getElementById('modul-close')?.addEventListener('click', () => closeSheet('modul-sheet', 'modul-backdrop'));
  document.querySelectorAll('.modul-when-btn').forEach(btn =>
    btn.addEventListener('click', () => selectWhenBtn(btn))
  );
  document.getElementById('modul-tid-input')?.addEventListener('input', syncModulFremtid);
  document.getElementById('btn-do-modul')?.addEventListener('click', confirmModul);
}

// ─── Formattering ─────────────────────────────────────────
const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const esc        = s => s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';

function fmtSecs(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    : `${m}:${String(sec).padStart(2,'0')}`;
}

export function fmtMins(m) {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60), r = m % 60;
  return r > 0 ? `${h}t ${r}m` : `${h}t`;
}
