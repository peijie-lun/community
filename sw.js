// sw.js (robust)
const CACHE_VER = 'v11';
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
      keys.filter(k => k.startsWith('kms-') && k !== CACHE_NAME)
          .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// 在 fetch 事件中，加上導覽請求 (navigate) 的處理
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 導覽（HTML）→ 網路優先、離線退回快取，避免舊頁反覆載入
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return r;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // 其他資源維持「快取先、背景更新」或你的原策略
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetching = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          caches.open(CACHE_NAME).then((c) => c.put(req, res.clone()));
        }
        return res;
      }).catch(() => cached);
      return cached || fetching;
    })
  );



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
