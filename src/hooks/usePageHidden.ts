import { useSyncExternalStore } from 'react';

/** true mientras la pestaña está en segundo plano (para pausar el mar y ahorrar batería). */
export function usePageHidden(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      document.addEventListener('visibilitychange', onChange);
      return () => document.removeEventListener('visibilitychange', onChange);
    },
    () => document.hidden,
    () => false,
  );
}
