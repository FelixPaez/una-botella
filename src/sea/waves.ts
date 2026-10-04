/** Generador pseudoaleatorio con semilla: el mar se ve igual en cada visita. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Viewbox horizontal de la cresta: dos tramos idénticos de 1000 unidades. */
export const CREST_WIDTH = 2000;

/**
 * Ola periódica con dos armónicos que se repite exactamente cada 1000 unidades,
 * así el desplazamiento de -50 % encaja sin costura.
 * Devuelve el relleno (agua) y la línea de espuma de la cresta.
 */
export function wavePath({ periods, amp, height, seed }: { periods: number; amp: number; height: number; seed: number }) {
  const half = CREST_WIDTH / 2;
  const steps = periods * 2 * 20;
  const phase = seed * 1.7;
  const y = (x: number) => {
    const t = (x / half) * Math.PI * 2;
    return amp + amp * (0.78 * Math.sin(t * periods) + 0.22 * Math.sin(t * (periods * 2 + 1) + phase));
  };
  let line = '';
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * CREST_WIDTH;
    line += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y(x).toFixed(2)}`;
  }
  return { line, fill: `${line}L${CREST_WIDTH} ${height}L0 ${height}Z` };
}

export type BandSpec = {
  id: 'far' | 'mid' | 'near' | 'front';
  /** Distancia desde el horizonte, en fracción del alto del agua. */
  top: number;
  /** Amplitud de la cresta en px. */
  amp: number;
  /** Longitud de onda aproximada en px. */
  wavelength: number;
  /** Segundos que tarda la ola en recorrer un tramo (las cercanas van más rápido). */
  drift: number;
  bob: 's' | 'm' | 'l';
  /** Periodos de vaivén distintos para que el conjunto nunca se repita igual. */
  bobDuration: number;
  /** Cuerpo del agua: color arriba y abajo. */
  colors: [string, string];
  foam: number;
  /** Paralaje con el cursor: 0 lejos, 1 cerca. */
  depth: number;
  seed: number;
};

/** De lejos a cerca: menta, aguamarina, laguna, verde mar. */
export const BANDS: BandSpec[] = [
  { id: 'far', top: 0, amp: 3, wavelength: 120, drift: 46, bob: 's', bobDuration: 7.3, colors: ['#c9ebe4', '#bee5de'], foam: 0.5, depth: 0.15, seed: 1 },
  { id: 'mid', top: 0.07, amp: 6, wavelength: 180, drift: 34, bob: 's', bobDuration: 6.1, colors: ['#ace0d8', '#9ed8d0'], foam: 0.42, depth: 0.35, seed: 2 },
  { id: 'near', top: 0.2, amp: 9, wavelength: 250, drift: 25, bob: 'm', bobDuration: 5.3, colors: ['#95d1d8', '#87c6d0'], foam: 0.45, depth: 0.6, seed: 3 },
  { id: 'front', top: 0.42, amp: 13, wavelength: 340, drift: 18, bob: 'l', bobDuration: 4.7, colors: ['#7ec5bd', '#5fa9a7'], foam: 0.55, depth: 1, seed: 4 },
];

/** Relleno extra bajo la cresta para que el vaivén nunca deje ver un hueco. */
export const CREST_OVERLAP = 16;
