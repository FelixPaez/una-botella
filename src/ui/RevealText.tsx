import { useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import { stagger, transition } from '../design/motion.ts';

type RevealTextProps = {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  className?: string;
  /** Segundos antes de que empiece a aparecer la primera palabra. */
  delay?: number;
  /** true = todo visible al instante (cuando ella toca para adelantar). */
  complete?: boolean;
  /** Se llama cuando termina de aparecer la última palabra. */
  onDone?: () => void;
};

/**
 * Titular con revelado: cada palabra sube desde su máscara, una tras otra.
 * Los lectores de pantalla reciben el texto completo desde el principio.
 */
export function RevealText({ text, as: Tag = 'p', className, delay = 0, complete = false, onDone }: RevealTextProps) {
  const reduced = useReducedMotion();
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const step = reduced ? 0.02 : stagger.word;
  const timing = reduced ? transition.reduced : transition.enter;

  // El final del revelado se conoce de antemano (todo sale de los tokens), así que se avisa
  // con un temporizador exacto en lugar de depender de los eventos de animación de cada palabra.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });
  useEffect(() => {
    if (complete) return;
    const total = (delay + (words.length - 1) * step + timing.duration) * 1000;
    const id = window.setTimeout(() => onDoneRef.current?.(), total);
    return () => window.clearTimeout(id);
  }, [complete, delay, words.length, step, timing.duration]);

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
                  transition={{ ...timing, delay: delay + i * step }}
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
