import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Phase } from '../content/schema.ts';
import { getPhase, isPhase, nextOverride } from '../lib/phase.ts';
import { readJson, readString, writeJson, writeString } from '../lib/storage.ts';
import { PhaseContext, SoundContext, VisitedContext, visitedKey } from './contexts.ts';

function VisitedProvider({ children }: { children: ReactNode }) {
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => {
    const saved = readJson<unknown>('eh.visited', []);
    return new Set(Array.isArray(saved) ? saved.filter((v) => typeof v === 'string') : []);
  });
  const markVisited = useCallback((roomId: string, objectId: string) => {
    const key = visitedKey(roomId, objectId);
    setVisited((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev).add(key);
      writeJson('eh.visited', [...next]);
      return next;
    });
  }, []);
  const value = useMemo(() => ({ visited, markVisited }), [visited, markVisited]);
  return <VisitedContext.Provider value={value}>{children}</VisitedContext.Provider>;
}

/** Initial override: ?time= first, then this session's manual choice (§7.1). */
function initialOverride(): Phase | null {
  const param = new URLSearchParams(window.location.search).get('time');
  if (isPhase(param)) return param;
  const saved = readString('eh.time', 'session');
  return isPhase(saved) ? saved : null;
}

function PhaseProvider({ children }: { children: ReactNode }) {
  const [auto, setAuto] = useState<Phase>(() => getPhase(new Date()));
  const [override, setOverride] = useState<Phase | null>(initialOverride);

  // Recompute every minute and when the tab comes back (§7.1).
  useEffect(() => {
    const update = () => setAuto(getPhase(new Date()));
    const timer = window.setInterval(update, 60_000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);

  const cycle = useCallback(() => {
    setOverride((current) => {
      const next = nextOverride(current, current ?? getPhase(new Date()));
      writeString('eh.time', next, 'session');
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ phase: override ?? auto, override, cycle }),
    [auto, override, cycle],
  );
  return <PhaseContext.Provider value={value}>{children}</PhaseContext.Provider>;
}

/** Sound preference only; M3 plays the audio. Off by default (§8). */
function SoundProvider({ children }: { children: ReactNode }) {
  const [soundOn, setSound] = useState(() => readString('eh.sound') === 'on');
  const setSoundOn = useCallback((on: boolean) => {
    setSound(on);
    writeString('eh.sound', on ? 'on' : 'off');
  }, []);
  const value = useMemo(() => ({ soundOn, setSoundOn }), [soundOn, setSoundOn]);
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function StateProviders({ children }: { children: ReactNode }) {
  return (
    <VisitedProvider>
      <PhaseProvider>
        <SoundProvider>{children}</SoundProvider>
      </PhaseProvider>
    </VisitedProvider>
  );
}
