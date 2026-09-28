# YouTube channel handoff: K & A Performance

Written 2026-09-28 for a new chat that will set up the K & A Performance YouTube channel with
Alex and bring it into the social pipeline. Work through it with Alex, one decision at a time.
Nothing here is decided unless it says "decided".

## Read first, in this order

1. This file.
2. `SESSION-HANDOFF.md` (this folder): how the social pipeline, the admin Post Desk and
   Metricool work today, plus the standing rules.
3. `README.md` (this folder): the post folder contract (`post.json`, `brief.md`, per-network
   caption files, `media/`, `source/`) and every command.
4. `SOCIAL_HANDOFF.md` (this folder): the business, the voice, the portfolio.
5. For any site change (a YouTube link in the footer or the schema): work in a worktree off
   `origin/main`, never in the main checkout. See "Branch hazard" below.

## The goal

Set up a full, on-brand YouTube channel for K & A Performance, then make YouTube a network in
the pipeline, so videos and Shorts go through the same flow as everything else: plan, brief,
build, Post Desk approval, then Metricool.

## How to work with Alex (his standing preferences)

- **Plan before you produce.** Agree on a plan he approves, then write briefs, then build.
  Don't generate art, video or copy before the plan is approved.
- **Ask one question at a time.** Where it helps, show real options (mockups, samples)
  rather than describing them.
- **Clean and purposeful design.** Don't pile on effects. If a direction isn't landing,
  rebuild it fresh instead of patching it.
- **Be honest about quality**, and verify platform facts in current docs before stating
  them. YouTube's specs change; the numbers below are starting points to re-check.
- **Nothing goes live without his approval.** Deploys, migrations and switching drafts to
  live need his explicit go-ahead in chat, naming the action. Claude can't run `git push`:
  give Alex the command.

## Brand (hard rules)

- **Palette ("Earthen Sophisticate"):** rust #9A3412 (text and links; hot #7C2D12), amber
  #D97706 (buttons and highlights only, espresso text on it, never small amber text on a
  light background), teal #134E4A for dark bands (#5EEAD4 accent on dark), canvas #F8F5F2.
  **No purple, no cobalt**, ever.
- **Type:** display is Schibsted Grotesk 700; body is Atkinson Hyperlegible Next; small-caps
  labels use Lenia Mono. The logo lockup alone uses Fraunces. When type feels weak, Alex asks
  for "darker, thicker, larger".
- **Logo:** the live mark is the site's `logo-lockup.webp`. **Never use** the retired gold
  "K&A Designs" crest (`approved-logo-transparent.png`). **Don't touch** `Logo Remake/`: it's
  the artist's work in progress until Alex says it's final.
- **Copy:** no em dashes anywhere (titles, descriptions, captions, on-screen text; use pipes,
  periods, commas or colons); US English (color, center, gray); plain-spoken, practical and
  warm, with no agency buzzwords.
- **No pill or chip UI** in graphics: use small-caps interpunct lines instead.
- **Imagery:** real, high-resolution captures only (Playwright at deviceScaleFactor 2). Alex
  spots soft or compressed images immediately.
- **The assistant is named Kai** everywhere, if an AI helper ever appears on screen.

## Content rules that carry over (decided for the other networks)

- **Every frame drives traffic:** the K&A logo and ka-performancefl.com appear on every frame
  and slide, the hook comes first, and there is a CTA. Client footage always sits inside a K&A
  frame.
- **Truth:** only real sites and real numbers, each saved in the post's `source/` folder.
  Client posts only for a launch, a new feature or a real result. No promised results or ROI.
- **Music:** a new ElevenLabs track for every video; no track repeats within 30 days
  (`music-history.json`; `validate` enforces it). Alex said to use the best ElevenLabs options
  and not economize on credits.
- **AI disclosure:** flag AI-generated visuals or voice. For YouTube, that's
  `isAiGeneratedContent` in Metricool's `youtubeData`, which maps to YouTube's
  altered-or-synthetic-content setting.
- **Where each link goes:** AI content goes to https://ka-performancefl.com/ai-launch/ (the
  paid 90-Day AI Launch; never call it "free lessons"). Training content goes to /training/.
  Links carry UTM tags; for YouTube that would be
  `utm_source=youtube&utm_medium=social&utm_campaign=<folder>`.
- **Compliance (permanent, from the AI Launch):**
  - Never suggest K&A provides Claude accounts, seats or licenses.
  - No Claude or Anthropic logos, and no "Claude" in product or page names.
  - No client names or testimonials without written permission.
  - Training content: no pricing, no former employers' work, no names without a signed election.

## Decisions to make with Alex (suggested order)

1. **The channel itself.**
   - Does one already exist? The site links none today, and Metricool has no YouTube connected.
   - Which Google account owns it? Suggested: a Brand Account under the Workspace account
     alex@ka-performancefl.com, with Kristina as a manager.
   - Handle: `@kaperformancefl` to match Instagram, if it's free.
2. **Positioning:** who the channel is for (local business owners, instructional designers,
   or both) and what it promises in one line. The pipeline's audiences so far are Gainesville
   small businesses (web, SEO, accessibility), AI-curious owners (the AI Launch), and
   instructional designers (LinkedIn training videos).
3. **Content pillars and formats:**
   - Shorts: our 9:16 reels can repost almost as they are; Shorts can run up to 3 minutes,
     so verify.
   - Long-form: tutorials, site builds and teardowns, accessibility walkthroughs,
     instructional design explainers, launch case studies.
   - A cadence Alex can sustain.
4. **Narration and faces.** Social runs muted-first with no narration, but long-form YouTube
   usually needs a voice or a person on camera. Options: Alex or Kristina on camera or doing
   voiceover, an ElevenLabs voice (Alex rejected the Sarah v3 reads as sounding like AI), or
   text-led with music. This is his call; don't assume the no-narration rule transfers.
5. **Naming AI tools.** The social rule is "no AI vendor or product names", but tutorials
   (for example the existing "Claude Code First Session" explainer) name the tool. Decide
   whether YouTube keeps the rule, allows plain-text mentions (the compliance note allows
   those; logos and product naming are the line), or splits by audience.
6. **Channel art** (build as options for Alex to pick; re-check the specs):
   - Banner 2560x1440 with the safe area of about 1546x423 in the center.
   - Profile picture 800x800, shown as a circle.
   - Video watermark about 150x150.
   - Thumbnail template 1280x720, one consistent system in brand type and colors.
   - Intro and end-screen frames (end screens take the last 5 to 20 seconds).
7. **Channel setup:**
   - About text with the service area; links (site, AI Launch, phone 904-210-1071);
     business email.
   - Playlists that match the pillars; home page sections; a channel trailer.
   - Default upload settings: not made for kids, category, tags, description template with
     the UTM link on line 1 or 2.
   - Phone verification so custom thumbnails work. Metricool's `videoThumbnailUrl` needs a
     verified channel.
8. **Connections, once the channel exists:**
   - Connect YouTube to Metricool brand 7076479 (Alex does this in Metricool). Confirm the
     Starter plan includes YouTube.
   - Add the channel to the site footer and to JSON-LD `sameAs`: a site change in a
     worktree, deployed only on Alex's go-ahead.
   - Add it to the Instagram SmartLink and the Google Business Profile.

## Adding YouTube to the pipeline (after the channel decisions)

Metricool already supports it. The `createScheduledPost` `info` takes `providers: [{"network":
"youtube"}]` and
`youtubeData: {title, type: "video"|"short", privacy: "public"|"unlisted"|"private", tags[],
category (e.g. EDUCATION, SCIENCE_TECHNOLOGY, HOWTO_STYLE), madeForKids, isAiGeneratedContent,
notifySubscribers}`. `madeForKids` and `title` are required; a video in `media` is required.
Custom thumbnails go in `videoThumbnailUrl` (JPG or PNG) or `videoCoverMilliseconds`.

Changes to plan in `tools/` (Node, tests with `node node_modules/vitest/vitest.mjs run` from
`tools/`; 233 pass today; never use npx, because the ampersand in the path breaks it):

- `post.json`: add a `youtube` network with title, type (video or short), tags, category and
  playlist, plus a `youtube.md` caption file for the description.
- `validate`:
  - Title length, and no em dashes in the title, description or tags.
  - Aspect ratio and duration by type (16:9 for video, 9:16 for Short).
  - A thumbnail is present for long-form.
  - The music rule still applies.
- `payload` / `release`: build the `youtubeData` packet; `--record` works unchanged.
- `review.mjs` and the admin Post Desk: show the title, thumbnail and description so Alex
  approves what will actually appear. The desk lives in `D:\ka-site-admin` (branch
  `admin/post-desk`; spec `docs/superpowers/specs/2026-09-26-post-desk-design.md`).
- Media: long-form files are large. Check the R2 upload path (`tools/lib/upload.mjs`, bucket
  `ka-social`, https://media.ka-performancefl.com) and Metricool's size limits before
  committing to a design.
- Plan the tool changes as a written spec and plan first (Alex approves), then build with
  tests.

## What we already have to draw from

- **Video builds:** Remotion project at `D:\kap-reel` (a junction to `Reels/kap-reel`), with
  one entry per social post under `src/social/<id>/`, plus the `tutorial/`, `launch/` and
  `reels/` compositions. It can render 16:9 as well as 9:16 and 4:5. Rebuild notes are in
  memory and in the kap-reel docs.
- **Existing videos** (reuse needs Alex's ok; check each against the compliance rules):
  - Showcase reels (the 15s and 45s client-site reels).
  - Tutorial reels in `Reels/instructional reels/` (contrast, hero).
  - Weekly social reels in `To Be Released/` and `Already Released/`.
  - The two LinkedIn instructional-design videos (ADDIE, Action Mapping).
  - `Explainer Videos/`: lesson kits and an MP4, "Claude Code 5-Phase Workflow". These name
    the tool; see decision 5.
- **Voice and music:** ElevenLabs (Alex's account; the hosted MCP is at
  https://api.elevenlabs.io/v1/mcp). Music scripts follow
  `D:\kap-reel\scripts\social\music-week-0928.ts`.
- **Assets:** site images under the site repo's `public/images/`, the logo lockup, and client
  captures at 2880x1800.

## Things to know before touching anything

- **Branch hazard:** the main checkout `D:\K & A Performance Site` sits on
  `codex/training-premium-rfi`, a Codex branch. The whole social pipeline, including this
  folder, is committed there, unpushed. Commit new YouTube work in this folder the same way,
  staging files by name (never `git add -A`). Don't switch branches in this checkout. Moving
  the social commits to their own branch is a pending job; ask Alex before doing it.
- **The David's BBQ files** under `clients/davids-bbq/` belong to another chat: leave them alone.
- **Stories are paused** (`stories/PAUSED.md`). Don't plan Stories for YouTube.
- **The scheduled tasks disappeared** after the 2026-09-28 restart (`social-weekly-check`,
  `thrillers-domain-check`). Their prompts are still in
  `C:\Users\Mr Anderson_local\.claude\scheduled-tasks\`. The main social chat is handling them.

## Suggested first session

1. Confirm whether a channel exists, and settle ownership and the handle (decision 1).
2. Talk through positioning, pillars and the narration question (decisions 2 to 5), then
   write `plans/youtube-channel.md` for Alex to approve.
3. After approval: build channel art options (banner, avatar, thumbnail system) as real files
   for him to pick from.
4. Then the setup checklist, the connections, and the pipeline spec.
