import { config } from '../config.ts';

/** El chunk de las pantallas del plan (postales, fecha y resumen). */
export const loadPlanFlow = () => import('./PlanFlow.tsx');

/** Precarga lo siguiente mientras ella lee la pregunta: las pantallas del plan y las fotos de los lugares. */
export function preloadPlanFlow() {
  void loadPlanFlow().catch(() => undefined);
  for (const place of config.places) {
    if (place.image) new Image().src = `${import.meta.env.BASE_URL}${place.image}`;
  }
}
