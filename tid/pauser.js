// pauser.js — korte pauser mellem to registreringer
//
// Et mellemrum på under KORT_PAUSE_MAX minutter mellem to poster er sjældent
// glemt tid: det er pausen mellem to moduler eller frokosten. Sådan et
// mellemrum lukkes automatisk med en pause-post, så dagen hænger sammen —
// uanset hvordan posterne er kommet til: timer, modul, Historik, Lectio eller
// flytning i kalenderen, og uanset rækkefølgen. Længere mellemrum lades i
// fred — de er bare tom tid.
//
// En pause er en almindelig post med isBreak:true. Den kan redigeres og
// slettes som alle andre, men tæller ikke som arbejdstid i rapporterne.
// Slettes en pause mellem to poster, der står endnu, huskes hullet i
// indstillingerne (afvisteHuller: { fra: til }), så det ikke lukkes igen.
// Slettes en af posterne omkring hullet, glemmes det igen — ellers ville en
// dag, der ryddes og tastes ind på ny, aldrig få sine pauser tilbage.

import { db } from './app.js';
import { getSettings, gemIndstilling } from './indstillinger.js';
import {
  collection, doc, addDoc, getDocs, writeBatch, query, where, orderBy, limit, Timestamp
} from './lager.js';
import { skoleaarStart, skoleaarFor } from './periode.js';

export const KORT_PAUSE_MAX = 30;            // minutter — mellemrum herunder bliver til pause
export const PAUSE_NAVN     = 'Kort pause';
export const erPause        = e => e?.isBreak === true;

// ─── Opret post ───────────────────────────────────────────
// Alle nye registreringer går gennem denne, så hullerne omkring posten bliver
// lukket ét sted i stedet for på hvert kaldested.
export async function opretPost(userId, data) {
  const ref = await addDoc(collection(db, `users/${userId}/entries`), data);
  // En manglende pause må aldrig vælte selve registreringen
  await lukKortePauser(userId, startTidspunkt(data));
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

// ─── Luk alle korte huller ────────────────────────────────
// Ren beregning: poster er dokumenternes data. Hullerne findes inden for
// hver dag mellem poster, der begynder samme dag; pauser og igangværende
// timere dækker også tid. Returnerer [{ fra, til }] i millisekunder.
export function kortePauser(poster, afviste = {}) {
  const dage = new Map();
  for (const e of poster) {
    const fra = e.startTime?.toMillis?.();
    if (!Number.isFinite(fra)) continue;
    const til = e.endTime ? e.endTime.toMillis() : Infinity;
    const d = new Date(fra); d.setHours(0, 0, 0, 0);
    if (!dage.has(+d)) dage.set(+d, []);
    dage.get(+d).push({ fra, til });
  }
  const huller = [];
  for (const liste of dage.values()) {
    liste.sort((a, b) => a.fra - b.fra || a.til - b.til);
    let daekket = null;
    for (const p of liste) {
      if (daekket !== null && p.fra > daekket) {
        const minutter = Math.round((p.fra - daekket) / 60000);
        if (minutter >= 1 && minutter < KORT_PAUSE_MAX && afviste[daekket] !== p.fra) {
          huller.push({ fra: daekket, til: p.fra });
        }
      }
      daekket = Math.max(daekket ?? p.til, p.til);
    }
  }
  return huller;
}

// Lukker hullerne fra dagen for `fra` til og med dagen for `til` (uden `til`:
// alt derefter). Id'et følger hullet, så to enheder, der lukker det samme
// hul på én gang, skriver den samme post. Returnerer de nye posters refs.
export async function lukKortePauser(userId, fra, til = fra) {
  const s = getSettings();
  if (!userId || s.autoShortBreaks === false) return [];
  try {
    const huller = kortePauser(await dagenesPoster(userId, fra, til), s.afvisteHuller || {});
    const refs = [];
    // Firestore tager højst 500 skrivninger pr. batch
    for (let i = 0; i < huller.length; i += 450) {
      const batch = writeBatch(db);
      for (const h of huller.slice(i, i + 450)) {
        const ref = doc(db, `users/${userId}/entries/pause-${h.fra}-${h.til}`);
        batch.set(ref, {
          activityId: null, workType: null,
          startTime: Timestamp.fromMillis(h.fra), endTime: Timestamp.fromMillis(h.til),
          durationMinutes: Math.round((h.til - h.fra) / 60000), note: '',
          isModule: false, autoStopped: false, isBreak: true
        });
        refs.push(ref);
      }
      await batch.commit();
    }
    return refs;
  } catch (err) {
    console.error('Kort pause fejl:', err);
    return [];
  }
}

async function dagenesPoster(userId, fra, til) {
  const dagStart = new Date(fra); dagStart.setHours(0, 0, 0, 0);
  const betingelser = [where('startTime', '>=', Timestamp.fromDate(dagStart))];
  if (til) {
    const dagSlut = new Date(til); dagSlut.setHours(0, 0, 0, 0); dagSlut.setDate(dagSlut.getDate() + 1);
    betingelser.push(where('startTime', '<', Timestamp.fromDate(dagSlut)));
  }
  const snap = await getDocs(query(collection(db, `users/${userId}/entries`), ...betingelser));
  return snap.docs.map(d => d.data());
}

// Ved opstart: hele det aktuelle skoleår, også poster lagt ind før denne
// version, fra Lectio eller i en anden rækkefølge
export function lukSkoleaaretsPauser(userId) {
  return lukKortePauser(userId, skoleaarStart(skoleaarFor(new Date())), null);
}

// En slettet pause er et hul, brugeren vil have stående — men kun hvis der
// stadig er poster på begge sider, så hullet ellers ville blive lukket igen.
// Kaldes, efter pausen er slettet.
export async function afvisPause(userId, e) {
  const fra = e?.startTime?.toMillis?.(), til = e?.endTime?.toMillis?.();
  if (!erPause(e) || !Number.isFinite(fra) || getSettings().autoShortBreaks === false) return;
  try {
    // Også en rettet pause: det hul, den lå i
    const hul = kortePauser(await dagenesPoster(userId, new Date(fra))).find(h => h.fra < til && h.til > fra);
    if (hul) await gemIndstilling('afvisteHuller', { ...(getSettings().afvisteHuller || {}), [hul.fra]: hul.til });
  } catch (err) {
    console.error('Kort pause fejl:', err);
  }
}

// En slettet post ophæver afvisningen af hullerne lige før og lige efter den
export async function glemAfvisteHuller(e) {
  const fra = e?.startTime?.toMillis?.(), til = e?.endTime?.toMillis?.();
  const afviste = getSettings().afvisteHuller || {};
  const tilbage = Object.fromEntries(Object.entries(afviste).filter(([a, b]) => +a !== til && b !== fra));
  if (Object.keys(tilbage).length !== Object.keys(afviste).length) await gemIndstilling('afvisteHuller', tilbage);
}
