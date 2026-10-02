// The desk's state as JSON, for the page to refresh from on window focus and
// after each write. Runs the purge first (throttled in lib/desk.js). Anyone
// but an owner gets it without K&A's internal fields.
import { getSiteBySlug } from '../../../../lib/db.js';
import * as desk from '../../../../lib/desk.js';

export async function handleState({ db, bucket, slug, nowMs = Date.now(), memo, user }) {
  const site = await getSiteBySlug(db, slug);
  if (!site) return { status: 404, body: { error: 'Not found' } };
  await desk.maybePurge({ db, bucket, site, nowMs, memo });
  return { status: 200, body: await desk.getDeskState(db, site.id, { owner: user?.role === 'owner' }) };
}

export async function GET({ params, locals }) {
  const env = locals.runtime.env;
  const r = await handleState({ db: env.DB, bucket: env.DESK_MEDIA, slug: params.slug, user: locals.user });
  return desk.jsonResponse(r.status, r.body);
}
