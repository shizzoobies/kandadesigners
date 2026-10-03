/* =============================================
   K & A PERFORMANCE — free course email gate
   Cloudflare Pages Function — /api/course-lead
   The course is free; the email is the price. Every lead lands in two
   places on purpose: the archived ka-admin D1 (still bound as ADMIN_DB)
   and the business email inbox (the same place every other site
   lead arrives, so nothing new needs watching).
   ============================================= */

import { leadSource, readLeadRequest, sendLeadEmail, validEmail } from '../../lib/lead-email.js';
const MAX_NAME = 80;
const MAX_EMAIL = 254;

export async function onRequestPost(context) {
  const { request, env } = context;

  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const body = await readLeadRequest(request);

    // Honeypot: the visible form never fills this.
    if (body.botcheck) return json({ ok: true });

    if ((body.name !== undefined && typeof body.name !== 'string') ||
        (body.name || '').length > MAX_NAME || !validEmail(body.email)) {
      return json({ error: 'Please check your name and email.' }, 400);
    }
    const name = String(body.name ?? '').trim().slice(0, MAX_NAME);
    const email = String(body.email ?? '').trim().toLowerCase().slice(0, MAX_EMAIL);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'That email could not be read.' }, 400);
    }

    // First-touch attribution, read server-side from the same ka_src cookie
    // the whole site writes. The client never gets to assert its own source.
    const source = leadSource(request);

    const now = new Date().toISOString();
    let leadToken = '';

    // The list itself. Missing binding degrades gracefully: the lead still
    // reaches the inbox, and the error message says exactly what to fix.
    let stored = false;
    if (env.ADMIN_DB) {
      try {
        // The unsubscribe token is minted here, at capture time, so every
        // lead can leave the newsletter with one click. Conflict keeps the
        // original token: links in already-sent emails must stay valid.
        const token = crypto.randomUUID().replace(/-/g, '');
        await env.ADMIN_DB.prepare(
          `INSERT INTO course_leads (name, email, source, unsubscribe_token, created_at, last_seen_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(email) DO UPDATE SET
             name = CASE WHEN excluded.name != '' THEN excluded.name ELSE course_leads.name END,
             times = course_leads.times + 1,
             last_seen_at = excluded.last_seen_at`
        ).bind(name, email, source, token, now, now).run();
        stored = true;
        // Return the lead's actual token (the conflict path keeps the
        // original), so the gate cookie ties course analytics to this lead.
        const row = await env.ADMIN_DB.prepare(
          'SELECT unsubscribe_token AS t FROM course_leads WHERE email = ?'
        ).bind(email).first();
        if (row?.t) leadToken = row.t;
      } catch (e) {
        console.log('course_lead_db_error', String(e).slice(0, 120));
      }
    } else {
      console.log('course_lead_db_unbound: add the ADMIN_DB D1 binding (ka-admin) to this Pages project');
    }

    // The inbox copy.
    let mailed = false;
    try {
      await sendLeadEmail(env, {
        email,
        subject: 'New course lead | ka-performancefl.com',
        text: `name: ${name || '(no name)'}\n\nemail: ${email}\n\nsource: ${source}`,
      });
      mailed = true;
    } catch {
      console.error('course_lead_notification_failed');
    }

    if (!stored && !mailed) {
      return json({ error: 'Something went wrong. Email alex@ka-performancefl.com and we will send you the course link directly.' }, 502);
    }
    return json(leadToken ? { ok: true, t: leadToken } : { ok: true });
  } catch (error) {
    return json({ error: 'Bad request.' }, error.status || 400);
  }
}
