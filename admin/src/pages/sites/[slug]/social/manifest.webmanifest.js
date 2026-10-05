// Per-site web app manifest for the Post Desk. Served behind the same
// middleware as every desk route so a client only ever sees their own.
import { getSiteBySlug } from '../../../../lib/db.js';
import { listDeskItems, getDeskMeta } from '../../../../lib/desk.js';
import { manifestFor } from '../../../../lib/desk-pwa.js';
import { hasStoriesIn } from '../../../../lib/desk-stories.js';

export async function GET({ params, locals }) {
  const env = locals.runtime.env;
  const site = await getSiteBySlug(env.DB, params.slug);
  if (!site) return new Response('Not found', { status: 404 });

  // The same rule the desk page uses for its Stories tab.
  const [items, meta] = await Promise.all([listDeskItems(env.DB, site.id), getDeskMeta(env.DB, site.id)]);
  const body = JSON.stringify(manifestFor(site, { hasStories: hasStoriesIn({ items, meta }) }));
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'private, max-age=300',
    },
  });
}
