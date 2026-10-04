import { useTransform, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';
import { Fragment, useMemo, type ReactNode } from 'react';
import { BANDS, CREST_OVERLAP, CREST_WIDTH, seeded, wavePath, type BandSpec } from './waves.ts';

type Props = { width: number; parallax: MotionValue<number>; lite: boolean; actors?: ReactNode };

export function Water({ width, parallax, lite, actors }: Props) {
  return (
    <div className="water">
      {BANDS.map((band) => (
        <Fragment key={band.id}>
          {/* Los actores (la botella) van entre olas: la delantera los tapa y flotan de verdad. */}
          {band.id === 'front' && actors}
          <WaveBand spec={band} width={width} parallax={parallax} />
        </Fragment>
      ))}
      <LightRays />
      <div className="water-tint water-tint--morning" />
      <div className="water-tint water-tint--sunset" />
      <div className="water-tint water-tint--night" />
      <div className="sun-path sun-path--day" />
      <div className="sun-path sun-path--sunset" />
      <div className="sun-path sun-path--moon" />
      <Glints tone="cool" count={lite ? 7 : 14} />
      <Glints tone="warm" count={lite ? 7 : 14} />
      <Bubbles count={lite ? 4 : 9} />
    </div>
  );
}

function WaveBand({ spec, width, parallax }: { spec: BandSpec; width: number; parallax: MotionValue<number> }) {
  // Número entero de olas por tramo (y recalculado al girar el móvil) para que el bucle encaje.
  const periods = Math.max(1, Math.round((width + 32) / spec.wavelength));
  const crestHeight = spec.amp * 2 + CREST_OVERLAP;
  const path = useMemo(
    () => wavePath({ periods, amp: spec.amp, height: crestHeight, seed: spec.seed }),
    [periods, spec.amp, spec.seed, crestHeight],
  );
  const x = useTransform(parallax, (v) => v * spec.depth);

  return (
    <div className="band" style={{ top: `${spec.top * 100}%` }}>
      <div
        className="band__body"
        style={{
          top: spec.amp * 2 + CREST_OVERLAP / 2,
          // Mismo color plano que la cresta mientras la tapa (y su vaivén): sin escalón visible.
          background: `linear-gradient(180deg, ${spec.colors[0]} ${CREST_OVERLAP}px, ${spec.colors[1]})`,
        }}
      />
      <m.div className="band__crest" style={{ height: crestHeight, x }}>
        <div className="band__swell">
          <div className={`band__bob band__bob--${spec.bob}`} style={{ animationDuration: `${spec.bobDuration}s` }}>
            <div className="band__drift" style={{ animationDuration: `${spec.drift}s` }}>
              <svg viewBox={`0 0 ${CREST_WIDTH} ${crestHeight}`} preserveAspectRatio="none">
                <path d={path.fill} fill={spec.colors[0]} />
                <path
                  d={path.line}
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity={spec.foam}
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>
        </div>
      </m.div>
    </div>
  );
}

/** Estela de destellos que se abre en abanico desde el horizonte. */
function Glints({ tone, count }: { tone: 'cool' | 'warm'; count: number }) {
  const glints = useMemo(() => {
    const rand = seeded(tone === 'cool' ? 11 : 23);
    return Array.from({ length: count }, (_, i) => {
      const depth = 0.03 + (i / count) * 0.42;
      const spread = 0.04 + depth * 0.4;
      return {
        top: depth * 100,
        left: (0.74 + (rand() - 0.5) * spread) * 100,
        width: 6 + rand() * 14 + depth * 18,
        duration: 2.2 + rand() * 2,
        delay: -rand() * 4,
      };
    });
  }, [tone, count]);

  return (
    <div className={`glints glints--${tone}`}>
      {glints.map((g, i) => (
        <span
          key={i}
          className="glint"
          style={{
            top: `${g.top}%`,
            left: `${g.left}%`,
            width: g.width,
            animationDuration: `${g.duration}s`,
            animationDelay: `${g.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Haces de luz que entran por la superficie y respiran despacio (solo opacidad). */
const RAYS = [
  { left: 8, width: 7, duration: 7.5, delay: -2 },
  { left: 24, width: 4, duration: 6.2, delay: -5 },
  { left: 41, width: 9, duration: 8.4, delay: -1 },
  { left: 63, width: 5, duration: 6.8, delay: -3.5 },
  { left: 80, width: 8, duration: 7.9, delay: -6 },
];

function LightRays() {
  return (
    <div className="light-rays" aria-hidden="true">
      {RAYS.map((r) => (
        <span
          key={r.left}
          className="light-ray"
          style={{ left: `${r.left}%`, width: `${r.width}%`, animationDuration: `${r.duration}s`, animationDelay: `${r.delay}s` }}
        />
      ))}
    </div>
  );
}

function Bubbles({ count }: { count: number }) {
  const bubbles = useMemo(() => {
    const rand = seeded(5);
    return Array.from({ length: count }, () => {
      const rise = 14 + rand() * 12;
      return {
        left: 6 + rand() * 88,
        size: 5 + rand() * 11,
        rise,
        delay: -rand() * rise,
        sway: 3 + rand() * 2.5,
      };
    });
  }, [count]);

  return (
    <>
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="bubble"
          style={{ left: `${b.left}%`, animationDuration: `${b.rise}s`, animationDelay: `${b.delay}s` }}
        >
          <div className="bubble__sway" style={{ animationDuration: `${b.sway}s` }}>
            <div className="bubble__ball" style={{ width: b.size, height: b.size }} />
          </div>
        </div>
      ))}
    </>
  );
}
