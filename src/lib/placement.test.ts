import { describe, expect, it } from 'vitest';
import { seeded } from '../sea/waves.ts';
import { chooseSpot, inflate, intersects, scaleRect, type Rect } from './placement.ts';

// Un móvil de 390 × 844 con la barra arriba, el título y el Sí ya crecido.
const bounds: Rect = { x: 12, y: 72, w: 366, h: 760 };
const yes = inflate(scaleRect({ x: 100, y: 640, w: 90, h: 52 }, 1.3), 16);
const title: Rect = { x: 40, y: 260, w: 310, h: 150 };
const size = { w: 140, h: 46 };

describe('dónde se esconde el No', () => {
  it('nunca se sale de la pantalla ni pisa el Sí o el título (500 intentos)', () => {
    const random = seeded(42);
    for (let i = 0; i < 500; i++) {
      const from = { x: random() * 390, y: random() * 844 };
      const p = chooseSpot({ size, bounds, avoid: [yes, title], from, random });
      const box = { ...p, ...size };
      expect(box.x).toBeGreaterThanOrEqual(bounds.x);
      expect(box.y).toBeGreaterThanOrEqual(bounds.y);
      expect(box.x + box.w).toBeLessThanOrEqual(bounds.x + bounds.w + 0.001);
      expect(box.y + box.h).toBeLessThanOrEqual(bounds.y + bounds.h + 0.001);
      expect(intersects(box, yes)).toBe(false);
      expect(intersects(box, title)).toBe(false);
    }
  });

  it('se va lejos del dedo', () => {
    const random = seeded(7);
    const from = { x: 60, y: 120 };
    const p = chooseSpot({ size, bounds, avoid: [yes], from, random });
    expect(Math.hypot(p.x + size.w / 2 - from.x, p.y + size.h / 2 - from.y)).toBeGreaterThan(300);
  });

  it('en modo tranquilo se queda abajo y centrado', () => {
    const p = chooseSpot({ size, bounds, avoid: [yes], from: { x: 0, y: 0 }, prefer: 'calm', random: seeded(3) });
    expect(p.y + size.h / 2).toBeGreaterThan(bounds.y + bounds.h * 0.6);
  });

  it('el Sí crecido se calcula alrededor de su centro', () => {
    expect(scaleRect({ x: 0, y: 0, w: 100, h: 50 }, 2)).toEqual({ x: -50, y: -25, w: 200, h: 100 });
  });
});
