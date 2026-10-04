import { describe, expect, it } from 'vitest';
import { moodAt } from './mood.ts';
import { moonIllumination, moonLitPath, moonPhase, moonPhaseName } from './moon.ts';
import { sunTimes } from './sun.ts';
import { zonedInstant } from './zone.ts';

// Santa Clara, Cuba. El dispositivo está en Tokio (vitest.setup.ts).
const LAT = 22.41;
const LON = -79.96;
const MINUTE = 60_000;
const TZ = 'America/Havana';

const localTime = (date: Date) =>
  new Intl.DateTimeFormat('es', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);

describe('puesta de sol en Santa Clara', () => {
  it('el 4 de octubre de 2026 es hacia las 19:04 (UTC−4)', () => {
    const sun = sunTimes(new Date(2026, 9, 4, 12), LAT, LON)!;
    expect(Math.abs(sun.sunset.getTime() - Date.UTC(2026, 9, 4, 23, 4)) / MINUTE).toBeLessThan(4);
    expect(localTime(sun.sunset)).toMatch(/^19:0\d$/);
  });

  it('el 1 de noviembre Cuba atrasa la hora y la puesta pasa a las 17:4x', () => {
    const before = sunTimes(new Date(2026, 9, 31, 12), LAT, LON)!;
    const after = sunTimes(new Date(2026, 10, 1, 12), LAT, LON)!;
    expect(localTime(before.sunset)).toMatch(/^18:4\d$/);
    expect(localTime(after.sunset)).toMatch(/^17:4\d$/);
  });

  it('el amanecer va antes que la puesta', () => {
    const sun = sunTimes(new Date(2026, 5, 21, 12), LAT, LON)!;
    expect(sun.sunrise.getTime()).toBeLessThan(sun.sunset.getTime());
  });
});

describe('fase lunar', () => {
  // Fechas reales de 2026 (incluidos los eclipses): el error debe ser < 1 día.
  const cases: [string, Date, 0 | 0.5][] = [
    ['luna llena del eclipse lunar', new Date(Date.UTC(2026, 2, 3, 11, 38)), 0.5],
    ['luna nueva del eclipse solar', new Date(Date.UTC(2026, 7, 12, 17, 37)), 0],
    ['luna nueva de octubre', new Date(Date.UTC(2026, 9, 10, 15, 50)), 0],
    ['luna llena de octubre', new Date(Date.UTC(2026, 9, 26, 4, 12)), 0.5],
  ];

  it.each(cases)('%s', (_name, date, expected) => {
    const phase = moonPhase(date);
    const distance = Math.min(Math.abs(phase - expected), 1 - Math.abs(phase - expected));
    expect(distance * 29.53).toBeLessThan(1);
  });

  it('nombra las fases en español', () => {
    expect(moonPhaseName(0)).toBe('Luna nueva');
    expect(moonPhaseName(0.5)).toBe('Luna llena');
    expect(moonPhaseName(0.25)).toBe('Cuarto creciente');
    expect(moonPhaseName(0.12)).toBe('Luna creciente');
    expect(moonPhaseName(0.62)).toBe('Gibosa menguante');
  });

  it('dibuja: nada en luna nueva, el lado derecho en creciente y al revés en el sur', () => {
    expect(moonLitPath(0, 10)).toBe('');
    expect(moonIllumination(0.5)).toBeCloseTo(1);
    expect(moonLitPath(0.1, 10)).toContain('A10 10 0 0 1 0 10'); // borde derecho
    expect(moonLitPath(0.1, 10, true)).toContain('A10 10 0 0 0 0 10'); // borde izquierdo
  });
});

describe('hora del cielo', () => {
  const at = (h: number, m = 0) => moodAt(zonedInstant('2026-10-04', `${h}:${m}`, TZ), LAT, LON, TZ);
  it('sigue la puesta de sol real', () => {
    expect(at(5, 0)).toBe('night');
    expect(at(8, 30)).toBe('morning');
    expect(at(14, 0)).toBe('day');
    expect(at(18, 15)).toBe('sunset');
    expect(at(19, 20)).toBe('sunset');
    expect(at(19, 45)).toBe('night');
  });
});
