// Time and date formatting. "Today" is an Eastern-time concept here, never UTC,
// because Alex reads this in Gainesville and an expiry "today" must mean his today.
// ICU puts a narrow no-break space before AM/PM; it is normalized to a plain
// space so strings compare and wrap predictably.

const EASTERN = 'America/New_York';

const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: EASTERN, hour: 'numeric', minute: '2-digit' });
const dateTimeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: EASTERN, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});
const humanFmt = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
const ymdFmt = new Intl.DateTimeFormat('en-CA', { timeZone: EASTERN, year: 'numeric', month: '2-digit', day: '2-digit' });

const clean = (s) => s.replace(/[  ]/g, ' ');

export const easternTime = (iso) => clean(timeFmt.format(new Date(iso)));
export const easternDateTime = (iso) => clean(dateTimeFmt.format(new Date(iso)));
export const humanDate = (ymd) => clean(humanFmt.format(new Date(`${ymd}T00:00:00Z`)));
export const todayEastern = (nowMs = Date.now()) => ymdFmt.format(new Date(nowMs));

export function daysUntil(ymd, nowMs = Date.now()) {
  const today = Date.parse(`${todayEastern(nowMs)}T00:00:00Z`);
  return Math.round((Date.parse(`${ymd}T00:00:00Z`) - today) / 86400000);
}
