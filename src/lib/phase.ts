import type { Phase } from '../content/schema.ts';

export const PHASES: readonly Phase[] = ['morning', 'day', 'sunset', 'night'];

/** Lighting phase from the visitor's local clock (handoff §7.1). */
export function getPhase(date: Date): Phase {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'sunset';
  return 'night';
}

/**
 * The street lamp and time chip cycle morning → day → sunset → night → auto.
 * From auto, start at the phase after the current one.
 */
export function nextOverride(override: Phase | null, current: Phase): Phase | null {
  if (override === null) return PHASES[(PHASES.indexOf(current) + 1) % PHASES.length] ?? null;
  if (override === 'night') return null;
  return PHASES[PHASES.indexOf(override) + 1] ?? null;
}

export function isPhase(value: unknown): value is Phase {
  return typeof value === 'string' && (PHASES as readonly string[]).includes(value);
}
