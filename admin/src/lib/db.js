// D1 access. One exported function per query so callers never build SQL, and
// every statement is parameter-bound. The D1 binding is always the first
// argument, which keeps these functions trivially testable against a stub.

export async function getUserByEmail(db, email) {
  return db.prepare(
    'SELECT id, email, name, role, client_id, active FROM users WHERE email = ? AND active = 1'
  ).bind(String(email).toLowerCase()).first();
}

export async function touchUser(db, id, iso) {
  await db.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').bind(iso, id).run();
}

export async function listClients(db) {
  // Active first, then leads, then past; alphabetical within each group. The
  // counts drive the right-hand column without a second round trip.
  const { results } = await db.prepare(
    `SELECT c.id, c.name, c.company, c.status, c.updated_at,
            (SELECT COUNT(*) FROM client_links l WHERE l.client_id = c.id) AS link_count,
            (SELECT COUNT(*) FROM notes n WHERE n.entity_type = 'client' AND n.entity_id = c.id) AS note_count
       FROM clients c
      WHERE c.archived_at IS NULL
      ORDER BY CASE c.status WHEN 'active' THEN 0 WHEN 'lead' THEN 1 ELSE 2 END, c.name`
  ).all();
  return results ?? [];
}

export async function getClient(db, id) {
  return db.prepare(
    'SELECT * FROM clients WHERE id = ? AND archived_at IS NULL'
  ).bind(id).first();
}

export async function createClient(db, f) {
  const row = await db.prepare(
    `INSERT INTO clients (name, company, email, phone, status, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(
    f.name, f.company ?? '', f.email ?? '', f.phone ?? '',
    f.status ?? 'active', f.source ?? '', f.createdAt, f.createdAt
  ).first();
  return row.id;
}

export async function updateClient(db, id, f) {
  await db.prepare(
    `UPDATE clients SET name = ?, company = ?, email = ?, phone = ?,
            status = ?, source = ?, updated_at = ? WHERE id = ?`
  ).bind(
    f.name, f.company ?? '', f.email ?? '', f.phone ?? '',
    f.status ?? 'active', f.source ?? '', f.updatedAt, id
  ).run();
}

// Soft delete. Nothing in this app hard-deletes a client, because the invoices
// and notes hanging off it are the record of real money and real conversations.
export async function archiveClient(db, id, iso) {
  await db.prepare('UPDATE clients SET archived_at = ?, updated_at = ? WHERE id = ?')
    .bind(iso, iso, id).run();
}

export async function listLinks(db, clientId) {
  const { results } = await db.prepare(
    'SELECT id, label, url, kind, sort_order FROM client_links WHERE client_id = ? ORDER BY sort_order, id'
  ).bind(clientId).all();
  return results ?? [];
}

export async function createLink(db, f) {
  await db.prepare(
    'INSERT INTO client_links (client_id, label, url, kind, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).bind(f.clientId, f.label, f.url, f.kind ?? 'other', f.sortOrder ?? 0).run();
}

export async function deleteLink(db, id) {
  await db.prepare('DELETE FROM client_links WHERE id = ?').bind(id).run();
}

export async function listNotes(db, entityType, entityId) {
  const { results } = await db.prepare(
    `SELECT id, body, author_email, pinned, created_at FROM notes
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY pinned DESC, created_at DESC`
  ).bind(entityType, entityId).all();
  return results ?? [];
}

export async function createNote(db, f) {
  await db.prepare(
    `INSERT INTO notes (entity_type, entity_id, body, author_email, pinned, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    f.entityType ?? null, f.entityId ?? null, f.body,
    f.authorEmail ?? '', f.pinned ? 1 : 0, f.createdAt
  ).run();
}

export async function deleteNote(db, id) {
  await db.prepare('DELETE FROM notes WHERE id = ?').bind(id).run();
}

// ── Projects ──────────────────────────────

const PROJECT_ORDER = `CASE p.status
    WHEN 'active' THEN 0 WHEN 'quoted' THEN 1 WHEN 'on_hold' THEN 2
    WHEN 'delivered' THEN 3 WHEN 'complete' THEN 4 ELSE 5 END`;

export async function listProjects(db) {
  // Live work first, finished work last. Within a status, soonest due date
  // first; undated projects sort to the end rather than to the top, which is
  // what COALESCE to a far-future date buys.
  const { results } = await db.prepare(
    `SELECT p.id, p.name, p.status, p.waiting_on, p.total_quoted_cents,
            p.due_on, p.delivered_on, p.client_id, c.name AS client_name
       FROM projects p JOIN clients c ON c.id = p.client_id
      WHERE p.archived_at IS NULL
      ORDER BY ${PROJECT_ORDER}, COALESCE(p.due_on, '9999-12-31'), p.name`
  ).all();
  return results ?? [];
}

export async function listProjectsForClient(db, clientId) {
  const { results } = await db.prepare(
    `SELECT p.id, p.name, p.status, p.waiting_on, p.total_quoted_cents, p.due_on, p.delivered_on
       FROM projects p
      WHERE p.client_id = ? AND p.archived_at IS NULL
      ORDER BY ${PROJECT_ORDER}, COALESCE(p.due_on, '9999-12-31'), p.name`
  ).bind(clientId).all();
  return results ?? [];
}

export async function getProject(db, id) {
  return db.prepare(
    `SELECT p.*, c.name AS client_name
       FROM projects p JOIN clients c ON c.id = p.client_id
      WHERE p.id = ? AND p.archived_at IS NULL`
  ).bind(id).first();
}

// The money on a project is always computed, never stored, so it cannot drift
// from the invoices it is derived from.
//
// 'expected' is money known to be owed but NOT yet billed, so it is deliberately
// excluded from invoiced_cents: that distinction is the whole point of the
// status. outstanding = quoted - invoiced is therefore "what still needs an
// invoice raising", which is the leak this admin exists to catch.
export async function getProjectMoney(db, projectId) {
  return db.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN status IN ('sent','paid') THEN amount_cents END), 0) AS invoiced_cents,
       COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_cents END), 0) AS paid_cents,
       COALESCE(SUM(CASE WHEN status = 'sent' THEN amount_cents END), 0) AS unpaid_cents,
       COALESCE(SUM(CASE WHEN status = 'expected' THEN amount_cents END), 0) AS expected_cents,
       COUNT(*) AS invoice_count
     FROM invoices WHERE project_id = ?`
  ).bind(projectId).first();
}

export async function createProject(db, f) {
  const row = await db.prepare(
    `INSERT INTO projects (client_id, name, status, waiting_on, total_quoted_cents,
                           started_on, due_on, delivered_on, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(
    f.clientId, f.name, f.status ?? 'active', f.waitingOn ?? null,
    f.totalQuotedCents ?? 0, f.startedOn || null, f.dueOn || null, f.deliveredOn || null,
    f.createdAt, f.createdAt
  ).first();
  return row.id;
}

export async function updateProject(db, id, f) {
  await db.prepare(
    `UPDATE projects SET client_id = ?, name = ?, status = ?, waiting_on = ?,
            total_quoted_cents = ?, started_on = ?, due_on = ?, delivered_on = ?,
            updated_at = ? WHERE id = ?`
  ).bind(
    f.clientId, f.name, f.status ?? 'active', f.waitingOn ?? null,
    f.totalQuotedCents ?? 0, f.startedOn || null, f.dueOn || null, f.deliveredOn || null,
    f.updatedAt, id
  ).run();
}

export async function archiveProject(db, id, iso) {
  await db.prepare('UPDATE projects SET archived_at = ?, updated_at = ? WHERE id = ?')
    .bind(iso, iso, id).run();
}
