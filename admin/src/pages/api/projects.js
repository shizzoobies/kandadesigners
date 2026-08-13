import { createProject, updateProject, archiveProject } from '../../lib/db.js';
import { nowIso, parseMoneyToCents, cleanYmd } from '../../lib/format.js';

const seeOther = (location) => new Response(null, { status: 303, headers: { Location: location } });

const STATUSES = ['quoted', 'active', 'on_hold', 'delivered', 'complete', 'cancelled'];
const WAITING = ['us', 'client', 'artist'];

// Pulls and validates every field. Returns { fields } or { error } so the caller
// can bounce back with a message instead of writing a half-trusted row.
function readFields(form) {
  const name = String(form.get('name') ?? '').trim();
  if (!name) return { error: 'name' };

  const clientId = Number(form.get('clientId'));
  if (!Number.isInteger(clientId) || clientId <= 0) return { error: 'client' };

  const rawStatus = String(form.get('status') ?? 'active');
  const status = STATUSES.includes(rawStatus) ? rawStatus : 'active';

  const rawWaiting = String(form.get('waitingOn') ?? '');
  const waitingOn = WAITING.includes(rawWaiting) ? rawWaiting : null;

  const totalQuotedCents = parseMoneyToCents(form.get('totalQuoted'));
  if (totalQuotedCents === null) return { error: 'money' };

  const startedOn = cleanYmd(form.get('startedOn'));
  const dueOn = cleanYmd(form.get('dueOn'));
  const deliveredOn = cleanYmd(form.get('deliveredOn'));
  if (startedOn === null || dueOn === null || deliveredOn === null) return { error: 'date' };

  return {
    fields: { name, clientId, status, waitingOn, totalQuotedCents, startedOn, dueOn, deliveredOn },
  };
}

export async function POST({ request, locals }) {
  const db = locals.runtime.env.DB;
  const form = await request.formData();
  const intent = form.get('intent');
  const iso = nowIso();

  if (intent === 'archive') {
    const id = Number(form.get('id'));
    if (!Number.isInteger(id) || id <= 0) return seeOther('/projects?error=id');
    await archiveProject(db, id, iso);
    return seeOther('/projects?archived=1');
  }

  const { fields, error } = readFields(form);

  if (intent === 'create') {
    if (error) return seeOther(`/projects?error=${error}`);
    const id = await createProject(db, { ...fields, createdAt: iso });
    return seeOther(`/projects/${id}`);
  }

  if (intent === 'update') {
    const id = Number(form.get('id'));
    if (!Number.isInteger(id) || id <= 0) return seeOther('/projects?error=id');
    if (error) return seeOther(`/projects/${id}?error=${error}`);
    await updateProject(db, id, { ...fields, updatedAt: iso });
    return seeOther(`/projects/${id}?saved=1`);
  }

  return seeOther('/projects?error=intent');
}
