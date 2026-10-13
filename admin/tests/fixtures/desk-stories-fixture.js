// One desk fixture with a Stories-checklist entry, read by the page rule
// (waitingCount over the page's items) and by the server's push SQL
// (listWaitingApprove + badgeFor), so the two counts are checked against the
// same rows. Slice 5's badge tests and slice 6's cron tests both use it.
import * as q from '../../src/lib/db.js';

export const STORY_DAY = '2026-10-14';
export const FIXTURE = [
  { item_id: 'reel-wait', list: 'approve', kind: 'reel', title: 'Reel waiting' },
  { item_id: 'post-ok', list: 'approve', kind: 'carousel', title: 'Approved', decision: 'approved' },
  { item_id: 'post-fix', list: 'approve', kind: 'reel', title: 'Changes', decision: 'changes' },
  { item_id: 'post-back', list: 'approve', kind: 'reel', title: 'Undone', decision: 'waiting' },
  { item_id: 'ask-1', list: 'approve', kind: 'ask', title: 'Which track?' },
  { item_id: 'native-1', list: 'approve', kind: 'native', title: 'Native' },
  { item_id: 'story-post', list: 'approve', kind: 'story', title: 'Story post' },
  // The Stories checklist: today's Story (Eastern), for the Stories reminder.
  { item_id: `${STORY_DAY}-story`, list: 'stories', kind: 'story', title: 'Story', date: STORY_DAY, time: '09:30' },
];
export const stateOf = (it) => (it.kind === 'native' ? 'info' : it.decision || 'waiting');
export const STORY_ID = `${STORY_DAY}-story`;

// The page's view of a desk state: approve-list items (no list field, as
// post-desk.js builds them), each with its decision.
export function pageItems(state) {
  const dec = Object.fromEntries((state.decisions || []).map((d) => [d.item_id, d.decision]));
  return state.items.filter((i) => i.list === 'approve').map((i) => ({ id: i.item_id, kind: i.kind, decision: dec[i.item_id] }));
}

export async function seedFixture(db, { owner = true } = {}) {
  await q.createSite(db, { slug: 'ka-performance', name: 'K & A', live_url: 'https://ka.test', hosting: 'pages' }, 't');
  if (owner) await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Alex', 'alex@example.com', 'owner', 't')").run();
  for (const f of FIXTURE) {
    await db.prepare(
      'INSERT INTO desk_items (site_id, item_id, list, kind, post_date, post_time, title, payload, pushed_at) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).bind(f.item_id, f.list, f.kind, f.date || '2026-10-16', f.time || '10:00', f.title, JSON.stringify({ id: f.item_id }), 't').run();
    if (f.decision) await db.prepare("INSERT INTO desk_decisions (site_id, item_id, decision, note, decided_at) VALUES (1, ?, ?, '', 't')").bind(f.item_id, f.decision).run();
  }
  await db.prepare("INSERT INTO desk_meta (site_id, pushed_at, built_at, stories_paused) VALUES (1, 't', 't', 0)").run();
  return db;
}
