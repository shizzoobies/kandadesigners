// Small text helpers and labels shared by the Post Desk client script and its
// tests. Kept apart from desk.js so the browser bundle carries none of the
// server code.

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const linkify = (s) => esc(s).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
export const fmtTime = (t) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };

const KIND = { reel: 'Reel', carousel: 'Carousel + FB video', linkedin: 'LinkedIn', post: 'Post', native: 'In Facebook', story: 'Story', ask: 'Question' };
// A YouTube-only post reads as a video or a Short, from its YouTube type.
export const kindLabel = (it) => (it.kind === 'youtube'
  ? (it.youtubeType === 'SHORT' ? 'YouTube Short' : 'YouTube video')
  : KIND[it.kind] || it.kind);

// Caption tabs follow the networks a post goes to (a LinkedIn-only post shows one tab).
export const NET = { facebook: 'Facebook caption', instagram: 'Instagram caption', linkedin: 'LinkedIn post', youtube: 'YouTube' };
export const netsOf = (it) => (it.networks && it.networks.length ? it.networks : ['facebook', 'instagram']);
