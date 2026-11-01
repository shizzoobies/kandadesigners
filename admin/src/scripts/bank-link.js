// Plaid Link on /bank/link and /bank/oauth. The page's #bank-link carries
// data-mode: "new" (link an account), "update" (Reconnect after the bank asks
// for its sign-in again) or "oauth" (the bank's sign-in sent the browser back
// here). The link token is kept in sessionStorage for the OAuth return, as
// Plaid's OAuth flow asks; nothing else is stored, and no token is ever shown.
// Plaid's own script (window.Plaid) loads before this one.

const root = document.getElementById('bank-link');
const statusEl = document.getElementById('bank-link-status');
const button = document.getElementById('bank-link-open');
const mode = root?.dataset.mode ?? 'new';

const TOKEN_KEY = 'ka-bank-link-token';
const MODE_KEY = 'ka-bank-link-mode';
const store = {
  get(k) {
    try { return sessionStorage.getItem(k); } catch { return null; }
  },
  set(k, v) {
    try { sessionStorage.setItem(k, v); } catch { /* private window: the OAuth return will ask to start again */ }
  },
  clear() {
    try { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(MODE_KEY); } catch { /* nothing kept */ }
  },
};

function say(text, bad = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle('err', bad);
}

function offerRetry() {
  if (button) button.hidden = false;
}

async function postJson(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' });
  let data = {};
  try { data = await res.json(); } catch { data = {}; }
  return { ok: res.ok, status: res.status, data };
}

// Update mode needs no exchange: the item and its token are unchanged, so a
// sync right away proves the sign-in works and clears the status.
async function finish(update, publicToken, metadata) {
  store.clear();
  if (update) {
    say('Signed in again. Syncing now.');
    const form = document.createElement('form');
    form.method = 'post';
    form.action = '/bank/sync';
    document.body.append(form);
    form.submit();
    return;
  }
  say('Saving the link and pulling the first transactions. This can take a moment.');
  const institution = { id: metadata?.institution?.institution_id ?? null, name: metadata?.institution?.name ?? null };
  const r = await postJson('/bank/exchange', { publicToken, institution });
  if (!r.ok) {
    say(r.data.error ?? `The link could not be saved (${r.status}). Try again.`, true);
    offerRetry();
    return;
  }
  const count = Number(r.data.accounts ?? 0);
  const msg = r.data.ok
    ? `Linked. ${count} ${count === 1 ? 'account' : 'accounts'} found. Transactions can take a few minutes to arrive; use Sync now if the lists are empty.`
    : `Linked, but the first sync did not finish: ${r.data.error ?? 'unknown error'}. Use Sync now.`;
  window.location.href = `/bank?kind=${r.data.ok ? 'ok' : 'warn'}&msg=${encodeURIComponent(msg)}`;
}

function openLink(token, update, receivedRedirectUri) {
  if (!window.Plaid) {
    say('Plaid Link did not load. Check the connection and try again.', true);
    offerRetry();
    return;
  }
  const handler = window.Plaid.create({
    token,
    ...(receivedRedirectUri ? { receivedRedirectUri } : {}),
    onSuccess(publicToken, metadata) {
      finish(update, publicToken, metadata).catch(() => {
        say('The link could not be saved. Try again.', true);
        offerRetry();
      });
    },
    onExit(err) {
      store.clear();
      if (err) say(`Plaid closed with an error: ${err.display_message || err.error_message || err.error_code || 'unknown'}. Try again.`, true);
      else say(update ? 'Plaid closed. The sign-in was not updated.' : 'Plaid closed. Nothing was linked.');
      offerRetry();
    },
  });
  handler.open();
}

async function start() {
  if (button) button.hidden = true;
  say('Opening Plaid.');
  const update = mode === 'update';
  const r = await postJson('/bank/link-token', { update });
  if (!r.ok || typeof r.data.link_token !== 'string') {
    say(r.data.error ?? `Plaid could not be opened (${r.status}).`, true);
    offerRetry();
    return;
  }
  store.set(TOKEN_KEY, r.data.link_token);
  store.set(MODE_KEY, update ? 'update' : 'new');
  openLink(r.data.link_token, update);
}

if (root && statusEl) {
  if (mode === 'oauth') {
    const token = store.get(TOKEN_KEY);
    if (!token) {
      say('This Plaid session has expired or was opened in another window. Start the link again.', true);
      offerRetry();
    } else {
      say('Finishing with Plaid.');
      openLink(token, store.get(MODE_KEY) === 'update', window.location.href);
    }
  } else {
    button?.addEventListener('click', () => {
      start().catch(() => {
        say('Plaid could not be opened. Try again.', true);
        offerRetry();
      });
    });
    start().catch(() => {
      say('Plaid could not be opened. Try again.', true);
      offerRetry();
    });
  }
}
