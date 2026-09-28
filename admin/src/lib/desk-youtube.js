// The Post Desk's YouTube tab: what YouTube will actually show for a post.
// A feed-size card (the thumbnail at 360 px with the title as the feed cuts
// it), then the full title, the description, tags and details. Shared by the
// client script and its test.
import { esc, linkify, fmtTime } from './desk-format.js';

export const TITLE_CUT = 70;

// The feed shows about 70 characters of a title, then an ellipsis.
export function cutTitle(title, max = TITLE_CUT) {
  const cs = Array.from(String(title ?? ''));
  return cs.length <= max ? cs.join('') : `${cs.slice(0, max - 1).join('').trimEnd()}…`;
}

export function youtubePanel(it, mediaUrl) {
  const title = it.youtubeTitle || '';
  const n = Array.from(title).length;
  const short = it.youtubeType === 'SHORT';
  const media = it.media || [];
  const thumb = media.find((m) => m.role === 'thumbnail');
  const vid = media.find((m) => m.role === 'video');
  // A Short with no thumbnail: YouTube picks a frame, so the first one stands in.
  const frame = !thumb && vid;
  const pic = thumb
    ? `<img class="yt-thumb" src="${esc(mediaUrl(thumb))}" alt="${esc(thumb.alt || 'Thumbnail')}">`
    : frame ? `<video class="yt-thumb" src="${esc(mediaUrl(vid))}#t=0.1" preload="metadata" muted playsinline aria-hidden="true" tabindex="-1"></video>`
    : `<div class="yt-thumb yt-none">No thumbnail</div>`;
  const tags = (it.youtubeTags || []).join(', ');
  return `<div class="yt">
    <div><h3>In the feed</h3>
      <div class="yt-card${short ? ' short' : ''}">${pic}<p class="yt-title">${esc(cutTitle(title))}</p></div>
      ${short && frame ? `<p class="alt">Shorts use a frame from the video.</p>` : ''}</div>
    <div><h3>Title</h3><p class="flush">${esc(title)}</p>
      <p class="yt-count">${n} characters${n > TITLE_CUT ? ` <span class="level"><span class="dot amber"></span>Over ${TITLE_CUT}, cut in the feed</span>` : ''}</p></div>
    <div><h3>Description</h3><div class="cap">${linkify(it.youtube || 'No description file.')}</div></div>
    <div><h3>Tags</h3><p class="flush">${esc(tags || 'No tags')}</p></div>
    <dl class="facts">
      <dt>Type</dt><dd>${short ? 'Short' : 'Video'}</dd>
      <dt>Playlist</dt><dd>${esc(it.youtubePlaylist || 'No playlist')}</dd>
      <dt>Time</dt><dd>${esc(fmtTime(it.youtubeTime || it.time))}</dd>
    </dl>
  </div>`;
}
