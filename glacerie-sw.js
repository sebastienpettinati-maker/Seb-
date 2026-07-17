/* Service worker du calculateur de glacerie — cache hors-ligne.
   Stratégie : réseau d'abord pour la page (pour recevoir les mises à jour),
   cache en secours (fonctionnement 100 % hors-ligne une fois visitée). */
const CACHE = 'glacerie-v10';
const FICHIERS = ['./glacerie.html', './glacerie.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copie = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copie));
        return res;
      })
      .catch(() =>
        caches.match(e.request, { ignoreSearch: true })
          .then(r => r || caches.match('./glacerie.html'))
      )
  );
});
