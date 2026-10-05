// Metricool replies shaped like the live API on 2026-10-05 (brand 7076479).
// Numbers are invented; field names, nesting and the Madrid timezone are real.

export const IG_POST = {
  postId: '18000000000000001', userId: '1', businessId: '2', type: 'FEED_CAROUSEL_ALBUM',
  publishedAt: { dateTime: '2026-10-05T00:02:25', timezone: 'Europe/Madrid' },
  url: 'https://www.instagram.com/p/AAA111/', content: 'Your Google profile has 5 settings.\nSecond line',
  likes: 2, comments: 1, shares: 0, interactions: 3, engagement: 60, reach: 5, saved: 1, follows: 0, impressionsTotal: 9, views: 9,
};

export const IG_REEL = {
  reelId: '3999113046320272483_31893145780', type: 'REELS_VIDEO',
  publishedAt: { dateTime: '2026-10-02T16:31:15', timezone: 'Europe/Madrid' },
  url: 'https://www.instagram.com/reel/Dd_tCCejNRj/', content: 'Kai needs a brief',
  likes: 1, comments: 0, interactions: 1, views: 3, reach: 2, saved: 0, shares: 0, impressionsTotal: 4,
  averageWatchTime: 0.955, videoViewTotalTime: 2.867,
};

export const FB_POST = {
  blogId: 7076479, pageId: '1239857262550754', postId: '1239857262550754_122119960383423707',
  created: { dateTime: '2026-09-29T16:41:02', timezone: 'Europe/Madrid' },
  link: 'https://facebook.com/122118829185423707/posts/122119960383423707', type: 'photo',
  shares: 1, comments: 2, reactions: 3, impressions: 40, impressionsUnique: 30, clicks: 4, engagement: 20,
  videoViews: 0, videoTimeWatched: 0, linkclicks: 2,
};

export const FB_REEL = {
  pageId: '1239857262550754', reelId: '2085412555673873',
  created: { dateTime: '2026-10-02T16:30:00', timezone: 'Europe/Madrid' },
  description: 'Reel caption line', reelUrl: 'https://www.facebook.com/reel/2085412555673873/',
  blueReelsPlayCount: 271, postImpressionsUnique: 200, postVideoAvgTimeWatchedSeconds: 2,
  postVideoViewTimeSeconds: 541.137, postVideoReactions: 5, postVideoSocialActions: 2, engagement: null,
};

export const LI_POST = {
  blogId: 7076479, companyId: 'urn:li:organization:129934379', postId: 'urn:li:ugcPost:7511757516595363840',
  created: { dateTime: '2026-10-02T14:02:34', timezone: 'Europe/Madrid' },
  url: 'https://www.linkedin.com/feed/update/urn:li:ugcPost:7511757516595363840',
  comment: 'Course, job aid, or neither?', type: 'VIDEO',
  impressions: 12, engagement: 16.5, videoViews: 5, viewers: 4, timeWatched: 59, clicks: 1, shares: 1, like: 2,
};

export const YT_VIDEO = {
  videoId: 'HopxcccH2Uw', watchUrl: 'https://www.youtube.com/watch?v=HopxcccH2Uw',
  title: 'Test your website with one key', description: 'x',
  publishedAt: { dateTime: '2026-10-02T18:03:17', timezone: 'Europe/Madrid' },
  views: 135, watchMinutes: 5.0619, likes: 3, comments: 1, shares: 0, videoType: 'VIDEO',
};

export const BY_ENDPOINT = {
  'posts/instagram': [IG_POST], 'reels/instagram': [IG_REEL], 'posts/facebook': [FB_POST],
  'reels/facebook': [FB_REEL], 'posts/linkedin': [LI_POST], 'posts/youtube': [YT_VIDEO],
};

export const SCHEDULER = {
  data: [
    { id: 383676038, providers: [{ network: 'linkedin', id: 'urn:li:ugcPost:7511757516595363840', status: 'PUBLISHED', publicUrl: 'https://linkedin.com/feed/update/urn:li:ugcPost:7511757516595363840' }] },
    { id: 383676002, providers: [{ network: 'instagram', id: 'https://www.instagram.com/reel/Dd_tCCejNRj/', status: 'PUBLISHED', publicUrl: 'https://www.instagram.com/reel/Dd_tCCejNRj/' }] },
    { id: 383675968, providers: [{ network: 'facebook', id: '2085412555673873', status: 'PUBLISHED', publicUrl: 'https://facebook.com/reel/2085412555673873' }] },
    { id: 383676427, providers: [{ network: 'facebook', id: '122119960383423707', status: 'PUBLISHED', publicUrl: 'https://facebook.com/122118829185423707/posts/122119960383423707' }] },
    { id: 383688294, providers: [{ network: 'youtube', id: 'HopxcccH2Uw', status: 'PUBLISHED', publicUrl: 'https://www.youtube.com/watch?v=HopxcccH2Uw' }] },
    { id: 999, providers: [{ network: 'instagram', id: '', status: 'PENDING', publicUrl: '' }] },
  ],
};

export const PROFILES = {
  data: [
    { id: 7076479, label: 'K & A Performance', facebook: '1239857262550754', instagram: 'kaperformancefl', linkedinCompany: 'urn:li:organization:129934379', youtube: 'UCoZ_dAeTe5YO-JEDBdYSKsQ' },
    { id: 7185142, label: 'Fore Motion Golf', facebook: '884375111435508', instagram: 'foremotiongolf' },
  ],
};

export const timeline = (metric, values) => ({ data: [{ metric, values }] });

/**
 * A fetch handler for tests/helpers/fetch.js that answers like Metricool.
 * fail: { '<path after /api/>': { status, body } } overrides one path.
 * timelines: { '<network>/<metric>': { status?, body } }; anything else is an empty series.
 * byEndpoint: replaces BY_ENDPOINT.
 */
export function metricoolHandler({ fail = {}, timelines = {}, byEndpoint = BY_ENDPOINT, profiles = PROFILES, scheduler = SCHEDULER } = {}) {
  return (u) => {
    const p = u.pathname.replace(/^\/api\//, '');
    if (fail[p]) return fail[p];
    if (p === 'admin/simpleProfiles') return { body: profiles };
    if (p === 'v2/scheduler/posts') return { body: scheduler };
    if (p === 'v2/analytics/timelines') {
      const key = `${u.searchParams.get('network')}/${u.searchParams.get('metric')}`;
      return timelines[key] ?? { body: timeline(u.searchParams.get('metric'), []) };
    }
    return { body: { data: byEndpoint[p.replace('v2/analytics/', '')] ?? [] } };
  };
}
