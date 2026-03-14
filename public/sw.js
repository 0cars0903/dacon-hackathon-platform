// Self-destructing service worker: clears all caches and unregisters itself.
// This replaces the old caching SW that was causing stale JS chunks after deploys.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => self.registration.unregister())
  );
  self.clients.claim();
});
