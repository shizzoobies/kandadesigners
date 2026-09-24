# Social media pipeline: design

Date: 2026-09-24. Owner: Alex. Lives in `Social Media Management/`.

## What this is

A folder-driven pipeline for Facebook and Instagram posts. Each post is a day
folder on disk. Scripts generate media, validate the folder, upload media to
Cloudflare R2, build the Metricool payload, and archive the folder once the post
is live. Metricool does the scheduling and publishing. Alex approves every post
by editing one field on disk before anything leaves the machine.

Decisions made in the brainstorm on 2026-09-24:

- Scheduling and publishing go through Metricool (brand `7076479`, Facebook
  page `1239857262550754`, Instagram `@kaperformancefl`, timezone
  `America/New_York`). LinkedIn is not connected to Metricool; LinkedIn cuts are
  posted by hand until it is.
- Media is hosted on a Cloudflare R2 public bucket. Metricool only accepts
  public URLs.
- The human checkpoint is on disk: Alex sets `status: approved` in the
  manifest. Scheduled posts use Metricool auto-publish. The first week is
  scheduled as Metricool drafts so Alex can check the previews once.
- The Metricool account is on a Free or Starter plan, so there is no REST API
  token. The scheduling call is made by Claude through the Metricool MCP in a
  session. The script does everything up to and after that call. A REST backend
  can replace the MCP step later without changing anything else.
- Two posts are already scheduled natively in Facebook and stay there: Fri
  2026-09-25 morning (job aids video) and Sat 2026-09-26 morning (Bobbie Connor
  highlight). They are recorded as `native` day folders so the calendar shows
  them and release skips them.

## Non negotiables carried from the reels

- No em dashes anywhere: captions, alt text, narration scripts, SRTs, README.
- Real sites and real clients only, and only ones cleared for public showcase.
- No fabricated metrics. Any number in a caption or on screen traces to a
  measured value in `source/`.
- "K&A" is written "K and A" in any text sent to a voice model.
- Any post whose voice or visuals come from AI generation carries the Instagram
  AI flag and a plain disclosure line in the caption.
- Every ElevenLabs call is measured for credits and the spend is recorded.
- Nothing goes live without `status: approved` set by Alex.
- US English throughout.

## Folder contract

```
Social Media Management/
  README.md                the contract, written for Codex and humans
  SOCIAL_HANDOFF.md        business and tool context (exists)
  tools/                   the Node toolset (package.json, vitest)
  To Be Released/
    2026-09-25/            native placeholder
    2026-09-28/
      post.json
      facebook.md
      instagram.md
      linkedin.md          optional
      media/
      source/              optional
  Already Released/
    2026-09-21/            same layout, plus the publish record
```

A day folder is named `YYYY-MM-DD`. A second post on the same day is
`YYYY-MM-DD-2`. Folders under To Be Released are the calendar of record.

### post.json

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
    { "file": "media/reel-vertical.mp4", "role": "video",
      "origin": "kap-reel", "alt": "" },
    { "file": "media/thumbnail.jpg", "role": "thumbnail",
      "origin": "kap-reel", "alt": "Phone frame showing the address lookup form" },
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

Fields:

- `status` moves one way: `planned`, `generating`, `ready`, `approved`,
  `scheduled`, `published`. `native` is terminal and set by hand. Alex sets
  `approved`; he may do so straight from `planned` when the media is already on
  disk and `validate` is clean. `ready` is set by `generate`, or by hand when
  media was placed manually. Scripts set every other value.
- `time` is local to `timezone`. Default `09:00` on weekdays until Metricool has
  enough history for `getBestTimeToPostByNetwork`, after which `release` reads
  that and writes the chosen time back.
- `platforms.<network>.type` follows Metricool: Facebook `POST`, `REEL`,
  `STORY`; Instagram `POST`, `REEL`, `STORY`, `TRIAL_REEL`. LinkedIn entries
  are `manual: true` and ignored by upload and release.
- `media[].origin` is one of `human`, `codex`, `elevenlabs`, `kap-reel`. It is
  informational; the `ai` block is what drives the AI flag and the disclosure
  check. `alt` is required for every image role; the validator enforces it.
- `generate` is the ordered list of generation jobs (see Generation).
- `r2` is written by upload: `{ "<file>": { "key", "url", "sha256", "uploadedAt",
  "previous"?, "deletedAt"? } }`. Keys are `<folder id>/<sha8>-<basename>`; a
  replaced file keeps its old keys in `previous` so cleanup deletes them too.
- `metricool` is written by release, keyed by network because Facebook and
  Instagram usually get different captions and so different Metricool posts:
  `{ "facebook": { "payload", "id", "uuid", "scheduledAt", "draft" },
  "instagram": { ... } }`. There is always one Metricool post per network,
  even when the captions happen to match, so the record shape never varies.
- `published` is written by reconcile: `{ "at", "facebook": { "permalink" },
  "instagram": { "permalink" } }` with permalinks filled when available.
- `credits` is written by generate: `{ "<jobId>": { "credits", "at" } }`.
- `lastError` is the last failure message from any command, cleared on the next
  successful run of that command.

### Captions

`facebook.md` is the Facebook caption verbatim. `instagram.md` has the caption,
then a `## First comment` heading whose body becomes `firstCommentText`
(hashtags go there). `linkedin.md` is free form. Showing it in `calendar` is deferred past phase 1.
Markdown is used so captions are readable and editable anywhere; no Markdown
syntax other than that one heading is interpreted.

### Native placeholders

```json
{ "id": "2026-09-25", "date": "2026-09-25", "time": "09:00",
  "timezone": "America/New_York", "status": "native",
  "title": "Job aids that make sense (video, scheduled in Facebook)",
  "platforms": { "facebook": { "type": "REEL" } } }
```

## Commands

The toolset is Node with vitest, in `Social Media Management/tools/`. The path
contains an ampersand, which breaks npm's `.cmd` shims on Windows, so it runs
through a directory junction at `D:\ka-social`, the same fix `D:\kap-reel` uses.
Entry point: `node tools/social.mjs <command> [folder] [--dry-run]`.

Every command runs `validate` on its targets first and refuses to continue on a
failure. Every command is safe to rerun. A failure leaves `status` unchanged,
writes `lastError`, and prints it.

- **plan** `<date> --pillar <p> --title "<t>" [--type REEL|POST]` creates the
  folder, `post.json`, and empty caption files. Status `planned`. Refuses to
  overwrite an existing folder.
- **generate** `[folder]` runs the `generate` jobs of `planned` and
  `generating` folders. Sets `generating` on start and `ready` when every entry
  in `media` exists on disk. A job that has already produced its output with
  the same inputs is skipped.
- **validate** `[folder|--all]` checks the contract and Metricool's rules and
  reports every problem, not just the first. Exit code 1 on any failure.
- **upload** `[folder|--all]` pushes the `media` files of `approved` folders to
  R2 at `<date>/<sha8>-<basename>` with `wrangler r2 object put`, and writes `r2`.
  Skips files whose sha256 already matches the record. Does not change status.
- **release** `[folder|--all]` builds the Metricool `createScheduledPost`
  payload for each `approved` folder whose media is all in `r2`, writes it to
  `metricool.<network>.payload` with `preparedAt`, and prints one release
  packet per network. Repeating the step for a network prepared earlier prints
  a warning: check `getScheduledPosts` for that date before sending again.
  Claude reads the packet in a session, calls the MCP, and runs
  `release --record <folder> --network <n> --id <id> --uuid <uuid>` once per
  network, which writes `metricool.<network>`. The folder becomes `scheduled`
  once every non-manual network has a record. With `--draft`, the payload
  carries `draft: true`. Networks that already have a record are skipped, so a
  folder where Facebook was recorded and Instagram was rejected stays
  `approved` with `lastError` set until the Instagram post is recorded. A
  rejection is recorded with `release --record <folder> --network <n> --error
  "<message>"`. A Metricool draft never auto-publishes: `release --promote
  <folder>` prints one `updateScheduledPost` packet per draft network with
  `draft: false`, Claude sends it, and `release --promoted <folder> --network
  <n> --id <newId>` records the new id (the uuid does not change). `reconcile`
  holds any folder with a draft record, or whose uuid Metricool lists as a
  draft, under `waiting` until it is promoted.
- **reconcile** asks Metricool for scheduled posts across the window covering
  every `scheduled` folder (Claude runs `getScheduledPosts` in a session and
  passes the result via `reconcile --from <file>`). Any `scheduled` folder none
  of whose recorded `uuid` values is still in the list, and whose post time has
  passed, is marked `published` with `published.at` set to the scheduled time, its
  manifest is written, and only then is the folder moved to Already Released.
  R2 objects for folders published more than seven days ago are deleted.
- **calendar** `[--days 14]` prints one line per day: date, weekday, status,
  pillar, title, and `native` or `gap` where applicable.

### Release payload

Built from the manifest, following the Metricool MCP contract confirmed on
2026-09-24:

- `publicationDate: { dateTime: "<date>T<time>:00", timezone }`, `autoPublish:
  true`, `draft` per flag.
- `text` from `facebook.md`; `firstCommentText` from the Instagram first
  comment. When the Facebook and Instagram captions differ, two posts are
  created, one per network, so each gets its own text. Caption sidecars (role
  `captions`) are not uploaded; Metricool has no field for them.
- `media` and `videoThumbnailUrl` from `r2`. `mediaAltText` from `media[].alt`.
- `facebookData: { type }`, `instagramData: { type, isAiGenerated:
  ai.voice || ai.visuals }`.
- A thumbnail is only sent when a video is present and the network is
  Facebook POST or REEL or Instagram REEL or TRIAL_REEL, per Metricool's rule.
  Thumbnails must be jpg, jpeg, or png.

### Validator rules

Contract: folder name matches `date`; `status` is a known value; every
`media[].file` exists once status is `ready` or later; every image role has
`alt`; caption files named in `platforms` exist and are non empty; native
folders have no media.

Metricool: Instagram needs at least one image or video; a `REEL` on either
network needs a video; a Story with text is rejected; caption length within
each network's limit; `time` is a valid local time and in the future for
`approved` folders.

House rules: no em dash (U+2014) in any text file; network names, types,
media roles, and origins come from the closed sets in the README; every
`media[].file` is a relative path inside `media/`;
Instagram hashtags only under the first comment heading; when `ai.voice` or
`ai.visuals` is true, both captions contain a disclosure line (matching
"AI narrated", "AI voice", "AI generated", or "AI assisted"); any narration script in `source/`
spells "K and A".

## Generation

`generate` jobs are entries in `post.json`'s `generate` list, run in order:

```json
{ "id": "narration", "kind": "narration", "script": "source/script.md",
  "voice": "sarah", "out": "source/narration.mp3" }
{ "id": "reel", "kind": "reel", "composition": "TutorialVertical",
  "props": { "tutorial": "contrast" },
  "out": ["media/reel-vertical.mp4", "media/reel-vertical.srt",
          "media/thumbnail.jpg"] }
{ "id": "cover", "kind": "image", "prompt": "source/cover-prompt.md",
  "model": "flux-kontext", "out": "media/cover.jpg" }
```

- **narration** imports from `Reels/kap-reel/scripts/audio.ts` and `voice.ts`:
  key loading from kap-reel's `.env`, retry, usage snapshot and credit delta,
  hash cache. Model `eleven_multilingual_v2`. Voice `sarah` maps to
  `EXAVITQu4vr4xnSDxMaL` until Kai's voice id is supplied. Credits are written
  to `credits.narration`.
- **reel** shells out to `D:\kap-reel` to render the named composition and
  copies the outputs into `media/`. Not needed for the first weeks, because
  four finished reels already exist in `Reels/Posts 9-4-26` and
  `Reels/instructional reels`; those are copied into day folders by `plan`
  with `--from <reel folder>`.
- **image** calls ElevenLabs image generation. New code; built after narration
  proves the plumbing. Before spending, it lists the models the account can
  reach and fails clearly if the requested one is not available. The model
  id in the example is illustrative; the real id is set when the job is built.

Codex participates through the contract: point it at `README.md` and a
`planned` folder, and it writes captions and drops assets into `media/` with
`origin: "codex"`. Its output passes through the same `validate` as everything
else.

## Error handling

- Idempotent commands as described above.
- A folder moves to Already Released only after its manifest is written.
- Secrets never enter a manifest or caption. ElevenLabs key stays in
  kap-reel's `.env`; the Cloudflare token stays in the environment.
- Metricool rejections are recorded verbatim in `lastError` with the folder
  left `approved`, so a fixed folder can be released again.
- The R2 bucket is public read only. Object keys include the date and the
  first eight hex characters of the sha256, so a changed file is a new key and old URLs never point at the
  wrong media.

## Testing

- vitest in `tools/`. Units: validator rules (one test per rule, including the
  em dash and disclosure checks), status transitions, payload builder against
  a fixture manifest, caption parsing (first comment split), reconcile's
  published detection.
- Fixtures are built per test in a temporary root by helpers in
  `tools/test/helpers.mjs` (`makeTempRoot`, `makeDay`, `baseManifest`,
  `baseFiles`), so no binary fixture lives in git.
- `--dry-run` on upload and release prints the actions and payloads without
  calling anything.
- One live test in phase 2: a single post scheduled as a draft on a date well
  ahead, checked in Metricool's calendar, then deleted there by hand.

## Phases

1. **Contract and calendar.** `README.md`, manifest schema, `plan`, `validate`,
   `calendar`, tests. Native placeholders for 2026-09-25 and 2026-09-26. The
   four finished reels packaged as day folders for the week of 2026-09-28,
   replacing the handoff's screenshot drafts.
2. **Release path.** R2 bucket, R2 permission on the Cloudflare token,
   `upload`, `release` with the MCP handoff and `--record`, `reconcile`. Live
   draft test. First real posts.
3. **Generation.** `narration`, then `image`, then `reel`.

## Open items for Alex

- R2 write permission on the Cloudflare API token (token id
  `d2e556ad1be397c43be37f61c7b17a64`).
- Kai's voice id for final narration.
- Whether to connect the LinkedIn company page to Metricool.
- Which client results and tags are cleared for public posts (from the
  handoff's open questions).
