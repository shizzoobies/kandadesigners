# Deploying client access to Post Desks

Alex runs each line, in order, in PowerShell. Claude verifies after each step.
Stop at the first error and paste it into the session (never paste the token).

The design is `docs/superpowers/specs/2026-10-02-client-access-design.md`.

## 0. Before anything
- `admin/post-desk` is reviewed, committed, and builds cleanly. Like the earlier
  admin work, it deploys from the worktree `D:\ka-site-admin`.
- Check the roles already in `people`. After this deploy only `owner` and
  `client` get in; any other role is refused (deny by default).

```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 execute ka-sites --remote --command "SELECT role, COUNT(*) AS n FROM people GROUP BY role"
```
Claude verifies: every row is `owner` (or `client`). If any other role shows
up, stop and decide what that person should be before deploying.

## 1. Schema
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 migrations apply ka-sites --remote
```
Claude verifies: `desk_access` and `settings` exist in `ka-sites`, and the
sites dashboard still loads.

## 2. The sign-in list token (Alex, in the Cloudflare dashboard)
1. Go to dash.cloudflare.com, open your profile (top right), then **API Tokens**.
2. **Create Token**, then **Create Custom Token** (Get started).
3. Token name: `K&A admin people sync`.
4. Permissions: one row only. **Account**, **Access: Organizations, Identity
   Providers, and Groups**, **Edit**.
5. Account Resources: **Include**, and pick the K & A account (the one the
   admin runs in). Leave Client IP filtering and TTL empty.
6. **Continue to summary**, check it lists that single permission on that
   single account, then **Create Token**. Copy the token. Do not paste it in
   chat or save it in a file.

Then store it as a Worker secret. Paste the token at the prompt:
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js secret put ACCESS_GROUPS_TOKEN
```
Claude verifies: `wrangler secret list` shows `ACCESS_GROUPS_TOKEN` (names only).

## 3. Build and deploy the admin
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/astro/astro.js build; if ($?) { node ./node_modules/wrangler/bin/wrangler.js deploy }
```
Claude verifies, without a token:
- `admin.ka-performancefl.com/people` 302s to Access.
- `admin.ka-performancefl.com/sites/foremotion-golf/social` 302s to Access.

## 4. Add Hannah and sync (Alex, in the admin)
1. Open **People** in the admin's top nav.
2. Add a person: Hannah's name and email, role **Client**.
3. On her page, set **Fore Motion Golf** to **Can approve**, leave every other
   site at **No access**, and save.
4. Back on People, the sign-in list line should read "Sign-in list synced ...".
   If it shows an error, press **Sync sign-in list now** once; if it still
   fails, paste the error line into the session.

## 5. One-time Zero Trust setup (Alex, once)
In the Zero Trust dashboard (one.dash.cloudflare.com, the K & A account):
1. **One-time PIN as a login method.** Go to **Settings**, then
   **Authentication** (newer layouts: **Integrations**, then **Identity
   providers**). Under Login methods, if **One-time PIN** is not listed, choose
   **Add new**, then **One-time PIN**, and save.
2. **The admin application.** Go to **Access**, then **Applications** (newer
   layouts: **Access controls**, then **Applications**). Open the application
   for `admin.ka-performancefl.com` and choose **Configure** (or Edit).
   - On **Login methods** (Authentication tab), make sure **One-time PIN** is
     ticked, or that "Accept all available identity providers" is on.
   - On **Policies**, edit the **Allow** policy. Keep your own email rule as it
     is (that is the fallback). **Add include**, selector **Access groups**,
     value **K&A admin people**. Save the policy, then save the application.
   Include rules are OR: you still get in by your own email rule even if the
   group were empty.

## 6. Test Hannah's sign-in
Open `admin.ka-performancefl.com` in a private window and sign in with
Hannah's email (or have her do it): Cloudflare emails a one-time code. She
should land straight on the Fore Motion Golf Post Desk, with no Sites,
Add site, Social or People links, and her name in the header. Any other
page in the admin answers "Not authorized" (another site's desk: "Not found").

## Removing someone later
People, the person, **Remove**, confirm. The admin refuses them at once; the
sync takes them off the Cloudflare list so new sign-ins stop. A session they
already have may last until it expires, but the admin check comes first.
