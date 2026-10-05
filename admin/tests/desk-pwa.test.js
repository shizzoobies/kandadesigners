import { describe, it, expect } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';
import { manifestFor, phoneBarState, DESK_THEME } from '../src/lib/desk-pwa.js';
import { GET as manifestRoute } from '../src/pages/sites/[slug]/social/manifest.webmanifest.js';

const SITE = { id: 1, slug: 'ka-performance', name: 'K & A Performance' };

describe('manifestFor', () => {
  it('names the desk after the site and scopes it to that site\'s desk', () => {
    const m = manifestFor(SITE);
    expect(m).toMatchObject({
      name: 'K & A Performance Post Desk',
      short_name: 'Post Desk',
      id: '/sites/ka-performance/social',
      start_url: '/sites/ka-performance/social',
      scope: '/sites/ka-performance/social',
      display: 'standalone',
    });
  });

  it('takes its colors from the admin palette in admin.css', () => {
    const m = manifestFor(SITE);
    expect(m.background_color).toBe('#F8F5F2');
    expect(m.theme_color).toBe('#FFFDF9');
    expect(m).toMatchObject(DESK_THEME);
  });

  it('lists the 192, 512 and maskable icons from public/images', () => {
    expect(manifestFor(SITE).icons).toEqual([
      { src: '/images/desk-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/images/desk-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/images/desk-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ]);
  });

  it('hands out a fresh icons list each time, so a caller cannot edit the shared one', () => {
    manifestFor(SITE).icons[0].src = '/x.png';
    expect(manifestFor(SITE).icons[0].src).toBe('/images/desk-192.png');
  });

  it('needs a site row with a slug', () => {
    expect(() => manifestFor(null)).toThrow();
    expect(() => manifestFor({ name: 'No slug' })).toThrow();
    expect(() => manifestFor({ slug: 42, name: 'Bad' })).toThrow();
  });
});

describe('GET manifest.webmanifest', () => {
  const call = async (db, slug) => manifestRoute({ params: { slug }, locals: { runtime: { env: { DB: db } } } });

  it('serves the site row\'s manifest as private manifest JSON', async () => {
    const db = makeD1();
    await q.createSite(db, { slug: 'ka-performance', name: 'K & A Performance', live_url: 'https://ka.test', hosting: 'pages' }, 't');
    const r = await call(db, 'ka-performance');
    expect(r.status).toBe(200);
    expect(r.headers.get('Content-Type')).toBe('application/manifest+json');
    expect(r.headers.get('Cache-Control')).toBe('private, max-age=300');
    expect(await r.json()).toEqual(manifestFor({ slug: 'ka-performance', name: 'K & A Performance' }));
  });

  it('404s a slug with no site row, so nothing is built from the path alone', async () => {
    const db = makeD1();
    const r = await call(db, 'no-such-site');
    expect(r.status).toBe(404);
  });
});

describe('phoneBarState', () => {
  const items = [
    { id: 'a', kind: 'reel' }, { id: 'b', kind: 'carousel' }, { id: 'n', kind: 'native' },
    { id: 's', kind: 'story', type: 'story' }, { id: 'q', kind: 'ask', type: 'ask' },
  ];
  const states = (map) => (it) => map[it.id] ?? (it.kind === 'native' ? 'info' : 'waiting');

  it('offers Request changes then Approve on a waiting post', () => {
    expect(phoneBarState(items[0], states({}), true, items)).toEqual({ status: 'waiting', buttons: ['changes', 'approve'] });
  });

  it('offers Undo and Next post once approved', () => {
    expect(phoneBarState(items[0], states({ a: 'approved' }), true, items)).toEqual({ status: 'approved', buttons: ['undo', 'next'] });
  });

  it('offers Undo and Next post once changes are asked', () => {
    expect(phoneBarState(items[1], states({ b: 'changes' }), true, items)).toEqual({ status: 'changes', buttons: ['undo', 'next'] });
  });

  it('covers Stories like posts', () => {
    expect(phoneBarState(items[3], states({}), true, items)).toEqual({ status: 'waiting', buttons: ['changes', 'approve'] });
  });

  it('shows a read-only user the status and no buttons', () => {
    expect(phoneBarState(items[0], states({}), false, items)).toEqual({ status: 'waiting', buttons: [] });
    expect(phoneBarState(items[0], states({ a: 'approved' }), false, items)).toEqual({ status: 'approved', buttons: [] });
  });

  it('has no bar for asks or native posts', () => {
    expect(phoneBarState(items[4], states({}), true, items)).toEqual({ status: null, buttons: [] });
    expect(phoneBarState(items[2], states({}), true, items)).toEqual({ status: null, buttons: [] });
    expect(phoneBarState({ id: 'x', type: 'ask' }, states({}), true, items)).toEqual({ status: null, buttons: [] });
  });

  it('drops Next post when there is nowhere to go', () => {
    const one = [{ id: 'a', kind: 'reel' }];
    expect(phoneBarState(one[0], states({ a: 'approved' }), true, one)).toEqual({ status: 'approved', buttons: ['undo'] });
  });

  it('has no bar without an item', () => {
    expect(phoneBarState(null, states({}), true, items)).toEqual({ status: null, buttons: [] });
  });
});
