// indstillinger.js — Trin 9: Indstillinger

import { db, showToast, getCurrentSchoolYear, updateTopYear } from './app.js';
import { STANDARD_FAKTORER, tolkTal } from './normer.js';
import { taelFeriedage, arbejdsdageIPerioden, tilDato, ferieFor } from './ferie.js';
import { skoleaarStart, kortDato, datoInput } from './periode.js';
import { esc } from './format.js';
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
  ferie:                {},     // { "2026/27": [{ fra: "2026-07-06", til: "2026-07-27" }] } — se ferie.js
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
  visVersion();
}

// ─── Version ──────────────────────────────────────────────
// Versionen er navnet på service workerens cache (tid-v32) — så står der
// præcis den udgave, appen faktisk kører fra. Uden cache (første besøg,
// privat vindue) står der «ikke installeret».
async function visVersion() {
  const el = document.getElementById('app-version');
  if (!el) return;
  try {
    const nr = (await caches.keys())
      .map(k => /^tid-v(\d+)$/.exec(k)?.[1]).filter(Boolean).map(Number);
    el.textContent = nr.length ? `tid-v${Math.max(...nr)}` : 'ikke installeret';
  } catch {
    el.textContent = 'ikke installeret';
  }
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
  visFerie(s.currentSchoolYear || getCurrentSchoolYear());
}

// Holdnormernes faktorer hører til ét skoleår ad gangen — det, der står i
// feltet "Aktivt skoleår". Skriver man et andet år, vises dét års faktorer.
const kommatal = v => String(v).replace('.', ',');

function visFaktorer(aar) {
  const f = settings.normFaktorer?.[aar] || {};
  const el = document.getElementById('cfg-faktor-aar');
  if (el) el.textContent = aar;
  set('cfg-faktor',    kommatal(f.faktor    ?? STANDARD_FAKTORER.faktor));
}

// ─── Ferie ────────────────────────────────────────────────
// Som faktorerne hører ferien til ét skoleår ad gangen. Rækkerne er et
// udkast, til man trykker «Gem indstillinger».
let ferieAar    = '';
let ferieUdkast = [];

function visFerie(aar) {
  ferieAar    = aar;
  ferieUdkast = ferieFor(aar, settings).map(p => ({ ...p }));
  const el = document.getElementById('cfg-ferie-aar');
  if (el) el.textContent = aar;
  tegnFerie();
}

// Normperioden for et skoleår som "2026/27"
function normperiode(aar) {
  const a = parseInt(aar, 10);
  return [skoleaarStart(a), skoleaarStart(a + 1)];
}

const gyldig  = p => p.fra && p.til && p.fra <= p.til;

function tegnFerie() {
  const liste = document.getElementById('cfg-ferie-liste');
  if (!liste) return;
  liste.innerHTML = ferieUdkast.map((p, i) => `
    <div class="ferie-raekke" data-i="${i}">
      <input type="date" class="settings-input-sm ferie-fra" value="${esc(p.fra)}" aria-label="Ferie ${i + 1} fra">
      <span class="ferie-til" aria-hidden="true">–</span>
      <input type="date" class="settings-input-sm ferie-tilfelt" value="${esc(p.til)}" aria-label="Ferie ${i + 1} til og med">
      <button type="button" class="btn-icon ferie-slet" aria-label="Fjern ferie ${i + 1}">×</button>
      <span class="ferie-dage"></span>
    </div>`).join('');
  liste.querySelectorAll('.ferie-raekke').forEach(r => {
    const i = Number(r.dataset.i);
    r.querySelector('.ferie-fra').addEventListener('input', e => {
      ferieUdkast[i].fra = e.target.value;
      // Et tomt til-felt får samme dag, så en enkelt fridag er ét tryk
      const til = r.querySelector('.ferie-tilfelt');
      if (e.target.value && (!til.value || til.value < e.target.value)) {
        til.value = e.target.value; ferieUdkast[i].til = e.target.value;
      }
      opdaterFerieTal();
    });
    r.querySelector('.ferie-tilfelt').addEventListener('input', e => {
      ferieUdkast[i].til = e.target.value; opdaterFerieTal();
    });
    r.querySelector('.ferie-slet').addEventListener('click', () => {
      ferieUdkast.splice(i, 1); tegnFerie();
      document.getElementById('cfg-ferie-ny')?.focus();
    });
  });
  opdaterFerieTal();
}

function opdaterFerieTal() {
  const [start, slut] = normperiode(ferieAar);
  const sidste = new Date(slut.getFullYear(), slut.getMonth(), slut.getDate() - 1);
  let udenfor = 0;
  document.querySelectorAll('#cfg-ferie-liste .ferie-raekke').forEach(r => {
    const p = ferieUdkast[Number(r.dataset.i)];
    const el = r.querySelector('.ferie-dage');
    if (!p.fra || !p.til) { el.textContent = ''; return; }
    if (p.fra > p.til) { el.textContent = 'til før fra'; el.classList.add('ferie-dage-fejl'); return; }
    el.classList.remove('ferie-dage-fejl');
    const n = taelFeriedage([p]);
    el.textContent = `${n} ${n === 1 ? 'dag' : 'dage'}`;
    if (tilDato(p.fra) < start || tilDato(p.til) >= slut) udenfor++;
  });

  const sum = document.getElementById('cfg-ferie-sum');
  if (!sum) return;
  // Kun den del af ferien, der ligger i normperioden, tæller
  const iPerioden = ferieUdkast.filter(gyldig).map(p => ({
    fra: p.fra < datoInput(start)  ? datoInput(start)  : p.fra,
    til: p.til > datoInput(sidste) ? datoInput(sidste) : p.til
  })).filter(gyldig);
  const feriedage = taelFeriedage(iPerioden);
  const arbejdsdage = arbejdsdageIPerioden(start, slut, iPerioden);
  sum.innerHTML = `<b>${feriedage}</b> feriedage · <b>${arbejdsdage}</b> arbejdsdage`
    + (udenfor ? `<span class="ferie-advarsel">OBS · ${udenfor === 1 ? 'Én periode' : `${udenfor} perioder`} ligger uden for normperioden ${kortDato(start)} ${start.getFullYear()} – ${kortDato(sidste)} ${sidste.getFullYear()}</span>` : '');
}

function nyFerie() {
  ferieUdkast.push({ fra: '', til: '' });
  tegnFerie();
  document.querySelector('#cfg-ferie-liste .ferie-raekke:last-child .ferie-fra')?.focus();
}

// Til gemning: kun hele perioder, i datoorden
const ferieTilGem = () => ferieUdkast.filter(gyldig).map(({ fra, til }) => ({ fra, til }))
  .sort((a, b) => a.fra.localeCompare(b.fra));

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
        // Reduktionen bruges kun på ældre hold med årsnormen i timer og står
        // ikke længere på siden — den gemte følger med uændret
        reduktion: settings.normFaktorer?.[yearVal]?.reduktion ?? STANDARD_FAKTORER.reduktion
      }
    },
    ferie: { ...settings.ferie, [ferieAar]: ferieTilGem() }
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
    const aar = e.target.value.trim();
    if (/^\d{4}\/\d{2}$/.test(aar)) { visFaktorer(aar); visFerie(aar); }
  });
  document.getElementById('cfg-ferie-ny')?.addEventListener('click', nyFerie);
}
