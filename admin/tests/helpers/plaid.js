// A fake Plaid with the five methods of lib/plaid.js plaidClient. pages maps a
// starting cursor (null for the first call) to the page /transactions/sync
// returns for it; a page may be a function (called with the call count) so a
// test can throw once and then answer. Every call is kept in fake.calls.
import { PlaidError } from '../../src/lib/plaid.js';

export const ACCESS_TOKEN = 'access-sandbox-0000-test-token';

export const account = (id, over = {}) => ({
  account_id: id,
  name: 'Business Checking',
  official_name: 'Business Checking Account',
  mask: '1234',
  type: 'depository',
  subtype: 'checking',
  balances: { available: 1200.5, current: 1250.75, iso_currency_code: 'USD' },
  ...over,
});

export const tx = (id, over = {}) => ({
  transaction_id: id,
  account_id: 'acc-1',
  date: '2026-10-28',
  authorized_date: '2026-10-27',
  name: `Purchase ${id}`,
  merchant_name: null,
  amount: 12.34,
  iso_currency_code: 'USD',
  pending: false,
  pending_transaction_id: null,
  personal_finance_category: { primary: 'GENERAL_MERCHANDISE' },
  ...over,
});

export const plaidError = (code, message = 'something went wrong') => new PlaidError('/transactions/sync', 400, code, message);

export function fakePlaid({ pages = {}, balances = [], item = { access_token: ACCESS_TOKEN, item_id: 'item-1' }, removeError = null } = {}) {
  const calls = [];
  const seen = {};
  return {
    calls,
    async createLinkToken(args) {
      calls.push(['createLinkToken', args]);
      return { link_token: 'link-sandbox-abc', expiration: '2026-11-01T20:00:00Z' };
    },
    async exchangePublicToken(publicToken) {
      calls.push(['exchangePublicToken', publicToken]);
      return item;
    },
    async transactionsSync(token, cursor, count) {
      calls.push(['transactionsSync', token, cursor, count]);
      const key = cursor ?? null;
      seen[key] = (seen[key] ?? 0) + 1;
      const page = pages[key];
      if (page === undefined) return { added: [], modified: [], removed: [], accounts: [], next_cursor: cursor, has_more: false };
      return typeof page === 'function' ? page(seen[key]) : page;
    },
    async liveBalances(token) {
      calls.push(['liveBalances', token]);
      return balances;
    },
    async removeItem(token) {
      calls.push(['removeItem', token]);
      if (removeError) throw removeError;
    },
  };
}
