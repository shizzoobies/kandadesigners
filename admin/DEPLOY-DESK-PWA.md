# Going live with the Post Desk phone app (slices 1 to 6)

Alex runs each line, in order, in PowerShell, from `D:\ka-site-admin\admin`.
Whoever is helping Alex verifies after each step. Stop at the first error and paste it into the
session. The team has not run any of these commands; it only ran local builds,
tests and `wrangler deploy --dry-run` (no login).

What goes live: install to the home screen, one-thumb Approvals and Stories,
toast fixes, push notifications for new approvals, the home-screen badge,
swipe to decide, quiet hours and the Stories reminder. It all comes in one
draft PR from `release/desk-pwa` into `admin/post-desk`.

## 0. Before anything
- The release PR (`release/desk-pwa` into `admin/post-desk`) is reviewed.
- The worktree is on `admin/post-desk` and clean:
```powershell
cd "D:\ka-site-admin\admin"; git fetch origin; git switch admin/post-desk; git pull --ff-only; git status --short
```
Whoever is helping Alex verifies: the branch is `admin/post-desk`, `git status --short` prints
nothing, and the PR still shows as a draft with no conflicts.

## 1. Keys
Make the VAPID key pair on your own PC. Nothing is sent anywhere.
```powershell
cd "D:\ka-site-admin\admin"; node scripts/vapid-keys.mjs
```
Save both printed lines in your password manager now. The private key can't be
read back from Cloudflare later. Then store the private key as a Worker secret
(paste only the value after `VAPID_PRIVATE_KEY=` when asked):
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js secret put VAPID_PRIVATE_KEY
```
Whoever is helping Alex verifies: `wrangler secret list` shows `VAPID_PRIVATE_KEY` (the name
only; the value is never shown or pasted into the session).
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js secret list
```
Until step 5 deploys the code, the live Worker ignores this secret.

## 2. Config
The public key is not a secret. Put it, and `VAPID_SUBJECT`, into the release
branch's `wrangler.jsonc`. The PR ships with `"VAPID_PUBLIC_KEY": ""`, and with
that the desk says "Notifications aren't set up yet" and the cron sends nothing.
Paste the public key (the value after `VAPID_PUBLIC_KEY=`) when asked:
```powershell
cd "D:\ka-site-admin\admin"; git switch release/desk-pwa; git pull --ff-only; $k = (Read-Host 'VAPID public key').Trim(); $f = (Resolve-Path wrangler.jsonc).Path; $t = [IO.File]::ReadAllText($f); $t = $t.Replace('"VAPID_PUBLIC_KEY": ""', ('"VAPID_PUBLIC_KEY": "' + $k + '",' + "`n    " + '"VAPID_SUBJECT": "mailto:alex@ka-performancefl.com"')); [IO.File]::WriteAllText($f, $t, (New-Object System.Text.UTF8Encoding $false)); git diff --stat
```
```powershell
cd "D:\ka-site-admin\admin"; git add wrangler.jsonc; git commit -m "Post Desk: VAPID public key and subject"; git push; git switch admin/post-desk
```
Whoever is helping Alex verifies: the PR diff for `wrangler.jsonc` has only the two lines,
`VAPID_PUBLIC_KEY` matching the public key from step 1 and `VAPID_SUBJECT`.

## 3. Merge
On GitHub, open the release PR, click **Ready for review**, then **Merge**.
Then pull it into the worktree:
```powershell
cd "D:\ka-site-admin\admin"; git switch admin/post-desk; git pull --ff-only; git log --oneline -3
```
Whoever is helping Alex verifies: `admin/post-desk` now has the merge, and
`migrations/0005_desk_push_prefs.sql` exists. PRs #2 to #7 can be closed as
superseded now, not before.

## 4. Schema
This applies 0004 (`desk_push_subs`, `desk_push_sent`) and 0005 (quiet hours
and Stories reminder columns). Both are additive only. Run this **before** the
deploy, because the cron reads the new tables.
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js d1 migrations apply ka-sites --remote
```
Whoever is helping Alex verifies: the list shows `0004_desk_push.sql` and
`0005_desk_push_prefs.sql` applied, and the sites dashboard still loads.

## 5. Deploy
The same line as step 3 of `DEPLOY-POST-DESK.md`:
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/astro/astro.js build; if ($?) { node ./node_modules/wrangler/bin/wrangler.js deploy }
```
Whoever is helping Alex verifies, without a token: the desk and its media still 302 to Access,
and the workers.dev hostname still doesn't answer.

## 6. Verify
1. On desktop, open `https://admin.ka-performancefl.com/sites/ka-performance/social`.
   The page loads. Then open these two and paste what they show:
   `.../social/manifest.webmanifest` (JSON named "K & A Performance Post Desk")
   and `.../social/sw.js`. In DevTools, Network, `sw.js` has the response header
   `Service-Worker-Allowed: /sites/ka-performance/social`.
2. Watch the cron for one run (it fires every 5 minutes), then press Ctrl+C:
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js tail --format pretty
```
   Whoever is helping Alex verifies: a scheduled event appears within 5 minutes, with a
   `{"event":"desk.push",...}` line and no errors. If it says
   `"skipped":"no-vapid-keys"`, step 1 or 2 didn't take: the cron is safely
   sending nothing.
3. In Chrome on desktop, open the desk, click **More**, **Turn on**, allow, then
   **Send test**. A "Test from Post Desk" notification arrives.

## 7. iPhone checklist
On the iPhone, over HTTPS at admin.ka-performancefl.com:
- [ ] In Safari, open `/sites/ka-performance/social`, tap Share, then Add to Home Screen. The icon is the Post Desk mark and the title is "Post Desk".
- [ ] Open it from the Home Screen. It runs full screen with no Safari bar, and the Access sign-in comes back into the app.
- [ ] Approvals: open a post, approve it one-handed from the bottom bar, then tap Undo on the toast.
- [ ] Request changes. The sheet stays above the keyboard while you type, and the page doesn't zoom in.
- [ ] Leave the app for a minute, then come back. The queue refreshes on its own.
- [ ] Swipe right on a post to approve it, then Undo. Swipe left to open the change sheet (nothing sent). Swipe from the very left edge: it goes back, it doesn't approve.
- [ ] Stories: Copy URL pastes into an Instagram link sticker. Save image opens the share sheet and Save Image puts it in Photos. If iOS refuses the first tap, the button says "Ready, tap to save", and a second tap saves it. Tick Posted, then Undo.
- [ ] More, Notifications: before Add to Home Screen it says to install first. In the installed app, tap Turn on and allow, then Send test. The test notification arrives.
- [ ] Lock the phone and have whoever is helping you push something new from the pipeline. Within about 5 minutes a notification arrives, and tapping it opens that item.
- [ ] The Home Screen icon badge shows the waiting count, and approving the last one clears it.
- [ ] Quiet hours: turn them on (default 9:00 PM to 7:30 AM ET), Save, and reopen More. The times are still there. Anything new overnight arrives as one "N waiting on you" push after 7:30 AM.
- [ ] Stories reminder: turn it on (default 10:00 AM ET) and Save. On a day today's Story isn't ticked, "Today's Story isn't posted yet" arrives once, and tapping it opens the Stories tab.

## 8. Way back
Pick the smallest step that fixes the problem.
- **Roll back the code:**
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js rollback
```
  This goes back to the version deployed before step 5. What it leaves behind:
  the 0004 and 0005 tables and columns (additive, the old code ignores them,
  safe to leave), the `VAPID_PRIVATE_KEY` secret, and the merge on
  `admin/post-desk` (the next deploy from the worktree would ship it again, so
  revert the merge commit before redeploying).
  Cron triggers aren't part of a version, so after a rollback the 5-minute
  trigger stays and keeps firing the old code. Nothing gets sent, but the old
  version has no `scheduled` handler, so expect an error in the Worker logs
  every 5 minutes, not silence. To stop it: Cloudflare dashboard, the Worker,
  Settings, Triggers, the cron's three-dot menu, Delete. That can take up to
  15 minutes to take effect. The next deploy from the release branch adds the
  trigger back. Sources: [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/),
  [Rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).
- **Stop pushes only, keep the phone app:** in `wrangler.jsonc` change the
  triggers line to `"triggers": { "crons": [] }` (an empty list; deleting the
  line would leave the deployed cron in place), then redeploy with the step 5
  line. Removing the cron can take up to 15 minutes to take effect. What it leaves
  behind: subscriptions and settings stay in D1, notifications stay "on" on each
  device but nothing arrives, and Send test still works.
- **Or make every send a no-op without a deploy:**
```powershell
cd "D:\ka-site-admin\admin"; node ./node_modules/wrangler/bin/wrangler.js secret delete VAPID_PRIVATE_KEY
```
  The cron keeps running every 5 minutes, logs one
  `{"event":"desk.push","skipped":"no-vapid-keys"}` line per run, sends nothing,
  and marks nothing sent. Send test sends nothing either. Subscriptions and
  settings stay in D1. Putting the same key back (step 1's `secret put`)
  resumes pushes. A new key pair would mean every device has to turn
  notifications off and on again.
- **The migrations** are additive and can stay. Don't drop the tables by hand.
