import { createContext } from 'react';

import type { Lang } from '../content/schema.ts';

/** Current language. M3 adds the EN/BG toggle provider; until then it's English. */
export const LangContext = createContext<Lang>('en');
