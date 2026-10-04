import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

/** Composición de escritorio (el diseño cambia con el ancho). */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

/** Ratón o trackpad (el comportamiento cambia con el tipo de puntero). */
export const usePointerFine = () => useMediaQuery('(hover: hover) and (pointer: fine)');
