import { createNote, deleteNote } from '../../lib/db.js';
import { nowIso } from '../../lib/format.js';

const seeOther = (location) => new Response(null, { status: 303, headers: { Location: location } });

function safeReturn(raw, fallback) {
  const value = String(raw ?? '');
  return value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

const ENTITY_TYPES = ['client', 'project', 'invoice'];

export async function POST({ request, locals }) {
  const db = locals.runtime.env.DB;
  const form = await request.formData();
  const intent = form.get('intent');
  const back = safeReturn(form.get('returnTo'), '/clients');

  if (intent === 'create') {
    const body = String(form.get('body') ?? '').trim();
    if (!body) return seeOther(`${back}?error=note`);

    const rawType = String(form.get('entityType') ?? '');
    const entityType = ENTITY_TYPES.includes(rawType) ? rawType : null;
    const rawId = Number(form.get('entityId'));
    const entityId = Number.isInteger(rawId) && rawId > 0 ? rawId : null;

    await createNote(db, {
      entityType,
      entityId,
      body,
      // Authorship comes from the verified identity, never from the form.
      authorEmail: locals.user.email,
      pinned: form.get('pinned') === '1',
      createdAt: nowIso(),
    });
    return seeOther(back);
  }

  if (intent === 'delete') {
    const id = Number(form.get('id'));
    if (Number.isInteger(id) && id > 0) await deleteNote(db, id);
    return seeOther(back);
  }

  return seeOther(`${back}?error=intent`);
}
