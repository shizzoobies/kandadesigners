// The Stories checklist: which state a Story is in, and which one the phone
// lands on. Pure, so the page and tests share them. `now` is the clock in
// Gainesville as { date: 'YYYY-MM-DD', time: 'HH:MM' } (the page's nyNow()),
// and `checks` maps a Story id to { posted, at }.

// 'posted' | 'missed' | 'due' | 'today' | 'upcoming'. "Due now" is a Story for
// today whose time has come (now.time >= s.time, to the minute); one with no
// time is simply "today".
export function storyState(s, checks, now) {
  if (checks?.[s.id]?.posted) return 'posted';
  if (s.date < now.date) return 'missed';
  if (s.date > now.date) return 'upcoming';
  return s.time && now.time >= s.time ? 'due' : 'today';
}

// What the row says beside its dot, or null for an upcoming Story.
export const STORY_FLAG = {
  posted: { dot: 'approved', label: 'Posted' },
  missed: { dot: 'waiting', label: 'Not ticked' },
  due: { dot: 'changes', label: 'Due now' },
  today: { dot: 'changes', label: 'Today' },
  upcoming: null,
};

const when = (s) => `${s.date} ${s.time || '99:99'}`;
const earliest = (list) => list.reduce((a, s) => (a && when(a) <= when(s) ? a : s), null);

// The first row needing action: a Story due now (the longest overdue first),
// then one later today, then the next upcoming one not yet posted. Null when
// every Story is posted or missed, or there are none.
export function storyFocusId(list, checks, now) {
  const by = (st) => (list || []).filter((s) => storyState(s, checks, now) === st);
  for (const st of ['due', 'today', 'upcoming']) {
    const s = earliest(by(st));
    if (s) return s.id;
  }
  return null;
}

// A site has Stories (and so a Stories tab and an app shortcut to it) when its
// desk holds any checklist row, or Stories are paused. `state` is
// getDeskState()'s shape; only items and meta are read.
export function hasStoriesIn(state) {
  return (state?.items || []).some((i) => i.list === 'stories') || !!state?.meta?.stories_paused;
}

// A File kept for a second Save image tap after iOS NotAllowedError. Only
// returned when the stored media version still matches the Story's.
export function preparedFor(map, story) {
  if (!story?.id) return null;
  const entry = map?.get?.(story.id);
  if (!entry?.file) return null;
  const a = entry.v ?? null;
  const b = story.v ?? null;
  return a === b ? entry.file : null;
}

// Drop prepared Files whose Story is gone or whose media version changed.
export function prunePrepared(map, storyList) {
  if (!map) return map;
  const byId = new Map((storyList || []).map((s) => [s.id, s]));
  for (const id of [...map.keys()]) {
    const s = byId.get(id);
    if (!s || preparedFor(map, s) == null) map.delete(id);
  }
  return map;
}
