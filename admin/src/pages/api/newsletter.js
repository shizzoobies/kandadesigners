// POST /api/newsletter — the workbench's writes: create a draft from jotted
// notes, save edits, run the Opus polish, test to self, real send (typed
// SEND), delete a draft. Sends only ever go to still-subscribed leads, and
// a sent newsletter is immutable: every intent but none checks status.

import {
  createDraft, getNewsletter, updateDraft, deleteDraft, markSent,
  listSendableLeads,
} from '../../lib/db.js';
import { sendNewsletter, sendTest, polishWithOpus } from '../../lib/newsletter.js';
import { nowIso } from '../../lib/format.js';

const seeOther = (location) => new Response(null, { status: 303, headers: { Location: location } });

const MAX_SUBJECT = 150;
const MAX_BODY = 40000;
const MAX_NOTES = 8000;

export async function POST({ request, locals }) {
  const db = locals.runtime.env.DB;
  const env = locals.runtime.env;
  const form = await request.formData();
  const intent = String(form.get('intent') ?? '');
  const now = nowIso();

  if (intent === 'create') {
    const notes = String(form.get('notes') ?? '').trim().slice(0, MAX_NOTES);
    const id = await createDraft(db, { notes, now });
    return seeOther(`/newsletter/${id}`);
  }

  const id = Number(form.get('id'));
  const letter = id ? await getNewsletter(db, id) : null;
  if (!letter) return seeOther('/newsletter?error=missing');
  const here = `/newsletter/${letter.id}`;
  if (letter.status !== 'draft') return seeOther(`${here}?error=sent`);

  const subject = String(form.get('subject') ?? letter.subject).trim().slice(0, MAX_SUBJECT);
  const notes = String(form.get('notes') ?? letter.notes).trim().slice(0, MAX_NOTES);
  const body = String(form.get('body') ?? letter.body).trim().slice(0, MAX_BODY);

  if (intent === 'save') {
    await updateDraft(db, letter.id, { subject, notes, body, now });
    return seeOther(`${here}?saved=1`);
  }

  if (intent === 'delete') {
    await deleteDraft(db, letter.id);
    return seeOther('/newsletter?deleted=1');
  }

  if (intent === 'polish') {
    // Save first, so a failed polish never eats typed work.
    await updateDraft(db, letter.id, { subject, notes, body, now });
    if (!env.ANTHROPIC_API_KEY) return seeOther(`${here}?error=nokey`);
    try {
      const polished = await polishWithOpus(env, { notes, subject, body });
      await updateDraft(db, letter.id, {
        subject: polished.subject,
        notes,
        body: polished.body,
        now: nowIso(),
      });
      return seeOther(`${here}?polished=1`);
    } catch (e) {
      console.log('polish_error', String(e).slice(0, 160));
      return seeOther(`${here}?error=polish`);
    }
  }

  if (intent === 'test') {
    await updateDraft(db, letter.id, { subject, notes, body, now });
    if (!env.RESEND_API_KEY || !env.NEWSLETTER_FROM) return seeOther(`${here}?error=unconfigured`);
    if (!subject || !body) return seeOther(`${here}?error=incomplete`);
    const ok = await sendTest(env, { subject, body, to: locals.user.email });
    return seeOther(`${here}?${ok ? 'tested=1' : 'error=testfail'}`);
  }

  if (intent === 'send') {
    await updateDraft(db, letter.id, { subject, notes, body, now });
    if (!env.RESEND_API_KEY || !env.NEWSLETTER_FROM) return seeOther(`${here}?error=unconfigured`);
    if (!subject || !body) return seeOther(`${here}?error=incomplete`);
    if (String(form.get('confirm') ?? '').trim().toUpperCase() !== 'SEND') {
      return seeOther(`${here}?error=confirm`);
    }
    const leads = await listSendableLeads(db);
    if (leads.length === 0) return seeOther(`${here}?error=nobody`);

    const { sent, failed } = await sendNewsletter(env, { subject, body, leads });
    if (sent === 0) return seeOther(`${here}?error=sendfail`);
    await markSent(db, letter.id, { sentCount: sent, failCount: failed, sentBy: locals.user.email, now: nowIso() });
    return seeOther(`${here}?sent=${sent}${failed ? `&failed=${failed}` : ''}`);
  }

  return seeOther(`${here}?error=intent`);
}
