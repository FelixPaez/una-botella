import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { useEffect, useMemo, useRef } from 'react';
import { config } from '../../config.ts';
import { spring, transition } from '../../design/motion.ts';
import { useIsDesktop } from '../../hooks/useMediaQuery.ts';
import { useNow } from '../../hooks/useNow.ts';
import { buildDays, capitalize, formatSlot, groupTimes, quipFor, type Day, type Daypart } from '../../lib/dates.ts';
import { moonPhaseName } from '../../lib/moon.ts';
import { useFlow } from '../../state/flowContext.ts';
import { Button } from '../../ui/Button.tsx';
import { Chip } from '../../ui/Chip.tsx';
import { MoonIcon } from '../../ui/MoonIcon.tsx';
import { RevealText } from '../../ui/RevealText.tsx';
import { feedback } from '../../design/feedback.ts';

const south = config.location.latitude < 0;

/** Fecha y hora: días con su luna, horarios por franjas y una nota opcional. */
export function WhenScreen() {
  const { state, dispatch } = useFlow();
  const desktop = useIsDesktop();
  const now = useNow();
  const place = config.places.find((p) => p.id === state.choice.placeId);
  const days = useMemo(() => buildDays(now, place), [now, place]);
  const { date, time, note } = state.choice;
  const selectedDay = days.find((d) => d.iso === date);
  const editing = state.returnTo === 'summary';

  // Si mientras ella mira pasa la hora (o el día deja de valer), la hora elegida se libera.
  useEffect(() => {
    if (date && time && !selectedDay?.times.includes(time)) {
      dispatch({ type: 'PICK_DATE', date, keepTime: false });
    }
  }, [date, time, selectedDay, dispatch]);

  const pickDay = (day: Day) => {
    if (!day.available) return;
    dispatch({ type: 'PICK_DATE', date: day.iso, keepTime: Boolean(time && day.times.includes(time)) });
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
          <div className="when__caption text-on-sea" aria-live="polite">
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
                className="when__quip text-on-sea-soft"
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
          {!selectedDay ? (
            <p className="mt-3 text-small text-ink-soft">{config.when.pickDayFirst}</p>
          ) : (
            <div className="when__groups">
              {groupTimes(selectedDay.times).map((group, i) => (
                <m.div
                  key={`${selectedDay.iso}-${group.key}`}
                  className="when__group"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transition.enter, delay: i * 0.07 }}
                >
                  <p className="when__group-label">
                    <DaypartIcon part={group.key} />
                    {group.label}
                  </p>
                  <div role="radiogroup" aria-label={`Horarios de la ${group.label.toLowerCase()}`} className="when__chips">
                    {group.times.map((t) => (
                      <Chip key={t} selected={time === t} onClick={() => dispatch({ type: 'PICK_TIME', time: t })}>
                        {formatSlot(t)}
                      </Chip>
                    ))}
                  </div>
                </m.div>
              ))}
            </div>
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

function DaypartIcon({ part }: { part: Daypart }) {
  const common = { width: 16, height: 16, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, 'aria-hidden': true };
  if (part === 'morning')
    return (
      <svg {...common}>
        <path d="M3 14h14M6 14a4 4 0 0 1 8 0M10 5v2M4.5 8.5l1.3 1.3M15.5 8.5l-1.3 1.3" />
      </svg>
    );
  if (part === 'afternoon')
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="3.4" />
        <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M13.5 13.6A6 6 0 0 1 8.2 4a6.2 6.2 0 1 0 7.8 7.8 5.8 5.8 0 0 1-2.5 1.8z" />
    </svg>
  );
}
