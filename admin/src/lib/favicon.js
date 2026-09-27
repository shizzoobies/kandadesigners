// The fallback logo: the site's own icon, found once by the checker and cached
// in R2. Prefers the apple touch icon because it is usually 180px, not 16px.

const MAX_BYTES = 1024 * 1024;
const TIMEOUT_MS = 10000;

// An attribute value runs to its own closing quote, so a double-quoted href can
// hold single quotes (an inline SVG icon like data:image/svg+xml,...xmlns='...').
function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2]) : null;
}

export function findIconHref(html) {
  const ranked = [];
  // A data: URI can only hold '>' percent-encoded, so ending the tag at the first '>' is safe.
  for (const tag of String(html).match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attr(tag, 'rel') ?? '').toLowerCase();
    const href = attr(tag, 'href');
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
  // Icons are stored once and never refetched, so refuse an SVG that is cut off.
  if (contentType === 'image/svg+xml' && !new TextDecoder().decode(bytes).includes('</svg>')) return null;
  return { bytes, contentType };
}
