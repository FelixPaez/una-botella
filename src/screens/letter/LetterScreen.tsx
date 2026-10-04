import { animate, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { bottleBus, type LaunchInfo } from '../../actors/bottleBus.ts';
import { config } from '../../config.ts';
import { dur, ease, transition } from '../../design/motion.ts';
import { formatDateLong } from '../../lib/dates.ts';
import { fill } from '../../lib/format.ts';
import { useFlow } from '../../state/flowContext.ts';
import { RevealText } from '../../ui/RevealText.tsx';
import { LetterContent } from './LetterPages.tsx';
import { RolledLetter } from './RolledLetter.tsx';

/**
 * waiting → flying → unrolling → open: la carta llega desde la botella y se despliega.
 * rolling-up / rolled → returning → gone: se enrolla, vuelve a la botella y se va con ella.
 */
type Phase = 'waiting' | 'flying' | 'unrolling' | 'open' | 'rolling-up' | 'rolled' | 'returning' | 'gone';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
/** Proporción grosor/largo de la carta enrollada dentro de la botella (22 / 102 en el dibujo). */
const THICKNESS = 22 / 102;

/**
 * La carta: llega enrollada desde la botella, se desenrolla (wipe con doble
 * transform + el rollo bajando por el borde) y muestra el mensaje página a página.
 * Al final (o con «Mejor otro día») hace el camino inverso y vuelve al mar.
 */
export function LetterScreen() {
  const { state, dispatch, initialStep } = useFlow();
  const reduced = Boolean(useReducedMotion());
  const closingStep = state.step === 'declined' || state.step === 'farewell';
  const [phase, setPhase] = useState<Phase>(() => {
    if (state.step === 'opening') return 'waiting';
    // Si se recarga ya en el final, se muestra el final tal cual (sin repetir la animación).
    if (closingStep) return state.step === initialStep ? 'gone' : 'rolled';
    return 'open';
  });
  const [showMessage, setShowMessage] = useState(closingStep && state.step === initialStep);
  // 4. Cierre desde la carta abierta («Mejor otro día»): el texto se desvanece y se enrolla.
  if (closingStep && phase === 'open') setPhase('rolling-up');

  const unroll = useMotionValue(phase === 'open' ? 1 : 0);
  const ribbon = useMotionValue(phase === 'open' ? 1 : 0);
  const contentOpacity = useMotionValue(1);
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
    const off = bottleBus.launch.on((info) => {
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
    const sx = info ? clamp(info.length / rect.width, 0.15, 1) : 0.35;
    const sy = info ? clamp((info.length * THICKNESS) / rect.height, 0.3, 1) : 0.6;
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


  useEffect(() => {
    if (phase !== 'rolling-up') return;
    bottleBus.resetClosing();
    if (reduced) {
      contentOpacity.set(0);
      unroll.set(0);
      ribbon.set(0);
      const id = window.setTimeout(() => setPhase('returning'), 0);
      return () => window.clearTimeout(id);
    }
    const fadeOut = animate(contentOpacity, 0, transition.exit);
    const rollUp = animate(unroll, 0, {
      duration: dur.tide,
      ease: ease.swell,
      delay: 0.25,
      onComplete: () => {
        // La cinta vuelve a atarse.
        animate(ribbon, 0, { duration: 0.5, ease: ease.surface, onComplete: () => setPhase('returning') });
      },
    });
    return () => {
      fadeOut.stop();
      rollUp.stop();
    };
  }, [phase, reduced, contentOpacity, unroll, ribbon]);

  // 4 bis. Cierre tras confirmar el plan: la carta aparece ya enrollada y atada.
  useEffect(() => {
    if (phase !== 'rolled') return;
    bottleBus.resetClosing();
    if (reduced) {
      flyOpacity.set(1);
      const id = window.setTimeout(() => setPhase('returning'), 0);
      return () => window.clearTimeout(id);
    }
    const start = () => {
      flyScaleX.set(0.82);
      flyScaleY.set(0.82);
      animate(flyOpacity, 1, transition.enter);
      animate(flyScaleX, 1, transition.enter);
      animate(flyScaleY, 1, { ...transition.enter, onComplete: () => setPhase('returning') });
    };
    if (!document.hidden) {
      start();
      return;
    }
    // Ella está en WhatsApp: la despedida espera a que vuelva para que no se la pierda.
    const onVisible = () => {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', onVisible);
      window.setTimeout(start, 500);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [phase, reduced, flyOpacity, flyScaleX, flyScaleY]);

  // 5. Cuando la botella vuelve, la carta vuela hasta el cuello y entra.
  useEffect(() => {
    if (phase !== 'returning') return;
    let started = false;
    const flyIn = () => {
      if (started) return;
      started = true;
      const el = rollerRef.current;
      const neck = bottleBus.neck?.();
      const finish = () => {
        bottleBus.deliver.emit();
        setPhase('gone');
      };
      if (reduced || !el || !neck) {
        animate(flyOpacity, 0, { ...transition.reduced, onComplete: finish });
        return;
      }
      const rect = el.getBoundingClientRect();
      const a = (neck.angle * Math.PI) / 180;
      const sx = clamp(neck.length / rect.width, 0.15, 1);
      const sy = clamp((neck.length * THICKNESS) / rect.height, 0.3, 1);
      const outX = neck.x + (Math.cos(a) * rect.width * sx) / 2 - (rect.left + rect.width / 2);
      const outY = neck.y + (Math.sin(a) * rect.width * sx) / 2 - (rect.top + rect.height / 2);
      const opts = { duration: 1.05, ease: ease.surface };
      animate(flyX, outX, opts);
      animate(flyY, outY, opts);
      animate(flyScaleX, sx, opts);
      animate(flyScaleY, sy, opts);
      animate(flyRotate, neck.angle, {
        ...opts,
        onComplete: () => {
          // Entra por el cuello y desaparece dentro.
          const into = { duration: 0.42, ease: ease.sink };
          animate(flyX, outX - Math.cos(a) * neck.length * 0.9, into);
          animate(flyY, outY - Math.sin(a) * neck.length * 0.9, into);
          animate(flyOpacity, 0, { ...into, onComplete: finish });
        },
      });
    };
    const off = bottleBus.arrived.on(flyIn);
    const fallback = window.setTimeout(flyIn, 4200);
    return () => {
      off();
      window.clearTimeout(fallback);
    };
  }, [phase, reduced, flyX, flyY, flyScaleX, flyScaleY, flyRotate, flyOpacity]);

  // 6. Con la botella ya alejándose, aparece el mensaje final.
  useEffect(() => {
    if (!closingStep || phase !== 'gone') return;
    const off = bottleBus.gone.on(() => setShowMessage(true));
    const fallback = window.setTimeout(() => setShowMessage(true), 3500);
    return () => {
      off();
      window.clearTimeout(fallback);
    };
  }, [closingStep, phase]);

  const outerY = useTransform(unroll, (p) => `${(p - 1) * 100}%`);
  const innerY = useTransform(unroll, (p) => `${(1 - p) * 100}%`);
  const trackY = useTransform(unroll, (p) => `${p * 100}%`);
  const curlOpacity = useTransform(unroll, [0, 0.06], [0, 1]);

  const closing =
    state.step === 'farewell'
      ? {
          title: config.farewell.title.replaceAll('{fecha}', formatDateLong(state.choice.date, true)),
          message: fill(config.farewell.message),
        }
      : { title: fill(config.decline.title), message: fill(config.decline.message) };

  return (
    <m.div className="screen-fixed" exit={{ opacity: 0, y: 26, transition: transition.exit }}>
      <div className="letter-wrap">
        <div className="letter">
          <m.div className="letter__shadow" style={{ scaleY: unroll }} />
          <m.div className="letter__paper-outer" style={{ y: outerY }}>
            <m.div className="letter__paper paper" style={{ y: innerY }}>
              <m.div className="letter__fade" style={{ opacity: contentOpacity }}>
                {state.step !== 'opening' && <LetterContent />}
              </m.div>
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
      {showMessage && <ClosingMessage title={closing.title} message={closing.message} />}
    </m.div>
  );
}

/** Mensaje final, en el cielo, mientras la botella se aleja. */
function ClosingMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="closing" role="status">
      <div className="closing__text veil">
        <RevealText as="h2" text={title} className="font-serif text-display font-medium text-on-sea" />
        <m.p
          className="closing__message text-body text-on-sea-soft"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition.enter, delay: 0.9 }}
        >
          {message}
        </m.p>
      </div>
    </div>
  );
}
