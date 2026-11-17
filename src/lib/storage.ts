// All storage keys start with "eh." and hold only UI preferences and progress
// (handoff §11.2). Storage can be missing or throw (private mode, blocked
// cookies); the site keeps working, it just doesn't remember.
type Area = 'local' | 'session';

function area(kind: Area): Storage | undefined {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function readString(key: string, kind: Area = 'local'): string | null {
  try {
    return area(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string | null, kind: Area = 'local'): void {
  try {
    const store = area(kind);
    if (value === null) store?.removeItem(key);
    else store?.setItem(key, value);
  } catch {
    // Quota exceeded or storage blocked: ignore.
  }
}

export function readJson<T>(key: string, fallback: T, kind: Area = 'local'): T {
  const raw = readString(key, kind);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown, kind: Area = 'local'): void {
  writeString(key, JSON.stringify(value), kind);
}
