// The People page: add, edit and remove the people who can sign in, and set
// which Post Desks a client sees. Owner only. Every add, removal, and email or
// role change re-syncs the Cloudflare sign-in list through `sync`, which is
// never allowed to block or undo the change itself (see lib/access-sync.js).
import * as q from './db.js';

export const ROLES = ['owner', 'client'];
export const LEVELS = ['none', 'view', 'approve'];
export const ROLE_LABEL = { owner: 'Owner', client: 'Client' };
export const LEVEL_LABEL = { none: 'No access', view: 'View only', approve: 'Can approve' };
const NAME_MAX = 80;
const EMAIL_MAX = 254;
// Deliberately plain: one @, a dot in the domain, and none of the characters
// that would let one field carry two addresses or a display name.
const EMAIL = /^[^\s@<>()",;:\\[\]]+@[^\s@<>()",;:\\[\]]+\.[^\s@<>()",;:\\[\]]+$/;

const str = (fd, key) => String(fd.get(key) ?? '').trim();
const forbidden = { ok: false, status: 403 };
const notFound = { ok: false, status: 404 };

export function parsePersonForm(fd, sites) {
  const errors = {};
  const v = {};

  v.name = str(fd, 'name');
  if (!v.name) errors.name = 'Name is required.';
  else if (v.name.length > NAME_MAX) errors.name = `Keep the name under ${NAME_MAX} characters.`;

  v.email = str(fd, 'email').toLowerCase();
  if (!v.email) errors.email = 'Email is required.';
  else if (v.email.length > EMAIL_MAX) errors.email = `Keep the email under ${EMAIL_MAX} characters.`;
  else if (!EMAIL.test(v.email)) errors.email = 'Enter one email address, for example name@example.com.';

  v.role = str(fd, 'role') || 'client';
  if (!ROLES.includes(v.role)) errors.role = 'Pick owner or client.';

  v.grants = sites.map((s) => {
    const level = str(fd, `access_${s.id}`) || 'none';
    if (!LEVELS.includes(level)) errors[`access_${s.id}`] = 'Pick no access, view only or can approve.';
    return { site_id: s.id, level };
  });

  return { ok: Object.keys(errors).length === 0, values: v, errors };
}

async function emailTaken(db, email, exceptId = null) {
  const other = await q.getPersonByEmail(db, email);
  return !!other && other.id !== exceptId;
}

// One JSON line per change for Workers logs: who acted, on whom, the role and
// the desk grants. Ids only, never an email.
function audit(log, line) {
  try {
    log.log(JSON.stringify(line));
  } catch {
    // Logging never blocks or undoes a change.
  }
}

async function runSync(sync) {
  try {
    await sync?.();
  } catch {
    // The sync stores its own errors; a throw here must never undo the change.
  }
}

export async function addPerson({ db, me, form, nowMs = Date.now(), sync, log = console }) {
  if (me?.role !== 'owner') return forbidden;
  const r = parsePersonForm(form, []);
  const errors = { ...r.errors };
  if (!errors.email && await emailTaken(db, r.values.email)) errors.email = 'Someone already signs in with that email.';
  if (Object.keys(errors).length) return { ok: false, values: r.values, errors };

  const id = await q.createPerson(db, r.values, new Date(nowMs).toISOString());
  audit(log, { event: 'people.add', actor: me.id, target: id, role: r.values.role });
  await runSync(sync);
  return { ok: true, id };
}

export async function editPerson({ db, me, id, form, nowMs = Date.now(), sync, log = console }) {
  if (me?.role !== 'owner') return forbidden;
  const person = await q.getPersonById(db, id);
  if (!person) return notFound;
  const r = parsePersonForm(form, await q.listSites(db));
  const errors = { ...r.errors };
  const v = r.values;
  const self = person.id === me.id;

  if (!errors.email && await emailTaken(db, v.email, person.id)) errors.email = 'Someone already signs in with that email.';
  // Changing your own email here would sign you out for good, since Access
  // signs you in by email. Another owner can change it.
  if (!errors.email && self && v.email !== person.email.toLowerCase()) errors.email = 'You cannot change your own email here. Another owner can.';
  if (!errors.role && person.role === 'owner' && v.role !== 'owner') {
    if (self) errors.role = 'You cannot remove your own owner role.';
    else if (await q.countOwners(db) <= 1) errors.role = 'There must always be at least one owner.';
  }
  if (Object.keys(errors).length) return { ok: false, values: v, errors };

  await q.updatePerson(db, person.id, v, new Date(nowMs).toISOString());
  const emailChanged = v.email !== person.email.toLowerCase();
  const roleChanged = v.role !== person.role;
  audit(log, {
    event: 'people.edit', actor: me.id, target: person.id, role: v.role, email_changed: emailChanged, role_changed: roleChanged,
    grants: v.role === 'owner' ? [] : v.grants.filter((g) => g.level !== 'none'),
  });
  if (emailChanged || roleChanged) await runSync(sync);
  return { ok: true };
}

export async function removePerson({ db, me, id, sync, log = console }) {
  if (me?.role !== 'owner') return forbidden;
  const person = await q.getPersonById(db, id);
  if (!person) return notFound;
  const refuse = (error) => {
    audit(log, { event: 'people.remove', actor: me.id, target: person.id, refused: error });
    return { ok: false, error };
  };
  if (person.id === me.id) return refuse('You cannot remove yourself.');
  if (person.role === 'owner' && await q.countOwners(db) <= 1) return refuse('You cannot remove the last owner.');

  await q.deletePerson(db, person.id);
  audit(log, { event: 'people.remove', actor: me.id, target: person.id, role: person.role });
  await runSync(sync);
  return { ok: true, name: person.name };
}
