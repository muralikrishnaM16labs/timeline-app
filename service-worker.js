/*
 * Offline cache for the app shell.
 *
 * The original worker did `event.respondWith(fetch(event.request))` — no cache,
 * no fallback. That was strictly worse than having no worker at all: it
 * intercepted every request and hard-failed it whenever the network hiccuped,
 * on an app that has to be dependable during a live performance.
 *
 * This one precaches everything the app needs and serves from cache first, so
 * it opens instantly and keeps working with no signal at all. A worker is also
 * part of what Chrome looks for before it will genuinely install a PWA, which
 * is what gets display:fullscreen honoured on Android.
 *
 * Bump CACHE whenever the ?v= query strings in index.html change, or stale
 * assets will be served from the old cache.
 */
const CACHE = 'clock-v43';

const ASSETS = [
  './',
  './index.html',
  './style.css?v=43',
  './script.js?v=43',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll rejects the whole batch if any single item 404s, which would
      // leave no cache at all. Failing individually is far safer.
      .then((cache) => Promise.all(
        ASSETS.map((url) => cache.add(url).catch(() => null))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;

      return fetch(req)
        .then((res) => {
          if (res && res.ok && new URL(req.url).origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => {
          // Offline and nothing cached. A page load still gets the shell back,
          // rather than the browser's error page mid-performance.
          if (req.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        });
    })
  );
});
