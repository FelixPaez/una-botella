/** Efectos puntuales que cualquier pantalla puede pedirle al mar. */
export type SeaEvent = { type: 'ripple'; x: number; y: number };

const listeners = new Set<(event: SeaEvent) => void>();

export const seaBus = {
  emit(event: SeaEvent) {
    listeners.forEach((fn) => fn(event));
  },
  on(fn: (event: SeaEvent) => void) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },
};
