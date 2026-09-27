import { describe, it, expect } from 'vitest';
import { hostFromUrl, ownDomain, parseCrtSh, parseCertSpotter, parseRdap, lookupCertExpiry, lookupDomainExpiry } from '../src/lib/expiry.js';

describe('domains', () => {
  it('derives the host and the registrable domain', () => {
    expect(hostFromUrl('https://www.MBSDOC.com/path')).toBe('www.mbsdoc.com');
    expect(ownDomain({ live_url: 'https://www.mbsdoc.com', domain: null })).toBe('mbsdoc.com');
    expect(ownDomain({ live_url: 'https://admin.ka-performancefl.com', domain: null })).toBe('ka-performancefl.com');
  });
  it('skips platform hostnames and honors an override', () => {
    expect(ownDomain({ live_url: 'https://foremotion-soon.pages.dev', domain: null })).toBeNull();
    expect(ownDomain({ live_url: 'https://x.workers.dev', domain: null })).toBeNull();
    expect(ownDomain({ live_url: 'https://shop.example.co.uk', domain: 'example.co.uk' })).toBe('example.co.uk');
  });
});

describe('parseCrtSh', () => {
  const entries = [
    { name_value: 'mbsdoc.com\nwww.mbsdoc.com', not_after: '2026-11-20T23:59:59' },
    { name_value: '*.mbsdoc.com', not_after: '2026-12-15T12:00:00' },
    { name_value: 'other.com', not_after: '2027-06-01T00:00:00' },
  ];
  it('takes the latest not_after among certificates that cover the host', () => {
    expect(parseCrtSh(entries, 'www.mbsdoc.com')).toBe('2026-12-15');
    expect(parseCrtSh(entries, 'mbsdoc.com')).toBe('2026-11-20');
  });
  it('does not let a wildcard cover two levels down', () => {
    expect(parseCrtSh(entries, 'a.b.mbsdoc.com')).toBeNull();
  });
  it('returns null for nothing useful', () => {
    expect(parseCrtSh([], 'x.com')).toBeNull();
    expect(parseCrtSh(null, 'x.com')).toBeNull();
  });
});

describe('parseRdap', () => {
  it('reads the expiration event', () => {
    expect(parseRdap({ events: [{ eventAction: 'registration', eventDate: '2020-01-01T00:00:00Z' }, { eventAction: 'expiration', eventDate: '2027-03-01T12:00:00Z' }] }))
      .toBe('2027-03-01');
    expect(parseRdap({ events: [] })).toBeNull();
  });
});

describe('lookups', () => {
  const json = (body, status = 200) => async () => new Response(JSON.stringify(body), { status });
  it('calls crt.sh and RDAP and parses the answers', async () => {
    expect(await lookupCertExpiry('mbsdoc.com', json([{ name_value: 'mbsdoc.com', not_after: '2026-11-20T00:00:00' }]))).toBe('2026-11-20');
    expect(await lookupDomainExpiry('mbsdoc.com', json({ events: [{ eventAction: 'expiration', eventDate: '2027-03-01T00:00:00Z' }] }))).toBe('2027-03-01');
  });
  it('throws on a failed response so the caller keeps the stored date', async () => {
    await expect(lookupCertExpiry('x.com', json({}, 502))).rejects.toThrow('crtsh_502');
    await expect(lookupDomainExpiry('x.com', json({}, 404))).rejects.toThrow('rdap_404');
  });
  it('identifies itself to RDAP, which refuses anonymous requests', async () => {
    let headers;
    const fetchImpl = async (url, init) => { headers = new Headers(init.headers); return new Response(JSON.stringify({ events: [] })); };
    await lookupDomainExpiry('x.com', fetchImpl);
    expect(headers.get('user-agent')).toMatch(/ka-performancefl\.com/);
  });
});

describe('certificate logs', () => {
  const certspotter = [
    { dns_names: ['*.mbsdoc.com', 'mbsdoc.com'], not_after: '2026-12-18T16:32:45Z' },
    { dns_names: ['other.com'], not_after: '2027-06-01T00:00:00Z' },
  ];
  const crtsh = [{ name_value: 'mbsdoc.com', not_after: '2026-10-19T23:17:20' }];
  const route = (spotter, crt) => async (url) => {
    if (url.includes('certspotter')) return spotter instanceof Response ? spotter : new Response(JSON.stringify(spotter));
    return crt instanceof Response ? crt : new Response(JSON.stringify(crt));
  };

  it('reads Cert Spotter issuances for the host', () => {
    expect(parseCertSpotter(certspotter, 'mbsdoc.com')).toBe('2026-12-18');
    expect(parseCertSpotter(certspotter, 'www.mbsdoc.com')).toBe('2026-12-18');
    expect(parseCertSpotter(certspotter, 'nope.com')).toBeNull();
    expect(parseCertSpotter(null, 'x.com')).toBeNull();
  });
  it('takes the later date of the two logs, so a lagging log cannot show a renewed certificate as expiring', async () => {
    expect(await lookupCertExpiry('mbsdoc.com', route(certspotter, crtsh))).toBe('2026-12-18');
  });
  it('uses whichever log answers when the other fails', async () => {
    expect(await lookupCertExpiry('mbsdoc.com', route(new Response('', { status: 429 }), crtsh))).toBe('2026-10-19');
    expect(await lookupCertExpiry('mbsdoc.com', route(certspotter, new Response('', { status: 502 })))).toBe('2026-12-18');
  });
});
