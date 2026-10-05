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
// the request path beyond what the DB already resolved.
export function manifestFor(site) {
  const slug = site?.slug;
  if (!slug || typeof slug !== 'string') {
    throw new Error('manifestFor needs a site with a slug');
  }
  const start = `/sites/${slug}/social`;
  return {
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
