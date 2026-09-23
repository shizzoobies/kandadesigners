// Access says who you are; the people table says whether you may be here.
// Kept out of middleware.js so it can be tested without Astro's virtual modules.
import { resolveEmail } from './identity.js';
import { getPersonByEmail } from './db.js';

export async function authorize({ request, env, resolve = resolveEmail }) {
  const identity = await resolve({ request, env });
  if (!identity) return null;
  const person = await getPersonByEmail(env.DB, identity.email);
  if (!person) return null;
  return { id: person.id, name: person.name, email: person.email, role: person.role, source: identity.source };
}
