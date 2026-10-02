import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';
import { handleDecide } from '../src/pages/sites/[slug]/social/decide.js';
import { handleCheck } from '../src/pages/sites/[slug]/social/check.js';
import { handleState } from '../src/pages/sites/[slug]/social/state.js';
import { serveDeskMedia } from '../src/pages/sites/[slug]/social/media/[...key].js';

const NOW = Date.parse('2026-10-05T16:00:00Z');
const ORIGIN = 'https://admin.ka-performancefl.com';
const OWNER = { id: 1, name: 'Alex', email: 'alex@example.com', role: 'owner' };
const VIEWER = { id: 2, name: 'Sam', email: 'sam@example.com', role: 'viewer' };
let db;

const req = (path, body, { origin = ORIGIN, type = 'application/json' } = {}) => {
  const headers = {};
  if (origin) headers.Origin = origin;
  if (type) headers['Content-Type'] = type;
  return new Request(`${ORIGIN}/sites/ka-performance/social/${path}`, {
    method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body),
  });
};
const decide = (body, opts = {}) => handleDecide({ db, slug: opts.slug ?? 'ka-performance', user: opts.user ?? OWNER, request: req('decide', body, opts), nowMs: NOW });
const check = (body, opts = {}) => handleCheck({ db, slug: opts.slug ?? 'ka-performance', user: opts.user ?? OWNER, request: req('check', body, opts), nowMs: NOW });

async function addItem(itemId, list, kind, date = '2026-10-06') {
  await db.prepare('INSERT INTO desk_items (site_id, item_id, list, kind, post_date, post_time, title, payload, pushed_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(itemId, list, kind, date, '10:00', 'T', JSON.stringify({ id: itemId }), 't').run();
}

beforeEach(async () => {
  db = makeD1();
  await q.createSite(db, { slug: 'ka-performance', name: 'K & A', live_url: 'https://ka.test', hosting: 'pages' }, 't');
  await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Alex', 'alex@example.com', 'owner', 't')").run();
  await addItem('2026-10-06', 'approve', 'reel');
  await addItem('q-music', 'approve', 'ask', null);
  await addItem('2026-10-06-story', 'stories', 'story');
});

describe('POST decide', () => {
  it('saves an approval and responds with the saved row', async () => {
    const r = await decide({ item_id: '2026-10-06', decision: 'approved' });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ item_id: '2026-10-06', decision: 'approved', decided_by: 1, decided_at: new Date(NOW).toISOString(), pulled_at: null });
  });

  it('clears pulled_at when a decision changes, and keeps fields the body leaves out', async () => {
    await decide({ item_id: '2026-10-06', decision: 'changes', note: 'Shorter', answers: { 0: 'Yes' } });
    await db.prepare("UPDATE desk_decisions SET pulled_at = 'x'").run();
    const r = await decide({ item_id: '2026-10-06', decision: 'approved' });
    expect(r.body).toMatchObject({ decision: 'approved', note: 'Shorter', answers: { 0: 'Yes' }, pulled_at: null });
  });

  it('saves an ask answer', async () => {
    const r = await decide({ item_id: 'q-music', decision: 'answered', answer: 'Track B' });
    expect(r.body).toMatchObject({ decision: 'answered', answer: 'Track B' });
  });

  it('is owner only', async () => {
    const r = await decide({ item_id: '2026-10-06', decision: 'approved' }, { user: VIEWER });
    expect(r.status).toBe(403);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_decisions').first('n')).toBe(0);
  });

  it('rejects a foreign or missing Origin', async () => {
    expect((await decide({ item_id: '2026-10-06', decision: 'approved' }, { origin: 'https://evil.test' })).status).toBe(403);
    expect((await decide({ item_id: '2026-10-06', decision: 'approved' }, { origin: null })).status).toBe(403);
  });

  it('requires a JSON body', async () => {
    expect((await decide({ item_id: '2026-10-06', decision: 'approved' }, { type: 'text/plain' })).status).toBe(415);
    expect((await decide({ item_id: '2026-10-06', decision: 'approved' }, { type: 'application/x-www-form-urlencoded' })).status).toBe(415);
    expect((await decide({ item_id: '2026-10-06', decision: 'approved' }, { type: 'application/json; charset=utf-8' })).status).toBe(200);
    expect((await decide('{not json')).status).toBe(400);
    expect((await decide('[]')).status).toBe(400);
  });

  it('404s an unknown item or site, and 400s a malformed item id', async () => {
    expect((await decide({ item_id: '2026-10-09', decision: 'approved' })).status).toBe(404);
    expect((await decide({ item_id: '2026-10-06-story', decision: 'approved' })).status).toBe(404);
    expect((await decide({ item_id: '2026-10-06', decision: 'approved' }, { slug: 'nope' })).status).toBe(404);
    expect((await decide({ item_id: 7, decision: 'approved' })).status).toBe(400);
    expect((await decide({ decision: 'approved' })).status).toBe(400);
  });

  it('400s a decision outside the set', async () => {
    const r = await decide({ item_id: '2026-10-06', decision: 'published' });
    expect(r.status).toBe(400);
    expect(r.body.error).toBeTruthy();
  });
});

describe('POST check', () => {
  it('ticks a Story on the checklist', async () => {
    const r = await check({ item_id: '2026-10-06-story', posted: true });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ item_id: '2026-10-06-story', posted: true, checked_by: 1, pulled_at: null });
  });

  it('applies the same write rules', async () => {
    expect((await check({ item_id: '2026-10-06-story', posted: true }, { user: VIEWER })).status).toBe(403);
    expect((await check({ item_id: '2026-10-06-story', posted: true }, { origin: 'https://evil.test' })).status).toBe(403);
    expect((await check({ item_id: '2026-10-06-story', posted: true }, { type: 'text/plain' })).status).toBe(415);
    expect((await check({ item_id: '2026-10-06', posted: true })).status).toBe(404);
    expect((await check({ item_id: '2026-10-06-story', posted: 1 })).status).toBe(400);
  });
});

describe('client writes', () => {
  const HANNAH = { id: 2, name: 'Hannah', email: 'hannah@example.com', role: 'client', grants: [{ site_id: 1, slug: 'ka-performance', level: 'approve' }] };
  const VIEWING = { ...HANNAH, grants: [{ site_id: 1, slug: 'ka-performance', level: 'view' }] };
  const ELSEWHERE = { ...HANNAH, grants: [{ site_id: 2, slug: 'other', level: 'approve' }] };

  beforeEach(async () => {
    await q.createSite(db, { slug: 'other', name: 'Other', live_url: 'https://o.test', hosting: 'pages' }, 't');
    await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Hannah', 'hannah@example.com', 'client', 't')").run();
  });

  it('lets an approve client decide, records who, and names them', async () => {
    const r = await decide({ item_id: '2026-10-06', decision: 'changes', note: 'Brighter' }, { user: HANNAH });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ decision: 'changes', decided_by: 2, decided_by_name: 'Hannah' });
    expect((await decide({ item_id: 'q-music', decision: 'answered', answer: 'B' }, { user: HANNAH })).status).toBe(200);
    expect((await decide({ item_id: '2026-10-06', decision: 'waiting' }, { user: HANNAH })).status).toBe(200);
  });

  it('lets an approve client tick a Story, recording who', async () => {
    const r = await check({ item_id: '2026-10-06-story', posted: true }, { user: HANNAH });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ posted: true, checked_by: 2 });
  });

  it('refuses a view client, and writes nothing', async () => {
    expect((await decide({ item_id: '2026-10-06', decision: 'approved' }, { user: VIEWING })).status).toBe(403);
    expect((await check({ item_id: '2026-10-06-story', posted: true }, { user: VIEWING })).status).toBe(403);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_decisions').first('n')).toBe(0);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM desk_story_checks').first('n')).toBe(0);
  });

  it('refuses a client whose approve grant is on another site', async () => {
    expect((await decide({ item_id: '2026-10-06', decision: 'approved' }, { user: ELSEWHERE })).status).toBe(403);
    expect((await check({ item_id: '2026-10-06-story', posted: true }, { user: ELSEWHERE })).status).toBe(403);
  });

  it('strips Metricool ids and Alex\'s repost comment from the state a client is sent, and keeps them for the owner', async () => {
    await db.prepare("UPDATE desk_items SET payload = ? WHERE item_id = '2026-10-06'")
      .bind(JSON.stringify({ id: '2026-10-06', scheduled: { facebook: { id: 'm-123' } }, repost: 'My take', hook: 'H' })).run();
    const owner = await handleState({ db, bucket: null, slug: 'ka-performance', nowMs: NOW, memo: new Map(), user: OWNER });
    expect(owner.body.items.find((i) => i.item_id === '2026-10-06').payload)
      .toMatchObject({ scheduled: { facebook: { id: 'm-123' } }, repost: 'My take' });
    const client = await handleState({ db, bucket: null, slug: 'ka-performance', nowMs: NOW, memo: new Map(), user: HANNAH });
    const p = client.body.items.find((i) => i.item_id === '2026-10-06').payload;
    expect(p).toEqual({ id: '2026-10-06', hook: 'H' });
    expect(JSON.stringify(client.body)).not.toMatch(/m-123/);
  });

  it('shows the owner\'s name on the owner\'s decisions too', async () => {
    const r = await decide({ item_id: '2026-10-06', decision: 'approved' });
    expect(r.body.decided_by_name).toBe('Alex');
    const s = await handleState({ db, bucket: null, slug: 'ka-performance', nowMs: NOW, memo: new Map() });
    expect(s.body.decisions[0]).toMatchObject({ decided_by: 1, decided_by_name: 'Alex' });
  });
});

describe('GET state', () => {
  it('returns items, decisions, checks and meta', async () => {
    await decide({ item_id: '2026-10-06', decision: 'approved' });
    const r = await handleState({ db, bucket: null, slug: 'ka-performance', nowMs: NOW, memo: new Map() });
    expect(r.status).toBe(200);
    expect(Object.keys(r.body).sort()).toEqual(['checks', 'decisions', 'items', 'meta']);
    expect(r.body.items).toHaveLength(3);
    expect(r.body.decisions[0].decision).toBe('approved');
    expect((await handleState({ db, bucket: null, slug: 'nope', nowMs: NOW, memo: new Map() })).status).toBe(404);
  });
});

describe('GET media', () => {
  const bytes = new Uint8Array(1000).map((_, i) => i % 256);
  const KEY = 'ka-performance/2026-10-06/reel.mp4';
  // An R2-shaped fake. `headEtag` lets a test swap the object between head()
  // and get(); a failed onlyIf returns metadata with no body, as R2 does.
  function fakeMedia({ headEtag = 'e1', etag = 'e1', gone = false } = {}) {
    const meta = (e) => ({ size: bytes.length, etag: e, httpEtag: `"${e}"`, httpMetadata: { contentType: 'video/mp4' } });
    return {
      calls: [],
      async head(key) {
        return key === KEY ? meta(headEtag) : null;
      },
      async get(key, opts = {}) {
        this.calls.push(opts);
        if (key !== KEY || gone) return null;
        if (opts.onlyIf?.etagMatches && opts.onlyIf.etagMatches !== etag) return meta(etag);
        const r = opts.range;
        return { ...meta(etag), body: r ? bytes.slice(r.offset, r.offset + r.length) : bytes };
      },
    };
  }
  const bucket = fakeMedia();
  const get = (key, range, b = bucket) => serveDeskMedia({ bucket: b, slug: 'ka-performance', key, range });

  it('serves the whole file with range support advertised', async () => {
    const r = await get('2026-10-06/reel.mp4');
    expect(r.status).toBe(200);
    expect(r.headers.get('ETag')).toBe('"e1"');
    expect(r.headers.get('Accept-Ranges')).toBe('bytes');
    expect(r.headers.get('Content-Length')).toBe('1000');
    expect(r.headers.get('Content-Type')).toBe('video/mp4');
    expect(r.headers.get('Cache-Control')).toBe('private, max-age=3600');
    expect(r.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('serves a single range as 206', async () => {
    const r = await get('2026-10-06/reel.mp4', 'bytes=100-199');
    expect(r.status).toBe(206);
    expect(r.headers.get('Content-Range')).toBe('bytes 100-199/1000');
    expect(r.headers.get('Content-Length')).toBe('100');
    const got = new Uint8Array(await r.arrayBuffer());
    expect(got[0]).toBe(100);
    expect(got).toHaveLength(100);
    expect(r.headers.get('ETag')).toBe('"e1"');
  });

  it('reads the range only from the object head() measured', async () => {
    const b = fakeMedia();
    await get('2026-10-06/reel.mp4', 'bytes=0-1', b);
    expect(b.calls[0]).toEqual({ range: { offset: 0, length: 2 }, onlyIf: { etagMatches: 'e1' } });
  });

  it('503s with Retry-After when the object changes or goes between head and get', async () => {
    for (const b of [fakeMedia({ headEtag: 'old', etag: 'new' }), fakeMedia({ gone: true })]) {
      for (const range of ['bytes=0-1', 'bytes=abc']) {
        const r = await get('2026-10-06/reel.mp4', range, b);
        expect(r.status).toBe(503);
        expect(r.headers.get('Retry-After')).toBe('1');
      }
    }
  });

  it('416s a range past the end', async () => {
    const r = await get('2026-10-06/reel.mp4', 'bytes=1000-');
    expect(r.status).toBe(416);
    expect(r.headers.get('Content-Range')).toBe('bytes */1000');
  });

  it('404s keys outside the pattern and missing objects', async () => {
    expect((await get('2026-10-06/nope.mp4')).status).toBe(404);
    expect((await get('reel.mp4')).status).toBe(404);
    expect((await get('2026-10-06/sub/reel.mp4')).status).toBe(404);
    expect((await get('2026-10-06/re el.mp4')).status).toBe(404);
    expect((await serveDeskMedia({ bucket, slug: 'Other Site', key: '2026-10-06/reel.mp4' })).status).toBe(404);
  });
});
