import { verifyAuthCookie } from '../../../lib/auth-cookie.js';

// Starred songs ("bangers") for the daily-songs app, moved off Firestore onto D1
// (2026-08-13) and gated behind the same signed cookie as /api/generate.
//
// `tags` is a plain comma-separated string, not a JSON array: verified against
// all 485 exported songs and all 3 bangers. The client does tags.split(',').

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function refuse(request, env) {
  if (!env.SONGS_DB) {
    return jsonResponse(
      { error: 'Songs database not bound. Add the SONGS_DB D1 binding to this Pages project.' },
      500
    );
  }
  const authed = await verifyAuthCookie(
    request.headers.get('Cookie'),
    env.COOKIE_SIGNING_SECRET
  );
  if (!authed) return jsonResponse({ error: 'Unauthorized.' }, 401);
  return null;
}

const str = (value) => (typeof value === 'string' ? value : '');

export async function onRequestGet(context) {
  const { request, env } = context;
  const blocked = await refuse(request, env);
  if (blocked) return blocked;

  const { results } = await env.SONGS_DB.prepare(
    `SELECT id, title, prompt, description, tags, lane, date, marked_at
       FROM bangers ORDER BY marked_at DESC`
  ).all();

  const bangers = (results ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    description: row.description,
    tags: row.tags,
    lane: row.lane,
    date: row.date,
    markedAt: row.marked_at,
  }));

  return jsonResponse({ bangers });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const blocked = await refuse(request, env);
  if (blocked) return blocked;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400);
  }

  const title = str(body?.title).trim();
  if (!title) return jsonResponse({ error: 'title is required.' }, 400);

  const markedAt = new Date().toISOString();

  // Upsert rather than insert: title is UNIQUE, and a double-clicked star would
  // otherwise fail the constraint and surface as a 500.
  const row = await env.SONGS_DB.prepare(
    `INSERT INTO bangers (title, prompt, description, tags, lane, date, marked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(title) DO UPDATE SET
       prompt = excluded.prompt,
       description = excluded.description,
       tags = excluded.tags,
       lane = excluded.lane,
       date = excluded.date,
       marked_at = excluded.marked_at
     RETURNING id`
  ).bind(
    title,
    str(body.prompt),
    str(body.description),
    str(body.tags),
    str(body.lane),
    str(body.date) || markedAt.slice(0, 10),
    markedAt
  ).first();

  return jsonResponse({ id: row.id, title, markedAt });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const blocked = await refuse(request, env);
  if (blocked) return blocked;

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return jsonResponse({ error: 'A positive integer id is required.' }, 400);
  }

  await env.SONGS_DB.prepare('DELETE FROM bangers WHERE id = ?').bind(id).run();
  return jsonResponse({ ok: true });
}
