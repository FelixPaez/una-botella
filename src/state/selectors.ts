import type { BottlePose } from '../actors/geometry.ts';
import type { FlowState, Step } from './flow.ts';

/** Oleaje de cada paso: medio en la intro, un pico al destaparla y calma para leer. */
export function swellFor(step: Step): number {
  switch (step) {
    case 'intro':
      return 0.5;
    case 'opening':
      return 0.72;
    case 'letter':
    case 'question':
      return 0.22;
    default:
      return 0.4;
  }
}

/** Dónde está la botella en cada paso. */
export function bottlePoseFor(step: Step): BottlePose {
  if (step === 'intro') return 'float';
  if (step === 'opening') return 'opening';
  return 'away';
}

export type Progress = {
  visible: boolean;
  /** Posición del barquito, de 0 a `total`. */
  index: number;
  total: number;
  /** El barquito llegó al faro. */
  arrived: boolean;
  /** Etiquetas (solo escritorio): en qué índice empieza cada etapa. */
  labels: { at: number; text: string }[];
};

/** Progreso del viaje: páginas de la carta, pregunta, plan, fecha y resumen. */
export function progressOf(state: FlowState, pages: number): Progress {
  const total = pages + 4;
  const labels = [
    { at: 0, text: 'Carta' },
    { at: pages, text: 'Pregunta' },
    { at: pages + 1, text: 'Plan' },
    { at: pages + 2, text: 'Fecha' },
    { at: pages + 3, text: 'Resumen' },
  ];
  const at = (index: number, extra: Partial<Progress> = {}): Progress => ({
    visible: true,
    index,
    total,
    arrived: false,
    labels,
    ...extra,
  });

  switch (state.step) {
    case 'intro':
    case 'opening':
      return at(0, { visible: false });
    case 'letter':
      return at(state.page);
    case 'question':
    case 'celebration':
      return at(pages);
    case 'declined':
      return at(pages, { visible: false });
    case 'plan':
      return at(pages + 1);
    case 'datetime':
      return at(pages + 2);
    case 'summary':
      return at(pages + 3);
    case 'farewell':
      return at(total, { arrived: true });
  }
}
