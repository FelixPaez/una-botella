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
   * Horarios propios en formato 24 h ('18:30'). Si no hay, se usan los de `schedule.defaultTimes`.
   * Con 'sunset' se calculan solos cada día a partir de la puesta de sol real.
   */
  times?: string[] | 'sunset';
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
  location: { name: string; latitude: number; longitude: number };
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
    defaultTimes: string[];
    /** Minutos antes de la puesta de sol que se ofrecen en los planes con `times: 'sunset'`. */
    sunsetOffsetsMinutes: number[];
    /** Hora (24 h) a la que empieza cada franja de horarios. */
    dayparts: { morning: string; afternoon: string; night: string };
  };
  note: { enabled: boolean; maxLength: number; placeholder: string };
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
};
