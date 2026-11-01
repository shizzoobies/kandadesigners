import { describe, it, expect } from 'vitest';
import { fakeFetch } from './helpers/fetch.js';
import { plaidFetch, plaidClient, PlaidError } from '../src/lib/plaid.js';

const ENV = { PLAID_ENV: 'sandbox', PLAID_CLIENT_ID: 'client-abc', PLAID_SECRET: 'secret-xyz', PLAID_CLIENT_NAME: 'K & A Performance' };

describe('plaidFetch', () => {
  it('posts JSON to the environment host with the credential headers', async () => {
    const f = fakeFetch(() => ({ body: { ok: 1 } }));
    expect(await plaidFetch(ENV, '/accounts/get', { access_token: 'a' }, f)).toEqual({ ok: 1 });
    const { url, init } = f.calls[0];
    expect(url.href).toBe('https://sandbox.plaid.com/accounts/get');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json', 'PLAID-CLIENT-ID': 'client-abc', 'PLAID-SECRET': 'secret-xyz' });
    expect(JSON.parse(init.body)).toEqual({ access_token: 'a' });
    const prod = fakeFetch(() => ({ body: {} }));
    await plaidFetch({ ...ENV, PLAID_ENV: 'production' }, '/x', {}, prod);
    expect(prod.calls[0].url.host).toBe('production.plaid.com');
  });

  it('throws a PlaidError with the code and message, credentials and tokens scrubbed', async () => {
    const f = fakeFetch(() => ({ status: 400, body: { error_code: 'ITEM_LOGIN_REQUIRED', error_message: 'bad secret-xyz for access-1' } }));
    const err = await plaidFetch(ENV, '/transactions/sync', { access_token: 'access-1' }, f).catch((e) => e);
    expect(err).toBeInstanceOf(PlaidError);
    expect(err.error_code).toBe('ITEM_LOGIN_REQUIRED');
    expect(err.status).toBe(400);
    expect(err.message).toBe('/transactions/sync: ITEM_LOGIN_REQUIRED: bad <secret> for <secret>');
  });

  it('refuses any environment but sandbox or production', async () => {
    const f = fakeFetch(() => ({ body: {} }));
    await expect(plaidFetch({ ...ENV, PLAID_ENV: 'evil.example.com/x' }, '/x', {}, f)).rejects.toThrow('PLAID_ENV');
    expect(f.calls).toEqual([]);
  });

  it('reports a reply that is not JSON', async () => {
    await expect(plaidFetch(ENV, '/x', {}, fakeFetch(() => ({ status: 502, body: '<html>' })))).rejects.toThrow('/x: returned 502');
  });
});

describe('plaidClient', () => {
  it('asks for a new-link token with transactions and 90 days, and an update token with the access token instead', async () => {
    const f = fakeFetch(() => ({ body: { link_token: 'link-1', expiration: 'e', request_id: 'r' } }));
    const plaid = plaidClient(ENV, f);
    expect(await plaid.createLinkToken({ userId: 1, redirectUri: 'https://admin.ka-performancefl.com/bank/oauth' })).toEqual({ link_token: 'link-1', expiration: 'e' });
    expect(JSON.parse(f.calls[0].init.body)).toEqual({
      client_name: 'K & A Performance', language: 'en', country_codes: ['US'], user: { client_user_id: '1' },
      products: ['transactions'], transactions: { days_requested: 90 }, redirect_uri: 'https://admin.ka-performancefl.com/bank/oauth',
    });
    await plaid.createLinkToken({ userId: 1, accessToken: 'access-1' });
    const update = JSON.parse(f.calls[1].init.body);
    expect(update.access_token).toBe('access-1');
    expect(update.products).toBeUndefined();
    expect(update.redirect_uri).toBeUndefined();
  });

  it('sends a cursor only when there is one', async () => {
    const f = fakeFetch(() => ({ body: { added: [], has_more: false } }));
    const plaid = plaidClient(ENV, f);
    await plaid.transactionsSync('access-1', null, 500);
    await plaid.transactionsSync('access-1', 'c1', 500);
    expect(JSON.parse(f.calls[0].init.body)).toEqual({ access_token: 'access-1', count: 500 });
    expect(JSON.parse(f.calls[1].init.body)).toEqual({ access_token: 'access-1', count: 500, cursor: 'c1' });
    expect(f.calls[0].url.pathname).toBe('/transactions/sync');
  });

  it('uses the paid balance path only for liveBalances, and /item/remove to unlink', async () => {
    const f = fakeFetch(() => ({ body: { accounts: [{ account_id: 'a' }], access_token: 'x', item_id: 'i' } }));
    const plaid = plaidClient(ENV, f);
    expect(await plaid.liveBalances('access-1')).toEqual([{ account_id: 'a' }]);
    await plaid.removeItem('access-1');
    expect(await plaid.exchangePublicToken('public-1')).toEqual({ access_token: 'x', item_id: 'i' });
    expect(f.calls.map((c) => c.url.pathname)).toEqual(['/accounts/balance/get', '/item/remove', '/item/public_token/exchange']);
  });
});
