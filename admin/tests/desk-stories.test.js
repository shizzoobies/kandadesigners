import { describe, it, expect } from 'vitest';
import { storyState, storyFocusId, hasStoriesIn, STORY_FLAG } from '../src/lib/desk-stories.js';

const NOW = { date: '2026-10-05', time: '12:00' };
const story = (id, date, time = '09:30', extra = {}) => ({ id, date, time, ...extra });

describe('storyState', () => {
  it('reads a ticked Story as posted, whatever its date', () => {
    const checks = { a: { posted: true }, b: { posted: true } };
    expect(storyState(story('a', '2026-10-04'), checks, NOW)).toBe('posted');
    expect(storyState(story('b', '2026-10-09'), checks, NOW)).toBe('posted');
  });

  it('reads an unticked Story from an earlier day as missed', () => {
    expect(storyState(story('a', '2026-10-04', '23:59'), {}, NOW)).toBe('missed');
    expect(storyState(story('a', '2026-10-04'), { a: { posted: false } }, NOW)).toBe('missed');
  });

  it('reads one later today as today, and one on a later day as upcoming', () => {
    expect(storyState(story('a', '2026-10-05', '18:00'), {}, NOW)).toBe('today');
    expect(storyState(story('a', '2026-10-06', '08:00'), {}, NOW)).toBe('upcoming');
  });

  it('is due now from its minute on, and not a minute before', () => {
    expect(storyState(story('a', '2026-10-05', '12:01'), {}, NOW)).toBe('today');
    expect(storyState(story('a', '2026-10-05', '12:00'), {}, NOW)).toBe('due');
    expect(storyState(story('a', '2026-10-05', '11:59'), {}, NOW)).toBe('due');
    expect(storyState(story('a', '2026-10-05', '00:00'), {}, { date: '2026-10-05', time: '00:00' })).toBe('due');
  });

  it('keeps a Story with no time as today, never due', () => {
    expect(storyState({ id: 'a', date: '2026-10-05' }, {}, NOW)).toBe('today');
    expect(storyState({ id: 'a', date: '2026-10-05', time: '' }, {}, NOW)).toBe('today');
  });

  it('works without a checks map', () => {
    expect(storyState(story('a', '2026-10-06'), undefined, NOW)).toBe('upcoming');
  });

  it('labels each state as dot plus text, and upcoming with none', () => {
    expect(STORY_FLAG.due).toEqual({ dot: 'changes', label: 'Due now' });
    expect(STORY_FLAG.today.label).toBe('Today');
    expect(STORY_FLAG.posted.label).toBe('Posted');
    expect(STORY_FLAG.missed.label).toBe('Not ticked');
    expect(STORY_FLAG.upcoming).toBeNull();
  });
});

describe('storyFocusId', () => {
  const list = [
    story('missed', '2026-10-04', '09:30'),
    story('posted', '2026-10-05', '08:00'),
    story('later', '2026-10-05', '18:00'),
    story('due', '2026-10-05', '10:00'),
    story('tomorrow', '2026-10-06', '09:30'),
    story('plus3', '2026-10-08', '09:30'),
  ];
  const checks = { posted: { posted: true } };

  it('lands on a Story due now first', () => {
    expect(storyFocusId(list, checks, NOW)).toBe('due');
  });

  it('picks the longest overdue when several are due', () => {
    const two = [...list, story('due-early', '2026-10-05', '09:00')];
    expect(storyFocusId(two, checks, NOW)).toBe('due-early');
  });

  it('then the next one today', () => {
    expect(storyFocusId(list, { ...checks, due: { posted: true } }, NOW)).toBe('later');
  });

  it('then the next upcoming one not yet posted', () => {
    const done = { ...checks, due: { posted: true }, later: { posted: true } };
    expect(storyFocusId(list, done, NOW)).toBe('tomorrow');
    expect(storyFocusId(list, { ...done, tomorrow: { posted: true } }, NOW)).toBe('plus3');
  });

  it('orders upcoming by date and time, not list order', () => {
    const l = [story('b', '2026-10-07', '09:00'), story('a', '2026-10-06', '20:00'), story('c', '2026-10-06', '08:00')];
    expect(storyFocusId(l, {}, NOW)).toBe('c');
  });

  it('skips missed Stories and is null when all are posted or missed', () => {
    const all = Object.fromEntries(list.filter((s) => s.id !== 'missed').map((s) => [s.id, { posted: true }]));
    expect(storyFocusId(list, all, NOW)).toBeNull();
  });

  it('is null with no Stories', () => {
    expect(storyFocusId([], {}, NOW)).toBeNull();
    expect(storyFocusId(undefined, {}, NOW)).toBeNull();
  });
});

describe('hasStoriesIn', () => {
  it('is true with a checklist row or with Stories paused, else false', () => {
    expect(hasStoriesIn({ items: [{ list: 'stories' }], meta: null })).toBe(true);
    expect(hasStoriesIn({ items: [], meta: { stories_paused: true } })).toBe(true);
    expect(hasStoriesIn({ items: [{ list: 'approve', kind: 'story' }], meta: { stories_paused: false } })).toBe(false);
    expect(hasStoriesIn({ items: [] })).toBe(false);
    expect(hasStoriesIn(null)).toBe(false);
  });
});

import { preparedFor, prunePrepared } from '../src/lib/desk-stories.js';

describe('preparedFor', () => {
  const file = { name: 'a.jpg' };
  it('returns the File when the story id and v match', () => {
    const map = new Map([['a', { file, v: 3 }]]);
    expect(preparedFor(map, { id: 'a', v: 3 })).toBe(file);
  });
  it('returns null when v mismatches', () => {
    const map = new Map([['a', { file, v: 3 }]]);
    expect(preparedFor(map, { id: 'a', v: 4 })).toBeNull();
  });
  it('returns null when the entry is missing', () => {
    expect(preparedFor(new Map(), { id: 'a', v: 1 })).toBeNull();
  });
  it('treats missing v on both sides as equal', () => {
    const map = new Map([['a', { file }]]);
    expect(preparedFor(map, { id: 'a' })).toBe(file);
    expect(preparedFor(map, { id: 'a', v: undefined })).toBe(file);
  });
});

describe('prunePrepared', () => {
  const f1 = { name: '1.jpg' }, f2 = { name: '2.jpg' };
  it('removes ids no longer in the list or whose v changed, and keeps the rest', () => {
    const map = new Map([
      ['keep', { file: f1, v: 1 }],
      ['gone', { file: f2, v: 1 }],
      ['stale', { file: f2, v: 1 }],
    ]);
    prunePrepared(map, [{ id: 'keep', v: 1 }, { id: 'stale', v: 2 }]);
    expect([...map.keys()]).toEqual(['keep']);
    expect(map.get('keep').file).toBe(f1);
  });
});
