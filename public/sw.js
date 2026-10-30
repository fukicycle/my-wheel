// 計算エンジン（public/dotnet/<ハッシュ>/）だけをキャッシュする Service Worker。
// エンジンのディレクトリ名は中身のハッシュなので、同じ URL の中身は変わらない（cache-first で安全）。
// アプリ本体（HTML・JS・CSS）には触れず、これまでどおりネットワークから読む。
const CACHE = 'my-wheel-engine';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const isEngine = (url) => /\/dotnet\/[0-9a-f]+\//.test(new URL(url).pathname);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !isEngine(request.url)) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(request.url);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok) await cache.put(request.url, response.clone());
      return response;
    }),
  );
});

// 初回はページが Service Worker の管理下にないので、読み込み後にページから URL 一覧を受け取って保存する。
// あわせて、今のエンジン以外（古いビルド）のファイルを消す。
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'engine-loaded') return;
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      const current = new URL(data.base, self.location.href).pathname;
      for (const request of await cache.keys()) {
        if (!new URL(request.url).pathname.startsWith(current)) await cache.delete(request);
      }
      for (const url of data.urls) {
        if (!(await cache.match(url))) {
          const response = await fetch(url);
          if (response.ok) await cache.put(url, response);
        }
      }
    }),
  );
});
