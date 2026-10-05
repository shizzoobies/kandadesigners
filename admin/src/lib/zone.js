// Dates and times in a named timezone, without a library. Metricool replies
// carry their own timezone (Europe/Madrid on 2026-10-05) whatever the request
// asked for, so times are converted to UTC on the way in and back to the
// site's timezone on the way out.

const formats = new Map();
function parts(ms, timeZone) {
  let fmt = formats.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', weekday: 'short',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    formats.set(timeZone, fmt);
  }
  const out = {};
  for (const p of fmt.formatToParts(new Date(ms))) out[p.type] = p.value;
  return out;
}

// How far the zone's wall clock is ahead of UTC at this instant, in ms.
function offsetMs(ms, timeZone) {
  const p = parts(ms, timeZone);
  const wall = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
  return wall - Math.floor(ms / 1000) * 1000;
}

/** 'YYYY-MM-DDTHH:mm[:ss]' read as wall time in timeZone, as a UTC ISO string. */
export function zonedToUtcIso(dateTime, timeZone) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(String(dateTime ?? ''));
  if (!m) return null;
  const guess = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0));
  let ms = guess - offsetMs(guess, timeZone);
  // Near a DST change the offset at the answer can differ from the guess's.
  const again = guess - offsetMs(ms, timeZone);
  if (again !== ms) ms = again;
  return new Date(ms).toISOString();
}

export function localYmd(ms, timeZone) {
  const p = parts(ms, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

export function localHms(ms, timeZone) {
  const p = parts(ms, timeZone);
  return `${p.hour}:${p.minute}:${p.second}`;
}

export function addDays(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const hourLabel = (h) => (h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`);

/** The weekday and hour a post went out, in the site's timezone. */
export function slotOf(iso, timeZone) {
  const ms = Date.parse(iso ?? '');
  if (!Number.isFinite(ms)) return null;
  const p = parts(ms, timeZone);
  const hour = Number(p.hour);
  return { weekday: p.weekday, hour, label: `${p.weekday} ${hourLabel(hour)}` };
}
