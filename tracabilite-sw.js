/* Service worker de l'application de traçabilité — cache hors-ligne.
   Stratégie : réseau d'abord pour la page (pour recevoir les mises à jour),
   cache en secours (fonctionnement 100 % hors-ligne une fois visitée). */
const CACHE = 'tracabilite-v1';
const FICHIERS = ['./tracabilite.html', './tracabilite.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith('tracabilite-')).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copie = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copie));
        return res;
      })
      .catch(() =>
        caches.match(e.request, { ignoreSearch: true })
          .then(r => r || caches.match('./tracabilite.html'))
      )
  );
});
