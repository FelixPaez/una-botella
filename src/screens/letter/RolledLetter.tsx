import { useTransform, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';

/** La carta enrollada: un cilindro de papel con sus extremos en espiral y una cinta teal. */
export function RolledLetter({ ribbon }: { ribbon: MotionValue<number> }) {
  // ribbon: 0 = atada · 1 = la cinta ya cayó
  const y = useTransform(ribbon, [0, 1], [0, 46]);
  const rotate = useTransform(ribbon, [0, 1], [0, 28]);
  const opacity = useTransform(ribbon, [0, 0.6, 1], [1, 1, 0]);
  return (
    <div className="roll" aria-hidden="true">
      <span className="roll__cap roll__cap--left" />
      <span className="roll__cap roll__cap--right" />
      <m.span className="roll__ribbon" style={{ y, rotate, opacity }}>
        <svg viewBox="0 0 26 44" width="26" height="44">
          <rect x="9.5" y="7" width="7" height="31" fill="#26729c" />
          <path d="M13 8c-5.6-6.4-12.4-5.2-10 .3 1.7 3.6 6.6 1.8 10-.3zm0 0c5.6-6.4 12.4-5.2 10 .3-1.7 3.6-6.6 1.8-10-.3z" fill="#26729c" />
          <path d="M11.4 8.6 8 15M14.6 8.6 18 15" stroke="#20668f" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </m.span>
    </div>
  );
}
