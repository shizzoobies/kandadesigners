// "Sync now" on the bank panel: a form POST, then a 303 back with a message.
// The pull runs in ka-bank-sync, reached through the BANK_SYNC service
// binding, so the Plaid credentials and the access token never reach the
// admin. Owner only, here as well as in the middleware.
import { callBankSync, backToBank as back, NOT_CONNECTED } from '../../lib/bank.js';
import { openRun } from '../../lib/bank-sync.js';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export async function handleSync({ user, bankSync, db, nowMs = Date.now() }) {
  if (user?.role !== 'owner') return { status: 403 };
  if (!bankSync) return back(NOT_CONNECTED);
  if (db && await openRun(db, nowMs)) return back('A sync is already running. Try again in a few minutes.');
  const { res, body } = await callBankSync(bankSync, '/sync');
  if (!res) return back('The sync could not be started.');
  if (!res.ok) return back(body.error ?? `The sync failed (${res.status}).`);
  if (!body.ok) return back(body.error ? `The sync failed: ${body.error}` : 'The sync failed.');
  return back(`Synced. ${plural(body.added ?? 0, 'new transaction', 'new transactions')}, ${body.modified ?? 0} changed, ${body.removed ?? 0} removed.`, 'ok');
}

export async function POST({ locals }) {
  const env = locals.runtime.env;
  const r = await handleSync({ user: locals.user, bankSync: env.BANK_SYNC, db: env.DB });
  if (r.status === 403) return new Response('Not authorized.', { status: 403 });
  return new Response(null, { status: r.status, headers: { Location: r.location } });
}
