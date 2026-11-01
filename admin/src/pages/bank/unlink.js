// "Unlink": removes the item at Plaid, then the link and every bank row here.
// The form carries confirm=yes from its "Yes, unlink" button; anything else
// changes nothing. A form POST, then a 303 back. Owner only, here as well as
// in the middleware.
import { callBankSync, backToBank as back, NOT_CONNECTED } from '../../lib/bank.js';

export async function handleUnlink({ user, bankSync, confirmed }) {
  if (user?.role !== 'owner') return { status: 403 };
  if (!confirmed) return back('Nothing was unlinked. Use Yes, unlink to confirm.');
  if (!bankSync) return back(NOT_CONNECTED);
  const { res, body } = await callBankSync(bankSync, '/unlink');
  if (!res) return back('The unlink could not be started.');
  if (!res.ok) return back(body.error ?? `The unlink failed (${res.status}).`);
  if (!body.ok) return back(body.error ? `The unlink failed: ${body.error}` : 'The unlink failed.');
  if (body.warning) return back(`Unlinked here, and the accounts and transactions are gone from this panel. ${body.warning}`);
  return back('Unlinked. The accounts and transactions are gone from this panel.', 'ok');
}

export async function POST({ request, locals }) {
  if (locals.user?.role !== 'owner') return new Response('Not authorized.', { status: 403 });
  let confirmed = false;
  try {
    confirmed = (await request.formData()).get('confirm') === 'yes';
  } catch {
    confirmed = false;
  }
  const r = await handleUnlink({ user: locals.user, bankSync: locals.runtime.env.BANK_SYNC, confirmed });
  if (r.status === 403) return new Response('Not authorized.', { status: 403 });
  return new Response(null, { status: r.status, headers: { Location: r.location } });
}
