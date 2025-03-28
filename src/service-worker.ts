/// <reference lib="webworker" />
/// <reference lib="es2020" />

// Replace the existing declaration with:
// This explicitly tells TypeScript we're in a service worker context
const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = 'v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets you want to cache
];

sw.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(URLS_TO_CACHE);
      await sw.skipWaiting(); // Activate worker immediately
    })()
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheKeys = await caches.keys();
      const deletions = cacheKeys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key));
      await Promise.all(deletions);
      await sw.clients.claim(); // Take control of all clients
    })()
  );
});

sw.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      try {
        // Try the network first
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
          return response;
        }
      } catch (error) {
        // Network failed, try the cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
      }
      // If both network and cache fail, return a fallback response
      return new Response('Offline content not available', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    })()
  );
}); 