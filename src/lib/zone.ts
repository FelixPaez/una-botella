/**
 * La hora «de pared» del lugar (Santa Clara), sea cual sea la zona horaria del
 * dispositivo: los horarios del plan son los de allí aunque se mire desde Madrid.
 */
export type WallTime = { year: number; month: number; day: number; hour: number; minute: number };

const formatters = new Map<string, Intl.DateTimeFormat | null>();

function formatterFor(timeZone: string): Intl.DateTimeFormat | null {
  if (!formatters.has(timeZone)) {
    let formatter: Intl.DateTimeFormat | null = null;
    try {
      formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });
    } catch {
      // zona desconocida para este navegador: se usa la del dispositivo
    }
    formatters.set(timeZone, formatter);
  }
  return formatters.get(timeZone) ?? null;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Año, mes (1–12), día, hora y minuto de ese instante en esa zona. */
export function wallTime(date: Date, timeZone?: string): WallTime {
  const formatter = timeZone ? formatterFor(timeZone) : null;
  if (!formatter) {
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(), hour: date.getHours(), minute: date.getMinutes() };
  }
  const parts: Record<string, number> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  return { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour % 24, minute: parts.minute };
}

/** El día AAAA-MM-DD de ese instante en esa zona. */
export const isoDateIn = (date: Date, timeZone?: string) => {
  const w = wallTime(date, timeZone);
  return `${w.year}-${pad(w.month)}-${pad(w.day)}`;
};

/** El instante en que en esa zona son las `time` ('HH:MM') del día `iso`. */
export function zonedInstant(iso: string, time: string, timeZone?: string): Date {
  const [y, mo, d] = iso.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  if (!timeZone || !formatterFor(timeZone)) return new Date(y, mo - 1, d, h, mi);
  const target = Date.UTC(y, mo - 1, d, h, mi);
  // Se corrige por la diferencia horaria; dos pasadas bastan también los días de cambio de hora.
  let t = target;
  for (let i = 0; i < 2; i++) {
    const w = wallTime(new Date(t), timeZone);
    t += target - Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
  }
  return new Date(t);
}
