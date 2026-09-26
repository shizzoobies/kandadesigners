// HTTP Range for the desk's media. Safari will not play an mp4 without it.
// Only a single range is honored; a missing, invalid or multi-range header
// returns null, which means "send the whole file" (RFC 9110 lets a server
// ignore a Range it does not support). A range that starts past the end is
// 'unsatisfiable', which the route answers with 416.

export function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(header ?? '').trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;

  if (m[1] === '') {
    const n = Number(m[2]);
    if (n === 0 || size === 0) return 'unsatisfiable';
    return { start: Math.max(0, size - n), end: size - 1 };
  }

  const start = Number(m[1]);
  if (m[2] !== '' && Number(m[2]) < start) return null;
  if (start >= size) return 'unsatisfiable';
  const end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  return { start, end };
}
