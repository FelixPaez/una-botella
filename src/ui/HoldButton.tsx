import { animate, useMotionValue, useTransform, type AnimationPlaybackControls, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';
import { useRef, type ReactNode } from 'react';
import { feedback } from '../design/feedback.ts';
import { spring, transition } from '../design/motion.ts';

type HoldButtonProps = {
  label: string;
  /** Progreso 0 → 1 (se puede pasar uno externo para que otras piezas lo sigan, como la bruma). */
  progress?: MotionValue<number>;
  /** Segundos que hay que mantener. */
  duration?: number;
  icon?: ReactNode;
  onPressStart?: () => void;
  /** pointerDown = true si se completó con el dedo (o el ratón) todavía apoyado. */
  onComplete: (pointerDown: boolean) => void;
};

/**
 * Mantener presionado para completar. El anillo son dos medias lunas que giran
 * (solo transform). Si se suelta antes, vuelve con un muelle. Con teclado:
 * Espacio se mantiene; Enter (o un lector de pantalla) lo completa al instante.
 */
export function HoldButton({ label, progress, duration = 1.3, icon, onPressStart, onComplete }: HoldButtonProps) {
  const own = useMotionValue(0);
  const p = progress ?? own;
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const done = useRef(false);
  const holding = useRef(false);

  const finish = (pointerDown = false) => {
    if (done.current) return;
    done.current = true;
    holding.current = false;
    controls.current?.stop();
    p.set(1);
    onComplete(pointerDown);
  };

  const press = (byPointer: boolean) => {
    if (done.current || holding.current) return;
    holding.current = true;
    onPressStart?.();
    feedback('tick');
    controls.current?.stop();
    controls.current = animate(p, 1, {
      duration: duration * (1 - p.get()),
      ease: 'linear',
      onComplete: () => finish(byPointer),
    });
  };

  const release = () => {
    if (done.current || !holding.current) return;
    holding.current = false;
    controls.current?.stop();
    controls.current = animate(p, 0, spring.buoy);
  };

  // Primera mitad del anillo (derecha) y segunda (izquierda), en el sentido de las agujas.
  const firstHalf = useTransform(p, (v) => Math.min(v, 0.5) * 360);
  const secondHalf = useTransform(p, (v) => Math.max(v - 0.5, 0) * 360);

  return (
    <m.button
      type="button"
      className="hold"
      aria-label={label}
      whileTap={{ scale: 0.95 }}
      transition={transition.tap}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        press(true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.preventDefault();
          if (!e.repeat) press(false);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          finish(false);
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ') release();
      }}
      onClick={(e) => {
        // detail 0 = activado por teclado o lector de pantalla, sin gesto de mantener.
        if (e.detail === 0) finish(false);
      }}
    >
      <span className="hold__track" aria-hidden="true" />
      <span className="hold__half hold__half--right" aria-hidden="true">
        <m.span className="hold__arc" style={{ rotate: firstHalf }}>
          <svg viewBox="0 0 76 76" width="76" height="76">
            <path d="M38 3A35 35 0 0 0 38 73" fill="none" stroke="currentColor" strokeWidth="3.5" />
          </svg>
        </m.span>
      </span>
      <span className="hold__half hold__half--left" aria-hidden="true">
        <m.span className="hold__arc" style={{ rotate: secondHalf }}>
          <svg viewBox="0 0 76 76" width="76" height="76">
            <path d="M38 3A35 35 0 0 1 38 73" fill="none" stroke="currentColor" strokeWidth="3.5" />
          </svg>
        </m.span>
      </span>
      <span className="hold__core" aria-hidden="true">
        {icon}
      </span>
    </m.button>
  );
}
