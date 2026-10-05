// kalender.js — Kalendervisning i Historik
//
// Kalenderen har fire visninger, der alle bladrer frem og tilbage med de
// samme pile: en dag, en uge, en måned eller et helt skoleår. Man kan altså
// se i går og forgårs, ugen før eller sidste september — ikke kun den periode
// man står i.
//
// Filen her holder styr på visning, periode og data. Selve tegningen ligger i
// kalender-akse.js (dag og uge på tidsakse) og kalender-oversigt.js (måned og
// år som mængde-gitter).

import { db, showToast } from './app.js';
import { getLoadedActivities } from './activities.js';
import { openEntrySheet } from './historik.js';
import { fmtMins, fmtTime } from './format.js';
import { erPause } from './pauser.js';
import { tegnDag, tegnUge } from './kalender-akse.js';
import { tegnMaaned, tegnAar } from './kalender-oversigt.js';
import {
  periodeStart, periodeSlut, periodeTitel, periodeUnder, forskydningFor,
  startOfDay, addDays, datoInput
} from './periode.js';
import {
  collection, onSnapshot, query, where, orderBy, limit, Timestamp, doc, updateDoc
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// ─── Visningerne ──────────────────────────────────────────
const VISNINGER = {
  dag:    { type:'dag',     tegn:tegnDag,    nu:'I dag',        akse:true,
            hint:'Tryk på tidsaksen for at oprette en registrering.' },
  uge:    { type:'uge',     tegn:tegnUge,    nu:'Denne uge',    akse:true,
            hint:'Tryk på tidsaksen for at oprette en registrering — eller på en dag for at se den alene.' },
  maaned: { type:'maaned',  tegn:tegnMaaned, nu:'Denne måned',  akse:false,
            hint:'Tryk på en dag for at se den — eller på ugenummeret for hele ugen.' },
  aar:    { type:'skolear', tegn:tegnAar,    nu:'I år',         akse:false,
            hint:'Tryk på en måned for at se den.' }
};

// ─── State ────────────────────────────────────────────────
let userId       = null;
let visning      = 'dag';
let forskyd      = 0;          // 0 = perioden vi står i, -1 = den forrige
let poster       = [];
let dagsKort     = new Map();  // '2026-09-01' → { total, pause, akt:Map }
let unsubEntries = null;
let listenerKey  = null;
let listenersOk  = false;
let isVisible    = false;
let tick         = null;

// Zoom på tidsaksen: hvor mange gange den normale timehøjde. Med musen er
// der ofte plads til mere, så dér starter den et trin oppe. Valget huskes
// på enheden.
const ZOOM_TRIN = [1, 1.5, 2, 3];
const ZOOM_NOEGLE = 'tid-kal-zoom';
let zoom = (() => {
  try {
    const gemt = Number(localStorage.getItem(ZOOM_NOEGLE));
    if (ZOOM_TRIN.includes(gemt)) return gemt;
  } catch { /* privat vindue */ }
  return matchMedia('(pointer:fine)').matches ? 1.5 : 1;
})();

const aktuel = () => VISNINGER[visning];
const start  = () => periodeStart(aktuel().type, forskyd);
const slut   = () => periodeSlut(aktuel().type, forskyd);

// ─── Init ─────────────────────────────────────────────────
export function initKalenderView(uid) {
  if (userId === uid) return;
  userId = uid;
  bindListeners();
}

// Kaldes når Historik-fanen åbnes. Kalenderen er standard — listen er der,
// når man selv vælger den, men fanen åbner altid i kalenderen
export function refreshKalender() {
  if (!userId) return;
  setMode('kalender');
}

// ─── Visningsskift (Liste / Kalender) ─────────────────────
function setMode(mode) {
  isVisible = mode === 'kalender';

  document.querySelectorAll('.hist-mode-tab').forEach(b =>
    b.classList.toggle('hist-mode-tab-active', b.dataset.mode === mode));
  document.getElementById('hist-mode-liste')
    ?.classList.toggle('hidden', isVisible);
  document.getElementById('hist-mode-kalender')
    ?.classList.toggle('hidden', !isVisible);

  if (isVisible) {
    setupEntriesListener();
    startTick();
  } else {
    stopTick();
    if (unsubEntries) { unsubEntries(); unsubEntries = null; listenerKey = null; }
  }
}

// Nu-linjen og igangværende blokke skal følge med uret — kun de to visninger
// med tidsakse ændrer sig minut for minut
function startTick() {
  stopTick();
  tick = setInterval(() => { if (isVisible && aktuel().akse) render(); }, 60000);
}
function stopTick() {
  if (tick) { clearInterval(tick); tick = null; }
}

// ─── Periodeskift ─────────────────────────────────────────
// Skifter man visning, følger datoen med: står man i uge 34 og trykker
// "Måned", lander man i den måned, uge 34 ligger i. Ser man på en periode,
// der rummer i dag, er det i dag der følger med — ellers ville et skift fra
// årsvisningen lande i skoleårets første måned i stedet for i denne.
function anker() {
  const n = new Date();
  return n >= start() && n < slut() ? n : start();
}

function setVisning(ny) {
  if (ny === visning || !VISNINGER[ny]) return;
  forskyd = forskydningFor(VISNINGER[ny].type, anker());
  visning = ny;
  markerFaner();
  setupEntriesListener();
}

// Spring fra en oversigt ned i en kortere periode
function visPeriode(ny, dato) {
  visning = ny;
  forskyd = forskydningFor(VISNINGER[ny].type, dato);
  markerFaner();
  setupEntriesListener();
}

function bladr(n) {
  forskyd += n;
  setupEntriesListener();
}

function markerFaner() {
  document.querySelectorAll('.kal-vis-tab').forEach(b =>
    b.classList.toggle('kal-vis-tab-active', b.dataset.vis === visning));
}

// ─── Firestore-lytter for den valgte periode ──────────────
function setupEntriesListener() {
  const fra = addDays(start(), -2);   // registreringer fra dagen før kan række ind i perioden
  const til = slut();
  const key = `${fra.getTime()}-${til.getTime()}`;
  if (key === listenerKey && unsubEntries) { render(); return; }

  if (unsubEntries) unsubEntries();
  listenerKey = key;
  poster      = [];
  dagsKort    = new Map();
  render();                           // vis den nye periodes ramme med det samme

  unsubEntries = onSnapshot(
    query(
      collection(db, `users/${userId}/entries`),
      where('startTime', '>=', Timestamp.fromDate(fra)),
      where('startTime', '<',  Timestamp.fromDate(til)),
      orderBy('startTime'),
      limit(5000)
    ),
    snap => {
      poster   = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      dagsKort = byggDagsKort(poster);
      render();
    },
    err => console.error('Kalender-lytter:', err)
  );
}

// ─── Tid pr. dag ──────────────────────────────────────────
// Måneds- og årsvisningen har brug for hver dags total og fordeling. En
// registrering hen over midnat deles mellem de dage, den dækker, så en nat
// ikke tælles med på den forkerte dag.
const dagNoegle = d => datoInput(d);

function byggDagsKort(liste) {
  const nu = new Date();
  const ud = new Map();

  const laeg = (dag, e, min) => {
    const k = dagNoegle(dag);
    let rec = ud.get(k);
    if (!rec) { rec = { total: 0, pause: 0, akt: new Map() }; ud.set(k, rec); }
    if (erPause(e)) { rec.pause += min; return; }
    rec.total += min;
    const id = e.activityId || '';
    rec.akt.set(id, (rec.akt.get(id) || 0) + min);
  };

  liste.forEach(e => {
    if (!e.startTime) return;
    const s  = e.startTime.toDate();
    const sl = e.endTime ? e.endTime.toDate() : nu;
    if (sl <= s) { laeg(startOfDay(s), e, 0); return; }

    let dag = startOfDay(s);
    for (let i = 0; dag < sl && i < 400; i++) {
      const naeste = addDays(dag, 1);
      const fra    = Math.max(s, dag), til = Math.min(sl, naeste);
      const min    = Math.round((til - fra) / 60000);
      if (min > 0) laeg(dag, e, min);
      dag = naeste;
    }
  });
  return ud;
}

const TOM_DAG = { total: 0, pause: 0, akt: new Map() };
const dagData = d => dagsKort.get(dagNoegle(d)) || TOM_DAG;

// ─── Kontekst til visningerne ─────────────────────────────
function byggKontekst() {
  const acts = getLoadedActivities();
  return {
    type:  aktuel().type,
    start: start(),
    slut:  slut(),
    poster,
    dag: dagData,
    aktivitetNavn: id => {
      if (!id) return 'Ubundet tid';
      return acts.find(a => a.id === id)?.name || 'Slettet aktivitet';
    },
    aktivitetFarve: id =>
      (id && acts.find(a => a.id === id)?.color) || '#94a3b8',
    zoom,
    aabnPost:   aabnPost,
    nyPost:     nyPost,
    flytPost:   flytPost,
    vaelgDag:    d => visPeriode('dag', d),
    vaelgUge:    d => visPeriode('uge', d),
    vaelgMaaned: d => visPeriode('maaned', d)
  };
}

// ─── Render ───────────────────────────────────────────────
function render() {
  const rod = document.getElementById('kal-view');
  if (!rod) return;

  const v = aktuel();
  renderBar();
  markerZoom();
  v.tegn(rod, byggKontekst());
  markerValgt();

  const hint = document.getElementById('kal-hint');
  if (hint) hint.textContent = v.hint + (v.akse && matchMedia('(pointer:fine)').matches
    ? ' Træk i en blok for at flytte den, eller i dens bundkant for at ændre sluttiden.' : '');
}

// ─── Zoom ─────────────────────────────────────────────────
function saetZoom(retning) {
  const i = ZOOM_TRIN.indexOf(zoom) + retning;
  if (i < 0 || i >= ZOOM_TRIN.length) return;
  zoom = ZOOM_TRIN[i];
  try { localStorage.setItem(ZOOM_NOEGLE, String(zoom)); } catch { /* privat vindue */ }
  render();
}

function markerZoom() {
  const boks = document.getElementById('kal-zoom');
  if (!boks) return;
  boks.classList.toggle('hidden', !aktuel().akse);
  document.getElementById('kal-zoom-ud').disabled  = zoom === ZOOM_TRIN[0];
  document.getElementById('kal-zoom-ind').disabled = zoom === ZOOM_TRIN.at(-1);
}

// ─── Redigering fra aksen ─────────────────────────────────
// Den post, der står i arket, markeres på aksen og i dagens liste — på en
// bred skærm står arket ved siden af kalenderen, så man kan se, hvilken
// blok man retter. Markeringen vises kun, mens arket er åbent (se CSS).
let valgtId = null;

function aabnPost(id) {
  valgtId = id;
  markerValgt();
  openEntrySheet(id, null, poster.find(p => p.id === id));
}

// Også efter en ny tegning — nu-linjen tegner aksen om hvert minut
function markerValgt() {
  document.querySelectorAll('#kal-view [data-id]').forEach(el =>
    el.classList.toggle('kal-valgt', el.dataset.id === valgtId));
}

// En blok er trukket med musen: start og slut flyttes de givne minutter.
// Længden følger med, og toasten kan fortryde, til den forsvinder.
async function flytPost(id, dStart, dSlut) {
  const p = poster.find(x => x.id === id);
  if (!p?.startTime || !p.endTime) return;
  const gl = { startTime: p.startTime, endTime: p.endTime, durationMinutes: p.durationMinutes ?? null };
  const fra = new Date(p.startTime.toDate().getTime() + dStart * 60000);
  const til = new Date(p.endTime.toDate().getTime() + dSlut * 60000);
  const ref = doc(db, `users/${userId}/entries/${id}`);
  try {
    await updateDoc(ref, {
      startTime: Timestamp.fromDate(fra),
      endTime:   Timestamp.fromDate(til),
      durationMinutes: Math.round((til - fra) / 60000)
    });
  } catch (err) {
    console.error('Flyt post fejl:', err);
    showToast('Kunne ikke gemme — prøv igen');
    render();                          // blokken tilbage, hvor den stod
    return;
  }
  const tekst = dStart ? `Flyttet til ${fmtTime(fra)}–${fmtTime(til)}`
                       : `Ændret til ${fmtTime(fra)}–${fmtTime(til)}`;
  showToast(tekst, 6000, {
    tekst: 'Fortryd',
    fn: () => updateDoc(ref, gl).catch(err => {
      console.error('Fortryd fejl:', err);
      showToast('Kunne ikke fortryde');
    })
  });
}

// ─── Sidehoved med periode og tal ─────────────────────────
function renderBar() {
  const v = aktuel();
  const t = document.getElementById('kal-title');
  const s = document.getElementById('kal-sub');
  const d = document.getElementById('kal-date');
  if (t) t.textContent = periodeTitel(v.type, forskyd);
  if (s) s.textContent = periodeUnder(v.type, forskyd);
  if (d) d.value = datoInput(start());

  const nu = document.getElementById('kal-today');
  if (nu) { nu.textContent = v.nu; nu.disabled = forskyd === 0; }

  // Pauser er ikke arbejdstid og holdes uden for periodens total
  let total = 0, pause = 0;
  for (let x = start(); x < slut(); x = addDays(x, 1)) {
    const data = dagData(x);
    total += data.total;
    pause += data.pause;
  }

  const tot = document.getElementById('kal-total');
  if (tot) tot.textContent = total ? fmtMins(Math.round(total)) : '0m';

  const pauseEl = document.getElementById('kal-pausestat');
  if (pauseEl) {
    pauseEl.textContent = pause ? `${fmtMins(Math.round(pause))} pause` : '';
    pauseEl.classList.toggle('hidden', !pause);
  }
}

// ─── Ny registrering fra kalenderen ───────────────────────
// Også tomme felter frem i tiden kan trykkes — man kan lægge planlagt tid
// ind på forhånd. Selve arket viser en OBS, når starten ligger i fremtiden.
function nyPost(dagStart, startMin, slutMin) {
  const dagMin = Math.round((addDays(dagStart, 1) - dagStart) / 60000);
  const fra    = tilTid(dagStart, startMin);
  let   til    = tilTid(dagStart, Math.min(slutMin, dagMin));

  // Sluttid skal altid med — ellers ville posten blive oprettet som aktiv
  if (til <= fra) til = new Date(fra.getTime() + 15 * 60000);

  openEntrySheet(null, { start: fra, end: til });
}

// Minutter ind i døgnet — via setMinutes, så et sommertidsskift ikke
// forskyder tidspunktet
function tilTid(dagStart, min) {
  const d = new Date(dagStart);
  d.setMinutes(d.getMinutes() + Math.round(min));
  return d;
}

// ─── Lyttere ──────────────────────────────────────────────
function bindListeners() {
  if (listenersOk) return;
  listenersOk = true;

  document.querySelectorAll('.hist-mode-tab').forEach(btn =>
    btn.addEventListener('click', () => setMode(btn.dataset.mode)));

  document.getElementById('kal-vis-tabs')?.addEventListener('click', ev => {
    const btn = ev.target.closest('.kal-vis-tab');
    if (btn) setVisning(btn.dataset.vis);
  });

  document.getElementById('kal-zoom-ud')?.addEventListener('click', () => saetZoom(-1));
  document.getElementById('kal-zoom-ind')?.addEventListener('click', () => saetZoom(1));

  document.getElementById('kal-prev')?.addEventListener('click', () => bladr(-1));
  document.getElementById('kal-next')?.addEventListener('click', () => bladr(1));
  document.getElementById('kal-today')?.addEventListener('click', () => {
    if (forskyd !== 0) bladr(-forskyd);
  });
  document.getElementById('kal-date')?.addEventListener('change', ev => {
    const [y, m, d] = ev.target.value.split('-').map(Number);
    if (y && m && d) {
      forskyd = forskydningFor(aktuel().type, new Date(y, m - 1, d));
      setupEntriesListener();
    }
  });
}
