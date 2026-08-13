import {
  createInvoice, updateInvoice, markInvoiceSent, markInvoicePaid, voidInvoice, getProject,
} from '../../lib/db.js';
import { parseMoneyToCents, cleanYmd, todayInEastern } from '../../lib/format.js';

const seeOther = (location) => new Response(null, { status: 303, headers: { Location: location } });

const KINDS = ['deposit', 'balance', 'retainer', 'other'];
const STATUSES = ['expected', 'sent', 'paid', 'void'];

function safeReturn(raw, fallback) {
  const value = String(raw ?? '');
  return value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

// Only http and https, same reasoning as client links: this value is rendered as
// an href, so a javascript: URL here would be stored XSS.
function safeUrl(raw) {
  const value = String(raw ?? '').trim();
  if (value === '') return '';
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

async function readFields(db, form) {
  const amountCents = parseMoneyToCents(form.get('amount'));
  if (amountCents === null) return { error: 'money' };

  const issuedOn = cleanYmd(form.get('issuedOn'));
  const dueOn = cleanYmd(form.get('dueOn'));
  const paidOn = cleanYmd(form.get('paidOn'));
  if (issuedOn === null || dueOn === null || paidOn === null) return { error: 'date' };

  const externalUrl = safeUrl(form.get('externalUrl'));
  if (externalUrl === null) return { error: 'url' };

  const rawKind = String(form.get('kind') ?? 'other');
  const rawStatus = String(form.get('status') ?? 'expected');

  // A project id, when given, decides the client. Trusting the submitted client
  // instead would let an invoice hang off a project belonging to someone else.
  const rawProject = Number(form.get('projectId'));
  let projectId = Number.isInteger(rawProject) && rawProject > 0 ? rawProject : null;
  let clientId = Number(form.get('clientId'));

  if (projectId !== null) {
    const project = await getProject(db, projectId);
    if (!project) return { error: 'project' };
    clientId = project.client_id;
  }

  if (!Number.isInteger(clientId) || clientId <= 0) return { error: 'client' };

  return {
    fields: {
      clientId,
      projectId,
      ref: String(form.get('ref') ?? '').trim(),
      kind: KINDS.includes(rawKind) ? rawKind : 'other',
      amountCents,
      issuedOn,
      dueOn,
      paidOn,
      status: STATUSES.includes(rawStatus) ? rawStatus : 'expected',
      externalUrl,
      notes: String(form.get('notes') ?? '').trim(),
    },
  };
}

export async function POST({ request, locals }) {
  const db = locals.runtime.env.DB;
  const form = await request.formData();
  const intent = form.get('intent');
  const back = safeReturn(form.get('returnTo'), '/invoices');
  const today = todayInEastern();

  // One-click transitions. These are the actions taken most often, so they do not
  // route through the edit form.
  if (intent === 'sent' || intent === 'paid' || intent === 'void') {
    const id = Number(form.get('id'));
    if (!Number.isInteger(id) || id <= 0) return seeOther(`${back}?error=id`);
    if (intent === 'sent') await markInvoiceSent(db, id, today);
    if (intent === 'paid') await markInvoicePaid(db, id, today);
    if (intent === 'void') await voidInvoice(db, id);
    return seeOther(back);
  }

  const { fields, error } = await readFields(db, form);

  if (intent === 'create') {
    if (error) return seeOther(`${back}?error=${error}`);
    await createInvoice(db, fields);
    return seeOther(back);
  }

  if (intent === 'update') {
    const id = Number(form.get('id'));
    if (!Number.isInteger(id) || id <= 0) return seeOther(`${back}?error=id`);
    if (error) return seeOther(`${back}?error=${error}`);
    await updateInvoice(db, id, fields);
    return seeOther(`${back}?saved=1`);
  }

  return seeOther(`${back}?error=intent`);
}
