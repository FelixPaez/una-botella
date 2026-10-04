import { AnimatePresence, useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { config } from '../../config.ts';
import type { Place } from '../../config.types.ts';
import { feedback } from '../../design/feedback.ts';
import { spring, transition } from '../../design/motion.ts';
import { useIsDesktop } from '../../hooks/useMediaQuery.ts';
import { useNow } from '../../hooks/useNow.ts';
import { StampMotif } from '../../illustrations/PlaceIllustration.tsx';
import { availableTimes } from '../../lib/dates.ts';
import { useFlow } from '../../state/flowContext.ts';
import { Button } from '../../ui/Button.tsx';
import { Postcard } from '../../ui/Postcard.tsx';
import { RevealText } from '../../ui/RevealText.tsx';
import { Stamp, StampSlot } from '../../ui/Stamp.tsx';
import { PlaceArt } from './PlaceArt.tsx';

/** Elegir el plan: cada lugar es una postal marina en un carrusel deslizable. */
export function PlanScreen() {
  const { state, dispatch } = useFlow();
  const places = config.places;
  const desktop = useIsDesktop();
  const scroller = useRef<HTMLDivElement>(null);
  const initial = Math.max(0, places.findIndex((p) => p.id === state.choice.placeId));
  const [active, setActive] = useState(initial);
  const editing = state.returnTo === 'summary';
  const now = useNow();

  // La postal activa es la más centrada (el carrusel usa scroll-snap nativo).
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const cards = [...el.querySelectorAll<HTMLElement>('.place-card')];
    if (initial > 0) cards[initial]?.scrollIntoView({ block: 'nearest', inline: 'center' });
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const mid = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        cards.forEach((card, i) => {
          if (Math.abs(card.offsetLeft + card.offsetWidth / 2 - mid) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - mid)) best = i;
        });
        setActive(best);
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [initial]);

  const scrollTo = (index: number) => {
    const card = scroller.current?.querySelectorAll<HTMLElement>('.place-card')[index];
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const choose = (place: Place, index: number) => {
    const { date, time } = state.choice;
    // Si el nuevo plan no tiene la hora elegida ese día, habrá que elegirla otra vez.
    const keepTime = Boolean(date && time && availableTimes(place, date, now).includes(time));
    dispatch({ type: 'PICK_PLACE', placeId: place.id, keepTime });
    window.setTimeout(() => feedback('stamp'), 230);
    if (index !== active) scrollTo(index);
  };

  return (
    <div className="screen plan">
      <header className="screen-header veil">
        <p className="label-caps text-on-sea-soft">{config.plan.label}</p>
        <RevealText as="h2" text={config.plan.title} className="mt-2 font-serif text-title font-medium text-on-sea" />
      </header>

      <div className="carousel-wrap">
        {desktop && places.length > 3 && (
          <CarouselArrow dir={-1} disabled={active === 0} onClick={() => scrollTo(Math.max(0, active - 1))} />
        )}
        <div ref={scroller} className="carousel" role="radiogroup" aria-label={config.plan.title}>
          {places.map((place, i) => (
            <PlaceCard
              key={place.id}
              place={place}
              index={i}
              active={i === active}
              selected={state.choice.placeId === place.id}
              onChoose={() => choose(place, i)}
              onFocusCard={() => scrollTo(i)}
            />
          ))}
        </div>
        {desktop && places.length > 3 && (
          <CarouselArrow dir={1} disabled={active === places.length - 1} onClick={() => scrollTo(Math.min(places.length - 1, active + 1))} />
        )}
      </div>

      <div className="carousel-dots" aria-hidden="true">
        {places.map((place, i) => (
          <span key={place.id} data-active={i === active || undefined} />
        ))}
      </div>

      <div className="screen-actions">
        {editing && (
          <Button variant="secondary" onClick={() => dispatch({ type: 'BACK' })}>
            {config.plan.cancel}
          </Button>
        )}
        <Button disabled={!state.choice.placeId} onClick={() => dispatch({ type: 'CONTINUE' })}>
          {editing ? config.plan.save : config.plan.next}
        </Button>
      </div>
    </div>
  );
}

type CardProps = {
  place: Place;
  index: number;
  active: boolean;
  selected: boolean;
  onChoose: () => void;
  onFocusCard: () => void;
};

/** Una postal: se elige tocándola; la misteriosa primero se voltea. */
function PlaceCard({ place, index, active, selected, onChoose, onFocusCard }: CardProps) {
  const reduced = Boolean(useReducedMotion());
  const [revealed, setRevealed] = useState(!place.mystery || selected);

  const activate = () => {
    if (!revealed) {
      setRevealed(true);
      feedback('whoosh');
      return;
    }
    onChoose();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate();
    }
  };

  return (
    <div className="place-card" data-active={active || undefined} data-selected={selected || undefined} style={{ ['--i' as string]: index }}>
      <m.div
        className="place-card__flip"
        role="radio"
        tabIndex={0}
        aria-checked={selected}
        aria-label={revealed ? `${place.name}. ${place.tagline}` : `${place.name}: ${config.plan.flipHint}`}
        onClick={activate}
        onKeyDown={onKeyDown}
        onFocus={onFocusCard}
        initial={false}
        animate={reduced ? undefined : { rotateY: revealed ? 0 : 180 }}
        transition={spring.buoy}
      >
        <m.div
          className="place-card__face"
          initial={false}
          animate={reduced ? { opacity: revealed ? 1 : 0 } : undefined}
          transition={transition.reduced}
        >
          {/* El golpe del sello: la postal se hunde un poco. */}
          <m.div key={selected ? 'stamped' : 'free'} initial={selected ? { y: 0 } : false} animate={selected ? { y: [0, 3, 0] } : undefined} transition={{ duration: 0.35, delay: 0.22 }}>
            <Postcard
              art={<PlaceArt place={place} eager={index < 2} />}
              title={place.name}
              tagline={place.tagline}
              description={place.description}
              stamp={<StampDrop kind={place.illustration} placed={selected} />}
            />
          </m.div>
        </m.div>
        {place.mystery && (
          <m.div
            className="place-card__face place-card__back paper"
            initial={false}
            animate={reduced ? { opacity: revealed ? 0 : 1 } : undefined}
            transition={transition.reduced}
            aria-hidden="true"
          >
            <span className="place-card__question">?</span>
            <svg viewBox="0 0 160 30" className="place-card__wave" aria-hidden="true">
              <path d="M0 15c20-12 40-12 60 0s40 12 60 0 30-9 40-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="place-card__lines" />
            <span className="label-caps place-card__hint">{config.plan.flipHint}</span>
          </m.div>
        )}
      </m.div>
    </div>
  );
}

/** El sello cae desde arriba y se estampa en su hueco al elegir la postal. */
export function StampDrop({ kind, placed, animate: animated = true }: { kind: Place['illustration']; placed: boolean; animate?: boolean }) {
  const reduced = Boolean(useReducedMotion());
  return (
    <div className="stamp-drop">
      <StampSlot />
      <AnimatePresence initial={false}>
        {placed && (
          <m.div
            key="stamp"
            className="stamp-drop__stamp"
            initial={animated && !reduced ? { y: -72, scale: 1.4, rotate: -16, opacity: 0 } : false}
            animate={{ y: 0, scale: 1, rotate: -4, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: -40, rotate: 10, opacity: 0, transition: transition.exit }}
            transition={spring.stamp}
          >
            <Stamp>
              <StampMotif kind={kind} />
            </Stamp>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CarouselArrow({ dir, disabled, onClick }: { dir: 1 | -1; disabled: boolean; onClick: () => void }) {
  return (
    <m.button
      type="button"
      className="carousel-arrow glass"
      data-dir={dir}
      disabled={disabled}
      aria-label={dir === 1 ? 'Ver la siguiente postal' : 'Ver la postal anterior'}
      whileTap={{ scale: 0.92 }}
      transition={transition.tap}
      onClick={() => {
        feedback('tick');
        onClick();
      }}
    >
      <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === 1 ? 'M8 4.5 13.5 10 8 15.5' : 'M12 4.5 6.5 10 12 15.5'} />
      </svg>
    </m.button>
  );
}
