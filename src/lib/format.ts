import { config } from '../config.ts';

/** '18:30' → «6:30 p. m.» (12 h) o «18:30» (24 h), según config.timeFormat. */
export function formatTime(time: string, format = config.timeFormat): string {
  const [h, m] = time.split(':').map(Number);
  const date = new Date(2000, 0, 1, h, m);
  return new Intl.DateTimeFormat('es', {
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: format === '12h' ? 'h12' : 'h23',
  }).format(date);
}

/** Sustituye {nombre} y {remitente} en los textos de config.ts. */
export function fill(text: string): string {
  return text.replaceAll('{nombre}', config.recipient.name).replaceAll('{remitente}', config.sender.name);
}
