# Social Media Management

Facebook and Instagram posts for K&A Performance, one day folder per post.
This file is the contract. If a folder follows it, the tools accept it, no
matter who or what produced it: a person, Codex, or a script.

Business context and connected tools: `SOCIAL_HANDOFF.md`.
Design: `docs/superpowers/specs/2026-09-24-social-media-pipeline-design.md`.

## Rules that apply to every file here

- No em dashes. Use periods, commas, colons.
- US English.
- Real clients and real sites only, and only ones cleared for public showcase.
- No made up numbers. Any figure in a caption traces to a measured value in `source/`.
- If the voice or the visuals came from AI, say so in the caption in plain words
  (for example "The voice is AI narrated." or "The hands and rooms around the
  screens are AI assisted.") and set `ai.voice` or `ai.visuals` to true.
- Anything sent to a voice model spells "K and A". On screen and in captions it stays K&A.
- Nothing goes live until Alex sets `"status": "approved"` in `post.json`.

## The day folder

```
To Be Released/
  2026-09-28/
    post.json        the manifest
    facebook.md      Facebook caption, verbatim
    instagram.md     Instagram caption, then "## First comment" with the hashtags
    linkedin.md      optional, posted by hand
    media/           video, thumbnail, images (uploaded), and the SRT (kept on disk)
    source/          optional working files: script, narration takes, captures
```

Folder name is the post date, `YYYY-MM-DD`. A second post on the same day
is `YYYY-MM-DD-2`. When a post has published, the whole folder moves to
`Already Released/`.

## post.json

```json
{
  "id": "2026-09-28",
  "date": "2026-09-28",
  "time": "09:00",
  "timezone": "America/New_York",
  "status": "planned",
  "pillar": "client-spotlight",
  "title": "Osteen and Sons address lookup",
  "platforms": {
    "facebook": { "type": "REEL", "caption": "facebook.md" },
    "instagram": { "type": "REEL", "caption": "instagram.md" },
    "linkedin": { "manual": true, "caption": "linkedin.md" }
  },
  "media": [
    { "file": "media/reel-vertical.mp4", "role": "video", "origin": "kap-reel", "alt": "" },
    { "file": "media/thumbnail.jpg", "role": "thumbnail", "origin": "kap-reel", "alt": "Phone frame showing the address lookup form" },
    { "file": "media/reel-vertical.srt", "role": "captions", "origin": "kap-reel" }
  ],
  "ai": { "voice": true, "visuals": false },
  "generate": [],
  "r2": {},
  "metricool": {},
  "published": {},
  "credits": {},
  "lastError": null
}
```

- `status` moves one way: `planned`, `generating`, `ready`, `approved`,
  `scheduled`, `published`. `native` marks a post that was scheduled directly
  in Facebook; it has no media and the tools leave it alone. Alex sets
  `approved`. `release --record` sets `scheduled`, `reconcile` sets
  `published`, and scripts set everything else. Once validate passes on a planned
  folder whose media is on disk, Alex may set approved directly; ready is set
  by generate, or by hand when media was placed manually.
- `time` is local to `timezone`. Weekday default is 09:00.
- `platforms.<network>.type`: Facebook `POST`, `REEL`, `STORY`. Instagram
  `POST`, `REEL`, `STORY`, `TRIAL_REEL`. LinkedIn is `"manual": true`.
- `media[].role`: `video`, `image`, `thumbnail`, `captions`. Every `image`
  and `thumbnail` needs `alt`.
- `media[].origin`: `human`, `codex`, `elevenlabs`, `kap-reel`.
- `r2`, `metricool`, `published`, `credits`, `lastError` are written by the
  tools. Leave them as they are.

## Captions

`facebook.md` is posted as written. `instagram.md` is the caption, then a line
`## First comment`, then the hashtags. Instagram gets "link in bio" style
wording; Facebook gets the direct link. Keep hashtags out of the Instagram
caption body.

## Commands

Run from `D:\ka-social` (a junction to this folder) or from here:

```
node tools/social.mjs plan 2026-10-05 --pillar tip --title "Tab through your site"
node tools/social.mjs plan 2026-09-28 --pillar client-spotlight --title "Web reel" --from "D:\K & A Performance Site\Reels\Posts 9-4-26\Web reel" --ai-visuals
node tools/social.mjs validate
node tools/social.mjs validate 2026-09-28
node tools/social.mjs calendar --days 14
```

`--from` expects a folder with a Facebook subfolder holding exactly one
.mp4, one .srt, and one thumbnail*.jpg. `plan` also takes `--type POST|REEL`,
`--time HH:MM`, `--ai-voice`, and `--ai-visuals`; `calendar` takes
`--today YYYY-MM-DD`.

`plan` creates the folder and tells you what is still missing. `validate`
lists every problem in every folder and exits 1 if there are any. `calendar`
shows the next two weeks, with `gap` on weekdays that have nothing planned.

Tests: from `tools/`, `node node_modules/vitest/vitest.mjs run`.

## Release path

Once a folder is `approved`:

1. `node tools/social.mjs upload 2026-09-28` pushes its video and images to
   R2 and writes the public urls into `post.json`. Rerunning it skips files
   that have not changed.
2. `node tools/social.mjs release 2026-09-28 --draft` writes one Metricool
   payload per network into `post.json` and prints one packet per line.
   Claude sends each packet with the Metricool MCP (`createScheduledPost`,
   brand 7076479, `info` as a JSON string) and records what comes back:
   `node tools/social.mjs release --record 2026-09-28 --network facebook --id <id> --uuid <uuid>`.
   The folder becomes `scheduled` once every network is recorded. Drop
   `--draft` once the previews in Metricool have been checked.
3. After post time, Claude saves the `getScheduledPosts` response to a file
   and runs `node tools/social.mjs reconcile --from <file>`. Folders whose
   posts are no longer scheduled move to `Already Released/`. R2 objects are
   deleted a week after publishing.

`upload` and `release` take `--dry-run`. `reconcile` takes `--dry-run` and
`--now <ISO>` for testing. Every command is safe to rerun.

R2 settings live in `tools/config/r2.json` (bucket `ka-social`, public base
`https://media.ka-performancefl.com`). The Cloudflare token is read from
`CLOUDFLARE_API_TOKEN`, or on Windows from the user scope variable of that
name. It is never written anywhere.

## For Codex

To fill a planned day: read `post.json`, write `facebook.md` and
`instagram.md`, put finished files in `media/` with `"origin": "codex"` entries
in `media[]`, write alt text for every image, and set `ai` honestly. Then run
`validate` on the folder. Do not change `status`.

## Pillars

`client-spotlight`, `tip`, `training`, `ai-launch`, `behind-the-scenes`.
