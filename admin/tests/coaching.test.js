import { describe, it, expect } from 'vitest';
import {
  currentWeek, capCounts, weekTenDue, staleMembers, CAPS, ARC_TIERS,
} from '../src/lib/coaching.js';

// Row factory, same spread-override pattern as digest.test.js's board().
const member = (over = {}) => ({
  id: 1,
  client_name: 'Test Client',
  tier: 'launch',
  status: 'active',
  started_on: '2026-08-01',
  week10_offered_on: null,
  last_session_on: null,
  ...over,
});

describe('currentWeek', () => {
  it('is 0 before the start date', () => {
    expect(currentWeek('2026-09-01', '2026-08-28')).toBe(0);
  });
  it('is week 1 on the start date itself', () => {
    expect(currentWeek('2026-08-01', '2026-08-01')).toBe(1);
  });
  it('is still week 1 six days in', () => {
    expect(currentWeek('2026-08-01', '2026-08-07')).toBe(1);
  });
  it('rolls to week 2 on day seven', () => {
    expect(currentWeek('2026-08-01', '2026-08-08')).toBe(2);
  });
  it('reaches week 10 at day 63', () => {
    expect(currentWeek('2026-08-01', '2026-10-03')).toBe(10);
  });
  it('finishes week 12 on day 83', () => {
    expect(currentWeek('2026-08-01', '2026-10-23')).toBe(12);
  });
  it('keeps counting past 12 so overruns are visible', () => {
    expect(currentWeek('2026-08-01', '2026-10-24')).toBe(13);
  });
  it('is 0 when started_on is missing', () => {
    expect(currentWeek(null, '2026-08-28')).toBe(0);
    expect(currentWeek('', '2026-08-28')).toBe(0);
  });
});

describe('capCounts', () => {
  it('counts only active members against the caps', () => {
    const c = capCounts([
      member({ tier: 'core' }),
      member({ tier: 'core', status: 'ended' }),
      member({ tier: 'advisory' }),
      member({ tier: 'advisory', status: 'paused' }),
      member({ tier: 'launch' }),
      member({ tier: 'launch_site' }),
    ]);
    expect(c.core).toBe(1);
    expect(c.advisory).toBe(1);
    expect(c.arc).toBe(2);
  });
  it('caps come from the business plan', () => {
    expect(CAPS.core).toBe(40);
    expect(CAPS.advisory).toBe(8);
  });
});

describe('weekTenDue', () => {
  const today = '2026-10-03'; // week 10 for a 2026-08-01 start
  it('fires for a launch member entering week 10 with no offer made', () => {
    expect(weekTenDue([member()], today)).toHaveLength(1);
  });
  it('covers both arc tiers and only arc tiers', () => {
    const rows = weekTenDue(
      ARC_TIERS.map((t, i) => member({ id: i, tier: t }))
        .concat([member({ id: 9, tier: 'core' }), member({ id: 10, tier: 'advisory' })]),
      today
    );
    expect(rows.map((m) => m.tier).sort()).toEqual([...ARC_TIERS].sort());
  });
  it('stays quiet before week 10', () => {
    expect(weekTenDue([member()], '2026-10-02')).toHaveLength(0);
  });
  it('stays quiet once the offer is marked', () => {
    expect(weekTenDue([member({ week10_offered_on: '2026-10-03' })], today)).toHaveLength(0);
  });
  it('keeps firing in weeks 11 and 12 until the offer is made', () => {
    expect(weekTenDue([member()], '2026-10-20')).toHaveLength(1);
  });
  it('ignores non-active members', () => {
    expect(weekTenDue([member({ status: 'paused' })], today)).toHaveLength(0);
  });
});

describe('staleMembers', () => {
  it('fires at eight quiet days for a launch member', () => {
    const rows = staleMembers([member({ last_session_on: '2026-08-20' })], '2026-08-28');
    expect(rows).toHaveLength(1);
    expect(rows[0].days_quiet).toBe(8);
  });
  it('stays quiet at seven days: weekly cadence with a day of grace', () => {
    expect(staleMembers([member({ last_session_on: '2026-08-21' })], '2026-08-28')).toHaveLength(0);
  });
  it('counts from started_on when no session was ever logged', () => {
    const rows = staleMembers([member({ started_on: '2026-08-01' })], '2026-08-28');
    expect(rows).toHaveLength(1);
  });
  it('gives Core its monthly leash', () => {
    const m = member({ tier: 'core', last_session_on: '2026-08-01' });
    expect(staleMembers([m], '2026-08-28')).toHaveLength(0);
    expect(staleMembers([m], '2026-09-08')).toHaveLength(1);
  });
  it('holds Advisory to the weekly cadence', () => {
    expect(staleMembers([member({ tier: 'advisory', last_session_on: '2026-08-20' })], '2026-08-28')).toHaveLength(1);
  });
  it('ignores members who have not started yet', () => {
    expect(staleMembers([member({ started_on: '2026-09-15' })], '2026-08-28')).toHaveLength(0);
  });
  it('ignores paused and completed members', () => {
    expect(staleMembers([member({ status: 'paused', last_session_on: '2026-01-01' })], '2026-08-28')).toHaveLength(0);
  });
});
