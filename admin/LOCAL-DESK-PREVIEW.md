# Previewing the Post Desk locally

Local only. Nothing here talks to the real Cloudflare account: the D1 and R2
below live in `admin/.wrangler/state` on your own machine. Never add
`--remote` to any of these.

Needs Node 22+ (wrangler 4 refuses older Node; the tests use `node:sqlite`).

```sh
cd admin
cp .dev.vars.example .dev.vars        # ENVIRONMENT=development, DEV_EMAIL=alex@...; git ignores .dev.vars
node ./node_modules/wrangler/bin/wrangler.js d1 migrations apply ka-sites --local
node scripts/seed-desk-fixture.mjs    # local D1 rows + local R2 media; re-run to reset the desk
node ./node_modules/astro/astro.js dev # http://localhost:4321/sites/ka-performance/social
```

`astro dev` reads the same local D1 and R2 through the Cloudflare adapter's
platformProxy, and `.dev.vars` signs you in as `DEV_EMAIL` (the dev bypass in
`src/lib/identity.js`, off in production). Restart `astro dev` after changing
`.dev.vars`.

The fixture is a K & A desk: a reel with a question, a carousel with both
versions, a LinkedIn document, a Story, a native Facebook post and an ask;
the LinkedIn post is approved and the second reel has changes asked, the rest
wait. The Stories tab has a row in every phone state: one already posted
today, one due now (its time passed an hour before the seed ran), one later
today, tomorrow, one with a condition line, +3 days, and +5 days with a very
long sticker URL and sticker text (a PNG, so Save image covers both types).
Today's times are set from the clock when the seed runs, so re-seed if "later
today" has become due. Past-dated rows are purged when the desk opens, so the
"Not ticked" state lives in `tests/desk-stories.test.js`, not the fixture.
Two extra local-only logins check access levels:

| DEV_EMAIL | Sees |
| --- | --- |
| `alex@ka-performancefl.com` | Owner: full desk |
| `approver@desk-fixture.test` | Client, approve: can decide |
| `viewer@desk-fixture.test` | Client, view only: no buttons, writes 403 |

Save image on a phone uses the share sheet (Web Share with files), which
desktop Chrome's device mode doesn't have, so there it falls back to the
download. To try the share path, stub `navigator.canShare` and
`navigator.share` in the console before tapping it.

Phone checks: Chrome DevTools device mode at 390 and 360 wide, or open
`http://<your LAN IP>:4321/...` from a phone after `astro dev --host`.
Install needs a secure origin, so on a real phone test install on the live
site later; `localhost` in desktop Chrome offers Install from the address bar.

The fixture media is in `seed/desk-fixture/` (made by
`scripts/make-desk-fixture-media.py`); the PWA icons are made by
`scripts/make-desk-icons.py`.
