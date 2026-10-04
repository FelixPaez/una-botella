import { useId, type ReactNode } from 'react';
import type { PlaceIllustration as Kind } from '../config.types.ts';

/**
 * Ilustraciones de respaldo de las postales (5:4). Misma gramática en todas:
 * horizonte a la misma altura, 3–4 tonos de la paleta y un trazo fino teal.
 * Los detalles con clase art-* se animan cuando la postal está activa.
 */
export function PlaceIllustration({ kind }: { kind: Kind }) {
  const uid = useId().replace(/[^\w-]/g, '');
  const id = (name: string) => `${name}-${uid}`;
  const Scene = SCENES[kind];
  return (
    <svg viewBox="0 0 500 400" preserveAspectRatio="xMidYMid slice" className="place-illustration" aria-hidden="true">
      <Scene id={id} />
    </svg>
  );
}

type SceneProps = { id: (name: string) => string };

const HORIZON = 232;

function Gradient({ id, stops }: { id: string; stops: [number, string, number?][] }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      {stops.map(([offset, color, opacity = 1]) => (
        <stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
      ))}
    </linearGradient>
  );
}

function Sea({ fill, foam = '#ffffff', foamOpacity = 0.5 }: { fill: string; foam?: string; foamOpacity?: number }) {
  return (
    <>
      <rect y={HORIZON - 2} width="500" height={400 - HORIZON + 2} fill={fill} />
      <path
        d={`M0 ${HORIZON + 4}c42-7 83-7 125 0s83 7 125 0 83-7 125 0 83 7 125 0`}
        fill="none"
        stroke={foam}
        strokeOpacity={foamOpacity}
        strokeWidth="2"
      />
    </>
  );
}

/** Atardecer: el sol medio hundido y su estela dorada. */
function Sunset({ id }: SceneProps) {
  return (
    <>
      <defs>
        <Gradient id={id('sky')} stops={[[0, '#c9dbe6'], [0.62, '#ecdcbf'], [1, '#f3c98a']]} />
        <Gradient id={id('sea')} stops={[[0, '#a7d6cf'], [1, '#5fa9a7']]} />
      </defs>
      <rect width="500" height={HORIZON} fill={`url(#${id('sky')})`} />
      <circle cx="330" cy={HORIZON} r="96" fill="#f6d6a2" opacity="0.4" />
      <circle cx="330" cy={HORIZON} r="44" fill="#fbe7c2" />
      <Sea fill={`url(#${id('sea')})`} foam="#fbe7c2" foamOpacity={0.7} />
      <g className="art-twinkle" fill="#fbe2b0">
        <rect x="302" y="252" width="56" height="3" rx="1.5" />
        <rect x="288" y="272" width="84" height="3" rx="1.5" opacity="0.85" />
        <rect x="272" y="296" width="116" height="3" rx="1.5" opacity="0.65" />
        <rect x="252" y="324" width="156" height="3" rx="1.5" opacity="0.45" />
      </g>
      <path d="M0 352c50-9 100-9 150 0s100 9 150 0 100-9 200 0V400H0z" fill="#4f9c97" opacity="0.5" />
      <path d="M118 132q9-9 18 0m0 0q9-9 18 0M182 106q6-6 12 0m0 0q6-6 12 0" fill="none" stroke="#1f4e5a" strokeWidth="2.4" strokeLinecap="round" opacity="0.5" />
      <path d="M112 226l12-30v30zm14 0v-24l9 24zM104 228h36l-5 5h-26z" fill="#1f4e5a" opacity="0.45" />
    </>
  );
}

/** Picnic: mantel menta en la arena, cesta y fruta, con la orilla al fondo. */
function Picnic({ id }: SceneProps) {
  return (
    <>
      <defs>
        <Gradient id={id('sky')} stops={[[0, '#c6e3ef'], [1, '#eef8f6']]} />
        <Gradient id={id('sea')} stops={[[0, '#aee0d8'], [1, '#86c5d0']]} />
        <Gradient id={id('sand')} stops={[[0, '#f4ead9'], [1, '#e7d7bd']]} />
      </defs>
      <rect width="500" height={HORIZON} fill={`url(#${id('sky')})`} />
      <circle cx="400" cy="74" r="26" fill="#fffaf0" />
      <circle cx="400" cy="74" r="52" fill="#fffaf0" opacity="0.35" />
      <Sea fill={`url(#${id('sea')})`} />
      <path d="M0 262c60 10 120-8 190 0s130 14 190 2 90-6 120 0V400H0z" fill={`url(#${id('sand')})`} />
      <path className="art-wave" d="M0 262c60 10 120-8 190 0s130 14 190 2 90-6 120 0" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.85" />
      <g transform="translate(118 292) skewX(-18)">
        <rect width="216" height="78" rx="4" fill="#cbece2" />
        <g stroke="#6fc0b1" strokeWidth="9" opacity="0.55">
          <path d="M27 0v78M81 0v78M135 0v78M189 0v78" />
          <path d="M0 19h216M0 58h216" />
        </g>
        <rect width="216" height="78" rx="4" fill="none" stroke="#1f4e5a" strokeOpacity="0.3" strokeWidth="1.5" />
      </g>
      <path d="M262 300c0-22 46-22 46 0" fill="none" stroke="#a98457" strokeWidth="4" strokeLinecap="round" />
      <rect x="252" y="298" width="66" height="36" rx="8" fill="#d8b98c" />
      <path d="M256 310h58M256 322h58" stroke="#a98457" strokeWidth="2" opacity="0.6" />
      <circle cx="200" cy="330" r="10" fill="#f1cb86" />
      <circle cx="221" cy="336" r="8.5" fill="#6fc0b1" />
      <circle cx="212" cy="318" r="7.5" fill="#f1cb86" opacity="0.85" />
      <path d="M408 344c6-6 14-2 11 4s-11 4-9-1" fill="none" stroke="#c9b28c" strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

/** Café: una taza humeante ante una ventana que da al mar. */
function Cafe({ id }: SceneProps) {
  return (
    <>
      <defs>
        <Gradient id={id('sky')} stops={[[0, '#cfe7f1'], [1, '#eef8f6']]} />
        <Gradient id={id('sea')} stops={[[0, '#a7dbd3'], [1, '#7fc0c6']]} />
        <clipPath id={id('window')}>
          <rect x="70" y="38" width="360" height="232" rx="14" />
        </clipPath>
      </defs>
      <rect width="500" height="400" fill="#f3ebde" />
      <g clipPath={`url(#${id('window')})`}>
        <rect x="70" y="38" width="360" height="232" fill={`url(#${id('sky')})`} />
        <circle cx="330" cy="104" r="22" fill="#fffaf0" />
        <rect x="70" y="190" width="360" height="80" fill={`url(#${id('sea')})`} />
        <path d="M70 196c40-6 80-6 120 0s80 6 120 0 80-6 120 0" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.6" />
      </g>
      <rect x="70" y="38" width="360" height="232" rx="14" fill="none" stroke="#1f4e5a" strokeWidth="6" />
      <path d="M250 38v232M70 154h360" stroke="#1f4e5a" strokeWidth="4" opacity="0.85" />
      <rect y="300" width="500" height="100" fill="#e6d6bb" />
      <path d="M0 300h500" stroke="#c9b28c" strokeWidth="3" />
      <ellipse cx="250" cy="340" rx="82" ry="15" fill="#fbf9f4" stroke="#1f4e5a" strokeOpacity="0.35" strokeWidth="2" />
      <path d="M198 268h104c0 34-16 66-52 66s-52-32-52-66z" fill="#fbf9f4" stroke="#1f4e5a" strokeOpacity="0.45" strokeWidth="2" />
      <path d="M302 282c26 0 26 30 0 30" fill="none" stroke="#1f4e5a" strokeOpacity="0.45" strokeWidth="5" />
      <ellipse cx="250" cy="270" rx="50" ry="8" fill="#8a6a4a" />
      <g className="art-steam" fill="none" stroke="#1f4e5a" strokeWidth="2.5" strokeLinecap="round" opacity="0.35">
        <path d="M232 250c-8-12 8-18 0-30" />
        <path d="M252 246c-8-12 8-18 0-30" />
        <path d="M272 250c-8-12 8-18 0-30" />
      </g>
    </>
  );
}

/** Paseo nocturno: la costa de noche, farolas y estrellas para contar. */
function NightWalk({ id }: SceneProps) {
  return (
    <>
      <defs>
        <Gradient id={id('sky')} stops={[[0, '#0d2a33'], [1, '#1f4e5a']]} />
        <Gradient id={id('sea')} stops={[[0, '#1f4e5a'], [1, '#143a45']]} />
        <radialGradient id={id('glow')}>
          <stop offset="0" stopColor="#f1cb86" stopOpacity="0.8" />
          <stop offset="1" stopColor="#f1cb86" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="500" height={HORIZON} fill={`url(#${id('sky')})`} />
      <g className="art-twinkle" fill="#f4fbf9">
        {[
          [40, 40, 1.6], [92, 88, 1.2], [150, 30, 1.8], [210, 70, 1.1], [260, 22, 1.4], [300, 96, 1.2],
          [352, 50, 1.7], [418, 30, 1.2], [456, 92, 1.5], [128, 140, 1], [380, 150, 1.1], [60, 170, 1.2],
        ].map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>
      <path d="M118 64a22 22 0 1 0 16 38 18 18 0 1 1-16-38z" fill="#eef8f4" />
      <Sea fill={`url(#${id('sea')})`} foam="#cbece2" foamOpacity={0.35} />
      <g fill="#dceee9" opacity="0.6">
        <rect x="104" y="250" width="40" height="2.5" rx="1.25" />
        <rect x="96" y="266" width="58" height="2.5" rx="1.25" opacity="0.7" />
        <rect x="90" y="284" width="74" height="2.5" rx="1.25" opacity="0.5" />
      </g>
      <path d="M0 330l500-40V400H0z" fill="#0f3540" />
      <path d="M0 330l500-40" stroke="#3b8792" strokeWidth="3" />
      <path d="M0 340l500-40" stroke="#3b8792" strokeWidth="1.5" opacity="0.6" />
      {[
        [150, 318],
        [300, 306],
        [440, 295],
      ].map(([x, y]) => (
        <g key={x}>
          <circle className="art-glow" cx={x} cy={y - 64} r="26" fill={`url(#${id('glow')})`} />
          <path d={`M${x} ${y}v-58`} stroke="#3b8792" strokeWidth="3" />
          <circle cx={x} cy={y - 62} r="5" fill="#f1cb86" />
        </g>
      ))}
    </>
  );
}

/** Plan misterioso: al anochecer, las estrellas dibujan una interrogación. */
function Mystery({ id }: SceneProps) {
  const points: [number, number][] = [
    [214, 92], [244, 70], [282, 74], [302, 100], [290, 130], [262, 148], [256, 178],
  ];
  return (
    <>
      <defs>
        <Gradient id={id('sky')} stops={[[0, '#143a45'], [0.6, '#2f6f78'], [1, '#8ccad9']]} />
        <Gradient id={id('sea')} stops={[[0, '#5fa9a7'], [1, '#1f4e5a']]} />
      </defs>
      <rect width="500" height={HORIZON} fill={`url(#${id('sky')})`} />
      <polyline points={points.map((p) => p.join(',')).join(' ')} fill="none" stroke="#cbece2" strokeWidth="1.4" strokeDasharray="3 5" opacity="0.6" />
      <g className="art-twinkle" fill="#f4fbf9">
        {points.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3.4" />
        ))}
        <circle cx="256" cy="204" r="4" />
      </g>
      <g fill="#f4fbf9" opacity="0.5">
        {[
          [60, 50], [110, 120], [380, 60], [430, 130], [340, 170], [150, 180], [460, 40],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" />
        ))}
      </g>
      <Sea fill={`url(#${id('sea')})`} />
      <path d="M0 330c50-9 100-9 150 0s100 9 150 0 100-9 200 0V400H0z" fill="#143a45" opacity="0.45" />
    </>
  );
}

const SCENES: Record<Kind, (props: SceneProps) => ReactNode> = {
  sunset: Sunset,
  picnic: Picnic,
  cafe: Cafe,
  'night-walk': NightWalk,
  mystery: Mystery,
};

/** Motivo del sello de cada plan (área 52 × 46 que empieza en 6,6 dentro del sello). */
export function StampMotif({ kind }: { kind: Kind }) {
  switch (kind) {
    case 'sunset':
      return (
        <g>
          <rect x="6" y="6" width="52" height="46" fill="#f3dcb4" />
          <circle cx="32" cy="36" r="10" fill="#fbe7c2" />
          <rect x="6" y="36" width="52" height="16" fill="#7fc0bb" />
        </g>
      );
    case 'picnic':
      return (
        <g>
          <rect x="6" y="6" width="52" height="46" fill="#f4ead9" />
          <rect x="6" y="6" width="52" height="18" fill="#9fdcd1" />
          <path d="M14 42l8-14h28l-8 14z" fill="#cbece2" stroke="#6fc0b1" />
          <circle cx="40" cy="34" r="3.5" fill="#f1cb86" />
        </g>
      );
    case 'cafe':
      return (
        <g>
          <rect x="6" y="6" width="52" height="46" fill="#f3ebde" />
          <path d="M22 28h20c0 9-4 14-10 14s-10-5-10-14z" fill="#fbf9f4" stroke="#1f4e5a" strokeOpacity="0.5" />
          <path d="M28 24c-2-3 2-5 0-8M36 24c-2-3 2-5 0-8" stroke="#1f4e5a" strokeOpacity="0.4" fill="none" />
        </g>
      );
    case 'night-walk':
      return (
        <g>
          <rect x="6" y="6" width="52" height="46" fill="#1f4e5a" />
          <path d="M26 14a9 9 0 1 0 7 15 7 7 0 1 1-7-15z" fill="#eef8f4" />
          <circle cx="44" cy="18" r="1.3" fill="#f4fbf9" />
          <circle cx="48" cy="30" r="1" fill="#f4fbf9" />
          <circle cx="16" cy="40" r="2.5" fill="#f1cb86" />
        </g>
      );
    case 'mystery':
      return (
        <g>
          <rect x="6" y="6" width="52" height="46" fill="#2f6f78" />
          <text x="32" y="42" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontSize="30" fontWeight="600" fill="#f4fbf9">
            ?
          </text>
        </g>
      );
  }
}
