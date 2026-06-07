const CACHE = 'petthermo-v7';
const ASSETS = [
  './',
  './index.html',
  './app.html',
  './i18n.js',
  './gate.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './assets/hero-dog.jpeg',
  './assets/pet-xionger.jpg',
  './assets/vision-dog.jpeg',
  './assets/device.jpg',
  './assets/logo-nav.png',
  './assets/logo-white.png',
  './assets/product-spec.jpg'
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
  const req = e.request;
  if (req.method !== 'GET') return;
  // 页面导航：网络优先，联网时永远拿最新 HTML；离线时回退缓存
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req)
          .then(r => r || caches.match('./index.html'))
          .then(r => r || caches.match('./')))
    );
    return;
  }
  // 静态资源：缓存优先，未命中再联网并写入缓存
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => Response.error()))
  );
});
