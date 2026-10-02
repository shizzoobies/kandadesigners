# Client access to Post Desks (2026-10-02)

Alex wants to give a client's marketing lead (first: Hannah, Fore Motion Golf's social media
manager) a login to that client's Post Desk, managed from the admin: he adds a person, picks
which desks they can open, and the Zero Trust login follows.

## Alex's decisions (2026-10-02)

- Hannah can **approve and request changes** on the Fore Motion Golf desk (not view-only).
  Per desk, a person is either `approve` (approve, request changes, undo, answer questions,
  tick Stories) or `view` (read only).
- **The admin keeps the sign-in list.** Adding or removing a person on the People page also
  updates a Cloudflare Access group automatically, so Cloudflare screens who can reach the
  login and the admin decides what they see (defense in depth).
- The Fore Motion Golf desk stays empty for today's meeting (posts come after a plan).

## Roles

- `owner` (Alex): everything, as today.
- `client`: only the Post Desks granted to them. Nothing else in the admin exists for them:
  no sites list, no site pages, no edit or add, no logos route except their own sites' logos,
  no other desks, no People page. Deny by default: any route not explicitly allowed for a
  client answers 403 (or 404 for another site's desk, so slugs do not leak).
- A client landing on `/` is sent to their desk (one desk) or a short "Your Post Desks" list
  (several). With no desks granted: a plain page saying access has not been set up yet.

## Data (migration `0003_client_access.sql`)

```sql
CREATE TABLE desk_access (
  person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  level TEXT NOT NULL,            -- 'approve' | 'view'
  granted_at TEXT NOT NULL,
  PRIMARY KEY (person_id, site_id)
);
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

`people.role` takes `owner` or `client`. Owners need no desk_access rows. `settings` holds
`access_group_id` and the last sync result (`access_sync_at`, `access_sync_error`).

## Authorization

- `authorize` returns the person plus, for a client, their grants `{site_id, slug, level}`.
- Middleware, after the existing Access JWT check and people lookup: owners pass as today;
  clients pass only for `/`, `/sites/<slug>/social` and its sub-routes (`state`, `decide`,
  `check`, `media/...`, and any other desk sub-route) where `<slug>` is granted, and for
  `/logos/...` keys of their granted sites. Everything else: 403.
- Desk writes (`decide`, `check`): allowed for an owner, or a client whose grant on that site
  is `approve`. A `view` client gets 403 and the page shows no write controls (the existing
  read-only rendering). `decided_by` / `checked_by` record who acted; the desk shows
  "Approved by <name>" (or "Changes asked by <name>") on decided items so Alex and the client
  can see who did what. `desk pull` already reports who.
- The purge, the media versioning and the other desk rules are unchanged.
- The desk page for a client: no top nav to the dashboard or K&A's Social link; the header
  names the site and the signed-in person. Stories tab rules unchanged.

## People page (owner only)

- `/people`: everyone, their role, their desks and levels, and the Cloudflare sign-in sync
  status ("Sign-in list synced 2 minutes ago", or the error, or "not connected: token missing").
- Add a person: name, email, role (client by default). Edit: name, email, role, and per site a
  choice of no access / view / approve (list every site; the owner can grant any). Remove a
  person (with an in-page confirmation step; no browser confirm dialogs). An owner cannot
  remove themselves or the last owner, or demote the last owner.
- Every add, edit (email or role change) and removal re-syncs the Cloudflare group; a "Sync
  sign-in list now" button retries. A failed sync never blocks the admin change: the People
  page shows the error and the stale state until a retry succeeds.
- Plain form posts with redirects, like the rest of the admin (`checkOrigin` covers them).
  Validation: email format, length caps, unique email (case-insensitive).
- Nav: owners get a "People" link.

## Cloudflare Access group sync

- A Worker secret `ACCESS_GROUPS_TOKEN` (Alex creates the token: Account, "Access:
  Organizations, Identity Providers, and Groups", Edit; this account only) and the account id
  as a var `CF_ACCOUNT_ID` in wrangler.jsonc.
- Group name "K&A admin people". The first sync creates it if `settings.access_group_id` is
  empty and stores the id; later syncs PUT the full include list:
  `include: [{ email: { email } }, ...]` for every person (owners and clients). The sync is a
  pure function from the people list to the request body (tested) plus a thin fetch.
- If the token is missing, sync is skipped and the People page says so. No other admin feature
  depends on it.
- One-time setup by Alex in the Zero Trust dashboard (runbook): make sure One-time PIN is an
  enabled login method for the admin application, and add the group "K&A admin people" to the
  application's Allow policy (keep his own email rule as a fallback).
- Removing a person: the app denies them immediately (no people row); Cloudflare stops new
  logins after the sync; an existing Access session may live until it expires, which is fine
  because the app check is first.

## Tests

Role and grant checks for every route family (client allowed on own desk and sub-routes,
denied elsewhere; view vs approve writes; owner unchanged); the middleware path matcher
(including trailing slashes, encoded slugs, `..`); People validation and last-owner guards;
Access sync body building and token-missing behavior; migration applies.

## Deploy (runbook `admin/DEPLOY-CLIENT-ACCESS.md`)

1. `wrangler d1 migrations apply ka-sites --remote`
2. Alex: create the token, then `wrangler secret put ACCESS_GROUPS_TOKEN` (he pastes it at the
   prompt; it never goes in chat).
3. Build and deploy the admin.
4. Alex: open People, add Hannah (client, Fore Motion Golf: approve), check the sync status,
   then attach the group to the Access policy (one time) and test her login in a private window
   or have her sign in.
