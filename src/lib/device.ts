type NetworkInformation = { saveData?: boolean; effectiveType?: string };
type NavigatorExtras = Navigator & { connection?: NetworkInformation; deviceMemory?: number };

export type DeviceProfile = {
  /** El usuario activó el ahorro de datos. */
  saveData: boolean;
  /** Conexión 2G o peor. */
  slowNetwork: boolean;
  /** Dispositivo modesto: menos burbujas y estrellas, y sin sonido automático. */
  lite: boolean;
};

export function getDeviceProfile(): DeviceProfile {
  if (typeof navigator === 'undefined') return { saveData: false, slowNetwork: false, lite: false };
  const nav = navigator as NavigatorExtras;
  const saveData = nav.connection?.saveData === true;
  const slowNetwork = ['slow-2g', '2g'].includes(nav.connection?.effectiveType ?? '');
  const lowMemory = (nav.deviceMemory ?? 8) <= 2;
  const fewCores = (nav.hardwareConcurrency ?? 8) <= 2;
  return { saveData, slowNetwork, lite: saveData || lowMemory || fewCores };
}

export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
