/** Ejecuta `fn` cuando el navegador esté desocupado (precargas que no deben competir con la animación). */
export function whenIdle(fn: () => void, timeout = 2000): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, 1200);
  return () => window.clearTimeout(id);
}
