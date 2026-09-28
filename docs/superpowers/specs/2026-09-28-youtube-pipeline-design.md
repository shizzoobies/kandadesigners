# YouTube in the social pipeline: design

Written 2026-09-28. Status: **approved by Alex 2026-09-28.**
Approved: yes (Alex, 2026-09-28)

Adds YouTube as a fourth network to the folder pipeline in `Social Media Management/tools/`, so
Shorts and long-form videos go through the same flow as everything else: plan, brief, build,
Post Desk approval, `validate`, `upload`, `release`, Metricool. The channel decisions it serves
are in `Social Media Management/plans/youtube-channel.md` (approved 2026-09-28).

## Facts this design rests on (checked 2026-09-28)

| Fact | Source |
|---|---|
| Metricool `createScheduledPost` takes `providers: [{network: "youtube"}]`, the description in `text`, and `youtubeData: {title, type: "video"\|"short", privacy, tags[], category, madeForKids, isAiGeneratedContent, notifySubscribers}`. `title` and `madeForKids` are required, plus a video in `media` | The connector's own tool schema |
| Categories: HOWTO_STYLE, EDUCATION, SCIENCE_TECHNOLOGY and 12 others | Same |
| `videoThumbnailUrl` (jpg or png) applies to YouTube video and Short. A Short's cover only shows if the channel is verified and YouTube has enabled Shorts thumbnails on it. If it's sent where it doesn't apply, the whole request is rejected | Same |
| **The connector has no playlist field.** The Metricool web app does | Same, and Metricool Help |
| Title up to 100 characters, description up to 5,000. MP4 or MOV, **500 MB max**. Short: vertical or square, up to 3 minutes, but keep it under 2:59 or it may become a standard video. Video: horizontal, over 60 seconds. Unverified channels: 15 minutes max. 20 posts per 24 hours on paid plans | Metricool Help, "Schedule and publish on YouTube" and "Publishing requirements" |
| `wrangler r2 object put`, which `upload` uses, handles files **up to 300 MiB** | Cloudflare R2 docs |
| YouTube thumbnails: 16:9, 640 wide minimum, 3840x2160 recommended, JPG or PNG | YouTube Help |

## 1. The folder contract (README.md)

A YouTube post is a normal day folder. Two shapes:

**A Short that rides along with the weekday reel.** The reel's own folder gains a `youtube`
platform. Same video, same music (one use under the 30-day rule), its own title and
description. It goes up later than Instagram and Facebook (see the `time` override below).

**A long-form video.** Its own day folder, with YouTube as its only network (the other networks can
be added later if we ever cut a promo from it).

```json
"platforms": {
  "facebook":  { "type": "REEL", "caption": "facebook.md" },
  "instagram": { "type": "REEL", "caption": "instagram.md" },
  "youtube": {
    "type": "SHORT",
    "caption": "youtube.md",
    "title": "Press Tab on your own website. Here's what to look for",
    "tags": ["website accessibility", "small business website", "Gainesville web design"],
    "category": "HOWTO_STYLE",
    "playlist": "Quick fixes for your website",
    "time": "12:00"
  }
}
```

- `type`: `VIDEO` or `SHORT`, uppercase like the other networks. The payload lowercases it for
  Metricool.
- `caption`: `youtube.md`, the description, verbatim. Line 1 is the hook. Line 2 is the tagged
  link (`utm_source=youtube&utm_medium=social&utm_campaign=<folder>`). Then the body, the chapters
  for long-form, and the AI line when it applies. This follows the description template in
  `plans/youtube-setup.md`.
- `title`, `tags`, `category`: as Metricool takes them. `category` defaults to `HOWTO_STYLE`.
- `playlist`: one of the two channel playlists. Metricool's connector can't set it, so this field
  only drives a reminder (see Release).
- `time` (**new, optional, any network**): overrides the folder's `time` for that one network.
  This is how the Short goes up 1 to 2 hours after the reel. It applies only to YouTube in
  practice, but the code treats it generally.
- `madeForKids` is not in the folder. It is always `false`, fixed in code, because nothing K&A
  makes is for children.
- `notifySubscribers` is not in the folder. It's left out so YouTube's default (notify) applies.
- `privacy`: not in the folder. `public` unless `release --draft` is used, the same as today.

Media for long-form:
- `media/video.mp4`: 1920x1080, H.264, AAC. Encoded to stay **under 280 MB** (see Upload).
- `media/thumbnail.jpg`: **1920x1080**, under 2 MB. This is the file Metricool receives. The 4K
  master from the thumbnail system stays in `source/` for a manual swap in Studio if we want it.
  1920x1080 is sharp on every screen but TV, and it's safely inside what Metricool documents
  (1280x720).
- `media/video.srt`: the caption file, kept on disk. Metricool has no captions field, so the SRT is
  uploaded by hand in Studio (see Release).

## 2. `validate` (lib/validate.mjs)

- `NETWORKS` adds `youtube`. `TYPES.youtube = ["VIDEO", "SHORT"]`. `LIMITS.youtube = 5000`.
- Every YouTube post:
  - It has a `title` of 1 to 100 characters. A warning above 70, because titles get cut off in feeds.
  - The existing walk over `.json` files already catches em dashes in the title and tags.
  - `tags`: a list of strings, 500 characters combined (YouTube's limit), no `#`.
  - `category` is one of Metricool's 15 values.
  - It has a video, and `youtube.md` exists and isn't empty.
  - Line 2 of `youtube.md` holds a ka-performancefl.com link with `utm_source=youtube`.
  - The existing AI disclosure rule applies unchanged: if `ai.voice` or `ai.visuals` is true, the
    description needs a line like "The voice is AI narrated."
  - `platforms.<n>.time`, when present, is HH:MM and, once the post is approved, in the future.
- **Media probe (new).** When the status is `ready` or later, `ffprobe` reads the video meant for
  YouTube. It runs through an injected function, so tests never run ffprobe.
  - `SHORT`: aspect 9:16 or 1:1, duration 170 seconds or less (a margin under Metricool's 2:59).
  - `VIDEO`: aspect 16:9, duration over 60 seconds, and 15 minutes or less unless
    `config/youtube.json` says `"verified": true`.
  - Any file bound for R2: 280 MB or less, so it passes both wrangler's 300 MiB and Metricool's 500 MB.
- A `VIDEO` needs a `thumbnail`: JPG or PNG, 16:9, 1280 wide minimum, under 2 MB. A `SHORT`'s
  thumbnail is optional.
- The music rule is unchanged. A Short in the reel's folder shares the folder's `music`, so it
  counts as one use.

## 3. `payload` and `release` (lib/payload.mjs, lib/release.mjs)

- `buildPayloads` gains a `youtube` branch:

```js
info.text = <youtube.md>;
info.youtubeData = {
  title: cfg.title,
  type: cfg.type.toLowerCase(),          // "video" | "short"
  privacy: "public",
  tags: cfg.tags || [],
  category: cfg.category || "HOWTO_STYLE",
  madeForKids: false,
  isAiGeneratedContent: aiFlag
};
```

- `THUMB_TYPES.youtube = ["VIDEO"]` only. For Shorts we don't send a thumbnail, because the
  channel doesn't have Shorts thumbnails enabled yet. If Metricool rejects a request, it rejects
  the whole thing. We add `SHORT` once Alex sees the option in Studio.
- A per-network `time` feeds `publicationDate` and the top-level `date` for that network only.
- `release --record` and `--promote` need no change: they already work per network.
- **After-publish checklist (new, printed by `release`).** YouTube posts print a short list of what
  Metricool can't do, for Alex or Claude to finish in Studio:
  - Add the video to the playlist named in `playlist`.
  - Upload `media/video.srt` as English captions (long-form).
  - Add the end screen: subscribe plus the latest video.

  `reconcile` reminds us until the post is marked done with `release --studio-done <folder>`, which
  writes `youtube.studioDoneAt`.

## 4. Upload (lib/upload.mjs, lib/cloudflare.mjs)

- No code change, as long as every file stays under 280 MB, which `validate` enforces.
- Long-form encode target, set in the kap-reel YouTube composition: 1080p at 30 fps, H.264 CRF 20
  with a 3.5 Mbps cap, AAC at 192 kbps. That's about 275 MB at 10 minutes, and screen recordings
  usually come in well under. Chosen so no multipart upload is needed.
- If we ever need longer or higher-bitrate videos, the upgrade is multipart through R2's S3 API.
  That's out of scope for now and noted here so it isn't a surprise.

## 5. Post Desk (lib/review.mjs, lib/desk.mjs, admin `post-desk.js`)

Alex approves what YouTube will actually show:
- `review.mjs` adds `youtubeTitle`, `youtube` (the description), `youtubeType`, `youtubeTags`,
  `youtubePlaylist` and the YouTube `time` to each post. It adds `"youtube"` as a new `kind` for
  folders whose only network is YouTube, the same way LinkedIn-only folders already get
  `"linkedin"`.
- `desk.mjs` adds those fields to `POST_FIELDS`, so a change to any of them sends the post back for
  re-approval.
- The admin desk (`D:\ka-site-admin`, branch `admin/post-desk`) gets a **YouTube tab** beside the
  existing caption tabs:
  - A feed-size mock of what viewers see: the thumbnail at 360 px wide with the title under it,
    cut at 70 characters the way YouTube cuts it.
  - The description, with line 2's link visible.
  - Tags, playlist, type and time.
- Long-form review copies stay 720p (the existing proxy). About 60 to 90 MB for 10 minutes, well
  inside the desk's R2 path.
- The admin change is committed on `admin/post-desk` and deployed only on Alex's go-ahead.

## 6. Commands and docs

- `social.mjs` usage lines name `youtube` alongside the other networks.
- `README.md`: a YouTube section (both folder shapes, the fields, the media rules, the Studio
  after-publish list).
- `SESSION-HANDOFF.md`: one line pointing here.
- `config/youtube.json`: `{ "verified": false, "playlists": ["Quick fixes for your website",
  "Practical AI for small business"] }`. `validate` checks `playlist` against this list.

## 7. Tests (vitest, `node node_modules/vitest/vitest.mjs run` from `tools/`)

The 233 existing tests stay green. New tests, written before the code:
- `validate.test.mjs`:
  - Title length and a missing title
  - A bad category, tags over 500 characters, and a `#` in a tag
  - The link on line 2, and the AI line
  - `time` override format
  - Short and video aspect and duration through an injected probe
  - File size cap, and a missing thumbnail on `VIDEO`
  - The `verified` switch
- `payload.test.mjs`:
  - The youtubeData shape, with lowercased types and `madeForKids: false`
  - AI flag passthrough
  - Thumbnail on VIDEO and not on SHORT
  - The per-network time moving only that network's dates
- `release.test.mjs`: the after-publish checklist is printed, and `--studio-done` writes its stamp.
- `review.test.mjs` and `desk.test.mjs`: the new fields, the `youtube` kind, and a title change
  marking the post changed.
- `cli.test.mjs`: the usage text.

## 8. Out of scope

- Playlists, captions and end screens through an API: Metricool's connector can't, and a direct
  YouTube Data API integration isn't worth it at one long video a week.
- Client YouTube channels: the tools stay single-brand for YouTube until a client asks.
- Stories are paused and have no YouTube equivalent anyway.
- Community posts.

## Build order after approval

1. Tests and code in `tools/` (a subagent works from this spec; Claude reviews).
2. README and handoff updates.
3. The admin desk YouTube tab (a separate commit on `admin/post-desk`, deployed on Alex's go-ahead).
4. A dry run: one Short from an already-approved reel folder through `validate`, `release --draft`
   and a Metricool **draft**, checked in Metricool, then deleted or promoted on Alex's say.

## Open questions for Alex

1. Short time: 12:00 PM on weekdays (the reels post at 10:30)? Or a different time?
2. Long-form day and time, for example Wednesdays at 11:00 AM?
3. OK that playlists, captions and end screens are a short Studio checklist after each publish,
   rather than automated?

## Answers (Alex, 2026-09-28)
1. Shorts go up at **12:00 PM** on weekdays (`platforms.youtube.time: "12:00"`).
2. Long-form goes up **Wednesdays at 11:00 AM**.
3. Playlists, captions and end screens stay a Studio checklist after each publish.
