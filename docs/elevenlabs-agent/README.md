# ElevenLabs Voice Agent — "Kai"

The voice sales agent embedded on /services/ (the "Or just talk to it" block).
Created 2026-07-23 via the ElevenLabs Agents API.

## Live identifiers

- **Agent ID:** `agent_2101ky8y21nmeh5ah2ytbntetzhm` (public — used by the embed, safe in the repo)
- **Knowledge-base doc ID:** `Xrj4wKy1ZuTRKL4cOVLG` ("K&A Performance KB")
- **Voice ID:** `qSeXEcewz7tA0Q0qk9fH` (Alex's chosen voice)
- **LLM:** `gemini-2.5-flash`
- Auth: public widget access (`enable_auth: false`) — anyone on the site can talk to it.

## What it does

Kai answers questions about web design, SEO, and AI search from
[knowledge-base.md](./knowledge-base.md), and offers to set up a call with
Alex: it collects name, email/phone, business, and preferred time, then
promises a personal follow-up within 24 hours. It never quotes fixed prices
(budget bands only) and steers off-topic conversations back.

## Embed (already in src/pages/services/index.astro)

```html
<elevenlabs-convai agent-id="agent_2101ky8y21nmeh5ah2ytbntetzhm"></elevenlabs-convai>
<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async></script>
```

The widget wants to float fixed bottom-right (which would collide with the
site-guide FAB) — the page pins its host into `#voice-agent-mount` with
`position: relative` + a fixed height. If ElevenLabs changes the widget's
internals and it escapes the mount, that CSS is the place to look.

## Updating the agent

Everything is editable in the ElevenLabs dashboard (Agents → K&A Site Voice
Agent), or via API with an `xi-api-key` header:

- Update KB text: recreate via `POST /v1/convai/knowledge-base/text`, then
  `PATCH /v1/convai/agents/{agent_id}` with the new doc id in
  `conversation_config.agent.prompt.knowledge_base` (and delete the old doc).
- Update prompt/voice/first message: `PATCH /v1/convai/agents/{agent_id}`.

The API key used for setup was rotated after creation (by design). Any new
key with Agents permissions works for maintenance.
