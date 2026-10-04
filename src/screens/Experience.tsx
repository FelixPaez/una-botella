import { AnimatePresence } from 'motion/react';
import type { Step } from '../state/flow.ts';
import { useFlow } from '../state/flowContext.ts';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';
import { TideStage } from '../ui/TideTransition.tsx';
import { IntroScreen } from './IntroScreen.tsx';
import { LetterScreen } from './letter/LetterScreen.tsx';

/** La historia de la botella y la carta es una sola pantalla (sin marea entre sus pasos). */
const STORY = new Set<Step>(['intro', 'opening', 'letter', 'question']);

export function Experience() {
  const { state } = useFlow();
  const story = STORY.has(state.step);
  return (
    <TideStage screenKey={story ? 'story' : state.step} dir={state.dir}>
      {story ? <Story /> : <NextPhase />}
    </TideStage>
  );
}

function Story() {
  const { state } = useFlow();
  return (
    <>
      <AnimatePresence>{state.step === 'intro' && <IntroScreen key="intro" />}</AnimatePresence>
      {state.step !== 'intro' && <LetterScreen />}
    </>
  );
}

/** Pasos que llegan en las próximas fases. */
function NextPhase() {
  const { dispatch } = useFlow();
  return (
    <div className="screen grid place-items-center">
      <Card className="max-w-sm p-7 text-center">
        <p className="label-caps text-ink-soft">Próximamente</p>
        <p className="mt-3 font-serif text-letter text-deep">Esta parte del viaje llega en las próximas fases.</p>
        <Button className="mt-6" variant="secondary" onClick={() => dispatch({ type: 'RESET' })}>
          Volver al principio
        </Button>
      </Card>
    </div>
  );
}
