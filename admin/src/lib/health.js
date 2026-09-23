// The health light. One pure function shared by the dashboard and the checker,
// so the screen and the alert emails can never disagree.
//
// Order matters and the first match wins: red, gray, amber, green. Check-based
// red needs fresh checks, so a stalled checker reads gray rather than "down";
// an expiry within 7 days is red regardless, because that fact does not go stale.
import { daysUntil, easternTime } from './when.js';

export const FRESH_MS = 45 * 60 * 1000;
export const SLOW_MS = 3000;
export const LEVEL_RANK = { red: 0, amber: 1, gray: 2, green: 3 };

function soonestExpiry(site, nowMs) {
  const found = [];
  if (site.cert_expires_on) found.push({ label: 'Cert', days: daysUntil(site.cert_expires_on, nowMs) });
  if (site.domain_expires_on) found.push({ label: 'Domain', days: daysUntil(site.domain_expires_on, nowMs) });
  found.sort((a, b) => a.days - b.days);
  return found[0] ?? null;
}

function expiryReason({ label, days }) {
  if (days < 0) return `${label} expired`;
  if (days === 0) return `${label} expires today`;
  if (days === 1) return `${label} expires tomorrow`;
  return `${label} expires in ${days} days`;
}

export function computeLevel(site, checks, nowMs) {
  const expiry = soonestExpiry(site, nowMs);
  if (expiry && expiry.days <= 7) return { level: 'red', reason: expiryReason(expiry) };

  const latest = checks[0];
  if (!latest) return { level: 'gray', reason: 'Not checked yet' };
  if (nowMs - Date.parse(latest.checked_at) > FRESH_MS) return { level: 'gray', reason: 'No recent check' };

  if (!latest.ok) {
    let failures = 0;
    let firstFailure = latest;
    for (const check of checks) {
      if (check.ok) break;
      failures += 1;
      firstFailure = check;
    }
    if (failures >= 2) return { level: 'red', reason: `Down since ${easternTime(firstFailure.checked_at)}` };
    return { level: 'amber', reason: 'Last check failed' };
  }

  if (latest.ms != null && latest.ms > SLOW_MS) {
    return { level: 'amber', reason: `Slow: ${(latest.ms / 1000).toFixed(1)} s` };
  }
  if (expiry && expiry.days <= 30) return { level: 'amber', reason: expiryReason(expiry) };
  return { level: 'green', reason: 'Up' };
}
