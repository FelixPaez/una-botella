import { useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { Fragment, useMemo } from 'react';
import { stagger, transition } from '../design/motion.ts';

type RevealTextProps = {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  /** Segundos antes de que empiece a aparecer la primera palabra. */
  delay?: number;
  /** true = todo visible al instante (cuando ella toca para adelantar). */
  complete?: boolean;
  onDone?: () => void;
};

/**
 * Titular con revelado: cada palabra sube desde su máscara, una tras otra.
 * Los lectores de pantalla reciben el texto completo desde el principio.
 */
export function RevealText({ text, as: Tag = 'p', className, delay = 0, complete = false, onDone }: RevealTextProps) {
  const reduced = useReducedMotion();
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <Fragment key={i}>
            <span className="reveal-word">
              {complete ? (
                <span className="inline-block">{word}</span>
              ) : (
                <m.span
                  className="inline-block"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: '108%' }}
                  animate={{ opacity: 1, y: '0%' }}
                  transition={{
                    ...(reduced ? transition.reduced : transition.enter),
                    delay: delay + i * (reduced ? 0.02 : stagger.word),
                  }}
                  onAnimationComplete={i === words.length - 1 ? onDone : undefined}
                >
                  {word}
                </m.span>
              )}
            </span>
            {i < words.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
