// Forsiden: dagens registrerede tid, faste genveje og de seneste poster.
import { db, getCurrentSchoolYear, showToast } from './app.js';
import { getLoadedActivities, naarAktiviteterAendres } from './activities.js';
import { startTimer } from './timer.js';
import { openEntrySheet } from './historik.js';
import { openSheet, closeSheet } from './ark.js';
import { listenLectio } from './lectio-store.js';
import { lectioNavn, visLectio } from './lectio-kalender.js';
import { danishDate } from './lectio-data.js';
import { esc, capitalize, fmtMins, fmtTime } from './format.js';
import { collection, doc, setDoc, onSnapshot, query, where, orderBy, limit, Timestamp } from './lager.js';

const $ = id => document.getElementById(id);
const typer = ['undervisning', 'forberedelse', 'retning'];
let uid = null, afmeld = [], afmeldDag = [], afmeldSeneste = null, ur = null;
let afsluttede = [], aktive = [], seneste = [], favoritter = [], lectio = [];
let dag = '', dagHentet = [false, false], bundet = false;
const poster = snap => snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }));
const ms = t => t?.toDate?.().getTime();
const dagensStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const valgbare = () => getLoadedActivities().filter(a => !a.isArchived && a.schoolYear === getCurrentSchoolYear());
const aktivitet = id => getLoadedActivities().find(a => a.id === id);
const navn = e => [aktivitet(e.activityId)?.name || (e.activityId ? 'Slettet aktivitet' : 'Ubundet tid'), e.workType && capitalize(e.workType)].filter(Boolean).join(' · ');
const kanStartes = e => !e.activityId || valgbare().some(a => a.id === e.activityId);

export function initHjem(id) {
  if (uid === id) return;
  [...afmeld, ...afmeldDag].forEach(fn => fn());
  afmeldSeneste?.(); clearInterval(ur);
  uid = id; afmeld = []; afmeldDag = []; afmeldSeneste = null; dag = '';
  afsluttede = []; aktive = []; seneste = []; favoritter = []; lectio = [];
  tegn();
  if (!uid) return;
  bind();
  afmeld.push(onSnapshot(doc(db, `users/${uid}/settings/config`), snap => {
    const data = snap.data()?.hurtigstartFavoritter;
    favoritter = Array.isArray(data) ? data.filter(f => f && typeof f.activityId === 'string').slice(0, 4) : [];
    tegnFavoritter();
  }, () => showToast('Kunne ikke hente favoritter — prøv at åbne appen igen')));
  afmeld.push(listenLectio(db, uid, data => { lectio = data.events; tegnLectio(); }, () => {
    $('hjem-lectio').classList.add('hidden');
  }));
  refreshHjem();
  ur = setInterval(() => {
    if (dag !== String(+dagensStart())) hentDag();
    tegnTotal(); tegnLectio();
  }, 1000);
}

export function refreshHjem() {
  if (!uid) return;
  if (dag !== String(+dagensStart())) hentDag();
  hentSeneste();
  tegn();
}

function hentDag() {
  afmeldDag.forEach(fn => fn());
  dag = String(+dagensStart()); dagHentet = [false, false];
  afsluttede = []; aktive = []; $('hjem-total').textContent = '…';
  // Sluttid fanger også poster, som begyndte i går. Åbne timere hentes
  // særskilt. Ingen grænse på antal poster i dagens sum eller sammensat indeks.
  const col = collection(db, `users/${uid}/entries`);
  afmeldDag = [
    onSnapshot(query(col, where('endTime', '>=', Timestamp.fromDate(dagensStart()))), snap => {
      afsluttede = poster(snap); dagHentet[0] = true; tegnTotal();
    }, () => { dagHentet[0] = false; $('hjem-total').textContent = 'Kunne ikke hentes'; }),
    onSnapshot(query(col, where('endTime', '==', null)), snap => {
      aktive = poster(snap); dagHentet[1] = true; tegnTotal();
    }, () => { dagHentet[1] = false; $('hjem-total').textContent = 'Kunne ikke hentes'; })
  ];
}

function hentSeneste(graense = 20) {
  afmeldSeneste?.();
  afmeldSeneste = onSnapshot(query(collection(db, `users/${uid}/entries`),
    orderBy('endTime', 'desc'), limit(graense)), snap => {
    const alle = poster(snap).filter(e => e.endTime && !e.isBreak && ms(e.endTime) <= Date.now() && ms(e.startTime) <= Date.now());
    if (alle.length < 3 && snap.size === graense) { hentSeneste(graense + 20); return; }
    seneste = alle.slice(0, 3); tegnSeneste();
  }, () => { $('hjem-seneste').textContent = 'Kunne ikke hente registreringer. Åbn Historik for at prøve igen.'; });
}

function tegn() { tegnTotal(); tegnFavoritter(); tegnSeneste(); tegnLectio(); }
function tegnTotal() {
  if (!uid) { $('hjem-total').textContent = '…'; return; }
  if (!dagHentet.every(Boolean)) return;
  const fra = +dagensStart(), nu = Date.now();
  // Lytterne kan svare i hver sit øjeblik ved stop. Saml på id, så en post
  // aldrig tælles både som afsluttet og aktiv i overgangsøjeblikket.
  const samlede = new Map([...aktive, ...afsluttede].map(e => [e.id, e]));
  let total = 0;
  for (const e of samlede.values()) {
    if (e.isBreak) continue;
    const start = Math.max(fra, ms(e.startTime));
    const slut = Math.min(nu, e.endTime ? ms(e.endTime) : nu);
    if (Number.isFinite(start) && Number.isFinite(slut)) total += Math.max(0, slut - start);
  }
  $('hjem-total').textContent = fmtMins(total / 60000);
}

function tegnFavoritter() {
  const gyldige = favoritter.filter(f => kanStartes(f));
  $('hjem-favoritter').innerHTML = gyldige.map(f => `<button type="button" class="qs-btn" data-favorit="${esc(f.activityId)}" data-type="${esc(f.workType || '')}" style="--act-color:${esc(aktivitet(f.activityId)?.color || 'var(--accent)')}"><span class="qs-dot"></span><span class="hjem-genvej-navn">${esc(navn(f))}</span></button>`).join('');
  $('hjem-favoritter').classList.toggle('hidden', !gyldige.length);
  $('hjem-favoritter').querySelectorAll('button').forEach(b => b.addEventListener('click', () => startTimer(b.dataset.favorit, b.dataset.type || null)));
}

function tegnSeneste() {
  $('hjem-seneste').innerHTML = seneste.length ? seneste.map((e, i) => {
    const dato = new Date(ms(e.startTime));
    return `<button type="button" class="hjem-post" data-post="${i}"><span>${esc(navn(e))}</span><small>${dato.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })} · ${fmtTime(dato)}–${fmtTime(new Date(ms(e.endTime)))} · ${fmtMins(e.durationMinutes)} · Redigér</small></button>`;
  }).join('') : '<p class="hjem-info">Ingen afsluttede registreringer endnu.</p>';
  $('hjem-seneste').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    const e = seneste[Number(b.dataset.post)]; openEntrySheet(e.id, null, e);
  }));
  const e = seneste.find(kanStartes);
  const knap = $('hjem-fortsaet');
  knap.classList.toggle('hidden', !e);
  knap.textContent = e ? `▷ Fortsæt ${navn(e)}` : '';
  knap.onclick = e ? () => startTimer(e.activityId, e.workType) : null;
}

function tegnLectio() {
  const nu = Date.now();
  const e = lectio.filter(e => !e.cancelled && !e.allDay && +danishDate(e.start) >= nu)
    .sort((a, b) => +danishDate(a.start) - +danishDate(b.start))[0];
  const knap = $('hjem-lectio');
  knap.classList.toggle('hidden', !e);
  knap.textContent = e ? `Næste i Lectio · ${e.start.slice(8, 10)}/${e.start.slice(5, 7)} kl. ${e.start.slice(11, 16)} · ${lectioNavn(e)} · Planlagt` : '';
  knap.onclick = e ? () => visLectio(e) : null;
}

function vaelgFavoritter() {
  let ark = $('favorit-sheet');
  if (!ark) {
    const bd = document.createElement('div'); bd.id = 'favorit-backdrop'; bd.className = 'sheet-backdrop hidden';
    ark = document.createElement('div'); ark.id = 'favorit-sheet'; ark.className = 'sheet hidden';
    ark.innerHTML = '<div class="sheet-head"><h3>Faste favoritter</h3><button type="button" class="btn-icon" aria-label="Luk favoritter">✕</button></div><div class="sheet-body"><p>Vælg op til fire genveje. Pladserne følger din rækkefølge, også når du bruger andre aktiviteter.</p><form id="favorit-form"><div id="favorit-valg"></div><p id="favorit-fejl" role="alert"></p><button type="submit" class="btn btn-primary btn-full">Gem favoritter</button></form></div>';
    document.body.append(bd, ark);
    const luk = () => closeSheet('favorit-sheet', 'favorit-backdrop');
    bd.addEventListener('click', luk); ark.querySelector('button').addEventListener('click', luk);
    $('favorit-form').addEventListener('submit', gemFavoritter);
  }
  const acts = valgbare();
  $('favorit-fejl').textContent = '';
  $('favorit-valg').innerHTML = Array.from({ length: 4 }, (_, i) => {
    const f = favoritter[i];
    // En arkiveret favorit bevares, indtil brugeren selv vælger den fra.
    const muligheder = [...acts];
    if (f && !acts.some(a => a.id === f.activityId)) muligheder.push(aktivitet(f.activityId) || { id: f.activityId, name: 'Slettet aktivitet' });
    return `<div class="form-group"><label for="favorit-act-${i}">Plads ${i + 1}</label><select id="favorit-act-${i}" class="form-input"><option value="">Ingen favorit</option>${muligheder.map(a => `<option value="${esc(a.id)}"${a.id === f?.activityId ? ' selected' : ''}>${esc(a.name)}${acts.includes(a) ? '' : ' (ikke aktiv i dette skoleår)'}</option>`).join('')}</select><label for="favorit-type-${i}">Arbejdstype</label><select id="favorit-type-${i}" class="form-input">${typer.map(t => `<option value="${t}"${f?.workType === t ? ' selected' : ''}>${capitalize(t)}</option>`).join('')}</select></div>`;
  }).join('');
  for (let i = 0; i < 4; i++) {
    const sync = () => { $('favorit-type-' + i).disabled = aktivitet($('favorit-act-' + i).value)?.type !== 'hold'; };
    $('favorit-act-' + i).addEventListener('change', sync); sync();
  }
  openSheet('favorit-sheet', 'favorit-backdrop');
}

async function gemFavoritter(event) {
  event.preventDefault();
  const nye = [];
  for (let i = 0; i < 4; i++) {
    const id = $('favorit-act-' + i).value;
    if (id) nye.push({ activityId: id, workType: aktivitet(id)?.type === 'hold' ? $('favorit-type-' + i).value : null });
  }
  if (new Set(nye.map(f => JSON.stringify(f))).size !== nye.length) { $('favorit-fejl').textContent = 'Den samme genvej er valgt flere gange.'; return; }
  const bruger = uid, knap = event.submitter;
  knap.disabled = true;
  try {
    await setDoc(doc(db, `users/${bruger}/settings/config`), { hurtigstartFavoritter: nye }, { merge: true });
    if (uid === bruger) { closeSheet('favorit-sheet', 'favorit-backdrop'); showToast('Favoritter gemt'); }
  } catch {
    $('favorit-fejl').textContent = 'Kunne ikke gemme favoritter. Prøv igen.';
  } finally { knap.disabled = false; }
}

function bind() {
  if (bundet) return;
  bundet = true;
  $('hjem-glemt').addEventListener('click', () => openEntrySheet(null));
  $('hjem-vaelg-favoritter').addEventListener('click', vaelgFavoritter);
  naarAktiviteterAendres(tegn);
}
