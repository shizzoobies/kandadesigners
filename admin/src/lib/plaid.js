// The bank-data provider, and the only file that knows it is Plaid. Swapping
// providers means replacing this module's plaidClient with one that has the
// same six methods. Runs in ka-bank-sync only: the admin Worker never holds
// PLAID_CLIENT_ID, PLAID_SECRET or an access token.
// Credentials travel only in the PLAID-CLIENT-ID and PLAID-SECRET headers and
// are scrubbed from every error, as is any access token in the request.

const ENVS = new Set(['sandbox', 'production']);

export class PlaidError extends Error {
  constructor(path, status, code, message) {
    super(`${path}: ${code ? `${code}: ` : ''}${message}`);
    this.name = 'PlaidError';
    this.status = status;
    this.error_code = code;
    this.error_message = message;
  }
}

const scrub = (text, secrets) => secrets.filter(Boolean).reduce((s, x) => s.split(String(x)).join('<secret>'), String(text));

/** POST JSON to Plaid. Non-2xx throws a PlaidError with error_code and error_message. */
export async function plaidFetch(env, path, body = {}, fetchImpl = fetch) {
  const plaidEnv = env.PLAID_ENV ?? 'sandbox';
  if (!ENVS.has(plaidEnv)) throw new PlaidError(path, 0, 'BAD_ENVIRONMENT', 'PLAID_ENV must be sandbox or production.');
  const secrets = [env.PLAID_SECRET, env.PLAID_CLIENT_ID, body.access_token, body.public_token];
  const res = await fetchImpl(`https://${plaidEnv}.plaid.com${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'PLAID-CLIENT-ID': String(env.PLAID_CLIENT_ID ?? ''), 'PLAID-SECRET': String(env.PLAID_SECRET ?? '') },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  if (!res.ok) {
    const code = json?.error_code ?? null;
    const message = json?.error_message ?? `returned ${res.status}`;
    throw new PlaidError(path, res.status, code, scrub(message, secrets).slice(0, 300));
  }
  if (!json) throw new PlaidError(path, res.status, null, 'did not return JSON');
  return json;
}

/** The six calls ka-bank-sync makes, over plaidFetch. */
export function plaidClient(env, fetchImpl = fetch) {
  const call = (path, body) => plaidFetch(env, path, body, fetchImpl);
  return {
    // New link: products and a 90-day history. Update mode (a sign-in the bank
    // now wants again): the item's access token and no products.
    async createLinkToken({ userId, accessToken, redirectUri }) {
      const body = {
        client_name: String(env.PLAID_CLIENT_NAME ?? 'K & A Performance').slice(0, 30),
        language: 'en',
        country_codes: ['US'],
        user: { client_user_id: String(userId) },
      };
      if (accessToken) {
        body.access_token = accessToken;
      } else {
        body.products = ['transactions'];
        body.transactions = { days_requested: 90 };
      }
      if (redirectUri) body.redirect_uri = redirectUri;
      const r = await call('/link/token/create', body);
      return { link_token: r.link_token, expiration: r.expiration };
    },
    async exchangePublicToken(publicToken) {
      const r = await call('/item/public_token/exchange', { public_token: publicToken });
      return { access_token: r.access_token, item_id: r.item_id };
    },
    // One page of changes: added, modified, removed, next_cursor, has_more,
    // and the accounts those transactions touch, with cached balances.
    transactionsSync(accessToken, cursor, count = 500) {
      const body = { access_token: accessToken, count };
      if (cursor) body.cursor = cursor;
      return call('/transactions/sync', body);
    },
    // Every account on the item with cached balances. Free, so each pull makes
    // it and balances refresh even when no transaction changed.
    async accountsGet(accessToken) {
      const r = await call('/accounts/get', { access_token: accessToken });
      return r.accounts ?? [];
    },
    // The paid, live balance call. Only "Refresh balance" makes it.
    async liveBalances(accessToken) {
      const r = await call('/accounts/balance/get', { access_token: accessToken });
      return r.accounts ?? [];
    },
    async removeItem(accessToken) {
      await call('/item/remove', { access_token: accessToken });
    },
  };
}
