/**
 * Máquina de estados de la experiencia (un reducer puro).
 *
 * intro ─toca─▶ opening ─▶ letter[0..n] ─▶ question
 * question ─No ×N → «Mejor otro día»─▶ declined
 * question ─Sí─▶ celebration ─▶ plan ⇄ datetime ⇄ summary ─WhatsApp─▶ farewell
 *                                 ▲──── editar desde el resumen ───┘
 */

export type Step =
  | 'intro'
  | 'opening'
  | 'letter'
  | 'question'
  | 'celebration'
  | 'declined'
  | 'plan'
  | 'datetime'
  | 'summary'
  | 'farewell';

export type Section = 'place' | 'date' | 'time' | 'note';

export type Choice = {
  placeId: string | null;
  /** Día local en formato AAAA-MM-DD. */
  date: string | null;
  /** Hora en formato HH:MM (24 h). */
  time: string | null;
  note: string;
};

export type FlowState = {
  step: Step;
  page: number;
  noAttempts: number;
  choice: Choice;
  /** Si se está editando algo desde el resumen, a dónde volver. */
  returnTo: 'summary' | null;
  /** 1 = la marea sube (avanzar), -1 = baja (volver). */
  dir: 1 | -1;
};

export type FlowAction =
  | { type: 'OPEN_BOTTLE' }
  | { type: 'OPENED' }
  | { type: 'NEXT_PAGE' }
  | { type: 'NO_ATTEMPT' }
  | { type: 'DECLINE' }
  | { type: 'ACCEPT' }
  | { type: 'CELEBRATED' }
  | { type: 'PICK_PLACE'; placeId: string; keepTime: boolean }
  /** Si no se conserva la hora, se propone `time` (la que el arco muestra al elegir el día). */
  | { type: 'PICK_DATE'; date: string; keepTime: boolean; time?: string | null }
  | { type: 'PICK_TIME'; time: string }
  | { type: 'SET_NOTE'; note: string }
  | { type: 'CONTINUE' }
  | { type: 'BACK' }
  | { type: 'EDIT'; section: Section }
  | { type: 'SENT' }
  | { type: 'RESTORE'; state: FlowState }
  | { type: 'RESET' };

export type FlowOptions = {
  pages: number;
  maxNoAttempts: number;
  allowDecline: boolean;
};

export const initialFlow: FlowState = {
  step: 'intro',
  page: 0,
  noAttempts: 0,
  choice: { placeId: null, date: null, time: null, note: '' },
  returnTo: null,
  dir: 1,
};

const isComplete = (c: Choice) => Boolean(c.placeId && c.date && c.time);

export function createFlowReducer({ pages, maxNoAttempts, allowDecline }: FlowOptions) {
  return function flowReducer(state: FlowState, action: FlowAction): FlowState {
    const go = (step: Step, extra: Partial<FlowState> = {}): FlowState => ({ ...state, step, dir: 1, ...extra });
    const back = (step: Step, extra: Partial<FlowState> = {}): FlowState => ({ ...state, step, dir: -1, ...extra });

    switch (action.type) {
      case 'OPEN_BOTTLE':
        return state.step === 'intro' ? go('opening') : state;

      case 'OPENED':
        return state.step === 'opening' ? go('letter', { page: 0 }) : state;

      case 'NEXT_PAGE':
        if (state.step !== 'letter') return state;
        return state.page < pages - 1 ? go('letter', { page: state.page + 1 }) : go('question');

      case 'NO_ATTEMPT':
        if (state.step !== 'question') return state;
        return { ...state, noAttempts: Math.min(state.noAttempts + 1, maxNoAttempts) };

      case 'DECLINE':
        return state.step === 'question' && allowDecline && state.noAttempts >= maxNoAttempts
          ? go('declined')
          : state;

      case 'ACCEPT':
        return state.step === 'question' ? go('celebration') : state;

      case 'CELEBRATED':
        return state.step === 'celebration' ? go('plan') : state;

      case 'PICK_PLACE':
        if (state.step !== 'plan') return state;
        return {
          ...state,
          choice: { ...state.choice, placeId: action.placeId, time: action.keepTime ? state.choice.time : null },
        };

      case 'PICK_DATE':
        if (state.step !== 'datetime') return state;
        return {
          ...state,
          choice: { ...state.choice, date: action.date, time: action.keepTime ? state.choice.time : (action.time ?? null) },
        };

      case 'PICK_TIME':
        return state.step === 'datetime' ? { ...state, choice: { ...state.choice, time: action.time } } : state;

      case 'SET_NOTE':
        return state.step === 'datetime' ? { ...state, choice: { ...state.choice, note: action.note } } : state;

      case 'CONTINUE':
        if (state.step === 'plan' && state.choice.placeId) {
          return state.returnTo === 'summary' && isComplete(state.choice)
            ? go('summary', { returnTo: null })
            : go('datetime');
        }
        if (state.step === 'datetime' && state.choice.date && state.choice.time) {
          return go('summary', { returnTo: null });
        }
        return state;

      case 'BACK':
        if (state.returnTo === 'summary' && (state.step === 'plan' || state.step === 'datetime')) {
          return isComplete(state.choice) ? go('summary', { returnTo: null }) : state;
        }
        if (state.step === 'datetime') return back('plan');
        if (state.step === 'summary') return back('datetime');
        return state;

      case 'EDIT':
        if (state.step !== 'summary') return state;
        return back(action.section === 'place' ? 'plan' : 'datetime', { returnTo: 'summary' });

      case 'SENT':
        return state.step === 'summary' && isComplete(state.choice) ? go('farewell') : state;

      case 'RESTORE':
        return action.state;

      case 'RESET':
        return initialFlow;
    }
  };
}
