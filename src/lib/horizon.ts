/** Fracción de la pantalla donde está el horizonte (sale de la variable CSS --horizon). */
export function readHorizon(): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--horizon');
  const fraction = parseFloat(value) / 100;
  return Number.isFinite(fraction) && fraction > 0 ? fraction : 0.44;
}
