import { describe, it, expect } from 'vitest';
import { kindLabel, netsOf, NET } from '../src/lib/desk-format.js';
import { cutTitle, youtubePanel } from '../src/lib/desk-youtube.js';

const mediaUrl = (m) => (m?.src ? `/media/${m.src}` : '');
const long = 'How a small Gainesville bakery doubled its Saturday walk-ins with one simple sign';
const video = {
  id: '2026-10-07', kind: 'youtube', networks: ['youtube'], time: '14:00',
  youtubeTitle: 'Three fixes for a slow site', youtubeType: 'VIDEO',
  youtube: 'What slows a small business site down.\nhttps://example.com/fake-link\n\nMore below.',
  youtubeTags: ['web design', 'site speed', 'Gainesville'], youtubePlaylist: 'Quick fixes', youtubeTime: '14:00',
  media: [{ src: 'x/v.mp4', role: 'video' }, { src: 'x/thumb.jpg', role: 'thumbnail', alt: 'Thumbnail' }],
};
const short = {
  ...video, youtubeType: 'SHORT', youtubePlaylist: null, youtubeTags: [],
  media: [{ src: 'x/s.mp4', role: 'video' }],
};

describe('the YouTube tab', () => {
  it('shows for any post that goes to YouTube', () => {
    expect(netsOf(video)).toEqual(['youtube']);
    expect(netsOf({ networks: ['facebook', 'youtube'] })).toContain('youtube');
    expect(NET.youtube).toBe('YouTube');
    expect(netsOf({})).toEqual(['facebook', 'instagram']);
  });

  it('draws the feed card, the description, tags and details', () => {
    const html = youtubePanel(video, mediaUrl);
    expect(html).toContain('class="yt-card"');
    expect(html).toContain('src="/media/x/thumb.jpg"');
    expect(html).toContain('<a href="https://example.com/fake-link"');
    expect(html).toContain('web design, site speed, Gainesville');
    expect(html).toContain('Quick fixes');
    expect(html).toContain('Video');
    expect(html).toContain('2:00 PM');
    expect(html).not.toContain('Shorts use a frame');
  });
});

describe('the title', () => {
  it('is cut at 70 characters with an ellipsis, the way YouTube cuts it', () => {
    expect(cutTitle('Short title')).toBe('Short title');
    const cut = cutTitle(long);
    expect(Array.from(cut).length).toBeLessThanOrEqual(70);
    expect(cut.endsWith('…')).toBe(true);
    expect(long.startsWith(cut.slice(0, -1))).toBe(true);
    expect(cutTitle('x'.repeat(70))).toBe('x'.repeat(70));
  });

  it('shows in full with its count, flagged only when over 70', () => {
    const over = youtubePanel({ ...video, youtubeTitle: long }, mediaUrl);
    expect(over).toContain(`>${cutTitle(long)}<`);
    expect(over).toContain(`>${long}<`);
    expect(over).toContain(`${long.length} characters`);
    expect(over).toContain('dot amber');
    const ok = youtubePanel(video, mediaUrl);
    expect(ok).toContain(`${video.youtubeTitle.length} characters`);
    expect(ok).not.toContain('dot amber');
  });
});

describe('a Short with no thumbnail', () => {
  it('shows the first frame in a 9:16 card, with a note', () => {
    const html = youtubePanel(short, mediaUrl);
    expect(html).toContain('class="yt-card short"');
    expect(html).toContain('src="/media/x/s.mp4#t=0.1"');
    expect(html).toContain('Shorts use a frame from the video');
    expect(html).toContain('Short');
    expect(html).toContain('No playlist');
    expect(html).toContain('No tags');
  });
});

describe('kind "youtube" in the list', () => {
  it('reads YouTube video or YouTube Short', () => {
    expect(kindLabel({ kind: 'youtube', youtubeType: 'VIDEO' })).toBe('YouTube video');
    expect(kindLabel({ kind: 'youtube', youtubeType: 'SHORT' })).toBe('YouTube Short');
    expect(kindLabel({ kind: 'reel' })).toBe('Reel');
    expect(kindLabel({ kind: 'something-new' })).toBe('something-new');
  });
});
