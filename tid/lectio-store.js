import { doc, collection, onSnapshot, runTransaction } from './lager.js';
import { validateLectio, yearsInRange, mergeLectio } from './lectio-data.js';

export async function saveLectio(db, uid, raw) {
  if (!uid) throw new Error('Log ind i Tid først.');
  const incoming = validateLectio(raw);
  const years = yearsInRange(incoming.lastUpdate.from, incoming.lastUpdate.to);
  const refs = years.map(year => doc(db, `users/${uid}/lectioSchedules/${year}`));
  return runTransaction(db, async transaction => {
    const old = await Promise.all(refs.map(ref => transaction.get(ref)));
    const documents = years.map((year, i) => ({ ...mergeLectio(old[i].exists() ? old[i].data() : null, incoming, year), importedAt: new Date().toISOString() }));
    // Leave headroom below Firestore's 1 MiB limit, including field-name overhead.
    if (documents.some(d => new TextEncoder().encode(JSON.stringify(d)).length > 750000)) throw new Error('Skemaet er for stort til ét skoleår. Importen blev ikke gemt.');
    documents.forEach((d, i) => transaction.set(refs[i], d));
    return { count: documents.reduce((sum, d) => sum + d.events.length, 0), fetchedAt: incoming.fetchedAt };
  });
}
export function listenLectio(db, uid, callback, error) {
  return onSnapshot(collection(db, `users/${uid}/lectioSchedules`), snap => {
    const documents = snap.docs.map(d => d.data());
    callback({ events: documents.flatMap(d => d.events || []).sort((a, b) => a.start.localeCompare(b.start)), fetchedAt: documents.map(d => d.fetchedAt).sort().at(-1) || null });
  }, error);
}
