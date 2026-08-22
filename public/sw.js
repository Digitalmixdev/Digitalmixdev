const CACHE_NAME = 'digitalmix-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/globals.css',
  '/favicon.ico',
  '/tools/base64',
  '/tools/csv-json',
  '/tools/hash-generator',
  '/tools/json-formatter',
  '/tools/kpi-calculator',
  '/tools/pdf-merge',
  '/tools/regex-tester',
  '/tools/sql-formatter',
  '/tools/uuid-generator',
  '/tools/jwt',
  '/tools/image-resizer',
  '/tools/qr-code-generator',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((error) => {
        console.log('[Service Worker] Cache addAll error:', error);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API and analytics requests
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('analytics') ||
    event.request.url.includes('clarity') ||
    event.request.url.includes('google-analytics')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return null;
        });
    })
  );
});
