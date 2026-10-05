// Post Desk push: who gets notified, what the message says, announce-once
// bookkeeping, subscription validation, and the cron runner. Pure helpers
// (pushPlan, pushMessage, validatePushSubscription) are shared with tests;
// runDeskPush is the scheduled entry. Browser UI helpers live in desk-push-ui.js.

import * as q from './db.js';
import { canWriteDesk } from './gate.js';
import { sendPush, mockTransport } from './web-push.js';

const ALLOWED_HOSTS = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
];
const ALLOWED_SUFFIXES = [
  '.push.apple.com',
  '.notify.windows.com',
];
// Local fixture only: allowed when ENVIRONMENT=development.
export const MOCK_PUSH_HOST = 'push.mock.local';

function hostAllowed(hostname, { development = false } = {}) {
  const h = String(hostname || '').toLowerCase();
  if (ALLOWED_HOSTS.includes(h)) return true;
  if (ALLOWED_SUFFIXES.some((s) => h.endsWith(s))) return true;
  if (development && h === MOCK_PUSH_HOST) return true;
  return false;
}

function isB64urlLen(s, bytes) {
  if (typeof s !== 'string' || !/^[A-Za-z0-9_-]+$/.test(s)) return false;
  try {
    const pad = '='.repeat((4 - (s.length % 4)) % 4);
    const b = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return b.length === bytes;
  } catch {
    return false;
  }
}

// Subscription shape from PushManager. development unlocks the mock host.
export function validatePushSubscription(sub, { development = false } = {}) {
  if (!sub || typeof sub !== 'object') return { ok: false, error: 'Missing subscription.' };
  const endpoint = sub.endpoint;
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://')) {
    return { ok: false, error: 'Push endpoint must be https.' };
  }
  let url;
  try { url = new URL(endpoint); } catch { return { ok: false, error: 'Push endpoint is not a valid URL.' }; }
  if (!hostAllowed(url.hostname, { development })) {
    return { ok: false, error: 'That push service is not allowed.' };
  }
  const keys = sub.keys || {};
  if (!isB64urlLen(keys.p256dh, 65)) return { ok: false, error: 'p256dh key is the wrong length.' };
  if (!isB64urlLen(keys.auth, 16)) return { ok: false, error: 'auth key is the wrong length.' };
  return { ok: true, endpoint, p256dh: keys.p256dh, auth: keys.auth };
}

// Pure announce-once plan. waitingIds / sentIds are item id strings.
export function pushPlan(waitingIds, sentIds) {
  const waiting = new Set(waitingIds);
  const sent = new Set(sentIds);
  const announce = [];
  for (const id of waitingIds) if (!sent.has(id)) announce.push(id);
  const forget = [];
  for (const id of sent) if (!waiting.has(id)) forget.push(id);
  return { announce, forget };
}

// One notification per site per run. newItems are { item_id, title } in rail order.
export function pushMessage(site, newItems) {
  const slug = site?.slug;
  if (!slug || !newItems?.length) throw new Error('pushMessage needs a site and at least one item');
  const first = newItems[0];
  const url = `/sites/${slug}/social?item=${encodeURIComponent(first.item_id)}`;
  const tag = `desk-${slug}`;
  if (newItems.length === 1) {
    return {
      title: 'Waiting on you',
      body: first.title || 'A post is waiting',
      url,
      tag,
    };
  }
  return {
    title: `${newItems.length} new posts waiting on you`,
    body: `${newItems.length} new posts waiting on you`,
    url,
    tag,
  };
}


// Waiting approve-list items (no native). Stories list is excluded by list='approve'.
export async function listWaitingApprove(db, siteId) {
  const { results } = await db.prepare(
    `SELECT i.item_id, i.title, i.kind FROM desk_items i
     LEFT JOIN desk_decisions d ON d.site_id = i.site_id AND d.item_id = i.item_id
     WHERE i.site_id = ? AND i.list = 'approve' AND i.kind != 'native'
       AND (d.decision IS NULL OR d.decision = 'waiting')
     ORDER BY i.rowid`,
  ).bind(siteId).all();
  return results ?? [];
}

async function personCanWrite(db, personId, siteId) {
  const person = await q.getPersonById(db, personId);
  if (!person) return false;
  if (person.role === 'owner') return true;
  if (person.role !== 'client') return false;
  const grants = await q.listGrantsForPerson(db, personId);
  return canWriteDesk({ ...person, grants }, siteId);
}

/**
 * Cron body. transport is injectable (tests / mock). When VAPID_PRIVATE_KEY is
 * unset, sendPush uses the mock transport automatically.
 */
export async function runDeskPush(env, { now = Date.now(), transport } = {}) {
  const db = env.DB;
  const nowIso = new Date(now).toISOString();
  const sites = await q.listSites(db);
  const summary = { sites: 0, announced: 0, sent: 0, forgot: 0 };

  for (const site of sites) {
    const waiting = await listWaitingApprove(db, site.id);
    const waitingIds = waiting.map((w) => w.item_id);
    const sentRows = await q.listPushSent(db, site.id);
    const sentIds = sentRows.map((r) => r.item_id);
    const { announce, forget } = pushPlan(waitingIds, sentIds);

    if (forget.length) {
      await q.deletePushSent(db, site.id, forget);
      summary.forgot += forget.length;
    }
    if (!announce.length) continue;

    summary.sites += 1;
    summary.announced += announce.length;
    const newItems = announce.map((id) => waiting.find((w) => w.item_id === id)).filter(Boolean);
    const payload = pushMessage(site, newItems);
    const subs = await q.listPushSubs(db, site.id);

    let anyOk = false;
    let attempted = 0;
    for (const sub of subs) {
      if (!(await personCanWrite(db, sub.person_id, site.id))) {
        await q.deletePushSub(db, sub.endpoint);
        continue;
      }
      attempted += 1;
      const r = await sendPush(sub, payload, { env, now, transport });
      if (r.delete) {
        await q.deletePushSub(db, sub.endpoint);
        continue;
      }
      if (r.status === 201 || r.status === 200) {
        await q.touchPushSubOk(db, sub.endpoint, nowIso);
        summary.sent += 1;
        anyOk = true;
      } else if (r.status === 429 || (r.status >= 500 && r.status <= 599)) {
        // leave for next run — do not mark sent below if nothing got 2xx
      } else {
        await q.bumpPushSubFail(db, sub.endpoint);
      }
    }

    // Mark sent only if at least one device got a 2xx. If every send for this
    // site hit 429 or 5xx (anyOk stays false), leave unsent so the next run
    // retries. With nobody left to attempt (attempted === 0), mark so we do
    // not re-announce forever.
    if (anyOk || attempted === 0) {
      await q.markPushSent(db, site.id, announce, nowIso);
    }
  }

  return summary;
}
