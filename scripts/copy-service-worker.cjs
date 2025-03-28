const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// In CommonJS, __filename and __dirname are already available globally
// No need to use fileURLToPath or import.meta.url

// Create a proper JavaScript service worker instead of copying the TypeScript file
const serviceWorkerJs = `
// Service worker generated at build time
const CACHE_NAME = 'v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets you want to cache
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(URLS_TO_CACHE);
      await self.skipWaiting(); // Activate worker immediately
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheKeys = await caches.keys();
      const deletions = cacheKeys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key));
      await Promise.all(deletions);
      await self.clients.claim(); // Take control of all clients
    })()
  );
});

self.addEventListener('fetch', (event) => {
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
`;

// Write the JavaScript service worker to dist
const destFile = path.resolve(__dirname, '../dist/service-worker.js');

// Create the dist directory if it doesn't exist
const distDir = path.resolve(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.writeFileSync(destFile, serviceWorkerJs);
console.log('✓ Service worker created at dist/service-worker.js');

// Create a proper manifest.json
const manifestJson = {
  "name": "Cipher Store",
  "short_name": "Cipher",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111827",
  "theme_color": "#111827",
  "icons": [
    {
      "src": "/vite.svg",
      "sizes": "192x192",
      "type": "image/svg+xml"
    }
  ]
};

const manifestFile = path.resolve(__dirname, '../dist/manifest.json');
fs.writeFileSync(manifestFile, JSON.stringify(manifestJson, null, 2));
console.log('✓ Web app manifest created at dist/manifest.json'); 