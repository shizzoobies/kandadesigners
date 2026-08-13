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
