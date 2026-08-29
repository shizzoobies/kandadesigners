import { describe, it, expect } from 'vitest';
import { renderNewsletter, unsubscribeUrl } from '../src/lib/newsletter.js';

describe('renderNewsletter', () => {
  const base = { subject: 'One useful thing', body: 'First paragraph.\n\nSecond one,\nwith a line break.', token: 'tok123abc' };

  it('carries the per-lead unsubscribe link in html and text', () => {
    const { html, text } = renderNewsletter(base);
    const url = unsubscribeUrl('tok123abc');
    expect(html).toContain(url);
    expect(text).toContain(url);
  });

  it('splits paragraphs on blank lines and keeps line breaks inside them', () => {
    const { html } = renderNewsletter(base);
    expect(html.match(/<p style/g)?.length).toBeGreaterThanOrEqual(3); // kicker + 2 body + footer
    expect(html).toContain('with a line break');
    expect(html).toContain('<br>');
  });

  it('escapes html in subject and body: a lead cannot inject markup via a reply-quoted send', () => {
    const { html } = renderNewsletter({ subject: '<script>x</script>', body: 'a <b>bold</b> claim', token: 't12345678' });
    expect(html).not.toContain('<script>x');
    expect(html).not.toContain('<b>bold</b>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('contains no em dashes of its own: the house rule holds in email', () => {
    const { html, text } = renderNewsletter(base);
    expect(html.includes('—')).toBe(false);
    expect(text.includes('—')).toBe(false);
  });

  it('url-encodes the token', () => {
    expect(unsubscribeUrl('a b')).toContain('t=a%20b');
  });

  it('includes both html and text bodies, deliverability 101', () => {
    const { html, text } = renderNewsletter(base);
    expect(html).toContain('<!doctype html>');
    expect(text).toContain('First paragraph.');
  });
});
