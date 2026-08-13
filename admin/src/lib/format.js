// Money is always integer cents in the database. Dates are stored as
// YYYY-MM-DD text. "Today" is an Eastern-time concept here, never UTC, because
// otherwise anything due today reads as overdue after 8pm local, which quietly
// trains you to distrust the dashboard.

const EASTERN = 'America/New_York';

const moneyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

// en-CA yields YYYY-MM-DD directly, which is both sortable and what we store.
const easternYmdFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: EASTERN,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const humanFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function money(cents) {
  return moneyFmt.format((Number(cents) || 0) / 100);
}

export function todayInEastern(nowMs = Date.now()) {
  return easternYmdFmt.format(new Date(nowMs));
}

export function nowIso(nowMs = Date.now()) {
  return new Date(nowMs).toISOString();
}

// Forms take dollars; the database stores integer cents. This is the only place
// that conversion happens.
//
// Returns null for anything it cannot read exactly, so a caller refuses the
// write and says so. It never guesses: "12.345" is rejected rather than rounded,
// because silently changing a number someone typed is worse than an error.
// Blank is 0, since an empty quote field legitimately means "nothing quoted".
export function parseMoneyToCents(input) {
  if (input === null || input === undefined) return 0;
  const trimmed = String(input).trim();
  if (trimmed === '') return 0;

  const cleaned = trimmed.replace(/^\$/, '').replace(/,/g, '').trim();
  // Digits, optionally one dot with one or two decimals. No signs, no exponents.
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;

  const [whole, frac = ''] = cleaned.split('.');
  // Built from the digits rather than by multiplying a float, so 0.29 style
  // binary-fraction error cannot creep in.
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}

// The inverse, for populating an editable field. No thousands separators, so the
// value it produces re-parses cleanly through parseMoneyToCents.
export function centsToInput(cents) {
  const n = Number(cents) || 0;
  if (n === 0) return '';
  return (n / 100).toFixed(2);
}

// Validates a date field from a form. Returns '' for blank (a legitimately unset
// date), the YYYY-MM-DD string when valid, or null when it cannot be trusted.
//
// Worth being strict here: every dashboard rule compares these as strings, so a
// malformed due_on would not throw, it would just silently never match, and the
// project would quietly vanish from the overdue list.
export function cleanYmd(input) {
  if (input === null || input === undefined) return '';
  const value = String(input).trim();
  if (value === '') return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [y, m, d] = value.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  // Round-trip through Date to reject impossible days like 2026-02-30, which the
  // range check above happily accepts.
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    return null;
  }
  return value;
}

// Adds days to a YYYY-MM-DD date and returns the same format. Built on UTC
// instants so it cannot be pushed across a day boundary by a local timezone,
// and so month, year and leap-year rollovers are the calendar's problem rather
// than ours.
export function addDays(ymd, days) {
  const clean = cleanYmd(ymd);
  if (!clean) return '';
  const [y, m, d] = clean.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + Number(days)));
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${mm}-${dd}`;
}

// Whole days from `from` to `to`, negative when `to` is earlier. Used for the
// "overdue by N days" copy.
export function daysBetween(from, to) {
  const a = cleanYmd(from);
  const b = cleanYmd(to);
  if (!a || !b) return 0;
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

export function humanDate(ymd) {
  if (!ymd) return '';
  const [y, m, d] = String(ymd).split('-').map(Number);
  if (!y || !m || !d) return '';
  // Built as a UTC instant and formatted in UTC, so the calendar day cannot
  // shift by one in either direction.
  return humanFmt.format(new Date(Date.UTC(y, m - 1, d)));
}
