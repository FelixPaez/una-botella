import { useTransform, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';
import { useId, type Ref } from 'react';
import { BOTTLE_VIEW } from './geometry.ts';

/** Silueta del vidrio: cuerpo redondeado, hombro, cuello y gollete. */
const GLASS =
  'M40 26H140C158 26 166 45 184 45H203V42.5H210V73.5H203V71H184C166 71 158 90 140 90H40C22 90 14 76 14 58C14 40 22 26 40 26Z';

export type BottleArtMotion = {
  corkX: MotionValue<number>;
  corkY: MotionValue<number>;
  corkRotate: MotionValue<number>;
  corkOpacity: MotionValue<number>;
  /** Opacidad de la carta que se ve dentro. */
  letter: MotionValue<number>;
  /** 0 → 1: burbujitas que salen del cuello al destaparla. */
  bubbles: MotionValue<number>;
};

type Props = {
  name: string;
  width: number;
  motion: BottleArtMotion;
  /** Destello que cruza el vidrio cada pocos segundos. */
  glint: boolean;
  corkRef?: Ref<SVGGElement>;
  neckRef?: Ref<SVGCircleElement>;
};

/** La botella en capas: la carta enrollada se ve dentro, entre el vidrio trasero y el delantero. */
export function BottleArt({ name, width, motion, glint, corkRef, neckRef }: Props) {
  const uid = useId().replace(/[^\w-]/g, '');
  const id = (k: string) => `${k}-${uid}`;
  const label = name.length > 16 ? `${name.slice(0, 15)}…` : name;
  const tagWidth = Math.min(112, Math.max(46, 28 + label.length * 6.2));
  const tagRight = 182;
  const tagLeft = tagRight - tagWidth;
  // Agujero de la etiqueta tras girarla −8°: ahí termina el cordel.
  const tagCenter = tagRight - tagWidth / 2;
  const holeX = tagCenter + (tagRight - 5 - tagCenter) * Math.cos((8 * Math.PI) / 180);
  const holeY = 17 - (tagRight - 5 - tagCenter) * Math.sin((8 * Math.PI) / 180);

  return (
    <svg
      viewBox={`0 0 ${BOTTLE_VIEW.width} ${BOTTLE_VIEW.height}`}
      width={width}
      height={(width * BOTTLE_VIEW.height) / BOTTLE_VIEW.width}
      overflow="visible"
      aria-hidden="true"
      className="block"
    >
      <defs>
        <linearGradient id={id('glass')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6f2ec" stopOpacity={0.55} />
          <stop offset="0.55" stopColor="#a6dcd2" stopOpacity={0.42} />
          <stop offset="1" stopColor="#4f9c92" stopOpacity={0.62} />
        </linearGradient>
        <linearGradient id={id('paper')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9ccb3" />
          <stop offset="0.22" stopColor="#f6f0e3" />
          <stop offset="0.5" stopColor="#fffdf6" />
          <stop offset="0.8" stopColor="#ece3d0" />
          <stop offset="1" stopColor="#cfc1a5" />
        </linearGradient>
        <linearGradient id={id('cork')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4c8a1" />
          <stop offset="0.5" stopColor="#d0ad80" />
          <stop offset="1" stopColor="#ad8960" />
        </linearGradient>
        <linearGradient id={id('glint')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity={0.7} />
          <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
        <clipPath id={id('clip')}>
          <path d={GLASS} />
        </clipPath>
      </defs>

      {/* Vidrio trasero */}
      <path d={GLASS} fill={`url(#${id('glass')})`} />
      <ellipse cx="208" cy="58" rx="2.2" ry="10" fill="#1f4e5a" opacity="0.28" />

      {/* La carta enrollada, atada con una cinta */}
      <m.g style={{ opacity: motion.letter }}>
        <rect x="44" y="49" width="102" height="22" rx="4" fill={`url(#${id('paper')})`} />
        <ellipse cx="44.5" cy="60" rx="3.6" ry="10.6" fill="#e3d8c2" />
        <ellipse cx="145.5" cy="60" rx="3.6" ry="10.6" fill="#f6f1e5" stroke="#c9b99a" strokeWidth="0.7" />
        <path d="M145.8 54.6c2.1.2 2.4 3.1.3 3.6s-2.5 4 .1 4.4" fill="none" stroke="#b5a585" strokeWidth="0.7" />
        <rect x="91.5" y="48.6" width="7" height="22.8" fill="#3b8792" />
        <path d="M95 48.8c-5.2-6-11.4-4.8-9.2.2 1.5 3.3 6.1 1.7 9.2-.2zm0 0c5.2-6 11.4-4.8 9.2.2-1.5 3.3-6.1 1.7-9.2-.2z" fill="#3b8792" />
      </m.g>

      {/* Vidrio delantero: brillo, borde y reflejos */}
      <path d={GLASS} fill="#ffffff" opacity="0.08" />
      <path d={GLASS} fill="none" stroke="#1f4e5a" strokeOpacity="0.24" strokeWidth="1.1" />
      <path d={GLASS} fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.4" transform="translate(0 0.6)" />
      <path d="M46 33.5H136" stroke="#ffffff" strokeOpacity="0.62" strokeWidth="4" strokeLinecap="round" />
      <path d="M24 47c-3 6-3 12 0 18" fill="none" stroke="#ffffff" strokeOpacity="0.36" strokeWidth="3" strokeLinecap="round" />
      <path d="M155 33c8 3 13 8 19 12" fill="none" stroke="#ffffff" strokeOpacity="0.42" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M188 49H201" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      {glint && (
        <g clipPath={`url(#${id('clip')})`}>
          <g className="bottle__glint">
            <rect x="-20" y="-20" width="24" height="150" fill={`url(#${id('glint')})`} transform="rotate(20 -8 55)" />
          </g>
        </g>
      )}

      {/* Cordel alrededor del cuello y etiqueta con su nombre */}
      <path d="M191 45.6v25M194.2 45.2v25.6" stroke="#b8956b" strokeWidth="1.4" />
      <path
        d={`M193 45C191.5 35 186 ${holeY + 9} ${holeX.toFixed(1)} ${holeY.toFixed(1)}`}
        fill="none"
        stroke="#b8956b"
        strokeWidth="1.1"
      />
      <g transform={`rotate(-8 ${tagCenter} 17)`}>
        <path
          d={`M${tagLeft} 8H${tagRight - 6}L${tagRight} 14V20L${tagRight - 6} 26H${tagLeft}Z`}
          fill="#fbf9f4"
          stroke="#1f4e5a"
          strokeOpacity="0.3"
          strokeWidth="0.8"
        />
        <circle cx={tagRight - 5} cy="17" r="1.8" fill="none" stroke="#1f4e5a" strokeOpacity="0.4" strokeWidth="0.8" />
        <text x={tagLeft + 7} y="20.6" fontFamily="Fraunces, Georgia, serif" fontSize="10.5" fontWeight="600" fill="#1f4e5a">
          {label}
        </text>
      </g>

      {/* Corcho */}
      <m.g
        ref={corkRef}
        style={{ x: motion.corkX, y: motion.corkY, rotate: motion.corkRotate, opacity: motion.corkOpacity }}
      >
        <path d="M207 47.5h17.5a3.5 3.5 0 0 1 3.5 3.5v14a3.5 3.5 0 0 1-3.5 3.5H207z" fill={`url(#${id('cork')})`} />
        <path d="M207 47.5h17.5a3.5 3.5 0 0 1 3.5 3.5v14a3.5 3.5 0 0 1-3.5 3.5H207z" fill="none" stroke="#8f6f4b" strokeOpacity="0.35" strokeWidth="0.8" />
        <circle cx="213.5" cy="53" r="0.9" fill="#9b7a53" />
        <circle cx="220" cy="59.5" r="0.8" fill="#9b7a53" />
        <circle cx="215.5" cy="63.5" r="0.9" fill="#9b7a53" />
        <circle cx="223.5" cy="52.5" r="0.7" fill="#9b7a53" />
      </m.g>

      {/* Burbujitas que escapan al destaparla */}
      {[0, 1, 2, 3].map((i) => (
        <NeckBubble key={i} index={i} progress={motion.bubbles} />
      ))}

      {/* Punto de salida de la carta (para la animación) */}
      <circle ref={neckRef} cx="212" cy="58" r="0.5" fill="none" />
    </svg>
  );
}

function NeckBubble({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const y = useTransform(progress, [0, 1], [0, -(16 + index * 9)]);
  const x = useTransform(progress, [0, 1], [0, index * 5 - 4]);
  const opacity = useTransform(progress, [0, 0.12, 1], [0, 0.95, 0]);
  return (
    <m.circle
      cx={211 + index * 2}
      cy={56 - index * 2}
      r={1.6 + (index % 2) * 0.9}
      fill="none"
      stroke="#ffffff"
      strokeWidth="0.9"
      style={{ x, y, opacity }}
    />
  );
}
