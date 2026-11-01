// Service worker dell'app installata (Microsoft Store / "Installa app"). Per chi visita il sito è un passacarte:
// la cache si riempie solo quando l'app installata lo chiede, così i visitori non scaricano 25 MB.
const CACHE = 'documaster-__BUILD__';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('documaster-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data !== 'precache') return;
  event.waitUntil((async () => {
    const list = await (await fetch('/sw-assets.json', { cache: 'no-store' })).json();
    const cache = await caches.open(CACHE);
    for (const url of list) {
      if (!(await cache.match(url))) await cache.add(new Request(url, { cache: 'reload' })).catch(() => {});
    }
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  if (request.mode === 'navigate') {
    // Sempre dalla rete; senza connessione l'app installata riparte dalla copia salvata
    event.respondWith(fetch(request).catch(async () => (await caches.match('/app/')) || Response.error()));
    return;
  }
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
});
