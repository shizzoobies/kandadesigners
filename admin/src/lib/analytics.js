// Read-only queries and shaping for /sites/[slug]/analytics. ATTRIBUTION_DB
// only; every number is Metricool's. The binding comes first, as in db.js, so
// tests run this against SQLite with the ka-attribution migrations.
import { addDays, zonedToUtcIso, slotOf } from './zone.js';

export const RANGES = [7, 28, 90];
export const NETWORK_LABEL = { facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn', youtube: 'YouTube' };
export const SORTABLE = ['reach', 'views', 'interactions', 'clicks', 'engagement'];

export const pickRange = (raw) => (RANGES.includes(Number(raw)) ? Number(raw) : 28);

export async function getSiteMap(adb, slug) {
  return adb.prepare('SELECT site_slug, metricool_brand_id, timezone, networks FROM sites_map WHERE site_slug = ?').bind(slug).first();
}

export const networksOf = (map) => (map?.networks ? map.networks.split(',').filter((n) => n in NETWORK_LABEL) : []);

export async function latestAsOf(adb, slug) {
  return adb.prepare('SELECT MAX(as_of) AS d FROM post_metrics WHERE site_slug = ?').bind(slug).first('d');
}

export function rangeBounds(endYmd, days) {
  return { start: addDays(endYmd, -(days - 1)), end: endYmd };
}

const POSTS_IN_RANGE = `SELECT p.network, p.native_id, p.url, p.published_at, p.title, p.type, p.campaign_id,
    pub.kind, pub.pillar,
    m.as_of, m.reach, m.impressions, m.views, m.interactions, m.clicks, m.engagement
  FROM posts p
  JOIN post_metrics m ON m.site_slug = p.site_slug AND m.network = p.network AND m.native_id = p.native_id
    AND m.as_of = (SELECT MAX(x.as_of) FROM post_metrics x WHERE x.site_slug = p.site_slug AND x.network = p.network AND x.native_id = p.native_id)
  LEFT JOIN publications pub ON pub.site_slug = p.site_slug AND pub.campaign_id = p.campaign_id AND pub.network = p.network
  WHERE p.site_slug = ? AND p.published_at >= ? AND p.published_at < ?
  ORDER BY p.published_at DESC, p.network, p.native_id`;

/** Every post published in the range (site-local days), with its latest snapshot. */
export async function postRows(adb, slug, { start, end }, timeZone) {
  const from = zonedToUtcIso(`${start}T00:00:00`, timeZone);
  const to = zonedToUtcIso(`${addDays(end, 1)}T00:00:00`, timeZone);
  const { results } = await adb.prepare(POSTS_IN_RANGE).bind(slug, from, to).all();
  return results.map((r) => ({
    ...r,
    kind: r.campaign_id ? r.kind ?? 'native' : 'native',
    pillar: r.campaign_id ? r.pillar ?? 'native' : 'native',
    slot: slotOf(r.published_at, timeZone),
  }));
}

/** Sort by one numeric column; missing values always last. Any other key leaves the rows alone. */
export function sortRows(rows, key, dir = 'desc') {
  if (!SORTABLE.includes(key)) return rows;
  const sign = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = a[key];
    const y = b[key];
    if (x == null && y == null) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    return (x - y) * sign;
  });
}

/** Average of each metric per group, over the values present, with the post count. */
export function groupAverages(rows, keyFn, metrics = ['reach', 'interactions']) {
  const groups = new Map();
  for (const r of rows) {
    const key = keyFn(r);
    if (key == null) continue;
    const g = groups.get(key) ?? { key, count: 0, sums: {}, ns: {} };
    g.count += 1;
    for (const m of metrics) {
      if (r[m] == null) continue;
      g.sums[m] = (g.sums[m] ?? 0) + r[m];
      g.ns[m] = (g.ns[m] ?? 0) + 1;
    }
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({ key: g.key, count: g.count, ...Object.fromEntries(metrics.map((m) => [m, g.ns[m] ? Math.round((g.sums[m] / g.ns[m]) * 10) / 10 : null])) }))
    .sort((x, y) => y.count - x.count || String(x.key).localeCompare(String(y.key)));
}

export function panels(rows) {
  return {
    kind: groupAverages(rows, (r) => r.kind),
    slot: groupAverages(rows, (r) => r.slot?.label ?? null),
    pillar: groupAverages(rows, (r) => r.pillar),
  };
}

const sumOf = (list, col) => {
  const values = list.map((x) => x[col]).filter((x) => x != null);
  return values.length ? values.reduce((p, q) => p + q, 0) : null;
};

/**
 * One card per connected network. Followers and their change come from
 * account_daily. Reach and interactions come from account_daily, or from the
 * posts when Metricool has no account series. Clicks come from the posts.
 */
export async function networkCards(adb, slug, networks, { start, end }, rows) {
  const { results } = await adb.prepare('SELECT network, day, followers, reach, interactions FROM account_daily WHERE site_slug = ? AND day BETWEEN ? AND ? ORDER BY day')
    .bind(slug, start, end).all();
  return networks.map((network) => {
    const days = results.filter((d) => d.network === network);
    const counted = days.filter((d) => d.followers != null);
    const posts = rows.filter((r) => r.network === network);
    return {
      network,
      label: NETWORK_LABEL[network],
      followers: counted.length ? counted[counted.length - 1].followers : null,
      change: counted.length > 1 ? counted[counted.length - 1].followers - counted[0].followers : null,
      reach: sumOf(days, 'reach') ?? sumOf(posts, 'reach'),
      interactions: sumOf(days, 'interactions') ?? sumOf(posts, 'interactions'),
      clicks: sumOf(posts, 'clicks'),
      posts: posts.length,
    };
  });
}

export async function reachSeries(adb, slug, { start, end }) {
  const { results } = await adb.prepare('SELECT day, SUM(reach) AS reach FROM account_daily WHERE site_slug = ? AND day BETWEEN ? AND ? AND reach IS NOT NULL GROUP BY day ORDER BY day')
    .bind(slug, start, end).all();
  return results.map((r) => r.reach);
}

/** The last finished run, read per network. */
export async function freshness(adb, slug, networks) {
  const run = await adb.prepare('SELECT started_at, finished_at, ok, errors, trigger FROM sync_runs WHERE site_slug = ? AND finished_at IS NOT NULL ORDER BY started_at DESC LIMIT 1')
    .bind(slug).first();
  if (!run) {
    return { at: null, trigger: null, lines: networks.map((network) => ({ network, label: NETWORK_LABEL[network], ok: null, error: null })), other: null, siteError: null };
  }
  let errors = {};
  try {
    errors = run.errors ? JSON.parse(run.errors) : {};
  } catch {
    errors = { site: String(run.errors) };
  }
  return {
    at: run.finished_at,
    trigger: run.trigger,
    lines: networks.map((network) => {
      const error = errors.site ?? errors[network] ?? null;
      return { network, label: NETWORK_LABEL[network], ok: !error, error };
    }),
    other: errors.scheduler ? `Matching posts to the pipeline: ${errors.scheduler}` : null,
    siteError: errors.site ?? null,
  };
}
