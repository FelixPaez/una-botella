import { describe, expect, it } from 'vitest';
import { initialFlow, type FlowState } from './flow.ts';
import { STORAGE_KEY, isFlowState, loadFlow, settle, stateForParam } from './persistence.ts';

const memory = (saved: unknown) => {
  const data = new Map<string, string>(saved === undefined ? [] : [[STORAGE_KEY, JSON.stringify(saved)]]);
  return {
    getItem: (k: string) => data.get(k) ?? null,
    removeItem: (k: string) => void data.delete(k),
    has: (k: string) => data.has(k),
  };
};

describe('retomar la sesión', () => {
  it('sin nada guardado empieza en la intro', () => {
    expect(loadFlow('', memory(undefined), 3)).toEqual(initialFlow);
  });

  it('retoma la página de la carta donde estaba', () => {
    const saved: FlowState = { ...initialFlow, step: 'letter', page: 2 };
    expect(loadFlow('', memory(saved), 3)).toMatchObject({ step: 'letter', page: 2 });
  });

  it('si se recargó mientras se abría la botella, vuelve a la carta desplegada', () => {
    expect(settle({ ...initialFlow, step: 'opening' }, 3)).toMatchObject({ step: 'letter', page: 0 });
  });

  it('ajusta la página si la carta ahora tiene menos páginas', () => {
    expect(settle({ ...initialFlow, step: 'letter', page: 3 }, 2).page).toBe(1);
  });

  it('ignora datos corruptos o de otra versión', () => {
    expect(isFlowState({ step: 'nada' })).toBe(false);
    expect(loadFlow('', memory({ step: 'letter' }), 3)).toEqual(initialFlow);
    expect(loadFlow('', { getItem: () => '{roto', removeItem: () => undefined }, 3)).toEqual(initialFlow);
  });
});

describe('?paso= para revisar', () => {
  it('abre la carta en la página indicada', () => {
    expect(stateForParam('carta', 3)).toMatchObject({ step: 'letter', page: 0 });
    expect(stateForParam('carta-3', 3)).toMatchObject({ step: 'letter', page: 2 });
    expect(stateForParam('carta-9', 3)).toMatchObject({ page: 2 });
    expect(stateForParam('pregunta', 3)).toMatchObject({ step: 'question' });
    expect(stateForParam('otra-cosa', 3)).toBeNull();
  });

  it('?paso=inicio empieza de cero y olvida la sesión', () => {
    const storage = memory({ ...initialFlow, step: 'question' });
    expect(loadFlow('?paso=inicio', storage, 3)).toEqual(initialFlow);
    expect(storage.has(STORAGE_KEY)).toBe(false);
  });
});
