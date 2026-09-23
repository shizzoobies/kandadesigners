// Certificate and domain expiry. A Worker's fetch cannot see the peer
// certificate, so the certificate date comes from public certificate
// transparency logs (crt.sh), and the domain date from RDAP, WHOIS's successor.
// Lookups throw on failure; the checker catches and keeps the stored date, so a
// flaky lookup never turns a site red.

const PLATFORM_SUFFIXES = ['.pages.dev', '.workers.dev', '.netlify.app', '.github.io'];
const TIMEOUT_MS = 20000;

export const hostFromUrl = (url) => new URL(url).hostname.toLowerCase();

export function ownDomain(site) {
  if (site.domain) return site.domain;
  const host = hostFromUrl(site.live_url);
  if (PLATFORM_SUFFIXES.some((s) => host.endsWith(s))) return null;
  return host.replace(/^www\./, '').split('.').slice(-2).join('.');
}

function covers(name, host) {
  const n = name.trim().toLowerCase();
  if (n === host) return true;
  if (!n.startsWith('*.')) return false;
  const rest = n.slice(2);
  return host.endsWith(`.${rest}`) && host.split('.').length === rest.split('.').length + 1;
}

export function parseCrtSh(entries, host) {
  let best = null;
  for (const e of entries ?? []) {
    const names = String(e.name_value ?? '').split('\n');
    if (!names.some((n) => covers(n, host))) continue;
    const day = String(e.not_after ?? '').slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && (!best || day > best)) best = day;
  }
  return best;
}

export function parseRdap(json) {
  const event = (json?.events ?? []).find((e) => e.eventAction === 'expiration');
  return event ? String(event.eventDate).slice(0, 10) : null;
}

export async function lookupCertExpiry(host, fetchImpl = fetch) {
  const res = await fetchImpl(`https://crt.sh/?q=${encodeURIComponent(host)}&output=json&exclude=expired`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`crtsh_${res.status}`);
  return parseCrtSh(await res.json(), host);
}

export async function lookupDomainExpiry(domain, fetchImpl = fetch) {
  const res = await fetchImpl(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
    headers: { Accept: 'application/rdap+json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`rdap_${res.status}`);
  return parseRdap(await res.json());
}
