/* =============================================
   K & A PERFORMANCE — free course email gate
   Cloudflare Pages Function — /api/course-lead
   The course is free; the email is the price. Every lead lands in two
   places on purpose: the ka-admin D1 (the list, browsable in the admin's
   coaching page) and the Web3Forms inbox (the same place every other site
   lead arrives, so nothing new needs watching).
   ============================================= */

const WEB3FORMS_KEY = '7ad90fb9-bc88-411a-9442-c249b49c32f6';
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
    const body = await request.json();

    // Honeypot: the visible form never fills this.
    if (body.botcheck) return json({ ok: true });

    const name = String(body.name ?? '').trim().slice(0, MAX_NAME);
    const email = String(body.email ?? '').trim().toLowerCase().slice(0, MAX_EMAIL);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'That email could not be read.' }, 400);
    }

    // First-touch attribution, read server-side from the same ka_src cookie
    // the whole site writes. The client never gets to assert its own source.
    const cookie = request.headers.get('Cookie') || '';
    const src = cookie.match(/(?:^|;\s*)ka_src=([^;]+)/)?.[1];
    let source = 'direct';
    if (src) {
      try { source = decodeURIComponent(src).slice(0, 60); } catch { source = src.slice(0, 60); }
    }

    const now = new Date().toISOString();

    // The list itself. Missing binding degrades gracefully: the lead still
    // reaches the inbox, and the error message says exactly what to fix.
    let stored = false;
    if (env.ADMIN_DB) {
      try {
        await env.ADMIN_DB.prepare(
          `INSERT INTO course_leads (name, email, source, created_at, last_seen_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(email) DO UPDATE SET
             name = CASE WHEN excluded.name != '' THEN excluded.name ELSE course_leads.name END,
             times = course_leads.times + 1,
             last_seen_at = excluded.last_seen_at`
        ).bind(name, email, source, now, now).run();
        stored = true;
      } catch (e) {
        console.log('course_lead_db_error', String(e).slice(0, 120));
      }
    } else {
      console.log('course_lead_db_unbound: add the ADMIN_DB D1 binding (ka-admin) to this Pages project');
    }

    // The inbox copy.
    let mailed = false;
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: 'New course lead | ka-performancefl.com',
          from_name: 'K & A Performance Website',
          name: name || '(no name)',
          email,
          source,
        }),
      });
      const d = await r.json();
      mailed = !!d.success;
    } catch {
      /* the D1 row already has it */
    }

    if (!stored && !mailed) {
      return json({ error: 'Something went wrong. Email alex@ka-performancefl.com and we will send you the course link directly.' }, 502);
    }
    return json({ ok: true });
  } catch {
    return json({ error: 'Bad request.' }, 400);
  }
}
