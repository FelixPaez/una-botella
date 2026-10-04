import type { Config } from './config.types.ts';

/**
 * ✏️  CONTENIDO EDITABLE
 *
 * Todo lo que ella va a leer y todos los datos del plan viven aquí.
 * Puedes cambiar cualquier texto sin tocar los componentes.
 *
 * Los valores marcados con "TODO" son provisionales: mientras quede alguno,
 * la web muestra una cinta de BORRADOR para que no se te escape enviarla así.
 *
 * Huecos que se rellenan solos en los textos:
 *   {nombre}     → recipient.name
 *   {remitente}  → sender.name
 */
export const config: Config = {
  recipient: {
    name: 'TODO', // TODO: su nombre
  },

  sender: {
    name: 'TODO', // TODO: tu nombre, tal como quieres firmar la carta
    // Tu WhatsApp en formato internacional, solo dígitos y sin "+".
    // Cuba: 53 + tu número de 8 cifras → '5351234567'.
    whatsapp: 'TODO', // TODO: tu número
  },

  // Vista previa del enlace en WhatsApp: genera curiosidad sin revelar la pregunta.
  meta: {
    title: 'Un mensaje en una botella',
    description: 'La marea trajo algo para ti. Ábrelo cuando tengas un momento tranquilo.',
  },

  // Se usa para la luna, la hora real del cielo y los horarios de atardecer.
  // Las horas son siempre las de esta zona, aunque el móvil esté en otra.
  location: { name: 'Santa Clara, Cuba', latitude: 22.41, longitude: -79.96, timeZone: 'America/Havana' },

  // '12h' → «6:30 de la tarde» · '24h' → «18:30»
  timeFormat: '12h',

  intro: {
    title: 'Para {nombre}',
    subtitle: 'La marea trajo algo para ti.',
    hint: {
      touch: 'Toca la botella para abrirla',
      mouse: 'Haz clic en la botella para abrirla',
    },
  },

  letter: {
    greeting: 'Hola, {nombre}:',
    // TODO: borrador sugerido; reescríbelo con tus palabras (2 a 4 páginas).
    // `advance` es el gesto con el que se pasa a lo siguiente: 'tap' (tocar),
    // 'hold' (mantener presionado) o 'swipe' (deslizar).
    pages: [
      {
        text: 'Dicen que los mensajes importantes llegan por mar, así que me tomé la libertad de enviarte uno.',
        advance: 'tap',
      },
      {
        text: 'Me lo paso muy bien hablando contigo, y se me ocurrió que sería todavía mejor hacerlo con el mar de fondo.',
        advance: 'hold',
      },
      {
        text: 'Así que, antes de que cambie la marea, quería preguntarte algo…',
        advance: 'swipe',
      },
    ],
    hints: {
      tap: { touch: 'Toca para seguir', mouse: 'Haz clic para seguir' },
      hold: {
        touch: 'Mantén presionado para despejar la bruma',
        mouse: 'Mantén pulsado para despejar la bruma',
      },
      swipe: { touch: 'Desliza hacia arriba', mouse: 'Arrastra hacia arriba o usa la rueda' },
    },
    signature: '— {remitente}',
  },

  question: {
    text: '¿Te gustaría salir conmigo un día de estos?',
    yes: 'Sí',
    no: 'No',
  },

  noButton: {
    // Una frase por intento; si se acaban, vuelve a empezar.
    phrases: ['¿Segura?', 'Piénsalo otra vez', 'Este botón es tímido', 'Casi… pero no'],
    // Intentos antes de que el "No" se convierta en una salida amable.
    maxAttempts: 4,
    // true = tras esos intentos aparece "Mejor otro día" y se puede pulsar.
    allowGracefulDecline: true,
    declineLabel: 'Mejor otro día',
  },

  celebration: {
    title: 'Hasta las olas aplauden',
    subtitle: 'Ahora viene lo importante: elegir el plan.',
  },

  decline: {
    title: 'Gracias por leerla',
    message:
      'La botella vuelve al mar, sin prisa y sin peso. Si algún día cambia la marea, ya sabes dónde encontrarme.',
  },

  // Cada lugar es una postal. Funciona igual con 3, 5 u 8.
  // Fotos: WebP de 1000×800 px y menos de 150 KB en `public/places/`.
  places: [
    {
      id: 'atardecer',
      name: 'Atardecer frente al mar',
      tagline: 'El sol también tiene una cita a esa hora',
      description:
        'Vemos cómo el sol se esconde en el mar, con algo rico para compartir y sin mirar el reloj.',
      illustration: 'sunset',
      times: 'sunset', // se calculan solos con la puesta de sol de cada día
    },
    {
      id: 'picnic',
      name: 'Picnic en la orilla',
      tagline: 'Mantel, fruta y olas de fondo',
      description:
        'Un plan tranquilo de tarde: algo rico, un buen sitio en la arena y la conversación haciendo el resto.',
      illustration: 'picnic',
      times: ['15:00', '16:00', '17:00'],
    },
    {
      id: 'cafe',
      name: 'Café con vista al mar',
      tagline: 'Un café, una mesa y conversación sin prisa',
      description:
        'Una mesa junto a la ventana, el mar de fondo y todo el tiempo del mundo para conocernos.',
      illustration: 'cafe',
      times: ['09:30', '10:30', '16:00'],
    },
    {
      id: 'paseo-nocturno',
      name: 'Paseo nocturno por la costa',
      tagline: 'Contar estrellas y ver quién encuentra más',
      description:
        'Caminamos junto al mar con la brisa de la noche. Aviso: soy muy competitivo contando estrellas.',
      illustration: 'night-walk',
      times: ['20:00', '20:30', '21:00'],
    },
    {
      id: 'misterio',
      name: 'Plan misterioso',
      tagline: 'Tú eliges el día, yo me encargo del resto',
      description: 'No puedo contarte mucho. Solo que habrá mar y que valdrá la pena.',
      illustration: 'mystery',
      mystery: true,
    },
  ],

  schedule: {
    daysAhead: 14,
    excludedWeekdays: [], // ej. ['lunes', 'martes']
    excludedDates: [], // ej. ['2026-10-12']
    minHoursAhead: 2,
    defaultTimes: ['10:00', '16:00', '17:30', '20:00'],
    sunsetOffsetsMinutes: [60, 30],
    dayparts: { morning: '05:00', afternoon: '12:00', night: '19:00' },
  },

  note: {
    enabled: true,
    maxLength: 140,
    label: 'Una nota (si quieres)',
    placeholder: 'Si quieres, déjame una nota…',
  },

  // Textos de las pantallas del plan (títulos y botones).
  plan: {
    label: 'El plan',
    title: '¿Qué te apetece?',
    next: 'Elegir el día',
    save: 'Guardar',
    cancel: 'Volver al resumen',
    flipHint: 'Toca para descubrirlo',
    chosen: 'Elegido',
  },

  when: {
    label: 'La fecha',
    title: '¿Qué día te viene bien?',
    timeTitle: '¿A qué hora?',
    pickDayFirst: 'Elige primero un día.',
    today: 'Hoy',
    tomorrow: 'Mañana',
    back: 'Volver',
    next: 'Ver el resumen',
    save: 'Guardar',
  },

  summary: {
    label: 'El resumen',
    title: 'Así queda nuestra postal',
    planLabel: 'Plan',
    dateLabel: 'Día',
    timeLabel: 'Hora',
    noteLabel: 'Nota',
    noNote: 'Sin nota',
    edit: 'Cambiar',
    confirm: 'Confirmar por WhatsApp',
    copy: '¿No se abrió WhatsApp? Copiar el mensaje',
    copied: 'Mensaje copiado. Pégalo en nuestro chat.',
    back: 'Volver',
  },

  whatsapp: {
    // El mensaje que ella te enviará. Las líneas con {nota} desaparecen si no escribe nada.
    template: [
      '¡Hola! Abrí la botella 🌊 y mi respuesta es sí.',
      '',
      '📍 {lugar}',
      '📅 {fecha}',
      '🕰️ {hora}',
      '📝 {nota}',
      '',
      '¡Nos vemos!',
    ],
    mysteryLabel: 'Plan sorpresa',
  },

  farewell: {
    title: 'Nos vemos {fecha}',
    message: 'La botella vuelve al mar. Lo demás lo escribimos en persona.',
  },

  // Guiños que aparecen según lo que elija.
  quips: {
    fullMoon: 'Luna llena. Buen ojo.',
    newMoon: 'Luna nueva: más estrellas para contar.',
    weekend: 'Fin de semana: sin prisas.',
    today: '¿Hoy mismo? Me gusta tu estilo.',
  },

  sound: {
    enabled: true, // false = la web no carga nada de sonido
    startMuted: false, // true = empieza en silencio y ella decide
    volume: 0.7,
  },
};
