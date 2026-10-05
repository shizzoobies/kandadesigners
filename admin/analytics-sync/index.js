// ka-analytics-sync: Metricool's numbers into ka-attribution.
//
// A separate Worker from ka-admin for the checker's reason: the Astro adapter
// generates the admin's entry point. The cron fires every 10 minutes from
// 07:00 to 08:50 UTC (3:00 to 4:50 AM Eastern). Each run syncs the one site
// that has not had a cron sync today, so a run stays far below the
// per-invocation subrequest limits however many sites there are (up to twelve
// a night). The admin's "Sync now" reaches the fetch handler through the
// ANALYTICS_SYNC service binding. There is no route, and workers.dev and
// preview URLs are off, so nothing else can reach it.
import { runNightly, runManual } from '../src/lib/analytics-sync.js';

const SLUG = /^[a-z0-9-]+$/;

export async function handleFetch(request, env, deps = {}) {
  const url = new URL(request.url);
  if (request.method !== 'POST' || url.pathname !== '/sync') return new Response('Not found', { status: 404 });
  const slug = url.searchParams.get('site') ?? '';
  if (!SLUG.test(slug)) return Response.json({ error: 'Bad site.' }, { status: 400 });
  const { status, ...body } = await runManual({ env, slug, ...deps });
  return Response.json(body, { status });
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runNightly({ env, nowMs: event.scheduledTime }).then((r) => {
      console.log(JSON.stringify({ event: 'analytics-sync', site: r.site, ok: r.ok ?? null, posts: r.postsSeen ?? 0 }));
    }));
  },
  fetch: (request, env) => handleFetch(request, env),
};
