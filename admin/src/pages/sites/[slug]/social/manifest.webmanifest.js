// Per-site web app manifest for the Post Desk. Served behind the same
// middleware as every desk route so a client only ever sees their own.
import { getSiteBySlug } from '../../../../lib/db.js';
import { manifestFor } from '../../../../lib/desk-pwa.js';

export async function GET({ params, locals }) {
  const env = locals.runtime.env;
  const site = await getSiteBySlug(env.DB, params.slug);
  if (!site) return new Response('Not found', { status: 404 });

  const body = JSON.stringify(manifestFor(site));
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'private, max-age=300',
    },
  });
}
