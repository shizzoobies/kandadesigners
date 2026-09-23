import { describe, it, expect } from 'vitest';
import { slugify, parseSiteForm, parseStatusForm, parseA11yForm, parseText, checkLogo, MAX_LOGO_BYTES } from '../src/lib/validate.js';

const fd = (obj) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.append(k, v);
  return f;
};

describe('slugify', () => {
  it('makes readable slugs', () => {
    expect(slugify("David's BBQ")).toBe('david-s-bbq');
    expect(slugify('PB&J Strategic Accounting')).toBe('pb-and-j-strategic-accounting');
    expect(slugify('  Café Été  ')).toBe('cafe-ete');
  });
});

describe('parseSiteForm', () => {
  it('accepts the minimum and fills defaults', () => {
    const r = parseSiteForm(fd({ name: 'MBS Medicine', live_url: 'https://mbsdoc.com' }));
    expect(r.ok).toBe(true);
    expect(r.values).toMatchObject({ slug: 'mbs-medicine', hosting: 'other', repo: null, maintainer_id: null, domain: null });
  });

  it('rejects a missing name, a bad URL, a bad repo, an unknown hosting and a bad domain', () => {
    const r = parseSiteForm(fd({ name: '', live_url: 'mbsdoc.com', repo: 'just-a-name', hosting: 'ftp', domain: 'not a domain' }));
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual(['domain', 'hosting', 'live_url', 'name', 'repo']);
  });

  it('keeps an explicit slug and parses the maintainer id', () => {
    const r = parseSiteForm(fd({ name: 'X', live_url: 'https://x.test', slug: 'Custom Slug', maintainer_id: '1' }));
    expect(r.values.slug).toBe('custom-slug');
    expect(r.values.maintainer_id).toBe(1);
  });
});

describe('parseStatusForm', () => {
  it('whitelists the status and limits the note', () => {
    expect(parseStatusForm(fd({ project_status: 'paused', status_note: 'Back in October' })).ok).toBe(true);
    expect(parseStatusForm(fd({ project_status: 'gone', status_note: '' })).errors.project_status).toBeTruthy();
    expect(parseStatusForm(fd({ project_status: 'live', status_note: 'x'.repeat(141) })).errors.status_note).toBeTruthy();
  });
});

describe('parseA11yForm', () => {
  it('treats blanks as unknown and checks the rest', () => {
    expect(parseA11yForm(fd({ a11y_audited_on: '', a11y_open_issues: '', a11y_statement_url: '' })).values)
      .toEqual({ a11y_audited_on: null, a11y_open_issues: null, a11y_statement_url: null });
    const bad = parseA11yForm(fd({ a11y_audited_on: 'yesterday', a11y_open_issues: '-1', a11y_statement_url: 'x' }));
    expect(Object.keys(bad.errors).sort()).toEqual(['a11y_audited_on', 'a11y_open_issues', 'a11y_statement_url']);
  });
});

describe('parseText', () => {
  it('requires text within a limit', () => {
    expect(parseText(fd({ text: ' Fix contrast ' }), 'text', 200)).toEqual({ ok: true, value: 'Fix contrast' });
    expect(parseText(fd({ text: '  ' }), 'text', 200).ok).toBe(false);
    expect(parseText(fd({ text: 'abc' }), 'text', 2).ok).toBe(false);
  });
});

describe('checkLogo', () => {
  it('allows no file, the four image types, and nothing over 1 MB', () => {
    expect(checkLogo(null)).toEqual({ ok: true, ext: null });
    expect(checkLogo(new File([new Uint8Array(0)], 'empty.png', { type: 'image/png' }))).toEqual({ ok: true, ext: null });
    expect(checkLogo(new File([new Uint8Array(10)], 'a.svg', { type: 'image/svg+xml' }))).toEqual({ ok: true, ext: 'svg' });
    expect(checkLogo(new File([new Uint8Array(10)], 'a.gif', { type: 'image/gif' })).ok).toBe(false);
    expect(checkLogo(new File([new Uint8Array(MAX_LOGO_BYTES + 1)], 'a.png', { type: 'image/png' })).ok).toBe(false);
  });
});
