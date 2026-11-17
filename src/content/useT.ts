import { useCallback, useContext } from 'react';

import { format, localize } from '../lib/l10n.ts';
import { LangContext } from '../state/lang.ts';
import { site } from './load.ts';
import type { L10n } from './schema.ts';

/** Localisation helpers: t() for content strings, ui() for site.json UI strings. */
export function useT() {
  const lang = useContext(LangContext);
  const t = useCallback((text: L10n) => localize(text, lang), [lang]);
  const ui = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const text = site.ui[key];
      if (!text) {
        if (import.meta.env.DEV) console.warn(`Missing UI string "${key}" in content/site.json`);
        return key;
      }
      return format(localize(text, lang), vars);
    },
    [lang],
  );
  return { lang, t, ui };
}
