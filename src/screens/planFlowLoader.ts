import { config } from '../config.ts';

const RELOADED = 'botella:recargada';

/** El chunk de las pantallas del plan (postales, fecha y resumen). */
export const loadPlanFlow = () => import('./PlanFlow.tsx');

/**
 * Para mostrarlo. Si el archivo no llega porque se publicó una versión nueva mientras
 * ella miraba (la vieja ya no existe), se recarga una sola vez: el viaje está guardado
 * en la sesión y sigue donde iba. Si tampoco así, avisa RetryBoundary.
 */
export const loadPlanFlowOrReload = () =>
  loadPlanFlow().then(
    (module) => {
      session((s) => s.removeItem(RELOADED));
      return module;
    },
    (error: unknown) => {
      const firstTime = session((s) => {
        if (s.getItem(RELOADED)) return false;
        s.setItem(RELOADED, '1');
        return true;
      });
      if (navigator.onLine && firstTime) {
        window.location.reload();
        return new Promise<never>(() => undefined);
      }
      throw error;
    },
  );

function session<T>(fn: (storage: Storage) => T): T | undefined {
  try {
    return fn(window.sessionStorage);
  } catch {
    return undefined;
  }
}

/** Precarga lo siguiente mientras ella lee la pregunta: las pantallas del plan y las fotos de los lugares. */
export function preloadPlanFlow() {
  void loadPlanFlow().catch(() => undefined);
  for (const place of config.places) {
    if (place.image) new Image().src = `${import.meta.env.BASE_URL}${place.image}`;
  }
}
