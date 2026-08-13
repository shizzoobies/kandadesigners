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

export function humanDate(ymd) {
  if (!ymd) return '';
  const [y, m, d] = String(ymd).split('-').map(Number);
  if (!y || !m || !d) return '';
  // Built as a UTC instant and formatted in UTC, so the calendar day cannot
  // shift by one in either direction.
  return humanFmt.format(new Date(Date.UTC(y, m - 1, d)));
}
