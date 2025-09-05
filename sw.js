// sw.js
const CACHE_VER = 'v6';
const CACHE_NAME = `kms-${CACHE_VER}`;
const ASSETS = [
  './',
  './index.html',
  './app.html',
  './auth.html',
  './backend.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 安裝：預快取核心資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 啟用：清理舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    ).then(() => self.clients.claim())
  );
});

// 取用：HTML 用網路優先，其餘採用 stale-while-revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 對於導覽（HTML）頁，優先取網路（離線再落回快取）
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, copy));
        return res;
      }).catch(() => caches.match(request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // 其他 GET：stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetching = fetch(request).then((res) => {
        // 只快取同源成功回應
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy));
        }
        return res;
      }).catch(() => cached); // 斷網時回退舊快取
      return cached || fetching;
    })
  );
});
