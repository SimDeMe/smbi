// Fælles indgang til Firestore. Status bygger på metadata og kvitteringer,
// aldrig alene på navigator.onLine. Ingen ekstra opslag af hele historikken.
import * as fs from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';
export * from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

let session = 0, bruger = null, database = null, klar = false, koeBekraeftet = false;
let gemmer = 0, skrivefejl = null, kontrol = 0;
const lyttere = new Set();
const $ = id => document.getElementById(id);

export function initLagringsstatus(db, uid) {
  if (database === db && bruger === uid) return;
  session++;
  // Gamle kontolyttere må hverken påvirke status eller opdatere visningen.
  for (const l of lyttere) l.stop?.();
  lyttere.clear();
  database = db; bruger = uid; klar = false; koeBekraeftet = false;
  gemmer = 0; skrivefejl = null;
  if ($('lagringsstatus')) $('lagringsstatus').open = false;
  tegn();
  if (uid) kontrollérKoe();
}

export function lagringStartet() { klar = true; tegn(); }

function kontrollérKoe() {
  const s = session, k = ++kontrol;
  koeBekraeftet = false;
  // Fanger også skrivninger fra en tidligere åbning af appen og ændringer
  // uden for de begrænsede queries på de åbne faner, fx en gammel slettet post.
  fs.waitForPendingWrites(database).then(() => {
    if (s !== session || k !== kontrol) return;
    koeBekraeftet = true; tegn();
  }).catch(err => {
    if (s !== session || k !== kontrol) return;
    skrivefejl = err; tegn();
  });
}

export function onSnapshot(ref, callback, error) {
  const s = session;
  const l = { metadata: null, fejl: null, stop: null, aaben: true };
  const start = () => {
    l.stop?.(); l.metadata = null; l.fejl = null; l.harData = false;
    l.stop = fs.onSnapshot(ref, { includeMetadataChanges: true }, snap => {
      if (s !== session || !l.aaben) return;
      l.metadata = snap.metadata; l.fejl = null; tegn();
      // En ren kvittering skal ændre status, men ikke tegne kalenderen og
      // formularernes indhold igen. Første svar gives altid videre.
      const data = snap.docs ? null : JSON.stringify(snap.data());
      const aendret = snap.docs ? snap.docChanges().length > 0 : data !== l.data;
      if (!l.harData || aendret) callback(snap);
      l.harData = true; l.data = data;
    }, err => {
      if (s !== session || !l.aaben) return;
      l.fejl = err; tegn(); error?.(err);
    });
  };
  l.start = start; lyttere.add(l); start(); tegn();
  return () => { l.aaben = false; l.stop?.(); lyttere.delete(l); tegn(); };
}

async function skriv(fn) {
  const s = session;
  gemmer++; tegn();
  try { return await fn(); }
  catch (err) {
    if (s === session) skrivefejl = err;
    throw err;
  } finally {
    if (s === session) { gemmer--; tegn(); }
  }
}

export const addDoc = (...args) => skriv(() => fs.addDoc(...args));
export const setDoc = (...args) => skriv(() => fs.setDoc(...args));
export const updateDoc = (...args) => skriv(() => fs.updateDoc(...args));
export const deleteDoc = (...args) => skriv(() => fs.deleteDoc(...args));
// Hele transaktionen tæller som ét forsøg; SDK'ets retries ændres ikke.
export const runTransaction = (...args) => skriv(() => fs.runTransaction(...args));
export function writeBatch(...args) {
  const batch = fs.writeBatch(...args);
  const commit = batch.commit.bind(batch);
  batch.commit = () => skriv(commit);
  return batch;
}

function tegn() {
  const el = $('lagringsstatus');
  if (!el) return; // Lectio-importens selvstændige side har ingen statuslinje.
  el.classList.toggle('hidden', !bruger);
  const alle = [...lyttere], lokal = alle.some(l => l.metadata?.hasPendingWrites);
  const fejl = skrivefejl || alle.find(l => l.fejl)?.fejl;
  const bekraeftet = klar && koeBekraeftet && alle.length > 0 &&
    alle.every(l => l.metadata && !l.metadata.fromCache && !l.metadata.hasPendingWrites);
  let tilstand, titel, tekst;
  if (fejl) {
    tilstand = 'fejl'; titel = 'Lagringsfejl';
    const adgang = ['permission-denied', 'unauthenticated'].includes(fejl.code);
    tekst = adgang
      ? 'Din konto har ikke adgang til at hente eller gemme alle data. Kontrollér, at du bruger den rigtige Google-konto.'
      : 'En ændring eller hentning kunne ikke bekræftes på serveren. Kontrollér forbindelsen og prøv at kontrollere igen.';
    tekst += ' Afviste ændringer kan være rullet tilbage og sendes ikke igen automatisk. Kontrollér ændringen i appen, og gem den igen om nødvendigt.';
  } else if (!navigator.onLine) {
    tilstand = 'offline'; titel = 'Offline';
    tekst = lokal
      ? 'Gemt på denne enhed / afventer synkronisering. Ændringerne er endnu ikke bekræftet på serveren eller tilgængelige på din anden enhed.'
      : 'Viser data fra denne enhed. Serverens seneste data kan ikke bekræftes.';
    tekst += ' Hold appen åben, når forbindelsen er tilbage. Timerhandlinger kræver forbindelse og køres ikke senere.';
  } else if (lokal) {
    tilstand = 'afventer'; titel = 'Afventer synkronisering';
    tekst = 'Gemt på denne enhed / afventer synkronisering. Ændringerne er endnu ikke bekræftet på serveren eller tilgængelige på din anden enhed. Hold appen åben, mens de sendes.';
  } else if (gemmer) {
    tilstand = 'gemmer'; titel = 'Gemmer…';
    tekst = 'En ændring afventer serverens bekræftelse. Den er endnu ikke bekræftet tilgængelig på din anden enhed. Hold appen åben.';
  } else if (bekraeftet) {
    tilstand = 'synkroniseret'; titel = 'Synkroniseret';
    tekst = 'Alle ventende ændringer er bekræftet på serveren, og de viste data er hentet derfra. Din anden enhed kan hente ændringerne, når den har forbindelse.';
  } else {
    tilstand = 'afventer'; titel = 'Afventer serveren';
    tekst = 'Serveren har endnu ikke bekræftet de viste data og eventuelle ventende ændringer. Forbindelse alene betyder ikke, at data er synkroniseret.';
  }
  el.dataset.tilstand = tilstand;
  if ($('lagringsstatus-titel').textContent !== titel) $('lagringsstatus-titel').textContent = titel;
  $('lagringsstatus-tekst').textContent = tekst;
  // Bevar knappen og fokus, også hvis status skifter under kontrollen.
  $('lagringsstatus-kontroller').disabled = !navigator.onLine;
}

function kontrollérIgen(rydFejl = false) {
  if (!bruger || !navigator.onLine) return;
  if (rydFejl) skrivefejl = null;
  for (const l of lyttere) l.start();
  kontrollérKoe(); tegn();
}

window.addEventListener('offline', tegn);
// Et nyt online-event er ikke en kvittering. Genåbn lytterne, så hver af dem
// igen skal modtage et serversnapshot, og kontrollér den persistente kø.
window.addEventListener('online', () => kontrollérIgen());
document.getElementById('lagringsstatus-kontroller')?.addEventListener('click', () => kontrollérIgen(true));
