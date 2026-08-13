import { describe, it, expect } from 'vitest';
import { money, todayInEastern, nowIso, humanDate, parseMoneyToCents, centsToInput, cleanYmd } from '../src/lib/format.js';

describe('parseMoneyToCents', () => {
  it('reads whole dollars', () => expect(parseMoneyToCents('8500')).toBe(850000));
  it('reads cents', () => expect(parseMoneyToCents('12.34')).toBe(1234));
  it('reads one decimal place', () => expect(parseMoneyToCents('12.3')).toBe(1230));
  it('tolerates thousands separators', () => expect(parseMoneyToCents('8,500.50')).toBe(850050));
  it('tolerates a dollar sign and spaces', () => expect(parseMoneyToCents(' $1,200 ')).toBe(120000));
  it('treats blank as zero', () => expect(parseMoneyToCents('')).toBe(0));
  it('treats whitespace as zero', () => expect(parseMoneyToCents('   ')).toBe(0));
  it('treats null as zero', () => expect(parseMoneyToCents(null)).toBe(0));
  it('reads an explicit zero', () => expect(parseMoneyToCents('0')).toBe(0));

  // Rejections return null so the caller can refuse the write and say so,
  // rather than silently storing a wrong number.
  it('rejects words', () => expect(parseMoneyToCents('abc')).toBeNull());
  it('rejects negatives', () => expect(parseMoneyToCents('-5')).toBeNull());
  it('rejects more than two decimal places', () => expect(parseMoneyToCents('12.345')).toBeNull());
  it('rejects exponent notation', () => expect(parseMoneyToCents('1e3')).toBeNull());
  it('rejects a stray trailing dot', () => expect(parseMoneyToCents('12.')).toBeNull());
  it('rejects two dots', () => expect(parseMoneyToCents('1.2.3')).toBeNull());

  it('round-trips through money() without drift', () => {
    for (const input of ['8500', '0.01', '1,234.56', '999999.99']) {
      const cents = parseMoneyToCents(input);
      expect(parseMoneyToCents(money(cents).replace('$', ''))).toBe(cents);
    }
  });
});

describe('cleanYmd', () => {
  it('accepts a valid date', () => expect(cleanYmd('2026-08-13')).toBe('2026-08-13'));
  it('trims', () => expect(cleanYmd('  2026-08-13 ')).toBe('2026-08-13'));
  it('treats blank as unset', () => expect(cleanYmd('')).toBe(''));
  it('treats null as unset', () => expect(cleanYmd(null)).toBe(''));
  it('accepts a leap day in a leap year', () => expect(cleanYmd('2028-02-29')).toBe('2028-02-29'));

  it('rejects a leap day in a non-leap year', () => expect(cleanYmd('2026-02-29')).toBeNull());
  it('rejects an impossible day', () => expect(cleanYmd('2026-02-30')).toBeNull());
  it('rejects month 13', () => expect(cleanYmd('2026-13-01')).toBeNull());
  it('rejects month 00', () => expect(cleanYmd('2026-00-10')).toBeNull());
  it('rejects day 00', () => expect(cleanYmd('2026-08-00')).toBeNull());
  it('rejects a non-padded form', () => expect(cleanYmd('2026-8-1')).toBeNull());
  it('rejects US ordering', () => expect(cleanYmd('08/13/2026')).toBeNull());
  it('rejects words', () => expect(cleanYmd('tomorrow')).toBeNull());
  it('rejects an ISO timestamp', () => expect(cleanYmd('2026-08-13T00:00:00Z')).toBeNull());
});

describe('centsToInput', () => {
  it('renders a plain editable number', () => expect(centsToInput(850000)).toBe('8500.00'));
  it('renders zero as empty so the field looks unset', () => expect(centsToInput(0)).toBe(''));
  it('handles null', () => expect(centsToInput(null)).toBe(''));
  it('keeps cents', () => expect(centsToInput(1234)).toBe('12.34'));
  it('adds no thousands separator, so it re-parses cleanly', () => expect(centsToInput(123456789)).toBe('1234567.89'));
});

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
