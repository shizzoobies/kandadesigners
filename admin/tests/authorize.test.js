import { describe, it, expect } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import { authorize } from '../src/lib/authorize.js';

const request = new Request('https://admin.ka-performancefl.com/');
const as = (email) => async () => ({ email, source: 'access' });

async function envWithAlex() {
  const DB = makeD1();
  await DB.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Alex Anderson', 'alex@example.com', 'owner', 't')").run();
  return { DB };
}

async function envWithHannah() {
  const env = await envWithAlex();
  const { DB } = env;
  await DB.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Hannah', 'hannah@example.com', 'client', 't')").run();
  for (const [slug, name] of [['foremotion-golf', 'Fore Motion Golf'], ['ka-performance', 'K & A Performance'], ['davids-bbq', "David's BBQ"]]) {
    await DB.prepare("INSERT INTO sites (slug, name, live_url, logo_key, created_at, updated_at) VALUES (?, ?, 'https://x.test', ?, 't', 't')")
      .bind(slug, name, `logos/${slug}-1.png`).run();
  }
  await DB.prepare("INSERT INTO desk_access (person_id, site_id, level, granted_at) VALUES (2, 1, 'approve', 't'), (2, 3, 'view', 't')").run();
  return env;
}

describe('authorize', () => {
  it('lets in a verified identity that is in people', async () => {
    const env = await envWithAlex();
    const user = await authorize({ request, env, resolve: as('alex@example.com') });
    expect(user).toMatchObject({ name: 'Alex Anderson', role: 'owner', source: 'access' });
  });

  it('refuses a verified identity that is not in people', async () => {
    const env = await envWithAlex();
    expect(await authorize({ request, env, resolve: as('someone@example.com') })).toBeNull();
  });

  it('refuses when there is no identity', async () => {
    const env = await envWithAlex();
    expect(await authorize({ request, env, resolve: async () => null })).toBeNull();
  });

  it('gives an owner no grants: owners need none', async () => {
    const env = await envWithHannah();
    const user = await authorize({ request, env, resolve: as('alex@example.com') });
    expect(user.grants).toEqual([]);
  });

  it('returns a client with their grants, by site name', async () => {
    const env = await envWithHannah();
    const user = await authorize({ request, env, resolve: as('hannah@example.com') });
    expect(user).toMatchObject({ id: 2, name: 'Hannah', role: 'client' });
    expect(user.grants).toEqual([
      { site_id: 3, slug: 'davids-bbq', name: "David's BBQ", level: 'view', logo_key: 'logos/davids-bbq-1.png', favicon_key: null },
      { site_id: 1, slug: 'foremotion-golf', name: 'Fore Motion Golf', level: 'approve', logo_key: 'logos/foremotion-golf-1.png', favicon_key: null },
    ]);
  });

  it('returns a client with no grants as an empty list', async () => {
    const env = await envWithHannah();
    await env.DB.prepare('DELETE FROM desk_access').run();
    const user = await authorize({ request, env, resolve: as('hannah@example.com') });
    expect(user.grants).toEqual([]);
  });

  it('refuses a removed client at once', async () => {
    const env = await envWithHannah();
    await env.DB.prepare('DELETE FROM people WHERE id = 2').run();
    expect(await authorize({ request, env, resolve: as('hannah@example.com') })).toBeNull();
  });
});
