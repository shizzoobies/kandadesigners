// Ticks or unticks a Story on the checklist once Alex has posted it by hand.
// Same write rules as decide.js; answered with the saved row.
import { getSiteBySlug } from '../../../../lib/db.js';
import * as desk from '../../../../lib/desk.js';

export async function handleCheck({ db, slug, user, request, nowMs = Date.now() }) {
  const w = await desk.readWrite({ request, user });
  if (!w.ok) return w;
  const site = await getSiteBySlug(db, slug);
  if (!site) return { status: 404, body: { error: 'Not found' } };
  const r = desk.parseCheckBody(w.body);
  if (!r.ok) return { status: 400, body: { error: r.error } };
  const item = await desk.findDeskItem(db, site.id, 'stories', r.values.item_id);
  if (!item) return { status: 404, body: { error: 'That Story is no longer on the checklist.' } };

  const row = await desk.saveCheck(db, site.id, item.item_id, r.values.posted, user.id, new Date(nowMs).toISOString());
  return { status: 200, body: row };
}

export async function POST({ params, request, locals }) {
  const r = await handleCheck({ db: locals.runtime.env.DB, slug: params.slug, user: locals.user, request });
  return desk.jsonResponse(r.status, r.body);
}
