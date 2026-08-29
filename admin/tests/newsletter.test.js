import { describe, it, expect } from 'vitest';
import { renderNewsletter, unsubscribeUrl, parseBlocks, parsePolish } from '../src/lib/newsletter.js';

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

describe('parseBlocks', () => {
  it('treats plain text as paragraphs, the 0004 back-compat path', () => {
    const b = parseBlocks('One.\n\nTwo.');
    expect(b).toHaveLength(2);
    expect(b[0]).toMatchObject({ type: 'paragraph', text: 'One.' });
  });
  it('parses block JSON and drops empty or alien types to paragraphs', () => {
    const b = parseBlocks(JSON.stringify([
      { type: 'heading', text: 'Hi' },
      { type: 'button', text: 'Go', url: 'https://ka-performancefl.com/free-course/' },
      { type: 'divider' },
      { type: 'wat', text: 'odd' },
      { type: 'paragraph', text: '' },
    ]));
    expect(b.map((x) => x.type)).toEqual(['heading', 'button', 'divider', 'paragraph']);
  });
  it('scrubs em dashes out of block text', () => {
    const b = parseBlocks(JSON.stringify([{ type: 'paragraph', text: 'one—two' }]));
    expect(b[0].text).toBe('one, two');
  });
  it('falls back to plain text when the JSON is broken', () => {
    const b = parseBlocks('[not json at all');
    expect(b[0].type).toBe('paragraph');
  });
});

describe('parsePolish', () => {
  it('accepts fenced JSON and normalizes it through parseBlocks', () => {
    const fenced = '```json\n{"subject":"S—T","blocks":[{"type":"paragraph","text":"hi"}]}\n```';
    const out = parsePolish(fenced);
    expect(out.subject).toBe('S, T');
    expect(JSON.parse(out.body)[0].text).toBe('hi');
  });
  it('throws on an empty or shapeless reply rather than saving junk', () => {
    expect(() => parsePolish('{"subject":"","blocks":[]}')).toThrow();
    expect(() => parsePolish('sure, here is your email!')).toThrow();
  });
});

describe('renderNewsletter with blocks', () => {
  it('renders heading, button and divider with the unsubscribe footer intact', () => {
    const body = JSON.stringify([
      { type: 'heading', text: 'The point' },
      { type: 'button', text: 'Take the course', url: 'https://ka-performancefl.com/free-course/' },
      { type: 'divider' },
    ]);
    const { html, text } = renderNewsletter({ subject: 'S', body, token: 'tk12345678' });
    expect(html).toContain('<h2');
    expect(html).toContain('border-radius:999px');
    expect(html).toContain(unsubscribeUrl('tk12345678'));
    expect(text).toContain('Take the course: https://ka-performancefl.com/free-course/');
  });
});
