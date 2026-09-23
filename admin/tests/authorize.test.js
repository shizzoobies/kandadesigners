import { describe, it, expect } from 'vitest';
import { makeD1 } from './helpers/d1.js';
import { authorize } from '../src/lib/authorize.js';

const request = new Request('https://admin.ka-performancefl.com/');

async function envWithAlex() {
  const DB = makeD1();
  await DB.prepare("INSERT INTO people (name, email, role, created_at) VALUES ('Alex Anderson', 'alex@example.com', 'owner', 't')").run();
  return { DB };
}

describe('authorize', () => {
  it('lets in a verified identity that is in people', async () => {
    const env = await envWithAlex();
    const user = await authorize({ request, env, resolve: async () => ({ email: 'alex@example.com', source: 'access' }) });
    expect(user).toMatchObject({ name: 'Alex Anderson', role: 'owner', source: 'access' });
  });

  it('refuses a verified identity that is not in people', async () => {
    const env = await envWithAlex();
    expect(await authorize({ request, env, resolve: async () => ({ email: 'someone@example.com', source: 'access' }) })).toBeNull();
  });

  it('refuses when there is no identity', async () => {
    const env = await envWithAlex();
    expect(await authorize({ request, env, resolve: async () => null })).toBeNull();
  });
});
