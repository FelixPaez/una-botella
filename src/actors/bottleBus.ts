import { motionValue } from 'motion/react';

/** Dónde y cómo pasa la carta por el cuello de la botella (px de pantalla). */
export type LaunchInfo = { x: number; y: number; length: number; angle: number };

/**
 * Canal de avisos. Los "persistentes" recuerdan que ya ocurrieron: quien se
 * suscribe tarde recibe el aviso igual (útil cuando no se sabe quién llega antes).
 */
function channel<T = void>(sticky = false) {
  const listeners = new Set<(value: T) => void>();
  let fired: { value: T } | null = null;
  return {
    emit(value: T) {
      if (sticky) fired = { value };
      listeners.forEach((fn) => fn(value));
    },
    on(fn: (value: T) => void) {
      listeners.add(fn);
      if (fired) fn(fired.value);
      return () => void listeners.delete(fn);
    },
    reset() {
      fired = null;
    },
  };
}

/** Coordinación entre la botella (vive en el mar) y la carta (vive en la pantalla). */
export const bottleBus = {
  /** Apertura: la carta sale por el cuello. */
  launch: channel<LaunchInfo>(),
  /** Cierre: la botella volvió y espera la carta. */
  arrived: channel(true),
  /** Cierre: la carta ya entró por el cuello. */
  deliver: channel(true),
  /** Cierre: la botella, tapada, se aleja. */
  gone: channel(true),
  /** Dónde está ahora el cuello (lo registra la botella). */
  neck: null as null | (() => LaunchInfo | null),
  resetClosing() {
    this.arrived.reset();
    this.deliver.reset();
    this.gone.reset();
  },
};

/** Inclinación hacia el cursor (escritorio): la intro la escribe y la botella la lee. */
export const bottleTilt = motionValue(0);
