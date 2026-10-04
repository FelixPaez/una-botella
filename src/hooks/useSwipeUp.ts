import { animate, type MotionValue } from 'motion/react';
import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { spring, transition } from '../design/motion.ts';

type Options = {
  /** El desplazamiento vertical del papel (negativo = hacia arriba). */
  y: MotionValue<number>;
  enabled: boolean;
  onComplete: () => void;
  /** Elemento que escucha la rueda del ratón o el trackpad. */
  wheelTarget: RefObject<HTMLElement | null>;
  threshold?: number;
};

/**
 * Deslizar hacia arriba: el papel sigue al dedo (con resistencia hacia abajo);
 * pasado el umbral o con velocidad suficiente, se va. En escritorio también
 * vale la rueda o el trackpad.
 */
export function useSwipeUp({ y, enabled, onComplete, wheelTarget, threshold = 90 }: Options) {
  const drag = useRef<{ startY: number; samples: { y: number; t: number }[] } | null>(null);
  const finished = useRef(false);
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  });

  const settle = (velocity: number) => {
    if (finished.current) return;
    if (y.get() < -threshold || velocity < -0.45) {
      finished.current = true;
      void animate(y, -240, transition.exit).then(() => completeRef.current());
    } else {
      animate(y, 0, spring.buoy);
    }
  };

  const complete = () => {
    if (finished.current) return;
    finished.current = true;
    void animate(y, -240, transition.exit).then(() => completeRef.current());
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || finished.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    y.stop();
    drag.current = { startY: e.clientY - y.get(), samples: [{ y: e.clientY, t: e.timeStamp }] };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    y.set(dy < 0 ? dy : dy * 0.25);
    // Solo las muestras de los últimos 120 ms: la velocidad no depende de un único evento.
    d.samples.push({ y: e.clientY, t: e.timeStamp });
    while (d.samples.length > 2 && e.timeStamp - d.samples[0].t > 120) d.samples.shift();
  };

  /** Velocidad media reciente en px/ms (negativa = hacia arriba). */
  const velocityOf = (samples: { y: number; t: number }[]) => {
    const first = samples[0];
    const last = samples[samples.length - 1];
    const dt = last.t - first.t;
    return dt >= 30 ? (last.y - first.y) / dt : 0;
  };

  const onPointerEnd = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    settle(velocityOf(d.samples));
  };

  // Rueda o trackpad: acumulamos y, al parar, decidimos.
  useEffect(() => {
    const el = wheelTarget.current;
    if (!el || !enabled) return;
    let timer = 0;
    const onWheel = (e: WheelEvent) => {
      if (finished.current) return;
      y.stop();
      y.set(Math.max(-260, Math.min(30, y.get() - e.deltaY * 0.55)));
      window.clearTimeout(timer);
      timer = window.setTimeout(() => settle(0), 160);
    };
    el.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.clearTimeout(timer);
    };
    // settle solo lee refs y valores estables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, wheelTarget, y]);

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd },
    complete,
  };
}
