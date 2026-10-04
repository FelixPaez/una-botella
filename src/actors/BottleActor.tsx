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

/**
 * La botella: vive dentro del mar (entre olas) y nunca se desmonta.
 * float → en primer plano · opening → corcho, burbujas y carta · away → pequeña en el horizonte.
 */
export function BottleActor({ pose, lite }: { pose: BottlePose; lite: boolean }) {
  const geo = bottleGeometry(useViewport());
  const reduced = Boolean(useReducedMotion());
  const [drifted, setDrifted] = useState(false);
  const effective: BottlePose = pose === 'opening' && drifted ? 'away' : pose;
  const place = effective === 'away' ? geo.away : geo.float;
  const arriving = pose === 'float' && !reduced;

  // La posición estable va por CSS (left/top); las transiciones son solo transform (FLIP).
  const dx = useMotionValue(arriving ? 70 : 0);
  const dy = useMotionValue(arriving ? 10 : 0);
  const scale = useMotionValue(effective === 'away' ? geo.away.scale : 1);
  const opacity = useMotionValue(arriving ? 0 : 1);
  const wobble = useMotionValue(0);
  const tilt = useSpring(bottleTilt, spring.buoy);
  const rotate = useTransform([wobble, tilt], ([w, t]: number[]) => BOTTLE_TILT + w + t);

  const sealed = pose === 'float';
  const art = {
    corkX: useMotionValue(0),
    corkY: useMotionValue(0),
    corkRotate: useMotionValue(0),
    corkOpacity: useMotionValue(sealed ? 1 : 0),
    letter: useMotionValue(sealed ? 1 : 0),
    bubbles: useMotionValue(0),
  };
  const corkRef = useRef<SVGGElement>(null);
  const neckRef = useRef<SVGCircleElement>(null);
  const geoRef = useRef(geo);
  useLayoutEffect(() => {
    geoRef.current = geo;
  });

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

  // Cambio de pose: el sitio cambia de golpe en CSS y el transform recorre la distancia.
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
    animate(dx, 0, t);
    animate(dy, 0, t);
    animate(scale, effective === 'away' ? g.away.scale : 1, t);
  }, [effective, reduced, dx, dy, scale]);

  // Apertura: tambaleo, el corcho salta, burbujas, la carta sale y el corcho cae al agua.
  useEffect(() => {
    if (pose !== 'opening') return;
    let cancelled = false;

    const launch = () => {
      const neck = neckRef.current?.getBoundingClientRect();
      if (!neck) return;
      bottleBus.launch({
        x: neck.left + neck.width / 2,
        y: neck.top + neck.height / 2,
        length: (LETTER_LENGTH / BOTTLE_VIEW.width) * geoRef.current.width,
        angle: BOTTLE_TILT + wobble.get(),
      });
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
              glint={!lite && pose === 'float'}
              corkRef={corkRef}
              neckRef={neckRef}
            />
          </m.div>
        </div>
      </div>
    </m.div>
  );
}
