import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';
import { handleAction } from '../src/pages/sites/[slug]/[action].js';

const NOW = Date.parse('2026-09-23T18:00:00Z');
let db;
const form = (obj) => { const f = new FormData(); for (const [k, v] of Object.entries(obj)) f.append(k, v); return f; };
const act = (action, obj, slug = 'a') => handleAction({ db, slug, action, form: form(obj), nowMs: NOW });

beforeEach(async () => {
  db = makeD1();
  await q.createSite(db, { slug: 'a', name: 'A', live_url: 'https://a.test', hosting: 'pages' }, 't');
});

describe('site actions', () => {
  it('saves status and returns to the header', async () => {
    expect(await act('status', { project_status: 'paused', status_note: 'Back in October' }))
      .toEqual({ status: 303, location: '/sites/a#top' });
    expect(await q.getSiteBySlug(db, 'a')).toMatchObject({ project_status: 'paused', status_note: 'Back in October' });
  });

  it('sends validation messages back to the right section', async () => {
    const r = await act('status', { project_status: 'gone', status_note: '' });
    expect(r.status).toBe(303);
    expect(r.location).toMatch(/^\/sites\/a\?err=status&msg=.+#top$/);
  });

  it('adds and ticks manual work', async () => {
    expect((await act('work', { text: 'Fix contrast' })).location).toBe('/sites/a#work');
    const [item] = await q.listWorkItems(db, 1);
    await act('work-done', { id: String(item.id), done: '1' });
    expect((await q.listWorkItems(db, 1))[0].done_at).not.toBeNull();
  });

  it('saves accessibility and log entries, defaulting the log date to today in Eastern', async () => {
    await act('a11y', { a11y_audited_on: '2026-09-22', a11y_open_issues: '4', a11y_statement_url: '' });
    expect((await q.getSiteBySlug(db, 'a')).a11y_open_issues).toBe(4);
    await act('log', { text: 'Added credit link', entry_date: '' });
    expect((await q.listLog(db, 1))[0]).toMatchObject({ entry_date: '2026-09-23', text: 'Added credit link' });
  });

  it('rejects work-done with a missing id instead of silently succeeding', async () => {
    const r = await act('work-done', {});
    expect(r.status).toBe(303);
    expect(r.location).toMatch(/err=work-done/);
  });

  it('404s an unknown action or site', async () => {
    expect((await act('delete', {})).status).toBe(404);
    expect((await act('status', { project_status: 'live' }, 'nope')).status).toBe(404);
  });
});
