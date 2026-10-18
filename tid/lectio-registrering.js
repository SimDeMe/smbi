// Lectio er en plan. Først brugerens godkendelse opretter arbejdstid.
import { db } from './app.js';
import { getLoadedActivities } from './activities.js';
import { danishDate } from './lectio-data.js';
import { skoleaarStart } from './periode.js';
import { collection, query, where, getDocsFromServer, doc, runTransaction, Timestamp } from './lager.js';

export class LectioFejl extends Error {}

export const kanRegistreres = e => !!e.group && !e.cancelled && !e.allDay &&
  Number.isFinite(+danishDate(e.start)) && danishDate(e.end) > danishDate(e.start) &&
  danishDate(e.end) - danishDate(e.start) < 86400000;

const normaliser = s => (s || '').trim().toLocaleLowerCase('da-DK').replace(/\s+/g, ' ');
export function lectioHold(event) {
  // Lectios activityId er et skema-id, aldrig et Tid-aktivitets-id.
  const dato = danishDate(event.start);
  return getLoadedActivities().filter(a => a.type === 'hold' && !a.isArchived &&
    // Hold fra det skoleår, datoen ligger i, også når aktivt år er et andet.
    dato >= skoleaarStart(parseInt(a.schoolYear)) && dato < skoleaarStart(parseInt(a.schoolYear) + 1));
}
export function matchHold(event, acts = lectioHold(event)) {
  const match = acts.filter(a => normaliser(a.name) === normaliser(event.group));
  return match.length === 1 ? match[0] : null;
}

export function alleredeRegistreret(event, poster, activityId = matchHold(event)?.id) {
  return poster.find(p => p.lectioEventId === event.id || (event.activityId && p.lectioActivityId === event.activityId) ||
    (!p.isBreak && p.workType === 'undervisning' && activityId && p.activityId === activityId &&
      Math.abs(+p.startTime?.toDate() - +danishDate(event.start)) < 60000 &&
      Math.abs(+p.endTime?.toDate() - +danishDate(event.end)) < 60000));
}

// Ingen vilkårlig listegrænse. Sluttid fanger også lange poster fra tidligere
// dage; åbne timere og ændrede Lectio-registreringer hentes særskilt.
export async function hentLectioKontrol(uid, event, fra = danishDate(event.start), til = danishDate(event.end)) {
  if (!uid || !navigator.onLine) throw new LectioFejl('Registrering fra Lectio kræver forbindelse. Prøv igen, når du er online.');
  const col = collection(db, `users/${uid}/entries`);
  const opslag = [
    getDocsFromServer(query(col, where('endTime', '>', Timestamp.fromDate(fra)))),
    getDocsFromServer(query(col, where('endTime', '==', null))),
    getDocsFromServer(query(col, where('lectioEventId', '==', event.id)))
  ];
  if (event.activityId) opslag.push(getDocsFromServer(query(col, where('lectioActivityId', '==', event.activityId))));
  const svar = await Promise.all(opslag);
  const poster = [...new Map(svar.flatMap(s => s.docs.map(d => [d.id, { id: d.id, ...d.data() }]))).values()];
  return { poster, overlap: poster.filter(p => p.startTime?.toDate() < til &&
    (p.endTime ? p.endTime.toDate() : new Date()) > fra) };
}

export async function gemLectioRegistrering(uid, event, data, kontrollerKonto = () => true) {
  if (!navigator.onLine) throw new LectioFejl('Registrering fra Lectio kræver forbindelse.');
  // Samme dokument på alle enheder. Transaktionen opretter det kun, hvis
  // det stadig mangler; sletning frigiver det igen uden en løs låsepost.
  // Lectios absid bevares, også hvis modulets tidspunkt ændres ved ny import.
  const noegle = event.activityId ? 'aktivitet:' + event.activityId : 'aftale:' + event.id;
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(noegle));
  const id = 'lectio-' + [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  const ref = doc(db, `users/${uid}/entries/${id}`);
  await runTransaction(db, async tx => {
    const gammel = await tx.get(ref);
    if (!kontrollerKonto()) throw new LectioFejl('Kontoen eller formularen er ændret. Kontrollér og gem igen.');
    if (gammel.exists()) throw new LectioFejl('Aftalen er allerede registreret. Åbn den igen for at se registreringen.');
    tx.set(ref, { ...data, lectioEventId: event.id, lectioActivityId: event.activityId || null, isModule: false, autoStopped: false });
  });
}
