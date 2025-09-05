// sw.js (robust)
const CACHE_VER = 'v9';
const CACHE_NAME = `kms-${CACHE_VER}`;
const CORE_ASSETS = [
  './',
  './index.html',
  './app.html',
  './auth.html',
  './backend.html',
  './index.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const url of CORE_ASSETS) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res && res.ok) await cache.put(url, res.clone());
      } catch (e) {
        // 忽略缺檔，避免整體安裝失敗
      }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k.startsWith('kms-') && k !== CACHE_NAME)
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 只處理同網域 GET
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // HTML：network-first，離線回退快取
  if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || caches.match('./index.html');
      }
    })());
    return;
  }

  // 其他：cache-first，背景更新
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const fetching = fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') {
        caches.open(CACHE_NAME).then((c) => c.put(req, res.clone()));
      }
      return res;
    }).catch(() => cached);
    return cached || fetching;
  })());
});
