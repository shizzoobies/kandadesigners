// The Post Desk: queries, write rules and the purge. Social posts, Stories and
// asks sit here only while they wait on Alex; Claude pushes the queue and pulls
// the decisions (see docs/superpowers/specs/2026-09-26-post-desk-design.md).
// Like db.js, the binding is always the first argument so tests run real SQL.
import { todayEastern } from './when.js';
import { canWriteDesk } from './gate.js';

export const DECISIONS = ['waiting', 'approved', 'changes', 'answered'];
export const NOTE_MAX = 2000;
export const ANSWER_MAX = 1000;
export const MEDIA_KEY = /^[a-z0-9-]+\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

const SEGMENT = /^[A-Za-z0-9._-]+$/;
const BODY_MAX = 100000;
const DAY_MS = 86400000;
const ORPHAN_MS = 14 * DAY_MS;
const PURGE_EVERY_MS = 10 * 60000;

const rows = async (stmt) => (await stmt.all()).results ?? [];
const parseJson = (text, fallback) => {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
};
const decodeDecision = (r) => r && { ...r, answers: parseJson(r.answers, {}) };
const decodeCheck = (r) => r && { ...r, posted: r.posted === 1 };

export const isItemId = (v) => typeof v === 'string' && v.length > 0 && v.length <= 200;

export function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// queries

export async function listDeskItems(db, siteId) {
  // rowid keeps the order Claude pushed, which is data.json's order.
  return rows(db.prepare('SELECT * FROM desk_items WHERE site_id = ? ORDER BY rowid').bind(siteId));
}

// Each decision carries decided_by_name, so the desk can say who acted
// ("Approved by Hannah"). Names only: no email ever goes to the page.
const DECISION_SELECT = 'SELECT d.*, p.name AS decided_by_name FROM desk_decisions d LEFT JOIN people p ON p.id = d.decided_by';

export async function listDeskDecisions(db, siteId) {
  return (await rows(db.prepare(`${DECISION_SELECT} WHERE d.site_id = ? ORDER BY d.item_id`).bind(siteId))).map(decodeDecision);
}

export async function listDeskChecks(db, siteId) {
  return (await rows(db.prepare('SELECT * FROM desk_story_checks WHERE site_id = ? ORDER BY item_id').bind(siteId))).map(decodeCheck);
}

export async function getDeskMeta(db, siteId) {
  const m = await db.prepare('SELECT * FROM desk_meta WHERE site_id = ?').bind(siteId).first();
  return m && { ...m, stories_paused: m.stories_paused === 1 };
}

// Fields of a pushed item only K&A needs. They never leave the server for
// anyone but an owner: `scheduled` holds Metricool post ids, and `repost` is
// Alex's own comment for reposting from his personal profile.
const OWNER_ONLY_FIELDS = ['scheduled', 'repost'];

export async function getDeskState(db, siteId, { owner = false } = {}) {
  const [items, decisions, checks, meta] = await Promise.all([
    listDeskItems(db, siteId), listDeskDecisions(db, siteId), listDeskChecks(db, siteId), getDeskMeta(db, siteId),
  ]);
  const payloadOf = (i) => {
    const p = parseJson(i.payload, {});
    if (!owner && p && typeof p === 'object') for (const f of OWNER_ONLY_FIELDS) delete p[f];
    return p;
  };
  return { items: items.map((i) => ({ ...i, payload: payloadOf(i) })), decisions, checks, meta };
}

// What waits on Alex, per site, in one query for the whole sites list: approval
// items with no decision yet or put back to waiting. A change request is on
// Claude, and a post scheduled directly in Facebook has nothing to approve.
// Past-dated items are left out: the desk purges them the moment it opens.
// Sites with nothing waiting are absent from the map; `siteId` narrows it to one.
export async function waitingCounts(db, { today = todayEastern(), siteId = null } = {}) {
  const list = await rows(db.prepare(
    `SELECT i.site_id, COUNT(*) AS n FROM desk_items i
     LEFT JOIN desk_decisions d ON d.site_id = i.site_id AND d.item_id = i.item_id
     WHERE i.list = 'approve' AND i.kind != 'native' AND (d.decision IS NULL OR d.decision = 'waiting')
       AND (i.post_date IS NULL OR i.post_date >= ?) AND (? IS NULL OR i.site_id = ?)
     GROUP BY i.site_id`,
  ).bind(today, siteId, siteId));
  return new Map(list.map((r) => [r.site_id, r.n]));
}

export async function findDeskItem(db, siteId, list, itemId) {
  return db.prepare('SELECT item_id, list, kind, post_date FROM desk_items WHERE site_id = ? AND list = ? AND item_id = ?')
    .bind(siteId, list, itemId).first();
}

export async function getDecision(db, siteId, itemId) {
  return decodeDecision(await db.prepare(`${DECISION_SELECT} WHERE d.site_id = ? AND d.item_id = ?`).bind(siteId, itemId).first());
}

// Any change, Undo included, rewrites the row and clears pulled_at, so Claude's
// next pull reports it again.
export async function saveDecision(db, siteId, v, personId, nowIso) {
  await db.prepare(
    `INSERT INTO desk_decisions (site_id, item_id, decision, note, answers, answer, decided_by, decided_at, pulled_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
     ON CONFLICT(site_id, item_id) DO UPDATE SET decision = excluded.decision, note = excluded.note,
       answers = excluded.answers, answer = excluded.answer, decided_by = excluded.decided_by,
       decided_at = excluded.decided_at, pulled_at = NULL`,
  ).bind(siteId, v.item_id, v.decision, v.note, JSON.stringify(v.answers), v.answer, personId, nowIso).run();
  return getDecision(db, siteId, v.item_id);
}

export async function saveCheck(db, siteId, itemId, posted, personId, nowIso) {
  await db.prepare(
    `INSERT INTO desk_story_checks (site_id, item_id, posted, checked_by, checked_at, pulled_at) VALUES (?, ?, ?, ?, ?, NULL)
     ON CONFLICT(site_id, item_id) DO UPDATE SET posted = excluded.posted, checked_by = excluded.checked_by,
       checked_at = excluded.checked_at, pulled_at = NULL`,
  ).bind(siteId, itemId, posted ? 1 : 0, personId, nowIso).run();
  return decodeCheck(await db.prepare('SELECT * FROM desk_story_checks WHERE site_id = ? AND item_id = ?').bind(siteId, itemId).first());
}

// write rules

const refuse = (status, error) => ({ ok: false, status, body: { error } });

// The owner, or a client with approve access to this site (lib/gate.js); JSON
// only; and same origin: Astro's checkOrigin covers form posts, not JSON, so
// the Origin check is done here.
export async function readWrite({ request, user, siteId }) {
  if (!canWriteDesk(user, siteId)) return refuse(403, 'Your access to this desk is view only.');
  const type = (request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') return refuse(415, 'Send the change as JSON.');
  if (request.headers.get('Origin') !== new URL(request.url).origin) return refuse(403, 'That request came from another site.');
  const text = await request.text();
  if (text.length > BODY_MAX) return refuse(413, 'That is too much text.');
  const body = parseJson(text, undefined);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return refuse(400, 'That was not a valid change.');
  return { ok: true, body };
}

const bad = (error) => ({ ok: false, error });

function text(v, fallback, max, label) {
  const s = v === undefined ? fallback : v;
  if (typeof s !== 'string') return { error: `${label} must be text.` };
  const t = s.trim();
  if (t.length > max) return { error: `Keep ${label.toLowerCase()} under ${max} characters.` };
  return { value: t };
}

// Fields the body leaves out keep their saved values, so a click that only
// sends a decision never wipes Alex's answers.
export function parseDecideBody(body, item, existing = null) {
  const { decision } = body;
  if (!DECISIONS.includes(decision)) return bad('That is not a decision the desk knows.');
  if (item.kind === 'native') return bad('This post is scheduled directly in Facebook. Nothing to approve.');
  const allowed = item.kind === 'ask' ? ['waiting', 'answered'] : ['waiting', 'approved', 'changes'];
  if (!allowed.includes(decision)) return bad('That decision does not fit this item.');

  const note = text(body.note, existing?.note ?? '', NOTE_MAX, 'The note');
  if (note.error) return bad(note.error);
  const answer = text(body.answer, existing?.answer ?? '', ANSWER_MAX, 'The answer');
  if (answer.error) return bad(answer.error);

  const given = body.answers === undefined ? existing?.answers ?? {} : body.answers;
  if (!given || typeof given !== 'object' || Array.isArray(given)) return bad('Answers must be a set of question numbers.');
  const entries = Object.entries(given);
  if (entries.length > 100) return bad('Too many answers.');
  const answers = {};
  for (const [k, v] of entries) {
    if (!/^\d{1,3}$/.test(k)) return bad('Answers must be keyed by question number.');
    const a = text(v, '', ANSWER_MAX, 'Each answer');
    if (a.error) return bad(a.error);
    answers[k] = a.value;
  }

  if (decision === 'changes' && !note.value) return bad('Add a note saying what should change.');
  if (decision === 'answered' && !answer.value) return bad('Type an answer first.');
  return { ok: true, values: { item_id: item.item_id, decision, note: note.value, answers, answer: answer.value } };
}

export function parseCheckBody(body) {
  if (!isItemId(body.item_id)) return bad('Pick a Story.');
  if (typeof body.posted !== 'boolean') return bad('Posted must be true or false.');
  return { ok: true, values: { item_id: body.item_id, posted: body.posted } };
}

// purge

// An item's rows go once its date has passed, or once its approval (an answer,
// for an ask) is more than a day old and Claude has pulled it. Rows are judged
// one list at a time: a Story approved days ahead leaves the approval rail but
// stays on the Stories checklist, and keeps its image, until its date passes.
// Decisions and Story ticks are never lost to a purge: one goes only when its
// item has no row left in its list AND Claude has pulled it, or, as a hard cap,
// when it is more than 14 days old. Each carries the state it was selected on,
// so applyPurge can spare one Alex changed in the meantime.
export function selectPurge({ items, decisions, checks = [], today, nowMs }) {
  const byId = new Map(decisions.map((d) => [d.item_id, d]));
  const settled = (it) => {
    const d = byId.get(it.item_id);
    if (!d || !d.pulled_at || nowMs - Date.parse(d.decided_at) <= DAY_MS) return false;
    return d.decision === (it.kind === 'ask' ? 'answered' : 'approved');
  };
  const gone = items.filter((it) => (it.post_date && it.post_date < today) || (it.list === 'approve' && settled(it)));
  const left = items.filter((it) => !gone.includes(it));
  const kept = new Set(left.map((it) => it.item_id));
  const media = [...new Set(gone.map((it) => it.item_id))].filter((id) => !kept.has(id));
  const leftIn = (list) => new Set(left.filter((it) => it.list === list).map((it) => it.item_id));

  const orphans = (list, rows, at) => {
    const still = leftIn(list);
    return rows
      .filter((r) => !still.has(r.item_id) && (r.pulled_at || nowMs - Date.parse(r[at]) > ORPHAN_MS))
      .map((r) => ({ item_id: r.item_id, [at]: r[at], pulled: !!r.pulled_at }));
  };
  return {
    rows: gone.map((it) => ({ list: it.list, item_id: it.item_id })),
    decisions: orphans('approve', decisions, 'decided_at'),
    checks: orphans('stories', checks, 'checked_at'),
    media,
  };
}

async function deletePrefix(bucket, prefix) {
  let cursor;
  do {
    const page = await bucket.list({ prefix, cursor });
    const keys = page.objects.map((o) => o.key);
    if (keys.length) await bucket.delete(keys);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}

// R2 first: if it fails, the rows stay and the next run tries again.
export async function applyPurge(db, bucket, site, plan) {
  for (const id of plan.media) {
    if (SEGMENT.test(id)) await deletePrefix(bucket, `${site.slug}/${id}/`);
  }
  const stmts = [
    ...plan.rows.map((r) => db.prepare('DELETE FROM desk_items WHERE site_id = ? AND list = ? AND item_id = ?').bind(site.id, r.list, r.item_id)),
    ...plan.decisions.map((d) => db.prepare(
      `DELETE FROM desk_decisions WHERE site_id = ? AND item_id = ? AND decided_at = ?${d.pulled ? ' AND pulled_at IS NOT NULL' : ''}`,
    ).bind(site.id, d.item_id, d.decided_at)),
    ...plan.checks.map((c) => db.prepare(
      `DELETE FROM desk_story_checks WHERE site_id = ? AND item_id = ? AND checked_at = ?${c.pulled ? ' AND pulled_at IS NOT NULL' : ''}`,
    ).bind(site.id, c.item_id, c.checked_at)),
  ];
  if (stmts.length) await db.batch(stmts);
}

// Runs when the desk page or /state is requested, at most once per 10 minutes
// per site (per Worker isolate, which is plenty). Returns the plan it applied,
// or null when it was skipped or failed; a failed purge never blocks the page.
const LAST_PURGE = new Map();

export async function maybePurge({ db, bucket, site, nowMs = Date.now(), memo = LAST_PURGE, log = console }) {
  const last = memo.get(site.id);
  if (last !== undefined && nowMs - last < PURGE_EVERY_MS) return null;
  memo.set(site.id, nowMs);
  try {
    const [items, decisions, checks] = await Promise.all([
      listDeskItems(db, site.id), listDeskDecisions(db, site.id), listDeskChecks(db, site.id),
    ]);
    const plan = selectPurge({ items, decisions, checks, today: todayEastern(nowMs), nowMs });
    await applyPurge(db, bucket, site, plan);
    return plan;
  } catch (err) {
    log.error(`desk purge ${site.slug}`, err);
    return null;
  }
}
