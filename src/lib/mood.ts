import { sunTimes } from './sun.ts';
import { isoDateIn, wallTime, zonedInstant } from './zone.ts';

/** Hora del día del mar. */
export type Mood = 'morning' | 'day' | 'sunset' | 'night';

const MINUTE = 60_000;

/**
 * Cómo está el cielo en ese momento y lugar, según la puesta de sol real:
 * mañana hasta las 11:00, atardecer desde 75 min antes de la puesta hasta
 * 25 min después, y noche hasta media hora antes del amanecer. Con `timeZone`,
 * el día y las 11:00 son los de allí y no los del dispositivo.
 */
export function moodAt(date: Date, latitude: number, longitude: number, timeZone?: string): Mood {
  const { year, month, day } = wallTime(date, timeZone);
  const sun = sunTimes(new Date(year, month - 1, day), latitude, longitude);
  if (!sun) return 'day';
  const t = date.getTime();
  const eleven = zonedInstant(isoDateIn(date, timeZone), '11:00', timeZone).getTime();
  if (t < sun.sunrise.getTime() - 30 * MINUTE) return 'night';
  if (t < eleven) return 'morning';
  if (t < sun.sunset.getTime() - 75 * MINUTE) return 'day';
  if (t < sun.sunset.getTime() + 25 * MINUTE) return 'sunset';
  return 'night';
}
