import { describe, it, expect } from 'vitest';
import { findIconHref, fetchFavicon } from '../src/lib/favicon.js';

describe('findIconHref', () => {
  it('prefers the apple touch icon, then any icon', () => {
    expect(findIconHref('<link rel="icon" href="/a.png"><link rel="apple-touch-icon" href="/big.png">')).toBe('/big.png');
    expect(findIconHref("<link href='/s.ico' rel='shortcut icon'>")).toBe('/s.ico');
    expect(findIconHref('<link rel="stylesheet" href="/x.css">')).toBeNull();
  });
  it('keeps the other kind of quote inside an attribute (an inline SVG icon)', () => {
    const uri = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E";
    expect(findIconHref(`<link rel="icon" href="${uri}">`)).toBe(uri);
    expect(findIconHref(`<link rel='icon' href='/a "b".png'>`)).toBe('/a "b".png');
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
  it('refuses an SVG that is cut off, so a broken icon is never stored', async () => {
    const fetchImpl = async (url) => (url === 'https://site.test/'
      ? new Response('<link rel="icon" href="/i.svg">', { headers: { 'content-type': 'text/html' } })
      : new Response('<svg xmlns=', { headers: { 'content-type': 'image/svg+xml' } }));
    expect(await fetchFavicon('https://site.test/', fetchImpl)).toBeNull();
  });
  it('accepts a whole inline SVG icon', async () => {
    const uri = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E";
    const fetchImpl = async (url) => (url === 'https://site.test/'
      ? new Response(`<link rel="icon" href="${uri}">`, { headers: { 'content-type': 'text/html' } })
      : url === uri
        ? new Response("<svg xmlns='http://www.w3.org/2000/svg'></svg>", { headers: { 'content-type': 'image/svg+xml' } })
        : new Response('', { status: 404 }));
    const icon = await fetchFavicon('https://site.test/', fetchImpl);
    expect(icon.contentType).toBe('image/svg+xml');
  });
});
