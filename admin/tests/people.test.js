import { describe, it, expect, beforeEach } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import * as q from '../src/lib/db.js';
import { parsePersonForm, addPerson, editPerson, removePerson } from '../src/lib/people.js';

const NOW = Date.parse('2026-10-02T16:00:00Z');
const ALEX = { id: 1, name: 'Alex', email: 'alex@example.com', role: 'owner' };
let db;
let syncs;
const sync = async () => { syncs += 1; };
const form = (obj) => { const f = new FormData(); for (const [k, v] of Object.entries(obj)) f.append(k, v); return f; };
const SITES = [{ id: 1, slug: 'foremotion-golf', name: 'Fore Motion Golf' }, { id: 2, slug: 'davids-bbq', name: "David's BBQ" }];

const grantsOf = async (personId) => (await db.prepare('SELECT site_id, level FROM desk_access WHERE person_id = ? ORDER BY site_id').bind(personId).all()).results;
const person = (id) => db.prepare('SELECT id, name, email, role FROM people WHERE id = ?').bind(id).first();

beforeEach(async () => {
  db = makeD1();
  syncs = 0;
  await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Alex', 'alex@example.com', 'owner', 't')").run();
  for (const s of SITES) await q.createSite(db, { slug: s.slug, name: s.name, live_url: 'https://x.test', hosting: 'pages' }, 't');
});

describe('listOwners', () => {
  it('lists owners only, for the maintainer dropdown', async () => {
    await db.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Hannah', 'h@x.com', 'client', 't'), ('Bea', 'b@x.com', 'owner', 't')").run();
    expect((await q.listOwners(db)).map((p) => p.name)).toEqual(['Alex', 'Bea']);
  });
});

describe('parsePersonForm', () => {
  it('reads a client with per-site levels, email lowercased', () => {
    const r = parsePersonForm(form({ name: ' Hannah ', email: ' Hannah@ForeMotion.com ', role: 'client', access_1: 'approve', access_2: 'view' }), SITES);
    expect(r).toEqual({ ok: true, errors: {}, values: {
      name: 'Hannah', email: 'hannah@foremotion.com', role: 'client',
      grants: [{ site_id: 1, level: 'approve' }, { site_id: 2, level: 'view' }],
    } });
  });

  it('defaults the role to client and every site to no access', () => {
    const r = parsePersonForm(form({ name: 'H', email: 'h@x.com' }), SITES);
    expect(r.values.role).toBe('client');
    expect(r.values.grants).toEqual([{ site_id: 1, level: 'none' }, { site_id: 2, level: 'none' }]);
  });

  it('checks name, email format, length caps, role and level', () => {
    const errs = (o) => parsePersonForm(form({ name: 'H', email: 'h@x.com', ...o }), SITES).errors;
    expect(errs({ name: '' }).name).toBeTruthy();
    expect(errs({ name: 'x'.repeat(81) }).name).toMatch(/80/);
    for (const email of ['', 'hannah', 'hannah@', '@x.com', 'h@x', 'h @x.com', 'h@x.com, a@b.com', '<h@x.com>']) {
      expect(errs({ email }).email, email).toBeTruthy();
    }
    expect(errs({ email: `${'a'.repeat(250)}@x.com` }).email).toMatch(/254/);
    expect(errs({ role: 'admin' }).role).toBeTruthy();
    expect(errs({ access_1: 'edit' }).access_1).toBeTruthy();
    expect(errs({})).toEqual({});
  });
});

describe('addPerson', () => {
  it('adds a client, grants nothing yet, and re-syncs the sign-in list', async () => {
    const r = await addPerson({ db, me: ALEX, form: form({ name: 'Hannah', email: 'Hannah@ForeMotion.com' }), nowMs: NOW, sync });
    expect(r).toEqual({ ok: true, id: 2 });
    expect(await person(2)).toEqual({ id: 2, name: 'Hannah', email: 'hannah@foremotion.com', role: 'client' });
    expect(await grantsOf(2)).toEqual([]);
    expect(syncs).toBe(1);
  });

  it('refuses a duplicate email, whatever its case, and writes nothing', async () => {
    const r = await addPerson({ db, me: ALEX, form: form({ name: 'Imposter', email: 'ALEX@example.com' }), nowMs: NOW, sync });
    expect(r.ok).toBe(false);
    expect(r.errors.email).toMatch(/already/);
    expect(await db.prepare('SELECT COUNT(*) AS n FROM people').first('n')).toBe(1);
    expect(syncs).toBe(0);
  });

  it('keeps the change when the sync fails', async () => {
    const r = await addPerson({ db, me: ALEX, form: form({ name: 'H', email: 'h@x.com' }), nowMs: NOW, sync: async () => { throw new Error('down'); } });
    expect(r.ok).toBe(true);
    expect(await person(2)).toBeTruthy();
  });

  it('is owner only', async () => {
    const r = await addPerson({ db, me: { id: 2, role: 'client' }, form: form({ name: 'H', email: 'h@x.com' }), nowMs: NOW, sync });
    expect(r).toEqual({ ok: false, status: 403 });
    expect(syncs).toBe(0);
  });
});

describe('editPerson', () => {
  let hannah;
  beforeEach(async () => {
    hannah = (await addPerson({ db, me: ALEX, form: form({ name: 'Hannah', email: 'hannah@x.com' }), nowMs: NOW, sync })).id;
    syncs = 0;
  });
  const edit = (id, o, me = ALEX) => editPerson({ db, me, id, form: form(o), nowMs: NOW, sync });

  it('sets per-site levels, and none removes a grant', async () => {
    expect(await edit(hannah, { name: 'Hannah', email: 'hannah@x.com', role: 'client', access_1: 'approve', access_2: 'view' })).toEqual({ ok: true });
    expect(await grantsOf(hannah)).toEqual([{ site_id: 1, level: 'approve' }, { site_id: 2, level: 'view' }]);
    await edit(hannah, { name: 'Hannah', email: 'hannah@x.com', role: 'client', access_1: 'view', access_2: 'none' });
    expect(await grantsOf(hannah)).toEqual([{ site_id: 1, level: 'view' }]);
  });

  it('re-syncs only when the email or role changes', async () => {
    await edit(hannah, { name: 'Hannah B', email: 'hannah@x.com', role: 'client', access_1: 'approve' });
    expect(syncs).toBe(0);
    await edit(hannah, { name: 'Hannah B', email: 'hannah@new.com', role: 'client', access_1: 'approve' });
    expect(syncs).toBe(1);
    await edit(hannah, { name: 'Hannah B', email: 'hannah@new.com', role: 'owner' });
    expect(syncs).toBe(2);
  });

  it('clears desk grants for an owner: owners need none', async () => {
    await edit(hannah, { name: 'Hannah', email: 'hannah@x.com', role: 'client', access_1: 'approve' });
    await edit(hannah, { name: 'Hannah', email: 'hannah@x.com', role: 'owner', access_1: 'approve' });
    expect(await grantsOf(hannah)).toEqual([]);
  });

  it('refuses an email someone else already uses, but lets a person keep their own', async () => {
    const r = await edit(hannah, { name: 'Hannah', email: 'Alex@Example.com', role: 'client' });
    expect(r.ok).toBe(false);
    expect(r.errors.email).toMatch(/already/);
    expect((await person(hannah)).email).toBe('hannah@x.com');
    expect(await edit(hannah, { name: 'Hannah', email: 'HANNAH@x.com', role: 'client' })).toEqual({ ok: true });
  });

  it('will not demote the last owner', async () => {
    const other = { id: hannah, role: 'owner' };
    const r = await edit(1, { name: 'Alex', email: 'alex@example.com', role: 'client' }, other);
    expect(r.ok).toBe(false);
    expect(r.errors.role).toMatch(/at least one owner/);
    expect((await person(1)).role).toBe('owner');
  });

  it('will not let an owner demote themselves or change their own email', async () => {
    await edit(hannah, { name: 'Hannah', email: 'hannah@x.com', role: 'owner' });
    const demote = await edit(1, { name: 'Alex', email: 'alex@example.com', role: 'client' });
    expect(demote.ok).toBe(false);
    expect(demote.errors.role).toBeTruthy();
    const email = await edit(1, { name: 'Alex', email: 'alex@typo.com', role: 'owner' });
    expect(email.ok).toBe(false);
    expect(email.errors.email).toBeTruthy();
    expect(await person(1)).toMatchObject({ email: 'alex@example.com', role: 'owner' });
    expect(await edit(1, { name: 'Alex Anderson', email: 'alex@example.com', role: 'owner' })).toEqual({ ok: true });
  });

  it('allows demoting an owner when another owner remains', async () => {
    await edit(hannah, { name: 'Hannah', email: 'hannah@x.com', role: 'owner' });
    expect(await edit(hannah, { name: 'Hannah', email: 'hannah@x.com', role: 'client' })).toEqual({ ok: true });
  });

  it('404s an unknown person and is owner only', async () => {
    expect(await edit(99, { name: 'X', email: 'x@x.com' })).toEqual({ ok: false, status: 404 });
    expect(await edit(hannah, { name: 'X', email: 'x@x.com' }, { id: hannah, role: 'client' })).toEqual({ ok: false, status: 403 });
  });
});

describe('removePerson', () => {
  let hannah;
  beforeEach(async () => {
    hannah = (await addPerson({ db, me: ALEX, form: form({ name: 'Hannah', email: 'hannah@x.com' }), nowMs: NOW, sync })).id;
    await editPerson({ db, me: ALEX, id: hannah, form: form({ name: 'Hannah', email: 'hannah@x.com', access_1: 'approve' }), nowMs: NOW, sync });
    syncs = 0;
  });
  const remove = (id, me = ALEX) => removePerson({ db, me, id, sync });

  it('removes a client who has decided posts, keeps the decisions, and re-syncs', async () => {
    await db.prepare("INSERT INTO desk_decisions (site_id, item_id, decision, decided_by, decided_at) VALUES (1, 'p', 'approved', ?, 't')").bind(hannah).run();
    await db.prepare("INSERT INTO desk_story_checks (site_id, item_id, posted, checked_by, checked_at) VALUES (1, 's', 1, ?, 't')").bind(hannah).run();
    await db.prepare('UPDATE sites SET maintainer_id = ? WHERE id = 2').bind(hannah).run();
    expect(await remove(hannah)).toEqual({ ok: true, name: 'Hannah' });
    expect(await person(hannah)).toBeNull();
    expect(await grantsOf(hannah)).toEqual([]);
    expect(await db.prepare("SELECT decision, decided_by FROM desk_decisions WHERE item_id = 'p'").first()).toEqual({ decision: 'approved', decided_by: null });
    expect(await db.prepare("SELECT checked_by FROM desk_story_checks WHERE item_id = 's'").first('checked_by')).toBeNull();
    expect(syncs).toBe(1);
  });

  it('deletes the desk grants itself, without relying on the foreign key cascade', async () => {
    db.sqlite.exec('PRAGMA foreign_keys = OFF');
    expect((await remove(hannah)).ok).toBe(true);
    expect(await grantsOf(hannah)).toEqual([]);
  });

  it('will not let an owner remove themselves', async () => {
    const r = await remove(1);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/yourself/);
    expect(await person(1)).toBeTruthy();
    expect(syncs).toBe(0);
  });

  it('will not remove the last owner', async () => {
    const r = await remove(1, { id: 42, role: 'owner' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/last owner/);
    expect(await person(1)).toBeTruthy();
  });

  it('removes another owner when one remains', async () => {
    await editPerson({ db, me: ALEX, id: hannah, form: form({ name: 'Hannah', email: 'hannah@x.com', role: 'owner' }), nowMs: NOW, sync });
    expect((await remove(hannah)).ok).toBe(true);
  });

  it('404s an unknown person and is owner only', async () => {
    expect(await remove(99)).toEqual({ ok: false, status: 404 });
    expect(await remove(1, { id: hannah, role: 'client' })).toEqual({ ok: false, status: 403 });
    expect(await person(1)).toBeTruthy();
  });
});

describe('audit log', () => {
  it('logs add, edit and remove as JSON lines with ids, role and grants, never an email', async () => {
    const lines = [];
    const log = { log: (s) => lines.push(s) };
    const { id } = await addPerson({ db, me: ALEX, form: form({ name: 'Hannah', email: 'hannah@x.com' }), nowMs: NOW, sync, log });
    await editPerson({ db, me: ALEX, id, form: form({ name: 'Hannah', email: 'hannah@new.com', role: 'client', access_1: 'approve', access_2: 'none' }), nowMs: NOW, sync, log });
    await removePerson({ db, me: ALEX, id, sync, log });
    await addPerson({ db, me: ALEX, form: form({ name: 'Dup', email: 'alex@example.com' }), nowMs: NOW, sync, log });
    expect(lines.map((l) => JSON.parse(l))).toEqual([
      { event: 'people.add', actor: 1, target: id, role: 'client' },
      { event: 'people.edit', actor: 1, target: id, role: 'client', email_changed: true, role_changed: false, grants: [{ site_id: 1, level: 'approve' }] },
      { event: 'people.remove', actor: 1, target: id, role: 'client' },
    ]);
    for (const l of lines) expect(l).not.toMatch(/@/);
  });

  it('logs a refused change with its reason, and an owner edit with no grants', async () => {
    const lines = [];
    const log = { log: (s) => lines.push(s) };
    await removePerson({ db, me: ALEX, id: 1, sync, log });
    await editPerson({ db, me: ALEX, id: 1, form: form({ name: 'Alex A', email: 'alex@example.com', role: 'owner', access_1: 'view' }), nowMs: NOW, sync, log });
    expect(lines.map((l) => JSON.parse(l))).toEqual([
      { event: 'people.remove', actor: 1, target: 1, refused: 'You cannot remove yourself.' },
      { event: 'people.edit', actor: 1, target: 1, role: 'owner', email_changed: false, role_changed: false, grants: [] },
    ]);
  });
});
