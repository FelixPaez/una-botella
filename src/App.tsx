import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BottleActor } from './actors/BottleActor.tsx';
import { config } from './config.ts';
import { TopBar } from './layout/TopBar.tsx';
import { getDeviceProfile } from './lib/device.ts';
import type { Mood } from './lib/mood.ts';
import { atTime, moodForChoice } from './lib/dates.ts';
import { moonPhase } from './lib/moon.ts';
import { Experience } from './screens/Experience.tsx';
import { Sea } from './sea/Sea.tsx';
import { sound } from './sound/index.ts';
import { FlowProvider } from './state/FlowProvider.tsx';
import { useFlow } from './state/flowContext.ts';
import { SceneContext, useRealMood, type Scene } from './state/scene.tsx';
import { bottlePoseFor, progressOf, swellFor, type Progress } from './state/selectors.ts';
import { DraftRibbon } from './ui/DraftRibbon.tsx';

// La muestra del sistema de diseño (Fase 1) sigue disponible en ?demo; solo se descarga ahí.
const DesignDemo = lazy(() => import('./dev/DesignDemo.tsx'));

const PARAMS = new URLSearchParams(window.location.search);
const DEMO = PARAMS.has('demo');
/** ?hora=manana|dia|atardecer|noche fuerza la hora del cielo (para revisar cada una). */
const HOUR_PARAM: Record<string, Mood> = { manana: 'morning', dia: 'day', atardecer: 'sunset', noche: 'night' };
const FORCED_MOOD: Mood | undefined = HOUR_PARAM[PARAMS.get('hora') ?? ''];

const PAGES = config.letter.pages.length;
const DEVICE = getDeviceProfile();
/** La luna del cielo nocturno: la fase real de hoy. */
const MOON_TODAY = moonPhase(new Date());

export function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{DEMO ? <DemoRoot /> : <ExperienceRoot />}</MotionConfig>
    </LazyMotion>
  );
}

type ShellProps = {
  mood: Mood;
  swell: number;
  progress: Progress;
  /** Fase de la luna del cielo nocturno (la del día elegido, o la de hoy). */
  moon?: number;
  actors?: ReactNode;
  children: ReactNode;
};

/** Lo que nunca se desmonta: el mar, el horizonte con el barquito y la cinta de borrador. */
function SceneShell({ mood, swell, progress, moon = MOON_TODAY, actors, children }: ShellProps) {
  // El mar sonoro sigue al mar visible.
  useEffect(() => sound.setAmbient({ mood, swell }), [mood, swell]);
  return (
    <>
      <Sea
        mood={mood}
        swell={swell}
        moonPhase={moon}
        south={config.location.latitude < 0}
        lite={DEVICE.lite}
        actors={actors}
      />
      <TopBar progress={progress} />
      <main>{children}</main>
      <DraftRibbon />
    </>
  );
}

function ExperienceRoot() {
  return (
    <FlowProvider>
      <ExperienceScene />
    </FlowProvider>
  );
}

/** Pasos en los que el mar ya anticipa la hora de la cita. */
const CHOSEN_SKY = new Set(['datetime', 'summary', 'farewell']);

function ExperienceScene() {
  const { state } = useFlow();
  const realMood = useRealMood();
  const { date, time } = state.choice;
  const chosen = date && time && CHOSEN_SKY.has(state.step) ? { date, time } : null;
  return (
    <SceneShell
      mood={FORCED_MOOD ?? (chosen ? moodForChoice(chosen.date, chosen.time) : realMood)}
      moon={chosen ? moonPhase(atTime(chosen.date, '21:00')) : MOON_TODAY}
      swell={swellFor(state.step)}
      progress={progressOf(state, PAGES)}
      actors={<BottleActor pose={bottlePoseFor(state.step)} lite={DEVICE.lite} />}
    >
      <Experience />
    </SceneShell>
  );
}

const demoScene: Scene = {
  mood: FORCED_MOOD ?? 'auto',
  swell: 0.5,
  progress: {
    visible: true,
    index: 1,
    total: PAGES + 4,
    arrived: false,
    labels: [
      { at: 0, text: 'Carta' },
      { at: PAGES, text: 'Pregunta' },
      { at: PAGES + 1, text: 'Plan' },
      { at: PAGES + 2, text: 'Fecha' },
      { at: PAGES + 3, text: 'Resumen' },
    ],
  },
};

function DemoRoot() {
  const [scene, setSceneState] = useState(demoScene);
  const realMood = useRealMood();
  const mood = scene.mood === 'auto' ? realMood : scene.mood;
  const setScene = useCallback((update: Partial<Scene>) => setSceneState((s) => ({ ...s, ...update })), []);
  const context = useMemo(() => ({ scene, mood, setScene }), [scene, mood, setScene]);
  return (
    <SceneContext.Provider value={context}>
      <SceneShell mood={mood} swell={scene.swell} progress={scene.progress}>
        <Suspense fallback={null}>
          <DesignDemo />
        </Suspense>
      </SceneShell>
    </SceneContext.Provider>
  );
}
