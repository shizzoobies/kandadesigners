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

// ── Invoices ──────────────────────────────

const INVOICE_SELECT = `SELECT i.id, i.client_id, i.project_id, i.ref, i.kind, i.amount_cents,
       i.issued_on, i.due_on, i.paid_on, i.status, i.external_url, i.notes,
       c.name AS client_name, p.name AS project_name
  FROM invoices i
  JOIN clients c ON c.id = i.client_id
  LEFT JOIN projects p ON p.id = i.project_id`;

// `open` means anything still representing money you have not banked: flagged but
// unbilled, or billed but unpaid. That is the working view, so it is the default.
export async function listInvoices(db, filter = 'open') {
  const where = {
    open: "i.status IN ('expected','sent')",
    paid: "i.status = 'paid'",
    void: "i.status = 'void'",
    all: '1 = 1',
  }[filter] ?? "i.status IN ('expected','sent')";

  const { results } = await db.prepare(
    `${INVOICE_SELECT} WHERE ${where}
      ORDER BY CASE i.status WHEN 'sent' THEN 0 WHEN 'expected' THEN 1 ELSE 2 END,
               COALESCE(i.due_on, '9999-12-31'), i.id DESC`
  ).all();
  return results ?? [];
}

export async function getInvoice(db, id) {
  return db.prepare(`${INVOICE_SELECT} WHERE i.id = ?`).bind(id).first();
}

export async function listInvoicesForProject(db, projectId) {
  const { results } = await db.prepare(
    `${INVOICE_SELECT} WHERE i.project_id = ?
      ORDER BY COALESCE(i.issued_on, i.due_on, '9999-12-31'), i.id`
  ).bind(projectId).all();
  return results ?? [];
}

export async function listInvoicesForClient(db, clientId) {
  const { results } = await db.prepare(
    `${INVOICE_SELECT} WHERE i.client_id = ?
      ORDER BY CASE i.status WHEN 'sent' THEN 0 WHEN 'expected' THEN 1 ELSE 2 END,
               COALESCE(i.due_on, '9999-12-31'), i.id DESC`
  ).bind(clientId).all();
  return results ?? [];
}

// The money strip, defined once here so the screen and the digest cannot disagree.
// Overdue is a strict subset of outstanding. `expected` is money not yet billed,
// so it is counted separately rather than folded into either.
export async function getMoneyTotals(db, today) {
  return db.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'sent' THEN amount_cents END), 0) AS outstanding_cents,
       COALESCE(SUM(CASE WHEN status = 'sent' AND due_on IS NOT NULL AND due_on < ? THEN amount_cents END), 0) AS overdue_cents,
       COALESCE(SUM(CASE WHEN status = 'sent' AND due_on IS NOT NULL AND due_on < ? THEN 1 END), 0) AS overdue_count,
       COALESCE(SUM(CASE WHEN status = 'expected' THEN amount_cents END), 0) AS expected_cents,
       COALESCE(SUM(CASE WHEN status = 'expected' THEN 1 END), 0) AS expected_count
     FROM invoices`
  ).bind(today, today).first();
}

export async function createInvoice(db, f) {
  const row = await db.prepare(
    `INSERT INTO invoices (client_id, project_id, ref, kind, amount_cents,
                           issued_on, due_on, paid_on, status, external_url, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(
    f.clientId, f.projectId ?? null, f.ref ?? '', f.kind ?? 'other', f.amountCents ?? 0,
    f.issuedOn || null, f.dueOn || null, f.paidOn || null,
    f.status ?? 'expected', f.externalUrl ?? '', f.notes ?? ''
  ).first();
  return row.id;
}

export async function updateInvoice(db, id, f) {
  await db.prepare(
    `UPDATE invoices SET client_id = ?, project_id = ?, ref = ?, kind = ?, amount_cents = ?,
            issued_on = ?, due_on = ?, paid_on = ?, status = ?, external_url = ?, notes = ?
      WHERE id = ?`
  ).bind(
    f.clientId, f.projectId ?? null, f.ref ?? '', f.kind ?? 'other', f.amountCents ?? 0,
    f.issuedOn || null, f.dueOn || null, f.paidOn || null,
    f.status ?? 'expected', f.externalUrl ?? '', f.notes ?? '', id
  ).run();
}

// Deliberately separate one-click transitions, because these are the actions taken
// most often and making them a trip through the edit form is how a tool stops
// getting used.
export async function markInvoiceSent(db, id, today) {
  await db.prepare(
    `UPDATE invoices SET status = 'sent', issued_on = COALESCE(issued_on, ?) WHERE id = ?`
  ).bind(today, id).run();
}

export async function markInvoicePaid(db, id, today) {
  await db.prepare(
    `UPDATE invoices SET status = 'paid', paid_on = COALESCE(paid_on, ?),
            issued_on = COALESCE(issued_on, ?) WHERE id = ?`
  ).bind(today, today, id).run();
}

export async function voidInvoice(db, id) {
  await db.prepare("UPDATE invoices SET status = 'void' WHERE id = ?").bind(id).run();
}

// ── Retainers ─────────────────────────────

export async function listRetainers(db) {
  const { results } = await db.prepare(
    `SELECT r.id, r.client_id, r.label, r.amount_cents, r.day_of_month, r.active,
            r.started_on, r.ended_on, c.name AS client_name
       FROM retainers r JOIN clients c ON c.id = r.client_id
      ORDER BY r.active DESC, c.name, r.label`
  ).all();
  return results ?? [];
}

export async function listRetainersForClient(db, clientId) {
  const { results } = await db.prepare(
    `SELECT id, label, amount_cents, day_of_month, active, started_on, ended_on
       FROM retainers WHERE client_id = ? ORDER BY active DESC, label`
  ).bind(clientId).all();
  return results ?? [];
}

// Active retainers with no retainer invoice recorded in the given month.
// `period` is 'YYYY-MM'. The LIKE against issued_on is why issued_on must be
// stored as YYYY-MM-DD: a different format would silently match nothing and this
// would report every retainer as unbilled forever.
export async function listUnbilledRetainers(db, period) {
  const { results } = await db.prepare(
    `SELECT r.id, r.client_id, r.label, r.amount_cents, r.day_of_month, c.name AS client_name
       FROM retainers r JOIN clients c ON c.id = r.client_id
      WHERE r.active = 1
        AND (r.started_on IS NULL OR substr(r.started_on, 1, 7) <= ?)
        AND (r.ended_on IS NULL OR substr(r.ended_on, 1, 7) >= ?)
        AND NOT EXISTS (
          SELECT 1 FROM invoices i
           WHERE i.client_id = r.client_id
             AND i.kind = 'retainer'
             AND i.status <> 'void'
             AND substr(COALESCE(i.issued_on, i.due_on), 1, 7) = ?
        )
      ORDER BY r.day_of_month, c.name`
  ).bind(period, period, period).all();
  return results ?? [];
}

export async function createRetainer(db, f) {
  await db.prepare(
    `INSERT INTO retainers (client_id, label, amount_cents, day_of_month, active, started_on, ended_on)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    f.clientId, f.label, f.amountCents ?? 0, f.dayOfMonth ?? 1,
    f.active ? 1 : 0, f.startedOn || null, f.endedOn || null
  ).run();
}

export async function setRetainerActive(db, id, active) {
  await db.prepare('UPDATE retainers SET active = ? WHERE id = ?').bind(active ? 1 : 0, id).run();
}

export async function deleteRetainer(db, id) {
  await db.prepare('DELETE FROM retainers WHERE id = ?').bind(id).run();
}

// ── Follow-ups ────────────────────────────

const FOLLOWUP_SELECT = `SELECT f.id, f.title, f.detail, f.due_on, f.done_at, f.created_at,
       f.client_id, f.project_id, c.name AS client_name, p.name AS project_name
  FROM followups f
  LEFT JOIN clients c ON c.id = f.client_id
  LEFT JOIN projects p ON p.id = f.project_id`;

// Undated open items sort last rather than first: they are not urgent, but they
// must stay visible or the list becomes where things go to be forgotten.
export async function listFollowups(db, filter = 'open') {
  const where = {
    open: 'f.done_at IS NULL',
    done: 'f.done_at IS NOT NULL',
    all: '1 = 1',
  }[filter] ?? 'f.done_at IS NULL';

  const { results } = await db.prepare(
    `${FOLLOWUP_SELECT} WHERE ${where}
      ORDER BY f.done_at IS NOT NULL, COALESCE(f.due_on, '9999-12-31'), f.created_at DESC`
  ).all();
  return results ?? [];
}

export async function listFollowupsForClient(db, clientId) {
  const { results } = await db.prepare(
    `${FOLLOWUP_SELECT} WHERE f.client_id = ? AND f.done_at IS NULL
      ORDER BY COALESCE(f.due_on, '9999-12-31')`
  ).bind(clientId).all();
  return results ?? [];
}

export async function createFollowup(db, f) {
  await db.prepare(
    `INSERT INTO followups (title, detail, client_id, project_id, due_on, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    f.title, f.detail ?? '', f.clientId ?? null, f.projectId ?? null,
    f.dueOn || null, f.createdAt
  ).run();
}

export async function setFollowupDone(db, id, iso) {
  await db.prepare('UPDATE followups SET done_at = ? WHERE id = ?').bind(iso, id).run();
}

export async function reopenFollowup(db, id) {
  await db.prepare('UPDATE followups SET done_at = NULL WHERE id = ?').bind(id).run();
}

export async function deleteFollowup(db, id) {
  await db.prepare('DELETE FROM followups WHERE id = ?').bind(id).run();
}
