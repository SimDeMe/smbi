// pauser.js — korte pauser mellem to registreringer
//
// Et mellemrum på under KORT_PAUSE_MAX minutter mellem to poster er sjældent
// glemt tid: det er pausen mellem to moduler eller frokosten. Når en ny post
// oprettes, lukkes sådan et mellemrum automatisk med en pause-post, så dagen
// hænger sammen. Længere mellemrum lades i fred — de er bare tom tid.
//
// En pause er en almindelig post med isBreak:true. Den kan redigeres og
// slettes som alle andre, men tæller ikke som arbejdstid i rapporterne.

import { db } from './app.js';
import { getSettings } from './indstillinger.js';
import {
  collection, addDoc, getDocs, query, where, orderBy, limit, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

export const KORT_PAUSE_MAX = 30;            // minutter — mellemrum herunder bliver til pause
export const PAUSE_NAVN     = 'Kort pause';
export const erPause        = e => e?.isBreak === true;

// ─── Opret post ───────────────────────────────────────────
// Alle nye registreringer går gennem denne, så pausen foran posten bliver
// oprettet ét sted i stedet for på hvert kaldested.
export async function opretPost(userId, data) {
  // Mellemrummet måles før posten er oprettet — ellers ville den nye post selv
  // være med i opslaget, og en igangværende timer ville se ud som dækket tid
  const start = startTidspunkt(data);
  let pause = null;
  try {
    pause = await findKortMellemrum(userId, start);
  } catch (err) {
    console.error('Kort pause fejl:', err);
  }

  const ref = await addDoc(collection(db, `users/${userId}/entries`), data);

  if (pause) {
    try {
      // En manglende pause må aldrig vælte selve registreringen
      await addDoc(collection(db, `users/${userId}/entries`), pause);
    } catch (err) {
      console.error('Kort pause fejl:', err);
    }
  }
  return ref;
}

// startTime er enten en Timestamp eller serverTimestamp()-markøren; i sidste
// tilfælde er posten oprettet nu, og pausen skal slutte her
function startTidspunkt(data) {
  return typeof data?.startTime?.toDate === 'function'
    ? data.startTime.toDate()
    : new Date();
}

// ─── Mellemrummet foran en ny post ────────────────────────
// Returnerer pause-posten, der lukker mellemrummet — eller null
export async function findKortMellemrum(userId, start) {
  if (getSettings().autoShortBreaks === false) return null;

  const slut = senesteSlutFoer(await dagensPosterFoer(userId, start));
  if (!slut) return null;

  const minutter = Math.round((start - slut) / 60000);
  if (minutter < 1 || minutter >= KORT_PAUSE_MAX) return null;

  return {
    activityId: null, workType: null,
    startTime: Timestamp.fromDate(slut), endTime: Timestamp.fromDate(start),
    durationMinutes: minutter, note: '',
    isModule: false, autoStopped: false, isBreak: true
  };
}

// Dagens poster før tidspunktet — pauser går aldrig hen over et døgnskifte
async function dagensPosterFoer(userId, start) {
  const dagStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const snap = await getDocs(query(
    collection(db, `users/${userId}/entries`),
    where('startTime', '>=', Timestamp.fromDate(dagStart)),
    where('startTime', '<',  Timestamp.fromDate(start)),
    orderBy('startTime', 'desc'),
    limit(50)
  ));
  return snap.docs.map(d => d.data());
}

// Sidste sluttidspunkt før den nye post. Er en tidligere post stadig i gang,
// er tiden dækket, og der er intet mellemrum at lukke.
function senesteSlutFoer(poster) {
  let senest = null;
  for (const e of poster) {
    if (!e.endTime) return null;
    const slut = e.endTime.toDate();
    if (!senest || slut > senest) senest = slut;
  }
  return senest;
}
