// rettet.js — rettede sæt: hvor langt er man med holdets retteakkord?
//
// Når et sæt er rettet færdigt, registreres det for sig selv — ikke sammen
// med retningstiden — med det antal elevtimer, opgaven dækker pr. elev
// (typisk 1–4). Appen ganger med holdets elevtal, når den regner optjent
// retning ud (se akkord.js). Det, der var rettet, før appen kom i brug,
// lægges ind på samme måde med en tidligere dato.
//
// Sættene ligger som en liste på holdet selv (activity.rettedeSaet), så de
// kommer med aktivitetslytteren og virker offline:
//
//   { id, dato: 'YYYY-MM-DD', elevtimer: 2, navn: 'Rapport 3' }

import { db, showToast, getCurrentSchoolYear } from './app.js';
import { getLoadedActivities } from './activities.js';
import { faktorerFor, tolkTal, fmtTimer } from './normer.js';
import { datoInput, langDato } from './periode.js';
import { doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

const HURTIGVALG = [1, 2, 3, 4];

let userId      = null;
let holdId      = null;
let listenersOk = false;

export function initRettet(uid) {
  userId = uid;
  bindListeners();
}

// ─── Arket ────────────────────────────────────────────────
export function openSaetSheet() {
  const aar   = getCurrentSchoolYear();
  const holds = getLoadedActivities()
    .filter(a => a.type === 'hold' && a.schoolYear === aar && !a.isArchived);
  if (!holds.length) { showToast('Ingen hold i ' + aar); return; }

  holdId = null;
  document.getElementById('saet-form').classList.add('hidden');
  document.getElementById('saet-step-hold').classList.remove('hidden');

  if (holds.length === 1) {
    vaelgHold(holds[0]);
  } else {
    const list = document.getElementById('saet-hold-list');
    list.innerHTML = holds.map(h => `
      <button type="button" class="modul-hold-btn" data-id="${h.id}" style="--act-color:${h.color || 'var(--accent)'}">
        <div class="qs-name">${esc(h.name)}</div>
      </button>`).join('');
    list.querySelectorAll('.modul-hold-btn').forEach(btn =>
      btn.addEventListener('click', () => vaelgHold(holds.find(h => h.id === btn.dataset.id)))
    );
  }
  openSheet();
}

function vaelgHold(hold) {
  holdId = hold.id;
  document.getElementById('saet-step-hold').classList.add('hidden');
  document.getElementById('saet-form').classList.remove('hidden');
  document.getElementById('saet-hold-label').textContent = `${hold.name} · Retning`;
  document.getElementById('saet-elevtimer').value = '';
  document.getElementById('saet-dato').value      = datoInput(new Date());
  document.getElementById('saet-navn').value      = '';
  renderHurtigvalg();
  opdaterUdregning();
}

function renderHurtigvalg() {
  const row = document.getElementById('saet-et-row');
  if (!row.dataset.built) {
    row.innerHTML = HURTIGVALG.map(t => `
      <button type="button" class="skema-chip skema-chip-enkel" data-et="${t}" aria-pressed="false">
        <span class="skema-chip-navn">${t}</span>
      </button>`).join('');
    row.querySelectorAll('.skema-chip').forEach(btn =>
      btn.addEventListener('click', () => {
        document.getElementById('saet-elevtimer').value = btn.dataset.et;
        opdaterUdregning();
      })
    );
    row.dataset.built = '1';
  }
}

// Hvad sættet er værd: elevtimer × elever, og den retning, det optjener
function opdaterUdregning() {
  const v    = tolkTal(document.getElementById('saet-elevtimer').value);
  const hold = getLoadedActivities().find(a => a.id === holdId);
  document.querySelectorAll('#saet-et-row .skema-chip').forEach(b => {
    const valgt = v != null && Number(b.dataset.et) === v;
    b.classList.toggle('selected', valgt);
    b.setAttribute('aria-pressed', String(valgt));
  });

  const ud     = document.getElementById('saet-udregning');
  const elever = Number(hold?.normGrundlag?.elever) || 0;
  if (!v || v <= 0) { ud.innerHTML = ''; return; }
  if (!elever) {
    ud.innerHTML = `<span>Holdet har intet elevtal i normgrundlaget — sættet gemmes, men optjener først retning, når elevtallet er skrevet ind.</span>`;
    return;
  }
  const { faktor } = faktorerFor(hold.schoolYear);
  const timer = v * elever / 27 * faktor;
  ud.innerHTML = `
    <span><b>${komma(v)}</b> elevtimer × ${elever} elever</span>
    <span class="norm-udregning-sum">Optjener <b>${fmtTimer(timer)}</b> <span class="enhed">t</span> retning</span>`;
}

async function gemSaet(e) {
  e.preventDefault();
  const hold = getLoadedActivities().find(a => a.id === holdId);
  if (!hold) return;
  const elevtimer = tolkTal(document.getElementById('saet-elevtimer').value);
  const dato      = document.getElementById('saet-dato').value;
  const navn      = document.getElementById('saet-navn').value.trim();
  if (!elevtimer || elevtimer <= 0) { showToast('Angiv elevtimer'); return; }
  if (!dato) { showToast('Vælg en dato'); return; }

  const saet = { id: nytId(), dato, elevtimer, navn };
  const btn  = document.getElementById('saet-save-btn');
  btn.disabled = true;
  try {
    await updateDoc(doc(db, `users/${userId}/activities/${hold.id}`), {
      rettedeSaet: [...(hold.rettedeSaet || []), saet]
    });
    showToast(`Sæt registreret · ${komma(elevtimer)} elevtimer`);
    closeSheet();
  } catch (err) {
    console.error('Rettet sæt fejl:', err);
    showToast('Kunne ikke gemme — prøv igen');
  } finally { btn.disabled = false; }
}

// ─── Listen i holdets redigeringsark ──────────────────────
// Kaldes fra activities.js. Viser holdets sæt, nyeste først, med en
// slet-knap på hver — et forkert tastet sæt slettes og registreres igen.
export function renderSaetListe(act) {
  const felt = document.getElementById('field-saet');
  if (!felt) return;
  const vis = act?.type === 'hold';
  felt.style.display = vis ? '' : 'none';
  if (!vis) return;

  const g      = act.normGrundlag || {};
  const antal  = Number(g.antalHold) > 0 ? Number(g.antalHold) : 1;
  const norm   = (Number(g.fordybelsestid) || 0) * antal;
  const saet   = [...(act.rettedeSaet || [])].sort((a, b) => b.dato.localeCompare(a.dato));
  const rettet = saet.reduce((s, x) => s + (Number(x.elevtimer) || 0), 0);

  document.getElementById('saet-sum').innerHTML = norm
    ? `Rettet <b>${komma(rettet)}</b> af ${komma(norm)} elevtimer`
    : `Rettet <b>${komma(rettet)}</b> elevtimer`;

  const liste = document.getElementById('saet-liste');
  liste.innerHTML = saet.length ? saet.map(s => `
    <li class="saet-row">
      <span class="saet-dato">${esc(langDato(new Date(s.dato + 'T12:00')))}</span>
      <span class="saet-navn">${esc(s.navn) || '—'}</span>
      <span class="saet-et">${komma(s.elevtimer)} <span class="enhed">elevtimer</span></span>
      <button type="button" class="btn-icon saet-slet" data-id="${s.id}" aria-label="Slet sæt fra ${esc(s.dato)}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </li>`).join('')
    : `<li class="saet-tom">Ingen sæt registreret endnu. Brug «Rettet sæt» på forsiden.</li>`;

  liste.querySelectorAll('.saet-slet').forEach(btn =>
    btn.addEventListener('click', () => sletSaet(act.id, btn.dataset.id))
  );
}

async function sletSaet(actId, saetId) {
  const act = getLoadedActivities().find(a => a.id === actId);
  if (!act) return;
  const s = (act.rettedeSaet || []).find(x => x.id === saetId);
  if (!s || !confirm(`Slet sættet fra ${s.dato}${s.navn ? ` (${s.navn})` : ''}?`)) return;
  const rest = (act.rettedeSaet || []).filter(x => x.id !== saetId);
  try {
    await updateDoc(doc(db, `users/${userId}/activities/${actId}`), { rettedeSaet: rest });
    renderSaetListe({ ...act, rettedeSaet: rest });
    showToast('Sæt slettet');
  } catch (err) {
    console.error('Slet sæt fejl:', err);
    showToast('Kunne ikke slette — prøv igen');
  }
}

// ─── Sheet open/close ─────────────────────────────────────
function openSheet() {
  const s = document.getElementById('saet-sheet'), b = document.getElementById('saet-backdrop');
  s.classList.remove('hidden'); b.classList.remove('hidden');
  requestAnimationFrame(() => { s.classList.add('open'); b.classList.add('open'); });
}
function closeSheet() {
  const s = document.getElementById('saet-sheet'), b = document.getElementById('saet-backdrop');
  s.classList.remove('open'); b.classList.remove('open');
  setTimeout(() => { s.classList.add('hidden'); b.classList.add('hidden'); }, 280);
}

function bindListeners() {
  if (listenersOk) return;
  listenersOk = true;
  document.getElementById('btn-rettet-saet')?.addEventListener('click', openSaetSheet);
  document.getElementById('saet-close')?.addEventListener('click', closeSheet);
  document.getElementById('saet-backdrop')?.addEventListener('click', closeSheet);
  document.getElementById('saet-form')?.addEventListener('submit', gemSaet);
  document.getElementById('saet-elevtimer')?.addEventListener('input', opdaterUdregning);
}

// ─── Hjælpere ─────────────────────────────────────────────
const komma = v => Number(v).toLocaleString('da-DK', { maximumFractionDigits: 2 });
const nytId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc   = s => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';
