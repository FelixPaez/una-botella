import { useTransform, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';

const BLOBS = [
  { x: 14, y: 22, s: 1.1, d: 7 },
  { x: 52, y: 10, s: 1.3, d: 9 },
  { x: 84, y: 38, s: 1.2, d: 8 },
  { x: 32, y: 56, s: 1.4, d: 10 },
  { x: 70, y: 76, s: 1.15, d: 7.5 },
  { x: 10, y: 86, s: 1, d: 8.5 },
];

type MistProps = {
  /** 0 → 1: la bruma llega (primer toque). */
  fog: MotionValue<number>;
  /** 0 → 1: progreso de mantener presionado; la bruma se disipa en proporción. */
  progress: MotionValue<number>;
};

/** Bruma marina sobre el papel: manchas suaves que se abren y se desvanecen al mantener. */
export function Mist({ fog, progress }: MistProps) {
  const opacity = useTransform([fog, progress], ([f, p]: number[]) => f * (1 - p));
  return (
    <m.div className="mist" style={{ opacity }} aria-hidden="true">
      {BLOBS.map((blob, i) => (
        <MistBlob key={i} blob={blob} progress={progress} />
      ))}
    </m.div>
  );
}

function MistBlob({ blob, progress }: { blob: (typeof BLOBS)[number]; progress: MotionValue<number> }) {
  const x = useTransform(progress, [0, 1], [0, (blob.x < 50 ? -1 : 1) * 48]);
  const y = useTransform(progress, [0, 1], [0, (blob.y < 50 ? -1 : 1) * 24]);
  const scale = useTransform(progress, [0, 1], [blob.s, blob.s * 1.28]);
  return (
    <m.span className="mist__blob" style={{ left: `${blob.x}%`, top: `${blob.y}%`, x, y, scale }}>
      <span style={{ animationDuration: `${blob.d}s` }} />
    </m.span>
  );
}
