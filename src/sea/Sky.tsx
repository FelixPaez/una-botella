import { useEffect, useMemo, useState } from 'react';
import { dur } from '../design/motion.ts';
import type { Mood } from '../lib/mood.ts';
import { MoonIcon } from '../ui/MoonIcon.tsx';
import { seeded } from './waves.ts';

type Props = { mood: Mood; moonPhase: number; south: boolean; lite: boolean };

export function Sky({ mood, moonPhase, south, lite }: Props) {
  return (
    <>
      <div className="sky sky--morning" />
      <div className="sky sky--day" />
      <div className="sky sky--sunset" />
      <div className="sky sky--night" />
      <Stars visible={mood === 'night'} count={lite ? 16 : 34} />
      <div className="moon">
        <div className="moon__halo" />
        <MoonIcon phase={moonPhase} south={south} className="moon__icon" size={34} />
      </div>
      <div className="sun">
        <div className="sun__body">
          <div className="sun__halo" />
          <div className="sun__warm" />
          <div className="sun__disc" />
        </div>
      </div>
    </>
  );
}

/** Las estrellas solo existen de noche: se montan al llegar y se funden al irse. */
function Stars({ visible, count }: { visible: boolean; count: number }) {
  const [wasVisible, setWasVisible] = useState(visible);
  const [lingering, setLingering] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (!visible) setLingering(true);
  }

  useEffect(() => {
    if (!lingering) return;
    const id = window.setTimeout(() => setLingering(false), dur.ambient * 1000);
    return () => window.clearTimeout(id);
  }, [lingering]);

  const stars = useMemo(() => {
    const rand = seeded(7);
    return Array.from({ length: count }, () => ({
      left: rand() * 100,
      top: Math.pow(rand(), 1.4) * 86 + 2,
      size: 1 + rand() * 1.6,
      duration: 2.4 + rand() * 3,
      delay: -rand() * 5,
    }));
  }, [count]);

  if (!visible && !lingering) return null;
  return (
    <div className="stars" data-leaving={!visible || undefined}>
      {stars.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
