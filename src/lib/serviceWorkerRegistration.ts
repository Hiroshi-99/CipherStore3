import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Register the service worker
    const updateSW = registerSW({
      onNeedRefresh() {
        // Handle SW updates
        if (confirm('New content available. Reload?')) {
          updateSW(true);
        }
      },
    });
    
    // Set up background sync when supported
    if ('SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        // Register background sync
        document.addEventListener('offline-request', (e) => {
          const customEvent = e as CustomEvent;
          registration.sync.register('sync-requests');
          // Store request in IndexedDB for later
          storeOfflineRequest(customEvent.detail);
        });
      });
    }
  }
}

// Helper to store offline requests
async function storeOfflineRequest(requestData) {
  const db = await openDatabase();
  const tx = db.transaction('offline-requests', 'readwrite');
  const store = tx.objectStore('offline-requests');
  await store.add({
    ...requestData,
    timestamp: Date.now()
  });
}

// Helper to open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('offline-store', 1);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('offline-requests')) {
        db.createObjectStore('offline-requests', { 
          keyPath: 'id',
          autoIncrement: true 
        });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
} 