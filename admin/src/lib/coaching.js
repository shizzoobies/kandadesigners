// Pure coaching-arc logic: week math, capacity, and the dashboard rule
// selectors. No D1 in here, which is what makes all of it testable the way
// digest/render.js is. The db queries feed these functions plain rows.

import { daysBetween } from './format.js';

export const TIERS = ['launch', 'launch_site', 'core', 'advisory'];

export const TIER_LABELS = {
  launch: '90-Day Launch',
  launch_site: 'Launch + Site',
  core: 'Core membership',
  advisory: 'Advisory membership',
};

// Year-one caps from the business plan. Published scarcity on Advisory is
// deliberate; the counters on /coaching keep the caps honest.
export const CAPS = { core: 40, advisory: 8 };

// Tiers that run the 12-week arc. Memberships have cadence, not weeks.
export const ARC_TIERS = ['launch', 'launch_site'];

/**
 * Which program week a date falls in. Week 1 starts on started_on and weeks
 * roll every 7 days. Returns 0 before the start date, and keeps counting
 * past 12 so callers can tell "week 13" (overran) from "week 12" (finishing).
 *
 * @param {string} startedOn YYYY-MM-DD
 * @param {string} today YYYY-MM-DD, computed in Eastern by the caller
 * @returns {number}
 */
export function currentWeek(startedOn, today) {
  if (!startedOn || today < startedOn) return 0;
  return Math.floor(daysBetween(startedOn, today) / 7) + 1;
}

/** Active-member counts per capped tier, for the roster counters. */
export function capCounts(members) {
  const active = members.filter((m) => m.status === 'active');
  return {
    core: active.filter((m) => m.tier === 'core').length,
    advisory: active.filter((m) => m.tier === 'advisory').length,
    arc: active.filter((m) => ARC_TIERS.includes(m.tier)).length,
  };
}

/**
 * Dashboard rule: Launch members in week 10 or later who have not been
 * offered the membership yet. Week 10 is when they can see what they would
 * lose by stopping, which is why the plan pins the offer there and why this
 * surfaces as a promise rather than sitting in a table nobody rereads.
 */
export function weekTenDue(members, today) {
  return members.filter(
    (m) =>
      m.status === 'active' &&
      ARC_TIERS.includes(m.tier) &&
      !m.week10_offered_on &&
      currentWeek(m.started_on, today) >= 10
  );
}

// A Launch member is on a weekly cadence, so eight days without a logged
// session means one was missed or never written down. Memberships get a
// longer leash: Core is monthly (38 days), Advisory weekly (8 days).
const STALE_DAYS = { launch: 8, launch_site: 8, core: 38, advisory: 8 };

/**
 * Dashboard rule: active members whose last logged session is overdue for
 * their cadence. A member with no sessions at all counts from started_on,
 * which catches "signed but never onboarded" in the same net.
 */
export function staleMembers(members, today) {
  return members
    .filter((m) => m.status === 'active')
    .map((m) => {
      const anchor = m.last_session_on || m.started_on;
      const days = today > anchor ? daysBetween(anchor, today) : 0;
      return { ...m, days_quiet: days };
    })
    .filter((m) => m.days_quiet >= (STALE_DAYS[m.tier] ?? 8));
}
