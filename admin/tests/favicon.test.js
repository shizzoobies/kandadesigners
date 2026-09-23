import { describe, it, expect } from 'vitest';
import { findIconHref, fetchFavicon } from '../src/lib/favicon.js';

describe('findIconHref', () => {
  it('prefers the apple touch icon, then any icon', () => {
    expect(findIconHref('<link rel="icon" href="/a.png"><link rel="apple-touch-icon" href="/big.png">')).toBe('/big.png');
    expect(findIconHref("<link href='/s.ico' rel='shortcut icon'>")).toBe('/s.ico');
    expect(findIconHref('<link rel="stylesheet" href="/x.css">')).toBeNull();
  });
});

describe('fetchFavicon', () => {
  const png = new Uint8Array([137, 80, 78, 71]);
  it('follows the page link to an image', async () => {
    const fetchImpl = async (url) => {
      if (url === 'https://site.test/') return new Response('<link rel="icon" href="/i.png">', { headers: { 'content-type': 'text/html' } });
      if (url === 'https://site.test/i.png') return new Response(png, { headers: { 'content-type': 'image/png' } });
      return new Response('', { status: 404 });
    };
    const icon = await fetchFavicon('https://site.test/', fetchImpl);
    expect(icon.contentType).toBe('image/png');
    expect(icon.bytes.byteLength).toBe(4);
  });
  it('falls back to /favicon.ico and refuses non-images', async () => {
    const fetchImpl = async (url) => (url.endsWith('/favicon.ico')
      ? new Response('<html>', { headers: { 'content-type': 'text/html' } })
      : new Response('<p>no links</p>', { headers: { 'content-type': 'text/html' } }));
    expect(await fetchFavicon('https://site.test/', fetchImpl)).toBeNull();
  });
});
