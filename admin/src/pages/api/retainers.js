import { createRetainer, setRetainerActive, deleteRetainer } from '../../lib/db.js';
import { parseMoneyToCents, cleanYmd } from '../../lib/format.js';

const seeOther = (location) => new Response(null, { status: 303, headers: { Location: location } });

function safeReturn(raw, fallback) {
  const value = String(raw ?? '');
  return value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

export async function POST({ request, locals }) {
  const db = locals.runtime.env.DB;
  const form = await request.formData();
  const intent = form.get('intent');
  const back = safeReturn(form.get('returnTo'), '/invoices');

  if (intent === 'pause' || intent === 'resume') {
    const id = Number(form.get('id'));
    if (!Number.isInteger(id) || id <= 0) return seeOther(`${back}?error=id`);
    await setRetainerActive(db, id, intent === 'resume');
    return seeOther(back);
  }

  if (intent === 'delete') {
    const id = Number(form.get('id'));
    if (!Number.isInteger(id) || id <= 0) return seeOther(`${back}?error=id`);
    await deleteRetainer(db, id);
    return seeOther(back);
  }

  if (intent === 'create') {
    const clientId = Number(form.get('clientId'));
    if (!Number.isInteger(clientId) || clientId <= 0) return seeOther(`${back}?error=client`);

    const label = String(form.get('label') ?? '').trim();
    if (!label) return seeOther(`${back}?error=label`);

    const amountCents = parseMoneyToCents(form.get('amount'));
    if (amountCents === null) return seeOther(`${back}?error=money`);

    // Capped at 28 by the schema so a monthly charge cannot silently skip
    // February. Validated here too, so a bad value is a message not a 500.
    const dayOfMonth = Number(form.get('dayOfMonth'));
    if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 28) {
      return seeOther(`${back}?error=day`);
    }

    const startedOn = cleanYmd(form.get('startedOn'));
    if (startedOn === null) return seeOther(`${back}?error=date`);

    await createRetainer(db, {
      clientId, label, amountCents, dayOfMonth, active: true, startedOn, endedOn: '',
    });
    return seeOther(back);
  }

  return seeOther(`${back}?error=intent`);
}
