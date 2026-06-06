const CACHE = 'petthermo-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './assets/hero-dog.jpeg',
  './assets/vision-dog.jpeg',
  './assets/product-cube.jpeg',
  './assets/old-camera.jpeg',
  './assets/old-coolmat.jpeg',
  './assets/old-heatpad.jpeg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request)
      .then(r => r || fetch(e.request))
      .catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())
  );
});
