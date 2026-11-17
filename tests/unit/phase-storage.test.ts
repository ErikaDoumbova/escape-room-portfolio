import { afterEach, describe, expect, it, vi } from 'vitest';

import { getPhase, nextOverride } from '../../src/lib/phase.ts';
import { safeSpotifyUrl } from '../../src/lib/spotify.ts';
import { readJson, readString, writeJson, writeString } from '../../src/lib/storage.ts';

const at = (h: number, m: number) => new Date(2026, 10, 17, h, m);

describe('getPhase', () => {
  it.each([
    [4, 59, 'night'],
    [5, 0, 'morning'],
    [10, 59, 'morning'],
    [11, 0, 'day'],
    [16, 59, 'day'],
    [17, 0, 'sunset'],
    [19, 59, 'sunset'],
    [20, 0, 'night'],
    [0, 0, 'night'],
  ] as const)('%i:%i is %s', (h, m, phase) => {
    expect(getPhase(at(h, m))).toBe(phase);
  });
});

describe('nextOverride (street lamp / time chip)', () => {
  it('cycles morning → day → sunset → night → auto', () => {
    expect(nextOverride('morning', 'morning')).toBe('day');
    expect(nextOverride('day', 'day')).toBe('sunset');
    expect(nextOverride('sunset', 'sunset')).toBe('night');
    expect(nextOverride('night', 'night')).toBeNull();
  });

  it('from auto, moves to the phase after the current one', () => {
    expect(nextOverride(null, 'day')).toBe('sunset');
    expect(nextOverride(null, 'night')).toBe('morning');
  });
});

describe('storage helpers', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('round-trips values', () => {
    const data = new Map<string, string>();
    const fake = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
    vi.stubGlobal('window', { localStorage: fake, sessionStorage: fake });
    writeJson('eh.visited', ['kitchen/stuffed-peppers']);
    expect(readJson('eh.visited', [])).toEqual(['kitchen/stuffed-peppers']);
    writeString('eh.sound', null);
    expect(readString('eh.sound')).toBeNull();
  });

  it('keeps working when storage throws', () => {
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    vi.stubGlobal('window', { localStorage: throwing, sessionStorage: throwing });
    expect(() => writeJson('eh.visited', ['x'])).not.toThrow();
    expect(readJson('eh.visited', ['fallback'])).toEqual(['fallback']);
    expect(readString('eh.lang')).toBeNull();
  });

  it('keeps working when storage itself is missing', () => {
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new Error('SecurityError');
      },
    });
    expect(readJson('eh.visited', [])).toEqual([]);
    expect(() => writeString('eh.sound', 'on')).not.toThrow();
  });

  it('falls back on corrupted JSON', () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => '{oops' } });
    expect(readJson('eh.visited', [])).toEqual([]);
  });
});

describe('safeSpotifyUrl', () => {
  it('only allows Spotify embed URLs', () => {
    expect(safeSpotifyUrl('https://open.spotify.com/embed/playlist/abc')).toBe(
      'https://open.spotify.com/embed/playlist/abc',
    );
    expect(safeSpotifyUrl('https://open.spotify.com/playlist/abc')).toBeUndefined();
    expect(safeSpotifyUrl('https://evil.example/embed/x')).toBeUndefined();
    expect(safeSpotifyUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeSpotifyUrl('')).toBeUndefined();
  });
});
