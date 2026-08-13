import { createClient, updateClient, archiveClient } from '../../lib/db.js';
import { nowIso } from '../../lib/format.js';

// Form POST plus redirect, so a refresh never resubmits and there is no
// client-side state to keep in sync.
const seeOther = (location) => new Response(null, { status: 303, headers: { Location: location } });

const STATUSES = ['lead', 'active', 'past'];

export async function POST({ request, locals }) {
  const db = locals.runtime.env.DB;
  const form = await request.formData();
  const intent = form.get('intent');
  const iso = nowIso();

  const rawStatus = String(form.get('status') ?? 'active');
  const fields = {
    name: String(form.get('name') ?? '').trim(),
    company: String(form.get('company') ?? '').trim(),
    email: String(form.get('email') ?? '').trim(),
    phone: String(form.get('phone') ?? '').trim(),
    // Validated here as well as by the CHECK constraint, so a bad value is a
    // redirect with a message rather than a 500.
    status: STATUSES.includes(rawStatus) ? rawStatus : 'active',
    source: String(form.get('source') ?? '').trim(),
  };

  if (intent === 'create') {
    if (!fields.name) return seeOther('/clients?error=name');
    const id = await createClient(db, { ...fields, createdAt: iso });
    return seeOther(`/clients/${id}`);
  }

  const id = Number(form.get('id'));
  if (!Number.isInteger(id) || id <= 0) return seeOther('/clients?error=id');

  if (intent === 'update') {
    if (!fields.name) return seeOther(`/clients/${id}?error=name`);
    await updateClient(db, id, { ...fields, updatedAt: iso });
    return seeOther(`/clients/${id}?saved=1`);
  }

  if (intent === 'archive') {
    await archiveClient(db, id, iso);
    return seeOther('/clients?archived=1');
  }

  return seeOther('/clients?error=intent');
}
