import { describe, it, expect } from 'vitest';
import { uptimePercent, hourlyAverages, sparklinePath } from '../src/lib/sparkline.js';
import { logoSrc, initials, buildCards, filterCards } from '../src/lib/view.js';
import { storeLogo } from '../src/lib/logo.js';

describe('sparkline helpers', () => {
  it('computes uptime to one decimal', () => {
    expect(uptimePercent([])).toBeNull();
    expect(uptimePercent([{ ok: 1 }, { ok: 1 }, { ok: 0 }])).toBe(66.7);
  });
  it('averages response time by hour, oldest first', () => {
    const checks = [
      { checked_at: '2026-09-23T11:45:00Z', ms: 300 },
      { checked_at: '2026-09-23T11:00:00Z', ms: 100 },
      { checked_at: '2026-09-23T10:30:00Z', ms: 50 },
      { checked_at: '2026-09-23T10:15:00Z', ms: null },
    ];
    expect(hourlyAverages(checks)).toEqual([50, 200]);
  });
  it('draws a path scaled to the box', () => {
    expect(sparklinePath([1], 100, 20)).toBeNull();
    expect(sparklinePath([0, 10], 100, 20)).toBe('M0.0,20.0 L100.0,0.0');
  });
});

describe('view helpers', () => {
  it('prefers the uploaded logo, then the favicon', () => {
    expect(logoSrc({ logo_key: 'logos/a.png', favicon_key: 'favicons/a' })).toBe('/logos/logos/a.png');
    expect(logoSrc({ logo_key: null, favicon_key: 'favicons/a' })).toBe('/logos/favicons/a');
    expect(logoSrc({ logo_key: null, favicon_key: null })).toBeNull();
  });
  it('makes initials', () => {
    expect(initials('MBS Medicine')).toBe('MM');
    expect(initials("David's BBQ")).toBe('DB');
    expect(initials('Synovial')).toBe('S');
  });

  const NOW = Date.parse('2026-09-23T18:00:00Z');
  const fresh = new Date(NOW - 5 * 60000).toISOString();
  const s = (id, name, project_status = 'live') => ({ id, name, project_status, cert_expires_on: null, domain_expires_on: null });
  const sites = [s(1, 'Zed'), s(2, 'Alpha'), s(3, 'Mid', 'paused'), s(4, 'Beta')];
  const checks = new Map([
    [1, [{ checked_at: fresh, ok: 0 }, { checked_at: fresh, ok: 0 }]],
    [2, [{ checked_at: fresh, ok: 1, ms: 100 }]],
    [3, [{ checked_at: fresh, ok: 0 }]],
  ]);
  const cards = buildCards(sites, checks, new Map([[2, 3]]), NOW);

  it('sorts worst first, then by name, with open work counts', () => {
    expect(cards.map((c) => [c.site.name, c.level, c.openWork])).toEqual([
      ['Zed', 'red', 0], ['Mid', 'amber', 0], ['Beta', 'gray', 0], ['Alpha', 'green', 3],
    ]);
  });
  it('filters by problems or a project status', () => {
    expect(filterCards(cards, 'all')).toHaveLength(4);
    expect(filterCards(cards, 'problems').map((c) => c.site.name)).toEqual(['Zed', 'Mid', 'Beta']);
    expect(filterCards(cards, 'paused').map((c) => c.site.name)).toEqual(['Mid']);
    expect(filterCards(cards, 'nonsense')).toHaveLength(4);
  });
});

describe('storeLogo', () => {
  it('names the object by slug and content hash and keeps the type', async () => {
    const put = [];
    const bucket = { async put(key, body, opts) { put.push({ key, opts }); } };
    const file = new File([new TextEncoder().encode('logo')], 'a.png', { type: 'image/png' });
    const key = await storeLogo(bucket, 'mbs-medicine', file, 'png');
    expect(key).toMatch(/^logos\/mbs-medicine-[0-9a-f]{8}\.png$/);
    expect(put[0].opts.httpMetadata.contentType).toBe('image/png');
  });
});
