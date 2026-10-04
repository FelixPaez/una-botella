import { motionValue } from 'motion/react';

/** Dónde y cómo sale la carta por el cuello de la botella (px de pantalla). */
export type LaunchInfo = { x: number; y: number; length: number; angle: number };

const listeners = new Set<(info: LaunchInfo) => void>();

/** La botella avisa cuando suelta la carta; la carta la recoge y vuela hasta su sitio. */
export const bottleBus = {
  launch(info: LaunchInfo) {
    listeners.forEach((fn) => fn(info));
  },
  onLaunch(fn: (info: LaunchInfo) => void) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },
};

/** Inclinación hacia el cursor (escritorio): la intro la escribe y la botella la lee. */
export const bottleTilt = motionValue(0);
