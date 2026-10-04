import type { HTMLMotionProps } from 'motion/react';
import * as m from 'motion/react-m';
import type { ReactNode } from 'react';
import { transition } from '../design/motion.ts';

type HintButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & { icon?: ReactNode; children: ReactNode };

/** Indicación discreta que además es un botón (para teclado y lectores de pantalla). */
export function HintButton({ icon, children, className = '', ...rest }: HintButtonProps) {
  return (
    <m.button
      type="button"
      whileTap={{ scale: 0.96 }}
      transition={transition.tap}
      className={`hint-button ${className}`}
      {...rest}
    >
      {icon && (
        <span aria-hidden="true" className="hint-button__icon">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </m.button>
  );
}
