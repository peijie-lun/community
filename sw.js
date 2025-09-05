// sw.js
const CACHE_VER = 'v13';
const CACHE_NAME = `kms-${CACHE_VER}`;
const CORE_ASSETS = [
  './',
  './index.html',
  './app.html',
  './auth.html',
  './backend.html',
  './index.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const url of CORE_ASSETS) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res && res.ok) await cache.put(url, res.clone());
      } catch (_) {}
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith('kms-') && k !== CACHE_NAME)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 導覽請求：線上優先，離線退回 cache 或 index.html
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const net = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, net.clone());
        return net;
      } catch {
        return (await caches.match(req)) || (await caches.match('./index.html'));
      }
    })());
    return;
  }

  // 其他資源：cache-first，背景更新
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const fetching = fetch(req).then(res => {
      if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
        caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
      }
      return res;
    }).catch(() => cached);
    return cached || fetching;
  })());
});
