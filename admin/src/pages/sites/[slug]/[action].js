// Every small write on the site page is a plain form POST to here, then a 303
// back to the section it came from. Works with no JavaScript at all.
import * as q from '../../../lib/db.js';
import { parseStatusForm, parseA11yForm, parseText } from '../../../lib/validate.js';
import { todayEastern } from '../../../lib/when.js';

const SECTION = { status: 'top', a11y: 'a11y', work: 'work', 'work-done': 'work', log: 'log' };
const YMD = /^\d{4}-\d{2}-\d{2}$/;

const back = (slug, section) => ({ status: 303, location: `/sites/${slug}#${section}` });
const fail = (slug, action, msg) => ({
  status: 303,
  location: `/sites/${slug}?err=${action}&msg=${encodeURIComponent(msg)}#${SECTION[action]}`,
});
const firstError = (errors) => Object.values(errors)[0];

export async function handleAction({ db, slug, action, form, nowMs = Date.now() }) {
  if (!(action in SECTION)) return { status: 404 };
  const site = await q.getSiteBySlug(db, slug);
  if (!site) return { status: 404 };
  const nowIso = new Date(nowMs).toISOString();

  if (action === 'status') {
    const r = parseStatusForm(form);
    if (!r.ok) return fail(slug, action, firstError(r.errors));
    await q.updateSiteStatus(db, site.id, r.values, nowIso);
  } else if (action === 'a11y') {
    const r = parseA11yForm(form);
    if (!r.ok) return fail(slug, action, firstError(r.errors));
    await q.updateSiteA11y(db, site.id, r.values, nowIso);
  } else if (action === 'work') {
    const r = parseText(form, 'text', 200);
    if (!r.ok) return fail(slug, action, r.error);
    await q.addManualWork(db, site.id, r.value, nowIso);
  } else if (action === 'work-done') {
    const raw = String(form.get('id') ?? '');
    if (!/^\d+$/.test(raw) || Number(raw) <= 0) return fail(slug, action, 'That item could not be found.');
    const id = Number(raw);
    await q.setManualWorkDone(db, site.id, id, form.get('done') === '1', nowIso);
  } else if (action === 'log') {
    const r = parseText(form, 'text', 500);
    if (!r.ok) return fail(slug, action, r.error);
    const given = String(form.get('entry_date') ?? '').trim();
    if (given && !YMD.test(given)) return fail(slug, action, 'Use a date.');
    await q.addLog(db, site.id, given || todayEastern(nowMs), r.value, nowIso);
  }
  return back(slug, SECTION[action]);
}

export async function POST({ params, request, locals }) {
  const form = await request.formData();
  const r = await handleAction({ db: locals.runtime.env.DB, slug: params.slug, action: params.action, form });
  if (r.status === 404) return new Response('Not found', { status: 404 });
  return new Response(null, { status: r.status, headers: { Location: r.location } });
}
