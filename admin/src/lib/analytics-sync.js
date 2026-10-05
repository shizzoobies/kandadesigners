// ka-analytics-sync's work: Metricool's numbers into ka-attribution. Here,
// not in the Worker, so it is unit-testable; the Worker (analytics-sync/)
// only wires the cron and the service binding to these functions.
// Never log the token: it travels only in the X-Mc-Auth header and is
// scrubbed from every error.
import { localYmd, localHms, addDays } from './zone.js';
import { ENDPOINTS, METRIC_COLUMNS, mapItem, connectedNetworks, TIMELINES, timelineValues, accountRows, titleOf, publishedUtc } from './metricool-map.js';

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
    if (!res.ok) throw new Error(`${path} returned ${res.status}: ${scrub(text, env.METRICOOL_USER_TOKEN).slice(0, 160)}`);
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

const POST_UPSERT = `INSERT INTO posts (site_slug, network, native_id, type, url, published_at, title) VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(site_slug, network, native_id) DO UPDATE SET type = COALESCE(excluded.type, posts.type), url = COALESCE(excluded.url, posts.url),
  published_at = COALESCE(excluded.published_at, posts.published_at), title = COALESCE(excluded.title, posts.title)`;
const METRIC_REPLACE = `INSERT OR REPLACE INTO post_metrics (site_slug, network, native_id, as_of, ${METRIC_COLUMNS.join(', ')})
  VALUES (?, ?, ?, ?, ${METRIC_COLUMNS.map(() => '?').join(', ')})`;
const ACCOUNT_UPSERT = `INSERT INTO account_daily (site_slug, network, day, followers, followers_delta, reach, impressions, views, interactions)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(site_slug, network, day) DO UPDATE SET
  followers = COALESCE(excluded.followers, account_daily.followers),
  followers_delta = COALESCE(excluded.followers_delta, account_daily.followers_delta),
  reach = COALESCE(excluded.reach, account_daily.reach),
  impressions = COALESCE(excluded.impressions, account_daily.impressions),
  views = COALESCE(excluded.views, account_daily.views),
  interactions = COALESCE(excluded.interactions, account_daily.interactions)`;
const CAMPAIGN_JOIN = `UPDATE posts SET campaign_id = (SELECT pub.campaign_id FROM publications pub
  WHERE pub.site_slug = posts.site_slug AND pub.network = posts.network AND pub.metricool_id = posts.metricool_id)
  WHERE site_slug = ?`;

export function sameUrl(a, b) {
  const norm = (u) => {
    try {
      const x = new URL(String(u));
      return `${x.hostname.replace(/^www\./, '')}${x.pathname.replace(/\/+$/, '')}${x.search}`;
    } catch {
      return null;
    }
  };
  const na = norm(a);
  return na !== null && na === norm(b);
}

// The scheduler's provider id is the native id for YouTube, LinkedIn and
// Facebook reels, the second half of pageId_postId for a Facebook post, and
// the permalink for Instagram (2026-10-05).
export function matchesProvider(post, provider) {
  if (post.network !== provider.network) return false;
  const id = String(provider.id ?? '');
  if (id && (post.native_id === id || post.native_id.endsWith(`_${id}`))) return true;
  return Boolean(post.url) && (sameUrl(post.url, id) || sameUrl(post.url, provider.publicUrl));
}

const FALLBACK_WINDOW_MS = 6 * 3600 * 1000;
const rowKey = (p) => `${p.network}\u0000${p.native_id}`;

// Facebook photo and album posts come back from the scheduler with another
// object id and URL than posts/facebook (2026-10-05). When the id and URL pass
// finds nothing for a published provider, take the one still-unlinked post on
// the same network with the same first line, published within six hours.
function fallbackMatch(posts, taken, item, provider) {
  const title = titleOf({ text: item.text });
  const at = Date.parse(publishedUtc(item.publicationDate) ?? '');
  if (title === null || !Number.isFinite(at)) return null;
  const found = posts.filter((p) => !taken.has(rowKey(p)) && !p.metricool_id && p.network === provider.network && p.title === title
    && Math.abs(Date.parse(p.published_at ?? '') - at) <= FALLBACK_WINDOW_MS);
  return found.length === 1 ? found[0] : null;
}

async function linkMetricoolIds({ adb, site, get, from, to }) {
  const { results: posts } = await adb.prepare('SELECT network, native_id, url, title, published_at, metricool_id FROM posts WHERE site_slug = ?').bind(site.site_slug).all();
  const updates = [];
  const taken = new Set();
  const unmatched = new Map();
  const link = (item, p) => updates.push(adb.prepare('UPDATE posts SET metricool_id = ? WHERE site_slug = ? AND network = ? AND native_id = ?')
    .bind(String(item.id), site.site_slug, p.network, p.native_id));
  for (const chunk of weekChunks(from.slice(0, 10), to.slice(0, 10))) {
    const listed = items(await get('v2/scheduler/posts', { ...chunk, timezone: site.timezone }, site.metricool_brand_id));
    for (const item of listed) {
      for (const provider of Array.isArray(item.providers) ? item.providers : []) {
        if (provider.status !== 'PUBLISHED') continue;
        const hits = posts.filter((x) => matchesProvider(x, provider));
        for (const p of hits) {
          taken.add(rowKey(p));
          link(item, p);
        }
        if (!hits.length) unmatched.set(`${item.id}\u0000${provider.network}`, { item, provider });
      }
    }
  }
  for (const { item, provider } of unmatched.values()) {
    const p = fallbackMatch(posts, taken, item, provider);
    if (!p) continue;
    taken.add(rowKey(p));
    link(item, p);
  }
  updates.push(adb.prepare(CAMPAIGN_JOIN).bind(site.site_slug));
  await adb.batch(updates);
}

/**
 * One site, serial, one network at a time: posts and today's snapshot per
 * endpoint, Metricool ids and campaigns from the scheduler, then account days.
 * A failing endpoint is recorded under its network and the rest carry on; a
 * timeline Metricool refuses is only logged. One sync_runs row per call.
 */
export async function syncSite({ adb, site, env, nowMs = Date.now(), fetchImpl = fetch, sleep = wait, trigger = 'cron', log = console, clock = Date.now }) {
  const started = await adb.prepare('INSERT INTO sync_runs (site_slug, started_at, trigger) VALUES (?, ?, ?)')
    .bind(site.site_slug, new Date(nowMs).toISOString(), trigger).run();
  const errors = {};
  const note = (key, err) => {
    const message = scrub(String(err?.message ?? err), env.METRICOOL_USER_TOKEN).slice(0, 300);
    errors[key] = errors[key] ? `${errors[key]}; ${message}` : message;
  };
  const get = (path, params, blogId) => metricoolGet({ env, path, params, blogId, fetchImpl, sleep });
  let postsSeen = 0;

  try {
    if (!env.METRICOOL_USER_TOKEN) throw new Error('METRICOOL_USER_TOKEN is not set');
    const profile = items(await get('admin/simpleProfiles', {})).find((p) => String(p.id) === String(site.metricool_brand_id));
    if (!profile) throw new Error('brand not found');
    const networks = connectedNetworks(profile);
    await adb.prepare('UPDATE sites_map SET networks = ? WHERE site_slug = ?').bind(networks.join(','), site.site_slug).run();
    const { from, to, today } = syncWindow(nowMs, site.timezone);
    const window = { from, to, timezone: site.timezone };

    for (const ep of ENDPOINTS.filter((e) => networks.includes(e.network))) {
      try {
        const mapped = items(await get(`v2/analytics/${ep.path}`, window, site.metricool_brand_id))
          .map((x) => mapItem(ep.path, x)).filter(Boolean);
        if (mapped.length) {
          await adb.batch(mapped.flatMap(({ post, metrics }) => [
            adb.prepare(POST_UPSERT).bind(site.site_slug, post.network, post.native_id, post.type, post.url, post.published_at, post.title),
            adb.prepare(METRIC_REPLACE).bind(site.site_slug, post.network, post.native_id, today, ...METRIC_COLUMNS.map((c) => metrics[c])),
          ]));
        }
        postsSeen += mapped.length;
      } catch (err) {
        note(ep.network, `${ep.path}: ${err.message}`);
      }
    }

    try {
      await linkMetricoolIds({ adb, site, get, from, to });
    } catch (err) {
      note('scheduler', err);
    }

    for (const network of networks.filter((n) => TIMELINES[n])) {
      const series = {};
      for (const t of TIMELINES[network]) {
        try {
          series[t.column] = timelineValues(await get('v2/analytics/timelines', { network, metric: t.metric, subject: t.subject, ...window }, site.metricool_brand_id));
        } catch (err) {
          log.warn(`analytics-sync ${site.site_slug} ${network} ${t.metric}: ${scrub(err.message, env.METRICOOL_USER_TOKEN)}`);
        }
      }
      const rows = accountRows(series);
      if (rows.length) {
        try {
          await adb.batch(rows.map((r) => adb.prepare(ACCOUNT_UPSERT)
            .bind(site.site_slug, network, r.day, r.followers, r.followers_delta, r.reach, r.impressions, r.views, r.interactions)));
        } catch (err) {
          note(network, `account days: ${err.message}`);
        }
      }
    }
  } catch (err) {
    note('site', err);
  }

  const ok = Object.keys(errors).length === 0;
  await adb.prepare('UPDATE sync_runs SET finished_at = ?, ok = ?, posts_seen = ?, metrics_written = ?, errors = ? WHERE id = ?')
    .bind(new Date(clock()).toISOString(), ok ? 1 : 0, postsSeen, postsSeen, ok ? null : JSON.stringify(errors), started.meta.last_row_id).run();
  return { ok, postsSeen, errors };
}

export const OPEN_RUN_MS = 5 * 60000;

/** A run that started under five minutes ago and has not finished. "Sync now" waits for it. */
export async function openRun(adb, slug, nowMs) {
  const since = new Date(nowMs - OPEN_RUN_MS).toISOString();
  const row = await adb.prepare('SELECT id FROM sync_runs WHERE site_slug = ? AND finished_at IS NULL AND started_at > ? LIMIT 1').bind(slug, since).first();
  return Boolean(row);
}

/** The site whose last cron sync is not from today (its own timezone), oldest first. */
export async function nextDueSite(adb, nowMs) {
  const { results } = await adb.prepare(`SELECT m.site_slug, m.metricool_brand_id, m.timezone,
      (SELECT MAX(r.started_at) FROM sync_runs r WHERE r.site_slug = m.site_slug AND r.trigger = 'cron') AS last_cron
    FROM sites_map m ORDER BY m.site_slug`).all();
  const due = results.filter((s) => !s.last_cron || localYmd(Date.parse(s.last_cron), s.timezone) !== localYmd(nowMs, s.timezone));
  due.sort((a, b) => {
    const x = a.last_cron ?? '';
    const y = b.last_cron ?? '';
    return x < y ? -1 : x > y ? 1 : 0;
  });
  return due[0] ?? null;
}

/** One cron run: refresh the map, then sync the one site that is due, if any. */
export async function runNightly({ env, nowMs = Date.now(), fetchImpl = fetch, sleep, log = console }) {
  await refreshSitesMap(env.DB, env.ATTRIBUTION_DB, new Date(nowMs).toISOString());
  const site = await nextDueSite(env.ATTRIBUTION_DB, nowMs);
  if (!site) return { site: null };
  const r = await syncSite({ adb: env.ATTRIBUTION_DB, site, env, nowMs, fetchImpl, sleep, trigger: 'cron', log });
  return { site: site.site_slug, ...r };
}

/** "Sync now" for one site, through the service binding. */
export async function runManual({ env, slug, nowMs = Date.now(), fetchImpl = fetch, sleep, log = console }) {
  await refreshSitesMap(env.DB, env.ATTRIBUTION_DB, new Date(nowMs).toISOString());
  const site = await env.ATTRIBUTION_DB.prepare('SELECT site_slug, metricool_brand_id, timezone FROM sites_map WHERE site_slug = ?').bind(slug).first();
  if (!site) return { status: 404, error: 'No Metricool brand set for this site.' };
  if (await openRun(env.ATTRIBUTION_DB, slug, nowMs)) return { status: 409, error: 'A sync is already running. Try again in a few minutes.' };
  const r = await syncSite({ adb: env.ATTRIBUTION_DB, site, env, nowMs, fetchImpl, sleep, trigger: 'manual', log });
  return { status: 200, ...r };
}
