const SHELL_CACHE_NAME = 'sjkc-fun-learning-shell-v2';
const DATA_CACHE_NAME = 'sjkc-fun-learning-data-v1';
const VOCAB_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQKcYywd1f4YQ0f3AJShcNVr5aIYBClHUkFF5a9tBoNS7n4CK4zvtzZboyHvFS87Tt0dXMII7xPqTVL/pub?output=csv';

const urlsToCache = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'data-service.js',
  'storage-service.js',
  'manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME)
      .then(cache => {
        console.log('Opened shell cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== SHELL_CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.startsWith(VOCAB_URL)) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        });
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
    );
  }
});
