// ka-sites-checker: every network check the dashboard shows, on one cron.
//
// A separate Worker from ka-admin because the Astro adapter generates that
// Worker's entry point; a scheduled handler bolted onto generated code breaks
// between adapter versions. It imports the same lib modules, so the light it
// alerts on is the light the dashboard shows.
//
// One cron, every 15 minutes. Inside a run: uptime always; GitHub on the run
// at minute 0; expiry, favicons and pruning once a day at 10:00 UTC; alert
// evaluation last, every run. Every job is isolated: one failure is logged and
// the rest carry on, and a job that never succeeds leaves stored values to age
// into gray rather than pretending to be green.
import * as q from '../src/lib/db.js';
import { computeLevel } from '../src/lib/health.js';
import { decideAlert, alertEmail, sendEmail } from '../src/lib/alerts.js';
import { fetchOpenWork, reconcileGithub } from '../src/lib/github.js';
import { hostFromUrl, ownDomain, lookupCertExpiry, lookupDomainExpiry } from '../src/lib/expiry.js';
import { fetchFavicon } from '../src/lib/favicon.js';

const UPTIME_TIMEOUT_MS = 10000;
const KEEP_CHECKS_MS = 30 * 86400000;
const CHECKS_FOR_LEVEL = 12;

export async function checkUptime(site, fetchImpl = fetch, nowFn = Date.now) {
  const started = nowFn();
  try {
    const res = await fetchImpl(site.live_url, {
      redirect: 'follow',
      cache: 'no-store',
      headers: { 'User-Agent': 'K&A sites checker (+https://ka-performancefl.com)' },
      signal: AbortSignal.timeout(UPTIME_TIMEOUT_MS),
    });
    const ms = nowFn() - started;
    await res.body?.cancel();
    return { ok: res.status >= 200 && res.status < 400, http_status: res.status, ms, error: null };
  } catch (err) {
    const error = err?.name === 'TimeoutError' ? 'timeout' : String(err?.message ?? err).slice(0, 200);
    return { ok: false, http_status: null, ms: null, error };
  }
}

export async function runChecker({ env, nowMs = Date.now(), fetchImpl = fetch, log = console }) {
  const DB = env.DB;
  const nowIso = new Date(nowMs).toISOString();
  const when = new Date(nowMs);
  const errors = [];
  const note = (job, err) => {
    const message = `${job}: ${err?.message ?? err}`;
    errors.push(message);
    log.error(message);
  };

  const sites = await q.listSites(DB);

  const uptime = await Promise.allSettled(sites.map(async (site) => {
    const result = await checkUptime(site, fetchImpl);
    await q.insertCheck(DB, { site_id: site.id, checked_at: nowIso, ...result });
  }));
  uptime.forEach((r, i) => { if (r.status === 'rejected') note(`uptime ${sites[i].slug}`, r.reason); });

  if (when.getUTCMinutes() < 15) {
    if (!env.GITHUB_TOKEN) log.warn('github: no GITHUB_TOKEN, skipped');
    else {
      for (const site of sites.filter((s) => s.repo)) {
        try {
          const fetched = await fetchOpenWork(site.repo, env.GITHUB_TOKEN, fetchImpl);
          const plan = reconcileGithub(await q.listGithubItems(DB, site.id), fetched);
          await q.applyGithubPlan(DB, site.id, plan, nowIso);
          await q.setGithubSynced(DB, site.id, nowIso);
        } catch (err) {
          note(`github ${site.slug}`, err);
        }
      }
    }
  }

  if (when.getUTCHours() === 10 && when.getUTCMinutes() < 15) {
    for (const site of sites) {
      try {
        const cert = await lookupCertExpiry(hostFromUrl(site.live_url), fetchImpl);
        if (cert) await q.setSiteExpiry(DB, site.id, { cert_expires_on: cert }, nowIso);
      } catch (err) {
        note(`cert ${site.slug}`, err);
      }
      const domain = ownDomain(site);
      if (domain) {
        try {
          const expires = await lookupDomainExpiry(domain, fetchImpl);
          if (expires) await q.setSiteExpiry(DB, site.id, { domain_expires_on: expires }, nowIso);
        } catch (err) {
          note(`domain ${site.slug}`, err);
        }
      }
      if (env.LOGOS && !site.logo_key && !site.favicon_key) {
        try {
          const icon = await fetchFavicon(site.live_url, fetchImpl);
          if (icon) {
            const key = `favicons/${site.slug}`;
            await env.LOGOS.put(key, icon.bytes, { httpMetadata: { contentType: icon.contentType } });
            await q.setSiteFavicon(DB, site.id, key, nowIso);
          }
        } catch (err) {
          note(`favicon ${site.slug}`, err);
        }
      }
    }
    try {
      await q.pruneChecks(DB, new Date(nowMs - KEEP_CHECKS_MS).toISOString());
    } catch (err) {
      note('prune', err);
    }
  }

  try {
    const fresh = await q.listSites(DB);
    const checksBySite = await q.latestChecksForAll(DB, CHECKS_FOR_LEVEL);
    const states = await q.allAlertStates(DB);
    for (const site of fresh) {
      const { level, reason } = computeLevel(site, checksBySite.get(site.id) ?? [], nowMs);
      const prev = states.get(site.id);
      let lastAlertLevel = prev?.last_alert_level ?? null;
      let lastAlertAt = prev?.last_alert_at ?? null;
      const kind = decideAlert(lastAlertLevel, level);
      if (kind && env.RESEND_API_KEY) {
        try {
          const mail = alertEmail(kind, site, reason, env.ADMIN_URL);
          await sendEmail({ apiKey: env.RESEND_API_KEY, from: env.ALERT_FROM, to: env.ALERT_TO, ...mail }, fetchImpl);
          lastAlertLevel = level;
          lastAlertAt = nowIso;
        } catch (err) {
          note(`alert ${site.slug}`, err);
        }
      }
      await q.upsertAlertState(DB, {
        site_id: site.id,
        level,
        since: prev && prev.level === level ? prev.since : nowIso,
        last_alert_level: lastAlertLevel,
        last_alert_at: lastAlertAt,
      });
    }
  } catch (err) {
    note('alerts', err);
  }

  return { checked: sites.length, errors };
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runChecker({ env, nowMs: event.scheduledTime }));
  },
};
