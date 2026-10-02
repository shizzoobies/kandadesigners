// "Sync sign-in list now": retries the Cloudflare Access group sync, then back
// to People, which shows how it went. A plain form post (checkOrigin covers it).
// Owner only, here as well as in the middleware.
import { syncAccessGroup } from '../../lib/access-sync.js';

export async function POST({ locals }) {
  if (locals.user?.role !== 'owner') return new Response('Not authorized.', { status: 403 });
  const env = locals.runtime.env;
  await syncAccessGroup({ db: env.DB, env });
  return new Response(null, { status: 303, headers: { Location: '/people?synced=1' } });
}
