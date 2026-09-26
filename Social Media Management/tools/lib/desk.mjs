// The Post Desk in the admin: pushes the review queue to D1 + R2 so
// admin.ka-performancefl.com/sites/<slug>/social can render it, and pulls
// Alex's decisions back down. See
// D:\ka-site-admin\docs\superpowers\specs\2026-09-26-post-desk-design.md.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { wrangler, r2Put, r2Delete, readR2Config, apiToken } from "./cloudflare.mjs";

const DB = "ka-sites";
const DESK_BUCKET = "ka-social-desk";
const COMMAND_CHUNK_SIZE = 50;

/** Double single quotes for a SQL string literal. NULL is handled by sqlValue, not here. */
export function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

/** A SQL literal for any value going into a statement: NULL, a number, or a quoted string. */
export function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return sqlString(value);
}

/** The R2 key for one piece of media: `<site-slug>/<item-id>/<file name>`. */
export function mediaKey(slug, itemId, fileName) {
  return `${slug}/${itemId}/${fileName}`;
}

/** Split a list into chunks of at most `size`, in order. */
export function chunkArray(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** A key with no meaning outside JS: stable across property insertion order, for hashing. */
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** sha256 of whatever object it is handed. What goes in is the caller's call: see the *_FIELDS lists below. */
export function contentHash(raw) {
  return crypto.createHash("sha256").update(stableStringify(raw)).digest("hex");
}

function rewriteMediaEntry(entry, slug, itemId, wanted) {
  const key = mediaKey(slug, itemId, path.basename(entry.src));
  const w = wanted.get(key);
  const rewritten = { ...entry, src: key };
  if (w) rewritten.v = `${w.size}-${w.mtime}`;
  return rewritten;
}

// What Alex actually reviews on the desk, and nothing else: never status,
// scheduled, ai, music, weekday, pillar, builtAt, or a media/story src (an
// R2 key, not content). A field only goes in when present on the source
// item, so adding vs. never having a field does not itself change the hash.
const POST_FIELDS = ["title", "hook", "networks", "facebook", "instagram", "firstComment", "linkedin", "linkedinComment", "repost", "questions"];
const STORY_FIELDS = ["date", "time", "condition", "stickerText", "stickerUrl"];
const ASK_FIELDS = ["title", "detail", "placeholder"];

function pick(raw, fields) {
  const out = {};
  for (const k of fields) if (raw[k] !== undefined) out[k] = raw[k];
  return out;
}

/** {role, alt, platforms, v}, in that shape, per media entry - never its src. */
function reviewedMedia(media) {
  return (media || []).map((m) => pick(m, ["role", "alt", "platforms", "v"]));
}

/**
 * What changed for the desk_decisions reset check: the reviewed fields plus
 * `v` (media version stamps), computed from the already-rewritten media/story
 * object so a re-rendered file (new size/mtime, same everything else) counts
 * as a change too.
 */
function reviewedPostContent(post, media) {
  return { ...pick(post, POST_FIELDS), media: reviewedMedia(media) };
}

function reviewedStoryContent(raw, rewritten) {
  return { ...pick(raw, STORY_FIELDS), ...pick(rewritten, ["v"]) };
}

function reviewedAskContent(ask) {
  return pick(ask, ASK_FIELDS);
}

/**
 * The desk_items rows for one site's queue: posts and asks list 'approve',
 * the Stories checklist lists 'stories'. Every media src (and story src) is
 * rewritten to its R2 key, and gets a `v` = `<size>-<mtimeMs>` stamp (from
 * `wanted`, built by collectMediaPlan) so the admin can cache-bust the URL.
 * Each row also carries a contentHash of only what Alex reviews (see the
 * *_FIELDS lists above, plus `v`), computed after `v` is known, so an
 * operational-only change (status, scheduled, ai, music...) never resets an
 * approval, but a caption edit or a re-rendered file does.
 */
export function buildDeskRows(data, slug, wanted) {
  const rows = [];
  for (const post of data.posts || []) {
    const media = (post.media || []).map((m) => rewriteMediaEntry(m, slug, post.id, wanted));
    rows.push({
      item_id: post.id, list: "approve", kind: post.kind,
      post_date: post.date, post_time: post.time || null, title: post.title || post.id,
      payload: JSON.stringify({ ...post, media }),
      contentHash: contentHash(reviewedPostContent(post, media))
    });
  }
  for (const story of data.stories || []) {
    const rewritten = rewriteMediaEntry(story, slug, story.id, wanted);
    rows.push({
      item_id: story.id, list: "approve", kind: "story",
      post_date: story.date, post_time: null, title: "Story with a link sticker",
      payload: JSON.stringify(rewritten),
      contentHash: contentHash(reviewedStoryContent(story, rewritten))
    });
  }
  for (const check of data.storyChecklist || []) {
    const rewritten = rewriteMediaEntry(check, slug, check.id, wanted);
    rows.push({
      item_id: check.id, list: "stories", kind: "story",
      post_date: check.date, post_time: check.time || null, title: "Story with a link sticker",
      payload: JSON.stringify(rewritten),
      contentHash: contentHash(reviewedStoryContent(check, rewritten))
    });
  }
  for (const ask of data.asks || []) {
    rows.push({
      item_id: ask.id, list: "approve", kind: "ask",
      post_date: null, post_time: null, title: ask.title || ask.id,
      payload: JSON.stringify(ask),
      contentHash: contentHash(reviewedAskContent(ask))
    });
  }
  return rows;
}

/** Every R2 key the current queue needs: key -> local file (absolute) plus its size/mtime and owning item. */
export function collectMediaPlan(data, filesMap, slug, root, statFn = fs.statSync) {
  const wanted = new Map();
  const add = (list, itemId, src) => {
    if (!src) return;
    const local = filesMap[src];
    if (!local) throw new Error(`no local file recorded for ${src} in review/files.json`);
    const file = path.resolve(root, local);
    const st = statFn(file);
    wanted.set(mediaKey(slug, itemId, path.basename(src)), { file, list, itemId, size: st.size, mtime: st.mtimeMs });
  };
  for (const post of data.posts || []) for (const m of post.media || []) add("approve", post.id, m.src);
  for (const story of data.stories || []) add("approve", story.id, story.src);
  for (const check of data.storyChecklist || []) add("stories", check.id, check.src);
  return wanted;
}

/** Files whose size or mtime changed since the last push (or that were never pushed). */
export function planUploads(wanted, trackedMedia = {}) {
  const uploads = [];
  for (const [key, entry] of wanted) {
    const prev = trackedMedia[key];
    if (!prev || prev.size !== entry.size || prev.mtime !== entry.mtime) uploads.push({ key, file: entry.file, size: entry.size, mtime: entry.mtime });
  }
  return uploads;
}

/** Previously-pushed keys the current queue no longer needs. */
export function planDeletes(wanted, trackedMedia = {}) {
  return Object.keys(trackedMedia).filter((key) => !wanted.has(key));
}

function readTracked(pushedPath) {
  if (!fs.existsSync(pushedPath)) return { media: {}, items: {} };
  const parsed = JSON.parse(fs.readFileSync(pushedPath, "utf8"));
  return { media: parsed.media || {}, items: parsed.items || {} };
}

function d1Rows(sql, opts) {
  const out = wrangler(["d1", "execute", DB, "--remote", "--json", "--command", sql], opts);
  const parsed = JSON.parse(out);
  return (parsed[0] && parsed[0].results) || [];
}

/**
 * Writes, chunked at COMMAND_CHUNK_SIZE statements per call, through
 * `d1 execute --remote --command`. Never --file: with --remote, --file goes
 * through the D1 import API, which makes the database briefly unavailable,
 * and these are small, frequent updates, not a bulk replace.
 */
function runAsCommands(statements, opts, chunkSize = COMMAND_CHUNK_SIZE) {
  for (const batch of chunkArray(statements, chunkSize)) {
    if (batch.length) wrangler(["d1", "execute", DB, "--remote", "--command", batch.join(" ")], opts);
  }
}

/** The one-shot bulk replace: --file (the D1 import API) is fine here, this is the whole point of it. */
function d1Import(sql, opts) {
  const tmp = path.join(os.tmpdir(), `ka-desk-${crypto.randomUUID()}.sql`);
  fs.writeFileSync(tmp, sql, "utf8");
  try {
    return wrangler(["d1", "execute", DB, "--remote", "--file", tmp], opts);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/** The site's id in `ka-sites`. An unknown slug is an error. */
export function lookupSiteId(slug, opts) {
  const rows = d1Rows(`SELECT id FROM sites WHERE slug = ${sqlString(slug)}`, opts);
  if (!rows.length) throw new Error(`unknown site slug "${slug}"`);
  return rows[0].id;
}

/** The (list, item_id) pairs currently in desk_items for a site, as `"<list>:<item_id>"`. */
export function fetchExistingItems(siteId, opts) {
  const rows = d1Rows(`SELECT list, item_id FROM desk_items WHERE site_id = ${siteId}`, opts);
  return new Set(rows.map((r) => `${r.list}:${r.item_id}`));
}

/** The most recent decision per item_id logged by a previous pull, read from review/desk-log.jsonl. */
export function latestApproveDecisions(root) {
  const logPath = path.join(root, "review", "desk-log.jsonl");
  const latest = new Map();
  if (!fs.existsSync(logPath)) return latest;
  for (const line of fs.readFileSync(logPath, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry.type !== "decision") continue;
    const prev = latest.get(entry.item_id);
    if (!prev || String(entry.decided_at) > String(prev.decided_at)) latest.set(entry.item_id, entry);
  }
  return latest;
}

function namesById(ids, opts) {
  const unique = [...new Set(ids.filter((id) => id !== null && id !== undefined))];
  if (!unique.length) return new Map();
  const rows = d1Rows(`SELECT id, name FROM people WHERE id IN (${unique.join(",")})`, opts);
  return new Map(rows.map((p) => [p.id, p.name]));
}

/**
 * Reads decisions and story checks with pulled_at IS NULL, appends them to
 * review/desk-log.jsonl, sets pulled_at on exactly those rows (matched on
 * item_id and decided_at/checked_at, so a row changed in between is left for
 * next time), and returns what was read. Pass `siteId` to skip the slug
 * lookup when the caller already resolved it.
 */
export function pullDesk({ site = "ka-performance", root, config = readR2Config(), token = apiToken(), run = spawnSync, now = new Date(), siteId } = {}) {
  const opts = { config, token, run };
  const resolvedSiteId = siteId ?? lookupSiteId(site, opts);
  const decisionRows = d1Rows(
    `SELECT item_id, decision, note, answers, answer, decided_by, decided_at FROM desk_decisions WHERE site_id = ${resolvedSiteId} AND pulled_at IS NULL ORDER BY decided_at`,
    opts
  );
  const checkRows = d1Rows(
    `SELECT item_id, posted, checked_by, checked_at FROM desk_story_checks WHERE site_id = ${resolvedSiteId} AND pulled_at IS NULL ORDER BY checked_at`,
    opts
  );
  if (!decisionRows.length && !checkRows.length) return { decisions: [], checks: [], siteId: resolvedSiteId };

  const names = namesById([...decisionRows.map((d) => d.decided_by), ...checkRows.map((c) => c.checked_by)], opts);
  const stamp = now.toISOString();

  const decisions = decisionRows.map((d) => ({
    type: "decision", site, item_id: d.item_id, decision: d.decision, note: d.note || "",
    answers: JSON.parse(d.answers || "{}"), answer: d.answer || "",
    who: names.get(d.decided_by) || null, decided_at: d.decided_at, pulled_at: stamp
  }));
  const checks = checkRows.map((c) => ({
    type: "story_check", site, item_id: c.item_id, posted: !!c.posted,
    who: names.get(c.checked_by) || null, checked_at: c.checked_at, pulled_at: stamp
  }));

  const logPath = path.join(root, "review", "desk-log.jsonl");
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, [...decisions, ...checks].map((l) => JSON.stringify(l) + "\n").join(""));

  const statements = [
    ...decisionRows.map((d) => `UPDATE desk_decisions SET pulled_at = ${sqlString(stamp)} WHERE site_id = ${resolvedSiteId} AND item_id = ${sqlString(d.item_id)} AND decided_at = ${sqlString(d.decided_at)};`),
    ...checkRows.map((c) => `UPDATE desk_story_checks SET pulled_at = ${sqlString(stamp)} WHERE site_id = ${resolvedSiteId} AND item_id = ${sqlString(c.item_id)} AND checked_at = ${sqlString(c.checked_at)};`)
  ];
  runAsCommands(statements, opts);

  return { decisions, checks, siteId: resolvedSiteId };
}

function buildTransactionStatements({ siteId, rows, stamp, storiesPaused, builtAt, changedApproveIds }) {
  const approveIds = rows.filter((r) => r.list === "approve").map((r) => r.item_id);
  const storiesIds = rows.filter((r) => r.list === "stories").map((r) => r.item_id);

  const statements = [`DELETE FROM desk_items WHERE site_id = ${siteId};`];
  for (const r of rows) {
    statements.push(
      `INSERT INTO desk_items (site_id, item_id, list, kind, post_date, post_time, title, payload, pushed_at) VALUES (${siteId}, ${sqlString(r.item_id)}, ${sqlString(r.list)}, ${sqlString(r.kind)}, ${sqlValue(r.post_date)}, ${sqlValue(r.post_time)}, ${sqlString(r.title)}, ${sqlString(r.payload)}, ${sqlString(stamp)});`
    );
  }
  // A decision or story check for an item no longer in the queue is only ever
  // dropped once Claude has actually read it (pulled_at IS NOT NULL) - never
  // lose one that is still waiting to be pulled.
  statements.push(
    approveIds.length
      ? `DELETE FROM desk_decisions WHERE site_id = ${siteId} AND item_id NOT IN (${approveIds.map(sqlString).join(",")}) AND pulled_at IS NOT NULL;`
      : `DELETE FROM desk_decisions WHERE site_id = ${siteId} AND pulled_at IS NOT NULL;`
  );
  statements.push(
    storiesIds.length
      ? `DELETE FROM desk_story_checks WHERE site_id = ${siteId} AND item_id NOT IN (${storiesIds.map(sqlString).join(",")}) AND pulled_at IS NOT NULL;`
      : `DELETE FROM desk_story_checks WHERE site_id = ${siteId} AND pulled_at IS NOT NULL;`
  );
  // A revised item's old decision no longer applies: clear it back to waiting.
  if (changedApproveIds.length) {
    statements.push(`DELETE FROM desk_decisions WHERE site_id = ${siteId} AND item_id IN (${changedApproveIds.map(sqlString).join(",")}) AND pulled_at IS NOT NULL;`);
  }
  statements.push(
    `INSERT INTO desk_meta (site_id, pushed_at, built_at, stories_paused) VALUES (${siteId}, ${sqlString(stamp)}, ${sqlValue(builtAt || null)}, ${storiesPaused ? 1 : 0}) ON CONFLICT(site_id) DO UPDATE SET pushed_at = excluded.pushed_at, built_at = excluded.built_at, stories_paused = excluded.stories_paused;`
  );
  return statements;
}

/**
 * Mirrors review/data.json into desk_items/desk_meta for the site.
 * Order: uploads, then pull (never lose a decision, and never mid-way
 * through the D1 import), then the D1 import, then R2 deletes of media the
 * queue no longer needs (only once the import has actually succeeded).
 * review/desk-pushed.json (media size/mtime, and a content hash per item) is
 * written in a finally block, so a failure partway still keeps whatever
 * completed. --dry-run reports the local plan and touches nothing remote,
 * including no pull and no read of the site's current desk_items.
 */
export function pushDesk({ site = "ka-performance", root, config = readR2Config(), token = apiToken(), run = spawnSync, now = new Date(), dryRun = false } = {}) {
  const data = JSON.parse(fs.readFileSync(path.join(root, "review", "data.json"), "utf8"));
  const filesMap = JSON.parse(fs.readFileSync(path.join(root, "review", "files.json"), "utf8"));
  const pushedPath = path.join(root, "review", "desk-pushed.json");
  const stored = readTracked(pushedPath);

  if (dryRun) {
    const wanted = collectMediaPlan(data, filesMap, site, root);
    const rows = buildDeskRows(data, site, wanted);
    return {
      dryRun: true,
      uploads: planUploads(wanted, stored.media),
      deletes: planDeletes(wanted, stored.media),
      rows: rows.length,
      pulled: null,
      skipped: [],
      reset: []
    };
  }

  const opts = { config, token, run };
  const siteId = lookupSiteId(site, opts);
  const existing = fetchExistingItems(siteId, opts);
  const latest = latestApproveDecisions(root);

  // An item already gone from desk_items (the admin purges approved items
  // after Claude has pulled and applied them) must not be resurrected just
  // because Claude has not yet moved its local folder out of the queue.
  const skipped = [];
  const keepApprove = (itemId) => {
    if (existing.has(`approve:${itemId}`)) return true;
    const decision = latest.get(itemId);
    // Answered asks are purged the same way, so they must not come back either.
    if (decision && (decision.decision === "approved" || decision.decision === "answered")) { skipped.push(itemId); return false; }
    return true;
  };
  const filtered = {
    ...data,
    posts: (data.posts || []).filter((p) => keepApprove(p.id)),
    stories: (data.stories || []).filter((s) => keepApprove(s.id)),
    asks: (data.asks || []).filter((a) => keepApprove(a.id))
  };

  const wanted = collectMediaPlan(filtered, filesMap, site, root);
  const rows = buildDeskRows(filtered, site, wanted);

  const working = { media: { ...stored.media }, items: { ...stored.items } };
  // An item missing from D1 needs its media re-uploaded even if the local
  // tracking file thinks it is unchanged (the two can drift apart).
  for (const [key, entry] of wanted) {
    if (!existing.has(`${entry.list}:${entry.itemId}`)) delete working.media[key];
  }

  const uploads = planUploads(wanted, working.media);
  const deletes = planDeletes(wanted, working.media);
  const reset = [];

  try {
    const deskOpts = { ...opts, config: { ...config, bucket: DESK_BUCKET } };
    for (const u of uploads) {
      r2Put(u.key, u.file, deskOpts);
      working.media[u.key] = { size: u.size, mtime: u.mtime };
    }

    const pulled = pullDesk({ site, root, config, token, run, now, siteId });

    const stamp = now.toISOString();
    const nextHashes = {};
    for (const r of rows) {
      const trackKey = `${r.list}/${r.item_id}`;
      const prevHash = working.items[trackKey];
      nextHashes[trackKey] = r.contentHash;
      if (r.list === "approve" && prevHash && prevHash !== r.contentHash) reset.push(r.item_id);
    }

    const statements = buildTransactionStatements({
      siteId, rows, stamp, storiesPaused: !!data.storiesPaused, builtAt: data.builtAt, changedApproveIds: reset
    });
    d1Import(statements.join("\n"), opts);

    // Only record hashes once the import that made them true has succeeded.
    Object.assign(working.items, nextHashes);

    for (const key of deletes) {
      r2Delete(key, deskOpts);
      delete working.media[key];
    }

    return { dryRun: false, uploads, deletes, rows: rows.length, pulled, skipped, reset };
  } finally {
    fs.writeFileSync(pushedPath, JSON.stringify(working, null, 2) + "\n");
  }
}
