import { defineMiddleware } from 'astro:middleware';
import { authorize } from './lib/authorize.js';
import { gateRequest, denialLog } from './lib/gate.js';

// Deny by default. This runs before every route, including /logos/*, so nothing
// the app serves is reachable without an Access identity that is in `people`.
// Static files in ./dist (fonts, favicons) are served before this runs; they
// are the only public bytes, and only through Access, since workers_dev is off.
// Then the role: owners go anywhere, clients only to their own Post Desks
// (lib/gate.js), and another site's desk is a plain 404 so slugs do not leak.
const DENY = 'Not authorized. This application is restricted to K & A Performance staff.';
const CLIENT_DENY = 'Not authorized. Your sign-in opens your Post Desk only. Go to / to find it.';

export const onRequest = defineMiddleware(async (context, next) => {
  const env = context.locals.runtime?.env;
  if (!env?.DB) return new Response('Server misconfigured: no database binding.', { status: 500 });

  const user = await authorize({ request: context.request, env });
  if (!user) return new Response(DENY, { status: 403 });

  const pathname = new URL(context.request.url).pathname;
  const gate = gateRequest(user, pathname);
  if (!gate.allow) {
    console.log(denialLog(user, gate, pathname));
    if (gate.status === 404) return new Response('Not found', { status: 404 });
    return new Response(user.role === 'client' ? CLIENT_DENY : DENY, { status: 403 });
  }

  context.locals.user = user;
  return next();
});
