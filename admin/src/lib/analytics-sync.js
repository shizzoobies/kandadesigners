// ka-analytics-sync's work: Metricool's numbers into ka-attribution. Here,
// not in the Worker, so it is unit-testable; the Worker (analytics-sync/)
// only wires the cron and the service binding to these functions.
// Never log the token: it travels only in the X-Mc-Auth header and is
// scrubbed from every error.
import { localYmd, localHms, addDays } from './zone.js';

export const WINDOW_DAYS = 35;
export const DEFAULT_TZ = 'America/New_York';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const scrub = (text, token) => (token ? String(text).split(token).join('<token>') : String(text));

/** The array inside a Metricool reply: `{ data: [...] }` or a bare array. */
export function items(reply) {
  if (Array.isArray(reply)) return reply;
  if (reply && Array.isArray(reply.data)) return reply.data;
  return [];
}

/** GET one Metricool path. A 429 waits Retry-After (or 5 s) and retries once. */
export async function metricoolGet({ env, path, params = {}, blogId, fetchImpl = fetch, sleep = wait }) {
  const url = new URL(`${String(env.METRICOOL_BASE).replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`);
  url.searchParams.set('userId', String(env.METRICOOL_USER_ID));
  if (blogId !== undefined) url.searchParams.set('blogId', String(blogId));
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetchImpl(url, { headers: { 'X-Mc-Auth': env.METRICOOL_USER_TOKEN, Accept: 'application/json' } });
    if (res.status === 429 && attempt === 0) {
      const after = Number(res.headers.get('Retry-After'));
      await sleep(Number.isFinite(after) && after > 0 ? Math.min(after, 60) * 1000 : 5000);
      continue;
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`${path} returned ${res.status}: ${scrub(text.slice(0, 160), env.METRICOOL_USER_TOKEN)}`);
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`${path} did not return JSON`);
    }
  }
}

/** Numbers keep moving for weeks, so every run refetches the last 35 days. */
export function syncWindow(nowMs, timeZone) {
  const today = localYmd(nowMs, timeZone);
  return { from: `${addDays(today, -WINDOW_DAYS)}T00:00:00`, to: `${today}T${localHms(nowMs, timeZone)}`, today };
}

/** The scheduler list, a week per call. */
export function weekChunks(fromYmd, toYmd) {
  const out = [];
  for (let d = fromYmd; d <= toYmd; d = addDays(d, 7)) {
    const last = addDays(d, 6) < toYmd ? addDays(d, 6) : toYmd;
    out.push({ start: `${d}T00:00:00`, end: `${last}T23:59:59` });
  }
  return out;
}

/** sites_map follows ka-sites: every site with a brand id, nothing else. Returns the slugs kept. */
export async function refreshSitesMap(db, adb, nowIso) {
  const { results } = await db.prepare("SELECT slug, metricool_brand_id FROM sites WHERE metricool_brand_id IS NOT NULL AND metricool_brand_id != '' ORDER BY slug").all();
  const statements = results.map((s) => adb.prepare(
    `INSERT INTO sites_map (site_slug, metricool_brand_id, timezone, created_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(site_slug) DO UPDATE SET metricool_brand_id = excluded.metricool_brand_id`,
  ).bind(s.slug, s.metricool_brand_id, DEFAULT_TZ, nowIso));
  const keep = results.map((s) => s.slug);
  statements.push(keep.length
    ? adb.prepare(`DELETE FROM sites_map WHERE site_slug NOT IN (${keep.map(() => '?').join(', ')})`).bind(...keep)
    : adb.prepare('DELETE FROM sites_map'));
  await adb.batch(statements);
  return keep;
}
