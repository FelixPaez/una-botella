import { AnimatePresence } from 'motion/react';
import { Suspense, lazy } from 'react';
import type { Step } from '../state/flow.ts';
import { config } from '../config.ts';
import { useFlow } from '../state/flowContext.ts';
import { RetryBoundary } from '../ui/RetryBoundary.tsx';
import { TideStage } from '../ui/TideTransition.tsx';
import { CelebrationScreen } from './CelebrationScreen.tsx';
import { IntroScreen } from './IntroScreen.tsx';
import { LetterScreen } from './letter/LetterScreen.tsx';
import { loadPlanFlowOrReload } from './planFlowLoader.ts';

const PlanFlow = lazy(loadPlanFlowOrReload);

/** La historia de la botella y la carta es una sola pantalla (sin marea entre sus pasos). */
const STORY = new Set<Step>(['intro', 'opening', 'letter', 'question', 'celebration', 'declined', 'farewell']);
/** Pasos en los que se ve la carta (incluido su cierre). */
const LETTER = new Set<Step>(['opening', 'letter', 'question', 'declined', 'farewell']);

export function Experience() {
  const { state } = useFlow();
  const story = STORY.has(state.step);
  return (
    <TideStage screenKey={story ? 'story' : state.step} dir={state.dir}>
      {story ? (
        <Story />
      ) : (
        <RetryBoundary message={config.connection.lost} retry={config.connection.retry}>
          <Suspense fallback={null}>
            <PlanFlow />
          </Suspense>
        </RetryBoundary>
      )}
    </TideStage>
  );
}

function Story() {
  const { state } = useFlow();
  return (
    <>
      <AnimatePresence>
        {state.step === 'intro' && <IntroScreen key="intro" />}
        {LETTER.has(state.step) && <LetterScreen key="letter" />}
        {state.step === 'celebration' && <CelebrationScreen key="celebration" />}
      </AnimatePresence>
    </>
  );
}

