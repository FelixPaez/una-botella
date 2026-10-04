import {
  AnimatePresence,
  animate,
  useMotionValue,
  usePresence,
  usePresenceData,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { feedback } from '../design/feedback.ts';
import { transition } from '../design/motion.ts';
import { CREST_WIDTH, wavePath } from '../sea/waves.ts';

type Dir = 1 | -1;

/**
 * Escenario de pantallas: al cambiar `screenKey`, la nueva entra con la marea.
 * dir = 1 la marea sube (avanzar); dir = -1 baja (volver).
 */
export function TideStage({ screenKey, dir, children }: { screenKey: string; dir: Dir; children: ReactNode }) {
  // La primera pantalla aparece sin marea; las siguientes entran con ella.
  const [firstKey] = useState(screenKey);
  return (
    <div className="absolute inset-0 z-10">
      <AnimatePresence initial={false} custom={dir}>
        <TideScreen key={screenKey} dir={dir} instant={screenKey === firstKey}>
          {children}
        </TideScreen>
      </AnimatePresence>
    </div>
  );
}

function TideScreen({ dir, instant, children }: { dir: Dir; instant: boolean; children: ReactNode }) {
  const [isPresent, safeToRemove] = usePresence();
  const exitDir = (usePresenceData() as Dir | undefined) ?? dir;
  const reduced = Boolean(useReducedMotion());
  const enter = useMotionValue(instant ? 1 : 0);
  const leave = useMotionValue(0);

  useEffect(() => {
    if (isPresent) {
      if (instant) return;
      feedback('whoosh');
      const controls = animate(enter, 1, reduced ? transition.reduced : transition.tide);
      return () => controls.stop();
    }
    const controls = animate(leave, 1, reduced ? transition.reduced : transition.exit);
    void controls.then(() => safeToRemove?.());
    return () => controls.stop();
  }, [isPresent, instant, reduced, enter, leave, safeToRemove]);

  // Wipe con doble transform: el contenedor entra y el contenido se contrarresta,
  // así la pantalla se revela sin deformarse (sin clip-path: solo transform).
  const outerY = useTransform(enter, (p) => `${(1 - p) * 100 * dir}%`);
  const innerY = useTransform(enter, (p) => `${-(1 - p) * 100 * dir}%`);
  const crestOpacity = useTransform(enter, [0, 0.82, 1], [1, 1, 0]);
  const sinkY = useTransform(leave, [0, 1], [0, 18 * exitDir]);
  const sinkOpacity = useTransform(leave, [0, 1], [1, 0]);
  const fadeOpacity = useTransform([enter, leave], ([e, l]: number[]) => e * (1 - l));

  return (
    <div className="absolute inset-0" style={{ pointerEvents: isPresent ? undefined : 'none' }}>
      <m.div
        className="absolute inset-0 overflow-hidden"
        style={reduced ? { opacity: fadeOpacity } : { y: outerY, opacity: sinkOpacity }}
      >
        <m.div className="absolute inset-0" style={reduced ? undefined : { y: innerY }}>
          <m.div className="absolute inset-0" style={reduced ? undefined : { y: sinkY }}>
            {children}
          </m.div>
        </m.div>
      </m.div>
      {!reduced && !instant && (
        <m.div className="tide-crest" data-dir={dir} style={{ y: outerY, opacity: crestOpacity }} aria-hidden="true">
          <TideCrest />
        </m.div>
      )}
    </div>
  );
}

const CREST = wavePath({ periods: 3, amp: 9, height: 170, seed: 9 });

/** Borde de la marea: línea de espuma y agua translúcida que se desvanece. */
function TideCrest() {
  const id = `tide-${useId().replace(/[^\w-]/g, '')}`;
  return (
    <div className="tide-crest__band">
      <div className="tide-crest__drift">
        <svg viewBox={`0 0 ${CREST_WIDTH} 170`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9ad3ea" stopOpacity={0.9} />
              <stop offset="0.35" stopColor="#cde8f5" stopOpacity={0.45} />
              <stop offset="1" stopColor="#f5fafd" stopOpacity={0} />
            </linearGradient>
          </defs>
          <g transform="translate(0 21)">
            <path d={CREST.fill} fill={`url(#${id})`} />
            <path d={CREST.line} fill="none" stroke="#ffffff" strokeOpacity={0.95} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
      </div>
    </div>
  );
}
