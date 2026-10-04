import { animate, useMotionValue, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { spring, transition } from '../../design/motion.ts';
import { usePointerFine } from '../../hooks/useMediaQuery.ts';
import { chooseSpot, type Point, type Rect } from '../../lib/placement.ts';

type Props = {
  label: string;
  /** Escala del botón (se encoge con cada intento). */
  scale: number;
  /** Número de intentos: cada cambio recoloca el botón. */
  attempt: number;
  /** Ya no huye: es «Mejor otro día» y se puede pulsar. */
  still: boolean;
  /** false cuando la pregunta ya tuvo respuesta: el botón se desvanece. */
  active: boolean;
  /** Zonas que no puede pisar (el Sí con su tamaño máximo, el texto…). */
  avoid: () => Rect[];
  onDodge: () => void;
  onPress: () => void;
};

/** Márgenes de la pantalla: zonas seguras del móvil y la barra superior. */
function screenBounds(): Rect {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const safe = {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  };
  probe.remove();
  const top = (document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? safe.top + 56) + 8;
  const left = 12 + safe.left;
  return {
    x: left,
    y: top,
    w: window.innerWidth - left - 12 - safe.right,
    h: window.innerHeight - top - 14 - safe.bottom,
  };
}

/**
 * El botón No. Reacciona al empezar el toque (antes de que exista el clic), en
 * escritorio cuando el cursor se acerca, y con teclado. Huye a otro sitio de la
 * pantalla sin salirse ni pisar el Sí. Cuando se rinde («Mejor otro día»), se queda quieto.
 */
export function RunawayNo({ label, scale, attempt, still, active, avoid, onDodge, onPress }: Props) {
  const reduced = Boolean(useReducedMotion());
  const pointerFine = usePointerFine();
  const [detached, setDetached] = useState(false);
  // El hueco conserva el tamaño del «No» original: el Sí no se mueve al cambiar la frase.
  const [restLabel] = useState(label);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const fade = useMotionValue(1);
  const inlineRef = useRef<HTMLButtonElement | null>(null);
  const floatRef = useRef<HTMLButtonElement | null>(null);
  const pending = useRef<{ point: Point; keyboard: boolean } | null>(null);
  const lastDodge = useRef(-Infinity);
  const stillRef = useRef(still);
  const avoidRef = useRef(avoid);
  useEffect(() => {
    stillRef.current = still;
    avoidRef.current = avoid;
  });

  // Respondida la pregunta (o mientras aún no se puede responder), el botón se desvanece.
  useEffect(() => {
    animate(fade, active ? 1 : 0, active ? transition.enter : transition.exit);
  }, [active, fade]);

  const current = () => floatRef.current ?? inlineRef.current;

  const dodge = (point: Point, keyboard = false) => {
    if (stillRef.current || !active) return;
    const now = performance.now();
    if (now - lastDodge.current < 260) return; // un solo intento por gesto
    lastDodge.current = now;
    if (!floatRef.current && inlineRef.current) {
      // Primera huida: pasa a la capa superior exactamente donde estaba.
      const r = inlineRef.current.getBoundingClientRect();
      x.set(r.left - (inlineRef.current.offsetWidth * (1 - scale)) / 2);
      y.set(r.top - (inlineRef.current.offsetHeight * (1 - scale)) / 2);
      setDetached(true);
    }
    pending.current = { point, keyboard };
    onDodge();
  };

  // El escuchador táctil se registra una sola vez (Motion fija la ref del elemento):
  // por eso siempre llama a la versión más reciente de dodge.
  const dodgeRef = useRef(dodge);
  useEffect(() => {
    dodgeRef.current = dodge;
  });

  // Tras cambiar el texto y la escala, se mide y se busca un sitio nuevo.
  useLayoutEffect(() => {
    const el = floatRef.current;
    const job = pending.current;
    if (!el || !job) return;
    pending.current = null;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const s = still ? 1 : scale;
    const spot = chooseSpot({
      size: { w: w * s, h: h * s },
      bounds: screenBounds(),
      avoid: avoidRef.current(),
      from: job.point,
      prefer: still ? 'calm' : 'far',
    });
    const tx = spot.x - (w * (1 - s)) / 2;
    const ty = spot.y - (h * (1 - s)) / 2;
    if (job.keyboard) el.focus();
    if (reduced) {
      void animate(fade, 0, { duration: 0.12 }).then(() => {
        x.set(tx);
        y.set(ty);
        animate(fade, 1, transition.reduced);
      });
    } else {
      animate(x, tx, spring.buoy);
      animate(y, ty, spring.buoy);
    }
  }, [attempt, detached, still, scale, reduced, x, y, fade]);

  // Si la pantalla cambia de tamaño, que no quede fuera.
  useEffect(() => {
    if (!detached) return;
    const onResize = () => {
      const el = floatRef.current;
      if (!el) return;
      const b = screenBounds();
      x.set(Math.min(Math.max(x.get(), b.x), b.x + b.w - el.offsetWidth));
      y.set(Math.min(Math.max(y.get(), b.y), b.y + b.h - el.offsetHeight));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [detached, x, y]);

  // Con ratón: huye cuando el cursor se acerca, antes de rozarlo.
  useEffect(() => {
    if (!pointerFine || still || !active) return;
    const onMove = (e: PointerEvent) => {
      const el = current();
      if (!el) return;
      const r = el.getBoundingClientRect();
      const radius = Math.max(r.width, r.height) / 2 + 44;
      if (Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < radius) {
        dodge({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  });

  // Táctil: se escucha el touchstart nativo (no pasivo) para cancelar el clic antes de que exista.
  const touchRef = (el: HTMLButtonElement | null, slot: 'inline' | 'float') => {
    if (slot === 'inline') inlineRef.current = el;
    else floatRef.current = el;
    if (!el) return;
    const onTouch = (e: TouchEvent) => {
      if (stillRef.current) return;
      e.preventDefault();
      const t = e.touches[0];
      dodgeRef.current({ x: t.clientX, y: t.clientY });
    };
    el.addEventListener('touchstart', onTouch, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouch);
      if (slot === 'inline') inlineRef.current = null;
      else floatRef.current = null;
    };
  };

  const center = (el: HTMLElement): Point => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  const handlers = {
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (e.pointerType === 'touch' || still) return;
      e.preventDefault();
      dodge({ x: e.clientX, y: e.clientY });
    },
    onKeyDown: (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (still || (e.key !== 'Enter' && e.key !== ' ')) return;
      e.preventDefault();
      dodge(center(e.currentTarget), true);
    },
    onClick: (e: ReactMouseEvent<HTMLButtonElement>) => {
      if (still) onPress();
      else dodge(center(e.currentTarget), e.detail === 0);
    },
  };

  const className = `runaway-no ${still ? 'is-still' : ''}`;

  return (
    <>
      {/* Hueco en el pie de la carta: mientras no huye, el botón está aquí. */}
      <span className="runaway-no__slot" style={{ visibility: detached ? 'hidden' : undefined }}>
        {!detached && (
          <m.button
            type="button"
            ref={(el) => touchRef(el, 'inline')}
            className={className}
            initial={false}
            animate={{ scale }}
            transition={spring.buoy}
            {...handlers}
          >
            {label}
          </m.button>
        )}
        {detached && <span className="runaway-no runaway-no--ghost">{restLabel}</span>}
      </span>
      {detached &&
        createPortal(
          <m.button
            type="button"
            ref={(el) => touchRef(el, 'float')}
            className={`${className} runaway-no--floating`}
            style={{ x, y, opacity: fade, pointerEvents: active ? undefined : 'none' }}
            initial={false}
            animate={{ scale: still ? 1 : scale }}
            transition={spring.buoy}
            aria-hidden={!active || undefined}
            {...handlers}
          >
            {label}
          </m.button>,
          document.body,
        )}
    </>
  );
}
