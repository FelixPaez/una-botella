/**
 * Motor de sonido: todo sintetizado con Web Audio, sin archivos que descargar.
 * Se carga aparte (import dinámico) y solo cuando el sonido está activado.
 */
import type { Mood } from '../lib/mood.ts';
import type { AmbientParams, SoundEngine, SoundName } from './types.ts';

/** Color del mar de fondo según la hora: más grave y tranquilo de noche. */
const TONE: Record<Mood, { cutoff: number; level: number }> = {
  morning: { cutoff: 900, level: 0.9 },
  day: { cutoff: 1000, level: 1 },
  sunset: { cutoff: 820, level: 0.9 },
  night: { cutoff: 560, level: 0.72 },
};

/** Constante de tiempo (s) de los cambios del mar de fondo: lentos, como la marea. */
const SMOOTH = 1.2;

const rand = (n: number) => Math.random() * n;

/** Ruido rosa (filtro de Paul Kellet) con fundido en el bucle para que no haga clic. */
function makeNoise(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const fade = 4096;
  const raw = new Float32Array(length + fade);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < raw.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  data.set(raw.subarray(0, length));
  // El principio se funde con la continuación natural del final: bucle sin costura.
  for (let i = 0; i < fade; i++) {
    const w = i / fade;
    data[i] = raw[i] * w + raw[length + i] * (1 - w);
  }
  return buffer;
}

type AmbientGraph = { apply(params: AmbientParams, at: number): void; stop(): void };

function createAmbient(ctx: AudioContext, noise: AudioBuffer, out: AudioNode): AmbientGraph {
  const t0 = ctx.currentTime;
  const stoppable: AudioScheduledSourceNode[] = [];
  const loop = (offset: number) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    src.start(t0, offset);
    stoppable.push(src);
    return src;
  };
  const lfo = (hz: number) => {
    const osc = ctx.createOscillator();
    osc.frequency.value = hz;
    osc.start(t0);
    stoppable.push(osc);
    return osc;
  };
  const filter = (type: BiquadFilterType, hz: number, q = 0.5) => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = hz;
    f.Q.value = q;
    return f;
  };

  // Rompiente: ruido grave en estéreo.
  const surfGains: GainNode[] = [];
  const surfFilters: BiquadFilterNode[] = [];
  for (const [offset, pan] of [
    [0, -0.55],
    [1.7, 0.55],
  ]) {
    const lp = filter('lowpass', 900, 0.4);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    loop(offset).connect(lp);
    lp.connect(gain);
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      gain.connect(panner);
      panner.connect(out);
    } else {
      gain.connect(out);
    }
    surfGains.push(gain);
    surfFilters.push(lp);
  }

  // Espuma: siseo agudo que llega un poco después de cada ola.
  const hp = filter('highpass', 1600);
  const lpFoam = filter('lowpass', 5200);
  const foamGain = ctx.createGain();
  foamGain.gain.value = 0;
  loop(2.9).connect(hp);
  hp.connect(lpFoam);
  lpFoam.connect(foamGain);
  foamGain.connect(out);

  // Olas: dos osciladores lentos que nunca coinciden, así el ciclo no se nota.
  const waveA = lfo(0.083);
  const waveB = lfo(0.051);
  const surfDepth = ctx.createGain();
  waveA.connect(surfDepth);
  waveB.connect(surfDepth);
  surfGains.forEach((g) => surfDepth.connect(g.gain));
  const cutoffDepth = ctx.createGain();
  waveA.connect(cutoffDepth);
  surfFilters.forEach((f) => cutoffDepth.connect(f.frequency));
  const foamDelay = ctx.createDelay(5);
  foamDelay.delayTime.value = 2.2;
  const foamDepth = ctx.createGain();
  waveA.connect(foamDelay);
  foamDelay.connect(foamDepth);
  foamDepth.connect(foamGain.gain);

  return {
    apply({ mood, swell }, at) {
      const tone = TONE[mood];
      const base = 0.2 * tone.level * (0.55 + 0.75 * swell);
      surfGains.forEach((g) => g.gain.setTargetAtTime(base, at, SMOOTH));
      // La suma de las dos olas va de −2 a 2: la profundidad no puede pasar de base/2.
      surfDepth.gain.setTargetAtTime(base * (0.22 + 0.2 * swell), at, SMOOTH);
      surfFilters.forEach((f) => f.frequency.setTargetAtTime(tone.cutoff + 450 * swell, at, SMOOTH));
      cutoffDepth.gain.setTargetAtTime(220 + 260 * swell, at, SMOOTH);
      const foam = 0.045 * tone.level * (0.4 + swell);
      foamGain.gain.setTargetAtTime(foam, at, SMOOTH);
      foamDepth.gain.setTargetAtTime(foam * 0.9, at, SMOOTH);
    },
    stop() {
      stoppable.forEach((node) => {
        try {
          node.stop();
        } catch {
          // ya estaba parado
        }
      });
    },
  };
}

export function createEngine(ctx: AudioContext, volume: number): SoundEngine {
  const master = ctx.createGain();
  master.gain.value = 0;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 8;
  limiter.ratio.value = 6;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  master.connect(limiter);
  limiter.connect(ctx.destination);

  const sfx = ctx.createGain();
  sfx.connect(master);
  const ambientBus = ctx.createGain();
  ambientBus.connect(master);

  const noise = makeNoise(ctx, 4);
  let ambientGraph: AmbientGraph | null = createAmbient(ctx, noise, ambientBus);
  let params: AmbientParams = { mood: 'day', swell: 0.5 };
  let firstStart = true;

  const env = (g: GainNode, t: number, attack: number, peak: number, decay: number) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  };

  const tone = (type: OscillatorType, from: number, to: number, t: number, length: number, peak: number) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + length);
    const g = ctx.createGain();
    env(g, t, 0.005, peak, length);
    osc.connect(g);
    g.connect(sfx);
    osc.start(t);
    osc.stop(t + length + 0.05);
  };

  const hiss = (
    t: number,
    { attack = 0.004, length, peak, type, from, to, q = 0.8 }: {
      attack?: number;
      length: number;
      peak: number;
      type: BiquadFilterType;
      from: number;
      to?: number;
      q?: number;
    },
  ) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + attack + length);
    const g = ctx.createGain();
    env(g, t, attack, peak, length);
    src.connect(f);
    f.connect(g);
    g.connect(sfx);
    src.start(t, rand(3));
    src.stop(t + attack + length + 0.05);
  };

  const bubble = (t: number, size = 1) => tone('sine', 320 / size + rand(60), 980 / size + rand(200), t, 0.08, 0.07);

  const sounds: Record<SoundName, (t: number) => void> = {
    tick: (t) => tone('triangle', 1250, 940, t, 0.07, 0.05),
    nudge: (t) => {
      tone('sine', 520, 820, t, 0.1, 0.06);
      bubble(t + 0.05, 1.2);
    },
    pop: (t) => {
      hiss(t, { length: 0.04, peak: 0.3, type: 'bandpass', from: 1500, q: 1.4 });
      tone('sine', 720, 170, t, 0.13, 0.26);
    },
    bubble: (t) => {
      bubble(t);
      bubble(t + 0.07 + rand(0.05), 1.4);
    },
    splash: (t) => {
      hiss(t, { length: 0.4, peak: 0.22, type: 'bandpass', from: 2200, to: 700, q: 0.6 });
      hiss(t + 0.02, { length: 0.7, peak: 0.1, type: 'lowpass', from: 900, q: 0.5 });
      [0.12, 0.22, 0.36].forEach((delay, i) => bubble(t + delay, 1 + i * 0.3));
    },
    stamp: (t) => {
      tone('sine', 150, 52, t, 0.18, 0.42);
      hiss(t, { length: 0.06, peak: 0.2, type: 'lowpass', from: 800, q: 0.7 });
    },
    yes: (t) => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone('sine', f, f * 0.999, t + i * 0.075, 1.5 - i * 0.15, 0.085 - i * 0.012),
      );
    },
    whoosh: (t) => hiss(t, { attack: 0.35, length: 0.6, peak: 0.16, type: 'bandpass', from: 320, to: 1500, q: 0.9 }),
  };

  return {
    play(name) {
      if (ctx.state !== 'running') return;
      sounds[name](ctx.currentTime + 0.01);
    },
    setAmbient(next) {
      params = next;
      ambientGraph?.apply(next, ctx.currentTime);
    },
    setAmbientEnabled(enabled) {
      const t = ctx.currentTime;
      if (enabled && !ambientGraph) {
        ambientGraph = createAmbient(ctx, noise, ambientBus);
        ambientGraph.apply(params, t);
        ambientBus.gain.setTargetAtTime(1, t, 0.8);
      } else if (!enabled && ambientGraph) {
        const graph = ambientGraph;
        ambientGraph = null;
        ambientBus.gain.setTargetAtTime(0, t, 0.4);
        setTimeout(() => graph.stop(), 2500);
      }
    },
    setMuted(muted) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      // La primera vez el mar entra despacio, como quien se acerca a la orilla.
      master.gain.setTargetAtTime(muted ? 0 : volume, t, muted ? 0.08 : firstStart ? 1.1 : 0.4);
      if (!muted) firstStart = false;
    },
    suspend() {
      void ctx.suspend().catch(() => undefined);
    },
    resume() {
      void ctx.resume().catch(() => undefined);
    },
  };
}
