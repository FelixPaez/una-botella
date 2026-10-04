import { config } from '../config.ts';
import type { Place } from '../config.types.ts';
import type { Choice } from '../state/flow.ts';
import { capitalize, formatDateLong, formatTimeSpoken } from './dates.ts';

/** Nombre del plan tal como sale en el mensaje (el misterioso se queda en secreto). */
export const placeLabel = (place: Place | undefined) =>
  place ? (place.mystery ? config.whatsapp.mysteryLabel : place.name) : '';

/** El mensaje que ella te envía, a partir de la plantilla de config.ts. */
export function buildMessage(choice: Choice, places: Place[] = config.places): string {
  const place = places.find((p) => p.id === choice.placeId);
  const note = choice.note.trim();
  const values: Record<string, string> = {
    '{lugar}': placeLabel(place),
    '{fecha}': capitalize(formatDateLong(choice.date)),
    '{hora}': choice.time ? formatTimeSpoken(choice.time) : '',
    '{nota}': note,
  };
  return config.whatsapp.template
    .filter((line) => !(line.includes('{nota}') && !note))
    .map((line) => Object.entries(values).reduce((text, [key, value]) => text.replaceAll(key, value), line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Enlace de WhatsApp con el mensaje ya escrito: ella solo tiene que pulsar enviar. */
export function whatsappUrl(message: string, phone: string = config.sender.whatsapp): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}
