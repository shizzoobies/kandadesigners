// "Sync now" on the analytics page: a form POST, then a 303 back with a
// message. The sync runs in ka-analytics-sync, reached through the
// ANALYTICS_SYNC service binding, so the Metricool token lives in that Worker
// only. Owner-only: lib/gate.js matches no client route here.
import { getSiteBySlug } from '../../../../lib/db.js';
import { openRun } from '../../../../lib/analytics-sync.js';

// kind comes before msg in the query string: 'ok' renders as a notice, 'warn' as an alert.
const back = (slug, msg, kind = 'warn') => ({ status: 303, location: `/sites/${slug}/analytics?kind=${kind}&msg=${encodeURIComponent(msg)}` });

export async function handleSync({ db, adb, sync, slug, nowMs = Date.now() }) {
  const site = await getSiteBySlug(db, slug);
  if (!site) return { status: 404 };
  if (!site.metricool_brand_id) return back(slug, 'No Metricool brand set for this site.');
  if (!adb || !sync) return back(slug, 'Analytics is not connected yet.');
  if (await openRun(adb, slug, nowMs)) return back(slug, 'A sync is already running. Try again in a few minutes.');
  let res;
  try {
    res = await sync.fetch(`https://ka-analytics-sync/sync?site=${encodeURIComponent(slug)}`, { method: 'POST' });
  } catch {
    return back(slug, 'The sync could not be started.');
  }
  let body = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }
  if (!res.ok) return back(slug, body.error ?? `The sync failed (${res.status}).`);
  return body.ok ? back(slug, 'Synced.', 'ok') : back(slug, 'Synced, with errors. See the lines below.');
}

export async function POST({ params, locals }) {
  const env = locals.runtime.env;
  const r = await handleSync({ db: env.DB, adb: env.ATTRIBUTION_DB, sync: env.ANALYTICS_SYNC, slug: params.slug });
  if (r.status === 404) return new Response('Not found', { status: 404 });
  return new Response(null, { status: r.status, headers: { Location: r.location } });
}
