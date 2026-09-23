import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';

const T = '2026-09-23T18:00:00.000Z';
let db;

const site = (over = {}) => ({
  slug: 'mbs-medicine', name: 'MBS Medicine', live_url: 'https://mbsdoc.com', repo: null,
  local_path: null, hosting: 'pages', deploy_command: null, maintainer_id: null, domain: null, ...over,
});

beforeEach(() => { db = makeD1(); });

describe('people', () => {
  it('finds a person by email case-insensitively', async () => {
    await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Alex', 'alex@example.com', 'owner', 't')").run();
    expect(await q.getPersonByEmail(db, 'ALEX@example.com')).toMatchObject({ name: 'Alex', role: 'owner' });
    expect(await q.getPersonByEmail(db, 'nobody@example.com')).toBeNull();
  });

  it('finds a person even when their stored email has capital letters', async () => {
    await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Alex', 'Alex@Example.com', 'owner', 't')").run();
    expect(await q.getPersonByEmail(db, 'alex@example.com')).toMatchObject({ name: 'Alex', role: 'owner' });
  });
});

describe('sites', () => {
  it('creates, reads, lists and updates', async () => {
    const id = await q.createSite(db, site(), T);
    await q.createSite(db, site({ slug: 'another', name: 'another site' }), T);
    expect((await q.getSiteBySlug(db, 'mbs-medicine')).id).toBe(id);
    expect((await q.listSites(db)).map((s) => s.name)).toEqual(['another site', 'MBS Medicine']);
    await q.updateSite(db, id, site({ repo: 'o/r' }), '2026-09-24T00:00:00.000Z');
    const after = await q.getSiteBySlug(db, 'mbs-medicine');
    expect(after.repo).toBe('o/r');
    expect(after.updated_at).toBe('2026-09-24T00:00:00.000Z');
  });

  it('updates status, accessibility, logo, favicon and only the expiry fields given', async () => {
    const id = await q.createSite(db, site(), T);
    await q.updateSiteStatus(db, id, { project_status: 'waiting_client', status_note: 'Photos' }, T);
    await q.updateSiteA11y(db, id, { a11y_audited_on: '2026-09-01', a11y_open_issues: 3, a11y_statement_url: null }, T);
    await q.setSiteLogo(db, id, 'logos/a.png', T);
    await q.setSiteFavicon(db, id, 'favicons/a', T);
    await q.setSiteExpiry(db, id, { cert_expires_on: '2026-12-01' }, T);
    await q.setSiteExpiry(db, id, { domain_expires_on: '2027-01-01' }, T);
    const s = await q.getSiteBySlug(db, 'mbs-medicine');
    expect(s).toMatchObject({
      project_status: 'waiting_client', status_note: 'Photos', a11y_open_issues: 3,
      logo_key: 'logos/a.png', favicon_key: 'favicons/a',
      cert_expires_on: '2026-12-01', domain_expires_on: '2027-01-01',
    });
  });
});

describe('checks', () => {
  it('returns the latest N per site, newest first, and prunes old rows', async () => {
    const a = await q.createSite(db, site(), T);
    const b = await q.createSite(db, site({ slug: 'b', name: 'B' }), T);
    for (const [id, when, ok] of [[a, '2026-09-23T17:00:00Z', 1], [a, '2026-09-23T17:15:00Z', 0], [a, '2026-09-23T17:30:00Z', 1], [b, '2026-09-23T17:30:00Z', 1]]) {
      await q.insertCheck(db, { site_id: id, checked_at: when, ok, http_status: 200, ms: 100, error: null });
    }
    const map = await q.latestChecksForAll(db, 2);
    expect(map.get(a).map((c) => c.checked_at)).toEqual(['2026-09-23T17:30:00Z', '2026-09-23T17:15:00Z']);
    expect(map.get(b)).toHaveLength(1);
    expect(await q.checksSince(db, a, '2026-09-23T17:10:00Z')).toHaveLength(2);
    await q.pruneChecks(db, '2026-09-23T17:10:00Z');
    expect(await q.checksSince(db, a, '2000-01-01T00:00:00Z')).toHaveLength(2);
  });

  it('stores booleans as 0 and 1', async () => {
    const a = await q.createSite(db, site(), T);
    await q.insertCheck(db, { site_id: a, checked_at: T, ok: false, http_status: null, ms: null, error: 'timeout' });
    expect((await q.checksSince(db, a, '2000-01-01'))[0]).toMatchObject({ ok: 0, error: 'timeout' });
  });
});

describe('work items', () => {
  it('adds and ticks manual items and counts only open ones', async () => {
    const a = await q.createSite(db, site(), T);
    await q.addManualWork(db, a, 'Fix contrast', T);
    await q.addManualWork(db, a, 'Push credit commit', T);
    const [first] = await q.listWorkItems(db, a);
    await q.setManualWorkDone(db, a, first.id, true, T);
    expect((await q.openWorkCounts(db)).get(a)).toBe(1);
    await q.setManualWorkDone(db, a, first.id, false, T);
    expect((await q.openWorkCounts(db)).get(a)).toBe(2);
  });

  it('applies a GitHub plan: inserts, reopening updates and closes', async () => {
    const a = await q.createSite(db, site(), T);
    await q.applyGithubPlan(db, a, { inserts: [{ github_key: 'pr:1', text: 'PR 1', url: 'u1' }, { github_key: 'branch:x', text: 'Branch x', url: 'u2' }], updates: [], closes: [] }, T);
    const items = await q.listGithubItems(db, a);
    const pr = items.find((i) => i.github_key === 'pr:1');
    const br = items.find((i) => i.github_key === 'branch:x');
    await q.applyGithubPlan(db, a, { inserts: [], updates: [], closes: [br.id] }, T);
    await q.applyGithubPlan(db, a, { inserts: [], updates: [{ id: pr.id, text: 'PR 1 renamed', url: 'u1' }], closes: [] }, T);
    const after = await q.listGithubItems(db, a);
    expect(after.find((i) => i.id === pr.id)).toMatchObject({ text: 'PR 1 renamed', done_at: null });
    expect(after.find((i) => i.id === br.id).done_at).toBe(T);
  });

  it('never lets the manual toggle touch a GitHub item', async () => {
    const a = await q.createSite(db, site(), T);
    await q.applyGithubPlan(db, a, { inserts: [{ github_key: 'pr:1', text: 'PR 1', url: 'u' }], updates: [], closes: [] }, T);
    const [pr] = await q.listGithubItems(db, a);
    await q.setManualWorkDone(db, a, pr.id, true, T);
    expect((await q.listGithubItems(db, a))[0].done_at).toBeNull();
  });
});

describe('log and alert state', () => {
  it('lists log entries newest first', async () => {
    const a = await q.createSite(db, site(), T);
    await q.addLog(db, a, '2026-09-01', 'Older', T);
    await q.addLog(db, a, '2026-09-22', 'Newer', T);
    expect((await q.listLog(db, a)).map((e) => e.text)).toEqual(['Newer', 'Older']);
  });

  it('upserts alert state', async () => {
    const a = await q.createSite(db, site(), T);
    await q.upsertAlertState(db, { site_id: a, level: 'green', since: T, last_alert_level: null, last_alert_at: null });
    await q.upsertAlertState(db, { site_id: a, level: 'red', since: T, last_alert_level: 'red', last_alert_at: T });
    expect((await q.allAlertStates(db)).get(a)).toMatchObject({ level: 'red', last_alert_level: 'red' });
  });
});
