import { defineMiddleware } from 'astro:middleware';
import { resolveEmail } from './lib/identity.js';
import { getUserByEmail, touchUser } from './lib/db.js';
import { nowIso } from './lib/format.js';

// Deny by default. This runs before every route, so the app refuses service on
// any hostname without a valid Access identity, including its workers.dev URL
// where Cloudflare Access policies do not apply.
const DENY = 'Not authorised. This application is restricted to K & A Performance staff.';

export const onRequest = defineMiddleware(async (context, next) => {
  const env = context.locals.runtime?.env;
  if (!env?.DB) {
    return new Response('Server misconfigured: no database binding.', { status: 500 });
  }

  const identity = await resolveEmail({ request: context.request, env });
  if (!identity) return new Response(DENY, { status: 403 });

  // Access says who you are; this table says whether you may be here. Revoking
  // someone is therefore a database flag as well as an Access policy change.
  const user = await getUserByEmail(env.DB, identity.email);
  if (!user) return new Response(DENY, { status: 403 });

  context.locals.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clientId: user.client_id,
    source: identity.source,
  };

  // Fire and forget, so the write never delays the response.
  context.locals.runtime.ctx?.waitUntil?.(touchUser(env.DB, user.id, nowIso()));

  // Role gate. Access decides who gets in the door; the role decides which
  // door. A client-role user (a coaching member) sees only the members area,
  // and everything else redirects there rather than 403ing, because a member
  // who typed the bare hostname did nothing wrong. Owner and staff pass
  // untouched, members area included, so Alex can see what a member sees.
  // The course files under /course/ are static assets served before this
  // middleware runs; Access is their gate, which is the accepted trade for
  // content whose audience is exactly "everyone allowed through Access".
  if (user.role === 'client') {
    const path = context.url.pathname;
    const allowed = path === '/members' || path.startsWith('/members/');
    if (!allowed) return context.redirect('/members', 303);
  }

  return next();
});
