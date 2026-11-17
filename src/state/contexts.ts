// Small app-wide stores (handoff §12.3). Providers live in StateProviders.tsx.
import { createContext, useContext } from 'react';

import type { Phase } from '../content/schema.ts';

export interface VisitedState {
  /** Keys are "<roomId>/<objectId>". */
  visited: ReadonlySet<string>;
  markVisited: (roomId: string, objectId: string) => void;
}

export interface PhaseState {
  /** The phase the house shows now. */
  phase: Phase;
  /** Manual choice (?time= or the lamp/time chip), or null for automatic. */
  override: Phase | null;
  cycle: () => void;
}

export interface SoundState {
  soundOn: boolean;
  setSoundOn: (on: boolean) => void;
}

export const VisitedContext = createContext<VisitedState>({
  visited: new Set(),
  markVisited: () => {},
});

export const PhaseContext = createContext<PhaseState>({
  phase: 'day',
  override: null,
  cycle: () => {},
});

export const SoundContext = createContext<SoundState>({ soundOn: false, setSoundOn: () => {} });

export const useVisited = () => useContext(VisitedContext);
export const usePhase = () => useContext(PhaseContext);
export const useSound = () => useContext(SoundContext);

export const visitedKey = (roomId: string, objectId: string) => `${roomId}/${objectId}`;
