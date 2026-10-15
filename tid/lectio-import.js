import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence, browserPopupRedirectResolver, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { initializeFirestore } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { validateLectio } from './lectio-data.js';
import { saveLectio } from './lectio-store.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.hash.slice(1));
const helperOrigin = params.get('origin'), nonce = params.get('nonce');
const permitted = (() => { try { const u = new URL(helperOrigin); return u.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(u.hostname) && u.origin === helperOrigin && /^\d+$/.test(u.port) && /^[a-f0-9-]{36}$/i.test(nonce || '') && Boolean(window.opener); } catch { return false; } })();
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence] });
const db = initializeFirestore(app, {});
let user = null, approvedUid = null, pending = null, saving = false, disconnected = false, manual = false;
const send = data => { if (permitted && !disconnected) window.opener.postMessage({ ...data, nonce }, helperOrigin); };
const status = message => { $('import-status').textContent = message; };
function controls() { $('import-save').disabled = (!permitted && !manual) || !user || !pending || saving || disconnected; }
onAuthStateChanged(auth, current => {
  if (user?.uid !== current?.uid) approvedUid = null;
  user = current;
  $('import-account').textContent = user ? `Tid-konto: ${user.email || user.displayName || 'Logget ind'}` : 'Du er ikke logget ind i Tid.';
  $('import-login').hidden = Boolean(user);
  controls();
});
$('import-login').addEventListener('click', async () => {
  try { await signInWithPopup(auth, new GoogleAuthProvider(), browserPopupRedirectResolver); }
  catch (error) { status(error.code === 'auth/popup-blocked' ? 'Tryk på Log ind igen for at åbne login-vinduet.' : 'Login mislykkedes. Prøv igen.'); }
});
async function save() {
  if (!user || !pending || saving || approvedUid !== user.uid || disconnected) return;
  saving = true; controls();
  const payload = pending, uid = user.uid;
  try {
    status('Gemmer skemaet i Tid…');
    const result = await saveLectio(db, uid, payload);
    if (disconnected || user?.uid !== uid) return;
    status(`${result.count} aktiviteter gemt på din Tid-konto.`);
    send({ type: 'tid-lectio-saved', fetchedAt: payload.fetchedAt, count: result.count });
    $('import-save').textContent = manual ? 'Skema gemt' : 'Forbundet'; $('import-disconnect').hidden = manual;
  } catch (error) { status(error.code === 'permission-denied' ? 'Firebase afviste importen. Kontroller, at din bruger har adgang til users/{dit uid}/lectioSchedules.' : error.message); send({ type: 'tid-lectio-error', message: 'Kunne ikke gemme skemaet. Se forbindelsesvinduet.' }); }
  finally { saving = false; controls(); if (pending && pending.fetchedAt !== payload.fetchedAt && !disconnected) save(); }
}
window.addEventListener('message', event => {
  if (!permitted || disconnected || event.origin !== helperOrigin || event.source !== window.opener || event.data?.nonce !== nonce) return;
  if (event.data.type === 'tid-lectio-disconnect') { approvedUid = null; disconnected = true; status('Forbindelsen er afbrudt.'); controls(); return; }
  if (event.data.type !== 'tid-lectio-snapshot') return;
  try {
    pending = validateLectio(event.data.snapshot);
    $('import-summary').textContent = `${pending.events.length} aktiviteter · ${pending.range.from} til ${pending.range.to}. Opdaterer ${pending.lastUpdate.from} til ${pending.lastUpdate.to}; tidligere aftaler bevares ved en fremadrettet opdatering.`;
    controls();
    if (approvedUid === user?.uid) save(); else status('Kontroller kontoen og tryk Forbind og gem skema.');
  } catch (error) { status(error.message); send({ type: 'tid-lectio-error', message: error.message }); }
});
$('import-save').addEventListener('click', () => { approvedUid = user?.uid; save(); });
$('import-file-label').hidden = permitted;
$('import-file').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 2000000) throw new Error('Filen er for stor.');
    pending = validateLectio(JSON.parse(await file.text())); manual = true; approvedUid = null;
    $('import-summary').textContent = `${pending.events.length} aktiviteter · ${pending.range.from} til ${pending.range.to}`;
    $('import-save').textContent = 'Gem skema i Tid'; status('Kontroller kontoen og gem skemaet.'); controls();
  } catch (error) { pending = null; status(error.message); controls(); }
});
$('import-disconnect').addEventListener('click', () => { send({ type: 'tid-lectio-disconnected' }); approvedUid = null; disconnected = true; status('Forbindelsen er afbrudt. Luk vinduet.'); controls(); });
if (permitted) send({ type: 'tid-lectio-ready' });
else status('Vælg en JSON-fil, eller åbn forbindelsen med Send til Tid i Lectio-programmet.');
