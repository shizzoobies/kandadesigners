/* =============================================
   K & A PERFORMANCE — newsletter unsubscribe
   Cloudflare Pages Function — GET /api/unsubscribe?t=<token>
   The token is the secret: minted per lead at capture time, stored in
   ka-admin D1, unguessable, and the only thing this endpoint accepts.
   One click out, no login, no confirmation maze.
   ============================================= */

const page = (title, body) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title} | K &amp; A Performance</title></head>
<body style="margin:0;background:#F8F5F2;color:#221C15;font-family:Georgia,serif;">
<div style="max-width:560px;margin:0 auto;padding:80px 24px;">
<p style="font-family:Courier,monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#9A3412;margin:0 0 24px 0;">K &amp; A Performance</p>
<h1 style="font-size:28px;margin:0 0 16px 0;">${title}</h1>
<p style="font-size:16px;line-height:1.6;color:#6C635A;margin:0;">${body}</p>
</div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );

export async function onRequestGet(context) {
  const { request, env } = context;
  const token = new URL(request.url).searchParams.get('t') ?? '';

  if (!/^[a-zA-Z0-9-]{8,64}$/.test(token)) {
    return page('That link did not work', 'The unsubscribe link looks incomplete. Try the link from the bottom of the email again, or write to alex@ka-performancefl.com and we will take you off by hand.');
  }
  if (!env.ADMIN_DB) {
    return page('One moment', 'Unsubscribing is briefly unavailable. Write to alex@ka-performancefl.com and we will take you off by hand, today.');
  }

  try {
    const r = await env.ADMIN_DB.prepare(
      `UPDATE course_leads SET unsubscribed_at = ? WHERE unsubscribe_token = ? AND unsubscribed_at IS NULL`
    ).bind(new Date().toISOString(), token).run();

    if (r.meta?.changes > 0) {
      return page('You are unsubscribed', 'No more emails from us. The free course stays yours either way. If this was a misclick, just sign up again from the course page.');
    }
    return page('Already done', 'That address is already off the list, or the link was used before. Either way, no more emails.');
  } catch {
    return page('One moment', 'Something went wrong on our side. Write to alex@ka-performancefl.com and we will take you off by hand, today.');
  }
}
