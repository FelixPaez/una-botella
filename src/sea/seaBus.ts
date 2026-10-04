/** Efectos puntuales que cualquier pantalla puede pedirle al mar (coordenadas de pantalla). */
export type SeaEvent =
  | { type: 'ripple'; x: number; y: number }
  | { type: 'splash'; x: number; y: number }
  /** Celebración: burbujas y destellos por todo el mar. */
  | { type: 'burst' };

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
