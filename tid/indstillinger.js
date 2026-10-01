// indstillinger.js — Trin 9: Indstillinger

import { db, showToast, getCurrentSchoolYear, updateTopYear } from './app.js';
import { STANDARD_FAKTORER, tolkTal } from './normer.js';
import { doc, getDoc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// ─── Defaults ─────────────────────────────────────────────
// currentSchoolYear er tom som default, så getCurrentSchoolYear() falder
// tilbage til dato-baseret beregning, indtil brugerens indstilling er indlæst.
const DEFAULTS = {
  currentSchoolYear:    '',
  schoolYearStartMonth: 6,
  schoolYearStartDay:   1,
  normHours:            1650,
  autoStopAfterMinutes: 600,
  autoShortBreaks:      true,
  normFaktorer:         {},     // { "2025/26": { faktor: 2.35, reduktion: 0.9 } } — se normer.js
  fordelFaellesTid:     true    // akkordregnskabet: fordel fælles tid på aktiviteterne — se akkord.js
};

let userId      = null;
let settings    = { ...DEFAULTS };
let listenersOk = false;

export const getSettings = () => ({ ...settings });

// ─── Init ─────────────────────────────────────────────────
export async function initIndstillingerView(uid) {
  if (userId === uid) return;
  userId = uid;
  bindListeners();
  await loadSettings();
}

export function refreshIndstillinger() {
  populateForm();
}

// ─── Load from Firestore ──────────────────────────────────
// Ét opslag ved opstart. Findes dokumentet ikke, skrives standardværdierne —
// men appen venter ikke på skrivningen: den kan lige så godt lande, mens
// brugeren allerede er i gang.
async function loadSettings() {
  const ref = doc(db, `users/${userId}/settings/config`);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      settings = { ...DEFAULTS, ...snap.data() };
    } else {
      settings = { ...DEFAULTS, currentSchoolYear: getCurrentSchoolYear() };
      setDoc(ref, settings).catch(err => console.error('Opret indstillinger fejl:', err));
    }
    populateForm();
  } catch (err) {
    console.error('Indlæs indstillinger fejl:', err);
  }
}

// ─── Populate form ────────────────────────────────────────
function populateForm() {
  const s = settings;
  set('cfg-school-year',   s.currentSchoolYear    || getCurrentSchoolYear());
  set('cfg-start-month',   s.schoolYearStartMonth ?? DEFAULTS.schoolYearStartMonth);
  set('cfg-start-day',     s.schoolYearStartDay   ?? DEFAULTS.schoolYearStartDay);
  set('cfg-norm-hours',    s.normHours            ?? DEFAULTS.normHours);
  set('cfg-autostop-mins', s.autoStopAfterMinutes ?? DEFAULTS.autoStopAfterMinutes);
  check('cfg-auto-breaks', s.autoShortBreaks ?? DEFAULTS.autoShortBreaks);
  visFaktorer(s.currentSchoolYear || getCurrentSchoolYear());
}

// Holdnormernes faktorer hører til ét skoleår ad gangen — det, der står i
// feltet "Aktivt skoleår". Skriver man et andet år, vises dét års faktorer.
const kommatal = v => String(v).replace('.', ',');

function visFaktorer(aar) {
  const f = settings.normFaktorer?.[aar] || {};
  const el = document.getElementById('cfg-faktor-aar');
  if (el) el.textContent = aar;
  set('cfg-faktor',    kommatal(f.faktor    ?? STANDARD_FAKTORER.faktor));
  set('cfg-reduktion', kommatal(f.reduktion ?? STANDARD_FAKTORER.reduktion));
}

const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
const check = (id, on) => { const el = document.getElementById(id); if (el) el.checked = !!on; };

// ─── Save ─────────────────────────────────────────────────
async function saveSettings() {
  const yearVal = document.getElementById('cfg-school-year').value.trim();
  if (!/^\d{4}\/\d{2}$/.test(yearVal)) { showToast('Angiv et gyldigt skoleår (fx 2026/27)'); return; }

  // Felter, formularen ikke har (fx rapportens flueben), følger med uændret
  const updated = {
    ...settings,
    currentSchoolYear:    yearVal,
    schoolYearStartMonth: parseInt(document.getElementById('cfg-start-month').value)  || 6,
    schoolYearStartDay:   parseInt(document.getElementById('cfg-start-day').value)    || 1,
    normHours:            parseInt(document.getElementById('cfg-norm-hours').value)   || 1650,
    autoStopAfterMinutes: parseInt(document.getElementById('cfg-autostop-mins').value)|| 600,
    autoShortBreaks:      document.getElementById('cfg-auto-breaks')?.checked ?? true,
    normFaktorer: {
      ...settings.normFaktorer,
      [yearVal]: {
        faktor:    tolkTal(document.getElementById('cfg-faktor').value)    ?? STANDARD_FAKTORER.faktor,
        reduktion: tolkTal(document.getElementById('cfg-reduktion').value) ?? STANDARD_FAKTORER.reduktion
      }
    }
  };

  const btn = document.getElementById('cfg-save-btn');
  if (btn) btn.disabled = true;
  try {
    await setDoc(doc(db, `users/${userId}/settings/config`), updated);
    settings = updated;
    updateTopYear();
    showToast('Indstillinger gemt');
  } catch (err) {
    console.error('Gem indstillinger fejl:', err);
    showToast('Kunne ikke gemme — prøv igen');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ─── Én indstilling ad gangen ─────────────────────────────
// Til valg, der sættes andre steder end på indstillingssiden — fx fluebenet
// i rapporten. Tallet slår igennem med det samme; skrivningen følger efter.
export async function gemIndstilling(noegle, vaerdi) {
  settings = { ...settings, [noegle]: vaerdi };
  try {
    await updateDoc(doc(db, `users/${userId}/settings/config`), { [noegle]: vaerdi });
  } catch (err) {
    console.error('Gem indstilling fejl:', err);
    showToast('Kunne ikke gemme valget — prøv igen');
  }
}

// ─── Bind listeners ───────────────────────────────────────
function bindListeners() {
  if (listenersOk) return;
  listenersOk = true;
  document.getElementById('cfg-save-btn')?.addEventListener('click', saveSettings);
  document.getElementById('cfg-school-year')?.addEventListener('input', e => {
    if (/^\d{4}\/\d{2}$/.test(e.target.value.trim())) visFaktorer(e.target.value.trim());
  });
}
