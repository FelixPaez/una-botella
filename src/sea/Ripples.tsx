import { useEffect, useRef } from 'react';
import { cssEase, ease } from '../design/motion.ts';
import { prefersReducedMotion } from '../lib/device.ts';
import { seaBus } from './seaBus.ts';

/** Fracción de la pantalla donde está el horizonte (sale de la variable CSS --horizon). */
function readHorizon(): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--horizon');
  const fraction = parseFloat(value) / 100;
  return Number.isFinite(fraction) ? fraction : 0.44;
}

const SPARKLE_SVG =
  '<svg viewBox="-10 -10 20 20" width="18" height="18"><path d="M0-9C.8-2 2-.8 9 0 2 .8.8 2 0 9-.8 2-2 .8-9 0-2-.8-.8-2 0-9z" fill="currentColor"/></svg>';

/**
 * Al tocar el agua: una onda y unas burbujitas desde el dedo. Al tocar el cielo: un destello.
 * Los elementos se reutilizan (pool) y se animan con la Web Animations API: sin React, sin basura.
 */
export function Ripples({ lite }: { lite: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    const make = (className: string, count: number, html = '') =>
      Array.from({ length: count }, () => {
        const el = document.createElement('div');
        el.className = className;
        el.innerHTML = html;
        layer.appendChild(el);
        return el;
      });
    const rings = make('ripple', 6);
    const drops = make('touch-bubble', 12);
    const sparkles = make('sparkle', 3, SPARKLE_SVG);
    let r = 0;
    let d = 0;
    let s = 0;
    let horizon = readHorizon();
    const reduced = prefersReducedMotion();
    const easing = cssEase(ease.surface);
    const at = (x: number, y: number, scale = 1, rotate = 0) =>
      `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`;

    const ripple = (x: number, y: number) => {
      if (reduced) {
        rings[r++ % rings.length].animate(
          [
            { opacity: 0.6, transform: at(x, y) },
            { opacity: 0, transform: at(x, y) },
          ],
          { duration: 600 },
        );
        return;
      }
      rings[r++ % rings.length].animate(
        [
          { opacity: 0.9, transform: at(x, y, 0.15) },
          { opacity: 0, transform: at(x, y, 1.7) },
        ],
        { duration: 1100, easing },
      );
      rings[r++ % rings.length].animate(
        [
          { opacity: 0.6, transform: at(x, y, 0.1) },
          { opacity: 0, transform: at(x, y, 1.2) },
        ],
        { duration: 1000, delay: 140, easing },
      );
      for (let i = 0; i < (lite ? 2 : 3); i++) {
        const size = 0.5 + Math.random() * 0.7;
        const dx = (Math.random() - 0.5) * 30;
        const rise = 60 + Math.random() * 70;
        drops[d++ % drops.length].animate(
          [
            { opacity: 0, transform: at(x, y, size) },
            { opacity: 1, transform: at(x + dx * 0.2, y - rise * 0.15, size), offset: 0.15 },
            { opacity: 0, transform: at(x + dx, y - rise, size) },
          ],
          { duration: 1300 + Math.random() * 500, delay: i * 60, easing },
        );
      }
    };

    const sparkle = (x: number, y: number) => {
      sparkles[s++ % sparkles.length].animate(
        reduced
          ? [{ opacity: 0.8, transform: at(x, y) }, { opacity: 0, transform: at(x, y) }]
          : [
              { opacity: 0, transform: at(x, y, 0, 0) },
              { opacity: 1, transform: at(x, y, 1, 45), offset: 0.4 },
              { opacity: 0, transform: at(x, y, 0.2, 90) },
            ],
        { duration: 700, easing },
      );
    };

    const touch = (x: number, y: number) => {
      if (y > horizon * window.innerHeight) ripple(x, y);
      else sparkle(x, y);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      touch(e.clientX, e.clientY);
    };
    const onResize = () => {
      horizon = readHorizon();
    };
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    const off = seaBus.on((event) => {
      if (event.type === 'ripple') touch(event.x, event.y);
    });

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', onResize);
      off();
      layer.replaceChildren();
    };
  }, [lite]);

  return <div ref={ref} className="ripples" />;
}
