// A Plaid Link token for the link page, from ka-bank-sync. JSON in
// ({ update }) and out ({ link_token, expiration }). The token is short-lived
// and opens Link for this admin only. Owner only, here as well as in the
// middleware. JSON only: a cross-site form cannot send it, and Astro's origin
// check covers the form types.
import { callBankSync, NOT_CONNECTED, isJson, readJson } from '../../lib/bank.js';

export async function handleLinkToken({ user, bankSync, update = false }) {
  if (user?.role !== 'owner') return { status: 403, body: { error: 'Not authorized.' } };
  if (!bankSync) return { status: 503, body: { error: NOT_CONNECTED } };
  const { res, body } = await callBankSync(bankSync, '/link-token', { userId: String(user.id), update: update === true });
  if (!res) return { status: 502, body: { error: 'Plaid could not be reached. Try again.' } };
  if (!res.ok) return { status: res.status, body: { error: body.error ?? `The bank sync Worker did not answer (${res.status}).` } };
  if (typeof body.link_token !== 'string') return { status: 502, body: { error: 'Plaid did not give a link token.' } };
  return { status: 200, body: { link_token: body.link_token, expiration: body.expiration ?? null } };
}

export async function POST({ request, locals }) {
  if (!isJson(request)) return Response.json({ error: 'Send JSON.' }, { status: 415 });
  const { update } = await readJson(request);
  const r = await handleLinkToken({ user: locals.user, bankSync: locals.runtime.env.BANK_SYNC, update: update === true });
  return Response.json(r.body, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
}
