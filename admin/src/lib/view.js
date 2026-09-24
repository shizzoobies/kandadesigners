// Shaping stored rows for the screens. No Astro here, so it is unit-tested.
import { computeLevel, LEVEL_RANK } from './health.js';
import { PROJECT_STATUS } from './enums.js';

export function logoSrc(site) {
  const key = site.logo_key || site.favicon_key;
  return key ? `/logos/${key}` : null;
}

export function initials(name) {
  return String(name)
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z0-9]/g, '')[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function buildCards(sites, checksBySite, openCounts, nowMs) {
  // checksBySite lists each site's checks newest first, as computeLevel requires.
  return sites
    .map((site) => ({
      site,
      ...computeLevel(site, checksBySite.get(site.id) ?? [], nowMs),
      openWork: openCounts.get(site.id) ?? 0,
    }))
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || a.site.name.localeCompare(b.site.name));
}

export function filterCards(cards, show) {
  if (show === 'problems') return cards.filter((c) => c.level !== 'green');
  if (PROJECT_STATUS.includes(show)) return cards.filter((c) => c.site.project_status === show);
  return cards;
}
