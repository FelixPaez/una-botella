const SYNODIC_MONTH = 29.530588853;
/** Luna nueva de referencia: 6 de enero de 2000, 18:14 UTC. */
const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14);

/**
 * Fase lunar aproximada (ciclo sinódico medio, error menor de un día):
 * 0 = nueva · 0,25 = cuarto creciente · 0,5 = llena · 0,75 = cuarto menguante.
 */
export function moonPhase(date: Date): number {
  const days = (date.getTime() - NEW_MOON_REF) / 86_400_000;
  return (((days / SYNODIC_MONTH) % 1) + 1) % 1;
}

/** Fracción iluminada del disco (0 a 1). */
export const moonIllumination = (phase: number) => (1 - Math.cos(2 * Math.PI * phase)) / 2;

/** Nombre de la fase en español. */
export function moonPhaseName(phase: number): string {
  const age = phase * SYNODIC_MONTH;
  const near = (target: number) => Math.abs(age - target) < 1;
  if (age < 1 || age > SYNODIC_MONTH - 1) return 'Luna nueva';
  if (near(SYNODIC_MONTH / 4)) return 'Cuarto creciente';
  if (near(SYNODIC_MONTH / 2)) return 'Luna llena';
  if (near((SYNODIC_MONTH * 3) / 4)) return 'Cuarto menguante';
  if (phase < 0.25) return 'Luna creciente';
  if (phase < 0.5) return 'Gibosa creciente';
  if (phase < 0.75) return 'Gibosa menguante';
  return 'Luna menguante';
}

/**
 * Trazo SVG de la parte iluminada, centrado en (0, 0) con radio `r`.
 * Borde exterior: semicírculo del lado iluminado. Terminador: media elipse
 * de semieje |cos 2πf|·r. En el hemisferio sur el dibujo se invierte.
 */
export function moonLitPath(phase: number, r: number, south = false): string {
  const p = ((phase % 1) + 1) % 1;
  if (moonIllumination(p) < 0.01) return '';
  const litRight = (p < 0.5) !== south;
  const gibbous = p > 0.25 && p < 0.75;
  const rx = Math.abs(Math.cos(2 * Math.PI * p)) * r;
  const limbSweep = litRight ? 1 : 0; // de arriba abajo por el lado iluminado
  const bulgeRight = gibbous ? !litRight : litRight;
  const terminatorSweep = bulgeRight ? 0 : 1; // de abajo arriba
  const f = (n: number) => +n.toFixed(3);
  return `M0 ${-r}A${r} ${r} 0 0 ${limbSweep} 0 ${r}A${f(rx)} ${r} 0 0 ${terminatorSweep} 0 ${-r}Z`;
}
