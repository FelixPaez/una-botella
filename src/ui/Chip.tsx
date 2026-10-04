import type { HTMLMotionProps } from 'motion/react';
import * as m from 'motion/react-m';
import type { ReactNode } from 'react';
import { feedback } from '../design/feedback.ts';
import { transition } from '../design/motion.ts';

type ChipProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  selected?: boolean;
  icon?: ReactNode;
  children: ReactNode;
};

/**
 * Chip seleccionable (horarios, opciones). Por defecto se comporta como radio:
 * va dentro de un contenedor con role="radiogroup".
 */
export function Chip({ selected = false, icon, children, className = '', onClick, role = 'radio', ...rest }: ChipProps) {
  return (
    <m.button
      type="button"
      role={role}
      aria-checked={role === 'radio' ? selected : undefined}
      aria-pressed={role === 'radio' ? undefined : selected}
      whileTap={{ scale: 0.96 }}
      transition={transition.tap}
      className={
        'relative isolate inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-chip px-4 ' +
        'font-sans text-small font-semibold ring-1 disabled:pointer-events-none disabled:opacity-40 ' +
        (selected ? 'text-foam ring-deep ' : 'glass text-deep ring-deep/10 ') +
        className
      }
      onClick={(event) => {
        feedback('tick');
        onClick?.(event);
      }}
      {...rest}
    >
      {/* El relleno elegido aparece por opacidad y escala, nunca cambiando el color del fondo. */}
      <m.span
        aria-hidden="true"
        className="absolute inset-0 -z-10 rounded-chip bg-deep"
        initial={false}
        animate={{ opacity: selected ? 1 : 0, scale: selected ? 1 : 0.92 }}
        transition={transition.tap}
      />
      {icon && (
        <span aria-hidden="true" className="grid size-4 place-items-center">
          {icon}
        </span>
      )}
      {children}
    </m.button>
  );
}
