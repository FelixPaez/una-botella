import type { ReactNode } from 'react';
import { StampSlot } from './Stamp.tsx';

type PostcardProps = {
  /** Foto o ilustración (área 5:4). */
  art: ReactNode;
  title: string;
  tagline?: string;
  description?: string;
  /** El sello pegado; si no hay, se ve el hueco punteado. */
  stamp?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** Postal marina: imagen con margen de papel, nombre, frase, descripción y sello. */
export function Postcard({ art, title, tagline, description, stamp, footer, className = '' }: PostcardProps) {
  return (
    <article className={`paper rounded-card p-3 shadow-soft ${className}`}>
      <div className="relative aspect-[5/4] overflow-hidden rounded-[1rem] bg-mist">{art}</div>
      <div className="relative px-2 pb-2 pt-4">
        <div className="absolute -top-10 right-1">{stamp ?? <StampSlot />}</div>
        <h3 className="pr-20 font-serif text-letter font-semibold leading-tight text-deep">{title}</h3>
        {tagline && <p className="mt-1.5 font-serif text-body italic text-ink-soft">{tagline}</p>}
        {description && <p className="mt-3 text-small text-ink-soft">{description}</p>}
        {footer}
      </div>
    </article>
  );
}
