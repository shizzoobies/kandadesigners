// Post Desk push: who gets notified, what the message says, announce-once
// bookkeeping, subscription validation, and the cron runner. Pure helpers
// (pushPlan, pushMessage, validatePushSubscription) are shared with tests;
// runDeskPush is the scheduled entry. Browser UI helpers live in desk-push-ui.js.

import * as q from './db.js';
import { canWriteDesk } from './gate.js';
import { sendPush, mockTransport } from './web-push.js';
import { waitingCount } from './desk-pwa.js';

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
// badge is the site's waiting count (waitingCount), for the home-screen icon.
export function pushMessage(site, newItems, { badge } = {}) {
  const slug = site?.slug;
  if (!slug || !newItems?.length) throw new Error('pushMessage needs a site and at least one item');
  const first = newItems[0];
  const url = `/sites/${slug}/social?item=${encodeURIComponent(first.item_id)}`;
  const tag = `desk-${slug}`;
  const n = Number.isInteger(badge) && badge >= 0 ? badge : newItems.length;
  if (newItems.length === 1) {
    return {
      title: 'Waiting on you',
      body: first.title || 'A post is waiting',
      url,
      tag,
      badge: n,
    };
  }
  return {
    title: `${newItems.length} new posts waiting on you`,
    body: `${newItems.length} new posts waiting on you`,
    url,
    tag,
    badge: n,
  };
}


// The badge for a site from listWaitingApprove rows, through the same rule
// the page uses (rows are already undecided approve-list items).
export function badgeFor(waitingRows) {
  return waitingCount((waitingRows || []).map((w) => ({ ...w, list: 'approve' })), () => 'waiting');
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

// --- Quiet hours, morning summary, Stories reminder (slice 6) -------------

const NY = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

// The clock in Gainesville for an instant: { date: 'YYYY-MM-DD', minutes }.
// Intl does the DST math, so both 2026 change days come out right.
export function easternNow(now) {
  const p = Object.fromEntries(NY.formatToParts(new Date(now)).map((x) => [x.type, x.value]));
  const hour = Number(p.hour) % 24;
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: hour * 60 + Number(p.minute) };
}

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
export function isPrefTime(v) {
  return v === null || (typeof v === 'string' && HHMM.test(v));
}
const mins = (v) => (typeof v === 'string' && HHMM.test(v) ? Number(v.slice(0, 2)) * 60 + Number(v.slice(3)) : null);

// Is this device in quiet hours at `now`? [start, end) in Eastern time; a
// start after the end crosses midnight. Nulls or equal times: never quiet.
export function inQuiet(sub, now) {
  const s = mins(sub?.quiet_start), e = mins(sub?.quiet_end);
  if (s === null || e === null || s === e) return false;
  const m = easternNow(now).minutes;
  return s < e ? m >= s && m < e : m >= s || m < e;
}

// Validates a { quiet_start, quiet_end, stories_at } body. Quiet hours are
// both set or both null.
export function validatePushPrefs(body) {
  const out = {};
  for (const k of ['quiet_start', 'quiet_end', 'stories_at']) {
    const v = body?.[k] === undefined ? null : body[k];
    if (!isPrefTime(v)) return { ok: false, error: `${k} must be HH:MM or null.` };
    out[k] = v;
  }
  if ((out.quiet_start === null) !== (out.quiet_end === null)) {
    return { ok: false, error: 'Quiet hours need both a start and an end.' };
  }
  return { ok: true, prefs: out };
}

// "N waiting on you", opening the first waiting item. Null when nothing waits.
export function morningSummary(site, waitingRows) {
  const n = badgeFor(waitingRows);
  if (!site?.slug || n <= 0) return null;
  const first = waitingRows[0];
  return {
    title: `${n} waiting on you`,
    body: first.title || 'A post is waiting',
    url: `/sites/${site.slug}/social?item=${encodeURIComponent(first.item_id)}`,
    tag: `desk-${site.slug}`,
    badge: n,
  };
}

export function storiesReminder(site, { badge = 0 } = {}) {
  return {
    title: "Today's Story isn't posted yet",
    body: 'Open the Stories checklist to post it.',
    url: `/sites/${site.slug}/social?view=stories`,
    tag: `desk-${site.slug}-stories`,
    badge,
  };
}

// Send the Stories reminder on this run? story is today's checklist row
// ({ posted }) or null; paused is desk_meta.stories_paused.
export function storiesDue(sub, now, { story, paused }) {
  const at = mins(sub?.stories_at);
  if (at === null || paused || !story || story.posted) return false;
  const et = easternNow(now);
  if (sub.stories_sent_on === et.date) return false;
  if (et.minutes < at) return false;
  return !inQuiet(sub, now);
}

// The cron's clock. DESK_PUSH_NOW (ISO) is a local-only override, honored
// only when ENVIRONMENT=development.
export function pushNow(env, fallback) {
  if (env?.ENVIRONMENT === 'development' && env.DESK_PUSH_NOW) {
    const t = Date.parse(env.DESK_PUSH_NOW);
    if (Number.isFinite(t)) return t;
  }
  return fallback;
}

// Both VAPID keys set, or local development (mock transport).
export function keysReady(env) {
  if (env?.ENVIRONMENT === 'development') return true;
  return !!(env?.VAPID_PRIVATE_KEY && env?.VAPID_PUBLIC_KEY);
}

const ok2xx = (r) => r.status === 201 || r.status === 200;

/**
 * Cron body. transport is injectable (tests / mock). Without both VAPID keys
 * it uses the mock transport in development only; elsewhere it skips the run.
 */
export async function runDeskPush(env, { now = Date.now(), transport } = {}) {
  // Fail safe: production without both VAPID keys sends nothing, marks
  // nothing, and says so in one line. Local development uses the mock.
  if (!keysReady(env)) {
    console.log(JSON.stringify({ event: 'desk.push', skipped: 'no-vapid-keys' }));
    return { skipped: 'no-vapid-keys', sites: 0, announced: 0, sent: 0, forgot: 0, held: 0, summaries: 0, stories: 0 };
  }
  const db = env.DB;
  now = pushNow(env, now);
  const nowIso = new Date(now).toISOString();
  const today = easternNow(now).date;
  const sites = await q.listSites(db);
  const summary = { sites: 0, announced: 0, sent: 0, forgot: 0, held: 0, summaries: 0, stories: 0 };

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

    const subs = await q.listPushSubs(db, site.id);
    if (!subs.length && !announce.length) continue;
    const badge = badgeFor(waiting);
    const newItems = announce.map((id) => waiting.find((w) => w.item_id === id)).filter(Boolean);
    const payload = announce.length ? pushMessage(site, newItems, { badge }) : null;
    const morning = morningSummary(site, waiting);
    const needStories = subs.some((s) => s.stories_at);
    const story = needStories ? await q.getStoryForDay(db, site.id, today) : null;
    const paused = needStories ? await q.getStoriesPaused(db, site.id) : false;
    if (announce.length) {
      summary.sites += 1;
      summary.announced += announce.length;
    }

    let anyOk = false;
    let attempted = 0;
    let held = 0;
    for (const sub of subs) {
      if (!(await personCanWrite(db, sub.person_id, site.id))) {
        await q.deletePushSub(db, sub.endpoint);
        continue;
      }
      const quiet = inQuiet(sub, now);
      let gone = false;
      const send = async (body) => {
        const r = await sendPush(sub, body, { env, now, transport });
        if (r.delete) { await q.deletePushSub(db, sub.endpoint); gone = true; return false; }
        if (ok2xx(r)) { await q.touchPushSubOk(db, sub.endpoint, nowIso); summary.sent += 1; return true; }
        if (!(r.status === 429 || (r.status >= 500 && r.status <= 599))) await q.bumpPushSubFail(db, sub.endpoint);
        return false;
      };

      if (sub.held_since && !quiet) {
        // Morning summary: one push for everything held overnight, which also
        // covers anything new this run. Nothing waiting: clear it silently.
        if (morning) {
          attempted += 1;
          if (await send(morning)) {
            anyOk = true;
            summary.summaries += 1;
            await q.setPushHeld(db, sub.endpoint, null);
          }
        } else {
          await q.setPushHeld(db, sub.endpoint, null);
        }
      } else if (payload) {
        if (quiet) {
          held += 1;
          summary.held += 1;
          if (!sub.held_since) await q.setPushHeld(db, sub.endpoint, nowIso);
        } else {
          attempted += 1;
          if (await send(payload)) anyOk = true;
        }
      }

      if (!gone && storiesDue(sub, now, { story, paused })) {
        if (await send(storiesReminder(site, { badge }))) {
          summary.stories += 1;
          await q.setPushStoriesSent(db, sub.endpoint, today);
        }
      }
    }

    // Mark sent only if at least one device got a 2xx. If every send hit 429
    // or 5xx, leave unsent so the next run retries. Quiet holds are not
    // failures, but an item every device held stays unsent (the morning
    // summary covers it). With nobody left to attempt or hold, mark so we do
    // not re-announce forever.
    if (announce.length && (anyOk || (attempted === 0 && held === 0))) {
      await q.markPushSent(db, site.id, announce, nowIso);
    }
  }

  return summary;
}
