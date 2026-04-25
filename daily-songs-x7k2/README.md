# Daily Songs

Private daily ElevenLabs Music Marketplace prompt generator.
Hosted at `kandadesigners.com/daily-songs-x7k2` (or your configured slug).

---

## What it does

Pick a music lane, click Generate, get 5 ready-to-use ElevenLabs song packages:
title, generation prompt, marketplace description, and tags. One click copies any field.

---

## Files added to the repo

```
daily-songs-x7k2/    <- Static frontend (this folder)
functions/api/
  auth.js            <- POST /api/auth
  generate.js        <- GET/POST /api/generate
lib/
  auth-cookie.js     <- HMAC cookie helpers
  system-prompt.js   <- Claude system prompt
```

---

## Deploy steps

### 1. Add secrets in Cloudflare

Go to your Pages project in the Cloudflare dashboard:
**Settings > Environment variables > Add variable** (mark as secret).

Or use Wrangler:

```bash
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put APP_PASSPHRASE
wrangler secret put COOKIE_SIGNING_SECRET
```

| Secret | Purpose |
|--------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `APP_PASSPHRASE` | Shared passphrase for the auth gate |
| `COOKIE_SIGNING_SECRET` | 32+ random chars for HMAC cookie signing |
| `MODEL_NAME` | (Optional) Anthropic model. Default: `claude-sonnet-4-6` |

Generate a signing secret:
```bash
openssl rand -hex 32
```

### 2. Push to main

```bash
git add daily-songs-x7k2/ functions/api/auth.js functions/api/generate.js lib/
git commit -m "Add Daily Songs app"
git push
```

Cloudflare Pages picks up the push and deploys automatically.

### 3. Visit the app

`https://kandadesigners.com/daily-songs-x7k2`

Enter the passphrase, pick a lane, generate.

---

## Upgrading the Claude model

Change only the `MODEL_NAME` secret in the Cloudflare dashboard. No redeploy needed.

---

## Local development

```bash
npx wrangler pages dev daily-songs-x7k2 --compatibility-date=2024-09-23
```

Set local secrets in a `.dev.vars` file (never commit this):

```
ANTHROPIC_API_KEY=sk-ant-...
APP_PASSPHRASE=test
COOKIE_SIGNING_SECRET=localtestonly32charslongenoughok
MODEL_NAME=claude-sonnet-4-6
```

---

## Changing the URL slug

1. Rename the `daily-songs-x7k2/` folder to your new slug.
2. Update `PATH_SLUG` in your Cloudflare environment variables.
3. Push and redeploy.
