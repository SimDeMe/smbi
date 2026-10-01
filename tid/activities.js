// activities.js — Trin 3: Aktiviteter CRUD

import { db, COLOR_PALETTE, getCurrentSchoolYear, showToast } from './app.js';
import { fmtMins } from './timer.js';
import { beregnNormer, faktorerFor, budgetTimer, fmtTimer, tolkTal, aarsnormTimer, timerTilModuler } from './normer.js';
import { optjeningFor } from './akkord.js';
import { renderSaetListe } from './rettet.js';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, limit, writeBatch, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// ─── State ────────────────────────────────────────────────
let userId       = null;
let activities   = [];
let entries      = [];
let selectedYear = '';
let editingId    = null;
let unsub        = null;
let unsubEntries = null;
let listenersOk  = false;

// ─── Eksportér aktiviteter til andre moduler ──────────────
let activitiesLoaded = false;
export const getLoadedActivities  = () => activities;
export const isActivitiesLoaded   = () => activitiesLoaded;

// Lytteren nedenfor svarer alligevel på "har brugeren aktiviteter?" — så
// hverken onboarding eller hurtigstart skal stille spørgsmålet en ekstra gang.
// Løftet indfries med true, hvis der er mindst én aktivitet.
let loesFoersteHentning;
const foersteHentning = new Promise(r => { loesFoersteHentning = r; });
export const aktiviteterHentet = () => foersteHentning;

// ─── Init (kaldes fra app.js efter login) ─────────────────
export function initActivitiesView(uid) {
  if (userId === uid && unsub) return;
  userId = uid;
  selectedYear = getCurrentSchoolYear();
  startListener();
  bindListeners();
}

// ─── Realtime listener ────────────────────────────────────
function startListener() {
  if (unsub) unsub();
  unsub = onSnapshot(
    query(collection(db, `users/${userId}/activities`), orderBy('order', 'asc')),
    snap => {
      activities = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      activitiesLoaded = true;
      loesFoersteHentning(activities.length > 0);
      renderYearSelect();
      renderList();
    },
    err => {
      console.error('Activities listener:', err);
      showToast('Fejl ved indlæsning');
      // Kan vi ikke se aktiviteterne, ved vi heller ikke, om de mangler —
      // og så er det forkert at møde brugeren med onboarding
      loesFoersteHentning(true);
    }
  );
}

// ─── Tidsregistreringer — kun til forbrugstallene på denne side ───────────
// De hentes først, når siden åbnes. Ved opstart ville de være hele brugerens
// historik hentet ned for at udfylde nogle tal, ingen kigger på endnu — og
// regningen ville vokse for hver måned, appen blev brugt.
export function refreshAktiviteter() {
  if (!userId || unsubEntries) return;
  unsubEntries = onSnapshot(
    query(collection(db, `users/${userId}/entries`), limit(5000)),
    snap => {
      entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderList();
    },
    err => console.error('Activities entries listener:', err)
  );
}

// ─── Tidsforbrug pr. aktivitet ────────────────────────────
// Summér registrerede minutter pr. activityId.
function spentByActivity() {
  const m = {};
  entries.forEach(e => {
    if (!e.activityId || e.durationMinutes == null) return;
    m[e.activityId] = (m[e.activityId] || 0) + e.durationMinutes;
  });
  return m;
}

// Forbrug for én række: egen tid + (for topopgaver) underopgavernes tid.
// Arkiverede underopgaver vises som egne rækker under "Afsluttet" og holdes
// derfor ude af forælderens total — samme regel som i rapporter.js.
function rowSpent(a, spent) {
  let total = spent[a.id] || 0;
  if (!a.parentId) {
    activities.forEach(c => {
      if (c.parentId === a.id && !c.isArchived) total += spent[c.id] || 0;
    });
  }
  return total;
}

// ─── Year selector ────────────────────────────────────────
function renderYearSelect() {
  const sel = document.getElementById('act-year-select');
  if (!sel) return;
  const years = [...new Set(activities.map(a => a.schoolYear).filter(Boolean))].sort();
  const cur = getCurrentSchoolYear();
  if (!years.includes(cur)) years.push(cur);
  years.sort();
  // Skift til det seneste år MED aktiviteter, hvis det valgte år er tomt
  const withActs = years.filter(y => activities.some(a => a.schoolYear === y && !a.isArchived));
  if (withActs.length && !activities.some(a => a.schoolYear === selectedYear && !a.isArchived)) {
    selectedYear = withActs[withActs.length - 1];
  } else if (!years.includes(selectedYear)) {
    selectedYear = cur;
  }
  sel.innerHTML = years.map(y =>
    `<option value="${y}"${y === selectedYear ? ' selected' : ''}>${y}</option>`
  ).join('');
}

// ─── Activity list ────────────────────────────────────────
function renderList() {
  const el = document.getElementById('act-list');
  if (!el) return;

  const spent  = spentByActivity();
  const yr     = activities.filter(a => a.schoolYear === selectedYear && !a.isArchived);
  const hold   = yr.filter(a => a.type === 'hold');
  const topOpg = yr.filter(a => a.type === 'opgave' && !a.parentId);
  let html = '';

  if (hold.length) {
    html += sectionHead('Hold');
    hold.forEach(a => { html += actRow(a, false, rowSpent(a, spent)); });
  }

  html += sectionHead('Opgaver');
  if (topOpg.length) {
    topOpg.forEach(a => {
      html += actRow(a, false, rowSpent(a, spent));
      yr.filter(c => c.parentId === a.id).forEach(c => { html += actRow(c, true, rowSpent(c, spent)); });
    });
  }

  // Afsluttede (arkiverede) aktiviteter — vis nederst, kan genåbnes.
  // Inkludér også arkiverede underopgaver, så de ikke forsvinder helt.
  const archived = activities
    .filter(a => a.schoolYear === selectedYear && a.isArchived);
  if (archived.length) {
    html += sectionHead('Afsluttet');
    archived.forEach(a => { html += actRow(a, !!a.parentId, rowSpent(a, spent)); });
  }

  if (!yr.length && !archived.length) {
    html = `<div class="act-empty">Ingen aktiviteter for <strong>${selectedYear}</strong><br>Tryk "+ Ny aktivitet" for at begynde</div>`;
  }

  el.innerHTML = html;
  el.querySelectorAll('.act-row').forEach(row =>
    row.addEventListener('click', () => openActSheet(row.dataset.id))
  );
}

const sectionHead = label =>
  `<div class="act-section-head">${label}</div>`;

function actRow(a, child = false, spentMins = 0) {
  const color  = a.color || COLOR_PALETTE[0];
  const budgetH    = budgetTimer(a);
  const budgetMins = budgetH != null ? Math.round(budgetH * 60) : null;

  let stats;
  if (budgetMins != null) {
    const remain = budgetMins - spentMins;
    const remainTxt = remain >= 0
      ? `<span class="act-stat-remain">${fmtMins(remain)} tilbage</span>`
      : `<span class="act-stat-remain act-stat-over">${fmtMins(-remain)} over</span>`;
    stats = `<span class="act-stat-used">${fmtMins(spentMins)}</span>` +
            `<span class="act-stat-budget">/ ${fmtTimer(budgetH)}t</span>` +
            remainTxt;
  } else {
    stats = `<span class="act-stat-used">${fmtMins(spentMins)} brugt</span>`;
  }

  return `<div class="act-row${child ? ' act-row-child' : ''}${a.isArchived ? ' act-row-archived' : ''}" data-id="${a.id}">
    <div class="act-color-dot" style="background:${color}"></div>
    <div class="act-row-body">
      <div class="act-row-name">${esc(a.name)}</div>
      ${a.note ? `<div class="act-row-note">${esc(a.note)}</div>` : ''}
      <div class="act-row-stats">${stats}</div>
    </div>
    <div class="act-row-meta">
      ${a.isArchived ? `<span class="act-row-archived-badge">Afsluttet</span>` : ''}
      <svg class="act-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  </div>`;
}

// ─── Open create/edit sheet ───────────────────────────────
function openActSheet(actId) {
  editingId = actId || null;
  const a = actId ? activities.find(x => x.id === actId) : null;

  document.getElementById('act-sheet-title').textContent = a ? 'Redigér aktivitet' : 'Ny aktivitet';
  // Typen kan skiftes på en eksisterende aktivitet, så længe den står alene —
  // fx en opgave, der i virkeligheden er hold. Tiden på den følger med.
  document.getElementById('field-type').style.display    = a && !kanSkifteType(a) ? 'none' : '';

  document.getElementById('act-name').value   = a?.name       || '';
  document.getElementById('act-budget').value = a?.budgetHours ?? '';
  document.getElementById('act-year').value   = a?.schoolYear  || selectedYear;
  document.getElementById('act-note').value   = a?.note        || '';
  const g = a?.normGrundlag || {};
  NORM_FELTER.forEach(([id, key]) => {
    document.getElementById(id).value = g[key] != null ? String(g[key]).replace('.', ',') : '';
  });
  visAeldreAarsnorm(g);

  const typeVal = a?.type || 'opgave';
  const radio = document.querySelector(`input[name="act-type"][value="${typeVal}"]`);
  if (radio) radio.checked = true;
  const optRadio = document.querySelector(`input[name="act-optjening"][value="${optjeningFor(a)}"]`);
  if (optRadio) optRadio.checked = true;
  document.getElementById('act-fremdrift').value = a?.fremdrift ?? '';
  renderSaetListe(a);
  toggleParentField(typeVal);
  populateParentSelect(a?.schoolYear || selectedYear, a?.parentId || '');
  renderColorPicker(a?.color || '');
  opdaterUdregning();

  document.getElementById('act-delete-btn').classList.toggle('hidden', !a);

  const archiveBtn = document.getElementById('act-archive-btn');
  archiveBtn.classList.toggle('hidden', !a);
  if (a) archiveBtn.textContent = a.isArchived ? 'Genåbn opgave' : 'Afslut opgave';

  openSheet('act-sheet', 'act-backdrop');
}

function toggleParentField(type) {
  document.getElementById('field-parent').style.display    = type === 'opgave' ? '' : 'none';
  document.getElementById('field-norm').style.display      = type === 'hold'   ? '' : 'none';
  document.getElementById('field-optjening').style.display = type === 'opgave' ? '' : 'none';
  // Sættene hører til et gemt hold — et nyt hold har ingen endnu
  const gemt = editingId ? activities.find(x => x.id === editingId) : null;
  document.getElementById('field-saet').style.display =
    type === 'hold' && gemt?.type === 'hold' ? '' : 'none';
  visOptjening();
}

// ─── Optjening (kun opgaver) ──────────────────────────────
// Hvordan opgavens budget tælles som optjent i akkordregnskabet — se akkord.js
const OPTJENING_HJAELP = {
  loebende:   'Budgettet optjenes jævnt hen over skoleåret — fx udvalg og teamledelse.',
  afslutning: 'Intet er optjent, før du trykker «Afslut opgave» — så er hele budgettet optjent. Fx eksamen og SRP.',
  manuel:     'Du skriver selv, hvor stor en del af opgaven der er færdig.'
};
const formOptjening = () =>
  document.querySelector('input[name="act-optjening"]:checked')?.value || 'loebende';

function visOptjening() {
  const m = formOptjening();
  document.getElementById('act-optjening-hint').textContent = OPTJENING_HJAELP[m];
  document.getElementById('field-fremdrift').style.display = m === 'manuel' ? '' : 'none';
}

// ─── Normgrundlag (kun hold) ──────────────────────────────
// Felt-id → nøgle i activity.normGrundlag. Se normer.js for formlen.
const NORM_FELTER = [
  ['act-aarsnorm',   'moduler'],
  ['act-elever',     'elever'],
  ['act-fordybelse', 'fordybelsestid'],
  ['act-pulje',      'puljetimer'],
  ['act-tillaeg',    'tillaeg'],
  ['act-antal-hold', 'antalHold']
];

// Hold kan ikke have under-aktiviteter, så kun en aktivitet uden børn og
// uden forælder kan skifte type
const kanSkifteType = a =>
  !a.parentId && !activities.some(c => c.parentId === a.id);

const formType = () => {
  const a = editingId ? activities.find(x => x.id === editingId) : null;
  return a && !kanSkifteType(a)
    ? a.type
    : document.querySelector('input[name="act-type"]:checked')?.value;
};

// Normgrundlaget, som det står i formularen — null, hvis årsnormen er tom
function laesNormgrundlag() {
  if (formType() !== 'hold') return null;
  const g = {};
  NORM_FELTER.forEach(([id, key]) => {
    const v = tolkTal(document.getElementById(id).value);
    if (v != null) g[key] = v;
  });
  // En ældre årsnorm i timer, som ikke er rørt, gemmes uændret — så
  // flytter budgettet sig ikke en brøkdel, fordi modulerne er afrundet
  const felt = document.getElementById('act-aarsnorm');
  if (felt.dataset.timer && felt.value === felt.dataset.vist) {
    delete g.moduler;
    g.aarsnorm = Number(felt.dataset.timer);
  }
  return g.moduler != null || g.aarsnorm != null ? g : null;
}

// Et hold gemt før årsnormen blev tastet i moduler, har den i timer.
// Den vises omregnet til moduler; rettes feltet, gemmes modulerne.
function visAeldreAarsnorm(g) {
  const felt = document.getElementById('act-aarsnorm');
  delete felt.dataset.timer;
  delete felt.dataset.vist;
  if (Number.isFinite(g.moduler) || !Number.isFinite(g.aarsnorm)) return;
  const m = Math.round(timerTilModuler(g.aarsnorm) * 100) / 100;
  felt.value = String(m).replace('.', ',');
  felt.dataset.timer = String(g.aarsnorm);
  felt.dataset.vist  = felt.value;
}

// Er normgrundlaget udfyldt, er budgettet regnet ud og kan ikke skrives i
// hånden; udregningen står under felterne, så man kan tjekke den mod arket.
function opdaterUdregning() {
  const ud     = document.getElementById('act-norm-udregning');
  const budget = document.getElementById('act-budget');
  const g      = laesNormgrundlag();
  const aar    = document.getElementById('act-year').value.trim() || selectedYear;
  const n      = g ? beregnNormer(g, faktorerFor(aar)) : null;

  if (!n) {
    if (budget.readOnly) budget.value = '';
    budget.readOnly = false;
    ud.innerHTML = '';
    return;
  }
  budget.readOnly = true;
  budget.value = Math.round(n.total * 100) / 100;
  const { faktor, reduktion } = faktorerFor(aar);
  ud.innerHTML = `
    <span class="norm-udregning-fod">Årsnorm ${g.moduler != null ? `${fmtTimer(g.moduler)} moduler à 95 min = ` : ''}${fmtTimer(aarsnormTimer(g))} <span class="enhed">t</span></span>
    <span>Undervisning <b>${fmtTimer(n.undervisning)}</b></span>
    <span>Forberedelse <b>${fmtTimer(n.forberedelse)}</b></span>
    <span>Retning <b>${fmtTimer(n.retning)}</b></span>
    ${n.tillaeg ? `<span>Tillæg <b>${fmtTimer(n.tillaeg)}</b></span>` : ''}
    <span class="norm-udregning-sum">I alt <b>${fmtTimer(n.total)}</b> <span class="enhed">t</span></span>
    <span class="norm-udregning-fod">${g.antalHold > 1 ? `${String(g.antalHold).replace('.', ',')} hold · ` : ''}Faktor ${String(faktor).replace('.', ',')} · reduktion ${String(reduktion).replace('.', ',')} (${esc(aar)})</span>`;
}

function populateParentSelect(year, selId) {
  const sel = document.getElementById('act-parent');
  const parents = activities.filter(a =>
    a.type === 'opgave' && !a.parentId && a.schoolYear === year && a.id !== editingId
  );
  sel.innerHTML = `<option value="">— Ingen (top-niveau) —</option>` +
    parents.map(p => `<option value="${p.id}"${p.id === selId ? ' selected' : ''}>${esc(p.name)}</option>`).join('');
}

function renderColorPicker(selected) {
  const picker = document.getElementById('act-color-picker');
  picker.innerHTML = COLOR_PALETTE.map(c =>
    `<button type="button" class="color-dot-btn${c === selected ? ' selected' : ''}" style="background:${c}" data-color="${c}" aria-label="${c}"></button>`
  ).join('');
  picker.querySelectorAll('.color-dot-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      picker.querySelectorAll('.color-dot-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    })
  );
}

const getSelectedColor = () =>
  document.querySelector('.color-dot-btn.selected')?.dataset.color || '';

// ─── Save ─────────────────────────────────────────────────
async function saveActivity(e) {
  e.preventDefault();
  const name = document.getElementById('act-name').value.trim();
  if (!name) { showToast('Angiv et navn'); return; }

  const isEditing  = !!editingId;
  const existingA  = isEditing ? activities.find(x => x.id === editingId) : null;
  const type       = formType() || existingA?.type || 'opgave';
  const parentId   = type === 'opgave' ? (document.getElementById('act-parent').value || null) : null;
  const schoolYear  = document.getElementById('act-year').value.trim() || selectedYear;
  // Med normgrundlag gemmes det beregnede budget også i budgetHours, så
  // holdet har et budget, selv hvor normerne ikke bliver regnet ud. Det er
  // dog normgrundlaget, der gælder: skifter faktoren, følger budgettet med.
  const normGrundlag = type === 'hold' ? laesNormgrundlag() : null;
  const normer       = normGrundlag ? beregnNormer(normGrundlag, faktorerFor(schoolYear)) : null;
  const budgetRaw    = document.getElementById('act-budget').value.trim();
  const budgetHours  = normer ? Math.round(normer.total * 100) / 100
                              : budgetRaw !== '' ? parseFloat(budgetRaw) : null;
  const note        = document.getElementById('act-note').value.trim();
  const color       = getSelectedColor() || autoColor();
  const optjening   = type === 'opgave' ? formOptjening() : null;
  const fremdriftV  = tolkTal(document.getElementById('act-fremdrift').value);
  const fremdrift   = optjening === 'manuel' && fremdriftV != null
    ? Math.min(100, Math.max(0, fremdriftV)) : null;

  const btn = document.getElementById('act-save-btn');
  btn.disabled = true;
  try {
    if (isEditing) {
      await updateDoc(doc(db, `users/${userId}/activities/${editingId}`),
        { name, type, parentId, budgetHours, normGrundlag, color, schoolYear, note, optjening, fremdrift });
      showToast('Aktivitet opdateret');
    } else {
      await addDoc(collection(db, `users/${userId}/activities`),
        { name, type, parentId, budgetHours, normGrundlag, color, schoolYear, note, optjening, fremdrift,
          order: nextOrder(), isArchived: false });
      showToast('Aktivitet oprettet');
    }
    closeSheet('act-sheet', 'act-backdrop');
  } catch (err) {
    console.error('Gem fejl:', err);
    showToast('Kunne ikke gemme — prøv igen');
  } finally { btn.disabled = false; }
}

// ─── Delete ───────────────────────────────────────────────
async function deleteActivity() {
  if (!editingId) return;
  const a = activities.find(x => x.id === editingId);
  if (!a) return;

  if (!confirm(`Slet "${a.name}"?`)) return;

  const children = activities.filter(c => c.parentId === editingId);
  let promoteKids = false;
  if (children.length) {
    promoteKids = !confirm(
      `"${a.name}" har ${children.length} under-aktivitet${children.length > 1 ? 'er' : ''}.\n\nOK = slet under-aktiviteterne også\nAnnuller = bevar dem som selvstændige`
    );
  }

  const btn = document.getElementById('act-delete-btn');
  btn.disabled = true;
  try {
    const batch = writeBatch(db);
    children.forEach(c => {
      if (promoteKids) {
        batch.update(doc(db, `users/${userId}/activities/${c.id}`), { parentId: null });
      } else {
        batch.delete(doc(db, `users/${userId}/activities/${c.id}`));
      }
    });
    batch.delete(doc(db, `users/${userId}/activities/${editingId}`));
    await batch.commit();
    showToast('Aktivitet slettet');
    closeSheet('act-sheet', 'act-backdrop');
  } catch (err) {
    console.error('Slet fejl:', err);
    showToast('Kunne ikke slette — prøv igen');
  } finally { btn.disabled = false; }
}

// ─── Arkivér / genåbn ─────────────────────────────────────
async function toggleArchive() {
  if (!editingId) return;
  const a = activities.find(x => x.id === editingId);
  if (!a) return;

  const archiving = !a.isArchived;
  const children  = activities.filter(c => c.parentId === editingId);

  const fields = archiving
    ? { isArchived: true,  archivedAt: serverTimestamp() }
    : { isArchived: false, archivedAt: null };

  const btn = document.getElementById('act-archive-btn');
  btn.disabled = true;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, `users/${userId}/activities/${editingId}`), fields);
    // Under-aktiviteter følger med, så de heller ikke kan tidsregistreres
    children.forEach(c =>
      batch.update(doc(db, `users/${userId}/activities/${c.id}`), fields)
    );
    await batch.commit();
    showToast(archiving ? 'Opgave afsluttet' : 'Opgave genåbnet');
    closeSheet('act-sheet', 'act-backdrop');
  } catch (err) {
    console.error('Arkiv fejl:', err);
    showToast('Kunne ikke opdatere — prøv igen');
  } finally { btn.disabled = false; }
}

// ─── Import fra tekst ─────────────────────────────────────
function openImportSheet() {
  document.getElementById('import-year').value = selectedYear;
  document.getElementById('import-text').value = '';
  openSheet('import-sheet', 'import-backdrop');
}

async function doImport() {
  const raw  = document.getElementById('import-text').value.trim();
  const year = document.getElementById('import-year').value.trim() || selectedYear;
  if (!raw) { showToast('Ingen tekst at importere'); return; }

  const parsed = raw.split('\n')
    .map(l => l.trim()).filter(Boolean)
    .map(line => {
      const p = line.split(';').map(s => s.trim());
      return { name: p[0], type: p[1]?.toLowerCase() === 'hold' ? 'hold' : 'opgave',
               budget: p[2] ? parseFloat(p[2]) : null, parent: p[3] || null };
    }).filter(p => p.name);

  const btn = document.getElementById('btn-do-import');
  btn.disabled = true;
  const nameToId = {};
  let i = 0;
  try {
    for (const p of parsed.filter(p => !p.parent)) {
      const ref = await addDoc(collection(db, `users/${userId}/activities`), {
        name: p.name, type: p.type, parentId: null,
        budgetHours: p.budget, color: COLOR_PALETTE[(activities.length + i) % COLOR_PALETTE.length],
        schoolYear: year, note: '', order: nextOrder() + i, isArchived: false
      });
      nameToId[p.name] = ref.id;
      i++;
    }
    for (const p of parsed.filter(p => p.parent)) {
      await addDoc(collection(db, `users/${userId}/activities`), {
        name: p.name, type: 'opgave', parentId: nameToId[p.parent] || null,
        budgetHours: p.budget, color: COLOR_PALETTE[(activities.length + i) % COLOR_PALETTE.length],
        schoolYear: year, note: '', order: nextOrder() + i, isArchived: false
      });
      i++;
    }
    showToast(`${parsed.length} aktiviteter importeret`);
    closeSheet('import-sheet', 'import-backdrop');
  } catch (err) {
    console.error('Import fejl:', err);
    showToast('Import fejlede — tjek formatet');
  } finally { btn.disabled = false; }
}

// ─── Kopiér til næste skoleår ─────────────────────────────
function openCopySheet() {
  const next     = nextSchoolYear(selectedYear);
  const existing = activities.filter(a => a.schoolYear === next).length;
  document.getElementById('copy-sheet-body').innerHTML = `
    <p class="sheet-desc">
      Kopierer alle aktiviteter fra <strong>${selectedYear}</strong> til <strong>${next}</strong> — kun struktur, ingen tidsdata.
      ${existing ? `<br><span class="warn-text">OBS: Der er allerede ${existing} aktivitet${existing > 1 ? 'er' : ''} i ${next}.</span>` : ''}
    </p>`;
  document.getElementById('btn-do-copy').dataset.target = next;
  openSheet('copy-sheet', 'copy-backdrop');
}

async function doCopy() {
  const targetYear = document.getElementById('btn-do-copy').dataset.target;
  const source = activities.filter(a => a.schoolYear === selectedYear && !a.isArchived);
  if (!source.length) { showToast('Ingen aktiviteter at kopiere'); return; }

  const btn = document.getElementById('btn-do-copy');
  btn.disabled = true;
  try {
    const batch  = writeBatch(db);
    const colRef = collection(db, `users/${userId}/activities`);
    const idMap  = {};

    // Kun strukturen følger med — rettede sæt og fremdrift er det gamle års
    for (const a of source.filter(a => !a.parentId)) {
      const newRef = doc(colRef);
      idMap[a.id] = newRef.id;
      const { id, rettedeSaet, fremdrift, ...rest } = a;
      batch.set(newRef, { ...rest, schoolYear: targetYear, parentId: null });
    }
    for (const a of source.filter(a => a.parentId)) {
      const newRef = doc(colRef);
      const { id, rettedeSaet, fremdrift, ...rest } = a;
      batch.set(newRef, { ...rest, schoolYear: targetYear, parentId: idMap[a.parentId] || null });
    }

    await batch.commit();
    selectedYear = targetYear;
    showToast(`Kopieret til ${targetYear}`);
    closeSheet('copy-sheet', 'copy-backdrop');
  } catch (err) {
    console.error('Kopi fejl:', err);
    showToast('Kopiering fejlede — prøv igen');
  } finally { btn.disabled = false; }
}

// ─── Sheet open/close ─────────────────────────────────────
function openSheet(sheetId, bdId) {
  document.getElementById(sheetId).classList.remove('hidden');
  document.getElementById(bdId).classList.remove('hidden');
  requestAnimationFrame(() => {
    document.getElementById(sheetId).classList.add('open');
    document.getElementById(bdId).classList.add('open');
  });
}

function closeSheet(sheetId, bdId) {
  document.getElementById(sheetId).classList.remove('open');
  document.getElementById(bdId).classList.remove('open');
  setTimeout(() => {
    document.getElementById(sheetId).classList.add('hidden');
    document.getElementById(bdId).classList.add('hidden');
  }, 280);
}

// ─── Event listeners (én gang) ────────────────────────────
function bindListeners() {
  if (listenersOk) return;
  listenersOk = true;

  document.getElementById('act-year-select')
    .addEventListener('change', e => { selectedYear = e.target.value; renderList(); });

  document.getElementById('btn-new-activity')
    .addEventListener('click', () => openActSheet(null));

  document.getElementById('btn-copy-year')
    .addEventListener('click', openCopySheet);

  document.getElementById('btn-import-text')
    .addEventListener('click', openImportSheet);

  // Act sheet
  document.getElementById('act-sheet-close')
    .addEventListener('click', () => closeSheet('act-sheet', 'act-backdrop'));
  document.getElementById('act-backdrop')
    .addEventListener('click', () => closeSheet('act-sheet', 'act-backdrop'));
  document.getElementById('act-form')
    .addEventListener('submit', saveActivity);
  document.getElementById('act-delete-btn')
    .addEventListener('click', deleteActivity);
  document.getElementById('act-archive-btn')
    .addEventListener('click', toggleArchive);

  document.querySelectorAll('input[name="act-type"]').forEach(r =>
    r.addEventListener('change', e => {
      toggleParentField(e.target.value);
      populateParentSelect(document.getElementById('act-year').value || selectedYear, '');
      opdaterUdregning();
    })
  );

  document.querySelectorAll('input[name="act-optjening"]').forEach(r =>
    r.addEventListener('change', visOptjening)
  );

  [...NORM_FELTER.map(([id]) => id), 'act-year'].forEach(id =>
    document.getElementById(id).addEventListener('input', opdaterUdregning)
  );

  // Import sheet
  document.getElementById('import-sheet-close')
    .addEventListener('click', () => closeSheet('import-sheet', 'import-backdrop'));
  document.getElementById('import-backdrop')
    .addEventListener('click', () => closeSheet('import-sheet', 'import-backdrop'));
  document.getElementById('btn-do-import')
    .addEventListener('click', doImport);

  // Copy sheet
  document.getElementById('copy-sheet-close')
    .addEventListener('click', () => closeSheet('copy-sheet', 'copy-backdrop'));
  document.getElementById('copy-backdrop')
    .addEventListener('click', () => closeSheet('copy-sheet', 'copy-backdrop'));
  document.getElementById('btn-do-copy')
    .addEventListener('click', doCopy);
}

// ─── Helpers ──────────────────────────────────────────────
const nextOrder    = () => Math.max(0, ...activities.map(a => a.order || 0)) + 1;
const autoColor    = () => { const u = new Set(activities.map(a => a.color)); return COLOR_PALETTE.find(c => !u.has(c)) || COLOR_PALETTE[0]; };
const nextSchoolYear = y => { const n = parseInt(y) + 1; return `${n}/${String(n + 1).slice(2)}`; };
const esc = s => s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';
