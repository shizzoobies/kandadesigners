import { describe, it, expect } from 'vitest';
import { zonedToUtcIso, localYmd, localHms, addDays, slotOf } from '../src/lib/zone.js';

describe('zonedToUtcIso', () => {
  it('converts Metricool Madrid times (summer, +2) to UTC', () => {
    expect(zonedToUtcIso('2026-10-05T00:02:25', 'Europe/Madrid')).toBe('2026-10-04T22:02:25.000Z');
  });
  it('handles Eastern winter and summer', () => {
    expect(zonedToUtcIso('2026-01-15T12:00:00', 'America/New_York')).toBe('2026-01-15T17:00:00.000Z');
    expect(zonedToUtcIso('2026-07-04T09:00:00', 'America/New_York')).toBe('2026-07-04T13:00:00.000Z');
  });
  it('accepts a time without seconds and rejects junk', () => {
    expect(zonedToUtcIso('2026-07-04T09:00', 'America/New_York')).toBe('2026-07-04T13:00:00.000Z');
    expect(zonedToUtcIso('yesterday', 'America/New_York')).toBeNull();
    expect(zonedToUtcIso(undefined, 'UTC')).toBeNull();
  });
});

describe('local dates', () => {
  it('gives the site-local date and time', () => {
    const ms = Date.parse('2026-10-05T03:30:00Z');
    expect(localYmd(ms, 'America/New_York')).toBe('2026-10-04');
    expect(localHms(ms, 'America/New_York')).toBe('23:30:00');
  });
  it('adds days across months and leap boundaries', () => {
    expect(addDays('2026-10-05', -35)).toBe('2026-08-31');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('slotOf', () => {
  it('names the weekday and hour in the site timezone', () => {
    expect(slotOf('2026-10-05T14:10:00.000Z', 'America/New_York')).toEqual({ weekday: 'Mon', hour: 10, label: 'Mon 10 AM' });
    expect(slotOf('2026-10-05T16:00:00.000Z', 'America/New_York').label).toBe('Mon 12 PM');
    expect(slotOf('2026-10-06T04:30:00.000Z', 'America/New_York').label).toBe('Tue 12 AM');
    expect(slotOf('2026-10-05T21:00:00.000Z', 'America/New_York').label).toBe('Mon 5 PM');
  });
  it('is null for a missing time', () => {
    expect(slotOf(null, 'America/New_York')).toBeNull();
  });
});
