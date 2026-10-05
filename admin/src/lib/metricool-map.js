// Metricool's analytics replies, mapped onto ka-attribution columns. Field
// names come from the live API (read-only probes on brand 7076479, 2026-10-04
// and 2026-10-05). Published times arrive in Metricool's own timezone
// (Europe/Madrid) whatever the request names, so each is converted to UTC with
// the timezone the reply carries. Captions are never kept whole: a title is
// the first line, 120 characters at most.
import { zonedToUtcIso } from './zone.js';

export const ENDPOINTS = [
  { network: 'instagram', path: 'posts/instagram' },
  { network: 'instagram', path: 'reels/instagram' },
  { network: 'facebook', path: 'posts/facebook' },
  { network: 'facebook', path: 'reels/facebook' },
  { network: 'linkedin', path: 'posts/linkedin' },
  { network: 'youtube', path: 'posts/youtube' },
];

export const METRIC_COLUMNS = ['reach', 'impressions', 'views', 'interactions', 'likes', 'comments', 'shares', 'saves', 'clicks', 'watch_seconds', 'engagement'];

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function sumOrNull(...vals) {
  const present = vals.map(num).filter((v) => v !== null);
  return present.length ? present.reduce((a, b) => a + b, 0) : null;
}

/** A Metricool time as UTC ISO: `{ dateTime, timezone }`, or a string that carries its own offset. */
export function publishedUtc(v) {
  if (v && typeof v === 'object' && typeof v.dateTime === 'string') return zonedToUtcIso(v.dateTime, v.timezone || 'UTC');
  if (typeof v === 'string' && /(Z|[+-]\d{2}:?\d{2})$/.test(v)) {
    const ms = Date.parse(v.replace(/([+-]\d{2})(\d{2})$/, '$1:$2'));
    return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
  }
  return null;
}

const TITLE_FIELDS = ['title', 'content', 'description', 'comment', 'text'];

export function titleOf(item) {
  for (const field of TITLE_FIELDS) {
    const value = item?.[field];
    if (typeof value !== 'string') continue;
    const line = value.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
    if (line) return line.slice(0, 120);
  }
  return null;
}

// One function per endpoint: the row's id, link, time and type, then the metric columns.
const MAPS = {
  'posts/instagram': (x) => ({
    native_id: x.postId, url: x.url, published: x.publishedAt, type: x.type,
    reach: x.reach, impressions: x.impressionsTotal, views: x.views, interactions: x.interactions,
    likes: x.likes, comments: x.comments, shares: x.shares, saves: x.saved, clicks: null,
    watch_seconds: null, engagement: x.engagement,
  }),
  'reels/instagram': (x) => ({
    native_id: x.reelId, url: x.url, published: x.publishedAt, type: x.type,
    reach: x.reach, impressions: x.impressionsTotal, views: x.views, interactions: x.interactions,
    likes: x.likes, comments: x.comments, shares: x.shares, saves: x.saved, clicks: null,
    watch_seconds: x.videoViewTotalTime, engagement: x.engagement,
  }),
  'posts/facebook': (x) => ({
    native_id: x.postId, url: x.link, published: x.created, type: x.type,
    reach: x.impressionsUnique, impressions: x.impressions, views: x.videoViews,
    interactions: sumOrNull(x.reactions, x.comments, x.shares),
    likes: x.reactions, comments: x.comments, shares: x.shares, saves: null, clicks: x.linkclicks,
    watch_seconds: x.videoTimeWatched, engagement: x.engagement,
  }),
  'reels/facebook': (x) => ({
    native_id: x.reelId, url: x.reelUrl, published: x.created, type: 'REEL',
    reach: x.postImpressionsUnique, impressions: null, views: x.blueReelsPlayCount,
    interactions: sumOrNull(x.postVideoReactions, x.postVideoSocialActions),
    likes: x.postVideoReactions, comments: null, shares: null, saves: null, clicks: null,
    watch_seconds: x.postVideoViewTimeSeconds, engagement: x.engagement,
  }),
  'posts/linkedin': (x) => ({
    native_id: x.postId, url: x.url, published: x.created, type: x.type,
    reach: null, impressions: x.impressions, views: x.videoViews,
    interactions: sumOrNull(x.likes ?? x.like, x.comments, x.shares),
    likes: x.likes ?? x.like, comments: x.comments, shares: x.shares, saves: null, clicks: x.clicks,
    watch_seconds: x.timeWatched, engagement: x.engagement,
  }),
  'posts/youtube': (x) => ({
    native_id: x.videoId, url: x.watchUrl, published: x.publishedAt, type: x.videoType,
    reach: null, impressions: null, views: x.views, interactions: sumOrNull(x.likes, x.comments, x.shares),
    likes: x.likes, comments: x.comments, shares: x.shares, saves: null, clicks: null,
    watch_seconds: num(x.watchMinutes) === null ? null : x.watchMinutes * 60, engagement: null,
  }),
};

/** One Metricool item as a posts row and a post_metrics row, or null when it cannot be keyed. */
export function mapItem(path, item) {
  const map = MAPS[path];
  if (!map || !item || typeof item !== 'object') return null;
  const r = map(item);
  if (r.native_id === undefined || r.native_id === null || r.native_id === '') return null;
  const { network } = ENDPOINTS.find((e) => e.path === path);
  return {
    post: {
      network,
      native_id: String(r.native_id),
      type: typeof r.type === 'string' && r.type ? r.type : null,
      url: typeof r.url === 'string' && r.url ? r.url : null,
      published_at: publishedUtc(r.published),
      title: titleOf(item),
    },
    metrics: Object.fromEntries(METRIC_COLUMNS.map((c) => [c, num(r[c])])),
  };
}

// /admin/simpleProfiles fields per network. LinkedIn company pages are linkedinCompany.
const PROFILE_FIELDS = { facebook: 'facebook', instagram: 'instagram', linkedin: 'linkedinCompany', youtube: 'youtube' };

export function connectedNetworks(profile) {
  return Object.entries(PROFILE_FIELDS).filter(([, field]) => profile && profile[field]).map(([network]) => network);
}

// Account timelines that answered on 2026-10-05. Instagram interactions exist
// only with subject=posts; Facebook has no reach metric; LinkedIn has no
// interactions. A column with no metric here stays NULL.
export const TIMELINES = {
  instagram: [
    { metric: 'followers', subject: 'account', column: 'followers' },
    { metric: 'reach', subject: 'account', column: 'reach' },
    { metric: 'views', subject: 'account', column: 'views' },
    { metric: 'interactions', subject: 'posts', column: 'interactions' },
  ],
  facebook: [
    { metric: 'pageFollows', subject: 'account', column: 'followers' },
    { metric: 'pageImpressions', subject: 'account', column: 'impressions' },
    { metric: 'postsInteractions', subject: 'account', column: 'interactions' },
  ],
  linkedin: [
    { metric: 'followers', subject: 'account', column: 'followers' },
    { metric: 'companyImpressions', subject: 'account', column: 'impressions' },
  ],
  youtube: [
    { metric: 'totalSubscribers', subject: 'account', column: 'followers' },
    { metric: 'views', subject: 'account', column: 'views' },
  ],
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** `{ data: [{ metric, values: [{ dateTime, value }] }] }` as `[{ day, value }]`. */
export function timelineValues(reply) {
  const series = Array.isArray(reply?.data) ? reply.data : Array.isArray(reply) ? reply : [];
  const values = Array.isArray(series[0]?.values) ? series[0].values : [];
  return values
    .map((v) => ({ day: String(v?.dateTime ?? '').slice(0, 10), value: num(v?.value) }))
    .filter((v) => DAY.test(v.day) && v.value !== null);
}

export const ACCOUNT_COLUMNS = ['followers', 'reach', 'impressions', 'views', 'interactions'];

/** Columns' series merged into account_daily rows by day, with followers_delta from consecutive followers. */
export function accountRows(seriesByColumn) {
  const byDay = new Map();
  for (const [column, values] of Object.entries(seriesByColumn)) {
    if (!ACCOUNT_COLUMNS.includes(column)) continue;
    for (const { day, value } of values) {
      const row = byDay.get(day) ?? { day, followers: null, followers_delta: null, reach: null, impressions: null, views: null, interactions: null };
      row[column] = value;
      byDay.set(day, row);
    }
  }
  const rows = [...byDay.values()].sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
  let prev = null;
  for (const row of rows) {
    if (row.followers === null) continue;
    if (prev !== null) row.followers_delta = row.followers - prev;
    prev = row.followers;
  }
  return rows;
}
