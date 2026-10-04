import { sunTimes } from './sun.ts';

/** Hora del día del mar. */
export type Mood = 'morning' | 'day' | 'sunset' | 'night';

const MINUTE = 60_000;

/**
 * Cómo está el cielo en ese momento y lugar, según la puesta de sol real:
 * mañana hasta las 11:00, atardecer desde 75 min antes de la puesta hasta
 * 25 min después, y noche hasta media hora antes del amanecer.
 */
export function moodAt(date: Date, latitude: number, longitude: number): Mood {
  const sun = sunTimes(date, latitude, longitude);
  if (!sun) return 'day';
  const t = date.getTime();
  const eleven = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 11).getTime();
  if (t < sun.sunrise.getTime() - 30 * MINUTE) return 'night';
  if (t < eleven) return 'morning';
  if (t < sun.sunset.getTime() - 75 * MINUTE) return 'day';
  if (t < sun.sunset.getTime() + 25 * MINUTE) return 'sunset';
  return 'night';
}
