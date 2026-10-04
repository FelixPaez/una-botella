import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { config } from './config.ts';
import { TopBar } from './layout/TopBar.tsx';
import { getDeviceProfile } from './lib/device.ts';
import type { Mood } from './lib/mood.ts';
import { moonPhase } from './lib/moon.ts';
import { Sea } from './sea/Sea.tsx';
import { sound } from './sound/index.ts';
import { SceneContext, useRealMood, type Scene } from './state/scene.tsx';
import { DraftRibbon } from './ui/DraftRibbon.tsx';

// Fase 1: la pantalla es la muestra del sistema de diseño. En la Fase 2 entra la intro.
const DesignDemo = lazy(() => import('./dev/DesignDemo.tsx'));

const LETTER_PAGES = config.letter.pages.length;
const DEVICE = getDeviceProfile();
/** La luna del cielo nocturno: la fase real de hoy. */
const MOON_TODAY = moonPhase(new Date());

/** ?hora=manana|dia|atardecer|noche fuerza la hora del cielo (para revisar cada una). */
const HOUR_PARAM: Record<string, Mood> = { manana: 'morning', dia: 'day', atardecer: 'sunset', noche: 'night' };
const forcedMood = HOUR_PARAM[new URLSearchParams(window.location.search).get('hora') ?? ''];

const initialScene: Scene = {
  mood: forcedMood ?? 'auto',
  swell: 0.5,
  progress: {
    visible: true,
    index: 1,
    total: LETTER_PAGES + 4,
    arrived: false,
    labels: [
      { at: 0, text: 'Carta' },
      { at: LETTER_PAGES, text: 'Pregunta' },
      { at: LETTER_PAGES + 1, text: 'Plan' },
      { at: LETTER_PAGES + 2, text: 'Fecha' },
      { at: LETTER_PAGES + 3, text: 'Resumen' },
    ],
  },
};

export function App() {
  const [scene, setSceneState] = useState(initialScene);
  const realMood = useRealMood();
  const mood = scene.mood === 'auto' ? realMood : scene.mood;

  const setScene = useCallback((update: Partial<Scene>) => setSceneState((s) => ({ ...s, ...update })), []);
  const context = useMemo(() => ({ scene, mood, setScene }), [scene, mood, setScene]);

  // El mar sonoro sigue al mar visible.
  useEffect(() => sound.setAmbient({ mood, swell: scene.swell }), [mood, scene.swell]);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <SceneContext.Provider value={context}>
          <Sea
            mood={mood}
            swell={scene.swell}
            moonPhase={MOON_TODAY}
            south={config.location.latitude < 0}
            lite={DEVICE.lite}
          />
          <TopBar progress={scene.progress} />
          <main>
            <Suspense fallback={null}>
              <DesignDemo />
            </Suspense>
          </main>
          <DraftRibbon />
        </SceneContext.Provider>
      </MotionConfig>
    </LazyMotion>
  );
}
