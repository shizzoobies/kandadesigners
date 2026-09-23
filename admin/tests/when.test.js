import { describe, it, expect } from 'vitest';
import { easternTime, easternDateTime, humanDate, todayEastern, daysUntil } from '../src/lib/when.js';

describe('when', () => {
  it('formats times in Eastern with a plain space before AM or PM', () => {
    expect(easternTime('2026-09-23T18:05:00Z')).toBe('2:05 PM');
    expect(easternDateTime('2026-09-23T18:05:00Z')).toBe('Sep 23, 2:05 PM');
  });
  it('formats stored dates without shifting them', () => {
    expect(humanDate('2026-11-01')).toBe('Nov 1, 2026');
  });
  it('uses the Eastern calendar day for today', () => {
    // 02:00 UTC on the 24th is still the evening of the 23rd in New York.
    expect(todayEastern(Date.parse('2026-09-24T02:00:00Z'))).toBe('2026-09-23');
  });
  it('counts calendar days until a date', () => {
    const now = Date.parse('2026-09-23T15:00:00Z');
    expect(daysUntil('2026-09-23', now)).toBe(0);
    expect(daysUntil('2026-09-30', now)).toBe(7);
    expect(daysUntil('2026-09-20', now)).toBe(-3);
  });
});
