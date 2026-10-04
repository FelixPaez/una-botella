import { useId, type ReactNode } from 'react';

const W = 64;
const H = 76;
const HOLE = 2.3;
const STEP = 6.4;

/** Agujeros del troquel: círculos repartidos por los cuatro bordes. */
const holes = [
  ...Array.from({ length: Math.round(W / STEP) + 1 }, (_, i) => [(i * W) / Math.round(W / STEP), 0]),
  ...Array.from({ length: Math.round(W / STEP) + 1 }, (_, i) => [(i * W) / Math.round(W / STEP), H]),
  ...Array.from({ length: Math.round(H / STEP) + 1 }, (_, i) => [0, (i * H) / Math.round(H / STEP)]),
  ...Array.from({ length: Math.round(H / STEP) + 1 }, (_, i) => [W, (i * H) / Math.round(H / STEP)]),
];

type StampProps = {
  /** Motivo del sello (SVG en un área de 52×46 que empieza en 6,6). Por defecto, sol y olas. */
  children?: ReactNode;
  label?: string;
  className?: string;
};

/** Sello de correos con borde troquelado de verdad (la sombra sigue los agujeros). */
export function Stamp({ children, label = 'CORREO MARINO', className = '' }: StampProps) {
  const id = `stamp-${useId().replace(/[^\w-]/g, '')}`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className={`drop-shadow-[0_2px_3px_rgb(20_58_69/0.25)] ${className}`}
      aria-hidden="true"
    >
      <defs>
        <mask id={id}>
          <rect width={W} height={H} fill="#fff" />
          {holes.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={HOLE} fill="#000" />
          ))}
        </mask>
      </defs>
      <g mask={`url(#${id})`}>
        <rect width={W} height={H} fill="#fdfcf7" />
        <rect x={6} y={6} width={52} height={46} rx={1.5} fill="#d9ecf7" />
        {children ?? (
          <g>
            <circle cx={40} cy={22} r={7} fill="#f1cb86" />
            <path d="M6 36c6-4 11-4 17 0s11 4 17 0 12-4 18 0v16H6z" fill="#9ad3ea" />
            <path d="M6 42c6-3.5 11-3.5 17 0s11 3.5 17 0 12-3.5 18 0v10H6z" fill="#5bb3d9" />
          </g>
        )}
        <rect x={6} y={6} width={52} height={46} rx={1.5} fill="none" stroke="#18466a" strokeOpacity={0.18} />
        <text
          x={W / 2}
          y={65}
          textAnchor="middle"
          fontFamily="DM Sans, sans-serif"
          fontWeight={700}
          fontSize={5.6}
          letterSpacing={1.1}
          fill="#18466a"
        >
          {label}
        </text>
      </g>
    </svg>
  );
}

/** Hueco punteado donde caerá el sello al elegir la postal. */
export function StampSlot({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-[76px] w-[64px] rounded-[4px] border-[1.5px] border-dashed border-tide/40 ${className}`}
    />
  );
}
