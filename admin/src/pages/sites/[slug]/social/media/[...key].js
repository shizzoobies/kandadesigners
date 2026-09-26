// Serves Post Desk media from the private DESK_MEDIA bucket. Behind the
// middleware like every route: review copies must never sit at public URLs.
// Range support is required, because Safari will not play an mp4 without it.
// The R2 key is the route's slug plus the rest of the path, so a key can only
// ever name this site's media. The page adds ?v=<size-mtime> to bust the
// browser cache when Claude replaces a file; it is ignored here, since the key
// comes from the path alone.
import { MEDIA_KEY } from '../../../../../lib/desk.js';
import { parseRange } from '../../../../../lib/range.js';

const TYPES = {
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
};

const notFound = () => new Response('Not found', { status: 404 });
const changed = () => new Response('The file changed while it was being read. Try again.', { status: 503, headers: { 'Retry-After': '1' } });

export async function serveDeskMedia({ bucket, slug, key, range }) {
  const full = `${slug}/${key ?? ''}`;
  if (!MEDIA_KEY.test(full)) return notFound();

  const headers = (object, length) => ({
    'Content-Type': object.httpMetadata?.contentType ?? TYPES[full.split('.').pop().toLowerCase()] ?? 'application/octet-stream',
    'Content-Length': String(length),
    'Accept-Ranges': 'bytes',
    ETag: object.httpEtag,
    'Cache-Control': 'private, max-age=3600',
    'Content-Security-Policy': "default-src 'none'",
    'X-Content-Type-Options': 'nosniff',
  });

  if (range) {
    const head = await bucket.head(full);
    if (!head) return notFound();
    const r = parseRange(range, head.size);
    if (r === 'unsatisfiable') {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${head.size}`, 'Accept-Ranges': 'bytes' } });
    }
    // The range was measured against head's object, so read only that object:
    // a failed onlyIf comes back without a body (or null if it was deleted).
    const onlyIf = { etagMatches: head.etag };
    if (r) {
      const length = r.end - r.start + 1;
      const object = await bucket.get(full, { range: { offset: r.start, length }, onlyIf });
      if (!object?.body) return changed();
      return new Response(object.body, {
        status: 206,
        headers: { ...headers(object, length), 'Content-Range': `bytes ${r.start}-${r.end}/${object.size}` },
      });
    }
    const object = await bucket.get(full, { onlyIf });
    if (!object?.body) return changed();
    return new Response(object.body, { headers: headers(object, object.size) });
  }

  const object = await bucket.get(full);
  if (!object) return notFound();
  return new Response(object.body, { headers: headers(object, object.size) });
}

export async function GET({ params, request, locals }) {
  return serveDeskMedia({ bucket: locals.runtime.env.DESK_MEDIA, slug: params.slug, key: params.key, range: request.headers.get('Range') });
}
