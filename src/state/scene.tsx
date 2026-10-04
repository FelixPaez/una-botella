import { createContext, useContext, useEffect, useState } from 'react';
import { config } from '../config.ts';
import { moodAt, type Mood } from '../lib/mood.ts';
import type { Progress } from './selectors.ts';

/** Parámetros de la escena persistente: el mar y el horizonte del barquito. */
export type Scene = {
  /** 'auto' = la hora real del lugar. */
  mood: Mood | 'auto';
  swell: number;
  progress: Progress;
};

type SceneContextValue = {
  scene: Scene;
  /** La hora del día ya resuelta (con 'auto' convertido en la hora real). */
  mood: Mood;
  setScene: (update: Partial<Scene>) => void;
};

export const SceneContext = createContext<SceneContextValue | null>(null);

export function useScene(): SceneContextValue {
  const value = useContext(SceneContext);
  if (!value) throw new Error('useScene debe usarse dentro de <SceneContext.Provider>');
  return value;
}

const realMood = () => moodAt(new Date(), config.location.latitude, config.location.longitude, config.location.timeZone);

/** Hora del cielo según la hora real de su móvil (se revisa cada minuto). */
export function useRealMood(): Mood {
  const [mood, setMood] = useState(realMood);
  useEffect(() => {
    const id = window.setInterval(() => setMood(realMood()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return mood;
}
