// Key/value persistence for screens that hold one JSON document.
//
// The parked Launch Book was written against a `window.storage.get/set/delete`
// API that nothing in this app ever defined, so every save threw "Could not
// save". Rather than reshape the artifact, this route provides exactly that
// contract over D1 (table app_state, migration 0007) and the page talks to it.
//
// This is the only route in the admin that takes JSON rather than a form post,
// because its caller is a fetch from a static-feeling page, not a <form>.
//
// Gating is the middleware's: it has already proved an Access identity, looked
// the user up in `users`, and bounced role 'client' to /members, so anything
// reaching this handler is owner or staff.
import { getAppState, setAppState, deleteAppState } from '../../lib/db.js';
import { nowIso } from '../../lib/format.js';

// Whitelist, in the style of the enum whitelists elsewhere. Without it this is
// an unbounded staff-writable store, and a bug in any page could scribble over
// another page's key.
export const STATE_KEYS = ['kap:launchbook'];

export function isStateKey(raw) {
  return STATE_KEYS.includes(String(raw ?? ''));
}

// 1 MiB. The Launch Book is a few hundred rows of JSON at most; this stops a
// runaway client from parking something huge in a D1 row.
export const MAX_VALUE_BYTES = 1024 * 1024;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

export async function GET({ url, locals }) {
  const key = url.searchParams.get('key');
  if (!isStateKey(key)) return json({ error: 'key' }, 400);

  const row = await getAppState(locals.runtime.env.DB, key);
  // A key that has never been written is not an error; it is an empty book.
  return json({ value: row?.value ?? null, updatedAt: row?.updated_at ?? null });
}

export async function POST({ request, locals }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'body' }, 400);
  }

  if (!isStateKey(body?.key)) return json({ error: 'key' }, 400);

  const value = body?.value;
  if (typeof value !== 'string') return json({ error: 'value' }, 400);
  if (new TextEncoder().encode(value).length > MAX_VALUE_BYTES) {
    return json({ error: 'too_large' }, 413);
  }

  await setAppState(locals.runtime.env.DB, body.key, value, {
    now: nowIso(),
    // Authorship from the verified identity, never from the request body.
    email: locals.user?.email ?? '',
  });
  return json({ ok: true });
}

export async function DELETE({ url, locals }) {
  const key = url.searchParams.get('key');
  if (!isStateKey(key)) return json({ error: 'key' }, 400);

  await deleteAppState(locals.runtime.env.DB, key);
  return json({ ok: true });
}
