import { describe, it, expect } from 'vitest';
import { computeLevel, LEVEL_RANK } from '../src/lib/health.js';

const NOW = Date.parse('2026-09-23T18:00:00Z');
const at = (minutesAgo) => new Date(NOW - minutesAgo * 60000).toISOString();
const site = (extra = {}) => ({ cert_expires_on: null, domain_expires_on: null, ...extra });
const up = (minutesAgo, ms = 400) => ({ checked_at: at(minutesAgo), ok: 1, ms });
const down = (minutesAgo) => ({ checked_at: at(minutesAgo), ok: 0, ms: null });

describe('computeLevel', () => {
  it('is green when the latest check is fresh, fast and up', () => {
    expect(computeLevel(site(), [up(5)], NOW)).toEqual({ level: 'green', reason: 'Up' });
  });

  it('is gray when there are no checks', () => {
    expect(computeLevel(site(), [], NOW)).toEqual({ level: 'gray', reason: 'Not checked yet' });
  });

  it('is gray when the latest check is older than 45 minutes, even if it failed', () => {
    expect(computeLevel(site(), [down(46), down(61)], NOW)).toEqual({ level: 'gray', reason: 'No recent check' });
  });

  it('is amber after one failed check', () => {
    expect(computeLevel(site(), [down(5), up(20)], NOW)).toEqual({ level: 'amber', reason: 'Last check failed' });
  });

  it('is red after two failed checks in a row, dated from the first failure', () => {
    // at(35) is 17:25 UTC, 1:25 PM Eastern.
    const result = computeLevel(site(), [down(5), down(20), down(35), up(50)], NOW);
    expect(result).toEqual({ level: 'red', reason: 'Down since 1:25 PM' });
  });

  it('is amber when slower than 3 seconds', () => {
    expect(computeLevel(site(), [up(5, 3400)], NOW)).toEqual({ level: 'amber', reason: 'Slow: 3.4 s' });
    expect(computeLevel(site(), [up(5, 3000)], NOW).level).toBe('green');
  });

  it('is red when the certificate expires within 7 days, even with stale checks', () => {
    expect(computeLevel(site({ cert_expires_on: '2026-09-30' }), [], NOW))
      .toEqual({ level: 'red', reason: 'Cert expires in 7 days' });
  });

  it('is amber when the domain expires within 30 days', () => {
    expect(computeLevel(site({ domain_expires_on: '2026-10-23' }), [up(5)], NOW))
      .toEqual({ level: 'amber', reason: 'Domain expires in 30 days' });
    expect(computeLevel(site({ domain_expires_on: '2026-10-24' }), [up(5)], NOW).level).toBe('green');
  });

  it('names the soonest expiry and handles today and the past', () => {
    expect(computeLevel(site({ cert_expires_on: '2026-09-23', domain_expires_on: '2026-09-25' }), [up(5)], NOW).reason)
      .toBe('Cert expires today');
    expect(computeLevel(site({ cert_expires_on: '2026-09-24' }), [up(5)], NOW).reason).toBe('Cert expires tomorrow');
    expect(computeLevel(site({ domain_expires_on: '2026-09-01' }), [up(5)], NOW).reason).toBe('Domain expired');
  });

  it('ranks levels worst first', () => {
    expect(['green', 'gray', 'red', 'amber'].sort((a, b) => LEVEL_RANK[a] - LEVEL_RANK[b]))
      .toEqual(['red', 'amber', 'gray', 'green']);
  });
});
