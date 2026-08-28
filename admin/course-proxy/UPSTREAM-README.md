# Optional Generation Proxy (Cloudflare Worker)

This Worker is the **optional** upgrade that makes the build sections (s5 website,
s6 SCORM) generate real, unique content from the learner's typed request using
Claude Haiku. The course works fully without it: with no Worker URL set, every
section uses its built-in deterministic output.

You only need this if you want the "this is what it actually feels like" payoff
where each learner's build genuinely differs.

## How it fits together

```
Rise / Reach embed (s5 or s6 index.html)
   -> fetch(workerUrl, { kind, prompt, prev })
        -> THIS Worker (holds the API key, rate limits, validates)
             -> Claude Haiku (returns a small JSON model)
   <- JSON model -> the section renders it through its own safe template
```

The API key never leaves the Worker. If the Worker is unreachable (offline, down,
rate limited), the section silently falls back to deterministic output, so the
learner never sees a broken screen.

## What you need

- A Cloudflare account (free tier is enough).
- The Wrangler CLI: `npm install -g wrangler` then `wrangler login`.
- An Anthropic API key from the Console. You set it as a secret below; you never
  paste it into any course file, and you never send it to me.

## Deploy steps

1. **Open this folder in a terminal.**
   ```
   cd _worker
   ```

2. **Create the rate-limit KV namespace** and copy the id it prints:
   ```
   wrangler kv namespace create RATE_LIMIT
   ```
   Paste the id into `wrangler.jsonc` where it says `PASTE_YOUR_KV_NAMESPACE_ID_HERE`.

3. **Set your Reach domain** in `wrangler.jsonc` under `vars.ALLOWED_ORIGINS`
   (comma separated, wildcards like `https://*.reach360.com` are fine). Keep the
   `127.0.0.1` / `localhost` entries while you test locally; you can remove them later.

4. **Store the API key as a secret** (it is prompted for, not echoed):
   ```
   wrangler secret put ANTHROPIC_API_KEY
   ```

5. **Deploy:**
   ```
   wrangler deploy
   ```
   Wrangler prints your Worker URL, e.g. `https://cc-course-proxy.<you>.workers.dev`.

6. **Smoke test from the command line** before touching Rise:
   ```
   curl -X POST https://cc-course-proxy.<you>.workers.dev \
     -H "Content-Type: application/json" \
     -H "Origin: http://127.0.0.1:8731" \
     -d '{"kind":"site","prompt":"a dark modern coffee shop called Ember with a menu"}'
   ```
   You should get back `{"ok":true,"model":{...}}`.

7. **Turn it on in the course.** Open `s5-build-website/index.html` and
   `s6-build-scorm/index.html`, find this line near the top of the script:
   ```js
   var CONFIG = { workerUrl: "" };
   ```
   Paste your Worker URL between the quotes, re-zip the section (the four root
   files), and re-embed. Leave it `""` to stay fully deterministic.

## Optional: stop a leaked link from spending your money

A published course link is semi-public. Two protections, both recommended:

- **Rate limit (already on):** `DAILY_LIMIT_PER_IP` (300) caps calls per learner
  IP per day, and `DAILY_LIMIT_GLOBAL` (1500) is a budget backstop that caps
  total calls per day across everyone, so a leaked link cannot drain the key.
  Both are in `worker.js`. At Haiku rates that global cap is worst-case a few
  dollars per day; normal use by a handful of learners is a few cents total.
- **Cloudflare Turnstile (optional):** create a Turnstile widget, then
  `wrangler secret put TURNSTILE_SECRET`. When set, the Worker requires a valid
  token. You would add the Turnstile widget to the embed and pass its token as
  `turnstileToken` in the fetch body. Ask me to wire this in if you want it.

## On-page assistant (text now, ElevenLabs voice when you are ready)

Every lesson has a help bubble in the bottom-right ("Ask"). It answers questions
about the page the learner is on, by text or voice.

- **Text works the moment this Worker is live.** Typed questions are answered by
  the same Claude tutor (the `chat` endpoint), with the page context passed in, so
  the answer is about the right screen. Nothing else to set up.
- **Voice is powered by an ElevenLabs Conversational AI agent.** Until you add the
  two values below, tapping the mic shows a calm "voice is being set up" note and
  text keeps working. No broken screen.

### Turn voice on

1. **Create the agent** at elevenlabs.io (Conversational AI -> Agents). Give it a
   system prompt that says it is a friendly helper for a Claude Code training
   course and should answer about the page the learner is on. It receives the page
   the learner is viewing as a `contextual_update`, so tell it to use that context.
2. **Set the agent's output audio format to PCM 16000** (Voice / Advanced). The
   bubble plays raw PCM; this is the one setting that matters for playback.
3. **Optional:** if your prompt uses `{{learner_name}}` or `{{page}}`, declare them
   as dynamic variables with sensible defaults (the bubble sends both).
4. **Copy the Agent ID** (Agent settings, looks like `agent_...`).
5. **Add two secrets to this Worker** (dashboard: Workers -> your Worker ->
   Settings -> Variables, add as encrypted; or via CLI):
   ```
   wrangler secret put ELEVENLABS_API_KEY      # your ElevenLabs API key
   wrangler secret put ELEVENLABS_AGENT_ID     # the agent_... id
   ```
   The ElevenLabs key never reaches the course. The Worker uses it to mint a
   short-lived signed URL (valid 15 minutes); the browser opens the voice
   WebSocket straight to ElevenLabs with that URL.
6. **Redeploy** (`wrangler deploy`). The mic goes live. No need to re-zip the
   sections; they already point at this Worker.

### If a published embed blocks the microphone

Voice needs mic permission. Inside Rise/Mighty your HTML runs in an iframe whose
permissions Articulate controls, so the mic may be blocked there even though text
works. To give learners a path anyway, set a public talk page on your agent and
paste its URL into `convai.js` at `CONVAI.voiceFallbackUrl`. When the mic is
blocked, the bubble shows an "Open voice chat in a new tab" link to it. Test on the
live Reach page to see whether the in-embed mic is allowed before relying on it.

### Cost note for voice

ElevenLabs Conversational AI is billed per minute of conversation (separate from
your Anthropic account). For four trainees it is small, but it is real, so keep an
eye on it. The same per-IP and global daily caps in `worker.js` also gate the
signed-URL endpoint, so a leaked link cannot open unlimited voice sessions.

## Cost

Haiku is about $1 per million input tokens and $5 per million output. A single
build is a few hundred tokens in and roughly a thousand out, so on the order of
**half a cent per generation**. Four trainees doing a handful of builds each is
effectively free. The daily IP cap is your ceiling against surprises.

## Honesty note

The generated SCORM model is still rendered by the section's own simplified
SCORM 1.2 teaching template. Real generation makes the questions and copy
genuine; it does not turn the preview into a validated production SCORM package.
