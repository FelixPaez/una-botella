import * as m from 'motion/react-m';
import { useSyncExternalStore } from 'react';
import { transition } from '../design/motion.ts';
import { sound } from '../sound/index.ts';

/** Botón de sonido con forma de concha, siempre visible. */
export function SoundToggle() {
  const muted = useSyncExternalStore(sound.subscribe, sound.isMuted, () => true);
  if (!sound.available) return null;

  return (
    <m.button
      type="button"
      className="glass grid size-11 place-items-center rounded-full text-deep shadow-soft"
      aria-pressed={!muted}
      aria-label={muted ? 'Activar el sonido' : 'Silenciar el sonido'}
      title={muted ? 'Activar el sonido' : 'Silenciar el sonido'}
      whileTap={{ scale: 0.92 }}
      transition={transition.tap}
      onClick={() => sound.setMuted(!muted)}
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Concha (vieira) */}
        <path d="M9.5 20 6.3 18.4C3.4 15.6 2.6 11.6 3.9 8.4 5 5.7 7.1 4.2 9.5 4.1c2.4.1 4.5 1.6 5.6 4.3 1.3 3.2.5 7.2-2.4 10z" />
        <path d="M9.5 19.6 4.6 9.2M9.5 19.6 7 5.6M9.5 19.6V4.3M9.5 19.6 12 5.6M9.5 19.6l4.9-10.4" strokeWidth="1" />
        <path d="M7.6 21h3.8" />
        {/* Ondas de sonido o silencio */}
        <m.g initial={false} animate={{ opacity: muted ? 0 : 1, x: muted ? -2 : 0 }} transition={transition.tap}>
          <path d="M18 9.6a3.6 3.6 0 0 1 0 4.8" />
          <path d="M20.3 7.4a6.8 6.8 0 0 1 0 9.2" />
        </m.g>
        <m.g initial={false} animate={{ opacity: muted ? 1 : 0 }} transition={transition.tap}>
          <path d="m17.6 10 4 4M21.6 10l-4 4" />
        </m.g>
      </svg>
    </m.button>
  );
}
