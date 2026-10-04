/*
 * Service worker de la botella: prudente y sin precarga (no descarga nada que ella no abra).
 *
 * - La página (HTML): primero la red, siempre; la copia guardada solo si no hay conexión.
 *   Así cada cambio publicado se ve en cuanto ella vuelve a abrir el enlace.
 * - Archivos con huella (/assets/…): se guardan al usarlos y luego salen de la caché al instante.
 *   Su nombre cambia con cada versión, así que nunca quedan viejos.
 * - Lo demás (fotos de lugares, iconos): de la caché al instante y se refresca por detrás.
 *
 * La caché es solo un extra: si falla (disco lleno, modo privado…), todo va por la red como
 * si no existiera. Para retirarlo: `serviceWorker: false` en config.ts (ver README).
 */
const VERSION = 1;
const PAGES = `botella-paginas-v${VERSION}`;
const FILES = `botella-archivos-v${VERSION}`;
const MAX_FILES = 80;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        for (const key of await caches.keys()) {
          if (key.startsWith('botella-') && key !== PAGES && key !== FILES) await caches.delete(key);
        }
      } catch {
        // sin caché: no hay nada que limpiar
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;

  if (request.mode === 'navigate') event.respondWith(networkFirst(event, url));
  else if (url.pathname.includes('/assets/')) event.respondWith(cacheFirst(event));
  else event.respondWith(staleWhileRevalidate(event));
});

/** Todas las direcciones (?paso=…, ?hora=…) son la misma página: se guarda una sola copia. */
async function networkFirst(event, url) {
  const key = url.origin + url.pathname;
  try {
    const response = await fetch(event.request);
    if (response.ok) event.waitUntil(save(PAGES, key, response.clone()));
    return response;
  } catch (error) {
    const cached = await lookup(PAGES, key);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(event) {
  const cached = await lookup(FILES, event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  if (response.ok) event.waitUntil(save(FILES, event.request, response.clone()));
  return response;
}

async function staleWhileRevalidate(event) {
  const cached = await lookup(FILES, event.request);
  const network = fetch(event.request).then((response) => {
    if (response.ok) event.waitUntil(save(FILES, event.request, response.clone()));
    return response;
  });
  if (!cached) return network;
  event.waitUntil(network.catch(() => undefined));
  return cached;
}

async function lookup(name, key) {
  try {
    return await (await caches.open(name)).match(key);
  } catch {
    return undefined;
  }
}

/** Guarda una copia; tras varias versiones publicadas, los archivos más antiguos se van. */
async function save(name, key, response) {
  try {
    const cache = await caches.open(name);
    await cache.put(key, response);
    const keys = await cache.keys();
    for (const old of keys.slice(0, Math.max(0, keys.length - MAX_FILES))) await cache.delete(old);
  } catch {
    // sin caché: la próxima vez irá por la red
  }
}
