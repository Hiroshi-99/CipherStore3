async function cacheResponse(request, response) {
  // Only cache GET requests
  if (request.method !== 'GET') {
    return response;
  }

  const cache = await caches.open('v1');
  cache.put(request, response.clone());
  return response;
}

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('offline-store', 1);
    request.onerror = reject;
    request.onsuccess = () => resolve(request.result);
  });
}

// Process the offline request queue
async function processOfflineRequests() {
  const db = await openDB();
  const tx = db.transaction('offline-requests', 'readwrite');
  const store = tx.objectStore('offline-requests');
  const requests = await store.getAll();
  
  for (const request of requests) {
    try {
      await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
      
      // If successful, remove from queue
      await store.delete(request.id);
    } catch (error) {
      console.log('Still offline, will retry later', error);
      break; // Stop trying if still offline
    }
  }
}

// Listen for sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-requests') {
    event.waitUntil(processOfflineRequests());
  }
});

// Modify your fetch event handler
self.addEventListener('fetch', (event) => {
  const requestClone = event.request.clone();
  const url = new URL(event.request.url);
  
  // Handle GET requests with caching
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open('v1').then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } 
  // For POST/PATCH requests, just pass through without caching
  else if (['POST', 'PATCH'].includes(event.request.method)) {
    event.respondWith(
      fetch(requestClone)
        .catch(error => {
          console.log('Network error for', event.request.url, error);
          // Handle offline POST/PATCH (if needed)
          // Return a custom response or fallback
          return new Response(JSON.stringify({ 
            error: 'Network error, request queued for later' 
          }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          });
        })
    );
  } else {
    // Just pass through non-GET requests
    // No caching attempted
  }
}); 