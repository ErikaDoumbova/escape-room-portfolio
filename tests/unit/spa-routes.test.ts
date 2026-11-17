import { describe, expect, it } from 'vitest';

import { computeRoutes, escapeHtml, injectMeta } from '../../scripts/lib/routes.mjs';
import site from '../../content/site.json' with { type: 'json' };

const kitchen = {
  id: 'kitchen',
  name: { en: 'Kitchen' },
  theme: { en: "Where I'm from" },
  objects: [
    {
      id: 'stuffed-peppers',
      name: { en: 'Pot of stuffed peppers' },
      blocks: [{ type: 'paragraph', text: { en: 'My grandmother makes these every Sunday.' } }],
    },
    { id: 'window', enabled: false, name: { en: 'Window' } },
    {
      id: 'magnet',
      name: { en: 'Fridge magnet' },
      blocks: [{ type: 'paragraph', text: { en: 'PLACEHOLDER story' } }],
    },
  ],
};

describe('computeRoutes', () => {
  it('writes a page for every live room and the tour, even before room files exist', () => {
    const paths = computeRoutes(site, {}).map((r) => r.path);
    expect(paths).toEqual(['', 'living-room', 'bedroom', 'kitchen', 'tour']);
  });

  it('adds a page per enabled object with room-specific meta', () => {
    const routes = computeRoutes(site, { kitchen });
    const paths = routes.map((r) => r.path);
    expect(paths).toContain('kitchen/stuffed-peppers');
    expect(paths).toContain('kitchen/magnet');
    expect(paths).not.toContain('kitchen/window');

    expect(routes.find((r) => r.path === 'kitchen')?.title).toBe('Kitchen · Erika Doumbova');
    const peppers = routes.find((r) => r.path === 'kitchen/stuffed-peppers');
    expect(peppers?.title).toBe('Pot of stuffed peppers · Kitchen · Erika Doumbova');
    expect(peppers?.description).toBe('My grandmother makes these every Sunday.');
  });

  it('never uses PLACEHOLDER text as a description', () => {
    const magnet = computeRoutes(site, { kitchen }).find((r) => r.path === 'kitchen/magnet');
    expect(magnet?.description).toBe("Where I'm from");
  });

  it('gives front-room objects their own pages without duplicating the home page', () => {
    const front = {
      id: 'front',
      name: { en: 'Front' },
      theme: { en: 'Hello' },
      objects: [{ id: 'mailbox', name: { en: 'Mailbox' } }],
    };
    const paths = computeRoutes(site, { front }).map((r) => r.path);
    expect(paths.filter((p) => p === '')).toHaveLength(1);
    expect(paths).toContain('front/mailbox');
  });
});

describe('injectMeta', () => {
  const html = '<head><title>Old</title>\n<meta\n  name="description"\n  content="old"\n/></head>';

  it('replaces the title and description, escaping HTML', () => {
    const out = injectMeta(html, { title: 'A & B', description: 'Say "hi" <3' });
    expect(out).toContain('<title>A &amp; B</title>');
    expect(out).toContain('<meta name="description" content="Say &quot;hi&quot; &lt;3" />');
    expect(out).not.toContain('old');
  });

  it('escapes all HTML-special characters', () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});
