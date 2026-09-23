// Health history for the site page: 30 days of 15-minute checks is 2,880
// points, so the sparkline plots hourly averages instead.

export function uptimePercent(checks) {
  if (!checks.length) return null;
  const up = checks.filter((c) => c.ok).length;
  return Math.round((up / checks.length) * 1000) / 10;
}

export function hourlyAverages(checks) {
  const buckets = new Map();
  for (const c of checks) {
    if (c.ms == null) continue;
    const hour = c.checked_at.slice(0, 13);
    const b = buckets.get(hour) ?? [0, 0];
    b[0] += c.ms;
    b[1] += 1;
    buckets.set(hour, b);
  }
  return [...buckets.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, b]) => b[0] / b[1]);
}

export function sparklinePath(values, width, height) {
  const pts = values.filter(Number.isFinite);
  if (pts.length < 2) return null;
  const min = Math.min(...pts);
  const span = Math.max(...pts) - min || 1;
  const step = width / (pts.length - 1);
  return pts
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - ((v - min) / span) * height).toFixed(1)}`)
    .join(' ');
}
