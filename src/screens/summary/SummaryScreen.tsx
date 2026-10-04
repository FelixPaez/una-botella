import { animate, useMotionValue, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useState } from 'react';
import { config } from '../../config.ts';
import { feedback } from '../../design/feedback.ts';
import { ease, transition } from '../../design/motion.ts';
import { usePointerFine } from '../../hooks/useMediaQuery.ts';
import { capitalize, formatDateLong, formatSlot, formatTimeSpoken, fromISODate } from '../../lib/dates.ts';
import { buildMessage, placeLabel, whatsappUrl } from '../../lib/whatsapp.ts';
import type { Section } from '../../state/flow.ts';
import { useFlow } from '../../state/flowContext.ts';
import { saveFlow } from '../../state/persistence.ts';
import { Button, ButtonLink } from '../../ui/Button.tsx';
import { Postmark } from '../../ui/Postmark.tsx';
import { RevealText } from '../../ui/RevealText.tsx';
import { PlaceArt } from '../plan/PlaceArt.tsx';
import { StampDrop } from '../plan/PlanScreen.tsx';

const POSTMARK_DELAY = 0.8;

/** El resumen: la misma postal, ya completa, con el matasellos de la fecha y la hora. */
export function SummaryScreen() {
  const { state, dispatch } = useFlow();
  const reduced = Boolean(useReducedMotion());
  const pointerFine = usePointerFine();
  const { placeId, date, time, note } = state.choice;
  const place = config.places.find((p) => p.id === placeId);
  const [copied, setCopied] = useState(false);
  const jolt = useMotionValue(0);

  // El matasellos cae de golpe: la postal se sacude un poco.
  useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(() => {
      feedback('stamp');
      animate(jolt, [0, 3, 0], { duration: 0.3, ease: ease.swell });
    }, (POSTMARK_DELAY + 0.22) * 1000);
    return () => window.clearTimeout(id);
  }, [reduced, jolt]);

  if (!place || !date || !time) return null;

  const message = buildMessage(state.choice);
  const url = whatsappUrl(message);
  const day = fromISODate(date);
  const [h] = time.split(':').map(Number);
  const stampDate = `${day.getDate()} ${new Intl.DateTimeFormat('es', { month: 'short' }).format(day).replace('.', '').toUpperCase()}`;
  const stampTime = config.timeFormat === '12h' ? `${formatSlot(time)} ${h < 12 ? 'AM' : 'PM'}` : formatSlot(time);
  const ring = `MENSAJE EN UNA BOTELLA · ${config.location.name.toUpperCase()} · `;

  const edit = (section: Section) => dispatch({ type: 'EDIT', section });

  const send = () => {
    feedback('tick');
    // Se guarda ya el final: si el navegador sale hacia WhatsApp, al volver ella ve la despedida.
    saveFlow({ ...state, step: 'farewell', dir: 1 });
    window.setTimeout(() => dispatch({ type: 'SENT' }), 450);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const area = document.createElement('textarea');
      area.value = message;
      area.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    feedback('tick');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 3200);
  };

  return (
    <div className="screen summary">
      <header className="screen-header veil">
        <p className="label-caps text-on-sea-soft">{config.summary.label}</p>
        <RevealText as="h2" text={config.summary.title} className="mt-2 font-serif text-title font-medium text-on-sea" />
      </header>

      <m.article className="summary-card paper" style={{ y: jolt }}>
        <button type="button" className="summary-card__art" onClick={() => edit('place')} aria-label={`${config.summary.edit}: ${config.summary.planLabel}`}>
          <PlaceArt place={place} eager />
        </button>
        <div className="summary-card__side">
          <div className="summary-card__stamps">
            <StampDrop kind={place.illustration} placed animate={false} />
            <m.div
              className="summary-card__postmark"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.6, rotate: -24 }}
              animate={{ opacity: 0.9, scale: 1, rotate: -9 }}
              transition={reduced ? transition.reduced : { duration: 0.24, ease: ease.sink, delay: POSTMARK_DELAY }}
            >
              <Postmark date={stampDate} time={stampTime} ring={ring} />
            </m.div>
          </div>
          <h3 className="summary-card__title">{place.name}</h3>
          <p className="summary-card__tagline">{place.tagline}</p>
          <dl className="address">
            <AddressLine label={config.summary.planLabel} value={placeLabel(place) === place.name ? place.name : `${place.name} (${placeLabel(place)})`} onEdit={() => edit('place')} />
            <AddressLine label={config.summary.dateLabel} value={capitalize(formatDateLong(date))} onEdit={() => edit('date')} />
            <AddressLine label={config.summary.timeLabel} value={formatTimeSpoken(time)} onEdit={() => edit('time')} />
            {config.note.enabled && (
              <AddressLine label={config.summary.noteLabel} value={note.trim() || config.summary.noNote} muted={!note.trim()} onEdit={() => edit('note')} />
            )}
          </dl>
        </div>
      </m.article>

      <div className="summary__actions">
        <ButtonLink
          href={url}
          target={pointerFine ? '_blank' : undefined}
          rel="noopener noreferrer"
          onClick={send}
          icon={<SendIcon />}
          block
        >
          {config.summary.confirm}
        </ButtonLink>
        <button type="button" className="summary__copy" onClick={copy} aria-live="polite">
          {copied ? config.summary.copied : config.summary.copy}
        </button>
        <Button variant="secondary" block onClick={() => dispatch({ type: 'BACK' })}>
          {config.summary.back}
        </Button>
      </div>
    </div>
  );
}

function AddressLine({ label, value, muted = false, onEdit }: { label: string; value: string; muted?: boolean; onEdit: () => void }) {
  return (
    <div className="address__line">
      <dt className="label-caps">{label}</dt>
      <dd>
        <button type="button" className={`address__value ${muted ? 'is-muted' : ''}`} onClick={onEdit} aria-label={`${config.summary.edit} ${label.toLowerCase()}: ${value}`}>
          <span>{value}</span>
          <PencilIcon />
        </button>
      </dd>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.5 3.5l3 3L7 16H4v-3z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <path d="M17.5 2.5 9 11M17.5 2.5l-5.2 15-3.3-6.5L2.5 7.8z" />
    </svg>
  );
}
