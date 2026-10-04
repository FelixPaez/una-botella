import type { HTMLAttributes } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** paper = carta y postales (opaco) · glass = paneles pequeños sobre el mar. */
  variant?: 'paper' | 'glass';
};

export function Card({ variant = 'paper', className = '', ...rest }: CardProps) {
  return <div className={`${variant} rounded-card shadow-soft ${className}`} {...rest} />;
}
