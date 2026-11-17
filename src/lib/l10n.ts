import type { L10n, Lang } from '../content/schema.ts';

/** Pick the string for `lang`, falling back to English (handoff §9). */
export function localize(text: L10n, lang: Lang): string {
  if (lang === 'en') return text.en;
  if (text.bg !== undefined && text.bg !== '') return text.bg;
  if (import.meta.env?.DEV) console.warn(`Missing Bulgarian text for: "${text.en}"`);
  return text.en;
}

/** Fill "{name}" slots: format("Serves {n}", { n: 4 }) → "Serves 4". */
export function format(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in vars ? String(vars[key]) : m));
}
