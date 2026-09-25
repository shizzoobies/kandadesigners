# Session handoff: social pipeline, written 2026-09-25 (early morning)

Read this first in a new session. It says where the week of Sept 28 stands, what is
still running, and what only Alex can decide. Business context: `SOCIAL_HANDOFF.md`.
Folder contract and commands: `README.md`. Plan for the week: `plans/2026-09-28.md`.

## The pipeline, in one paragraph

Every post is a day folder under `To Be Released/` with a `brief.md` (the plan),
`post.json` (the manifest), `facebook.md`, `instagram.md`, and `media/`. Alex sets
`"status": "approved"`. Then `upload` pushes media to R2
(`https://media.ka-performancefl.com/...`), `release --draft` prints Metricool packets
that Claude sends through the Metricool MCP (`createScheduledPost`, brand 7076479),
`release --record` writes the ids back, Alex checks the previews in Metricool, and
`release --promote` plus `updateScheduledPost` turn the drafts into live posts.
`reconcile` archives folders once Metricool no longer lists them. Metricool is on a
plan with no REST API, so the Metricool calls always go through Claude in a session.
The Cloudflare token is the user-scope `CLOUDFLARE_API_TOKEN`; the tools read it at run
time. Tests: `node node_modules/vitest/vitest.mjs run` from `tools/` (124 pass).

## Where each day stands

| Day | Post | Status | What is left |
|---|---|---|---|
| Fri 09-25 | Job aids video | native (scheduled in Facebook by Alex) | nothing |
| Sat 09-26 | Bobbie Connor highlight | native | nothing |
| Mon 09-28 | Ellenton Family Practice Direct in the top three (incognito search + SEO end card, 14s, music C) | **scheduled as Metricool drafts** for 10:30 AM, FB id 381617380, IG id 381617409 | Alex previews in Metricool, then Claude runs `release --promote 2026-09-28`, sends both `updateScheduledPost` packets, records with `release --promoted` |
| Tue 09-29 | Contrast is not a vibe (v3 narration, music B, 16.9s) | planned, media and captions in place, valid | Alex picks a voice take (see below). If he picks A or C the reel is re-rendered with that take. Then approve, upload, release |
| Wed 09-30 | One screen, one decision (v3 narration, music C looped, 23.0s with the trimmed script; the 600-frame cap does not fit it by 3s) | planned, media and captions in place, valid, reel sent to Alex | Alex approves, then upload and release. Instagram caption carries the plain URL because the voice says "link in the caption" |
| Thu 10-01 | Give the AI the brief, not the task | planned, scenes built; **agent rendering with the trimmed script** | same as Wednesday |
| Fri 10-02 | Thrillers Mobile VR launch (15s, music A, captures from the demo) | planned, media and captions in place, valid, captions carry `[REAL DOMAIN]` | waits on Wix releasing the domain; replace the placeholder, confirm the site is live, decide tagging, then approve |

Run `node tools/social.mjs calendar` and `node tools/social.mjs validate` to see the live state.

## Decisions only Alex can make

1. **Contrast voice take.** Three mixes were sent: `D:\kap-reel\out\candidates\contrast-take-a-mix.mp3` (Sarah, understated), `-b-` (Sarah, brighter), `-c-` (Juniper `aMSt68OGf4xUZAnLpTU8`, grounded, ranked first of twelve). Write-up: `README-takes.md` in that folder. Whichever he picks becomes the voice for Wednesday and Thursday too, which then get regenerated on it (about 1,700 credits each).
2. **Monday previews** in Metricool's calendar (Sept 28, 10:30 AM), then say promote.
3. **Wednesday and Thursday scripts** were trimmed to fit 20 seconds at Alex's choice on 09-24; the trimmed lines are in each folder's `brief.md`.
4. **Friday:** the Thrillers domain, whether the launch line "Thrillers Mobile VR is live." holds on Friday morning, and whether Thrillers can be tagged. Fallback is the hero tutorial (needs the same voice redo first).
5. **Music disclosure:** Friday's captions say the music is AI generated. The September launch reels did not disclose music; keep or drop for consistency.

## Agents that were still running when this was written

- `thu-reel`: rendering Thursday with the trimmed script into `To Be Released/2026-10-01/media/`.
Both commit only their own files. If a new session finds their media in place and `validate` clean, they finished. Frames land in `D:\kap-reel\out\candidates\`.

## Reel project notes (`D:\kap-reel`, a junction; the real path has an ampersand)

- Invoke tools directly: `node node_modules/@remotion/cli/remotion-cli.js ...` and `node node_modules/tsx/dist/cli.mjs scripts/...`. `npx` breaks on this path even through the junction.
- New today: `eleven_v3` support in `scripts/voice.ts` (`--model eleven_v3`, tags stripped from captions), `scripts/voice-takes.ts` (multi-generation takes), `scripts/deliver-tutorial-short.ts`, `scripts/launch/thrillers-*.ts`, compositions `EndCardSEO`, `LaunchThrillersVertical`, tutorials `onescreen` and `brief` under `src/tutorial/`, music candidates `out/candidates/music-i-{a,b,c}.mp3` (indie pop, licensed on the ElevenLabs Pro plan, see `LICENSING.md`).
- The timeline lets a short cut run past 450 frames up to 600. Speed is never changed to fit; words are trimmed with Alex's ok instead.
- `git status` may show `src/Root.tsx` and `config/voice.json` modified while an agent is mid-run; those are its pending lines.

## Spend today (ElevenLabs credits, from per-request headers)

Candidates 2,185; Tuesday regeneration 63; contrast takes and audition about 8,866; Wednesday about 1,716; Thursday about 1,720 so far. Alex said credits are not the constraint; quality first.

## Rules that keep coming up

- A client gets a post only for a new feature, an upgrade, or a launch.
- Plan first: weekly plan doc, then a filled `brief.md` with `Approved: yes`, before anything is generated.
- No em dashes anywhere. US English. "K and A" in text sent to a voice model.
- Real sites, real results, nothing fabricated on screen. Every AI voice or visual disclosed in the caption.
- Nothing goes live without Alex setting approved, and drafts are promoted only after he previews them.

## Memory files (Claude's, in `~/.claude/projects/D--K---A-Performance-Site/memory/`)

`social-pipeline-2026-09.md`, `plan-before-produce.md`, `design-tastes-alex.md` (audio direction, quality over credits), `deploys-stay-manual.md`.
