const CACHE_NAME = 'mambululoom-v1';
const BASE_URL = '/madrasa-app/';

const STATIC_FILES = [
  BASE_URL,
  BASE_URL + 'index.html',
  BASE_URL + 'manifest.json',
];

// Install - cache static files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_FILES).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', e => {
  // Skip Firebase requests - always network
  if (e.request.url.includes('firebase') ||
      e.request.url.includes('firebaseio') ||
      e.request.url.includes('googleapis') ||
      e.request.url.includes('gstatic')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          return caches.match(BASE_URL + 'index.html');
        });
      })
  );
});
