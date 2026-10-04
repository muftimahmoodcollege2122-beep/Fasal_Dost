// Fasal Dost service worker — keeps the installed web app / Play Store (TWA) wrapper on the latest deploy.
// __BUILD_ID__ is stamped at build time (see vite.config.ts), so every deploy yields a new worker.
const BUILD_ID = '__BUILD_ID__';
const SHELL_CACHE = `fd-shell-${BUILD_ID}`;
const ASSET_CACHE = 'fd-assets-v1';

self.addEventListener('install', (event) => {
  // New worker waits until the user taps "Update" (UpdateToast posts SKIP_WAITING).
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.add('/')).catch(() => {}));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('fd-shell-') && k !== SHELL_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never cache API, uploads, version probe or the worker itself.
  if (/^\/(api|uploads|manifest|version\.json|sw\.js)/.test(url.pathname)) return;

  // Page navigations: network first (so a fresh deploy shows immediately), cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(SHELL_CACHE).then((c) => c.put('/', copy));
        return res;
      }).catch(() => caches.match('/').then((r) => r || Response.error()))
    );
    return;
  }

  // Hashed build assets: cache first (filenames change on every build).
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) =>
        cache.match(req).then((hit) => hit || fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        }))
      )
    );
  }
});
