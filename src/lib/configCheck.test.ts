import { describe, expect, it } from 'vitest';
import { config } from '../config.ts';
import type { Config } from '../config.types.ts';
import { checkConfig, findTodos } from './configCheck.ts';

const clone = (): Config => structuredClone(config);

describe('config.ts real', () => {
  it('no tiene errores de formato', () => {
    expect(checkConfig(config)).toEqual([]);
  });
});

describe('findTodos', () => {
  it('encuentra los TODO con su ruta', () => {
    expect(findTodos({ a: 'TODO', b: ['ok', 'TODO: algo'], c: { d: 'listo' } })).toEqual([
      'config.a',
      'config.b[1]',
    ]);
  });

  it('no confunde palabras que contienen todo', () => {
    expect(findTodos({ a: 'Todo el tiempo del mundo', b: 'TODOS' })).toEqual([]);
  });
});

describe('checkConfig', () => {
  it('rechaza un número con "+" o espacios', () => {
    const c = clone();
    c.sender.whatsapp = '+53 5 123 4567';
    expect(checkConfig(c)).toEqual([expect.stringContaining('sender.whatsapp')]);
  });

  it('acepta un número cubano bien escrito', () => {
    const c = clone();
    c.sender.whatsapp = '5351234567';
    expect(checkConfig(c)).toEqual([]);
  });

  it('detecta horas mal escritas e ids repetidos', () => {
    const c = clone();
    c.places[1].times = ['7:30', '25:00'];
    c.places[2].id = c.places[0].id;
    const problems = checkConfig(c);
    expect(problems.some((p) => p.includes('"7:30"'))).toBe(true);
    expect(problems.some((p) => p.includes('"25:00"'))).toBe(true);
    expect(problems.some((p) => p.includes('repetido'))).toBe(true);
  });

  it('detecta fechas excluidas con formato incorrecto', () => {
    const c = clone();
    c.schedule.excludedDates = ['12/10/2026'];
    expect(checkConfig(c)).toEqual([expect.stringContaining('schedule.excludedDates')]);
  });
});
