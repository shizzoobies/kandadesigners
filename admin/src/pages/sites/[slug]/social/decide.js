// Saves a decision on one post, Story or ask (Alex's, or an approve-level
// client's): a JSON POST from the desk page, answered with the saved row.
// See lib/desk.js for the write rules.
import { getSiteBySlug } from '../../../../lib/db.js';
import * as desk from '../../../../lib/desk.js';

export async function handleDecide({ db, slug, user, request, nowMs = Date.now() }) {
  const site = await getSiteBySlug(db, slug);
  if (!site) return { status: 404, body: { error: 'Not found' } };
  const w = await desk.readWrite({ request, user, siteId: site.id });
  if (!w.ok) return w;
  if (!desk.isItemId(w.body.item_id)) return { status: 400, body: { error: 'Pick an item.' } };
  const item = await desk.findDeskItem(db, site.id, 'approve', w.body.item_id);
  if (!item) return { status: 404, body: { error: 'That item is no longer on the desk.' } };

  const existing = await desk.getDecision(db, site.id, item.item_id);
  const r = desk.parseDecideBody(w.body, item, existing);
  if (!r.ok) return { status: 400, body: { error: r.error } };
  const row = await desk.saveDecision(db, site.id, r.values, user.id, new Date(nowMs).toISOString());
  return { status: 200, body: row };
}

export async function POST({ params, request, locals }) {
  const r = await handleDecide({ db: locals.runtime.env.DB, slug: params.slug, user: locals.user, request });
  return desk.jsonResponse(r.status, r.body);
}
