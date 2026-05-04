self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('kgc-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/bn',
        '/en',
        '/bn/explore',
        '/en/explore',
        '/bn/route',
        '/en/route',
        '/bn/saved',
        '/en/saved',
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((fetchResponse) => {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        const responseToCache = fetchResponse.clone();
        caches.open('kgc-v1').then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return fetchResponse;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== 'kgc-v1')
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});
