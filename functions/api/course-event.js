/* =============================================
   K & A PERFORMANCE — course analytics beacon
   Cloudflare Pages Function — POST /api/course-event
   Own analytics for the remastered course: one row per view or done,
   tied to the lead's token when the gate cookie carries one. Fire and
   forget from the client; this endpoint never has anything to say back.
   ============================================= */

const CHAPTERS = new Set([
  'introduction', 'install', 'sign-in', 'first-request', 'connect',
  'build-a-website', 'build-a-lesson', 'build-an-app', 'recap',
]);
const EVENTS = new Set(['view', 'done']);

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const chapter = String(body.c ?? '');
    const event = String(body.e ?? '');
    if (!CHAPTERS.has(chapter) || !EVENTS.has(event)) {
      return new Response(null, { status: 204 });
    }

    // The gate cookie doubles as identity: a lead's token, "member", or the
    // legacy "1" from before tokens rode along. All are fine; the admin
    // join simply has nothing to say about the anonymous ones.
    const cookie = request.headers.get('Cookie') || '';
    let token = cookie.match(/(?:^|;\s*)ka_course=([^;]+)/)?.[1] ?? '';
    try { token = decodeURIComponent(token); } catch { /* keep raw */ }
    token = token.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);

    if (env.ADMIN_DB) {
      await env.ADMIN_DB.prepare(
        `INSERT INTO course_events (token, chapter, event, created_at) VALUES (?, ?, ?, ?)`
      ).bind(token, chapter, event, new Date().toISOString()).run();
    }
  } catch {
    /* beacons never error to the client */
  }
  return new Response(null, { status: 204 });
}
