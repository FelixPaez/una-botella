import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cssEase, dur, ease } from './motion.ts';

const theme = readFileSync(new URL('../styles/theme.css', import.meta.url), 'utf8');
const cssVar = (name: string) => theme.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1]?.trim();

describe('tokens de movimiento', () => {
  it.each(Object.entries(ease))('la curva %s coincide en CSS y en TS', (name, curve) => {
    expect(cssVar(`ease-${name}`)).toBe(cssEase(curve));
  });

  it.each(Object.entries(dur))('la duración %s coincide en CSS y en TS', (name, seconds) => {
    expect(cssVar(`duration-${name}`)).toBe(`${Math.round(seconds * 1000)}ms`);
  });
});
