/**
 * Muestra del sistema de diseño (Fase 1). Se ve en lugar de la experiencia
 * hasta que llegue la intro en la Fase 2; después quedará en ?demo.
 */
import { useState, type ReactNode } from 'react';
import { feedback } from '../design/feedback.ts';
import { formatTime } from '../lib/format.ts';
import type { Mood } from '../lib/mood.ts';
import { moonPhase, moonPhaseName } from '../lib/moon.ts';
import type { SoundName } from '../sound/types.ts';
import { useScene } from '../state/scene.tsx';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';
import { Chip } from '../ui/Chip.tsx';
import { MoonIcon } from '../ui/MoonIcon.tsx';
import { Postcard } from '../ui/Postcard.tsx';
import { RevealText } from '../ui/RevealText.tsx';
import { Stamp } from '../ui/Stamp.tsx';
import { TideStage } from '../ui/TideTransition.tsx';

const TODAY_MOON = moonPhase(new Date());
const SHELL = 'mx-auto w-full max-w-[430px] md:max-w-[560px] lg:max-w-6xl';

export default function DesignDemo() {
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const go = (next: number) => {
    setDir(next > page ? 1 : -1);
    setPage(next);
  };

  return (
    <TideStage screenKey={`page-${page}`} dir={dir}>
      {page === 0 && <Cover onComponents={() => go(1)} onSea={() => go(2)} />}
      {page === 1 && <Components onBack={() => go(0)} onNext={() => go(2)} />}
      {page === 2 && <SeaControls onBack={() => go(1)} />}
    </TideStage>
  );
}

function Cover({ onComponents, onSea }: { onComponents: () => void; onSea: () => void }) {
  return (
    <div className="screen flex flex-col">
      <div className={`${SHELL} flex flex-1 flex-col`}>
        <div className="veil mt-[4vh] max-w-xl lg:mt-[9vh]">
          <p className="label-caps text-on-sea-soft">Fase 1 · Sistema de diseño</p>
          <RevealText
            as="h1"
            text="Mensaje en una botella"
            className="mt-3 font-serif text-display font-medium text-on-sea"
          />
          <RevealText
            text="Así se ven y se mueven las piezas de la experiencia. Toca el agua, cambia la hora del día y escucha el mar."
            delay={0.45}
            className="mt-4 max-w-[34ch] text-body text-on-sea-soft"
          />
        </div>
        <div className="mt-auto flex flex-col gap-3 sm:flex-row lg:mt-10">
          <Button onClick={onComponents} icon={<ArrowIcon />}>
            Ver los componentes
          </Button>
          <Button variant="secondary" onClick={onSea}>
            Probar el mar
          </Button>
        </div>
      </div>
    </div>
  );
}

const TIMES = ['09:30', '10:30', '16:00', '18:00', '20:30'];
const PHASES = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];
const SWATCHES = [
  ['foam', 'bg-foam'],
  ['mist', 'bg-mist'],
  ['sky', 'bg-sky'],
  ['mint', 'bg-mint'],
  ['aqua', 'bg-aqua'],
  ['lagoon', 'bg-lagoon'],
  ['seaglass', 'bg-seaglass'],
  ['tide', 'bg-tide'],
  ['deep', 'bg-deep'],
  ['abyss', 'bg-abyss'],
  ['sand', 'bg-sand'],
  ['sun', 'bg-sun'],
] as const;

function Components({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [time, setTime] = useState('18:00');
  const [stamped, setStamped] = useState(true);

  return (
    <div className="screen">
      <div className={`${SHELL} grid gap-5 lg:grid-cols-2 lg:gap-8 lg:pt-4`}>
        <header className="veil lg:col-span-2">
          <p className="label-caps text-on-sea-soft">Componentes</p>
          <RevealText
            as="h2"
            text="Una sola pieza, de principio a fin"
            className="mt-2 font-serif text-title font-medium text-on-sea"
          />
        </header>

        <Card className="p-6 lg:p-8">
          <p className="label-caps text-ink-soft">Tipografía</p>
          <p className="mt-4 font-serif text-display font-medium text-deep">Fraunces</p>
          <p className="mt-1 text-small text-ink-soft">Títulos y carta. Serifas suaves, como vidrio pulido por el mar.</p>
          <p className="mt-5 font-serif text-letter text-deep">Dicen que los mensajes importantes llegan por mar.</p>
          <p className="mt-1 font-serif text-letter italic text-ink-soft">…y que conviene leerlos despacio.</p>
          <hr className="my-6 border-deep/10" />
          <p className="font-sans text-title font-semibold text-deep">DM Sans</p>
          <p className="mt-1 text-body text-ink-soft">
            Para todo lo demás: botones, horarios y detalles. Clara y amable incluso en pantallas pequeñas.
          </p>
          <p className="label-caps mt-4 text-tide">Jueves · 9 de octubre · {formatTime('18:30')}</p>
        </Card>

        <Card className="p-6 lg:p-8">
          <p className="label-caps text-ink-soft">Botones</p>
          <div className="mt-4 flex flex-col gap-3">
            <Button block icon={<SendIcon />}>
              Confirmar por WhatsApp
            </Button>
            <Button block variant="secondary">
              Cambiar la fecha
            </Button>
            <Button block disabled>
              Elige una hora primero
            </Button>
          </div>
          <p className="label-caps mt-8 text-ink-soft">Chips</p>
          <div role="radiogroup" aria-label="Horario de ejemplo" className="mt-3 flex flex-wrap gap-2">
            {TIMES.map((t) => (
              <Chip key={t} selected={time === t} onClick={() => setTime(t)}>
                {formatTime(t)}
              </Chip>
            ))}
          </div>
        </Card>

        <div className="pt-6">
          <Postcard
            art={<DemoArt />}
            title="Atardecer frente al mar"
            tagline="El sol también tiene una cita a esa hora"
            description="Vemos cómo el sol se esconde en el mar, con algo rico para compartir y sin mirar el reloj."
            stamp={stamped ? <Stamp /> : undefined}
            footer={
              <div className="mt-5">
                <Button variant="secondary" sound="stamp" onClick={() => setStamped((s) => !s)}>
                  {stamped ? 'Quitar el sello' : 'Poner el sello'}
                </Button>
              </div>
            }
          />
        </div>

        <Card className="p-6 lg:p-8">
          <p className="label-caps text-ink-soft">Fases lunares</p>
          <div className="mt-4 grid grid-cols-8 gap-1 text-deep">
            {PHASES.map((p) => (
              <div key={p} className="grid place-items-center">
                <MoonIcon phase={p} size={26} labelled />
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-small text-ink-soft">
            <MoonIcon phase={TODAY_MOON} size={18} className="text-deep" />
            Hoy en Santa Clara: {moonPhaseName(TODAY_MOON).toLowerCase()}
          </p>
          <p className="label-caps mt-8 text-ink-soft">Paleta</p>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {SWATCHES.map(([name, bg]) => (
              <div key={name} className="text-center">
                <div className={`${bg} aspect-square rounded-xl ring-1 ring-deep/10`} />
                <p className="label-caps mt-1 text-ink-soft">{name}</p>
              </div>
            ))}
          </div>
        </Card>

        <nav className="flex flex-col gap-3 pb-2 sm:flex-row lg:col-span-2">
          <Button variant="secondary" onClick={onBack}>
            Volver
          </Button>
          <Button onClick={onNext} icon={<ArrowIcon />}>
            Probar el mar
          </Button>
        </nav>
      </div>
    </div>
  );
}

const MOODS: { value: Mood | 'auto'; label: string }[] = [
  { value: 'auto', label: 'Ahora' },
  { value: 'morning', label: 'Mañana' },
  { value: 'day', label: 'Día' },
  { value: 'sunset', label: 'Atardecer' },
  { value: 'night', label: 'Noche' },
];
const SWELLS = [
  { value: 0.12, label: 'Calma' },
  { value: 0.5, label: 'Media' },
  { value: 0.95, label: 'Marejada' },
];
const EFFECTS: { value: SoundName; label: string }[] = [
  { value: 'pop', label: 'Corcho' },
  { value: 'bubble', label: 'Burbuja' },
  { value: 'splash', label: 'Chapuzón' },
  { value: 'stamp', label: 'Sello' },
  { value: 'yes', label: 'Sí' },
  { value: 'whoosh', label: 'Ola' },
];

function SeaControls({ onBack }: { onBack: () => void }) {
  const { scene, setScene, mood } = useScene();
  const { progress } = scene;
  const moveBoat = (index: number) =>
    setScene({ progress: { ...progress, index, arrived: index >= progress.total } });

  return (
    <div className="screen flex flex-col justify-end lg:justify-center">
      <Card className={`${SHELL} p-5 lg:mx-[max(var(--gutter),calc((100vw-72rem)/2))] lg:max-w-md lg:p-7`}>
        <p className="label-caps text-ink-soft">El mar</p>
        <RevealText as="h2" text="Toca el agua" className="mt-1 font-serif text-title font-medium text-deep" />
        <p className="mt-1 text-small text-ink-soft">
          Las pantallas solo cambian la hora y el oleaje: el mar nunca se recarga.
        </p>

        <Group label="Hora del día">
          {MOODS.map((m) => (
            <Chip key={m.value} selected={scene.mood === m.value} onClick={() => setScene({ mood: m.value })}>
              {m.value === 'auto' ? `Ahora · ${MOODS.find((x) => x.value === mood)?.label.toLowerCase()}` : m.label}
            </Chip>
          ))}
        </Group>

        <Group label="Oleaje">
          {SWELLS.map((s) => (
            <Chip key={s.value} selected={scene.swell === s.value} onClick={() => setScene({ swell: s.value })}>
              {s.label}
            </Chip>
          ))}
        </Group>

        <Group label="Barquito" role="group">
          <Chip role="button" onClick={() => moveBoat(Math.max(0, progress.index - 1))} aria-label="Volver un paso">
            ← Atrás
          </Chip>
          <Chip
            role="button"
            onClick={() => moveBoat(Math.min(progress.total - 1, progress.index + 1))}
            aria-label="Avanzar un paso"
          >
            Avanzar →
          </Chip>
          <Chip role="button" selected={progress.arrived} onClick={() => moveBoat(progress.total)}>
            Llegar al faro
          </Chip>
        </Group>

        <Group label="Sonido (activa la concha de arriba)" role="group">
          {EFFECTS.map((e) => (
            <Chip key={e.value} role="button" onClick={() => feedback(e.value)}>
              {e.label}
            </Chip>
          ))}
        </Group>

        <div className="mt-6">
          <Button block variant="secondary" onClick={onBack}>
            Volver a los componentes
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Group({ label, role = 'radiogroup', children }: { label: string; role?: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <p className="label-caps text-ink-soft">{label}</p>
      <div role={role} aria-label={label} className="mt-2 flex flex-wrap gap-2">
        {children}
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h11M11 5.5 15.5 10 11 14.5" />
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

/** Escena de muestra para la postal (las 5 ilustraciones reales llegan en la Fase 4). */
function DemoArt() {
  return (
    <svg viewBox="0 0 500 400" preserveAspectRatio="xMidYMid slice" className="block h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="demo-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9dbe6" />
          <stop offset="0.6" stopColor="#efdcbc" />
          <stop offset="1" stopColor="#f5d4a0" />
        </linearGradient>
        <linearGradient id="demo-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fdcd1" />
          <stop offset="1" stopColor="#5fa9a7" />
        </linearGradient>
      </defs>
      <rect width="500" height="400" fill="url(#demo-sky)" />
      <circle cx="330" cy="236" r="44" fill="#fbe7c2" />
      <circle cx="330" cy="236" r="86" fill="#f6d6a2" opacity="0.35" />
      <rect y="236" width="500" height="164" fill="url(#demo-sea)" />
      <path d="M0 236c40-6 80-6 125 0s85 6 125 0 85-6 125 0 85 6 125 0v20H0z" fill="#cbece2" opacity="0.8" />
      <g fill="#fbe2b0">
        <rect x="300" y="258" width="60" height="3" rx="1.5" />
        <rect x="286" y="276" width="88" height="3" rx="1.5" opacity="0.8" />
        <rect x="270" y="298" width="120" height="3" rx="1.5" opacity="0.6" />
        <rect x="252" y="326" width="156" height="3" rx="1.5" opacity="0.45" />
      </g>
      <path d="M120 120q9-9 18 0m0 0q9-9 18 0M180 96q6-6 12 0m0 0q6-6 12 0" fill="none" stroke="#1f4e5a" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
