import type { Mood } from '../lib/mood.ts';

/** Mismos nombres que los hápticos: un único lenguaje de respuesta en toda la app. */
export type SoundName = 'tick' | 'nudge' | 'pop' | 'bubble' | 'splash' | 'stamp' | 'yes' | 'whoosh';

export type AmbientParams = { mood: Mood; swell: number };

export interface SoundEngine {
  play(name: SoundName): void;
  setAmbient(params: AmbientParams): void;
  /** Apaga solo el mar de fondo (los efectos cortos siguen). */
  setAmbientEnabled(enabled: boolean): void;
  setMuted(muted: boolean): void;
  suspend(): void;
  resume(): void;
}
