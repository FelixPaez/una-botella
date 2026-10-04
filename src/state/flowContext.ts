import { createContext, useContext, type Dispatch } from 'react';
import type { FlowAction, FlowState } from './flow.ts';

type FlowContextValue = {
  state: FlowState;
  dispatch: Dispatch<FlowAction>;
  /** Paso con el que se cargó la página (para no repetir animaciones de cierre al recargar). */
  initialStep: FlowState['step'];
};

export const FlowContext = createContext<FlowContextValue | null>(null);

/** Estado de la experiencia y su dispatch (dentro de <FlowProvider>). */
export function useFlow(): FlowContextValue {
  const value = useContext(FlowContext);
  if (!value) throw new Error('useFlow debe usarse dentro de <FlowProvider>');
  return value;
}
