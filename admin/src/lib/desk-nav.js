// Moving through the Post Desk rail, and undoing a decision. Pure, so the
// client script and its tests share it; `stateOf(item)` is the page's own
// reading of an item's state ('waiting', 'approved', 'changes', 'info').

// The next post still waiting on Alex after the current one, wrapping around.
// Asks are skipped: they need typing, not a quick verdict.
export function nextWaitingId(items, currentId, stateOf) {
  const i = items.findIndex((x) => x.id === currentId);
  const n = items.slice(i + 1).concat(items.slice(0, Math.max(i, 0)))
    .find((x) => x.id !== currentId && x.kind !== 'ask' && stateOf(x) === 'waiting');
  return n ? n.id : null;
}

// Where "Next post" goes: the next waiting post, else simply the next item.
export function nextTargetId(items, currentId, stateOf) {
  const waiting = nextWaitingId(items, currentId, stateOf);
  if (waiting) return waiting;
  const i = items.findIndex((x) => x.id === currentId);
  return i >= 0 && i < items.length - 1 ? items[i + 1].id : null;
}

export function positionOf(items, id) {
  const i = items.findIndex((x) => x.id === id);
  if (i < 0) return null;
  return { index: i + 1, total: items.length, prevId: items[i - 1]?.id ?? null, nextId: items[i + 1]?.id ?? null };
}

// The /decide body that puts an item back the way it was before a decision.
// No answers: the server keeps fields a body leaves out, so an answer typed
// after the decision survives the Undo.
export function revertBody(id, prev) {
  return { item_id: id, decision: prev?.decision || 'waiting', note: prev?.note || '' };
}

// Decision and note are what an Undo is about; answers and times are not.
export function sameState(a, b) {
  return (a?.decision || 'waiting') === (b?.decision || 'waiting') && (a?.note || '') === (b?.note || '');
}

// A decision that would change nothing: same verdict, and for a change
// request the same note. The page skips the save and offers no Undo.
export function isNoOp(current, decision, note) {
  if ((current?.decision || 'waiting') !== decision) return false;
  return decision !== 'changes' || (current?.note || '') === (note || '');
}

// How long a toast stays up, in ms. A reload toast stays to the cap (an
// installed app has no browser chrome to reload from), one with an Undo long
// enough to reach it with a thumb, a plain one just long enough to read.
// Holding a finger, the pointer or focus on it pauses the timeout; the cap
// still ends it.
export const TOAST_CAP_MS = 20000;
export function toastMs({ undo = false, reload = false } = {}) {
  if (reload) return TOAST_CAP_MS;
  return undo ? 10000 : 2200;
}
