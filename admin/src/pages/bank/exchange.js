// Plaid Link's onSuccess posts the public token and institution here; the
// exchange, the sealing of the access token and the first sync all happen in
// ka-bank-sync. JSON in ({ publicToken, institution: { id, name } }) and out
// ({ ok, accounts }). Owner only, here as well as in the middleware.
import { callBankSync, NOT_CONNECTED, isJson, readJson } from '../../lib/bank.js';

const str = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

export async function handleExchange({ user, bankSync, body = {} }) {
  if (user?.role !== 'owner') return { status: 403, body: { ok: false, error: 'Not authorized.' } };
  const publicToken = str(body.publicToken, 200);
  if (!publicToken) return { status: 400, body: { ok: false, error: 'Plaid did not return a public token.' } };
  if (!bankSync) return { status: 503, body: { ok: false, error: NOT_CONNECTED } };
  const inst = body.institution && typeof body.institution === 'object' ? body.institution : {};
  const institution = { id: str(inst.id, 64), name: str(inst.name, 120) };
  const { res, body: out } = await callBankSync(bankSync, '/exchange', { publicToken, institution });
  if (!res) return { status: 502, body: { ok: false, error: 'The link could not be saved. Try again.' } };
  if (!res.ok) return { status: res.status, body: { ok: false, error: out.error ?? `The link could not be saved (${res.status}).` } };
  return { status: 200, body: { ok: Boolean(out.ok), accounts: Number(out.accounts ?? 0), ...(out.error ? { error: out.error } : {}) } };
}

export async function POST({ request, locals }) {
  if (!isJson(request)) return Response.json({ ok: false, error: 'Send JSON.' }, { status: 415 });
  const r = await handleExchange({ user: locals.user, bankSync: locals.runtime.env.BANK_SYNC, body: await readJson(request) });
  return Response.json(r.body, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
}
