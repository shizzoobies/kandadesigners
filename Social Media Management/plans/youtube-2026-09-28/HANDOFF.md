# Handoff to the pipeline chat: YouTube

Written 2026-09-28, late morning, by the YouTube setup chat. From here on the pipeline chat owns
YouTube content the same way it owns Facebook, Instagram and LinkedIn.

## Start here
1. Read **`SPEC.md`** (this folder). It's the approved plan for Sep 28 to Oct 16: 15 Shorts, three
   long videos, the build steps, a timeline, and Alex's decisions.
2. The three outlines in this folder hold the full script, capture list, facts and description for
   each long video.
3. `README.md` (the YouTube section) for the folder contract and commands.
4. The design behind the tools: `docs/superpowers/specs/2026-09-28-youtube-pipeline-design.md` (repo root).

## What's done (nothing to redo)

| Item | State |
|---|---|
| Channel | "K & A Performance", @KAPerformancefl, channel id `UCoZ_dAeTe5YO-JEDBdYSKsQ`, a Brand Account Alex owns |
| Branding | Banner, profile picture and watermark uploaded. Files are in `Reels/youtube/channel-art/final/`, and the sources and `render.cjs` in `channel-art/src/` |
| About | Description, six links and the contact email are live (text in `plans/youtube-setup.md`) |
| Verification | Phone-verified with Kristina's cell (Alex's number is at YouTube's cap). Custom thumbnails work. `tools/config/youtube.json` has `"verified": true` |
| Metricool | YouTube connected to brand 7076479 (`getBrandSettings` shows `youtubeData`) |
| Tools | `youtube` network in validate, payload, release, reconcile and review. 270 tests pass. Commit `aa71505`, pushed |
| Post Desk | YouTube tab live: feed card, title count, description, tags, playlist, time. Admin commit `14095ae`, version `3bc6166c`, pushed |
| Plans | Commit `5b1b56b`, pushed |

## Do first (today, Mon 9/28)
1. **S1: the Ellenton Short, 6:00 PM today.**
   - Create the companion folder `To Be Released/2026-09-28-5` as SPEC.md describes:
     - YouTube only, type `SHORT`, `time: "18:00"`
     - the reel video and `.srt` copied from `2026-09-28`
     - the same `music` value as the reel
     - a `brief.md`, and a `youtube.md` with the tagged link on line 2
   - Add "Search recorded September 2026. Rankings change." to the description.
   - `review.mjs` and `desk push`, then Alex approves on the desk.
   - **This is the first YouTube release, so it doubles as the dry run** (design spec, build step 4):
     1. `release --draft` and send it as a Metricool **draft**.
     2. Check in Metricool that it shows as a YouTube Short draft with the right title,
        description and time, and that a draft does not publish.
     3. Then `release --promote` for the 6:00 PM slot (the main session sends it, not a subagent).
     4. Record the ids with `release --record` or `--promoted`.
   - If anything in the packet is rejected, record it with `release --record ... --error` and tell
     the YouTube setup chat's notes (this file) what happened.
2. **The L1 brief** (the Tab-key video, Fri 10/2, 11:00 AM, folder `2026-10-02-4`), from
   `video-1-tab-key.md`, to Alex today. The three-day build schedule is in SPEC.md.
3. **S2 to S4 companion folders** (Tue to Thu, 12:00 PM) can be built now, through the desk the same way.

## Reference

| What | Value |
|---|---|
| Metricool blogId | `7076479`, timezone America/New_York |
| Narrator | ElevenLabs **Amy** `OZxMHsGaBmV5pjMIDIn0`, `eleven_multilingual_v2`, stability 0.5, similarity 0.75, style 0, speaker boost on, speed 1, mp3_44100_192. Audition takes in `Reels/youtube/voice-audition/` |
| Playlists | "Quick fixes for your website", "Practical AI for small business" (named in `tools/config/youtube.json`) |
| Category | `HOWTO_STYLE` (the default) |
| Shorts | Weekdays at 12:00 PM (S1 only at 6:00 PM) |
| Long-form | Wednesdays at 11:00 AM (L1 is Friday 10/2) |
| Thumbnails | System B, capture first: `Reels/youtube/channel-art/src/thumb.html`. `media/thumbnail.jpg` at 1920x1080, under 2,000,000 bytes, with the 4K master in `source/`. L1 and L2 designs are approved (`thumb-b-topic1.jpg`, `thumb-b-topic2.jpg`) |
| Limits `validate` enforces | Title 100 characters max, a warning above 70. Tags 500 characters, no `#`. Line 2 of `youtube.md` holds a ka-performancefl.com link with `utm_source=youtube`. Short: vertical, 170 s or less. Video: 16:9, over 60 s. Exactly one video per YouTube post. 280 MiB file cap |

Commands (from `Social Media Management/`; run tools with node directly, never npx):
```
node tools/social.mjs validate
node tools/review.mjs
node tools/social.mjs desk push
node tools/social.mjs desk pull
node tools/social.mjs upload <folder>
node tools/social.mjs release <folder> [--draft]
node tools/social.mjs release --record <folder> --network youtube --id <id> --uuid "<uuid>"
node tools/social.mjs release --promote <folder>
node tools/social.mjs release --studio-done <folder>
node tools/social.mjs reconcile
```
After each YouTube publish, `release` prints the Studio checklist: add it to the playlist, upload
the SRT (long-form), add the end screen. Mark it done with `--studio-done`.

## Alex's decisions (2026-09-28), so nobody asks again
- The audience is business owners. Instructional design stays on LinkedIn.
- AI tools may be named in narration and on-screen text when needed. Never in titles, thumbnails,
  tags or playlist names. No vendor logos. Never suggest K&A provides accounts or seats.
- **L2's generic chat window is labeled "Assistant", not Kai.** Kai stays K&A's own site assistant.
- Amy says **"W-C-A-G"** letter by letter. L1's hook keeps "Book Now".
- S2's line "Every site K&A builds passes these checks" is **true**. Keep it.
- Long-form descriptions end with "The voice is AI narrated." (plus "The music is AI generated."),
  and `ai.voice: true` sets YouTube's altered-content flag.

## Watch out for
- **Companion folders:** reels from 9/28 to 10/9 are already `scheduled`, so their Shorts live in
  `<date>-5` folders. From Oct 12 on, add `youtube` straight into each reel's folder when the week
  is planned.
- **S5 (Thrillers, Fri 10/2)** only goes out after the Thu 10/1 7 PM domain check and Alex's go.
- **Playlists don't exist in Studio yet.** Create both (Customization > Layout, or Content >
  Playlists) before L1 publishes Friday, so the Studio checklist can add it.
- **The upload defaults in Studio** (private by default, Howto & Style, the description template)
  were walked through with Alex but never confirmed. Ask him once.
- **Subagents can't switch drafts to live or send live packets.** The main session does that.
- **Git:** stage files by name, never `git add -A`. Leave `clients/davids-bbq/` alone, since that
  belongs to another chat. `admin/archive/youtube-tab-preview/` in `D:\ka-site-admin` is untracked
  on purpose.
- **Real runs only.** L2's AI draft on screen comes from a real run, saved verbatim in `source/ai-run.md`.

## Still open
- **For Alex, before the L3 brief:** the six Google profile questions in SPEC.md (UTM on our
  profile's website link, holiday hours, services and description, the LGBTQ+ attribute, Q&A,
  the UTM example).
- **For Alex, before the L1 build:** the Safari settings still. A real Mac screenshot, or a
  redrawn mock-up?
- **Backlog from the channel plan** (not in this two-week spec):
  - YouTube link in the site footer and in JSON-LD `sameAs` (a worktree off origin/main, deployed
    on Alex's go-ahead)
  - a YouTube button on the Instagram SmartLink
  - a YouTube link on the Google Business Profile
  - a channel trailer once L1 and L2 exist
  - home page sections once there are videos
