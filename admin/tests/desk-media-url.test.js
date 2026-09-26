import { describe, it, expect } from 'vitest';
import { deskMediaUrl } from '../src/lib/desk-media-url.js';

describe('deskMediaUrl', () => {
  it('turns an R2 key into the site-scoped media path', () => {
    expect(deskMediaUrl('ka-performance', 'ka-performance/2026-10-05/reel-vertical.mp4'))
      .toBe('/sites/ka-performance/social/media/2026-10-05/reel-vertical.mp4');
  });

  it('adds the version so a replaced file is fetched fresh', () => {
    expect(deskMediaUrl('ka-performance', 'ka-performance/2026-10-05-story/2026-10-05-story.png', '906497-1727340000000'))
      .toBe('/sites/ka-performance/social/media/2026-10-05-story/2026-10-05-story.png?v=906497-1727340000000');
    expect(deskMediaUrl('a', 'a/x/y.png', 'a b&c')).toBe('/sites/a/social/media/x/y.png?v=a%20b%26c');
  });

  it('refuses a key for another site, or no key at all', () => {
    expect(deskMediaUrl('ka-performance', 'other-site/2026-10-05/a.png')).toBe('');
    expect(deskMediaUrl('ka-performance', undefined)).toBe('');
  });
});
