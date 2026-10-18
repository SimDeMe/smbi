// Frivillig kontrol af dagens faktiske registreringer. Lectio indgår ikke.
import { db, showToast } from './app.js';
import { getLoadedActivities } from './activities.js';
import { openEntrySheet } from './historik.js';
import { doc, updateDoc } from './lager.js';
import { esc, fmtTime, capitalize } from './format.js';

const $ = id => document.getElementById(id);
const ms = t => t?.toDate?.().getTime();
// Accepten følger tidsrummet og tilknytningen, også efter backup/gendannelse.
// En samtidig rettelse på en anden enhed gør dermed en gammel accept ugyldig.
export const faellesNoegle = e => JSON.stringify([ms(e.startTime), ms(e.endTime), e.activityId || null, e.workType || null, !!e.isBreak]);

export function gennemgaaDag(liste, nu = new Date()) {
  const dag = new Date(nu); dag.setHours(0, 0, 0, 0);
  const poster = [...new Map(liste.map(e => [e.id, e])).values()].map(e => ({
    e, fra: Math.max(+dag, ms(e.startTime)), til: Math.min(+nu, e.endTime ? ms(e.endTime) : +nu)
  })).filter(p => Number.isFinite(p.fra) && Number.isFinite(p.til) && p.til > p.fra)
    .sort((a, b) => a.fra - b.fra || a.til - b.til || a.e.id.localeCompare(b.e.id));
  const overlap = new Set(), huller = [];
  let daekketTil = null, laengste = null;
  for (const p of poster) {
    // Til mærkning af poster er den hidtil længst dækkende post nok:
    // andre samtidige poster er allerede mærket ved deres egen start.
    if (laengste && p.fra < laengste.til) {
      overlap.add(p.e.id); overlap.add(laengste.e.id);
    }
    if (!laengste || p.til > laengste.til) laengste = p;
    // Kun indre huller i den samlede dækning. Pauser dækker også tid;
    // hverken før første eller efter sidste post forventes registrering.
    // Sekundforskelle under ét minut vises ikke som huller.
    if (daekketTil !== null && p.fra - daekketTil >= 60000) {
      huller.push({ fra: daekketTil, til: p.fra });
    }
    daekketTil = Math.max(daekketTil ?? p.til, p.til);
  }
  const accepterede = [], kontrol = [];
  for (const p of poster) {
    const e = p.e, ubundet = !e.isBreak && !e.activityId && !!e.endTime;
    const accepteret = ubundet && e.faellesTidAccepteret === faellesNoegle(e);
    if (accepteret) accepterede.push(p);
    const grunde = [ubundet && !accepteret && 'Ubundet tid', overlap.has(e.id) && 'Overlap', e.autoStopped && 'Automatisk stoppet'].filter(Boolean);
    if (grunde.length) kontrol.push({ ...p, grunde, ubundet: ubundet && !accepteret });
  }
  return { kontrol, huller, accepterede };
}

let bruger = null, session = 0, poster = [], klar = false, henteFejl = false, bundet = false;
const gemmer = new Set();
export function initGennemgang(uid) {
  bruger = uid; session++; poster = []; klar = false; henteFejl = false;
  $('hjem-gennemgang').open = false;
  $('gennemgang-fejl').textContent = '';
  if (!bundet) {
    bundet = true;
    $('gennemgang-liste').addEventListener('click', handling);
    $('gennemgang-accepterede').addEventListener('click', handling);
  }
  tegnGennemgang([], false);
}

export function tegnGennemgang(liste, hentet, fejl = false) {
  poster = liste; klar = hentet; henteFejl = fejl;
  const { kontrol, huller, accepterede } = gennemgaaDag(poster);
  const antal = kontrol.length + huller.length;
  $('gennemgang-antal').textContent = henteFejl ? 'Kunne ikke hentes' : !klar ? 'Henter…' : antal ? `${antal} til kontrol` : 'Intet til kontrol';
  const navn = e => e.isBreak ? 'Kort pause' : [getLoadedActivities().find(a => a.id === e.activityId)?.name || (e.activityId ? 'Slettet aktivitet' : 'Ubundet tid'), e.workType && capitalize(e.workType)].filter(Boolean).join(' · ');
  const tid = p => `${fmtTime(new Date(p.fra))}–${p.e.endTime ? fmtTime(new Date(p.til)) : 'nu · I gang'}`;
  const knap = (e, handling, tekst) => `<button type="button" class="btn btn-secondary" data-post="${esc(e.id)}" data-handling="${handling}"${gemmer.has(`${bruger}/${e.id}`) ? ' disabled' : ''}>${tekst}</button>`;
  const indhold = !klar ? `<li>${henteFejl ? 'Dagens registreringer kunne ikke hentes. Brug »Kontrollér igen« i lagringsstatus.' : 'Henter dagens registreringer…'}</li>` : [
    ...kontrol.map(p => `<li><strong>${esc(p.grunde.join(' · '))}</strong><span>${esc(navn(p.e))} · ${tid(p)}</span><div class="gennemgang-knapper">${knap(p.e, 'ret', 'Ret registrering')}${p.ubundet ? knap(p.e, 'accepter', 'Acceptér som fælles tid') : ''}</div></li>`),
    ...huller.map((p, i) => `<li><strong>Mulig pause · ${fmtTime(new Date(p.fra))}–${fmtTime(new Date(p.til))}</strong><span>Ingen registrering her. Det kan være en tilsigtet pause og kan stå tomt.</span><button type="button" class="btn btn-secondary" data-hul="${i}">Tilføj glemt tid her</button></li>`)
  ].join('') || '<li>Ingen ubundet tid til kontrol, overlap, auto-stop eller huller mellem dagens registreringer.</li>';
  // Bevar tastaturfokus og rulning, når uret tikker eller metadata ændres.
  saetListe('gennemgang-liste', indhold);
  saetListe('gennemgang-accepterede', klar && accepterede.length ? `<li class="gennemgang-info">Accepteret fælles tid — indgår fortsat som ubundet tid i beregningerne.</li>${accepterede.map(p => `<li><strong>Accepteret fælles tid · ${tid(p)}</strong><div class="gennemgang-knapper">${knap(p.e, 'ret', 'Ret registrering')}${knap(p.e, 'fortryd', 'Fortryd accept')}</div></li>`).join('')}` : '');
}

const listeHtml = new Map();
function saetListe(id, html) {
  const el = $(id);
  if (listeHtml.get(id) === html) return;
  listeHtml.set(id, html);
  const aktiv = el.contains(document.activeElement) ? document.activeElement : null;
  const data = aktiv?.dataset;
  el.innerHTML = html;
  if (aktiv) {
    const ny = [...el.querySelectorAll('button')].find(b => !b.disabled && b.dataset.post === data.post && b.dataset.handling === data.handling && b.dataset.hul === data.hul);
    (ny || $('hjem-gennemgang').querySelector('summary')).focus({ preventScroll: true });
  }
}

async function handling(event) {
  const b = event.target.closest('button');
  if (!b || !bruger || !klar || b.disabled) return;
  if (b.dataset.hul !== undefined) {
    const hul = gennemgaaDag(poster).huller[Number(b.dataset.hul)];
    if (hul) openEntrySheet(null, { start: new Date(hul.fra), end: new Date(hul.til) });
    return;
  }
  const e = poster.find(p => p.id === b.dataset.post);
  if (!e) return;
  if (b.dataset.handling === 'ret') { openEntrySheet(e.id, null, e); return; }
  const s = session, uid = bruger, noegle = `${uid}/${e.id}`;
  if (gemmer.has(noegle)) return;
  gemmer.add(noegle); $('gennemgang-fejl').textContent = '';
  const accept = b.dataset.handling === 'accepter';
  tegnGennemgang(poster, klar, henteFejl);
  try {
    // Kun markeringen skrives. Tider og aktivitet overskrives aldrig, og en
    // accept af en forældet version bliver ikke gyldig på den rettede post.
    await updateDoc(doc(db, `users/${uid}/entries/${e.id}`), { faellesTidAccepteret: accept ? faellesNoegle(e) : null });
    if (s === session) showToast(accept ? 'Accepteret som tilsigtet fælles tid' : 'Accept fortrudt');
  } catch {
    if (s === session) $('gennemgang-fejl').textContent = 'Kunne ikke gemme valget. Kontrollér lagringsstatus og prøv igen.';
  } finally {
    gemmer.delete(noegle);
    if (s === session) tegnGennemgang(poster, klar, henteFejl);
  }
}
