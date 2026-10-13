// Post Desk PWA helpers: installable manifest fields and the phone sticky
// decision bar's state. Pure, so the page and tests share them.

import { nextTargetId } from './desk-nav.js';

// Admin palette from admin.css (:root / .desk). No new colors.
export const DESK_THEME = {
  background_color: '#F8F5F2',
  theme_color: '#FFFDF9',
};

const ICONS = [
  { src: '/images/desk-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/images/desk-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: '/images/desk-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
];

// site is the validated sites row (slug + name). Never take the slug from
// the request path beyond what the DB already resolved. hasStories adds a
// "Stories" app shortcut (long-press the icon on Android) to the checklist;
// a site without Stories has no Stories tab, so no shortcut either.
export function manifestFor(site, { hasStories = false } = {}) {
  const slug = site?.slug;
  if (!slug || typeof slug !== 'string') {
    throw new Error('manifestFor needs a site with a slug');
  }
  const start = `/sites/${slug}/social`;
  const m = {
    name: `${site.name} Post Desk`,
    short_name: 'Post Desk',
    id: start,
    start_url: start,
    scope: start,
    display: 'standalone',
    background_color: DESK_THEME.background_color,
    theme_color: DESK_THEME.theme_color,
    icons: ICONS.map((i) => ({ ...i })),
  };
  if (hasStories) {
    m.shortcuts = [{
      name: 'Stories',
      short_name: 'Stories',
      description: 'The Stories checklist',
      url: `${start}#stories`,
      icons: [{ ...ICONS[0] }],
    }];
  }
  return m;
}

// Kind of sticky phone bar for this item. Asks and native posts have none
// (asks keep Save answer in the card). buttons: 'changes' | 'approve' |
// 'undo' | 'next'. status is the decision state string, or null when no bar.
export function phoneBarState(item, stateOf, canWrite, items) {
  if (!item) return { status: null, buttons: [] };
  const kind = item.kind || item.type;
  if (kind === 'ask' || kind === 'native') return { status: null, buttons: [] };

  const st = stateOf(item);
  if (!canWrite) return { status: st, buttons: [] };

  if (st === 'waiting') return { status: st, buttons: ['changes', 'approve'] };

  const buttons = ['undo'];
  if (nextTargetId(items, item.id, stateOf)) buttons.push('next');
  return { status: st, buttons };
}

// Home-screen badge: items still waiting on Alex for the site, counted as the
// slice 4 push counts them (list 'approve', not decided, not native; asks in,
// the Stories checklist out). items may carry `list` (server rows); page items
// are all from the approve list. stateOf(item) -> 'waiting' | ...
// Browser- and Worker-safe: the page and runDeskPush both use it.
export function waitingCount(items, stateOf) {
  if (!Array.isArray(items)) return 0;
  let n = 0;
  for (const it of items) {
    if (!it) continue;
    if ((it.list ?? 'approve') !== 'approve') continue;
    if ((it.kind || it.type) === 'native') continue;
    if (stateOf(it) === 'waiting') n += 1;
  }
  return n;
}

// Swipe to decide on the phone detail card. Pure: decides on release.
// Returns null | 'approve' | 'changes'.
// - starts within `edge` px of either screen edge: null (iOS back/forward wins)
// - axis locks after 10px; vertical-dominant (|dy| > |dx|) is a scroll: null
// - fires only with |dx| >= max(min, 30% of width) and |dx| > 2·|dy|
// - touches > 1 (pinch) cancels
export const SWIPE_LOCK = 10;
export function swipeThreshold(width, min = 96) {
  return Math.max(min, 0.3 * (width || 0));
}
export function swipeAxis(dx, dy) {
  if (Math.hypot(dx, dy) < SWIPE_LOCK) return null;
  return Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
}
export function swipeIntent({ startX, startY, x, y, width, edge = 24, min = 96, touches = 1, axis } = {}) {
  if (touches > 1) return null;
  if (![startX, startY, x, y, width].every(Number.isFinite)) return null;
  if (startX < edge || startX > width - edge) return null;
  const dx = x - startX, dy = y - startY;
  const locked = axis ?? swipeAxis(dx, dy);
  if (locked !== 'x') return null;
  if (Math.abs(dx) < swipeThreshold(width, min)) return null;
  if (!(Math.abs(dx) > 2 * Math.abs(dy))) return null;
  return dx > 0 ? 'approve' : 'changes';
}
