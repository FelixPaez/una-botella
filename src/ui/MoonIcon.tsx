import { moonLitPath, moonPhaseName } from '../lib/moon.ts';

type Props = {
  phase: number;
  size?: number;
  /** Hemisferio sur: la luna se ve al revés. */
  south?: boolean;
  className?: string;
  /** Si se indica, el icono se anuncia con el nombre de la fase. */
  labelled?: boolean;
};

/**
 * Luna con su fase real: la parte iluminada siempre clara y la sombra oscura.
 * Colores por variables CSS (--moon-lit, --moon-shadow) para usarla sobre papel o en el cielo.
 */
export function MoonIcon({ phase, size = 16, south = false, className, labelled = false }: Props) {
  const lit = moonLitPath(phase, 10, south);
  return (
    <svg
      viewBox="-12 -12 24 24"
      width={size}
      height={size}
      className={className}
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? moonPhaseName(phase) : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      <circle r={10} fill="var(--moon-shadow, rgb(31 78 90 / 0.8))" />
      {lit && <path d={lit} fill="var(--moon-lit, #fdfcf7)" />}
      <circle r={10} fill="none" stroke="currentColor" strokeOpacity={0.45} strokeWidth={0.9} />
    </svg>
  );
}
