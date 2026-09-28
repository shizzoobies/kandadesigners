# YouTube content, Sep 28 to Oct 16: build spec for the pipeline chat

Written 2026-09-28 by the YouTube setup chat, at Alex's request, for the pipeline chat to run
from here. Status: **approved by Alex 2026-09-28.**
Approved: yes (Alex, 2026-09-28)

The pipeline chat owns everything in this spec from here on: briefs, subagents, builds, the Post
Desk, Metricool. Standing rules (SESSION-HANDOFF.md, README.md) still apply: plan before
produce, nothing goes live without Alex's approval on the Post Desk, Claude can't `git push`,
subagents can't switch drafts to live.

## Read first
1. This file.
2. `plans/youtube-channel.md`: the channel plan (approved): audience, pillars, voice, AI naming rule.
3. `docs/superpowers/specs/2026-09-28-youtube-pipeline-design.md` (repo root): the approved tools
   design, which covers the `youtube` network, validate, payload, release and the Studio checklist.
4. `plans/youtube-setup.md`: the description template and upload defaults.
5. The outlines in this folder: `video-1-tab-key.md`, `video-2-ai-email-replies.md`,
   `video-3-google-profile.md`.

## What gets made

| # | What | Folder | Publishes | Source |
|---|---|---|---|---|
| S1 | Short: Ellenton top three | `2026-09-28-5` | **Mon 9/28, 6:00 PM** (noon has passed by the time it's approved) | reel `2026-09-28` |
| S2 | Short: Contrast is not a vibe | `2026-09-29-5` | Tue 9/29, 12:00 PM | reel `2026-09-29` |
| S3 | Short: One screen, one decision | `2026-09-30-5` | Wed 9/30, 12:00 PM | reel `2026-09-30` |
| S4 | Short: Give the AI the brief | `2026-10-01-5` | Thu 10/1, 12:00 PM | reel `2026-10-01` |
| S5 | Short: Thrillers launch | `2026-10-02-5` | Fri 10/2, 12:00 PM, **only on a Thrillers "go"** | reel `2026-10-02` |
| **L1** | **Long: Test your website with one key** | `2026-10-02-4` | **Fri 10/2, 11:00 AM** | `video-1-tab-key.md` |
| S6 to S10 | Shorts: the five reels of Oct 5 to 9 | `2026-10-0X-5` | Mon to Fri, 12:00 PM | reels `2026-10-05` to `2026-10-09` |
| **L2** | **Long: Answer customer emails faster with AI** | `2026-10-07-4` | **Wed 10/7, 11:00 AM** | `video-2-ai-email-replies.md` |
| S11 to S15 | Shorts: the week of Oct 12 reels | in each reel folder | Mon to Fri, 12:00 PM | the week-of-Oct-12 plan (not planned yet) |
| **L3** | **Long: Fix your Google Business Profile in 15 minutes** | `2026-10-14-4` | **Wed 10/14, 11:00 AM** | `video-3-google-profile.md` |

Use the next free `-N` if a suffix is taken. Check `To Be Released/` first.

## Blockers (in order)

1. **DONE 2026-09-28:** YouTube is connected to Metricool brand 7076479, confirmed with
   `getBrandSettings` (`youtubeData: UCoZ_dAeTe5YO-JEDBdYSKsQ`).
2. **DONE 2026-09-28: the channel is phone-verified** (with Kristina's cell).
   `tools/config/youtube.json` now says `"verified": true`, so long videos send their custom
   thumbnail through Metricool. The notes below are kept for the record.
   - Alex's number has hit YouTube's cap of two channels a year, so he's using **Kristina's cell**
     (decided 2026-09-28).
   - Long-form custom thumbnails need verification, **both through Metricool and in Studio**.
   - Once Alex says it's verified, set `"verified": true` in `tools/config/youtube.json`.
   - If it isn't done by Thu 10/1: L1 publishes without a custom thumbnail. Alex picks the best of
     YouTube's three automatic frames in Studio, then uploads `media/thumbnail.jpg` once the
     channel is verified.
3. **Tools support for YouTube: BUILT 2026-09-28**, committed (aa71505): 270 tests pass,
   and the live queue validates. An independent review found no critical or high issues.
   Its fixes are in (270 tests pass, verified 2026-09-28): an unverified channel sends no
   thumbnail and adds "upload the thumbnail" to the Studio checklist; staggered network times
   no longer block a resend; YouTube gets exactly one video (scope other files with `platforms`);
   any vertical Short passes; the thumbnail cap is 2,000,000 bytes. **All clear to use.** The README has the YouTube section, and `config/youtube.json`
   lists the playlists.
   - Committed as aa71505 on `codex/training-premium-rfi` (2026-09-28), together with the design spec. Not pushed.
   - `plan` has no YouTube options: add the `youtube` block to `post.json` by hand, as the README shows.
   - Design spec step 4 (a dry run through a Metricool **draft**) hasn't happened. Do it with S1 first.
4. **DONE 2026-09-28: Post Desk YouTube tab is live** (commit 14095ae, admin version 3bc6166c). Alex approves YouTube posts on the desk like any other post: it shows the feed card, the full title with its count, the description, tags, playlist and time.

## Shorts (S1 to S15)

**Why a companion folder.** The reels from 9/28 to 10/9 are already `scheduled`, and `release`
only works on `approved` folders. So each Short gets its own companion folder with YouTube as its
only network:

- `post.json`:
  - `platforms.youtube = {type: "SHORT", caption: "youtube.md", title, tags, category:
    "HOWTO_STYLE", time: "12:00"}`
  - the same `music` value as the reel. Same day means one use under the 30-day rule.
  - `ai` copied from the reel.
- `media/reel-vertical.mp4` and `.srt`: copied from the reel folder. No re-render.
- `brief.md`: one short paragraph naming the source reel. It's a repost, so the brief can be
  approved together with its Short.
- `youtube.md`:
  - line 1: the reel's hook
  - line 2: the reel's link with `utm_source=youtube&utm_medium=social&utm_campaign=<folder>`
  - two or three plain sentences
  - the AI line if the reel has one
  - the footer from the template
- **Title:**
  - 70 characters or fewer
  - the idea, not a slogan
  - no AI vendor names, no em dashes
  - no `#shorts` needed: YouTube detects vertical under 3 minutes

**From Oct 12 on:** add `youtube` straight into each reel's own folder when the week is planned,
per the design spec. No companion folder needed.

**Per-Short notes from the reel check (2026-09-28):**
- **S1, Ellenton:** a real client result tied to a date. Put "Search recorded September 2026.
  Rankings change." in the description. No new claims.
- **S2, Contrast:** keep "Every site K&A builds passes these checks." **Alex confirmed it's true
  on 2026-09-28.** Close that question in the reel's brief too.
- **S3, One screen:** a training pillar. Link to /training/.
- **S4, Give the AI the brief:** links to /ai-launch/. The end frame says "We build this habit
  into every AI setup for our clients." That's fine.
- **S5, Thrillers:** only after the Thu 10/1 7 PM domain check and Alex's go. If it's a no-go, skip
  it. L1 still runs that day.
- **S7, Oct 6:** the drawn bakery shows "5-star Google reviews". Fictional, fine.
- **S10, Oct 9:** ends on the pilot offer ("3 free months for 3 Gainesville businesses"). If a
  spot has filled by then, update the description, or skip this Short.
- None of the reels contain em dashes or AI vendor names (the 2026-09-28 check). "Google's AI
  Overview" in S1 is a Google search feature, allowed.

## Long-form (L1 to L3)

Every long video follows the same build:

1. **Brief** (`brief.md` in the folder), made from the outline in this folder. Alex marks it `Approved: yes`.
2. **Demo pages and captures:**
   - Playwright at deviceScaleFactor 2, following the outline's capture list
   - K&A's own site for good examples
   - plain, unbranded local pages for bad examples
   - never a real third-party site as a bad example
3. **Voice:**
   - ElevenLabs **Amy** (`OZxMHsGaBmV5pjMIDIn0`), `eleven_multilingual_v2`, stability 0.5,
     similarity 0.75, style 0, speaker boost on, speed 1, output mp3_44100_192
   - One file per beat, so edits don't regenerate the whole read. Follow the pattern in
     `D:\kap-reel\scripts\voice.ts`.
   - Script text spells "K and A".
   - Test Amy on "K and A", "Ninety-Day", "WCAG" (for L1, say "W-C-A-G" or "wick-ag"; ask Alex)
     and "pickup" before the full read.
4. **Music:**
   - a new calm ElevenLabs bed for each video, no vocals, ducked well under the voice
   - -14 LUFS integrated, -1 dBTP or lower
   - log it in `music-history.json`
   - no repeats within 30 days
5. **Remotion:**
   - a new `youtube/` composition set in `D:\kap-reel`, 1920x1080 at 30 fps
   - L1 builds the shared pieces once:
     - the K&A frame, with the logo and ka-performancefl.com in a corner on every frame
     - lower thirds and step or chapter cards (small-caps interpunct lines, no pills)
     - the recap card
     - the 20-second end screen (subscribe, plus a video slot)
   - L2 and L3 reuse them.
   - Run everything with `node node_modules/...` directly, never npx.
6. **Encode:**
   - H.264, CRF 20, 3.5 Mbps cap, AAC 192k
   - 280 MB or less (design spec section 4)
7. **Thumbnail:**
   - Thumbnail system B (capture first), from `Reels/youtube/channel-art/src/thumb.html`
     (`render.cjs`).
   - `media/thumbnail.jpg` at 1920x1080, under 2 MB.
   - The 4K master goes in `source/`.
   - L1 and L2 already have approved designs (`thumb-b-topic1.jpg`, `thumb-b-topic2.jpg`).
   - L3 needs one in the same system: rust band, "QUICK FIX · KA-PERFORMANCEFL.COM".
8. **SRT** from the final script, re-timed to the voice. It stays on disk for the Studio upload.
9. **`youtube.md`** from the outline's draft description.
   - Line 2 carries the tagged link.
   - Re-time the chapters to the final cut: first at 0:00, at least 3, each at least 10 seconds.
   - End with "The voice is AI narrated." plus "The music is AI generated."
10. **`post.json`:**
    - `platforms.youtube = {type: "VIDEO", caption, title, tags, category: "HOWTO_STYLE", playlist, time: "11:00"}`
    - `ai.voice: true`
    - `music`
11. **Post Desk, then validate, upload and release.** Alex approves on the desk.
12. **Studio checklist after publish:** playlist, SRT, end screen. Then `release --studio-done`.

### L1: Test your website with one key (Fri 10/2, 11:00 AM)
- Outline: `video-1-tab-key.md`. About 5 to 5.5 minutes at Amy's measured pace. Six checks, then
  "what to ask your web person".
- Link: /services/accessibility/. Playlist: "Quick fixes for your website".
- Thumbnail: the approved `thumb-b-topic1.jpg` ("Press Tab. What happens?"), the K&A focus-ring capture.
- **Three-day schedule:**

| Day | Work |
|---|---|
| Mon 9/28 | Brief to Alex |
| Tue 9/29 | Demo page, captures, voice, music |
| Wed 9/30 | Shared Remotion composition, then the L1 cut |
| Thu 10/1 | Render, Post Desk approval by noon, schedule |

- Biggest risk: the new composition set. If Wednesday slips, fall back to a simpler cut: captures,
  lower thirds and the end screen, with no animated cards.
- End screen: subscribe plus the latest Short (no long video before it).

### L2: Answer customer emails faster with AI (Wed 10/7, 11:00 AM)
- Outline: `video-2-ai-email-replies.md`. About 7.5 minutes. Voice notes, a reusable prompt, check the
  draft, save the best replies, privacy, when to answer it yourself.
- Link: /ai-launch/ (the paid 90-Day AI Launch). Playlist: "Practical AI for small business".
- **The AI draft on screen must come from a real run.** Save it verbatim in `source/ai-run.md`,
  with no vendor named. Pick narration version A or B of step 3 to match what the run actually says.
- No tool named anywhere. The chat window is labeled "Assistant" (see Decisions).
- It complements, rather than repeats, the Oct 8 reel "AI drafts, you decide".
- End screen: L1.

### L3: Fix your Google Business Profile in 15 minutes (Wed 10/14, 11:00 AM)
- Outline: `video-3-google-profile.md`.
- Link: /services/seo-ai-search/. Playlist: "Quick fixes for your website".
- K&A's own profile is the only real profile shown. The edit panels are unbranded mock-ups, unless
  Alex records his own screen.
- It complements, rather than repeats, the Oct 5 reel and carousel on the same subject: it shows
  where each setting lives, and adds the description, attributes, booking links and a tagged website link.
- About 7.5 minutes, 9 fixes. Q&A is left out (Google's status is unclear); the script covers chat's retirement (July 2024).
- Recapture our profile signed out around Oct 10 to 12, so the figures are current.
- Thumbnail: "Fix it in 15 minutes" on the rust Quick fix band, over a sharp crop of our listing.
- End screen: L2.

## Suggested subagents (the pipeline chat decides)

| Id | Job | Starts |
|---|---|---|
| A0 | **DONE 2026-09-28:** Post Desk YouTube tab, commit 14095ae on `admin/post-desk`, deployed (admin version 3bc6166c) | done |
| A1 | Shorts S1 to S4 companion folders, then `review.mjs` and desk push | now (S1 is due today) |
| A2 | L1: demo page and Playwright captures | after L1 brief approval |
| A3 | L1: voice by beat and music bed | after L1 brief approval |
| A4 | Shared Remotion `youtube/` composition set, then the L1 cut and encode | after A2 and A3 |
| A5 | Shorts S6 to S10 companion folders | Thu 10/1 |
| A6 | L2 build (same pattern as A2 to A4) | after L2 brief approval, by Fri 10/2 |
| A7 | L3 build | after L3 brief approval, by Fri 10/9 |

The main pipeline session sends every live Metricool packet itself, because subagents get blocked
on live scheduling. Subagents may create drafts.

## Decided by Alex (2026-09-28)
1. **L2's chat window is labeled "Assistant"**, not Kai. Kai stays K&A's own site assistant only.
2. **S1 goes up today at 6:00 PM.**
3. **L1's hook keeps "Book Now"** as the everyday example.
4. **Amy says WCAG letter by letter: "W-C-A-G".** Write it that way in the voice script.
5. **S2's line "Every site K&A builds passes these checks" is true.** Keep it.
6. **Branding is fixed, color isn't (Alex, 2026-09-28).** Every video must read clearly as
   K&A: the logo lockup and ka-performancefl.com in the corner, the K&A frame, our type, the
   end screen. But the brand palette doesn't have to set every color in a video. Each video
   (and its cards and lower thirds) may take a palette that suits its topic, the way the
   training samples each have their own look. The shared Remotion set should keep the brand
   marks fixed and make the working colors a per-video theme. Standing rules still apply: no
   purple, and every text color passes contrast.

## Still open for Alex (the pipeline chat asks, one at a time, before each brief)
**L3, Google profile** (from the outline):
1. Does our profile's website button carry UTM tags? It should, before 10/14, so we pass our own check.
2. Add Veterans Day and Thanksgiving special hours to our profile. This was already asked on the Oct 5 briefs.
3. Are our profile's services, description and booking link filled in?
4. Can the video show our real "LGBTQ+ friendly" attribute, or should it be a mock-up?
5. Q&A: say nothing, or add one neutral line saying Google is changing it?
6. Should we teach `utm_source=google&utm_medium=organic&utm_campaign=business-profile` as the example?

**L1, Tab key:** the Safari settings still. Can Alex take a real Mac screenshot, or should it be a
redrawn mock-up?

## Timeline at a glance

| Day | Out | Work that day |
|---|---|---|
| Mon 9/28 | S1 | L1 brief, A0 and A1 start |
| Tue 9/29 | S2 | L1 captures, voice, music |
| Wed 9/30 | S3 | L1 composition and cut |
| Thu 10/1 | S4 | L1 approve and schedule; S6 to S10 folders; Thrillers check 7 PM |
| Fri 10/2 | L1, S5 if go | L2 brief |
| Mon 10/5 | S6 | L2 build |
| Tue 10/6 | S7 | L2 build |
| Wed 10/7 | L2, S8 | |
| Thu 10/8 | S9 | L3 brief; plan the week of Oct 12 with youtube in each reel folder |
| Fri 10/9 | S10 | |
| Mon 10/12 to Fri 10/16 | S11 to S15 | L3 build |
| Wed 10/14 | L3 | |
