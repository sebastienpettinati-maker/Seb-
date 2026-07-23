/* Service worker de l'application Stock & Production — cache hors-ligne.
   Stratégie : réseau d'abord pour la page (pour recevoir les mises à jour),
   cache en secours (fonctionnement 100 % hors-ligne une fois visitée). */
const CACHE = 'stock-v1';
const FICHIERS = ['./stock.html', './stock.webmanifest', './stock-192.png', './stock-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith('stock-')).map(k => caches.delete(k))))
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
          .then(r => r || caches.match('./stock.html'))
      )
  );
});
