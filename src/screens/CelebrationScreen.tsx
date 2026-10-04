import * as m from 'motion/react-m';
import { useEffect, useRef } from 'react';
import { config } from '../config.ts';
import { transition } from '../design/motion.ts';
import { seaBus } from '../sea/seaBus.ts';
import { useFlow } from '../state/flowContext.ts';
import { RevealText } from '../ui/RevealText.tsx';

/** Duración de la celebración antes de que la marea lleve al plan (un toque la adelanta). */
const CELEBRATION_MS = 3200;

/** El sí: el mar se llena de burbujas y destellos, y la marea lleva a elegir el plan. */
export function CelebrationScreen() {
  const { dispatch } = useFlow();
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = performance.now();
    seaBus.emit({ type: 'burst' });
    const id = window.setTimeout(() => dispatch({ type: 'CELEBRATED' }), CELEBRATION_MS);
    return () => window.clearTimeout(id);
  }, [dispatch]);

  return (
    <m.div
      className="screen-fixed celebration"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: transition.exit }}
      transition={transition.enter}
      onClick={() => {
        // Tras un instante, un toque adelanta (para no saltársela sin querer).
        if (performance.now() - startedAt.current > 900) dispatch({ type: 'CELEBRATED' });
      }}
    >
      <div className="celebration__text veil" role="status">
        <RevealText
          as="h2"
          text={config.celebration.title}
          delay={0.35}
          className="font-serif text-display font-medium text-on-sea"
        />
        <m.p
          className="celebration__subtitle text-body text-on-sea-soft"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition.enter, delay: 1.2 }}
        >
          {config.celebration.subtitle}
        </m.p>
      </div>
    </m.div>
  );
}
