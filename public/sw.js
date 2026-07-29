// Ola service worker — hand-written (no Workbox) so behavior is easy to
// audit: precache the app shell + offline page, then three runtime
// strategies depending on what's being requested. Bump CACHE_VERSION on any
// change to this file's caching logic so old caches get cleaned up.
const CACHE_VERSION = 'ola-pwa-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = '/offline';

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/icon-any-192.png',
  '/icons/icon-any-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('ola-pwa-') && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// API calls, auth, non-GET requests, and cross-origin requests (Firebase,
// socket.io, Google Maps/AI, Unsplash, …) always go straight to the network —
// carts, orders, messages and live data must never be served stale.
function shouldBypass(url, request) {
  if (request.method !== 'GET') return true;
  if (url.pathname.startsWith('/api/')) return true;
  if (url.origin !== self.location.origin) return true;
  return false;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (shouldBypass(url, request)) return;

  // Next.js build assets are content-hashed and immutable per deploy —
  // cache-first is safe and fast.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Page navigations: prefer a fresh network response so content is never
  // stale while online; fall back to the last cached copy of that exact
  // page, then to the offline page, when the network is unreachable.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache genuine successes — an error page (e.g. a 500) must
          // never get served back as if it were a good cached page.
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(RUNTIME_CACHE);
          const cached = await cache.match(request);
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Everything else same-origin (fonts, css, images) — stale-while-revalidate.
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
