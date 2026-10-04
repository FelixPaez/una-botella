import { initialFlow, type FlowState, type Step } from './flow.ts';

/** Clave en sessionStorage (no es una cookie, no sale del móvil y se borra al cerrar la pestaña). */
export const STORAGE_KEY = 'botella:viaje:v1';

const STEPS: Step[] = [
  'intro',
  'opening',
  'letter',
  'question',
  'celebration',
  'declined',
  'plan',
  'datetime',
  'summary',
  'farewell',
];

export function isFlowState(value: unknown): value is FlowState {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  const c = s.choice as Record<string, unknown> | undefined;
  return (
    STEPS.includes(s.step as Step) &&
    typeof s.page === 'number' &&
    typeof s.noAttempts === 'number' &&
    !!c &&
    typeof c.note === 'string' &&
    ['string', 'object'].includes(typeof c.placeId) &&
    ['string', 'object'].includes(typeof c.date) &&
    ['string', 'object'].includes(typeof c.time)
  );
}

/**
 * Al recargar, los pasos de transición se convierten en pasos estables
 * y la página de la carta se ajusta por si config.ts cambió.
 */
export function settle(state: FlowState, pages: number): FlowState {
  const page = Math.min(Math.max(0, state.page), pages - 1);
  if (state.step === 'opening') return { ...state, step: 'letter', page: 0, dir: 1 };
  if (state.step === 'celebration') return { ...state, step: 'plan', page, dir: 1 };
  return { ...state, page, dir: 1 };
}

/** ?paso=inicio|carta|carta-2|carta-3|carta-4|pregunta: abre ese paso directamente (para revisar). */
export function stateForParam(param: string, pages: number): FlowState | null {
  const letter = /^carta(?:-(\d))?$/.exec(param);
  if (letter) {
    const page = Math.min(Math.max(1, Number(letter[1] ?? 1)), pages) - 1;
    return { ...initialFlow, step: 'letter', page };
  }
  if (param === 'inicio') return initialFlow;
  if (param === 'pregunta') return { ...initialFlow, step: 'question', page: pages - 1 };
  return null;
}

/** Estado inicial: el parámetro ?paso manda; si no, se retoma la sesión; si no, desde el principio. */
export function loadFlow(search: string, storage: Pick<Storage, 'getItem' | 'removeItem'> | null, pages: number) {
  const param = new URLSearchParams(search).get('paso');
  if (param) {
    const forced = stateForParam(param, pages);
    if (forced) {
      if (param === 'inicio') storage?.removeItem(STORAGE_KEY);
      return forced;
    }
  }
  try {
    const saved: unknown = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null');
    if (isFlowState(saved)) return settle(saved, pages);
  } catch {
    // sesión ilegible: se empieza de nuevo
  }
  return initialFlow;
}
