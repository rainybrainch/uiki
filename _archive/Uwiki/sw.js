// Uwiki Service Worker — simple offline-first cache for the static shell.
//
// Strategy:
//   - On install: pre-cache the three HTML pages + CSS + JSX + config + manifest
//   - On fetch: cache-first for same-origin static assets, network-first for everything else
//
// To bump cache (e.g. after a deploy), change CACHE_VERSION.

const CACHE_VERSION = "uwiki-v1";
const CORE = [
  "/",
  "/index.html",
  "/Gravity.html",
  "/Attraction.html",
  "/manifest.json",
  "/config.js",
  "/claude-shared.css",
  "/auth.css",
  "/lobby.css",
  "/gravity.css",
  "/attraction.css",
  "/claude-shared.jsx",
  "/auth.jsx",
  "/lobby.jsx",
  "/gravity.jsx",
  "/attraction.jsx",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only cache same-origin GETs; bypass everything else (Claude API, Supabase, CDNs).
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      // Stale-while-revalidate: serve cached if available, else wait for network.
      return cached || fetchPromise;
    })
  );
});
