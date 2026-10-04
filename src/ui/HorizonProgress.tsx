import * as m from 'motion/react-m';
import { useState } from 'react';
import { spring, transition } from '../design/motion.ts';
import type { Progress } from '../state/selectors.ts';

/** Hasta dónde llega el barquito; el último tramo es del faro. */
const TRAVEL = 0.9;

/** Indicador de progreso: una línea de horizonte con un barquito que navega hacia un faro. */
export function HorizonProgress({ progress }: { progress: Progress }) {
  const { index, total, arrived, labels } = progress;
  const at = (i: number) => (Math.min(i, total) / total) * TRAVEL;

  // El barquito mira hacia donde navega: si se vuelve atrás, se da la vuelta.
  const [last, setLast] = useState(index);
  const [facing, setFacing] = useState<1 | -1>(1);
  if (index !== last) {
    setFacing(index > last ? 1 : -1);
    setLast(index);
  }

  const current = [...labels].reverse().find((l) => l.at <= index);

  return (
    <div
      className="horizon text-on-sea"
      role="progressbar"
      aria-label="Progreso del viaje"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(index, total)}
      aria-valuetext={arrived ? 'Llegada' : current ? `${current.text}: paso ${index + 1} de ${total}` : undefined}
    >
      <div className="horizon__line" />
      <m.div
        className="horizon__wake"
        initial={false}
        animate={{ scaleX: Math.max(at(index), 0.001) }}
        transition={spring.buoy}
      />
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="horizon__buoy" data-passed={i <= index || undefined} style={{ left: `${at(i) * 100}%` }} />
      ))}
      {labels.map((label) => (
        <span
          key={label.text}
          className="horizon__label label-caps hidden lg:block"
          data-current={label === current || undefined}
          style={{ left: `${at(label.at) * 100}%` }}
        >
          {label.text}
        </span>
      ))}
      <m.div className="horizon__track" initial={false} animate={{ x: `${at(index) * 100}%` }} transition={spring.buoy}>
        <m.div className="horizon__boat" initial={false} animate={{ scaleX: facing }} transition={transition.enter}>
          <div className="horizon__boat-bob">
            <Boat />
          </div>
        </m.div>
      </m.div>
      <Lighthouse lit={arrived} />
    </div>
  );
}

function Boat() {
  return (
    <svg viewBox="0 0 30 28" width="30" height="28" aria-hidden="true">
      <path d="M14.4 2.5v17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M13.6 4 5.2 19.2h8.4z" fill="#fbf9f4" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M15.4 7.2v12h6.8z" fill="#fbf9f4" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M3 20.6h24.6l-3.4 4.6a1.6 1.6 0 0 1-1.3.6H7.4a1.6 1.6 0 0 1-1.3-.6z" fill="currentColor" />
    </svg>
  );
}

function Lighthouse({ lit }: { lit: boolean }) {
  return (
    <div className="horizon__lighthouse" data-lit={lit || undefined}>
      <svg viewBox="0 0 22 34" width="22" height="34" aria-hidden="true" overflow="visible">
        <circle className="horizon__beam" cx="11" cy="7.5" r="11" fill="#f1cb86" opacity="0" style={{ filter: 'blur(3px)' }} />
        <path d="M7.4 12.5h7.2l1.6 18.5H5.8z" fill="#fbf9f4" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
        <path d="M6.9 18.2h8.2l.4 4.4H6.5z" fill="currentColor" />
        <rect x="7" y="6" width="8" height="5.4" rx="1" fill={lit ? '#f1cb86' : '#fbf9f4'} stroke="currentColor" strokeWidth="1" />
        <path d="M6 6h10L11 2.2z" fill="currentColor" />
        <path d="M5.5 12.5h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
