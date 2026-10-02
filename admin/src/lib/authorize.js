// Access says who you are; the people table says whether you may be here.
// Kept out of middleware.js so it can be tested without Astro's virtual modules.
// A client also carries their desk grants ({site_id, slug, name, level, and the
// site's logo keys}), which lib/gate.js checks on every request.
import { resolveEmail } from './identity.js';
import { getPersonByEmail, listGrantsForPerson } from './db.js';

export async function authorize({ request, env, resolve = resolveEmail }) {
  const identity = await resolve({ request, env });
  if (!identity) return null;
  const person = await getPersonByEmail(env.DB, identity.email);
  if (!person) return null;
  const grants = person.role === 'client' ? await listGrantsForPerson(env.DB, person.id) : [];
  return { id: person.id, name: person.name, email: person.email, role: person.role, source: identity.source, grants };
}
