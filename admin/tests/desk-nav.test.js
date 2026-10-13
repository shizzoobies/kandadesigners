import { describe, it, expect } from 'vitest';
import { nextWaitingId, nextTargetId, positionOf, revertBody, isNoOp, sameState, toastMs, TOAST_CAP_MS } from '../src/lib/desk-nav.js';

const items = [
  { id: 'a', kind: 'reel' }, { id: 'b', kind: 'reel' }, { id: 'c', kind: 'native' }, { id: 'd', kind: 'reel' }, { id: 'q', kind: 'ask' },
];
const states = (map) => (it) => map[it.id] ?? 'waiting';

describe('nextWaitingId', () => {
  it('finds the next waiting post after the current one, wrapping, skipping asks', () => {
    expect(nextWaitingId(items, 'a', states({}))).toBe('b');
    expect(nextWaitingId(items, 'b', states({ c: 'info' }))).toBe('d');
    expect(nextWaitingId(items, 'd', states({ c: 'info' }))).toBe('a');
  });

  it('returns null when nothing else waits', () => {
    expect(nextWaitingId(items, 'a', states({ b: 'approved', c: 'info', d: 'changes' }))).toBeNull();
  });
});

describe('nextTargetId', () => {
  it('prefers the next waiting post', () => {
    expect(nextTargetId(items, 'a', states({ b: 'approved', c: 'info' }))).toBe('d');
  });

  it('falls back to the next item when nothing waits', () => {
    const done = states({ a: 'approved', b: 'approved', c: 'info', d: 'approved' });
    expect(nextTargetId(items, 'b', done)).toBe('c');
    expect(nextTargetId(items, 'd', done)).toBe('q');
    expect(nextTargetId(items, 'q', done)).toBeNull();
  });
});

describe('positionOf', () => {
  it('gives the 1-based place, the total and the neighbors', () => {
    expect(positionOf(items, 'a')).toEqual({ index: 1, total: 5, prevId: null, nextId: 'b' });
    expect(positionOf(items, 'c')).toEqual({ index: 3, total: 5, prevId: 'b', nextId: 'd' });
    expect(positionOf(items, 'q')).toEqual({ index: 5, total: 5, prevId: 'd', nextId: null });
    expect(positionOf(items, 'zzz')).toBeNull();
  });
});

describe('revertBody', () => {
  // answers are left out on purpose: the server keeps omitted fields, so an
  // answer typed after the decision survives the Undo.
  it('restores the previous decision and note, never answers', () => {
    expect(revertBody('a', { decision: 'changes', note: 'Shorter', answers: { 0: 'Yes' }, at: 't' }))
      .toEqual({ item_id: 'a', decision: 'changes', note: 'Shorter' });
  });

  it('goes back to waiting when there was no decision before', () => {
    expect(revertBody('a', undefined)).toEqual({ item_id: 'a', decision: 'waiting', note: '' });
    expect(revertBody('a', { answers: { 1: 'x' } })).toEqual({ item_id: 'a', decision: 'waiting', note: '' });
  });
});

describe('isNoOp', () => {
  it('calls re-approving an approved post a no-op', () => {
    expect(isNoOp({ decision: 'approved', note: 'old' }, 'approved')).toBe(true);
  });

  it('treats a missing decision as waiting', () => {
    expect(isNoOp(undefined, 'waiting')).toBe(true);
    expect(isNoOp(undefined, 'approved')).toBe(false);
  });

  it('counts a change request with a new note as a real change', () => {
    expect(isNoOp({ decision: 'changes', note: 'Shorter' }, 'changes', 'Shorter')).toBe(true);
    expect(isNoOp({ decision: 'changes', note: 'Shorter' }, 'changes', 'Longer')).toBe(false);
    expect(isNoOp({ decision: 'approved', note: '' }, 'changes', 'Shorter')).toBe(false);
  });
});

describe('sameState', () => {
  it('matches on decision and note, ignoring answers and times', () => {
    expect(sameState({ decision: 'approved', note: '', answers: { 0: 'x' }, at: '1' }, { decision: 'approved', note: '' })).toBe(true);
    expect(sameState({ decision: 'approved' }, { decision: 'approved', note: '' })).toBe(true);
    expect(sameState(undefined, { decision: 'waiting', note: '' })).toBe(true);
  });

  it('notices a different decision or note', () => {
    expect(sameState({ decision: 'changes', note: 'Other device' }, { decision: 'approved', note: '' })).toBe(false);
    expect(sameState({ decision: 'changes', note: 'B' }, { decision: 'changes', note: 'A' })).toBe(false);
  });
});

describe('toastMs', () => {
  it('keeps a toast with Undo up for 10 seconds', () => {
    expect(toastMs({ undo: true })).toBe(10000);
  });

  it('keeps a plain toast for 2.2 seconds', () => {
    expect(toastMs({})).toBe(2200);
    expect(toastMs()).toBe(2200);
    expect(toastMs({ undo: false, reload: false })).toBe(2200);
  });

  it('keeps a reload toast up to the 20 second cap, Undo or not', () => {
    expect(TOAST_CAP_MS).toBe(20000);
    expect(toastMs({ reload: true })).toBe(20000);
    expect(toastMs({ reload: true, undo: true })).toBe(20000);
  });

  it('never runs past the cap', () => {
    for (const o of [{}, { undo: true }, { reload: true }]) expect(toastMs(o)).toBeLessThanOrEqual(TOAST_CAP_MS);
  });
});
