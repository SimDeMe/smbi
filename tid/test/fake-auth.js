// Kaldene gemmes i window.__auth, så en test kan se, hvordan appen logger ind
const log = window.__auth = { init: null, popup: [] };
export const getAuth = () => ({});
export const initializeAuth = (app, deps) => { log.init = { persistence: (deps?.persistence || []).length, resolver: !!deps?.popupRedirectResolver }; return {}; };
export const indexedDBLocalPersistence = {}, browserLocalPersistence = {}, browserSessionPersistence = {};
export const browserPopupRedirectResolver = { navn: 'popup' };
export class GoogleAuthProvider {}
export const signInWithPopup = async (auth, provider, resolver) => { log.popup.push(!!resolver); };
export const signOut = async () => {};
export function onAuthStateChanged(auth, cb) { setTimeout(() => cb(window.__fsCfg?.udlogget ? null : { uid: 'u1' }), 0); }
