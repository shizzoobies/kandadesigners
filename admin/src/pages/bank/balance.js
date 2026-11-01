// "Refresh balance": Plaid's live balance call, which Plaid charges for per
// call, so it runs only from this button. A form POST, then a 303 back.
// Owner only, here as well as in the middleware.
import { callBankSync, backToBank as back, NOT_CONNECTED } from '../../lib/bank.js';

export async function handleBalance({ user, bankSync }) {
  if (user?.role !== 'owner') return { status: 403 };
  if (!bankSync) return back(NOT_CONNECTED);
  const { res, body } = await callBankSync(bankSync, '/balance');
  if (!res) return back('The balance refresh could not be started.');
  if (!res.ok) return back(body.error ?? `The balance refresh failed (${res.status}).`);
  if (!body.ok) return back(body.error ? `The balance refresh failed: ${body.error}` : 'The balance refresh failed.');
  return back('Live balance refreshed.', 'ok');
}

export async function POST({ locals }) {
  const r = await handleBalance({ user: locals.user, bankSync: locals.runtime.env.BANK_SYNC });
  if (r.status === 403) return new Response('Not authorized.', { status: 403 });
  return new Response(null, { status: r.status, headers: { Location: r.location } });
}
