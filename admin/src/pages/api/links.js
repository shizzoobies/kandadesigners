import { createLink, deleteLink } from '../../lib/db.js';

const seeOther = (location) => new Response(null, { status: 303, headers: { Location: location } });

// Only ever redirect to a same-origin path, never to a caller-supplied URL.
// The `//` check blocks protocol-relative URLs like //evil.example.com.
function safeReturn(raw, fallback) {
  const value = String(raw ?? '');
  return value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

// Only http and https. Blocks javascript: and data: URLs, which would otherwise
// become a stored-XSS vector the moment the link is rendered as an href.
function safeUrl(raw) {
  try {
    const parsed = new URL(String(raw));
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

const KINDS = ['live', 'staging', 'repo', 'drive', 'gbp', 'social', 'dashboard', 'other'];

export async function POST({ request, locals }) {
  const db = locals.runtime.env.DB;
  const form = await request.formData();
  const intent = form.get('intent');
  const back = safeReturn(form.get('returnTo'), '/clients');

  if (intent === 'create') {
    const clientId = Number(form.get('clientId'));
    const label = String(form.get('label') ?? '').trim();
    const url = safeUrl(form.get('url'));
    const rawKind = String(form.get('kind') ?? 'other');
    const kind = KINDS.includes(rawKind) ? rawKind : 'other';

    if (!Number.isInteger(clientId) || clientId <= 0) return seeOther('/clients?error=id');
    if (!label) return seeOther(`${back}?error=label`);
    if (!url) return seeOther(`${back}?error=url`);

    await createLink(db, { clientId, label, url, kind, sortOrder: 0 });
    return seeOther(back);
  }

  if (intent === 'delete') {
    const id = Number(form.get('id'));
    if (Number.isInteger(id) && id > 0) await deleteLink(db, id);
    return seeOther(back);
  }

  return seeOther(`${back}?error=intent`);
}
