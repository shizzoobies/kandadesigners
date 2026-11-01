// ka-bank-sync: Plaid's transactions and balances into ka-sites.
//
// A separate Worker from ka-admin for analytics-sync's reason: the Astro
// adapter generates the admin's entry point, and a cron bolted onto it breaks
// between adapter versions. It holds the Plaid credentials and BANK_TOKEN_KEY,
// which seals the access token in D1, so the admin never sees either. The cron
// pulls changes and cached balances four times a day. The admin reaches the
// fetch handler only through its BANK_SYNC service binding; there is no route,
// and workers.dev and preview URLs are off, so nothing else can reach it.
import { plaidClient } from '../src/lib/plaid.js';
import { runSync, linkItem, linkToken, refreshBalance, unlinkItem } from '../src/lib/bank-sync.js';

const ROUTES = new Set(['/link-token', '/exchange', '/sync', '/balance', '/unlink']);
const NOT_SET_UP = 'The bank connection is not set up yet.';

const json = (body, status = 200) => Response.json(body, { status });
// The Plaid credentials and the token key, out of anything this Worker returns or logs.
const scrubEnv = (text, env) => [env.PLAID_SECRET, env.PLAID_CLIENT_ID, env.BANK_TOKEN_KEY]
  .filter(Boolean).reduce((s, x) => s.split(String(x)).join('<secret>'), String(text)).slice(0, 300);
const reply = ({ status, ...body }) => json(body, status);

async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}

export async function handleFetch(request, env, deps = {}) {
  const url = new URL(request.url);
  if (request.method !== 'POST' || !ROUTES.has(url.pathname)) return new Response('Not found', { status: 404 });
  if (!env.PLAID_CLIENT_ID || !env.PLAID_SECRET || !env.BANK_TOKEN_KEY) return json({ ok: false, error: NOT_SET_UP }, 503);

  const plaid = deps.plaid ?? plaidClient(env, deps.fetchImpl);
  const base = {
    db: env.DB,
    plaid,
    key: env.BANK_TOKEN_KEY,
    nowIso: deps.nowIso ?? new Date().toISOString(),
    secrets: [env.PLAID_SECRET, env.PLAID_CLIENT_ID],
    ...(deps.clock ? { clock: deps.clock } : {}),
  };
  const body = await readBody(request);

  try {
    switch (url.pathname) {
      case '/link-token': {
        const userId = String(body.userId ?? '').trim();
        if (!userId) return json({ error: 'Missing userId.' }, 400);
        const redirectUri = body.redirect === false || !env.ADMIN_ORIGIN ? undefined : `${String(env.ADMIN_ORIGIN).replace(/\/$/, '')}/bank/oauth`;
        return reply(await linkToken({ ...base, userId, update: body.update === true, redirectUri }));
      }
      case '/exchange': {
        const publicToken = typeof body.publicToken === 'string' ? body.publicToken.trim() : '';
        if (!publicToken) return json({ ok: false, error: 'Missing publicToken.' }, 400);
        const inst = body.institution && typeof body.institution === 'object' ? body.institution : {};
        const institution = {
          id: typeof inst.id === 'string' ? inst.id.slice(0, 64) : null,
          name: typeof inst.name === 'string' ? inst.name.slice(0, 120) : null,
        };
        return reply(await linkItem({ ...base, publicToken, institution }));
      }
      case '/sync':
        return reply(await runSync({ ...base, kind: 'manual' }));
      case '/balance':
        return reply(await refreshBalance(base));
      case '/unlink':
        return reply(await unlinkItem(base));
      default:
        return new Response('Not found', { status: 404 });
    }
  } catch (err) {
    // Plaid errors are already scrubbed; this keeps anything else short and secret-free.
    return json({ ok: false, error: scrubEnv(err?.message ?? err, env) }, 502);
  }
}

/** One cron pull. Always resolves, and logs one bank-sync line, scrubbed, however it ends. */
export function runScheduled(env, nowIso, { plaid, log = console } = {}) {
  if (!env.PLAID_CLIENT_ID || !env.PLAID_SECRET || !env.BANK_TOKEN_KEY) {
    log.log(JSON.stringify({ event: 'bank-sync', ok: false, error: NOT_SET_UP }));
    return Promise.resolve();
  }
  return Promise.resolve().then(() => runSync({
    db: env.DB,
    plaid: plaid ?? plaidClient(env),
    key: env.BANK_TOKEN_KEY,
    nowIso,
    kind: 'cron',
    secrets: [env.PLAID_SECRET, env.PLAID_CLIENT_ID],
  })).then((r) => {
    log.log(JSON.stringify({ event: 'bank-sync', ok: r.ok, added: r.added ?? 0, modified: r.modified ?? 0, removed: r.removed ?? 0, error: r.error ? scrubEnv(r.error, env) : null }));
  }).catch((err) => {
    log.log(JSON.stringify({ event: 'bank-sync', ok: false, error: scrubEnv(err?.message ?? err, env) }));
  });
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduled(env, new Date(event.scheduledTime).toISOString()));
  },
  fetch: (request, env) => handleFetch(request, env),
};
