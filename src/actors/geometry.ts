import type { Viewport } from '../hooks/useViewport.ts';
import { BANDS } from '../sea/waves.ts';

/** float = en primer plano (intro) · opening = abriéndose · away = pequeña en el horizonte. */
export type BottlePose = 'float' | 'opening' | 'away';

/** Proporciones del dibujo de la botella (viewBox 240 × 110). */
export const BOTTLE_VIEW = { width: 240, height: 110 } as const;
/** Punto de flotación dentro del dibujo: la línea del agua pasa por aquí. */
export const BOTTLE_ANCHOR = { x: 120, y: 70 } as const;
/** Largo de la carta enrollada dentro de la botella, en unidades del dibujo. */
export const LETTER_LENGTH = 102;
/** Inclinación de reposo: el cuello asoma un poco hacia arriba. */
export const BOTTLE_TILT = -8;

export type BottleGeometry = {
  /** Ancho de la botella en px. */
  width: number;
  /** Altura de la línea de agua (horizonte) en px desde arriba. */
  waterTop: number;
  float: { x: number; y: number };
  away: { x: number; y: number; scale: number };
};

const FRONT_BAND = BANDS.find((b) => b.id === 'front')!.top;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Dónde flota la botella en cada pose, en px de pantalla. La intro y el mar
 * usan esta misma función, así el botón invisible coincide con el dibujo.
 */
export function bottleGeometry({ width: W, height: H, horizon }: Viewport): BottleGeometry {
  const desktop = W >= 1024;
  const waterTop = H * horizon;
  const waterHeight = H - waterTop;
  return {
    width: desktop ? clamp(W * 0.27, 320, 440) : clamp(W * 0.58, 200, 260),
    waterTop,
    // Justo sobre la ola delantera: su cresta tapa el cuarto inferior, como al flotar de verdad.
    float: { x: W * (desktop ? 0.7 : 0.5), y: waterTop + waterHeight * FRONT_BAND - 6 },
    away: { x: W * (desktop ? 0.2 : 0.16), y: waterTop + waterHeight * 0.035, scale: desktop ? 0.16 : 0.2 },
  };
}
