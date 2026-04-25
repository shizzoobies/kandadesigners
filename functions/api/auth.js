import { createAuthCookie } from '../../lib/auth-cookie.js';

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, 400);
  }

  const { passphrase } = body;
  if (!passphrase || passphrase !== env.APP_PASSPHRASE) {
    return jsonResponse({ error: 'Wrong passphrase.' }, 401);
  }

  const cookie = await createAuthCookie(env.COOKIE_SIGNING_SECRET);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
