// Every D1 query the dashboard and the checker make. The binding is always the
// first argument, so this module has no idea whether it runs in a Worker or a
// test, and tests run it against real SQLite (tests/helpers/d1.js).
// Booleans are stored as 0/1; undefined is never bound (SQLite rejects it).

const rows = async (stmt) => (await stmt.all()).results ?? [];
const nil = (v) => (v === undefined ? null : v);

// people

export async function getPersonByEmail(db, email) {
  return db.prepare('SELECT id, name, email, role FROM people WHERE email = ? COLLATE NOCASE')
    .bind(String(email ?? '').toLowerCase()).first();
}

export async function listPeople(db) {
  return rows(db.prepare('SELECT id, name, email, role FROM people ORDER BY name COLLATE NOCASE'));
}

// The site form's maintainer choices: K&A's own people, never a client.
export async function listOwners(db) {
  return rows(db.prepare("SELECT id, name, email, role FROM people WHERE role = 'owner' ORDER BY name COLLATE NOCASE"));
}

export async function getPersonById(db, id) {
  return db.prepare('SELECT id, name, email, role FROM people WHERE id = ?').bind(id).first();
}

export async function countOwners(db) {
  return db.prepare("SELECT COUNT(*) AS n FROM people WHERE role = 'owner'").first('n');
}

export async function createPerson(db, v, nowIso) {
  const res = await db.prepare('INSERT INTO people (name, email, role, created_at) VALUES (?, ?, ?, ?)')
    .bind(v.name, v.email, v.role, nowIso).run();
  return res.meta.last_row_id;
}

// One batch, so the person and their desk grants never disagree. Owners need
// no grants, so an owner's are cleared; for a client, each site the form
// listed is set or, at "none", removed. An unchanged grant keeps granted_at.
export async function updatePerson(db, id, v, nowIso) {
  const stmts = [db.prepare('UPDATE people SET name = ?, email = ?, role = ? WHERE id = ?').bind(v.name, v.email, v.role, id)];
  if (v.role === 'owner') {
    stmts.push(db.prepare('DELETE FROM desk_access WHERE person_id = ?').bind(id));
  } else {
    for (const g of v.grants ?? []) {
      stmts.push(g.level === 'none'
        ? db.prepare('DELETE FROM desk_access WHERE person_id = ? AND site_id = ?').bind(id, g.site_id)
        : db.prepare(
          `INSERT INTO desk_access (person_id, site_id, level, granted_at) VALUES (?, ?, ?, ?)
           ON CONFLICT(person_id, site_id) DO UPDATE SET level = excluded.level,
             granted_at = CASE WHEN desk_access.level = excluded.level THEN desk_access.granted_at ELSE excluded.granted_at END`,
        ).bind(id, g.site_id, g.level, nowIso));
    }
  }
  await db.batch(stmts);
}

// D1 enforces foreign keys, so the person's id comes off what they decided,
// ticked or maintain before the row goes. The decisions themselves stay. Their
// desk grants are deleted here too, not left to the ON DELETE CASCADE.
export async function deletePerson(db, id) {
  await db.batch([
    db.prepare('DELETE FROM desk_access WHERE person_id = ?').bind(id),
    db.prepare('UPDATE desk_decisions SET decided_by = NULL WHERE decided_by = ?').bind(id),
    db.prepare('UPDATE desk_story_checks SET checked_by = NULL WHERE checked_by = ?').bind(id),
    db.prepare('UPDATE sites SET maintainer_id = NULL WHERE maintainer_id = ?').bind(id),
    db.prepare('DELETE FROM people WHERE id = ?').bind(id),
  ]);
}

// desk access

export async function listGrantsForPerson(db, personId) {
  return rows(db.prepare(
    `SELECT a.site_id, s.slug, s.name, a.level, s.logo_key, s.favicon_key FROM desk_access a
     JOIN sites s ON s.id = a.site_id WHERE a.person_id = ? ORDER BY s.name COLLATE NOCASE`,
  ).bind(personId));
}

export async function listAllGrants(db) {
  return rows(db.prepare(
    `SELECT a.person_id, a.site_id, s.slug, s.name, a.level FROM desk_access a
     JOIN sites s ON s.id = a.site_id ORDER BY s.name COLLATE NOCASE`,
  ));
}

// settings

export async function getSettings(db) {
  const list = await rows(db.prepare('SELECT key, value FROM settings'));
  return Object.fromEntries(list.map((r) => [r.key, r.value]));
}

export async function setSettings(db, values, nowIso) {
  const stmts = Object.entries(values).map(([k, v]) => db.prepare(
    'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
  ).bind(k, String(v), nowIso));
  if (stmts.length) await db.batch(stmts);
}

// sites

export const SITE_FIELDS = ['slug', 'name', 'live_url', 'repo', 'local_path', 'hosting', 'deploy_command', 'maintainer_id', 'domain'];

export async function listSites(db) {
  return rows(db.prepare('SELECT * FROM sites ORDER BY name COLLATE NOCASE'));
}

export async function getSiteBySlug(db, slug) {
  return db.prepare('SELECT * FROM sites WHERE slug = ?').bind(slug).first();
}

export async function createSite(db, values, nowIso) {
  const cols = SITE_FIELDS.join(', ');
  const marks = SITE_FIELDS.map(() => '?').join(', ');
  const res = await db.prepare(`INSERT INTO sites (${cols}, created_at, updated_at) VALUES (${marks}, ?, ?)`)
    .bind(...SITE_FIELDS.map((f) => nil(values[f])), nowIso, nowIso).run();
  return res.meta.last_row_id;
}

export async function updateSite(db, id, values, nowIso) {
  const sets = SITE_FIELDS.map((f) => `${f} = ?`).join(', ');
  await db.prepare(`UPDATE sites SET ${sets}, updated_at = ? WHERE id = ?`)
    .bind(...SITE_FIELDS.map((f) => nil(values[f])), nowIso, id).run();
}

export async function updateSiteStatus(db, id, { project_status, status_note }, nowIso) {
  await db.prepare('UPDATE sites SET project_status = ?, status_note = ?, updated_at = ? WHERE id = ?')
    .bind(project_status, status_note ?? '', nowIso, id).run();
}

export async function updateSiteA11y(db, id, v, nowIso) {
  await db.prepare('UPDATE sites SET a11y_audited_on = ?, a11y_open_issues = ?, a11y_statement_url = ?, updated_at = ? WHERE id = ?')
    .bind(nil(v.a11y_audited_on), nil(v.a11y_open_issues), nil(v.a11y_statement_url), nowIso, id).run();
}

export async function setSiteLogo(db, id, key, nowIso) {
  await db.prepare('UPDATE sites SET logo_key = ?, updated_at = ? WHERE id = ?').bind(key, nowIso, id).run();
}

export async function setSiteFavicon(db, id, key, nowIso) {
  await db.prepare('UPDATE sites SET favicon_key = ?, updated_at = ? WHERE id = ?').bind(key, nowIso, id).run();
}

export async function setSiteExpiry(db, id, dates, nowIso) {
  const sets = [];
  const args = [];
  for (const col of ['cert_expires_on', 'domain_expires_on']) {
    if (dates[col] !== undefined) {
      sets.push(`${col} = ?`);
      args.push(dates[col]);
    }
  }
  if (sets.length === 0) return;
  await db.prepare(`UPDATE sites SET ${sets.join(', ')}, updated_at = ? WHERE id = ?`).bind(...args, nowIso, id).run();
}

export async function setGithubSynced(db, id, nowIso) {
  await db.prepare('UPDATE sites SET github_synced_at = ? WHERE id = ?').bind(nowIso, id).run();
}

// checks

export async function insertCheck(db, c) {
  await db.prepare('INSERT INTO checks (site_id, checked_at, ok, http_status, ms, error) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(c.site_id, c.checked_at, c.ok ? 1 : 0, nil(c.http_status), nil(c.ms), nil(c.error)).run();
}

export async function latestChecksForAll(db, perSite) {
  const list = await rows(db.prepare(
    `SELECT site_id, checked_at, ok, http_status, ms, error FROM (
       SELECT *, ROW_NUMBER() OVER (PARTITION BY site_id ORDER BY checked_at DESC, id DESC) AS rn FROM checks
     ) WHERE rn <= ? ORDER BY site_id, checked_at DESC`,
  ).bind(perSite));
  const map = new Map();
  for (const r of list) {
    if (!map.has(r.site_id)) map.set(r.site_id, []);
    map.get(r.site_id).push(r);
  }
  return map;
}

export async function checksSince(db, siteId, sinceIso) {
  return rows(db.prepare(
    'SELECT checked_at, ok, http_status, ms, error FROM checks WHERE site_id = ? AND checked_at >= ? ORDER BY checked_at DESC, id DESC',
  ).bind(siteId, sinceIso));
}

export async function pruneChecks(db, beforeIso) {
  await db.prepare('DELETE FROM checks WHERE checked_at < ?').bind(beforeIso).run();
}

// work items

export async function listWorkItems(db, siteId) {
  return rows(db.prepare('SELECT * FROM work_items WHERE site_id = ? ORDER BY done_at IS NOT NULL, created_at, id').bind(siteId));
}

export async function openWorkCounts(db) {
  const list = await rows(db.prepare('SELECT site_id, COUNT(*) AS n FROM work_items WHERE done_at IS NULL GROUP BY site_id'));
  return new Map(list.map((r) => [r.site_id, r.n]));
}

export async function addManualWork(db, siteId, text, nowIso) {
  await db.prepare("INSERT INTO work_items (site_id, source, text, created_at) VALUES (?, 'manual', ?, ?)")
    .bind(siteId, text, nowIso).run();
}

export async function setManualWorkDone(db, siteId, itemId, done, nowIso) {
  await db.prepare("UPDATE work_items SET done_at = ? WHERE id = ? AND site_id = ? AND source = 'manual'")
    .bind(done ? nowIso : null, itemId, siteId).run();
}

export async function listGithubItems(db, siteId) {
  return rows(db.prepare("SELECT * FROM work_items WHERE site_id = ? AND source = 'github'").bind(siteId));
}

export async function applyGithubPlan(db, siteId, plan, nowIso) {
  const stmts = [];
  for (const i of plan.inserts) {
    stmts.push(db.prepare("INSERT INTO work_items (site_id, source, text, url, github_key, created_at) VALUES (?, 'github', ?, ?, ?, ?)")
      .bind(siteId, i.text, nil(i.url), i.github_key, nowIso));
  }
  for (const u of plan.updates) {
    stmts.push(db.prepare('UPDATE work_items SET text = ?, url = ?, done_at = NULL WHERE id = ? AND site_id = ?')
      .bind(u.text, nil(u.url), u.id, siteId));
  }
  for (const id of plan.closes) {
    stmts.push(db.prepare('UPDATE work_items SET done_at = ? WHERE id = ? AND site_id = ?').bind(nowIso, id, siteId));
  }
  if (stmts.length) await db.batch(stmts);
}

// log

export async function listLog(db, siteId) {
  return rows(db.prepare('SELECT * FROM log_entries WHERE site_id = ? ORDER BY entry_date DESC, id DESC').bind(siteId));
}

export async function addLog(db, siteId, entryDate, text, nowIso) {
  await db.prepare('INSERT INTO log_entries (site_id, entry_date, text, created_at) VALUES (?, ?, ?, ?)')
    .bind(siteId, entryDate, text, nowIso).run();
}

// alert state

export async function allAlertStates(db) {
  const list = await rows(db.prepare('SELECT * FROM alert_state'));
  return new Map(list.map((r) => [r.site_id, r]));
}

export async function upsertAlertState(db, s) {
  await db.prepare(
    `INSERT INTO alert_state (site_id, level, since, last_alert_level, last_alert_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(site_id) DO UPDATE SET level = excluded.level, since = excluded.since,
       last_alert_level = excluded.last_alert_level, last_alert_at = excluded.last_alert_at`,
  ).bind(s.site_id, s.level, s.since, nil(s.last_alert_level), nil(s.last_alert_at)).run();
}

// desk push subscriptions and announce-once bookkeeping (0004)

export async function listPushSubs(db, siteId) {
  return rows(db.prepare(
    'SELECT id, site_id, person_id, endpoint, p256dh, auth, label, created_at, last_ok_at, fail_count FROM desk_push_subs WHERE site_id = ? ORDER BY id',
  ).bind(siteId));
}

export async function getPushSubByEndpoint(db, endpoint) {
  return db.prepare(
    'SELECT id, site_id, person_id, endpoint, p256dh, auth, label, created_at, last_ok_at, fail_count FROM desk_push_subs WHERE endpoint = ?',
  ).bind(endpoint).first();
}

// Upsert by endpoint: a device re-subscribing moves to the current person/site.
export async function upsertPushSub(db, { siteId, personId, endpoint, p256dh, auth, label }, nowIso) {
  await db.prepare(
    `INSERT INTO desk_push_subs (site_id, person_id, endpoint, p256dh, auth, label, created_at, last_ok_at, fail_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
     ON CONFLICT(endpoint) DO UPDATE SET
       site_id = excluded.site_id,
       person_id = excluded.person_id,
       p256dh = excluded.p256dh,
       auth = excluded.auth,
       label = excluded.label,
       last_ok_at = excluded.last_ok_at,
       fail_count = 0`,
  ).bind(siteId, personId, endpoint, p256dh, auth, nil(label), nowIso, nowIso).run();
}

export async function deletePushSub(db, endpoint) {
  await db.prepare('DELETE FROM desk_push_subs WHERE endpoint = ?').bind(endpoint).run();
}

export async function touchPushSubOk(db, endpoint, nowIso) {
  await db.prepare('UPDATE desk_push_subs SET last_ok_at = ?, fail_count = 0 WHERE endpoint = ?').bind(nowIso, endpoint).run();
}

export async function bumpPushSubFail(db, endpoint) {
  await db.prepare('UPDATE desk_push_subs SET fail_count = fail_count + 1 WHERE endpoint = ?').bind(endpoint).run();
}

export async function listPushSent(db, siteId) {
  return rows(db.prepare('SELECT site_id, item_id, sent_at FROM desk_push_sent WHERE site_id = ?').bind(siteId));
}

export async function markPushSent(db, siteId, itemIds, nowIso) {
  if (!itemIds?.length) return;
  const stmts = itemIds.map((id) => db.prepare(
    `INSERT INTO desk_push_sent (site_id, item_id, sent_at) VALUES (?, ?, ?)
     ON CONFLICT(site_id, item_id) DO UPDATE SET sent_at = excluded.sent_at`,
  ).bind(siteId, id, nowIso));
  await db.batch(stmts);
}

export async function deletePushSent(db, siteId, itemIds) {
  if (!itemIds?.length) return;
  const stmts = itemIds.map((id) => db.prepare(
    'DELETE FROM desk_push_sent WHERE site_id = ? AND item_id = ?',
  ).bind(siteId, id));
  await db.batch(stmts);
}
