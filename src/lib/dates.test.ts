import { describe, expect, it } from 'vitest';
import { config } from '../config.ts';
import type { Config, Place } from '../config.types.ts';
import { initialFlow } from '../state/flow.ts';
import {
  availableTimes,
  buildDays,
  daypartOf,
  formatDateLong,
  formatSlot,
  formatTimeSpoken,
  groupTimes,
  placeTimes,
  quipFor,
} from './dates.ts';
import { buildMessage, whatsappUrl } from './whatsapp.ts';

// TZ = America/Havana (vitest.setup.ts).
const schedule: Config['schedule'] = { ...config.schedule, excludedWeekdays: [], excludedDates: [] };
const sunsetPlace = config.places.find((p) => p.times === 'sunset')!;
const cafe: Place = { ...config.places[2], times: ['09:30', '10:30', '16:00'] };

describe('días', () => {
  const now = new Date(2026, 9, 4, 10, 0); // domingo 4 de octubre, 10:00

  it('empieza hoy y dura daysAhead días', () => {
    const days = buildDays(now, cafe, { ...schedule, daysAhead: 14 });
    expect(days).toHaveLength(14);
    expect(days[0]).toMatchObject({ iso: '2026-10-04', isToday: true, weekday: 'dom', day: 4, month: 'oct' });
    expect(days[1].isTomorrow).toBe(true);
    expect(days[13].iso).toBe('2026-10-17');
  });

  it('cruza el cambio de hora de Cuba (1 de noviembre) sin saltarse ni repetir días', () => {
    const days = buildDays(new Date(2026, 9, 30, 9, 0), cafe, { ...schedule, daysAhead: 5 });
    expect(days.map((d) => d.iso)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03']);
  });

  it('respeta los días de la semana y las fechas excluidas', () => {
    const days = buildDays(now, cafe, { ...schedule, excludedWeekdays: ['lunes'], excludedDates: ['2026-10-07'] });
    expect(days.find((d) => d.iso === '2026-10-05')).toMatchObject({ available: false });
    expect(days.find((d) => d.iso === '2026-10-07')).toMatchObject({ available: false });
    expect(days.find((d) => d.iso === '2026-10-06')?.available).toBe(true);
  });

  it('hoy oculta lo que ya pasó o empieza antes de minHoursAhead', () => {
    // A las 10:00 con 2 h de margen: fuera 9:30 y 10:30, queda 16:00.
    expect(availableTimes(cafe, '2026-10-04', now, schedule)).toEqual(['16:00']);
  });

  it('si hoy no queda ningún horario, el día aparece deshabilitado', () => {
    const late = new Date(2026, 9, 4, 15, 0);
    const [today] = buildDays(late, cafe, schedule);
    expect(today).toMatchObject({ isToday: true, available: false, reason: 'ya no quedan horarios' });
  });
});

describe('horarios', () => {
  it('el atardecer usa la puesta de sol real de Santa Clara (60 y 30 min antes)', () => {
    expect(placeTimes(sunsetPlace, '2026-10-04', schedule)).toEqual(['18:00', '18:30']);
    // Tras el cambio de hora la puesta es hacia las 17:42.
    expect(placeTimes(sunsetPlace, '2026-11-02', schedule)).toEqual(['16:45', '17:15']);
  });

  it('agrupa por franjas y las nombra', () => {
    expect(daypartOf('09:30')).toBe('morning');
    expect(daypartOf('18:30')).toBe('afternoon');
    expect(daypartOf('20:00')).toBe('night');
    expect(groupTimes(['09:30', '16:00', '20:00']).map((g) => g.label)).toEqual(['Mañana', 'Tarde', 'Noche']);
  });

  it('formatea como se dice', () => {
    expect(formatSlot('18:30', '12h')).toBe('6:30');
    expect(formatSlot('09:05', '24h')).toBe('9:05');
    expect(formatTimeSpoken('18:30', '12h')).toBe('6:30 de la tarde');
    expect(formatTimeSpoken('20:00', '12h')).toBe('8:00 de la noche');
    expect(formatTimeSpoken('10:30', '24h')).toBe('10:30');
    expect(formatDateLong('2026-10-09')).toBe('viernes, 9 de octubre');
    expect(formatDateLong('2026-10-09', true)).toBe('el viernes 9 de octubre');
  });

  it('guiño de luna llena el 26 de octubre', () => {
    const days = buildDays(new Date(2026, 9, 20, 9, 0), cafe, schedule);
    expect(quipFor(days.find((d) => d.iso === '2026-10-26')!)).toBe(config.quips.fullMoon);
  });
});

describe('WhatsApp', () => {
  const choice = { ...initialFlow.choice, placeId: 'atardecer', date: '2026-10-09', time: '18:00', note: '' };

  it('arma el mensaje con lugar, fecha y hora, y quita la línea de la nota si no hay', () => {
    const msg = buildMessage(choice);
    expect(msg).toContain('Atardecer frente al mar');
    expect(msg).toContain('Viernes, 9 de octubre');
    expect(msg).toContain('6:00 de la tarde');
    expect(msg).not.toContain('{nota}');
    expect(msg).not.toContain('📝');
  });

  it('el plan misterioso aparece como «Plan sorpresa» y la nota se incluye', () => {
    const msg = buildMessage({ ...choice, placeId: 'misterio', note: 'Llevo yo el postre' });
    expect(msg).toContain('Plan sorpresa');
    expect(msg).not.toContain('Plan misterioso');
    expect(msg).toContain('Llevo yo el postre');
  });

  it('codifica bien tildes, emojis y saltos de línea', () => {
    const url = whatsappUrl('¡Sí! 🌊\nMañana', '+53 5 123 4567');
    expect(url.startsWith('https://wa.me/5351234567?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1])).toBe('¡Sí! 🌊\nMañana');
  });
});
