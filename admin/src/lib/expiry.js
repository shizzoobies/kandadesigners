// Certificate and domain expiry. A Worker's fetch cannot see the peer
// certificate, so the certificate date comes from public certificate
// transparency logs (Cert Spotter and crt.sh; crt.sh can lag a renewal by
// weeks, so the later of the two wins), and the domain date from RDAP, WHOIS's
// successor.
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

export function parseCertSpotter(issuances, host) {
  let best = null;
  for (const e of issuances ?? []) {
    if (!(e.dns_names ?? []).some((n) => covers(n, host))) continue;
    const day = String(e.not_after ?? '').slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && (!best || day > best)) best = day;
  }
  return best;
}

export function parseRdap(json) {
  const event = (json?.events ?? []).find((e) => e.eventAction === 'expiration');
  return event ? String(event.eventDate).slice(0, 10) : null;
}

// RDAP servers (rdap.org answers 403) refuse requests that do not say who they are.
const USER_AGENT = 'ka-sites-checker/1.0 (+https://ka-performancefl.com)';

async function certSpotterExpiry(host, fetchImpl) {
  const res = await fetchImpl(`https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(host)}&include_subdomains=false&expand=dns_names`, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`certspotter_${res.status}`);
  return parseCertSpotter(await res.json(), host);
}

async function crtShExpiry(host, fetchImpl) {
  const res = await fetchImpl(`https://crt.sh/?q=${encodeURIComponent(host)}&output=json&exclude=expired`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`crtsh_${res.status}`);
  return parseCrtSh(await res.json(), host);
}

// Asks both logs and keeps the later date. Throws only when both lookups fail.
export async function lookupCertExpiry(host, fetchImpl = fetch) {
  const results = await Promise.allSettled([certSpotterExpiry(host, fetchImpl), crtShExpiry(host, fetchImpl)]);
  const days = results.filter((r) => r.status === 'fulfilled' && r.value).map((r) => r.value);
  if (days.length) return days.sort().at(-1);
  const failures = results.filter((r) => r.status === 'rejected').map((r) => r.reason?.message);
  if (failures.length === results.length) throw new Error(failures.join(', '));
  return null;
}

export async function lookupDomainExpiry(domain, fetchImpl = fetch) {
  const res = await fetchImpl(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
    headers: { Accept: 'application/rdap+json', 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`rdap_${res.status}`);
  return parseRdap(await res.json());
}
