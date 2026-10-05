import { describe, it, expect } from 'vitest';
import {
  ENDPOINTS, METRIC_COLUMNS, mapItem, publishedUtc, titleOf, sumOrNull,
  connectedNetworks, TIMELINES, timelineValues, accountRows,
} from '../src/lib/metricool-map.js';
import { IG_POST, IG_REEL, FB_POST, FB_REEL, LI_POST, YT_VIDEO, PROFILES, timeline } from './fixtures/metricool.js';

describe('mapItem', () => {
  it('maps an Instagram post: impressions from impressionsTotal, no clicks', () => {
    expect(mapItem('posts/instagram', IG_POST)).toEqual({
      post: { network: 'instagram', native_id: '18000000000000001', type: 'FEED_CAROUSEL_ALBUM', url: 'https://www.instagram.com/p/AAA111/', published_at: '2026-10-04T22:02:25.000Z', title: 'Your Google profile has 5 settings.' },
      metrics: { reach: 5, impressions: 9, views: 9, interactions: 3, likes: 2, comments: 1, shares: 0, saves: 1, clicks: null, watch_seconds: null, engagement: 60 },
    });
  });

  it('maps an Instagram reel, watch time in seconds', () => {
    const r = mapItem('reels/instagram', IG_REEL);
    expect(r.post).toMatchObject({ native_id: '3999113046320272483_31893145780', url: 'https://www.instagram.com/reel/Dd_tCCejNRj/' });
    expect(r.metrics).toMatchObject({ impressions: 4, watch_seconds: 2.867, engagement: null, clicks: null });
  });

  it('maps a Facebook post: reach is impressionsUnique, clicks are link clicks', () => {
    const r = mapItem('posts/facebook', FB_POST);
    expect(r.post).toMatchObject({ native_id: '1239857262550754_122119960383423707', url: FB_POST.link, published_at: '2026-09-29T14:41:02.000Z', title: null });
    expect(r.metrics).toEqual({ reach: 30, impressions: 40, views: 0, interactions: 6, likes: 3, comments: 2, shares: 1, saves: null, clicks: 2, watch_seconds: 0, engagement: 20 });
  });

  it('maps a Facebook reel, engagement null when Metricool gives none', () => {
    const r = mapItem('reels/facebook', FB_REEL);
    expect(r.post).toMatchObject({ native_id: '2085412555673873', type: 'REEL', url: FB_REEL.reelUrl, title: 'Reel caption line' });
    expect(r.metrics).toEqual({ reach: 200, impressions: null, views: 271, interactions: 7, likes: 5, comments: null, shares: null, saves: null, clicks: null, watch_seconds: 541.137, engagement: null });
  });

  it('maps a sparse LinkedIn post: likes may arrive as like', () => {
    const r = mapItem('posts/linkedin', LI_POST);
    expect(r.post).toMatchObject({ native_id: 'urn:li:ugcPost:7511757516595363840', type: 'VIDEO', title: 'Course, job aid, or neither?' });
    expect(r.metrics).toEqual({ reach: null, impressions: 12, views: 5, interactions: 3, likes: 2, comments: null, shares: 1, saves: null, clicks: 1, watch_seconds: 59, engagement: 16.5 });
  });

  it('maps a YouTube video: watch minutes to seconds, title before description', () => {
    const r = mapItem('posts/youtube', YT_VIDEO);
    expect(r.post).toMatchObject({ native_id: 'HopxcccH2Uw', type: 'VIDEO', url: YT_VIDEO.watchUrl, title: 'Test your website with one key' });
    expect(r.metrics.watch_seconds).toBeCloseTo(303.714, 3);
    expect(r.metrics).toMatchObject({ views: 135, interactions: 4, likes: 3, comments: 1, shares: 0, reach: null });
  });

  it('skips an item with no native id, and an unknown endpoint', () => {
    expect(mapItem('posts/instagram', { ...IG_POST, postId: '' })).toBeNull();
    expect(mapItem('posts/tiktok', IG_POST)).toBeNull();
    expect(mapItem('posts/instagram', null)).toBeNull();
  });

  it('covers six endpoints and eleven metric columns', () => {
    expect(ENDPOINTS.map((e) => e.path)).toEqual(['posts/instagram', 'reels/instagram', 'posts/facebook', 'reels/facebook', 'posts/linkedin', 'posts/youtube']);
    expect(METRIC_COLUMNS).toHaveLength(11);
  });
});

describe('helpers', () => {
  it('publishedUtc reads the reply timezone, an offset string, or nothing', () => {
    expect(publishedUtc({ dateTime: '2026-10-02T18:03:17', timezone: 'Europe/Madrid' })).toBe('2026-10-02T16:03:17.000Z');
    expect(publishedUtc('2026-09-30T12:00:00+0200')).toBe('2026-09-30T10:00:00.000Z');
    expect(publishedUtc('2026-09-30T12:00:00')).toBeNull();
    expect(publishedUtc(1759000000)).toBeNull();
  });

  it('titleOf keeps the first non-empty line, 120 characters at most', () => {
    expect(titleOf({ content: '\n  Hello there  \nmore' })).toBe('Hello there');
    expect(titleOf({ content: 'x'.repeat(200) })).toHaveLength(120);
    expect(titleOf({})).toBeNull();
  });

  it('sumOrNull ignores missing values and is null when all are missing', () => {
    expect(sumOrNull(1, undefined, 2, null)).toBe(3);
    expect(sumOrNull(undefined, null)).toBeNull();
    expect(sumOrNull(0)).toBe(0);
  });

  it('connectedNetworks reads the simpleProfiles fields', () => {
    expect(connectedNetworks(PROFILES.data[0])).toEqual(['facebook', 'instagram', 'linkedin', 'youtube']);
    expect(connectedNetworks(PROFILES.data[1])).toEqual(['facebook', 'instagram']);
    expect(connectedNetworks(undefined)).toEqual([]);
  });
});

describe('timelines', () => {
  it('lists the metrics that answered on 2026-10-05', () => {
    expect(TIMELINES.instagram.find((t) => t.column === 'interactions')).toEqual({ metric: 'interactions', subject: 'posts', column: 'interactions' });
    expect(TIMELINES.linkedin.map((t) => t.column)).toEqual(['followers', 'impressions']);
    expect(TIMELINES.youtube.map((t) => t.metric)).toEqual(['totalSubscribers', 'views']);
  });

  it('timelineValues keys values by day and drops junk', () => {
    const reply = timeline('followers', [
      { dateTime: '2026-09-30T12:00:00+0200', value: 2 },
      { dateTime: 'bad', value: 3 },
      { dateTime: '2026-10-01T12:00:00+0200', value: null },
    ]);
    expect(timelineValues(reply)).toEqual([{ day: '2026-09-30', value: 2 }]);
    expect(timelineValues({})).toEqual([]);
  });

  it('accountRows merges columns by day and works out the follower change', () => {
    const rows = accountRows({
      followers: [{ day: '2026-10-04', value: 3 }, { day: '2026-10-03', value: 2 }],
      reach: [{ day: '2026-10-03', value: 7 }],
      nonsense: [{ day: '2026-10-03', value: 1 }],
    });
    expect(rows).toEqual([
      { day: '2026-10-03', followers: 2, followers_delta: null, reach: 7, impressions: null, views: null, interactions: null },
      { day: '2026-10-04', followers: 3, followers_delta: 1, reach: null, impressions: null, views: null, interactions: null },
    ]);
  });
});
