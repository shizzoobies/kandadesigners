import { describe, it, expect } from 'vitest';
import { money, todayInEastern, nowIso, humanDate } from '../src/lib/format.js';

describe('money', () => {
  it('formats whole dollars', () => expect(money(150000)).toBe('$1,500.00'));
  it('formats cents', () => expect(money(1234)).toBe('$12.34'));
  it('formats zero', () => expect(money(0)).toBe('$0.00'));
  it('formats negatives', () => expect(money(-2500)).toBe('-$25.00'));
  it('treats null as zero', () => expect(money(null)).toBe('$0.00'));
  it('treats undefined as zero', () => expect(money(undefined)).toBe('$0.00'));
  it('does not lose precision on large amounts', () => expect(money(1234567890)).toBe('$12,345,678.90'));
});

describe('todayInEastern', () => {
  // 2026-08-14T02:30:00Z is 2026-08-13 22:30 EDT. UTC would call this the 14th.
  it('uses the Eastern date, not the UTC date', () => {
    expect(todayInEastern(Date.UTC(2026, 7, 14, 2, 30))).toBe('2026-08-13');
  });
  it('rolls over at Eastern midnight', () => {
    expect(todayInEastern(Date.UTC(2026, 7, 14, 4, 1))).toBe('2026-08-14');
  });
  it('handles the winter offset', () => {
    // 2026-01-15T03:30:00Z is 2026-01-14 22:30 EST.
    expect(todayInEastern(Date.UTC(2026, 0, 15, 3, 30))).toBe('2026-01-14');
  });
  it('emits a sortable YYYY-MM-DD with zero padding', () => {
    expect(todayInEastern(Date.UTC(2026, 0, 5, 17, 0))).toBe('2026-01-05');
  });
});

describe('nowIso', () => {
  it('emits ISO-8601 UTC', () => {
    expect(nowIso(Date.UTC(2026, 7, 13, 18, 5, 4))).toBe('2026-08-13T18:05:04.000Z');
  });
});

describe('humanDate', () => {
  it('formats a stored date', () => expect(humanDate('2026-08-13')).toBe('13 Aug 2026'));
  it('does not shift the day across timezones', () => expect(humanDate('2026-01-01')).toBe('1 Jan 2026'));
  it('passes through empty values', () => expect(humanDate(null)).toBe(''));
  it('passes through malformed values', () => expect(humanDate('not-a-date')).toBe(''));
});
