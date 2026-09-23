// The fallback logo: the site's own icon, found once by the checker and cached
// in R2. Prefers the apple touch icon because it is usually 180px, not 16px.

const MAX_BYTES = 1024 * 1024;
const TIMEOUT_MS = 10000;

export function findIconHref(html) {
  const ranked = [];
  for (const tag of String(html).match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] ?? '').toLowerCase();
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    if (rel.includes('apple-touch-icon')) ranked.push([0, href]);
    else if (rel.split(/\s+/).includes('icon')) ranked.push([1, href]);
  }
  ranked.sort((a, b) => a[0] - b[0]);
  return ranked[0]?.[1] ?? null;
}

export async function fetchFavicon(liveUrl, fetchImpl = fetch) {
  let href = '/favicon.ico';
  try {
    const page = await fetchImpl(liveUrl, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (page.ok) href = findIconHref(await page.text()) ?? href;
  } catch {
    // Fall through to /favicon.ico.
  }
  const res = await fetchImpl(new URL(href, liveUrl).toString(), { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) return null;
  const contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim();
  if (!contentType.startsWith('image/')) return null;
  const bytes = await res.arrayBuffer();
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return null;
  return { bytes, contentType };
}
