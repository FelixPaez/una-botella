import { useFlow } from '../state/flowContext.ts';
import { PlanScreen } from './plan/PlanScreen.tsx';
import { SummaryScreen } from './summary/SummaryScreen.tsx';
import { WhenScreen } from './when/WhenScreen.tsx';

/** Postales, fecha y resumen: se descargan aparte, mientras ella lee la pregunta. */
export default function PlanFlow() {
  const { state } = useFlow();
  if (state.step === 'plan') return <PlanScreen />;
  if (state.step === 'datetime') return <WhenScreen />;
  return <SummaryScreen />;
}
