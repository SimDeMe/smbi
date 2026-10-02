const CACHE = 'tid-v35';
const SHELL = [
  '/tid/',
  '/tid/index.html',
  '/tid/hjaelp.html',
  '/tid/installer.html',
  '/tid/styles.css',
  '/tid/app.js',
  '/tid/activities.js',
  '/tid/timer.js',
  '/tid/historik.js',
  '/tid/kalender.js',
  '/tid/kalender-akse.js',
  '/tid/kalender-oversigt.js',
  '/tid/periode.js',
  '/tid/rapporter.js',
  '/tid/indstillinger.js',
  '/tid/skema.js',
  '/tid/pauser.js',
  '/tid/normer.js',
  '/tid/akkord.js',
  '/tid/rettet.js',
  '/tid/format.js',
  '/tid/ark.js',
  '/tid/ferie.js',
  '/tid/firebase-config.js',
  '/tid/manifest.json',
  '/tid/icons/icon.svg',
  '/tid/icons/icon-180.png',
  '/tid/icons/icon-192.png',
  '/tid/icons/icon-512.png',
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
      // Kun appens egne, gamle caches — smbi.dk har flere apps på samme
      // domæne, og de deler cachelager
      Promise.all(keys.filter(k => k.startsWith('tid-') && k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Don't intercept Firebase / Google CDN requests
  if (url.origin !== self.location.origin) return;

  e.respondWith(fraCachen(e));
});

// Cachen først — for alt, også selve siden.
//
// Det er dét "også siden", der er pointen. Før hentede vi siden fra
// netværket og resten fra cachen, og så kunne en ny index.html møde en gammel
// styles.css og en gammel kalender.js: knapper uden lyttere og elementer uden
// stil. Så hentede vi alt fra netværket, og det var rigtigt, men langsomt —
// hver opstart kostede en netværkstur pr. fil.
//
// Nu ligger hele appen i én cache med ét versionsnavn, og alt serveres
// derfra. Det, brugeren får, stammer derfor altid fra samme udgave, og en
// opstart med varm cache koster ingen netværkstur overhovedet. Nye udgaver
// kommer ind ad en anden vej: browseren henter service-worker.js igen, den
// nye version fylder sin egen cache under install, overtager styringen — og
// app.js henter så siden igen én gang (se controllerchange dér).
async function fraCachen(e) {
  const erSide = e.request.mode === 'navigate';

  // Sider slås op uden forespørgselsstreng, så ?projektor=1 og #trin=3 rammer
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
      const start = await caches.match('/tid/index.html');
      if (start) return start;
    }
    throw err;
  }
}
