/**
 * Fachada del sonido: pesa casi nada y vive en el bundle inicial.
 * El motor (síntesis con Web Audio, sin archivos de audio) se descarga aparte
 * y solo si hace falta. Mecanismos para que no se cargue o se apague solo:
 *   1. config.sound.enabled = false → nunca se descarga.
 *   2. Ahorro de datos, red 2G o dispositivo modesto → empieza en silencio
 *      y solo se descarga si ella lo activa con el botón.
 *   3. Si al arrancar el mar sonoro los fps caen, el fondo se apaga solo.
 *   4. Botón de silencio siempre visible; la preferencia se recuerda en la sesión.
 */
import { config } from '../config.ts';
import { getDeviceProfile } from '../lib/device.ts';
import type { AmbientParams, SoundEngine, SoundName } from './types.ts';

const STORAGE_KEY = 'botella:sonido';

let ctx: AudioContext | null = null;
let engine: SoundEngine | null = null;
let loading: Promise<SoundEngine | null> | null = null;
let ambient: AmbientParams = { mood: 'day', swell: 0.5 };
let muted = initialMuted();
let watchdogDone = false;
const listeners = new Set<() => void>();

function initialMuted(): boolean {
  if (!config.sound.enabled) return true;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return saved === 'off';
  } catch {
    // sin almacenamiento: seguimos con los valores por defecto
  }
  if (config.sound.startMuted) return true;
  const device = getDeviceProfile();
  return device.saveData || device.slowNetwork || device.lite;
}

function createContext(): AudioContext | null {
  const AC =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try {
    return new AC();
  } catch {
    return null;
  }
}

function load(): Promise<SoundEngine | null> {
  const audio = ctx;
  if (!audio) return Promise.resolve(null);
  loading ??= import('./engine.ts')
    .then(({ createEngine }) => {
      engine = createEngine(audio, config.sound.volume);
      engine.setAmbient(ambient);
      return engine;
    })
    .catch(() => null);
  return loading;
}

/** Mide los fps unos segundos tras arrancar; si van flojos, apaga el mar de fondo. */
function watchFrameRate(target: SoundEngine) {
  if (watchdogDone || document.hidden) return;
  watchdogDone = true;
  let frames = 0;
  let start = 0;
  const tick = (t: number) => {
    start ||= t;
    frames++;
    if (t - start < 4000) requestAnimationFrame(tick);
    else if ((frames * 1000) / (t - start) < 40) target.setAmbientEnabled(false);
  };
  requestAnimationFrame(tick);
}

/** Tiene que ejecutarse dentro de un gesto: crea y reanuda el contexto en el acto. */
function start() {
  ctx ??= createContext();
  if (!ctx) return;
  if (ctx.state !== 'running') void ctx.resume().catch(() => undefined);
  void load().then((e) => {
    if (!e || muted) return;
    e.setMuted(false);
    watchFrameRate(e);
  });
}

const notify = () => listeners.forEach((fn) => fn());

export const sound = {
  available: config.sound.enabled,

  isMuted: () => muted,

  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  },

  setMuted(next: boolean) {
    if (!config.sound.enabled) return;
    muted = next;
    try {
      sessionStorage.setItem(STORAGE_KEY, next ? 'off' : 'on');
    } catch {
      // sin almacenamiento: la preferencia dura hasta recargar
    }
    if (next) engine?.setMuted(true);
    else start();
    notify();
  },

  play(name: SoundName) {
    if (!muted) engine?.play(name);
  },

  setAmbient(params: AmbientParams) {
    ambient = params;
    engine?.setAmbient(params);
  },
};

/** Escucha el primer gesto (los navegadores no dejan sonar antes) y las pausas de pestaña. */
export function initSound() {
  if (!config.sound.enabled) return;
  const onGesture = () => {
    if (!muted && (!ctx || ctx.state !== 'running')) start();
  };
  for (const type of ['pointerup', 'touchend', 'keydown'] as const) {
    window.addEventListener(type, onGesture, { capture: true, passive: true });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) engine?.suspend();
    else if (!muted) engine?.resume();
  });
}
