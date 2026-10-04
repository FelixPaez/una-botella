import type { HTMLMotionProps } from 'motion/react';
import * as m from 'motion/react-m';
import type { ReactNode } from 'react';
import { feedback } from '../design/feedback.ts';
import { transition } from '../design/motion.ts';
import type { SoundName } from '../sound/types.ts';

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
  children: ReactNode;
  /** Respuesta al pulsar (sonido + vibración). null = ninguna. */
  sound?: SoundName | null;
  block?: boolean;
};

const BASE =
  'relative isolate inline-flex min-h-13 select-none items-center justify-center gap-2.5 rounded-full px-7 ' +
  'font-sans text-body font-semibold tracking-[0.01em] disabled:pointer-events-none disabled:opacity-45 ' +
  // Capa de brillo al pasar el ratón: se anima su opacidad, nunca el color.
  'after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:opacity-0 ' +
  'after:transition-opacity after:duration-(--duration-tap) hover:after:opacity-100';

const VARIANTS = {
  primary: 'btn-primary bg-deep text-foam shadow-button after:bg-white/10',
  secondary: 'glass text-deep shadow-soft after:bg-white/40',
} as const;

/** Botón principal (teal profundo) y secundario (cristal). Mínimo 52 px de alto. */
export function Button({
  variant = 'primary',
  icon,
  children,
  sound = 'tick',
  block = false,
  className = '',
  onClick,
  ...rest
}: ButtonProps) {
  return (
    <m.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={transition.tap}
      className={`${BASE} ${VARIANTS[variant]} ${block ? 'w-full' : ''} ${className}`}
      onClick={(event) => {
        if (sound) feedback(sound);
        onClick?.(event);
      }}
      {...rest}
    >
      {icon && (
        <span aria-hidden="true" className="-ml-1 grid size-5 place-items-center">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </m.button>
  );
}

type ButtonLinkProps = Omit<HTMLMotionProps<'a'>, 'children'> & {
  icon?: ReactNode;
  children: ReactNode;
  block?: boolean;
};

/** Enlace con aspecto de botón principal (para abrir WhatsApp con un enlace real). */
export function ButtonLink({ icon, children, block = false, className = '', ...rest }: ButtonLinkProps) {
  return (
    <m.a
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={transition.tap}
      className={`${BASE} ${VARIANTS.primary} no-underline ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon && (
        <span aria-hidden="true" className="-ml-1 grid size-5 place-items-center">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </m.a>
  );
}
