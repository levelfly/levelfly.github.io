/* Wish 換胎指南 — 離線快取。輪胎行常常在地下室或鐵皮屋，訊號很差。
   只接管這份報告自己的資源，同站其他頁面一律放行不快取。 */
const CACHE = 'wish-tire-v4';
const PAGE = '/wish-tire-guide.html';
const ASSETS = [
  PAGE,
  '/wish-tire-guide/hero_900.jpg', '/wish-tire-guide/sidewall_900.jpg',
  '/wish-tire-guide/four_900.jpg', '/wish-tire-guide/load_900.jpg',
  '/wish-tire-guide/dot_900.jpg', '/wish-tire-guide/aging_900.jpg',
  '/wish-tire-guide/avoid_900.jpg', '/wish-tire-guide/wet_900.jpg',
  '/wish-tire-guide/steps_900.jpg', '/wish-tire-guide/placard_900.jpg',
  '/wish-tire-guide/shop_900.jpg', '/wish-tire-guide/cost_900.jpg',
  '/wish-tire-guide/rear_900.jpg', '/wish-tire-guide/twi_900.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith('wish-tire-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const mine = url.origin === location.origin &&
    (url.pathname === PAGE || url.pathname.startsWith('/wish-tire-guide/'));
  if (e.request.method !== 'GET' || !mine) return;   // 同站其他頁面不碰

  if (url.pathname === PAGE) {
    // HTML 走網路優先：有訊號永遠拿到最新版，沒訊號才吃快取
    e.respondWith(
      fetch(e.request)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(PAGE, copy)); return res; })
        .catch(() => caches.match(PAGE))
    );
    return;
  }
  // 圖片走快取優先：圖不會改，抓過就別再花流量。
  // 離線時若要的尺寸沒快取（不同螢幕會挑不同檔位），退回同一張圖的 900px 版。
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => {
        const base = url.pathname.replace(/(_\d+)?\.jpg$/, '_900.jpg');
        return caches.match(base);
      })
    )
  );
});
