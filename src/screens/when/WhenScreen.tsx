import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useMemo, useRef } from 'react';
import { config } from '../../config.ts';
import { spring, transition } from '../../design/motion.ts';
import { useIsDesktop } from '../../hooks/useMediaQuery.ts';
import { useNow } from '../../hooks/useNow.ts';
import { buildDays, capitalize, quipFor, suggestedTime, sunsetTime, type Day } from '../../lib/dates.ts';
import { moonPhaseName } from '../../lib/moon.ts';
import { useFlow } from '../../state/flowContext.ts';
import { Button } from '../../ui/Button.tsx';
import { MoonIcon } from '../../ui/MoonIcon.tsx';
import { RevealText } from '../../ui/RevealText.tsx';
import { feedback } from '../../design/feedback.ts';
import { TimeArc } from './TimeArc.tsx';

const south = config.location.latitude < 0;

/** Fecha y hora: días con su luna, la hora en el arco del cielo y una nota opcional. */
export function WhenScreen() {
  const { state, dispatch } = useFlow();
  const desktop = useIsDesktop();
  const now = useNow();
  const place = config.places.find((p) => p.id === state.choice.placeId);
  const days = useMemo(() => buildDays(now, place), [now, place]);
  const { date, time, note } = state.choice;
  const selectedDay = days.find((d) => d.iso === date);
  const editing = state.returnTo === 'summary';

  // Con un día elegido siempre hay una hora propuesta; si mientras ella mira esa hora
  // deja de valer (ya pasó, o el día no tiene huecos), se propone otra o se libera.
  useEffect(() => {
    if (!date) return;
    const times = selectedDay?.times ?? [];
    if (time && times.includes(time)) return;
    const next = suggestedTime(times);
    if (next !== time) dispatch({ type: 'PICK_DATE', date, keepTime: false, time: next });
  }, [date, time, selectedDay, dispatch]);

  const pickDay = (day: Day) => {
    if (!day.available) return;
    const keepTime = Boolean(time && day.times.includes(time));
    dispatch({ type: 'PICK_DATE', date: day.iso, keepTime, time: suggestedTime(day.times) });
  };

  const quip = selectedDay ? quipFor(selectedDay) : null;

  return (
    <div className="screen when">
      <header className="screen-header veil">
        <p className="label-caps text-on-sea-soft">{config.when.label}</p>
        <RevealText as="h2" text={config.when.title} className="mt-2 font-serif text-title font-medium text-on-sea" />
      </header>

      <div className="when__grid">
        <section className="when__days">
          {desktop ? (
            <TideTable days={days} selected={date} onPick={pickDay} />
          ) : (
            <DayStrip days={days} selected={date} onPick={pickDay} />
          )}
          <div className={`when__caption text-on-sea ${selectedDay ? 'on-water' : ''}`} aria-live="polite">
            {selectedDay && (
              <>
                <MoonIcon phase={selectedDay.moon} size={16} south={south} className="when__caption-moon" />
                <span>
                  {capitalize(selectedDay.weekdayLong)} {selectedDay.day} · {moonPhaseName(selectedDay.moon)}
                </span>
              </>
            )}
          </div>
          <AnimatePresence mode="wait">
            {quip && (
              <m.p
                key={quip}
                className="when__quip on-water text-on-sea-soft"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: transition.exit }}
                transition={transition.enter}
              >
                {quip}
              </m.p>
            )}
          </AnimatePresence>
        </section>

        <section className="when__times card-panel paper">
          <p className="label-caps text-ink-soft">{config.when.timeTitle}</p>
          {!selectedDay || !date ? (
            <p className="mt-3 text-small text-ink-soft">{config.when.pickDayFirst}</p>
          ) : (
            <TimeArc
              key={date}
              times={selectedDay.times}
              value={time}
              date={date}
              sunset={place?.times === 'sunset' ? sunsetTime(date) : null}
              onChange={(t) => dispatch({ type: 'PICK_TIME', time: t })}
            />
          )}

          {config.note.enabled && (
            <label className="note">
              <span className="label-caps text-ink-soft">{config.note.label}</span>
              <textarea
                className="note__field"
                rows={2}
                maxLength={config.note.maxLength}
                placeholder={config.note.placeholder}
                value={note}
                onChange={(e) => dispatch({ type: 'SET_NOTE', note: e.target.value })}
                onFocus={(e) => window.setTimeout(() => e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)}
              />
              <span className="note__count" aria-hidden="true">
                {note.length}/{config.note.maxLength}
              </span>
            </label>
          )}
        </section>
      </div>

      <div className="screen-actions">
        <Button variant="secondary" onClick={() => dispatch({ type: 'BACK' })}>
          {config.when.back}
        </Button>
        <Button disabled={!date || !time} onClick={() => dispatch({ type: 'CONTINUE' })}>
          {editing ? config.when.save : config.when.next}
        </Button>
      </div>
    </div>
  );
}

type PickProps = { days: Day[]; selected: string | null; onPick: (day: Day) => void };

/** Móvil: tira horizontal deslizable de días. */
function DayStrip({ days, selected, onPick }: PickProps) {
  const strip = useRef<HTMLDivElement>(null);

  // Al volver a editar la fecha, el día elegido aparece a la vista aunque quede lejos.
  useEffect(() => {
    const el = strip.current;
    const day = el?.querySelector<HTMLElement>('[data-selected]');
    if (!el || !day) return;
    const box = el.getBoundingClientRect();
    const b = day.getBoundingClientRect();
    if (b.left < box.left || b.right > box.right) el.scrollLeft += b.left + b.width / 2 - (box.left + box.width / 2);
  }, []); // solo al entrar: luego manda ella

  return (
    <div ref={strip} className="day-strip" role="radiogroup" aria-label={config.when.title}>
      {days.map((day, i) => (
        <DayButton key={day.iso} day={day} selected={day.iso === selected} dim={Boolean(selected)} showMonth={i === 0 || day.day === 1} onPick={onPick} />
      ))}
    </div>
  );
}

const WEEK_HEADER = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

/** Escritorio: tabla de mareas semanal (de lunes a domingo) con la luna de cada noche. */
function TideTable({ days, selected, onPick }: PickProps) {
  const first = new Date(`${days[0].iso}T12:00:00`);
  const offset = (first.getDay() + 6) % 7;
  return (
    <div className="tide-table" role="radiogroup" aria-label={config.when.title}>
      {WEEK_HEADER.map((d) => (
        <span key={d} className="tide-table__head label-caps">
          {d}
        </span>
      ))}
      {Array.from({ length: offset }, (_, i) => (
        <span key={`empty-${i}`} aria-hidden="true" />
      ))}
      {days.map((day, i) => (
        <DayButton key={day.iso} day={day} selected={day.iso === selected} dim={Boolean(selected)} showMonth={i === 0 || day.day === 1} onPick={onPick} compact />
      ))}
    </div>
  );
}

type DayProps = { day: Day; selected: boolean; dim: boolean; showMonth: boolean; compact?: boolean; onPick: (day: Day) => void };

/** Un día: al elegirlo sube como una boya y el resto se atenúa. */
function DayButton({ day, selected, dim, showMonth, compact = false, onPick }: DayProps) {
  const name = day.isToday ? config.when.today : day.isTomorrow ? config.when.tomorrow : day.weekday;
  const label = `${day.weekdayLong} ${day.day} de ${day.month}, ${moonPhaseName(day.moon).toLowerCase()}${day.reason ? `, ${day.reason}` : ''}`;
  return (
    <m.button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      disabled={!day.available}
      className={`day ${compact ? 'day--compact' : ''}`}
      data-selected={selected || undefined}
      data-dim={(dim && !selected) || undefined}
      initial={false}
      animate={{ y: selected ? -8 : 0 }}
      transition={spring.buoy}
      onClick={() => {
        feedback('tick');
        onPick(day);
      }}
    >
      <span className="day__float">
        <span className="day__month">{showMonth ? day.month : ' '}</span>
        <span className="day__name">{name}</span>
        <span className="day__number">{day.day}</span>
        <MoonIcon phase={day.moon} size={14} south={south} className="day__moon" />
      </span>
      <span className="day__reflection" aria-hidden="true" />
    </m.button>
  );
}
