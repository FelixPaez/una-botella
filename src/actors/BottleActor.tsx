import { animate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { config } from '../config.ts';
import { feedback } from '../design/feedback.ts';
import { ease, spring, transition } from '../design/motion.ts';
import { useViewport } from '../hooks/useViewport.ts';
import { seaBus } from '../sea/seaBus.ts';
import { BottleArt } from './BottleArt.tsx';
import { bottleBus, bottleTilt } from './bottleBus.ts';
import { BOTTLE_TILT, BOTTLE_VIEW, LETTER_LENGTH, bottleGeometry, type BottlePose } from './geometry.ts';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Cierre: vuelve → espera la carta → se tapa → se aleja → ya lejos. */
type ClosingStage = 'returning' | 'waiting' | 'sealing' | 'leaving' | 'done';

/**
 * La botella: vive dentro del mar (entre olas) y nunca se desmonta.
 * float → en primer plano · opening → corcho, burbujas y carta · away → pequeña en el horizonte ·
 * closing → vuelve a por la carta, se tapa y se aleja.
 */
export function BottleActor({ pose, lite }: { pose: BottlePose; lite: boolean }) {
  const geo = bottleGeometry(useViewport());
  const reduced = Boolean(useReducedMotion());
  const [initialPose] = useState(pose);
  const [drifted, setDrifted] = useState(false);
  const [closing, setClosing] = useState<ClosingStage>(initialPose === 'closing' ? 'done' : 'returning');

  const effective: 'float' | 'away' =
    pose === 'float'
      ? 'float'
      : pose === 'opening'
        ? drifted
          ? 'away'
          : 'float'
        : pose === 'closing'
          ? closing === 'leaving' || closing === 'done'
            ? 'away'
            : 'float'
          : 'away';
  const place = effective === 'away' ? geo.away : geo.float;
  const arriving = pose === 'float' && !reduced;
  // Si se recarga en el final, la botella ya está tapada y lejos.
  const sealedAtStart = initialPose === 'float' || initialPose === 'closing';

  // La posición estable va por CSS (left/top); las transiciones son solo transform (FLIP).
  const dx = useMotionValue(arriving ? 70 : 0);
  const dy = useMotionValue(arriving ? 10 : 0);
  const scale = useMotionValue(effective === 'away' ? geo.away.scale : 1);
  const opacity = useMotionValue(arriving ? 0 : 1);
  const wobble = useMotionValue(0);
  const tilt = useSpring(bottleTilt, spring.buoy);
  const rotate = useTransform([wobble, tilt], ([w, t]: number[]) => BOTTLE_TILT + w + t);

  const art = {
    corkX: useMotionValue(0),
    corkY: useMotionValue(0),
    corkRotate: useMotionValue(0),
    corkOpacity: useMotionValue(sealedAtStart ? 1 : 0),
    letter: useMotionValue(sealedAtStart ? 1 : 0),
    bubbles: useMotionValue(0),
  };
  const corkRef = useRef<SVGGElement>(null);
  const neckRef = useRef<SVGCircleElement>(null);
  const geoRef = useRef(geo);
  useLayoutEffect(() => {
    geoRef.current = geo;
  });

  // La carta necesita saber dónde está el cuello (para salir y para volver a entrar).
  useEffect(() => {
    bottleBus.neck = () => {
      const neck = neckRef.current?.getBoundingClientRect();
      if (!neck) return null;
      return {
        x: neck.left + neck.width / 2,
        y: neck.top + neck.height / 2,
        length: (LETTER_LENGTH / BOTTLE_VIEW.width) * geoRef.current.width,
        angle: BOTTLE_TILT + wobble.get(),
      };
    };
    return () => {
      bottleBus.neck = null;
    };
  }, [wobble]);

  // Llegada en la intro: entra a la deriva desde la derecha.
  useEffect(() => {
    if (opacity.get() === 1) return;
    const controls = [
      animate(dx, 0, { duration: 2.2, ease: ease.surface }),
      animate(dy, 0, { duration: 2.2, ease: ease.surface }),
      animate(opacity, 1, { duration: 1.2, ease: ease.swell }),
    ];
    return () => controls.forEach((c) => c.stop());
  }, [dx, dy, opacity]);

  // Cambio de sitio: la posición cambia de golpe en CSS y el transform recorre la distancia.
  const prevEffective = useRef(effective);
  useLayoutEffect(() => {
    const from = prevEffective.current;
    if (from === effective) return;
    prevEffective.current = effective;
    const g = geoRef.current;
    const a = from === 'away' ? g.away : g.float;
    const b = effective === 'away' ? g.away : g.float;
    dx.set(dx.get() + a.x - b.x);
    dy.set(dy.get() + a.y - b.y);
    const t = reduced ? transition.reduced : transition.ambient;
    const toAway = effective === 'away';
    animate(dx, 0, t);
    animate(dy, 0, {
      ...t,
      onComplete: () => {
        if (pose !== 'closing') return;
        // De vuelta para recoger la carta, o ya lejos tras tapar.
        setClosing((stage) => (stage === 'returning' ? 'waiting' : stage === 'leaving' ? 'done' : stage));
      },
    });
    animate(scale, toAway ? g.away.scale : 1, t);
  }, [effective, reduced, pose, dx, dy, scale]);

  // Apertura: tambaleo, el corcho salta, burbujas, la carta sale y el corcho cae al agua.
  useEffect(() => {
    if (pose !== 'opening') return;
    let cancelled = false;

    const launch = () => {
      const info = bottleBus.neck?.();
      if (info) bottleBus.launch.emit(info);
    };
    const splash = () => {
      const cork = corkRef.current?.getBoundingClientRect();
      if (cork) seaBus.emit({ type: 'splash', x: cork.left + cork.width / 2, y: cork.top + cork.height / 2 });
    };

    const run = async () => {
      if (reduced) {
        animate(art.corkOpacity, 0, transition.reduced);
        animate(art.letter, 0, transition.reduced);
        launch();
        await wait(400);
        if (!cancelled) setDrifted(true);
        return;
      }
      animate(wobble, [0, 6, -5, 3.5, -1.5, 0], { duration: 0.6, ease: ease.swell });
      await wait(420);
      if (cancelled) return;
      feedback('pop');
      const flight = { duration: 0.85 };
      animate(art.corkX, [0, 34, 80], { ...flight, ease: 'linear' });
      animate(art.corkY, [0, -92, 46], { ...flight, times: [0, 0.42, 1], ease: [ease.surface, ease.sink] });
      animate(art.corkRotate, [0, 260, 480], { ...flight, ease: 'linear' });
      animate(art.bubbles, [0, 1], { duration: 1.1, ease: ease.surface });
      await wait(320);
      if (cancelled) return;
      animate(art.letter, 0, { duration: 0.18 });
      launch();
      feedback('bubble');
      await wait(540);
      if (cancelled) return;
      splash();
      feedback('splash');
      animate(art.corkOpacity, 0, { duration: 1.2, delay: 0.2 });
      await wait(700);
      if (!cancelled) setDrifted(true);
    };
    void run();
    return () => {
      cancelled = true;
    };
    // `art` y `wobble` son motion values estables: no hace falta repetir la secuencia por ellos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose, reduced]);

  // Cierre: al entrar en "closing" vuelve (FLIP); cuando está esperando, avisa a la carta.
  useEffect(() => {
    if (pose !== 'closing' || initialPose === 'closing') return;
    if (closing === 'waiting') bottleBus.arrived.emit();
  }, [pose, closing, initialPose]);

  // Cuando la carta entra por el cuello: se ve dentro, el corcho entra de golpe y se aleja.
  useEffect(() => {
    if (pose !== 'closing' || initialPose === 'closing') return;
    let cancelled = false;
    const off = bottleBus.deliver.on(() => {
      void (async () => {
        setClosing('sealing');
        animate(art.letter, 1, { duration: 0.35, ease: ease.surface });
        art.corkX.set(reduced ? 0 : 38);
        art.corkY.set(reduced ? 0 : -20);
        art.corkRotate.set(reduced ? 0 : 70);
        animate(art.corkOpacity, 1, { duration: 0.2 });
        animate(art.corkX, 0, spring.stamp);
        animate(art.corkRotate, 0, spring.stamp);
        animate(art.corkY, 0, {
          ...spring.stamp,
          onComplete: () => {
            feedback('pop');
            if (!reduced) animate(wobble, [0, -4, 3, -1.5, 0], { duration: 0.55, ease: ease.swell });
          },
        });
        await wait(reduced ? 300 : 1100);
        if (cancelled) return;
        setClosing('leaving');
        await wait(reduced ? 200 : 900);
        if (!cancelled) bottleBus.gone.emit();
      })();
    });
    return () => {
      cancelled = true;
      off();
    };
    // `art` y `wobble` son motion values estables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose, initialPose, reduced]);

  return (
    <m.div
      className="bottle-actor"
      style={{
        left: place.x,
        top: place.y - geo.waterTop,
        ['--bw' as keyof CSSProperties]: `${geo.width}px`,
        x: dx,
        y: dy,
        scale,
        opacity,
      }}
    >
      <div className="bottle-actor__bob">
        <div className="bottle-actor__sway">
          <m.div className="bottle-actor__tilt" style={{ rotate }}>
            <BottleArt
              name={config.recipient.name}
              width={geo.width}
              motion={art}
              glint={!lite && (pose === 'float' || effective === 'float')}
              corkRef={corkRef}
              neckRef={neckRef}
            />
          </m.div>
        </div>
      </div>
    </m.div>
  );
}
