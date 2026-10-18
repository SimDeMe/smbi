// Timerhandlinger bekræftes på serveren. Ingen stop/start-skrivninger lægges
// i offlinekø: en forældet enhed må ikke senere overskrive en anden timer.
import { db } from './app.js';
import { findKortMellemrum } from './pauser.js';
import {
  collection, doc, query, where, getDocsFromServer, runTransaction, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

export const timerKontrolSti = uid => `users/${uid}/settings/timer`;
export const TIMER_KONFLIKT = 'Timeren er ændret på en anden enhed. Kontrollér timeren og prøv igen.';
const konflikt = () => { throw new Error(TIMER_KONFLIKT); };

// Sammenlign også note, arbejdstype og planlagt varighed, så en manuel
// rettelse eller et gammelt auto-stop aldrig overskrives ubemærket.
const normaliser = v => v?.toMillis ? v.toMillis()
  : Array.isArray(v) ? v.map(normaliser)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, normaliser(v[k])])) : v;
export const sammePost = (a, b) => JSON.stringify(normaliser(a)) === JSON.stringify(normaliser(b));
export const postData = ({ id, ...data }) => data;

export function afslutPost(data, slutMs, auto = null) {
  const startMs = data.startTime.toMillis();
  if (slutMs < startMs) throw new Error('Sluttidspunktet er før timerens start. Kontrollér tiden.');
  if (auto == null && slutMs - startMs < 60000) return null;
  return { ...data, endTime: Timestamp.fromMillis(slutMs),
    durationMinutes: Math.max(0, Math.round((slutMs - startMs) / 60000)),
    ...(auto == null ? {} : { autoStopped: auto }) };
}

// Kontroldokumentet serialiserer alle nye klienter. De observerede åbne
// poster læses igen i transaktionen; samtidige handlinger afvises ved retry.
// Et serveropslag opdager desuden ekstra åbne poster fra ældre/offline klienter.
export async function udfoerTimerHandling(uid, { poster, kontrol, ny = null, slutMs = Date.now(), auto = null }) {
  if (!navigator.onLine) throw new Error('Offline: Timeren er uændret. Opret glemt tid, eller prøv igen online.');
  const col = collection(db, `users/${uid}/entries`);
  const server = await getDocsFromServer(query(col, where('endTime', '==', null)));
  if (!sammePost(server.docs.map(d => d.id).sort(), poster.map(p => p.id).sort())) konflikt();
  const nyRef = ny ? doc(col) : null;
  const pause = ny && !poster.length ? await findKortMellemrum(uid, ny.startTime.toDate()) : null;
  const pauseRef = pause ? doc(col) : null;
  const kontrolRef = doc(db, timerKontrolSti(uid));
  const token = doc(col).id;
  return runTransaction(db, async tx => {
    const k = await tx.get(kontrolRef);
    if ((k.data()?.token ?? null) !== kontrol) konflikt();
    if (k.data()?.activeId && !poster.some(p => p.id === k.data().activeId)) {
      // Historikken/backup kan have lukket eller slettet den tidligere timer.
      const gammel = await tx.get(doc(db, `${col.path}/${k.data().activeId}`));
      if (gammel.exists() && !gammel.data().endTime) konflikt();
    }
    const foer = [];
    for (const p of poster) {
      const ref = doc(db, `users/${uid}/entries/${p.id}`);
      const snap = await tx.get(ref);
      if (!snap.exists() || !sammePost(snap.data(), postData(p))) konflikt();
      foer.push({ ref, data: snap.data() });
    }
    const efter = foer.map(p => ({ ref: p.ref, data: afslutPost(p.data, slutMs, auto) }));
    if (nyRef) efter.push({ ref: nyRef, data: ny });
    if (pauseRef) efter.push({ ref: pauseRef, data: pause });
    for (const p of efter) p.data ? tx.set(p.ref, p.data) : tx.delete(p.ref);
    tx.set(kontrolRef, { token, activeId: nyRef?.id ?? null });
    return { uid, token, foer, efter, slutMs };
  });
}
