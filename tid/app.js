import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache
} from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';
import { initActivitiesView, refreshAktiviteter, aktiviteterHentet } from './activities.js';
import { initTimerView, refreshQuickStart } from './timer.js';
import { initHistorikView, refreshHistorik } from './historik.js';
import { initKalenderView, refreshKalender } from './kalender.js';
import { initRapporterView, refreshRapporter } from './rapporter.js';
import { initRettet } from './rettet.js';
import { fangTab } from './ark.js';
import { initBackup } from './backup.js';
import { initIndstillingerView, refreshIndstillinger, getSettings } from './indstillinger.js';

// ─── Firebase init ────────────────────────────────────────
const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db   = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache()
});
const provider = new GoogleAuthProvider();

// ─── Farvepalette til aktiviteter ─────────────────────────
// Sidens egen palet (pink, blå, lime, gul, lilla, koral, turkis) plus tre
// mørkere toner, så ti aktiviteter stadig kan skelnes fra hinanden.
export const COLOR_PALETTE = [
  '#E8336D', '#0E86C8', '#5FB030', '#FFB300', '#7A4FD6',
  '#FF6A3D', '#0FA593', '#1D4E89', '#B3218B', '#7A8B1E'
];

// ─── DOM-referencer ──────────────────────────────────────
const $ = id => document.getElementById(id);

const loadingScreen    = $('loading-screen');
const loginScreen      = $('login-screen');
const onboardingScreen = $('onboarding');
const appEl            = $('app');
const btnGoogleLogin   = $('btn-google-login');
const btnLogout        = $('btn-logout');
const btnOnbActs       = $('btn-onboarding-activities');
const btnOnbSkip       = $('btn-onboarding-skip');
const navBtns          = document.querySelectorAll('.nav-btn');
const views            = document.querySelectorAll('.view');

// ─── Login ───────────────────────────────────────────────
btnGoogleLogin.addEventListener('click', async () => {
  btnGoogleLogin.disabled = true;
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      showToast('Kunne ikke logge ind — prøv igen');
    }
    btnGoogleLogin.disabled = false;
  }
});

btnLogout.addEventListener('click', async () => {
  if (confirm('Log ud af Tidsregistrering?')) {
    await signOut(auth);
  }
});

// ─── Auth state ──────────────────────────────────────────
// Opstarten venter kun på ét opslag: indstillingerne. De skal være der,
// før de øvrige views tegnes, fordi de bruger getCurrentSchoolYear(). Alt
// andet — aktiviteter, timer, historik — kommer ind gennem lyttere, der
// fylder skærmen ud, efterhånden som svarene lander. Ventede vi på dem alle,
// stod brugeren og så på "loader", mens appen hentede ting, ingen kigger på
// endnu.
onAuthStateChanged(auth, async user => {
  if (user) {
    loginScreen.classList.add('hidden');
    appEl.classList.remove('hidden');
    try {
      initBackup(user.uid);
      await initIndstillingerView(user.uid);
      updateTopYear();
      initActivitiesView(user.uid);
      initTimerView(user.uid);
      initRettet(user.uid);
      initHistorikView(user.uid);
      initKalenderView(user.uid);
      initRapporterView(user.uid);
    } catch (err) {
      console.error('Init fejl:', err);
    }
    navigateTo('hjem');
    loadingScreen.classList.add('hidden');
    visOnboardingHvisTom();
  } else {
    initBackup(null);
    loadingScreen.classList.add('hidden');
    appEl.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    btnGoogleLogin.disabled = false;
  }
});


// ─── First-run: vis onboarding hvis ingen aktiviteter ─────
// Svaret kommer fra aktivitetslytteren, der alligevel kører — appen skal ikke
// vente på et ekstra opslag, der stiller det samme spørgsmål. Onboarding er
// en fuldskærms-overlay, så den lægger sig oven på Hjem, når den kommer.
function visOnboardingHvisTom() {
  aktiviteterHentet().then(harAktiviteter => {
    if (harAktiviteter) return;
    onboardingScreen.classList.remove('hidden');
    // Som et ark: appen bagved kan ikke nås, og fokus står i vinduet
    appEl.inert = true;
    btnOnbActs.focus();
  });
}

function skjulOnboarding() {
  onboardingScreen.classList.add('hidden');
  appEl.inert = false;
}

onboardingScreen.addEventListener('keydown', e => {
  if (e.key === 'Escape') btnOnbSkip.click();
  if (e.key === 'Tab') fangTab(e, onboardingScreen);
});

btnOnbActs.addEventListener('click', () => {
  skjulOnboarding();
  navigateTo('aktiviteter');
  refreshAktiviteter();
});

btnOnbSkip.addEventListener('click', () => {
  skjulOnboarding();
  navigateTo('hjem');
});

// ─── Skoleår-hjælpere ────────────────────────────────────
export function getCurrentSchoolYear() {
  const s = getSettings();
  if (/^\d{4}\/\d{2}$/.test(s.currentSchoolYear ?? '')) return s.currentSchoolYear;
  const startMonth = s.schoolYearStartMonth ?? 6;
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return m >= startMonth
    ? `${y}/${String(y + 1).slice(2)}`
    : `${y - 1}/${String(y).slice(2)}`;
}

// Skoleåret står i topbjælken, så man altid kan se, hvad man registrerer i
export function updateTopYear() {
  const el = $('top-year');
  if (el) el.textContent = getCurrentSchoolYear();
}

// ─── Navigation ──────────────────────────────────────────
export function navigateTo(viewName) {
  views.forEach(v => v.classList.add('hidden'));
  navBtns.forEach(b => b.classList.remove('active'));

  const view = $(`view-${viewName}`);
  const btn  = document.querySelector(`.nav-btn[data-view="${viewName}"]`);

  if (view) view.classList.remove('hidden');
  if (btn)  btn.classList.add('active');
  // Hjem har sit eget timerkort; banneret er til de andre faner
  appEl.dataset.view = viewName;

  $('main-content').scrollTop = 0;
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navigateTo(btn.dataset.view);
    if (btn.dataset.view === 'hjem')     refreshQuickStart();
    if (btn.dataset.view === 'historik') { refreshHistorik(); refreshKalender(); }
    if (btn.dataset.view === 'aktiviteter')    refreshAktiviteter();
    if (btn.dataset.view === 'rapporter')      refreshRapporter();
    if (btn.dataset.view === 'indstillinger')  refreshIndstillinger();
  });
});

// ─── Toast ───────────────────────────────────────────────
export function showToast(message, duration = 2800) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('visible'), duration);
}

// ─── Service Worker ──────────────────────────────────────
if ('serviceWorker' in navigator) {
  // Havde siden allerede en service worker, da den blev åbnet? Så er et
  // skift af styring en ny udgave af appen — og siden hentes igen én gang,
  // så markup, stilark og moduler kommer fra samme udgave. Uden det ville
  // en netop udrullet ændring først slå igennem ved næste besøg.
  const havdeStyring = !!navigator.serviceWorker.controller;
  let genindlaeser = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!havdeStyring || genindlaeser) return;
    genindlaeser = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(r  => console.log('SW registreret:', r.scope))
      .catch(e => console.warn('SW fejl:', e));
  });
}
