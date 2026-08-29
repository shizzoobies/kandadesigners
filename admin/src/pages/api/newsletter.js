// POST /api/newsletter — test sends and the real send, PM-admin style:
// the real send requires the word SEND typed into the confirm field, goes
// only to leads who have not unsubscribed, and lands in the history table
// whatever the outcome.

import { listSendableLeads, recordNewsletter } from '../../lib/db.js';
import { sendNewsletter, sendTest } from '../../lib/newsletter.js';
import { nowIso } from '../../lib/format.js';

const seeOther = (location) => new Response(null, { status: 303, headers: { Location: location } });

const MAX_SUBJECT = 150;
const MAX_BODY = 20000;

export async function POST({ request, locals }) {
  const db = locals.runtime.env.DB;
  const env = locals.runtime.env;
  const form = await request.formData();
  const intent = String(form.get('intent') ?? '');

  const subject = String(form.get('subject') ?? '').trim().slice(0, MAX_SUBJECT);
  const body = String(form.get('body') ?? '').trim().slice(0, MAX_BODY);
  const back = (q) => seeOther(`/newsletter?${q}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);

  if (!env.RESEND_API_KEY || !env.NEWSLETTER_FROM) return back('error=unconfigured');
  if (!subject) return back('error=subject');
  if (!body) return back('error=body');

  if (intent === 'test') {
    const ok = await sendTest(env, { subject, body, to: locals.user.email });
    return back(ok ? 'tested=1' : 'error=testfail');
  }

  if (intent === 'send') {
    // The typed confirmation, same guard the PM admin uses: a button alone
    // is too easy to hit; typing SEND is a decision.
    if (String(form.get('confirm') ?? '').trim().toUpperCase() !== 'SEND') {
      return back('error=confirm');
    }
    const leads = await listSendableLeads(db);
    if (leads.length === 0) return back('error=nobody');

    const { sent, failed } = await sendNewsletter(env, { subject, body, leads });
    await recordNewsletter(db, {
      subject,
      body,
      sentCount: sent,
      failCount: failed,
      sentBy: locals.user.email,
      now: nowIso(),
    });
    if (sent === 0) return back('error=sendfail');
    return seeOther(`/newsletter?sent=${sent}${failed ? `&failed=${failed}` : ''}`);
  }

  return back('error=intent');
}
