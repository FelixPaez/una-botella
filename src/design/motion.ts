/**
 * Tokens de movimiento: las únicas curvas, duraciones y muelles de la app.
 * Ningún componente usa valores sueltos; todos importan de aquí.
 * Están replicados como variables CSS en styles/theme.css (motion.test.ts
 * comprueba que coinciden).
 */

type Bezier = readonly [number, number, number, number];

export const ease = {
  /** Entradas: algo que sale a flote y se asienta. */
  surface: [0.16, 1, 0.3, 1],
  /** Salidas: algo que se hunde, rápido al final. */
  sink: [0.5, 0, 0.75, 0],
  /** Bucles y vaivenes: mecerse, respirar, olas. */
  swell: [0.45, 0, 0.55, 1],
} as const satisfies Record<string, Bezier>;

/** Duraciones en segundos (Motion trabaja en segundos). */
export const dur = {
  tap: 0.15,
  exit: 0.32,
  enter: 0.6,
  tide: 1,
  ambient: 2.4,
} as const;

export const stagger = {
  word: 0.055,
  item: 0.07,
} as const;

export const spring = {
  /** Lo que flota: boya, barquito, botón No. */
  buoy: { type: 'spring', stiffness: 260, damping: 18, mass: 1 },
  /** Impactos secos: sello, matasellos, corcho. */
  stamp: { type: 'spring', stiffness: 700, damping: 32, mass: 1 },
  /** Derivas lentas: el paralaje del mar siguiendo al cursor. */
  drift: { type: 'spring', stiffness: 40, damping: 18, mass: 1 },
} as const;

export const transition = {
  tap: { duration: dur.tap, ease: ease.surface },
  enter: { duration: dur.enter, ease: ease.surface },
  exit: { duration: dur.exit, ease: ease.sink },
  /** La marea sube pareja de abajo arriba (curva de vaivén, no de entrada). */
  tide: { duration: dur.tide, ease: ease.swell },
  ambient: { duration: dur.ambient, ease: ease.swell },
  /** Versión para movimiento reducido: solo fundidos breves. */
  reduced: { duration: 0.25, ease: ease.swell },
} as const;

/** Variantes compartidas (ocultar → mostrar → salir). */
export const variants = {
  rise: {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: transition.enter },
    exit: { opacity: 0, y: 10, transition: transition.exit },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: transition.enter },
    exit: { opacity: 0, transition: transition.exit },
  },
} as const;

export const cssEase = (curve: Bezier) => `cubic-bezier(${curve.join(', ')})`;
