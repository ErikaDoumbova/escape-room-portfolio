import { describe, expect, it } from 'vitest';

import { assembleEmail, mailtoHref } from '../../src/lib/email.ts';
import { format, localize } from '../../src/lib/l10n.ts';

describe('localisation', () => {
  it('uses Bulgarian when present and falls back to English', () => {
    expect(localize({ en: 'Kitchen', bg: 'Кухня' }, 'bg')).toBe('Кухня');
    expect(localize({ en: 'Kitchen' }, 'bg')).toBe('Kitchen');
    expect(localize({ en: 'Kitchen', bg: '' }, 'bg')).toBe('Kitchen');
    expect(localize({ en: 'Kitchen', bg: 'Кухня' }, 'en')).toBe('Kitchen');
  });

  it('fills {slots} and leaves unknown ones alone', () => {
    expect(format('Serves {n}', { n: 4 })).toBe('Serves 4');
    expect(format('{found} of {total}', { found: 2 })).toBe('2 of {total}');
  });
});

describe('email', () => {
  it('joins the two halves only at runtime', () => {
    const parts = { user: 'someone', domain: 'example.com' };
    expect(assembleEmail(parts)).toBe('someone@example.com');
    expect(mailtoHref(parts)).toBe('mailto:someone@example.com');
  });
});
