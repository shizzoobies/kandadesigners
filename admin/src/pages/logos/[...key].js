// Serves logos and fetched icons from R2. Behind the middleware like every
// route, so logos are only visible to people who can see the dashboard.
// SVG uploads are served with a locked-down CSP and nosniff; they only ever
// render inside <img>, where scripts do not run, and this keeps it that way
// if someone opens one directly.

export async function GET({ params, locals }) {
  const key = params.key ?? '';
  if (!/^(logos|favicons)\/[a-z0-9.-]+$/.test(key)) return new Response('Not found', { status: 404 });

  const object = await locals.runtime.env.LOGOS.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=86400',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
