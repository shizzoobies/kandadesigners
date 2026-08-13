import { verifyAuthCookie } from '../../../lib/auth-cookie.js';

// Generation history for the daily-songs app, moved off Firestore onto D1
// (2026-08-13). Previously the browser talked to Firestore directly with rules
// that allowed anonymous reads, so this data was world-readable. It is now
// behind the same signed-cookie gate as /api/generate.

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Returns a Response when the request must not proceed, otherwise null.
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

function safeParseArray(text) {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const blocked = await refuse(request, env);
  if (blocked) return blocked;

  const { results } = await env.SONGS_DB.prepare(
    'SELECT id, date, lane, generated_at, songs_json FROM generations ORDER BY generated_at DESC'
  ).all();

  // generatedAt is an ISO-8601 string, not a Firestore Timestamp. The client was
  // updated to match: it used to call .toDate() and .toMillis() on this value.
  const entries = (results ?? []).map((row) => ({
    id: row.id,
    date: row.date,
    lane: row.lane,
    generatedAt: row.generated_at,
    songs: safeParseArray(row.songs_json),
  }));

  return jsonResponse({ entries });
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

  const songs = Array.isArray(body?.songs) ? body.songs : null;
  if (!songs || songs.length === 0) {
    return jsonResponse({ error: 'songs must be a non-empty array.' }, 400);
  }

  const lane = typeof body.lane === 'string' ? body.lane : '';
  const now = new Date();
  const date = now.toISOString().slice(0, 10);

  const row = await env.SONGS_DB.prepare(
    `INSERT INTO generations (date, lane, generated_at, songs_json)
     VALUES (?, ?, ?, ?) RETURNING id`
  ).bind(date, lane, now.toISOString(), JSON.stringify(songs)).first();

  return jsonResponse({ id: row.id, date, lane, generatedAt: now.toISOString() });
}
