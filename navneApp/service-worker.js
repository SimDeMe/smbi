// Hele appen ligger i én cache med ét versionsnavn, og alt serveres derfra.
// Det, brugeren får, stammer derfor altid fra samme udgave. Nye udgaver kommer
// ind ad en anden vej: browseren henter service-worker.js igen, den nye version
// fylder sin egen cache under install, overtager styringen — og app.js henter
// så siden igen én gang (se controllerchange dér).
//
// BEMÆRK: versionsnavnet skal tælles op, hver gang en fil i SHELL ændres —
// sammen med UDGAVE i js/app.js, som viser nummeret i topbjælken. Ellers
// bliver telefonen siddende med den udgave, den allerede har; sådan blev en
// rettelse af quizzen hængende i flere uger.
const CACHE = 'navne-app-v8';
const SHELL = [
  '/navneApp/',
  '/navneApp/index.html',
  '/navneApp/css/style.css',
  '/forside.css',
  '/navneApp/js/app.js',
  '/navneApp/js/auth.js',
  '/navneApp/js/classes.js',
  '/navneApp/js/confusion.js',
  '/navneApp/js/firebase-config.js',
  '/navneApp/js/import.js',
  '/navneApp/js/navne.js',
  '/navneApp/js/photos.js',
  '/navneApp/js/quiz.js',
  '/navneApp/js/srs.js',
  '/navneApp/js/students.js',
  '/navneApp/js/ui.js',
  '/navneApp/manifest.json',
  '/navneApp/icons/icon-192.png',
  '/navneApp/icons/icon-512.png',
  '/navneApp/icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  // cache:'reload' henter uden om browserens egen HTTP-cache. Uden den kan en
  // ny udgave af appen blive fyldt med gamle filer, browseren stadig havde
  // liggende — og så var vi tilbage ved ny markup og gammel kode.
  e.waitUntil(caches.open(CACHE).then(c =>
    c.addAll(SHELL.map(sti => new Request(sti, { cache: 'reload' })))
  ));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Firebase, Google Fonts og resten af nettet passerer urørt
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(fraCachen(e));
});

async function fraCachen(e) {
  const erSide = e.request.mode === 'navigate';

  // Sider slås op uden forespørgselsstreng, så #/classes/… og ?noget=1 rammer
  // den samme cachede side
  const cachet = await caches.match(e.request, { ignoreSearch: erSide });
  if (cachet) return cachet;

  // Ikke i shellen — fx en fil, der er kommet til siden sidst. Hent den, og
  // gem den, så den også er der næste gang
  try {
    const res = await fetch(e.request);
    if (res.ok) {
      const kopi = res.clone();
      e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, kopi)));
    }
    return res;
  } catch (err) {
    if (erSide) {
      const start = await caches.match('/navneApp/index.html');
      if (start) return start;
    }
    throw err;
  }
}
