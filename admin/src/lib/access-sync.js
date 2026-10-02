// Keeps the Cloudflare Access group "K&A admin people" equal to the people
// table, so Cloudflare screens who can reach the login and the admin decides
// what they see. buildGroupBody is the pure part; the rest is a thin fetch.
// Needs the Worker secret ACCESS_GROUPS_TOKEN (Access: Organizations, Identity
// Providers, and Groups: Edit, on this account only) and the var CF_ACCOUNT_ID.
// Without the token it does nothing and says so. It never throws: a failed sync
// is stored in settings for the People page and never blocks an admin change.
// API: https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/groups/
import { listPeople, getSettings, setSettings } from './db.js';

export const GROUP_NAME = 'K&A admin people';
const API = 'https://api.cloudflare.com/client/v4';
const ACCOUNT_ID = /^[a-f0-9]{32}$/;
const GROUP_ID = /^[A-Za-z0-9-]{1,64}$/;
const TIMEOUT_MS = 10000;

export function buildGroupBody(people) {
  const emails = [...new Set(people.map((p) => String(p.email ?? '').trim().toLowerCase()).filter(Boolean))].sort();
  return { name: GROUP_NAME, include: emails.map((email) => ({ email: { email } })) };
}

// What the People page shows. The token comes first: without it nothing syncs.
export function syncStatus(env, settings) {
  if (!env?.ACCESS_GROUPS_TOKEN) return { state: 'token_missing' };
  if (!env.CF_ACCOUNT_ID) return { state: 'account_missing' };
  if (settings.access_sync_error) return { state: 'error', at: settings.access_sync_at, error: settings.access_sync_error };
  if (settings.access_sync_at) return { state: 'ok', at: settings.access_sync_at };
  return { state: 'never' };
}

function ago(iso, nowMs) {
  const s = Math.max(0, Math.round((nowMs - Date.parse(iso)) / 1000));
  const unit = (n, word) => `${n} ${word}${n === 1 ? '' : 's'} ago`;
  if (s < 60) return 'just now';
  if (s < 3600) return unit(Math.floor(s / 60), 'minute');
  if (s < 86400) return unit(Math.floor(s / 3600), 'hour');
  return unit(Math.floor(s / 86400), 'day');
}

export function syncStatusText(status, nowMs = Date.now()) {
  switch (status.state) {
    case 'token_missing': return 'Sign-in list not connected: token missing.';
    case 'account_missing': return 'Sign-in list not connected: account id missing.';
    case 'never': return 'Sign-in list has not synced yet.';
    case 'ok': return `Sign-in list synced ${ago(status.at, nowMs)}.`;
    default: return `Sign-in list needs attention: ${String(status.error).replace(/\.+$/, '')}. ${
      status.at ? `Last good sync ${ago(status.at, nowMs)}.` : 'It has never synced.'}`;
  }
}

async function call(fetchImpl, token, method, url, body) {
  const res = await fetchImpl(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text().catch(() => '');
  let json = null;
  try { json = JSON.parse(text); } catch { /* not JSON: the text itself is the detail */ }
  if (res.ok && json?.success) return { ok: true, result: json.result };
  const say = (e) => [`${e.code ?? ''} ${e.message ?? ''}`.trim(), ...(e.error_chain ?? []).map(say)].filter(Boolean).join(': ');
  const listed = [...(json?.errors ?? []), ...(json?.messages ?? [])].map(say).filter(Boolean).join('; ');
  // A reply that is not JSON at all: keep the start of what it did say, without the token.
  const detail = listed || (json ? '' : text.split(token).join('[token]').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160));
  return { ok: false, status: res.status, error: `Cloudflare answered ${res.status}${detail ? `: ${detail}` : ''}` };
}

// A group made because the stored one was gone is not on the Access policy
// yet, so nobody can sign in through it until Alex adds it. People says so.
export const RECREATED = 'Created a new Access group; add it to the admin Allow policy.';

// One JSON line per sync for Workers logs: the outcome only, never the token
// or anyone's email.
export async function syncAccessGroup({ db, env, fetchImpl = fetch, nowMs = Date.now(), log = console }) {
  const r = await runSync({ db, env, fetchImpl, nowMs });
  const line = { event: 'access.sync' };
  if (r.ok) Object.assign(line, { result: 'ok', created: !!r.created, people: r.people });
  else if (r.skipped) Object.assign(line, { result: 'skipped', reason: r.skipped });
  else Object.assign(line, { result: 'error', error: r.error });
  try {
    log.log(JSON.stringify(line));
  } catch {
    // Logging never changes the outcome.
  }
  const { people, ...out } = r;
  return out;
}

async function runSync({ db, env, fetchImpl, nowMs }) {
  const token = env?.ACCESS_GROUPS_TOKEN;
  if (!token) return { ok: false, skipped: 'token_missing' };
  const account = env.CF_ACCOUNT_ID;
  if (!account) return { ok: false, skipped: 'account_missing' };
  const nowIso = new Date(nowMs).toISOString();

  const fail = async (error) => {
    const message = String(error).slice(0, 300);
    try {
      await setSettings(db, { access_sync_error: message }, nowIso);
    } catch {
      // Nothing more to do: the page will show the last stored state.
    }
    return { ok: false, error: message };
  };

  try {
    if (!ACCOUNT_ID.test(account)) return fail('CF_ACCOUNT_ID is not a Cloudflare account id.');
    const body = buildGroupBody(await listPeople(db));
    if (body.include.length === 0) return fail('No people to put on the sign-in list.');
    const base = `${API}/accounts/${account}/access/groups`;
    let groupId = (await getSettings(db)).access_group_id || '';
    if (groupId && !GROUP_ID.test(groupId)) return fail('The stored Access group id is malformed.');

    const replacing = !!groupId;
    let created = false;
    let r = replacing ? await call(fetchImpl, token, 'PUT', `${base}/${groupId}`, body) : null;
    // No group yet, or someone deleted it in the dashboard: create it.
    if (!r || (!r.ok && r.status === 404)) {
      r = await call(fetchImpl, token, 'POST', base, body);
      if (r.ok) {
        groupId = String(r.result?.id ?? '');
        if (!GROUP_ID.test(groupId)) return fail('Cloudflare did not return a group id.');
        created = true;
      }
    }
    if (!r.ok) return fail(r.error);
    // The first group is added to the policy by the runbook; a replacement is
    // not, so it is flagged until the next good sync.
    const warning = created && replacing ? RECREATED : '';
    await setSettings(db, { access_group_id: groupId, access_sync_at: nowIso, access_sync_error: warning }, nowIso);
    return created ? { ok: true, created, people: body.include.length } : { ok: true, people: body.include.length };
  } catch (err) {
    return fail(`Could not reach Cloudflare: ${err?.message ?? err}`);
  }
}
