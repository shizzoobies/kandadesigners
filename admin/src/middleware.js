import { defineMiddleware } from 'astro:middleware';
import { authorize } from './lib/authorize.js';

// Deny by default. This runs before every route, including /logos/*, so nothing
// the app serves is reachable without an Access identity that is in `people`.
// Static files in ./dist (fonts, favicons) are served before this runs; they
// are the only public bytes, and only through Access, since workers_dev is off.
const DENY = 'Not authorized. This application is restricted to K & A Performance staff.';

export const onRequest = defineMiddleware(async (context, next) => {
  const env = context.locals.runtime?.env;
  if (!env?.DB) return new Response('Server misconfigured: no database binding.', { status: 500 });

  const user = await authorize({ request: context.request, env });
  if (!user) return new Response(DENY, { status: 403 });

  context.locals.user = user;
  return next();
});
