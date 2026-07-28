const CACHE_NAME = 'zolto-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'sw.js',
  'src/zolto.js',
  'src/ast.js',
  'src/diagnostics.js',
  'src/directive-lexer.js',
  'src/directive-renderer.js',
  'src/directives.js',
  'src/inline-parser.js',
  'src/lexer.js',
  'src/parser.js',
  'src/renderer.js',
  'src/tokenizer.js',
  'src/validator.js',
  'tests/tests.js',
  'assets/icons/logo/zolto-icon.svg',
  'css/core/variables.css',
  'css/core/reset.css',
  'css/layout/app.css',
  'css/components/buttons.css',
  'css/components/modals.css',
  'css/components/prose.css'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch((err) => {
      console.log('[Service Worker] Cache addAll error:', err);
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
            console.log('[Service Worker] Deleting old cache:', cacheName);
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
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    }).catch(() => {
      // Offline fallback for navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match('index.html');
      }
    })
  );
});
