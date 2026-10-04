export type Rect = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };

export const intersects = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export const inflate = (r: Rect, by: number): Rect => ({ x: r.x - by, y: r.y - by, w: r.w + by * 2, h: r.h + by * 2 });

/** Escala un rectángulo alrededor de su centro (para prever cuánto crecerá el Sí). */
export const scaleRect = (r: Rect, s: number): Rect => ({
  x: r.x + (r.w * (1 - s)) / 2,
  y: r.y + (r.h * (1 - s)) / 2,
  w: r.w * s,
  h: r.h * s,
});

type Options = {
  /** Tamaño visible del botón (ya escalado). */
  size: { w: number; h: number };
  /** Zona permitida (la pantalla menos márgenes y zonas seguras). */
  bounds: Rect;
  /** Zonas prohibidas: el Sí (con su tamaño futuro), el título, la barra superior… */
  avoid: Rect[];
  /** Dónde está el dedo o el cursor. */
  from: Point;
  /** far = lo más lejos posible del dedo (con algo de azar) · calm = abajo y centrado. */
  prefer?: 'far' | 'calm';
  random?: () => number;
};

/**
 * Elige dónde poner el botón No: dentro de la pantalla, sin pisar nada prohibido
 * y lejos del dedo. Devuelve la esquina superior izquierda de su caja visible.
 */
export function chooseSpot({ size, bounds, avoid, from, prefer = 'far', random = Math.random }: Options): Point {
  const maxX = bounds.x + Math.max(0, bounds.w - size.w);
  const maxY = bounds.y + Math.max(0, bounds.h - size.h);
  const calmTarget = { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h * 0.82 };
  const score = (p: Point) => {
    const c = { x: p.x + size.w / 2, y: p.y + size.h / 2 };
    if (prefer === 'calm') return -Math.hypot(c.x - calmTarget.x, c.y - calmTarget.y);
    return Math.hypot(c.x - from.x, c.y - from.y) + random() * 90;
  };
  const free = (p: Point) => !avoid.some((r) => intersects({ ...p, ...size }, r));

  let best: Point | null = null;
  let bestScore = -Infinity;
  const consider = (p: Point) => {
    if (!free(p)) return;
    const s = score(p);
    if (s > bestScore) {
      best = p;
      bestScore = s;
    }
  };

  for (let i = 0; i < 48; i++) consider({ x: bounds.x + random() * (maxX - bounds.x), y: bounds.y + random() * (maxY - bounds.y) });
  // Si el azar no encontró hueco (pantalla muy llena), se prueba una rejilla fija.
  if (!best) {
    for (let gx = 0; gx <= 6; gx++) {
      for (let gy = 0; gy <= 10; gy++) {
        consider({ x: bounds.x + ((maxX - bounds.x) * gx) / 6, y: bounds.y + ((maxY - bounds.y) * gy) / 10 });
      }
    }
  }
  return best ?? { x: bounds.x, y: maxY };
}
