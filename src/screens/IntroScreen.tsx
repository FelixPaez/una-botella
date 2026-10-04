import * as m from 'motion/react-m';
import { useEffect, useRef } from 'react';
import { bottleTilt } from '../actors/bottleBus.ts';
import { BOTTLE_VIEW, bottleGeometry } from '../actors/geometry.ts';
import { config } from '../config.ts';
import { transition } from '../design/motion.ts';
import { usePointerFine } from '../hooks/useMediaQuery.ts';
import { useViewport } from '../hooks/useViewport.ts';
import { fill } from '../lib/format.ts';
import { whenIdle } from '../lib/idle.ts';
import { prefetchSoundEngine } from '../sound/index.ts';
import { useFlow } from '../state/flowContext.ts';
import { HintButton } from '../ui/HintButton.tsx';
import { RevealText } from '../ui/RevealText.tsx';

/** Primera pantalla: su nombre en el cielo y la botella meciéndose en el agua. */
export function IntroScreen() {
  const { dispatch } = useFlow();
  const pointerFine = usePointerFine();
  const geo = bottleGeometry(useViewport());
  const opened = useRef(false);

  const open = () => {
    if (opened.current) return;
    opened.current = true;
    bottleTilt.set(0);
    dispatch({ type: 'OPEN_BOTTLE' });
  };

  // Mientras ella mira la botella, se precarga lo siguiente: la cursiva de la carta y el sonido.
  useEffect(
    () =>
      whenIdle(() => {
        void document.fonts?.load('italic 400 1em Fraunces').catch(() => undefined);
        prefetchSoundEngine();
      }),
    [],
  );
  useEffect(() => () => bottleTilt.set(0), []);

  const bottleHeight = (geo.width * BOTTLE_VIEW.height) / BOTTLE_VIEW.width;

  return (
    <m.div className="screen-fixed" exit={{ opacity: 0, y: -10, transition: transition.exit }}>
      <div className="intro__text veil">
        <RevealText as="h1" text={fill(config.intro.title)} className="font-serif text-display font-medium text-on-sea" />
        <m.p
          className="intro__subtitle text-body text-on-sea-soft"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition.enter, delay: 0.7 }}
        >
          {config.intro.subtitle}
        </m.p>
        <m.div
          className="intro__hint text-on-sea"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition.enter, delay: 1.6 }}
        >
          <HintButton icon={<span className="pulse-dot" />} onClick={open}>
            {config.intro.hint[pointerFine ? 'mouse' : 'touch']}
          </HintButton>
        </m.div>
      </div>

      {/* Zona táctil sobre la botella (que vive en el mar, debajo de esta capa). */}
      <button
        type="button"
        className="intro__bottle"
        aria-label="Abrir la botella"
        style={{
          left: geo.float.x,
          top: geo.float.y - bottleHeight * 0.14,
          width: geo.width * 0.96,
          height: bottleHeight * 1.3,
        }}
        onClick={open}
        onPointerMove={(e) => {
          if (e.pointerType !== 'mouse') return;
          const r = e.currentTarget.getBoundingClientRect();
          bottleTilt.set(((e.clientX - (r.left + r.width / 2)) / r.width) * 9);
        }}
        onPointerLeave={() => bottleTilt.set(0)}
      />
    </m.div>
  );
}
