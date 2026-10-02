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

## Plan first

The week is planned in `plans/<week>.md` before any post exists. Each slot in
that plan becomes a day folder with a brief. Nothing is generated, copied in,
or scheduled until the brief says `Approved: yes`.

## The day folder

```
To Be Released/
  2026-09-28/
    post.json        the manifest
    brief.md         the plan for this post: what it is for, hook, format, needs; Alex marks Approved: yes
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
  YouTube `VIDEO`, `SHORT` (see "YouTube" below).
- `platforms.<network>.time` (optional, any network) overrides the folder's
  `time` for that one network.
- `platforms.instagram.audio` (optional, Instagram `REEL` only) asks for an
  Instagram sound. See "Instagram audio on Reels" below.
- `media[].role`: `video`, `image`, `thumbnail`, `captions`. Every `image`
  and `thumbnail` needs `alt`. A `thumbnail` is .jpg, .jpeg, or .png.
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

## Clients

A global `--client <slug>` on any command (`node tools/social.mjs --client
davids-bbq validate`, `node tools/review.mjs --client davids-bbq`) works in
`clients/<slug>/` instead of here. See `clients/README.md` for the contract
(a client with `publish: "owner"` posts by hand from a hand-off folder, not
through Metricool: `upload` and `release` refuse it, use `handoff` instead).

## Release path

Once a folder is `approved`:

1. `node tools/social.mjs upload 2026-09-28` pushes its video and images to
   R2 and writes the public urls into `post.json`. Rerunning it skips files
   that have not changed. A changed file gets a new key; the old key is kept
   in `post.json` and deleted with the rest. Metricool copies the media to its
   own host when the post is created, so the R2 objects are only needed until
   then. Wrangler uploads files up to 300 MiB.
2. `node tools/social.mjs release 2026-09-28 --draft` writes one Metricool
   payload per network into `post.json` and prints one packet per line.
   Claude sends each packet with the Metricool MCP (`createScheduledPost`,
   brand 7076479, `info` as a JSON string) and records what comes back:
   `node tools/social.mjs release --record 2026-09-28 --network facebook --id <id> --uuid <uuid>`.
   If Metricool rejects a packet, record that instead:
   `node tools/social.mjs release --record 2026-09-28 --network facebook --error "<message>"`.
   The folder becomes `scheduled` once every network is recorded.

   `--draft` puts the posts in Metricool as drafts so the previews can be
   checked there. A draft never publishes on its own. Once the previews look
   right, `node tools/social.mjs release --promote 2026-09-28` prints one
   packet per draft. Claude sends each with `updateScheduledPost` (blogId
   7076479, the packet's id and uuid, `info` as a JSON string). Metricool
   gives the post a new id and keeps its uuid, so record the new id:
   `node tools/social.mjs release --promoted 2026-09-28 --network facebook --id <new id>`.
   Without `--draft`, the posts go straight onto the schedule.

   If `release` prints `warning: ... was prepared before`, a packet for that
   network may already be in Metricool. Never send it again until
   `getScheduledPosts` for that date shows it is not there.
3. After post time, run `node tools/social.mjs reconcile --window`. It prints
   the `getScheduledPosts` arguments that cover every scheduled folder. Claude
   calls `getScheduledPosts` with exactly those arguments plus brandId
   7076479, saves the raw JSON response to a file, and runs
   `node tools/social.mjs reconcile --from <file>`. A folder has published once
   its time has passed and each of its posts is either gone from the list or
   listed with every provider `"status": "PUBLISHED"` (Metricool keeps
   published posts in `getScheduledPosts`). It moves to `Already Released/`,
   and each network's `publicUrl` is saved as `published.<network>.permalink`.
   The saved JSON must keep each item's `uuid`, `draft` and `providers`
   (`network`, `status`, `publicUrl`); a list with uuids alone reads as still
   pending. A provider whose status names an error or failure is reported, the
   folder is left where it is, and the command exits 1. A folder with any draft
   waits, whatever the time, until it is promoted. R2 objects are deleted a
   week after publishing. One folder that cannot be moved is reported and the
   rest still go; the command then exits 1.

`upload` and `release` take `--dry-run`. `reconcile` takes `--dry-run` and
`--now <ISO>` for testing. Every command is safe to rerun.

R2 settings live in `tools/config/r2.json` (bucket `ka-social`, public base
`https://media.ka-performancefl.com`). The Cloudflare token is read from
`CLOUDFLARE_API_TOKEN`, or on Windows from the user scope variable of that
name. It is never written anywhere.

## Instagram audio on Reels

An Instagram `REEL` can go out with an Instagram sound (a trending track)
through Metricool's `audioConfiguration`:

```json
"instagram": {
  "type": "REEL", "caption": "instagram.md",
  "audio": { "term": "Espresso Sabrina Carpenter", "audioVolume": 40, "videoVolume": 0 }
}
```

- Exactly one of `term` (song title and/or artist) or `id` (the numeric
  Instagram audio id; write a long id as a string). `audioVolume` and
  `videoVolume` are optional whole numbers from 0 to 100.
- `validate` rejects `audio` on any network but Instagram, on any type but
  `REEL` (not `POST`, `STORY` or `TRIAL_REEL`), with both or neither of
  `term` and `id`, an empty term, any other field, or a volume out of range.
  Leaving out `TRIAL_REEL` is deliberate, even though Metricool accepts audio
  there, until a trial-reel test is planned.
- A client with `publish: "owner"` cannot use `audio` yet: the hand-off folder
  does not carry a sound, so `validate` rejects it for those clients.
- `release` puts it on the Instagram packet only, as
  `info.instagramData.audioConfiguration`: `{ "audioId": <id or term>,
  "videoVolume": <given, or 0>, "audioVolume": <only when given> }`. Nothing
  else is sent (Metricool fills the title, artist and cover from its catalog).
  `videoVolume` defaults to 0 because our own music bed is usually baked into
  the video and would play under the sound. Set it higher for a video whose
  voice or natural sound should stay. The default of 0 is deliberate: it is
  K&A's muted-first rule.
- It only works on an Instagram Business account connected to Metricool
  through a Facebook Page. Metricool resolves a term only when exactly one
  sound matches; zero or several is a rejection that lists candidates. Retry
  with the exact numeric `id` when one candidate is clearly right.
- Metricool's catalog only has sounds Instagram cleared for third-party
  publishing. It is smaller than what the Instagram app shows, so expect
  misses on some trending sounds.

When the sound is not in the catalog (record the rejection with `--error`
first), fall back to publishing by hand from the Metricool phone app:

1. `node tools/social.mjs release 2026-09-28 --auto-publish off` prepares the
   Instagram packet again with `info.autoPublish: false` and no
   `audioConfiguration`, then prints `manual audio needed: <sound>` after it.
   It takes one named folder (never `--all`), prepares and prints the
   Instagram packet only (other networks are never emitted by this command),
   and works with `--draft` and `--dry-run`. It exits 1 unless the folder has
   an active Instagram `REEL` that is not recorded yet. Send the packet with
   `createScheduledPost` as usual.
2. Record it with `--manual-audio`:
   `node tools/social.mjs release --record 2026-09-28 --network instagram --id <id> --uuid <uuid> --manual-audio`.
   That writes `manualAudio: true` on `metricool.instagram`. The flag must
   match the stored packet: `--manual-audio` on a packet with autoPublish on,
   or recording an autoPublish-off packet without it, is refused. A record
   without the flag removes any old `manualAudio`. The flag is only accepted
   on `release --record` with `--id` and `--uuid`.
3. At post time Metricool pushes the post to its phone app with the video,
   cover and caption loaded. The person there adds the sound natively in
   Instagram and publishes. If our music bed is baked into the video, mute the
   original audio in Instagram's audio mixer so the two do not play together.
4. Until it has published, `reconcile` prints
   `Manual audio still to publish in the Metricool app: 2026-10-04 (Espresso Sabrina Carpenter), ...`.
   Such a post is never reported as a failure; the folder waits until
   Metricool lists it `PUBLISHED`, then archives as usual. If Metricool marks
   that Instagram post with an error or failure status, reconcile adds
   `Metricool reports <status> on manual-audio <folder>; check the app` (the
   exit code is unchanged). Any other network's failure in the same folder is
   still reported as a failure.

The Post Desk payload carries the requested sound as `instagramSound` (the
term or id) so a client's social manager can confirm it, and a changed sound
resets the desk decision. The admin page (`D:\ka-site-admin`, post-desk.js)
does not show that field yet; until it does, name the sound in the brief's
"Questions for Alex" when it needs confirming.

## Metricool API

The account moved to the Advanced plan on 2026-10-01, which includes the
Metricool API (Starter did not). The token is under Account Settings > API in
Metricool. It is read from `METRICOOL_USER_TOKEN`, or on Windows from the user
scope variable of that name, exactly like the Cloudflare token, and it is never
written anywhere. Alex stores it himself; it never goes in chat or in a file.

`tools/config/metricool.json` holds the account `userId`, the API base, and the
brand id of each site slug (`ka-performance` is 7076479). No secret lives there.
A new client brand is one line in `brands`.

`node tools/social.mjs metricool brands` is the read-only check: it lists every
brand on the account with its id and connected networks, and says which ones the
config maps to a slug. `tools/lib/metricool.mjs` sends the token only in the
`X-Mc-Auth` header.

So far the API is wired for reading the brand list only. Scheduling, promotion
and `getScheduledPosts` still go through the MCP connector as described above,
until each endpoint has been checked against a live response.

## YouTube

Design: `docs/superpowers/specs/2026-09-28-youtube-pipeline-design.md` in the
main repo. A YouTube post is a normal day folder, in one of two shapes.

**A Short riding along with the weekday reel.** The reel's folder gains a
`youtube` platform: same video, same music (one use under the 30-day rule),
its own title and description. Shorts go up at **12:00 PM** on weekdays, after
the reel, through the per-network `time`.

**A long-form video.** Its own day folder with `youtube` as its only network.
Long-form goes up **Wednesdays at 11:00 AM** (the folder's `time`).

```json
"youtube": {
  "type": "SHORT",
  "caption": "youtube.md",
  "title": "Press Tab on your own website. Here's what to look for",
  "tags": ["website accessibility", "small business website", "Gainesville web design"],
  "category": "HOWTO_STYLE",
  "playlist": "Quick fixes for your website",
  "time": "12:00"
}
```

- `type`: `VIDEO` or `SHORT`. The payload lowercases it for Metricool.
- `caption`: `youtube.md`, the description, posted verbatim (5,000 characters
  max). Line 1 is the hook. Line 2 is the tagged link, a ka-performancefl.com
  url with `utm_source=youtube&utm_medium=social&utm_campaign=<folder>`. Then
  the body, chapters for long-form, and the AI line when `ai` says so. The
  template is in `plans/youtube-setup.md`.
- `title`: required, 100 characters max. `validate` prints a warning (it does
  not fail) above 70, because feeds cut titles there.
- `tags`: optional list of strings, 500 characters combined, no `#`.
- `category`: one of Metricool's 15 values; defaults to `HOWTO_STYLE`.
- `playlist`: one of the playlists in `tools/config/youtube.json`. Metricool
  cannot set it, so it only drives the Studio checklist.
- `madeForKids` is always false and `notifySubscribers` is left to YouTube's
  default (notify); neither goes in the folder. Privacy is public; use
  `release --draft` to check it in Metricool first.

Media rules, checked by `validate` with `ffprobe` once a folder is `ready` or
later:
- YouTube gets exactly one video and no images. In a reel folder that also
  holds slides or a second cut, scope the other files to their networks with
  `platforms` on the media entry.
- Short: vertical or square (height at least the width), 170 seconds or less
  (a margin under Metricool's 2:59). No thumbnail is sent for a Short yet: the
  channel does not have Shorts thumbnails, and Metricool rejects the whole
  request when one does not apply.
- Long-form: `media/video.mp4`, 1920x1080 (16:9), H.264 and AAC, over 60
  seconds, and 15 minutes or less until `tools/config/youtube.json` says
  `"verified": true`. `media/thumbnail.jpg`: 1920x1080, JPG or PNG, 16:9, at
  least 1280 wide, under 2 MB (2,000,000 bytes). The 4K master stays in
  `source/`. `media/video.srt` stays on disk for Studio.
- Custom thumbnails need a verified channel. Until `verified` is true, the
  thumbnail is not sent to Metricool, a missing one is only a warning, and the
  Studio checklist says to upload it by hand. Once verified, it is required and
  sent with the post.
- A phone video stored sideways is measured the way it plays (the probe reads
  the rotation).
- Every file bound for R2 in a YouTube folder is 280 MB or less, so `upload`
  stays under wrangler's 300 MiB and Metricool's 500 MB. Encode long-form to
  fit (1080p30, H.264 CRF 20 capped at 3.5 Mbps, AAC 192 kbps).

**After it publishes: the Studio checklist.** `release` prints what Metricool
cannot do, to finish by hand in YouTube Studio:
- add the video to the playlist named in `playlist`;
- upload `media/video.srt` as English captions (long-form only);
- upload `media/thumbnail.jpg` as the custom thumbnail (long-form, while the
  channel is not verified);
- add the end screen: subscribe plus the latest video.

Then mark it done: `node tools/social.mjs release --studio-done 2026-09-30`
(it finds the folder in `To Be Released/` or `Already Released/`). That writes
`metricool.youtube.studioDoneAt`, beside the YouTube record it belongs to.
Until then, `reconcile --from` lists the folder under "Studio checklist still
open" once the YouTube post time has passed. It assumes the Metricool post
published; check YouTube if unsure.

Staggered times: `validate` checks for a past time only on networks Metricool
does not have yet, each at its own time. Once the reel's networks are recorded,
`release` can still send a later Short after the reel's time has passed.

## For Codex

Read `brief.md` first and do not change it. To fill a planned day: read `post.json`, write `facebook.md` and
`instagram.md`, put finished files in `media/` with `"origin": "codex"` entries
in `media[]`, write alt text for every image, and set `ai` honestly. Then run
`validate` on the folder. Do not change `status`.

## Pillars

`client-spotlight`, `tip`, `training`, `ai-launch`, `behind-the-scenes`.

## Reviewing: the Post Desk

Alex approves from one page instead of opening folders:
https://claude.ai/artifact/BwgxjJ7mbkuRGvxyHPMRd3

- `node tools/review.mjs` rebuilds `review/data.json` from every folder in
  `To Be Released/` (captions, media, and the `## Questions for Alex` bullets in
  each `brief.md`) plus `stories/` and `review/asks.json`. Reels go up as 720p
  review copies in `review/proxies/`; what posts is still the file in `media/`.
- Claude republishes `review/index.html` with the map in `review/files.json`
  (plus `data.json`) as the artifact's `files`, same file path, same URL.
- Alex's taps land in the page's database: `decisions/<folder id>`
  (`decision`: approved, changes, waiting; `note`; `answers` by question index)
  and `answers/<ask id>`. Claude reads them with ArtifactData, then sets
  `"status": "approved"` and runs upload and release as usual. The page never
  changes anything by itself.
- Put anything Alex has to decide under `## Questions for Alex` in `brief.md`.
  Put anything the whole pipeline needs from him in `review/asks.json`.
- Facebook captions carry the full link on line 2, tagged
  `?utm_source=facebook&utm_medium=social&utm_campaign=<folder id>`. Instagram
  uses the bio link (plus the day's Story link sticker when Stories run; paused
  since 2026-09-26, see `stories/PAUSED.md`).
- A day normally has a reel at 10:30 AM (`YYYY-MM-DD`) and a carousel in the
  late afternoon (`YYYY-MM-DD-2`), plus a Story when Stories run (paused). Every frame and slide carries
  the K&A logo and ka-performancefl.com.

### Post Desk in the admin

The Post Desk is moving into the admin at admin.ka-performancefl.com (one
`ka-sites` database, keyed by site) while the artifact above keeps running
until that has had a real test run. Two commands mirror the queue there:

- `node tools/social.mjs desk pull [--site ka-performance]` reads Alex's
  decisions and Stories checklist ticks out of D1 (rows with `pulled_at IS
  NULL`), appends them to `review/desk-log.jsonl`, prints a summary, and marks
  them read. Applying a decision is still manual, as today.
- `node tools/social.mjs desk push [--site ka-performance] [--dry-run]`, in
  order: reads the site's current `desk_items`; uploads changed media;
  pulls (so a decision is never lost, and never while the import below is
  running); replaces the site's rows in D1 in one import; then deletes
  objects for items no longer in the queue (only once that import has
  actually succeeded). `--dry-run` prints the plan and touches nothing remote
  (it skips the `desk_items` read and the pull step too). Upload tracking
  (size and mtime per key, plus a content hash per item) lives in
  `review/desk-pushed.json`, written after every attempt (even a failed one)
  so completed uploads are never re-sent needlessly.
- The content hash covers only what Alex reviews on the desk (captions,
  title, questions, media role/alt/platforms and its `v` stamp for a post;
  date/time/condition/sticker text/URL and `v` for a Story; title/detail/
  placeholder for an ask), computed after each file's `v` is known, so a
  re-rendered file resets the approval even with the same caption. It
  deliberately excludes anything operational (status, scheduled, ai, music,
  weekday, pillar, builtAt): those never reset an approval. When it does
  change since the last push, the old decision is cleared back to Waiting,
  and `desk push` prints which item ids were reset. Each media URL also
  carries a `?v=<size>-<mtime>` stamp so the admin never shows a stale
  cached copy after a real edit.
- If Claude's local queue still has a folder whose last logged decision (from
  `review/desk-log.jsonl`) was `approved` (or, for an ask, `answered`), but
  the admin has already purged it from `desk_items` (it does that
  automatically once a decision is applied and 24 hours old), `desk push`
  will not resurrect it on the desk. It skips that item and prints a line
  like `2026-10-12: approved on the desk, apply it locally (status approved)
  before pushing again` instead. A Story-checklist row is never skipped this
  way.

Both commands use the same `CLOUDFLARE_API_TOKEN` as `upload`/`release`. See
`D:\ka-site-admin\docs\superpowers\specs\2026-09-26-post-desk-design.md` for
the schema and the admin side.

Do not delete `review/desk-pushed.json`: it is the only record of what has
already been uploaded to the private `ka-social-desk` bucket. If it is lost,
`desk push` re-uploads everything (harmless) but stops being able to clean up
objects for items that have already left the queue; those orphans then need
a manual `wrangler r2 object delete`. `review/desk-log.jsonl`, by contrast, is
the record of Alex's decisions and stays tracked in git.

## Carousels, video, music (2026-09-25)

- No narration on anything. Every post works muted: on-screen text plus a music bed.
- A carousel folder posts swipe slides to Instagram and a slide video to Facebook
  (Facebook shows multi-photo posts as a grid). `node tools/slideshow.mjs <folder> --music <mp3>`
  renders `media/slideshow.mp4` and its cover and marks each media entry with
  `"platforms": ["facebook"]` or `["instagram"]`; release sends each network only its own.
- Every video names its track in post.json (`"music": "<track id>"`). A track never
  repeats within 30 days; a full `validate` checks every folder plus `music-history.json`
  (posts from before the pipeline).

## Instagram link in bio (2026-09-25)

The Instagram bio points at the Metricool SmartLink `https://t.mtrbio.com/kaperformancefl`
(buttons: website, 90-Day AI Launch (/ai-launch/), training samples, Call Alex; every button link carries
`?utm_source=instagram&utm_medium=smartlink`). Its Media section starts empty because
Instagram had no posts; as posts publish, each gets a tile linking to its own page. If the
release packet's `smartLinkData` cannot attach a post, add the tile in Metricool > SmartLinks > Media.
