import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';
import { runChecker, checkUptime } from '../checker/index.js';

const quiet = { error() {}, warn() {}, log() {} };
const T0 = Date.parse('2026-09-23T14:15:00Z'); // not a GitHub or daily run
let env;
let sent;

function net(overrides = {}) {
  return async (url, init = {}) => {
    for (const [prefix, fn] of Object.entries(overrides)) if (url.startsWith(prefix)) return fn(url, init);
    if (url === 'https://api.resend.com/emails') {
      sent.push(JSON.parse(init.body));
      return new Response('{}', { status: 200 });
    }
    return new Response('ok', { status: 200 });
  };
}

beforeEach(async () => {
  sent = [];
  env = { DB: makeD1(), RESEND_API_KEY: 'k', ALERT_FROM: 'alerts@x', ALERT_TO: 'alex@x', ADMIN_URL: 'https://admin.test' };
  await q.createSite(env.DB, { slug: 'a', name: 'A', live_url: 'https://a.test/', hosting: 'pages' }, 't');
});

describe('checkUptime', () => {
  it('counts 2xx and 3xx as up and records a timeout as an error', async () => {
    let t = 0;
    const now = () => (t += 250);
    expect(await checkUptime({ live_url: 'https://a.test/' }, async () => new Response('', { status: 301 }), now))
      .toMatchObject({ ok: true, http_status: 301, ms: 250 });
    const timeout = async () => { const e = new Error('t'); e.name = 'TimeoutError'; throw e; };
    expect(await checkUptime({ live_url: 'https://a.test/' }, timeout, now)).toEqual({ ok: false, http_status: null, ms: null, error: 'timeout' });
  });
});

describe('runChecker', () => {
  it('records a check per site and sets alert state', async () => {
    await runChecker({ env, nowMs: T0, fetchImpl: net(), log: quiet });
    expect(await q.checksSince(env.DB, 1, '2000-01-01')).toHaveLength(1);
    expect((await q.allAlertStates(env.DB)).get(1)).toMatchObject({ level: 'green' });
    expect(sent).toHaveLength(0);
  });

  it('emails once when a site goes red and once when it recovers', async () => {
    const down = net({ 'https://a.test/': async () => new Response('', { status: 503 }) });
    await runChecker({ env, nowMs: T0, fetchImpl: down, log: quiet });
    expect(sent).toHaveLength(0); // one failure is amber
    await runChecker({ env, nowMs: T0 + 15 * 60000, fetchImpl: down, log: quiet });
    expect(sent.map((m) => m.subject)).toEqual(['A is red: Down since 10:15 AM']);
    await runChecker({ env, nowMs: T0 + 30 * 60000, fetchImpl: down, log: quiet });
    expect(sent).toHaveLength(1);
    await runChecker({ env, nowMs: T0 + 45 * 60000, fetchImpl: net(), log: quiet });
    expect(sent.map((m) => m.subject)).toEqual(['A is red: Down since 10:15 AM', 'A is back to green']);
  });

  it('retries a failed alert send on the next run', async () => {
    const down = (resendStatus) => net({
      'https://a.test/': async () => new Response('', { status: 503 }),
      'https://api.resend.com/': async (url, init) => { sent.push(JSON.parse(init.body)); return new Response('{}', { status: resendStatus }); },
    });
    await runChecker({ env, nowMs: T0, fetchImpl: down(200), log: quiet });
    await runChecker({ env, nowMs: T0 + 15 * 60000, fetchImpl: down(500), log: quiet });
    expect((await q.allAlertStates(env.DB)).get(1).last_alert_level).toBeNull();
    await runChecker({ env, nowMs: T0 + 30 * 60000, fetchImpl: down(200), log: quiet });
    expect((await q.allAlertStates(env.DB)).get(1).last_alert_level).toBe('red');
  });

  it('syncs GitHub on the hourly run only, and skips without a token', async () => {
    await q.updateSite(env.DB, 1, { slug: 'a', name: 'A', live_url: 'https://a.test/', hosting: 'pages', repo: 'o/r' }, 't');
    let githubCalls = 0;
    const gh = net({
      'https://api.github.com/': async (url) => {
        githubCalls += 1;
        if (url.endsWith('/repos/o/r')) return new Response(JSON.stringify({ default_branch: 'main' }));
        if (url.includes('/pulls')) return new Response(JSON.stringify([{ number: 3, title: 'T', html_url: 'u', head: { ref: 'x' } }]));
        return new Response('[]');
      },
    });
    await runChecker({ env: { ...env, GITHUB_TOKEN: 'tok', GITHUB_OWNER: 'o' }, nowMs: T0, fetchImpl: gh, log: quiet });
    expect(githubCalls).toBe(0);
    const onTheHour = Date.parse('2026-09-23T15:00:00Z');
    await runChecker({ env, nowMs: onTheHour, fetchImpl: gh, log: quiet });
    expect(githubCalls).toBe(0);
    await runChecker({ env: { ...env, GITHUB_TOKEN: 'tok', GITHUB_OWNER: 'o' }, nowMs: onTheHour, fetchImpl: gh, log: quiet });
    expect((await q.listGithubItems(env.DB, 1)).map((i) => i.github_key)).toEqual(['pr:3']);
    expect((await q.getSiteBySlug(env.DB, 'a')).github_synced_at).toBe('2026-09-23T15:00:00.000Z');
  });

  it('only syncs GitHub for sites whose repo owner matches GITHUB_OWNER', async () => {
    await q.updateSite(env.DB, 1, { slug: 'a', name: 'A', live_url: 'https://a.test/', hosting: 'pages', repo: 'o/r' }, 't');
    await q.createSite(env.DB, { slug: 'b', name: 'B', live_url: 'https://b.test/', hosting: 'pages', repo: 'x/y' }, 't');
    let githubCalls = 0;
    const gh = net({
      'https://api.github.com/': async (url) => {
        githubCalls += 1;
        if (url.endsWith('/repos/o/r')) return new Response(JSON.stringify({ default_branch: 'main' }));
        if (url.includes('/pulls')) return new Response('[]');
        return new Response('[]');
      },
    });
    const onTheHour = Date.parse('2026-09-23T15:00:00Z');
    await runChecker({ env: { ...env, GITHUB_TOKEN: 'tok', GITHUB_OWNER: 'o' }, nowMs: onTheHour, fetchImpl: gh, log: quiet });
    expect(githubCalls).toBeGreaterThan(0);
    expect((await q.getSiteBySlug(env.DB, 'a')).github_synced_at).toBe('2026-09-23T15:00:00.000Z');
    expect((await q.getSiteBySlug(env.DB, 'b')).github_synced_at).toBeNull();
  });

  it('refreshes expiry daily and keeps the stored date when a lookup fails', async () => {
    const daily = Date.parse('2026-09-23T10:00:00Z');
    const lookups = net({
      'https://crt.sh/': async () => new Response(JSON.stringify([{ name_value: 'a.test', not_after: '2026-12-01T00:00:00' }])),
      'https://rdap.org/': async () => new Response(JSON.stringify({ events: [{ eventAction: 'expiration', eventDate: '2027-01-01T00:00:00Z' }] })),
    });
    await runChecker({ env, nowMs: daily, fetchImpl: lookups, log: quiet });
    expect(await q.getSiteBySlug(env.DB, 'a')).toMatchObject({ cert_expires_on: '2026-12-01', domain_expires_on: '2027-01-01' });
    const broken = net({ 'https://crt.sh/': async () => new Response('', { status: 502 }), 'https://rdap.org/': async () => new Response('', { status: 502 }) });
    const result = await runChecker({ env, nowMs: daily + 86400000, fetchImpl: broken, log: quiet });
    expect(await q.getSiteBySlug(env.DB, 'a')).toMatchObject({ cert_expires_on: '2026-12-01', domain_expires_on: '2027-01-01' });
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('fetches a missing icon on the hourly run, once, and never over an uploaded logo', async () => {
    const put = [];
    const LOGOS = { async put(key, bytes, opts) { put.push({ key, type: opts.httpMetadata.contentType }); } };
    await q.createSite(env.DB, { slug: 'b', name: 'B', live_url: 'https://b.test/', hosting: 'pages' }, 't');
    await q.setSiteLogo(env.DB, 2, 'logos/b-00000000.png', 't');
    const icons = net({
      'https://a.test/apple-touch-icon.png': async () => new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'content-type': 'image/png' } }),
      'https://a.test/': async () => new Response('<link rel="apple-touch-icon" href="/apple-touch-icon.png">', { headers: { 'content-type': 'text/html' } }),
    });
    await runChecker({ env: { ...env, LOGOS }, nowMs: T0, fetchImpl: icons, log: quiet });
    expect(put).toHaveLength(0); // 14:15 is not an hourly run
    const onTheHour = Date.parse('2026-09-23T15:00:00Z');
    await runChecker({ env: { ...env, LOGOS }, nowMs: onTheHour, fetchImpl: icons, log: quiet });
    expect(put).toEqual([{ key: 'favicons/a', type: 'image/png' }]);
    expect((await q.getSiteBySlug(env.DB, 'a')).favicon_key).toBe('favicons/a');
    await runChecker({ env: { ...env, LOGOS }, nowMs: onTheHour + 3600000, fetchImpl: icons, log: quiet });
    expect(put).toHaveLength(1);
  });

  it('prunes checks older than 30 days on the daily run', async () => {
    await q.insertCheck(env.DB, { site_id: 1, checked_at: '2026-08-01T00:00:00Z', ok: 1, http_status: 200, ms: 1, error: null });
    await runChecker({ env, nowMs: Date.parse('2026-09-23T10:00:00Z'), fetchImpl: net(), log: quiet });
    expect((await q.checksSince(env.DB, 1, '2000-01-01')).map((c) => c.checked_at)).toEqual(['2026-09-23T10:00:00.000Z']);
  });
});
