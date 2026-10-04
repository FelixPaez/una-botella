/**
 * Tipos del contenido editable.
 * No necesitas tocar este archivo: todo lo que se cambia está en `src/config.ts`.
 */

export type Weekday = 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado' | 'domingo';

/** Ilustraciones SVG de respaldo disponibles (una por tipo de plan). */
export type PlaceIllustration = 'sunset' | 'picnic' | 'cafe' | 'night-walk' | 'mystery';

/** Gesto con el que se pasa a la siguiente página de la carta. */
export type LetterAdvance = 'tap' | 'hold' | 'swipe';

/** Texto de ayuda en dos versiones: pantalla táctil y ratón. */
export type Hint = { touch: string; mouse: string };

/** Franja horaria en formato 24 h: desde `from` hasta `to`, ambas incluidas. */
export type TimeWindow = { from: string; to: string };

export type Place = {
  id: string;
  name: string;
  /** Frase corta que aparece en la postal. */
  tagline: string;
  description: string;
  /** Ruta dentro de `public/` (ej. 'places/atardecer.webp'). Si falta, se usa la ilustración. */
  image?: string;
  /** Descripción de la foto para lectores de pantalla (por defecto, el nombre del plan). */
  imageAlt?: string;
  /** Encuadre de la foto, como en CSS `object-position` (ej. 'center 30%'). */
  imageFocus?: string;
  /** Ilustración SVG de respaldo (y fondo mientras carga la foto). */
  illustration: PlaceIllustration;
  /**
   * Cuándo se puede quedar (formato 24 h):
   * - una franja, `{ from: '15:00', to: '18:00' }`: ella elige cualquier hora dentro, cada `schedule.stepMinutes`;
   * - `'sunset'`: una franja que se calcula sola cada día alrededor de la puesta de sol real;
   * - una lista fija, `['16:00', '17:30']`: solo esas horas.
   * Si no se indica, se usa `schedule.defaultWindow`.
   */
  times?: TimeWindow | 'sunset' | string[];
  /** Postal boca abajo que se voltea al tocarla. */
  mystery?: boolean;
};

export type Config = {
  recipient: { name: string };
  sender: {
    name: string;
    /** WhatsApp en formato internacional, solo dígitos y sin "+". */
    whatsapp: string;
  };
  meta: {
    title: string;
    description: string;
    /** URL pública completa terminada en "/". Si no se indica, se calcula sola en GitHub Pages. */
    siteUrl?: string;
  };
  /** `timeZone`: zona horaria IANA del lugar; los horarios del plan se calculan con ella. */
  location: { name: string; latitude: number; longitude: number; timeZone: string };
  timeFormat: '12h' | '24h';
  intro: { title: string; subtitle: string; hint: Hint };
  letter: {
    greeting: string;
    pages: { text: string; advance: LetterAdvance }[];
    hints: Record<LetterAdvance, Hint>;
    signature: string;
  };
  question: { text: string; yes: string; no: string };
  noButton: {
    phrases: string[];
    maxAttempts: number;
    allowGracefulDecline: boolean;
    declineLabel: string;
  };
  celebration: { title: string; subtitle: string };
  decline: { title: string; message: string };
  places: Place[];
  schedule: {
    daysAhead: number;
    excludedWeekdays: Weekday[];
    /** Fechas concretas en formato 'AAAA-MM-DD'. */
    excludedDates: string[];
    minHoursAhead: number;
    /** Cada cuántos minutos se puede elegir dentro de una franja (15 → 6:00, 6:15, 6:30…). */
    stepMinutes: number;
    /** Franja de los lugares que no indican la suya. */
    defaultWindow: TimeWindow;
    /** Planes con `times: 'sunset'`: desde `from` hasta `to` minutos antes de la puesta de sol. */
    sunsetMinutesBefore: { from: number; to: number };
    /** Hora (24 h) a la que empieza la mañana, la tarde y la noche («6:30 de la tarde»). */
    dayparts: { morning: string; afternoon: string; night: string };
  };
  note: { enabled: boolean; maxLength: number; placeholder: string; label: string };
  /** Textos de la pantalla de postales. */
  plan: { label: string; title: string; next: string; save: string; cancel: string; flipHint: string; chosen: string };
  /** Textos de la pantalla de fecha y hora. */
  when: {
    label: string;
    title: string;
    timeTitle: string;
    /** Debajo del arco de la hora. */
    dragHint: Hint;
    /** En los planes de atardecer; {hora} es la puesta de sol. */
    sunsetAt: string;
    pickDayFirst: string;
    today: string;
    tomorrow: string;
    back: string;
    next: string;
    save: string;
  };
  /** Textos del resumen. */
  summary: {
    label: string;
    title: string;
    planLabel: string;
    dateLabel: string;
    timeLabel: string;
    noteLabel: string;
    noNote: string;
    edit: string;
    confirm: string;
    copy: string;
    copied: string;
    back: string;
  };
  whatsapp: {
    /** Una línea por elemento. Huecos: {lugar} {fecha} {hora} {nota}. */
    template: string[];
    mysteryLabel: string;
  };
  farewell: { title: string; message: string };
  quips: { fullMoon: string; newMoon: string; weekend: string; today: string };
  sound: {
    /** false = la web no carga ni un byte de sonido. */
    enabled: boolean;
    /** true = empieza en silencio y ella decide si lo activa. */
    startMuted: boolean;
    /** Volumen general, de 0 a 1. */
    volume: number;
  };
  /** Caché propia para reabrir rápido y sin red; false la desinstala. */
  serviceWorker: boolean;
  connection: { lost: string; retry: string };
};
