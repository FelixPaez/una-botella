import { animate, useMotionValue } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useRef, useState } from 'react';
import { whenIdle } from '../../lib/idle.ts';
import { preloadPlanFlow } from '../planFlowLoader.ts';
import { config } from '../../config.ts';
import { feedback } from '../../design/feedback.ts';
import { ease, spring, transition } from '../../design/motion.ts';
import { fill } from '../../lib/format.ts';
import { inflate, scaleRect, type Rect } from '../../lib/placement.ts';
import { useFlow } from '../../state/flowContext.ts';
import { Button } from '../../ui/Button.tsx';
import { RevealText } from '../../ui/RevealText.tsx';
import { RunawayNo } from './RunawayNo.tsx';

/** Cuánto crece el Sí como mucho (y el hueco que el No debe respetar). */
const YES_MAX = 1.3;

const toRect = (r: DOMRect): Rect => ({ x: r.left, y: r.top, w: r.width, h: r.height });

/** Cierre de la carta: la pregunta, la firma, el Sí y el No que no se deja pulsar. */
export function QuestionPage({ revealed }: { revealed: boolean }) {
  const { state, dispatch } = useFlow();
  const active = state.step === 'question';
  const [done, setDone] = useState(revealed);
  const [dodges, setDodges] = useState(0);
  const [ring, setRing] = useState(0);
  const lastDodge = useRef(-Infinity);
  const yesRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const yesScale = useMotionValue(1);

  // Mientras ella decide, se precarga lo que viene después del sí.
  useEffect(() => whenIdle(preloadPlanFlow), []);

  const { phrases, maxAttempts, allowGracefulDecline, declineLabel } = config.noButton;
  const still = allowGracefulDecline && dodges >= maxAttempts;
  const noLabel =
    dodges === 0 ? config.question.no : still ? declineLabel : phrases[(dodges - 1) % phrases.length];
  const noScale = still ? 1 : Math.max(0.9 ** dodges, 0.7);

  const onDodge = () => {
    lastDodge.current = performance.now();
    feedback('nudge');
    dispatch({ type: 'NO_ATTEMPT' });
    const next = dodges + 1;
    setDodges(next);
    animate(yesScale, Math.min(1 + 0.08 * next, YES_MAX), spring.buoy);
  };

  const onYes = () => {
    // Nunca un «sí» accidental: justo después de que el No huya, el Sí no responde.
    if (!active || performance.now() - lastDodge.current < 350) return;
    feedback('yes');
    setRing((r) => r + 1);
    window.setTimeout(() => dispatch({ type: 'ACCEPT' }), 380);
  };

  // Lo que el No no puede pisar: el Sí con su tamaño máximo y el texto de la pregunta.
  const avoid = (): Rect[] => {
    const zones: Rect[] = [];
    const yes = yesRef.current?.getBoundingClientRect();
    if (yes) zones.push(inflate(scaleRect(scaleRect(toRect(yes), 1 / yesScale.get()), YES_MAX), 16));
    const text = textRef.current?.getBoundingClientRect();
    if (text) zones.push(inflate(toRect(text), 8));
    return zones;
  };

  return (
    <div className="letter__content">
      <div className="letter__body">
        <div className="letter__stack" aria-live="polite">
          <div className="letter__text" ref={textRef}>
            <RevealText
              as="h2"
              text={fill(config.question.text)}
              className="letter__question"
              complete={revealed}
              onDone={() => setDone(true)}
            />
            <m.p
              className="letter__signature"
              initial={false}
              animate={{ opacity: done ? 1 : 0, y: done ? 0 : 6 }}
              transition={transition.enter}
            >
              {fill(config.letter.signature)}
            </m.p>
          </div>
        </div>
      </div>

      <m.div
        className="letter__footer question__actions"
        initial={false}
        animate={{ opacity: done ? 1 : 0, y: done ? 0 : 10 }}
        transition={{ ...transition.enter, delay: 0.35 }}
        inert={!done || !active}
      >
        <m.div ref={yesRef} className="question__yes" style={{ scale: yesScale }}>
          <Button sound={null} onClick={onYes} className="question__yes-button">
            {config.question.yes}
          </Button>
          {ring > 0 && (
            <m.span
              key={ring}
              className="question__ring"
              initial={{ opacity: 0.75, scale: 1 }}
              animate={{ opacity: 0, scale: 2.6 }}
              transition={{ duration: 0.9, ease: ease.surface }}
              aria-hidden="true"
            />
          )}
        </m.div>
        <RunawayNo
          label={noLabel}
          scale={noScale}
          attempt={dodges}
          still={still}
          active={active && done}
          avoid={avoid}
          onDodge={onDodge}
          onPress={() => dispatch({ type: 'DECLINE' })}
        />
      </m.div>
    </div>
  );
}
