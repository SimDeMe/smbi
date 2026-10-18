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

// Fortryd og rettelse bruger samme kontroltoken som stop/skift. Også en
// manuelt redigeret eller slettet post afviser handlingen uden delvis skrivning.
export async function retTimerHandling(handling, { fortryd = false, tidspunkt = null } = {}) {
  const { uid, foer, efter, token } = handling;
  if (!navigator.onLine) throw new Error('Offline: Timeren er uændret. Opret glemt tid, eller prøv igen online.');
  if (foer.length !== 1) konflikt();
  const oprindelig = foer[0];
  const alle = new Map(efter.map(p => [p.ref.path, { ref: p.ref, data: null }]));
  if (fortryd) {
    alle.set(oprindelig.ref.path, oprindelig);
  } else {
    if (!Number.isFinite(tidspunkt) || tidspunkt < oprindelig.data.startTime.toMillis() || tidspunkt > Date.now()) {
      throw new Error('Vælg et tidspunkt mellem timerens start og nu.');
    }
    alle.set(oprindelig.ref.path, { ref: oprindelig.ref, data: afslutPost(oprindelig.data, tidspunkt) });
    for (const p of efter.filter(p => p.ref.path !== oprindelig.ref.path)) {
      if (p.data?.isBreak) throw new Error('Ret pausen i historikken.');
      if (!p.data || p.data.endTime) konflikt();
      const data = { ...p.data, startTime: Timestamp.fromMillis(tidspunkt) };
      if (data.plannedDurationMinutes != null) {
        const planSlut = p.data.startTime.toMillis() + data.plannedDurationMinutes * 60000;
        if (tidspunkt >= planSlut) throw new Error('Tidspunktet skal være før modulets planlagte slutning.');
        data.plannedDurationMinutes = (planSlut - tidspunkt) / 60000;
      }
      alle.set(p.ref.path, { ref: p.ref, data });
    }
  }
  const aendringer = [...alle.values()];
  const col = collection(db, `users/${uid}/entries`);
  // Ingen begrænsning til de nyeste poster: en post fra i går kan stadig
  // overlappe den timer, som fortryd ville genåbne.
  const [naboer, aktive] = await Promise.all([
    getDocsFromServer(query(col, where('endTime', '>', oprindelig.data.startTime))),
    getDocsFromServer(query(col, where('endTime', '==', null)))
  ]);
  const forventetAabne = efter.filter(p => p.data && !p.data.endTime).map(p => p.ref.id).sort();
  const aabne = aktive.docs.map(d => d.id).sort();
  if (!sammePost(forventetAabne, aabne)) konflikt();
  const beroerte = new Set(efter.map(p => p.ref.id));
  const overlapper = data => data && aendringer.some(p => p.data && !p.data.isBreak &&
    data.startTime.toMillis() < (p.data.endTime?.toMillis() ?? Date.now()) &&
    (data.endTime?.toMillis() ?? Date.now()) > p.data.startTime.toMillis());
  const andre = [...naboer.docs, ...aktive.docs].filter(d => !beroerte.has(d.id));
  if (andre.some(d => overlapper(d.data()))) throw new Error('Ændringen ville overlappe en anden registrering. Ret tiderne i historikken.');
  const kontrolRef = doc(db, timerKontrolSti(uid));
  const nytToken = doc(col).id;
  return runTransaction(db, async tx => {
    const k = await tx.get(kontrolRef);
    if (k.data()?.token !== token) konflikt();
    for (const p of efter) {
      const snap = await tx.get(p.ref);
      if (!sammePost(snap.data() ?? null, p.data)) konflikt();
    }
    // Et nabodokument, der ændres under forsøget, udløser retry og et nyt
    // tjek. Transaktionen må aldrig overskrive naboposten.
    for (const d of andre) {
      const snap = await tx.get(doc(db, `users/${uid}/entries/${d.id}`));
      if (!sammePost(snap.data() ?? null, d.data())) konflikt();
    }
    for (const p of aendringer) p.data ? tx.set(p.ref, p.data) : tx.delete(p.ref);
    tx.set(kontrolRef, { token: nytToken, activeId: aendringer.find(p => p.data && !p.data.endTime)?.ref.id ?? null });
    return { ...handling, token: nytToken, efter: aendringer, slutMs: tidspunkt ?? handling.slutMs };
  });
}
