import { useSyncExternalStore } from 'react';
import { readHorizon } from '../lib/horizon.ts';

export type Viewport = { width: number; height: number; horizon: number };

let snapshot: Viewport | null = null;

const read = (): Viewport => ({ width: window.innerWidth, height: window.innerHeight, horizon: readHorizon() });

function subscribe(onChange: () => void) {
  const handler = () => {
    snapshot = read();
    onChange();
  };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}

/** Tamaño de la pantalla y posición del horizonte (se actualiza al girar el móvil). */
export function useViewport(): Viewport {
  return useSyncExternalStore(
    subscribe,
    () => (snapshot ??= read()),
    () => ({ width: 390, height: 844, horizon: 0.44 }),
  );
}
