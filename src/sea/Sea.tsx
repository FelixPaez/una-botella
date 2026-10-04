import { useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { spring } from '../design/motion.ts';
import { usePointerFine } from '../hooks/useMediaQuery.ts';
import { usePageHidden } from '../hooks/usePageHidden.ts';
import type { Mood } from '../lib/mood.ts';
import { Ripples } from './Ripples.tsx';
import { Sky } from './Sky.tsx';
import { Water } from './Water.tsx';

/** Color de la barra del navegador para cada hora (el tono de arriba del cielo). */
const THEME_COLOR: Record<Mood, string> = {
  morning: '#b9d9f0',
  day: '#9fcff0',
  sunset: '#9db8de',
  night: '#071a2e',
};

export type SeaProps = {
  mood: Mood;
  /** Oleaje de 0 (calma) a 1 (marejada suave). */
  swell: number;
  /** Fase de la luna que se ve de noche. */
  moonPhase: number;
  /** Hemisferio sur: la luna se dibuja al revés. */
  south?: boolean;
  /** Dispositivo modesto: menos burbujas, estrellas y destellos. */
  lite?: boolean;
  /** Lo que flota entre las olas (la botella). */
  actors?: ReactNode;
};

/**
 * El mar: un único componente que nunca se desmonta. Las pantallas solo
 * cambian sus parámetros (hora del día y oleaje) y él hace la transición.
 */
export function Sea({ mood, swell, moonPhase, south = false, lite = false, actors }: SeaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(() => window.innerWidth);
  const hidden = usePageHidden();
  const pointerFine = usePointerFine();
  const reduced = useReducedMotion();
  const parallax = useMotionValue(0);
  const smoothParallax = useSpring(parallax, spring.drift);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Con ratón, el mar sigue al cursor con un paralaje sutil (las olas cercanas se mueven más).
  useEffect(() => {
    if (!pointerFine || reduced) {
      parallax.set(0);
      return;
    }
    const onMove = (e: PointerEvent) => parallax.set((0.5 - e.clientX / window.innerWidth) * 24);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [pointerFine, reduced, parallax]);

  // El texto que va sobre el mar y la barra del navegador acompañan a la hora del día.
  useEffect(() => {
    document.documentElement.dataset.mood = mood;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[mood]);
  }, [mood]);

  const swellScale = 0.55 + 0.9 * Math.min(1, Math.max(0, swell));

  return (
    <div
      ref={ref}
      className="sea"
      data-mood={mood}
      data-paused={hidden || undefined}
      style={{ '--swell-scale': swellScale } as CSSProperties}
      aria-hidden="true"
    >
      <Sky mood={mood} moonPhase={moonPhase} south={south} lite={lite} />
      <Water width={width} parallax={smoothParallax} lite={lite} actors={actors} />
      <Ripples lite={lite} />
    </div>
  );
}
