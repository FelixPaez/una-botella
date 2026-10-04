import type { Config, LetterAdvance, PlaceIllustration, Weekday } from '../config.types.ts';

/** Rutas de config.ts cuyos textos todavía contienen "TODO". */
export function findTodos(value: unknown, path = 'config'): string[] {
  if (typeof value === 'string') return /\bTODO\b/.test(value) ? [path] : [];
  if (Array.isArray(value)) return value.flatMap((item, i) => findTodos(item, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => findTodos(item, `${path}.${key}`));
  }
  return [];
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ADVANCES: LetterAdvance[] = ['tap', 'hold', 'swipe'];
const ILLUSTRATIONS: PlaceIllustration[] = ['sunset', 'picnic', 'cafe', 'night-walk', 'mystery'];
const WEEKDAYS: Weekday[] = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

/**
 * Errores de formato en config.ts, explicados en español.
 * Los TODO no cuentan como error (los avisa la cinta de BORRADOR).
 */
export function checkConfig(config: Config): string[] {
  const problems: string[] = [];
  const add = (where: string, what: string) => problems.push(`${where}: ${what}`);
  const isTodo = (text: string) => /\bTODO\b/.test(text);

  const phone = config.sender.whatsapp;
  if (!isTodo(phone) && !/^\d{8,15}$/.test(phone)) {
    add('sender.whatsapp', 'debe tener solo dígitos, con el código de país y sin "+" (ej. 5351234567)');
  }

  const pages = config.letter.pages;
  if (pages.length < 1 || pages.length > 4) add('letter.pages', 'la carta debe tener entre 1 y 4 páginas');
  pages.forEach((page, i) => {
    if (!ADVANCES.includes(page.advance)) add(`letter.pages[${i}].advance`, `usa ${ADVANCES.join(', ')}`);
    if (!page.text.trim()) add(`letter.pages[${i}].text`, 'la página está vacía');
  });

  if (config.noButton.maxAttempts < 1) add('noButton.maxAttempts', 'debe ser 1 o más');
  if (config.noButton.phrases.length === 0) add('noButton.phrases', 'hace falta al menos una frase');

  if (config.places.length === 0) add('places', 'hace falta al menos un lugar');
  const ids = new Set<string>();
  config.places.forEach((place, i) => {
    const where = `places[${i}]`;
    if (!place.id.trim()) add(`${where}.id`, 'falta el id');
    if (ids.has(place.id)) add(`${where}.id`, `el id "${place.id}" está repetido`);
    ids.add(place.id);
    if (!ILLUSTRATIONS.includes(place.illustration)) {
      add(`${where}.illustration`, `usa ${ILLUSTRATIONS.join(', ')}`);
    }
    if (Array.isArray(place.times)) {
      place.times.forEach((t) => TIME.test(t) || add(`${where}.times`, `"${t}" no es una hora HH:MM (24 h)`));
    }
    if (place.image && /^\//.test(place.image)) {
      add(`${where}.image`, 'escribe la ruta sin "/" inicial (ej. places/atardecer.webp)');
    }
  });

  const s = config.schedule;
  if (s.daysAhead < 1 || s.daysAhead > 60) add('schedule.daysAhead', 'debe estar entre 1 y 60');
  if (s.minHoursAhead < 0) add('schedule.minHoursAhead', 'no puede ser negativo');
  s.defaultTimes.forEach((t) => TIME.test(t) || add('schedule.defaultTimes', `"${t}" no es una hora HH:MM`));
  s.excludedDates.forEach((d) => DATE.test(d) || add('schedule.excludedDates', `"${d}" no es AAAA-MM-DD`));
  s.excludedWeekdays.forEach((d) => WEEKDAYS.includes(d) || add('schedule.excludedWeekdays', `"${d}" no es un día`));
  Object.entries(s.dayparts).forEach(([k, t]) => TIME.test(t) || add(`schedule.dayparts.${k}`, `"${t}" no es HH:MM`));

  if (config.sound.volume < 0 || config.sound.volume > 1) add('sound.volume', 'debe estar entre 0 y 1');
  if (Math.abs(config.location.latitude) > 90 || Math.abs(config.location.longitude) > 180) {
    add('location', 'latitud o longitud fuera de rango');
  }
  try {
    new Intl.DateTimeFormat('es', { timeZone: config.location.timeZone });
  } catch {
    add('location.timeZone', `"${config.location.timeZone}" no es una zona horaria (ej. "America/Havana")`);
  }

  return problems;
}
