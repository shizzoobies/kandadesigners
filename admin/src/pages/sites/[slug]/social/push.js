// Subscribe / unsubscribe / test for Post Desk push. Gated with gateRequest
// (middleware) and canWriteDesk (readWrite). JSON only, same-origin.
import { getSiteBySlug } from '../../../../lib/db.js';
import * as q from '../../../../lib/db.js';
import * as desk from '../../../../lib/desk.js';
import { gateRequest } from '../../../../lib/gate.js';
import { validatePushSubscription, validatePushPrefs } from '../../../../lib/desk-push.js';
import { sendPush } from '../../../../lib/web-push.js';

const LABEL_MAX = 80;

const prefsOf = (row) => ({
  quiet_start: row?.quiet_start ?? null,
  quiet_end: row?.quiet_end ?? null,
  stories_at: row?.stories_at ?? null,
});

export async function handlePush({ db, env, slug, user, request, nowMs = Date.now() }) {
  const pathname = new URL(request.url).pathname;
  const gate = gateRequest(user, pathname);
  if (!gate.allow) return { status: gate.status || 403, body: { error: 'Not authorized.' } };

  const site = await getSiteBySlug(db, slug);
  if (!site) return { status: 404, body: { error: 'Not found' } };

  const w = await desk.readWrite({ request, user, siteId: site.id });
  if (!w.ok) return w;

  const action = w.body.action;
  const development = env?.ENVIRONMENT === 'development';
  const nowIso = new Date(nowMs).toISOString();

  if (action === 'subscribe') {
    const v = validatePushSubscription(w.body.subscription, { development });
    if (!v.ok) return { status: 400, body: { error: v.error } };
    let label = w.body.label;
    if (label !== undefined && label !== null) {
      if (typeof label !== 'string') return { status: 400, body: { error: 'Label must be text.' } };
      label = label.trim().slice(0, LABEL_MAX);
    } else {
      label = null;
    }
    await q.upsertPushSub(db, {
      siteId: site.id, personId: user.id, endpoint: v.endpoint, p256dh: v.p256dh, auth: v.auth, label,
    }, nowIso);
    const saved = await q.getPushSubByEndpoint(db, v.endpoint);
    return { status: 200, body: { ok: true, endpoint: v.endpoint, prefs: prefsOf(saved) } };
  }

  if (action === 'unsubscribe') {
    const endpoint = w.body.endpoint;
    if (typeof endpoint !== 'string' || !endpoint) return { status: 400, body: { error: 'Missing endpoint.' } };
    const row = await q.getPushSubByEndpoint(db, endpoint);
    if (row && row.person_id === user.id && row.site_id === site.id) {
      await q.deletePushSub(db, endpoint);
    }
    return { status: 200, body: { ok: true } };
  }

  if (action === 'test') {
    const endpoint = w.body.endpoint;
    if (typeof endpoint !== 'string' || !endpoint) return { status: 400, body: { error: 'Missing endpoint.' } };
    const row = await q.getPushSubByEndpoint(db, endpoint);
    if (!row || row.person_id !== user.id || row.site_id !== site.id) {
      return { status: 404, body: { error: 'No subscription for that endpoint on this desk.' } };
    }
    const payload = {
      title: 'Test from Post Desk',
      body: 'Notifications are working on this device.',
      url: `/sites/${site.slug}/social`,
      tag: `desk-${site.slug}-test`,
    };
    const r = await sendPush(row, payload, { env, now: nowMs });
    if (r.delete) await q.deletePushSub(db, endpoint);
    else if (r.status === 201 || r.status === 200) await q.touchPushSubOk(db, endpoint, nowIso);
    return { status: 200, body: { ok: true, status: r.status, mock: !!r.mock } };
  }

  if (action === 'prefs') {
    // Quiet hours and the Stories reminder for this device only.
    const endpoint = w.body.endpoint;
    if (typeof endpoint !== 'string' || !endpoint) return { status: 400, body: { error: 'Missing endpoint.' } };
    const v = validatePushPrefs(w.body);
    if (!v.ok) return { status: 400, body: { error: v.error } };
    const row = await q.getPushSubByEndpoint(db, endpoint);
    if (!row || row.person_id !== user.id || row.site_id !== site.id) {
      return { status: 404, body: { error: 'No subscription for that endpoint on this desk.' } };
    }
    await q.setPushPrefs(db, endpoint, v.prefs);
    return { status: 200, body: { ok: true, prefs: prefsOf(await q.getPushSubByEndpoint(db, endpoint)) } };
  }

  return { status: 400, body: { error: 'Unknown action.' } };
}

export async function POST({ params, request, locals }) {
  const env = locals.runtime.env;
  const r = await handlePush({
    db: env.DB, env, slug: params.slug, user: locals.user, request,
  });
  return desk.jsonResponse(r.status, r.body);
}
