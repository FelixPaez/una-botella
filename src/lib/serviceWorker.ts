import { whenIdle } from './idle.ts';

/**
 * Registra el service worker (public/sw.js) cuando la página ya cargó y el navegador
 * está desocupado, para no competir con la primera visita. Con `enabled = false`
 * lo desinstala y borra sus copias.
 */
export function setupServiceWorker(enabled: boolean) {
  if (!('serviceWorker' in navigator)) return;
  const base = import.meta.env.BASE_URL;

  const run = async () => {
    try {
      if (enabled) {
        await navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
        return;
      }
      for (const registration of await navigator.serviceWorker.getRegistrations()) await registration.unregister();
      for (const key of await caches.keys()) if (key.startsWith('botella-')) await caches.delete(key);
    } catch {
      // sin service worker la web funciona igual
    }
  };

  const start = () => whenIdle(() => void run(), 4000);
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
