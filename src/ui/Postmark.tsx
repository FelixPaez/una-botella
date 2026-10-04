import { useId } from 'react';

type Props = {
  /** Texto grande del centro (ej. «9 OCT»). */
  date: string;
  /** Debajo, la hora (ej. «6:30 PM»). */
  time: string;
  /** Texto en arco alrededor. */
  ring: string;
  className?: string;
};

/**
 * Matasellos circular con texto en arco y las ondas de cancelación de correos
 * (que aquí son, literalmente, olas).
 */
export function Postmark({ date, time, ring, className = '' }: Props) {
  const arc = `postmark-${useId().replace(/[^\w-]/g, '')}`;
  return (
    <svg viewBox="-70 0 190 120" width="171" height="108" className={`postmark ${className}`} aria-hidden="true">
      <defs>
        <path id={arc} d="M60 60m-43 0a43 43 0 1 1 86 0a43 43 0 1 1-86 0" />
      </defs>
      <g fill="none" stroke="currentColor" strokeWidth="2.2">
        <circle cx="60" cy="60" r="54" />
        <circle cx="60" cy="60" r="33" strokeWidth="1.4" />
        {/* Ondas de cancelación */}
        <path d="M-66 38c10-6 20-6 30 0s20 6 30 0M-66 60c10-6 20-6 30 0s20 6 30 0M-66 82c10-6 20-6 30 0s20 6 30 0" />
      </g>
      <text fontFamily="DM Sans, sans-serif" fontSize="8.6" fontWeight="700" letterSpacing="2.2" fill="currentColor">
        <textPath href={`#${arc}`}>{ring}</textPath>
      </text>
      <text x="60" y="61" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="15" fontWeight="700" fill="currentColor">
        {date}
      </text>
      <text x="60" y="76" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="10.5" fontWeight="600" fill="currentColor">
        {time}
      </text>
    </svg>
  );
}
