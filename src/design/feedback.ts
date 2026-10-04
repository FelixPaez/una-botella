import { sound } from '../sound/index.ts';
import type { SoundName } from '../sound/types.ts';

/** Vibraciones con el mismo nombre que su sonido (en iOS no vibra: mejora progresiva). */
const HAPTICS: Partial<Record<SoundName, number | number[]>> = {
  tick: 8,
  nudge: 12,
  pop: 15,
  stamp: 15,
  splash: 10,
  yes: [10, 40, 10],
};

/** Respuesta táctil + sonora: un único lenguaje de respuesta en toda la app. */
export function feedback(name: SoundName) {
  const pattern = HAPTICS[name];
  if (pattern !== undefined && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // algunos navegadores lo bloquean: no pasa nada
    }
  }
  sound.play(name);
}
