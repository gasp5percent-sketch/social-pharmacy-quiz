// Cache cleanup service worker. This version intentionally does not cache app files.
const CACHE_NAME = 'social-pharmacy-radar-set-filter-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
