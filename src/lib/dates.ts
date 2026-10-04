import { config } from '../config.ts';
import type { Config, Place, Weekday } from '../config.types.ts';
import { moonIllumination, moonPhase } from './moon.ts';
import { moodAt, type Mood } from './mood.ts';
import { sunTimes } from './sun.ts';
import { isoDateIn, wallTime, zonedInstant } from './zone.ts';

type Schedule = Config['schedule'];
type Location = Config['location'];
export type Daypart = 'morning' | 'afternoon' | 'night';

/** Índice = Date.getDay() (0 = domingo). */
const WEEKDAYS: Weekday[] = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DAYPART_LABEL: Record<Daypart, string> = { morning: 'Mañana', afternoon: 'Tarde', night: 'Noche' };
const DAYPART_SPOKEN: Record<Daypart, string> = { morning: 'de la mañana', afternoon: 'de la tarde', night: 'de la noche' };

const pad = (n: number) => String(n).padStart(2, '0');
const minutesOf = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** El día de hoy (AAAA-MM-DD) en el lugar de la cita, no en el del dispositivo. */
export const todayIn = (now: Date, location: Location = config.location) => isoDateIn(now, location.timeZone);

/** Aritmética de calendario (no sumar 24 h): así el cambio de hora no descuadra los días. */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Ese día a medianoche del dispositivo: solo para saber qué día de la semana es y nombrarlo. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** El instante de ese día a esa hora 'HH:MM' en el lugar de la cita. */
export const atTime = (iso: string, time: string, location: Location = config.location): Date =>
  zonedInstant(iso, time, location.timeZone);

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** «jueves, 9 de octubre» · con artículo: «el jueves 9 de octubre». */
export function formatDateLong(iso: string | null, withArticle = false): string {
  if (!iso) return '';
  const date = fromISODate(iso);
  const weekday = new Intl.DateTimeFormat('es', { weekday: 'long' }).format(date);
  const dayMonth = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' }).format(date);
  return withArticle ? `el ${weekday} ${dayMonth}` : `${weekday}, ${dayMonth}`;
}

export function daypartOf(time: string, schedule: Schedule = config.schedule): Daypart {
  const t = minutesOf(time);
  const { morning, afternoon, night } = schedule.dayparts;
  if (t >= minutesOf(night) || t < minutesOf(morning)) return 'night';
  return t >= minutesOf(afternoon) ? 'afternoon' : 'morning';
}

/** Para los chips: «6:30» (12 h, ya va bajo su franja) o «18:30». */
export function formatSlot(time: string, format: Config['timeFormat'] = config.timeFormat): string {
  const [h, m] = time.split(':').map(Number);
  if (format === '24h') return `${h}:${pad(m)}`;
  return `${h % 12 || 12}:${pad(m)}`;
}

/** Para frases: «6:30 de la tarde» (12 h) o «18:30». */
export function formatTimeSpoken(time: string, format: Config['timeFormat'] = config.timeFormat): string {
  if (format === '24h') return formatSlot(time, '24h');
  return `${formatSlot(time, '12h')} ${DAYPART_SPOKEN[daypartOf(time)]}`;
}

const roundTo15 = (d: Date, timeZone: string) => {
  const { hour, minute } = wallTime(d, timeZone);
  const total = Math.round((hour * 60 + minute) / 15) * 15;
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
};

/** Horarios de un lugar ese día: los suyos, los del atardecer real o los de por defecto. */
export function placeTimes(
  place: Place | undefined,
  iso: string,
  schedule: Schedule = config.schedule,
  location: Location = config.location,
): string[] {
  let times: string[];
  if (place?.times === 'sunset') {
    const sun = sunTimes(fromISODate(iso), location.latitude, location.longitude);
    times = sun
      ? schedule.sunsetOffsetsMinutes.map((offset) => roundTo15(new Date(sun.sunset.getTime() - offset * 60_000), location.timeZone))
      : schedule.defaultTimes;
  } else {
    times = place?.times?.length ? place.times : schedule.defaultTimes;
  }
  return [...new Set(times)].sort((a, b) => minutesOf(a) - minutesOf(b));
}

/** Los horarios que todavía valen: si es hoy, solo los que empiezan pasadas `minHoursAhead` horas. */
export function availableTimes(
  place: Place | undefined,
  iso: string,
  now: Date,
  schedule: Schedule = config.schedule,
  location: Location = config.location,
): string[] {
  const times = placeTimes(place, iso, schedule, location);
  if (iso !== todayIn(now, location)) return times;
  const limit = now.getTime() + schedule.minHoursAhead * 3_600_000;
  return times.filter((t) => atTime(iso, t, location).getTime() >= limit);
}

export type Day = {
  iso: string;
  /** «lun», «mar»… */
  weekday: string;
  weekdayLong: string;
  day: number;
  /** «oct», «nov»… */
  month: string;
  isToday: boolean;
  isTomorrow: boolean;
  isWeekend: boolean;
  /** Fase lunar esa noche (para el icono). */
  moon: number;
  times: string[];
  available: boolean;
  /** Por qué no se puede elegir (para lectores de pantalla). */
  reason?: string;
};

const shortWeekday = new Intl.DateTimeFormat('es', { weekday: 'short' });
const longWeekday = new Intl.DateTimeFormat('es', { weekday: 'long' });
const shortMonth = new Intl.DateTimeFormat('es', { month: 'short' });
const trimDot = (text: string) => text.replace(/\.$/, '');

/** Los días que se pueden elegir, desde hoy (hoy en Santa Clara), calculados en el móvil de ella. */
export function buildDays(
  now: Date,
  place: Place | undefined,
  schedule: Schedule = config.schedule,
  location: Location = config.location,
): Day[] {
  const today = todayIn(now, location);
  const tomorrow = addDays(today, 1);
  return Array.from({ length: schedule.daysAhead }, (_, i) => {
    const iso = addDays(today, i);
    const date = fromISODate(iso);
    const weekdayName = WEEKDAYS[date.getDay()];
    const excluded = schedule.excludedWeekdays.includes(weekdayName) || schedule.excludedDates.includes(iso);
    const times = excluded ? [] : availableTimes(place, iso, now, schedule, location);
    return {
      iso,
      weekday: trimDot(shortWeekday.format(date)),
      weekdayLong: longWeekday.format(date),
      day: date.getDate(),
      month: trimDot(shortMonth.format(date)),
      isToday: iso === today,
      isTomorrow: iso === tomorrow,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      moon: moonPhase(atTime(iso, '21:00', location)),
      times,
      available: times.length > 0,
      reason: excluded ? 'ese día no está disponible' : times.length === 0 ? 'ya no quedan horarios' : undefined,
    };
  });
}

export function groupTimes(times: string[], schedule: Schedule = config.schedule) {
  return (['morning', 'afternoon', 'night'] as const)
    .map((key) => ({ key, label: DAYPART_LABEL[key], times: times.filter((t) => daypartOf(t, schedule) === key) }))
    .filter((group) => group.times.length > 0);
}

/** Cómo estará el cielo a esa hora (el mar se pone así al elegirla). */
export const moodForChoice = (iso: string, time: string, location: Location = config.location): Mood =>
  moodAt(atTime(iso, time, location), location.latitude, location.longitude, location.timeZone);

/** Guiño según el día elegido (luna llena, luna nueva, hoy mismo, fin de semana). */
export function quipFor(day: Day): string | null {
  const light = moonIllumination(day.moon);
  if (light > 0.97) return config.quips.fullMoon;
  if (light < 0.03) return config.quips.newMoon;
  if (day.isToday) return config.quips.today;
  if (day.isWeekend) return config.quips.weekend;
  return null;
}

export { capitalize };
