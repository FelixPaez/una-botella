import { describe, expect, it } from 'vitest';
import { createFlowReducer, initialFlow, type FlowAction, type FlowState } from './flow.ts';
import { progressOf } from './selectors.ts';

const reduce = createFlowReducer({ pages: 3, maxNoAttempts: 4, allowDecline: true });
const run = (actions: FlowAction[], from: FlowState = initialFlow) => actions.reduce(reduce, from);

const toQuestion: FlowAction[] = [
  { type: 'OPEN_BOTTLE' },
  { type: 'OPENED' },
  { type: 'NEXT_PAGE' },
  { type: 'NEXT_PAGE' },
  { type: 'NEXT_PAGE' },
];
const toPlan: FlowAction[] = [...toQuestion, { type: 'ACCEPT' }, { type: 'CELEBRATED' }];
const toSummary: FlowAction[] = [
  ...toPlan,
  { type: 'PICK_PLACE', placeId: 'atardecer', keepTime: false },
  { type: 'CONTINUE' },
  { type: 'PICK_DATE', date: '2026-10-09', keepTime: false },
  { type: 'PICK_TIME', time: '18:00' },
  { type: 'CONTINUE' },
];

describe('flujo', () => {
  it('recorre la carta página a página hasta la pregunta', () => {
    const s = run(toQuestion.slice(0, 3));
    expect(s.step).toBe('letter');
    expect(s.page).toBe(1);
    expect(run(toQuestion).step).toBe('question');
  });

  it('solo permite "Mejor otro día" tras los intentos configurados', () => {
    const tries = (n: number) => run([...toQuestion, ...Array(n).fill({ type: 'NO_ATTEMPT' }), { type: 'DECLINE' }]);
    expect(tries(3).step).toBe('question');
    expect(tries(4).step).toBe('declined');
  });

  it('sin allowGracefulDecline el "No" nunca lleva a ningún sitio', () => {
    const strict = createFlowReducer({ pages: 3, maxNoAttempts: 4, allowDecline: false });
    const s = [...toQuestion, ...Array(9).fill({ type: 'NO_ATTEMPT' }), { type: 'DECLINE' }].reduce(strict, initialFlow);
    expect(s.step).toBe('question');
    expect(s.noAttempts).toBe(4);
  });

  it('no deja avanzar sin elegir lugar, ni sin fecha y hora', () => {
    expect(run([...toPlan, { type: 'CONTINUE' }]).step).toBe('plan');
    const s = run([...toPlan, { type: 'PICK_PLACE', placeId: 'cafe', keepTime: false }, { type: 'CONTINUE' }, { type: 'CONTINUE' }]);
    expect(s.step).toBe('datetime');
  });

  it('vuelve atrás con la marea bajando, pero el "sí" no se deshace', () => {
    const s = run([...toSummary, { type: 'BACK' }]);
    expect(s.step).toBe('datetime');
    expect(s.dir).toBe(-1);
    expect(run([...toPlan, { type: 'BACK' }]).step).toBe('plan');
  });

  it('editar desde el resumen vuelve directo al resumen', () => {
    const editing = run([...toSummary, { type: 'EDIT', section: 'place' }]);
    expect(editing.step).toBe('plan');
    expect(editing.returnTo).toBe('summary');
    const s = run([{ type: 'PICK_PLACE', placeId: 'cafe', keepTime: true }, { type: 'CONTINUE' }], editing);
    expect(s.step).toBe('summary');
    expect(s.choice.placeId).toBe('cafe');
  });

  it('si al cambiar de lugar la hora deja de valer, hay que elegirla de nuevo', () => {
    const editing = run([...toSummary, { type: 'EDIT', section: 'place' }]);
    const s = run([{ type: 'PICK_PLACE', placeId: 'cafe', keepTime: false }, { type: 'CONTINUE' }], editing);
    expect(s.step).toBe('datetime');
    expect(s.choice.time).toBeNull();
  });

  it('confirmar por WhatsApp lleva al final', () => {
    expect(run([...toSummary, { type: 'SENT' }]).step).toBe('farewell');
  });
});

describe('progreso del barquito', () => {
  it('avanza por etapas y llega al faro al final', () => {
    expect(progressOf(initialFlow, 3).visible).toBe(false);
    expect(progressOf(run(toQuestion.slice(0, 3)), 3).index).toBe(1);
    expect(progressOf(run(toPlan), 3).index).toBe(4);
    const end = progressOf(run([...toSummary, { type: 'SENT' }]), 3);
    expect(end.arrived).toBe(true);
    expect(end.index).toBe(end.total);
  });
});
