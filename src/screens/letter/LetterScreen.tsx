import { animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { bottleBus, type LaunchInfo } from '../../actors/bottleBus.ts';
import { config } from '../../config.ts';
import { feedback } from '../../design/feedback.ts';
import { dur, ease, transition } from '../../design/motion.ts';
import { usePointerFine } from '../../hooks/useMediaQuery.ts';
import { useSwipeUp } from '../../hooks/useSwipeUp.ts';
import { fill } from '../../lib/format.ts';
import { useFlow } from '../../state/flowContext.ts';
import { HintButton } from '../../ui/HintButton.tsx';
import { HoldButton } from '../../ui/HoldButton.tsx';
import { RevealText } from '../../ui/RevealText.tsx';
import { Mist } from './Mist.tsx';
import { RolledLetter } from './RolledLetter.tsx';

type Phase = 'waiting' | 'flying' | 'unrolling' | 'open';

/**
 * La carta: llega enrollada desde la botella, se desenrolla (wipe con doble
 * transform + el rollo bajando por el borde) y muestra el mensaje página a página.
 */
export function LetterScreen() {
  const { state, dispatch } = useFlow();
  const reduced = Boolean(useReducedMotion());
  const [phase, setPhase] = useState<Phase>(() => (state.step === 'opening' ? 'waiting' : 'open'));
  const unroll = useMotionValue(phase === 'open' ? 1 : 0);
  const ribbon = useMotionValue(phase === 'open' ? 1 : 0);
  const flyX = useMotionValue(0);
  const flyY = useMotionValue(0);
  const flyScaleX = useMotionValue(1);
  const flyScaleY = useMotionValue(1);
  const flyRotate = useMotionValue(0);
  const flyOpacity = useMotionValue(phase === 'open' ? 1 : 0);
  const launch = useRef<LaunchInfo | null>(null);
  const rollerRef = useRef<HTMLDivElement>(null);

  // 1. Esperar a que la botella suelte la carta (o seguir sin ella si no llega).
  useEffect(() => {
    if (phase !== 'waiting') return;
    if (reduced) {
      unroll.set(1);
      ribbon.set(1);
      flyOpacity.set(1);
      const id = window.setTimeout(() => {
        setPhase('open');
        dispatch({ type: 'OPENED' });
      }, 450);
      return () => window.clearTimeout(id);
    }
    const off = bottleBus.onLaunch((info) => {
      launch.current = info;
      setPhase('flying');
    });
    const fallback = window.setTimeout(() => setPhase('flying'), 1800);
    return () => {
      off();
      window.clearTimeout(fallback);
    };
  }, [phase, reduced, dispatch, unroll, ribbon, flyOpacity]);

  // 2. Vuelo: del cuello de la botella al borde superior de la carta.
  useLayoutEffect(() => {
    if (phase !== 'flying' || !rollerRef.current) return;
    const rect = rollerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const info = launch.current;
    const angle = info?.angle ?? 0;
    const a = (angle * Math.PI) / 180;
    const sx = info ? Math.min(1, Math.max(0.15, info.length / rect.width)) : 0.35;
    const sy = info ? Math.min(1, Math.max(0.3, (info.length * 22) / 102 / rect.height)) : 0.6;
    // Centro del rollo cuando asoma: el cuello más medio largo, en la dirección de la botella.
    const startX = info ? info.x + (Math.cos(a) * rect.width * sx) / 2 : cx;
    const startY = info ? info.y + (Math.sin(a) * rect.width * sx) / 2 : window.innerHeight * 0.78;
    flyX.set(startX - cx);
    flyY.set(startY - cy);
    flyScaleX.set(sx);
    flyScaleY.set(sy);
    flyRotate.set(angle);
    flyOpacity.set(1);
    const opts = { duration: 0.95, ease: ease.surface };
    const controls = [
      animate(flyX, 0, opts),
      animate(flyY, 0, opts),
      animate(flyScaleX, 1, opts),
      animate(flyScaleY, 1, opts),
      animate(flyRotate, 0, { ...opts, onComplete: () => setPhase('unrolling') }),
    ];
    return () => controls.forEach((c) => c.stop());
  }, [phase, flyX, flyY, flyScaleX, flyScaleY, flyRotate, flyOpacity]);

  // 3. Se desenrolla: cae la cinta, el rollo baja y el papel aparece detrás.
  useEffect(() => {
    if (phase !== 'unrolling') return;
    const ribbonControls = animate(ribbon, 1, { duration: 0.7, ease: ease.sink });
    const unrollControls = animate(unroll, 1, {
      duration: dur.tide,
      ease: ease.surface,
      delay: 0.15,
      onComplete: () => {
        setPhase('open');
        dispatch({ type: 'OPENED' });
      },
    });
    return () => {
      ribbonControls.stop();
      unrollControls.stop();
    };
  }, [phase, ribbon, unroll, dispatch]);

  const outerY = useTransform(unroll, (p) => `${(p - 1) * 100}%`);
  const innerY = useTransform(unroll, (p) => `${(1 - p) * 100}%`);
  const trackY = useTransform(unroll, (p) => `${p * 100}%`);
  const curlOpacity = useTransform(unroll, [0, 0.06], [0, 1]);

  return (
    <div className="screen-fixed">
      <div className="letter-wrap">
        <div className="letter">
          <m.div className="letter__shadow" style={{ scaleY: unroll }} />
          <m.div className="letter__paper-outer" style={{ y: outerY }}>
            <m.div className="letter__paper paper" style={{ y: innerY }}>
              {state.step !== 'opening' && <LetterContent />}
            </m.div>
          </m.div>
          <m.div className="letter__curl" style={{ opacity: curlOpacity }} aria-hidden="true" />
          <m.div className="letter__track" style={{ y: trackY }} aria-hidden="true">
            <m.div
              ref={rollerRef}
              className="letter__roller"
              style={{ x: flyX, y: flyY, scaleX: flyScaleX, scaleY: flyScaleY, rotate: flyRotate, opacity: flyOpacity }}
            >
              <RolledLetter ribbon={ribbon} />
            </m.div>
          </m.div>
        </div>
      </div>
    </div>
  );
}

type How = 'tap' | 'swipe' | 'mist' | 'mist-held';

/** Contenido de la carta: una página cada vez (cada una con su gesto) y, al final, la pregunta. */
function LetterContent() {
  const { state, dispatch } = useFlow();
  // Si la página llega despejando la bruma, su texto ya está a la vista: no se vuelve a revelar.
  const [arrivedBy, setArrivedBy] = useState<How | null>(null);
  const next = (how: How) => {
    setArrivedBy(how);
    dispatch({ type: 'NEXT_PAGE' });
  };
  const revealed = arrivedBy === 'mist' || arrivedBy === 'mist-held';
  if (state.step === 'question') return <QuestionPage key="question" revealed={revealed} />;
  return (
    <LetterPage
      key={`page-${state.page}`}
      page={state.page}
      revealed={revealed}
      waitForRelease={arrivedBy === 'mist-held'}
      onNext={next}
    />
  );
}

type LetterPageProps = {
  page: number;
  /** El texto ya está a la vista (llegó despejando la bruma). */
  revealed: boolean;
  /** El dedo sigue apoyado del gesto anterior: no aceptar toques hasta que se levante. */
  waitForRelease: boolean;
  onNext: (how: How) => void;
};

function LetterPage({ page, revealed, waitForRelease, onNext }: LetterPageProps) {
  const pages = config.letter.pages;
  const { text, advance } = pages[page];
  const pointerFine = usePointerFine();
  const reduced = Boolean(useReducedMotion());
  const hint = config.letter.hints[advance][pointerFine ? 'mouse' : 'touch'];
  const isLast = page === pages.length - 1;
  const nextText = isLast ? config.question.text : pages[page + 1].text;

  const [complete, setComplete] = useState(revealed);
  const [armed, setArmed] = useState(!waitForRelease);
  const leaving = useRef(false);
  const ready = armed && complete;
  const swipeable = ready && advance === 'swipe';

  // Si el dedo sigue apoyado, el clic que el navegador genera al levantarlo caería en esta
  // página (por ejemplo, en el botón de deslizar). Hasta que se levante, nada responde.
  useEffect(() => {
    if (armed) return;
    let timer = 0;
    const release = () => {
      timer = window.setTimeout(() => setArmed(true), 120);
    };
    window.addEventListener('pointerup', release, { once: true });
    window.addEventListener('pointercancel', release, { once: true });
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.clearTimeout(timer);
    };
  }, [armed]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const fade = useMotionValue(1);
  const hold = useMotionValue(0);
  const fog = useMotionValue(0);

  const swipeFade = useTransform(y, [-170, 0], [0, 1]);
  const textOpacity = useTransform([fade, swipeFade, fog], ([f, s, g]: number[]) => f * s * (1 - g));
  const nextOpacity = useTransform([fog, hold], ([g, h]: number[]) => g * h);

  const swipe = useSwipeUp({
    y,
    enabled: swipeable,
    wheelTarget: bodyRef,
    onComplete: () => {
      feedback('whoosh');
      onNext('swipe');
    },
  });

  const leaveByTap = () => {
    if (leaving.current) return;
    leaving.current = true;
    feedback('tick');
    animate(y, -14, transition.exit);
    animate(fade, 0, { ...transition.exit, onComplete: () => onNext('tap') });
  };

  // Un toque mientras se revela lo completa; en las páginas de "tocar", el siguiente avanza.
  const onLetterClick = () => {
    if (!armed) return;
    if (!complete) setComplete(true);
    else if (advance === 'tap') leaveByTap();
  };

  // La bruma llega sola cuando ya hubo tiempo de leer (o al primer toque, lo que ocurra antes).
  useEffect(() => {
    if (!ready || advance !== 'hold') return;
    const words = text.split(/s+/).length;
    const id = window.setTimeout(
      () => {
        if (fog.get() === 0) animate(fog, 1, { duration: 1.6, ease: ease.swell });
      },
      (1.5 + words * 0.15) * 1000,
    );
    return () => window.clearTimeout(id);
  }, [ready, advance, text, fog]);

  // Si no hay gesto, el papel hace un amago hacia arriba como pista.
  useEffect(() => {
    if (!complete || advance !== 'swipe' || reduced) return;
    const id = window.setInterval(() => {
      if (y.get() !== 0 || y.isAnimating()) return;
      animate(y, [0, -18, 0], { duration: 1.1, ease: ease.swell });
    }, 4200);
    return () => window.clearInterval(id);
  }, [complete, advance, reduced, y]);


  return (
    <div className="letter__content">
      <div
        ref={bodyRef}
        className={`letter__body ${swipeable ? 'is-swipeable' : ''} ${complete && advance === 'tap' ? 'is-tappable' : ''}`}
        onClick={onLetterClick}
        {...(advance === 'swipe' ? swipe.handlers : {})}
      >
        <div className="letter__stack" aria-live="polite">
          <m.div className="letter__text" style={{ y, opacity: textOpacity }}>
            {page === 0 && (
              <RevealText text={fill(config.letter.greeting)} className="letter__greeting" complete={complete} />
            )}
            <RevealText
              text={fill(text)}
              className="letter__words"
              delay={page === 0 ? 0.55 : 0.1}
              complete={complete}
              onDone={() => setComplete(true)}
            />
          </m.div>
          {advance === 'hold' && (
            <>
              <m.div className="letter__text" style={{ opacity: nextOpacity }} aria-hidden="true">
                <p className={isLast ? 'letter__question' : 'letter__words'}>{fill(nextText)}</p>
              </m.div>
              <Mist fog={fog} progress={hold} />
            </>
          )}
        </div>
      </div>

      <m.div
        className="letter__footer"
        initial={false}
        animate={{ opacity: complete ? 1 : 0, y: complete ? 0 : 8 }}
        transition={transition.enter}
        inert={!ready}
      >
        {advance === 'tap' && (
          <HintButton icon={<span className="pulse-dot" />} onClick={leaveByTap}>
            {hint}
          </HintButton>
        )}
        {advance === 'hold' && (
          <div className="letter__hold">
            <HoldButton
              label={hint}
              progress={hold}
              icon={<FogIcon />}
              onPressStart={() => {
                if (fog.get() < 1) animate(fog, 1, { duration: 0.45, ease: ease.surface });
              }}
              onComplete={(pointerDown) => {
                feedback('bubble');
                onNext(pointerDown ? 'mist-held' : 'mist');
              }}
            />
            <p className="letter__hint-text">{hint}</p>
          </div>
        )}
        {advance === 'swipe' && (
          <HintButton icon={<ChevronUpIcon />} className="hint-button--swipe" onClick={swipe.complete}>
            {hint}
          </HintButton>
        )}
      </m.div>
    </div>
  );
}

/** Cierre de la carta. Los botones Sí y No (con el No que huye) llegan en la Fase 3. */
function QuestionPage({ revealed }: { revealed: boolean }) {
  const [done, setDone] = useState(revealed);
  return (
    <div className="letter__content">
      <div className="letter__body">
        <div className="letter__stack" aria-live="polite">
          <div className="letter__text">
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
        className="letter__footer"
        initial={false}
        animate={{ opacity: done ? 1 : 0 }}
        transition={{ ...transition.enter, delay: 0.4 }}
      >
        <p className="label-caps text-center text-tide">Fase 3 · Aquí llegarán el Sí y el No</p>
      </m.div>
    </div>
  );
}

function FogIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M4 9c2-1.6 4-1.6 6 0s4 1.6 6 0 3-1.2 4-.6M4 13.5c2-1.6 4-1.6 6 0s4 1.6 6 0 3-1.2 4-.6M6 18c1.6-1.2 3.2-1.2 4.8 0s3.2 1.2 4.8 0" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5 10 7.5l5 5" />
    </svg>
  );
}
