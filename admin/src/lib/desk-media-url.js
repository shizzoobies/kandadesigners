// Turns a desk media key ("<slug>/<item>/<file>") into the page's URL for it.
// Shared by the client script and its test; kept apart from desk.js so the
// browser bundle carries none of the server code. `v` (size and mtime, written
// by Claude's push) changes whenever the file does, so a replaced file is never
// served from the browser's cache; the media route ignores the query string.

export function deskMediaUrl(slug, key, v) {
  if (typeof key !== 'string' || !key.startsWith(`${slug}/`)) return '';
  const url = `/sites/${slug}/social/media/${key.slice(slug.length + 1)}`;
  return v ? `${url}?v=${encodeURIComponent(v)}` : url;
}
